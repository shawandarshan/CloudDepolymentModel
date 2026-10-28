import {
  CostCalculationOutput, CostBreakdownItem, MonthProjection,
  SimulationResultOutput, ComponentNodeState, EventStep,
  ScalabilityOutput, RecommendationOutput, WeightCriteria,
  UserConfig, ArchitectureLayout
} from '../types';

export const DEFAULT_USER_CONFIG: UserConfig = {
  company_name: "StreamPulse Media Networks",
  currency: "INR",
  currency_symbol: "₹",
  exchange_rate_to_inr: 83.5,
  rto_target_minutes: 15.0,
  rpo_target_minutes: 15.0,
  backup_frequency_hours: 4.0,
  replication_lag_seconds: 15.0,
  failover_policy: "Automatic Cloud Multi-AZ"
};

const EXCHANGE_RATES: Record<string, number> = {
  INR: 83.5,
  USD: 1.0,
  EUR: 0.92,
  GBP: 0.79
};

const SYMBOLS: Record<string, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£"
};

// --- Cost Engine in Browser ---
export function calculateLocalCosts(params: {
  model: string;
  currency: string;
  compute_instances: number;
  instance_vcpu?: number;
  storage_tb: number;
  monthly_storage_growth_pct: number;
  monthly_data_transfer_tb: number;
  active_users: number;
  peak_traffic_multiplier?: number;
  db_instances: number;
  backup_storage_tb: number;
  support_fixed_monthly?: number;
  onprem_baseline_monthly?: number;
  private_capex_hardware?: number;
  amortization_months?: number;
}): CostCalculationOutput {
  const currency = params.currency.toUpperCase();
  const rate = EXCHANGE_RATES[currency] || 83.5;
  const symbol = SYMBOLS[currency] || "₹";
  const model = params.model.toLowerCase();

  const hours = 730;
  const storage_gb = params.storage_tb * 1024;
  const backup_gb = params.backup_storage_tb * 1024;
  const egress_gb = params.monthly_data_transfer_tb * 1024;

  let compute_usd = 0;
  let storage_usd = 0;
  let egress_usd = 0;
  let db_usd = 0;
  let backup_usd = 0;
  let support_usd = 0;

  if (model === 'public') {
    compute_usd = params.compute_instances * hours * 0.096;
    storage_usd = storage_gb * 0.023;
    egress_usd = egress_gb * 0.08;
    db_usd = params.db_instances * hours * 0.28;
    backup_usd = backup_gb * 0.015;
    const sub = compute_usd + storage_usd + egress_usd + db_usd + backup_usd;
    support_usd = Math.max(params.support_fixed_monthly || 600, sub * 0.05);
  } else if (model === 'private') {
    const capex = params.private_capex_hardware || 180000;
    const amort = params.amortization_months || 36;
    compute_usd = (capex / amort) + (params.compute_instances * 55.0);
    storage_usd = params.storage_tb * 115.0;
    egress_usd = 2800.0; // fixed leased line
    db_usd = params.db_instances * 1400.0;
    backup_usd = 1800.0;
    support_usd = 4200.0;
  } else {
    // hybrid
    const capex = (params.private_capex_hardware || 180000) * 0.5;
    const amort = params.amortization_months || 36;
    compute_usd = (capex / amort) + (params.compute_instances * 0.6 * 40.0) + (params.compute_instances * 0.4 * hours * 0.096 * 1.1);
    storage_usd = (storage_gb * 0.3 * 0.025) + (storage_gb * 0.7 * 0.0125);
    egress_usd = (egress_gb * 0.042) + 1200.0;
    db_usd = (params.db_instances * 750.0) + (hours * 0.28);
    backup_usd = (backup_gb * 0.014) + 650.0;
    support_usd = 1950.0;
  }

  compute_usd = Math.round(compute_usd * 100) / 100;
  storage_usd = Math.round(storage_usd * 100) / 100;
  egress_usd = Math.round(egress_usd * 100) / 100;
  db_usd = Math.round(db_usd * 100) / 100;
  backup_usd = Math.round(backup_usd * 100) / 100;
  support_usd = Math.round(support_usd * 100) / 100;

  const total_usd = Math.round((compute_usd + storage_usd + egress_usd + db_usd + backup_usd + support_usd) * 100) / 100;
  const total_display = Math.round(total_usd * rate * 100) / 100;
  const annual_display = Math.round(total_display * 12 * 100) / 100;
  const per_1k_users = Math.round(((total_display / Math.max(1, params.active_users)) * 1000) * 100) / 100;
  const per_tb = Math.round((total_display / Math.max(0.1, params.storage_tb)) * 100) / 100;

  const baseline_display = Math.round((params.onprem_baseline_monthly || 19500) * (currency === 'INR' ? rate : 1.0) * 100) / 100;
  const savings_monthly = Math.round((baseline_display - total_display) * 100) / 100;
  const savings_annual = Math.round(savings_monthly * 12 * 100) / 100;

  let break_even: number | null = null;
  if (savings_monthly > 0 && model === 'hybrid') {
    break_even = Math.round(((35000 * rate) / savings_monthly) * 10) / 10;
  }

  const breakdown: CostBreakdownItem[] = [
    { category: "Compute Infrastructure", amount_usd: compute_usd, amount_display: Math.round(compute_usd * rate), percentage: Math.round((compute_usd / total_usd) * 1000) / 10, description: "vCPU, RAM, virtualization overhead" },
    { category: "Storage Subsystem", amount_usd: storage_usd, amount_display: Math.round(storage_usd * rate), percentage: Math.round((storage_usd / total_usd) * 1000) / 10, description: "Hot NVMe + Cold S3 media tiers" },
    { category: "Network & Data Transfer", amount_usd: egress_usd, amount_display: Math.round(egress_usd * rate), percentage: Math.round((egress_usd / total_usd) * 1000) / 10, description: "Edge CDN egress & interconnect transit" },
    { category: "Database Engine", amount_usd: db_usd, amount_display: Math.round(db_usd * rate), percentage: Math.round((db_usd / total_usd) * 1000) / 10, description: "Instances, read replicas, licensing" },
    { category: "Disaster Recovery & Backup", amount_usd: backup_usd, amount_display: Math.round(backup_usd * rate), percentage: Math.round((backup_usd / total_usd) * 1000) / 10, description: "Cold snapshots & pilot-light standby" },
    { category: "Support & Operations", amount_usd: support_usd, amount_display: Math.round(support_usd * rate), percentage: Math.round((support_usd / total_usd) * 1000) / 10, description: "Engineers on-call & cloud support plan" },
  ];

  // 12 month projection
  const projections: MonthProjection[] = [];
  let curStorage = params.storage_tb;
  const growth = 1.0 + ((params.monthly_storage_growth_pct || 8.0) / 100.0);

  for (let m = 1; m <= 12; m++) {
    const pub = Math.round((calculateLocalCosts({ ...params, model: 'public', storage_tb: curStorage }).monthly_cost_display));
    const prv = Math.round((calculateLocalCosts({ ...params, model: 'private', storage_tb: curStorage }).monthly_cost_display));
    const hyb = Math.round((calculateLocalCosts({ ...params, model: 'hybrid', storage_tb: curStorage }).monthly_cost_display));

    projections.push({
      month: m,
      storage_tb: Math.round(curStorage * 10) / 10,
      public_cost: pub,
      private_cost: prv,
      hybrid_cost: hyb,
      onprem_baseline: baseline_display
    });
    curStorage *= growth;
  }

  const all_models: Record<string, number> = {
    public: Math.round(calculateLocalCosts({ ...params, model: 'public' }).monthly_cost_display),
    private: Math.round(calculateLocalCosts({ ...params, model: 'private' }).monthly_cost_display),
    hybrid: Math.round(calculateLocalCosts({ ...params, model: 'hybrid' }).monthly_cost_display)
  };

  return {
    model,
    currency,
    currency_symbol: symbol,
    monthly_cost_usd: total_usd,
    monthly_cost_display: total_display,
    annual_cost_display: annual_display,
    cost_per_1k_users_display: per_1k_users,
    cost_per_tb_display: per_tb,
    monthly_savings_vs_baseline_display: savings_monthly,
    annual_savings_vs_baseline_display: savings_annual,
    break_even_months: break_even,
    breakdown,
    twelve_month_projection: projections,
    all_models_comparison: all_models,
    is_simulation_estimate: true
  };
}

// --- Disaster Recovery Simulation in Browser ---
export function runLocalDRSimulation(params: {
  scenario_type: string;
  deployment_model: string;
  recovery_config: string;
  active_users: number;
  rto_target_minutes: number;
  rpo_target_minutes: number;
  backup_frequency_hours: number;
  replication_lag_seconds: number;
}): SimulationResultOutput {
  const model = params.deployment_model.toLowerCase();
  const scenario = params.scenario_type.toLowerCase();
  const recovery_cfg = params.recovery_config.toLowerCase();
  const users = params.active_users || 25000;
  const rto_target = params.rto_target_minutes || 15.0;
  const rpo_target = params.rpo_target_minutes || 15.0;
  const rep_lag = params.replication_lag_seconds || 15.0;
  const backup_freq = params.backup_frequency_hours || 4.0;

  const incident_code = `INC-${Math.floor(1000 + Math.random() * 9000)}`;
  let actual_rto = 3.5;
  let actual_rpo = 0.25;
  let affected_users = 0;
  let avail_drop = 0;
  let data_loss = "0 MB";
  let title = "Primary Database Cluster Catastrophic Outage";
  let explanation = "";
  let guidance = "";
  let steps: EventStep[] = [];

  if (scenario === 'database_failure') {
    title = "Primary Database Cluster Catastrophic Outage";
    if (recovery_cfg === 'standby_failover') {
      if (model === 'hybrid') {
        actual_rto = 3.5;
        actual_rpo = Math.round((rep_lag / 60.0) * 100) / 100;
        affected_users = Math.round(users * 0.15);
        avail_drop = 3.2;
        data_loss = `${Math.round(rep_lag * 1.8)} KB (inflight transactions)`;
        explanation = "Hybrid cloud standby database in AWS promoted to active primary via automated DNS flip.";
        guidance = "Standby replica provided rapid failover (<4 mins), meeting strict RTO/RPO targets.";
        steps = [
          { timestamp_offset_seconds: 0, severity: 'err', message: "[00:00] Critical: Heartbeat loss detected on Primary On-Prem Database (Error 500)." },
          { timestamp_offset_seconds: 15, severity: 'warn', message: "[00:15] Quorum controller declares primary host dead after 3 failed probes." },
          { timestamp_offset_seconds: 45, severity: 'info', message: "[00:45] Hybrid Cloud Orchestrator triggers automated failover to AWS Multi-AZ Standby DB." },
          { timestamp_offset_seconds: 90, severity: 'info', message: "[01:30] Cloud standby replica promoted to READ/WRITE primary node. Replaying WAL logs..." },
          { timestamp_offset_seconds: 150, severity: 'info', message: "[02:30] Internal API Gateway routing updated to cloud DB endpoint. Connection pool restored." },
          { timestamp_offset_seconds: 210, severity: 'ok', message: `[03:30] Service restored. Total downtime: 3.5 min. Data loss: ${data_loss}.` }
        ];
      } else if (model === 'public') {
        actual_rto = 2.0;
        actual_rpo = Math.round((rep_lag / 60.0) * 100) / 100;
        affected_users = Math.round(users * 0.10);
        avail_drop = 2.0;
        data_loss = `${Math.round(rep_lag * 1.2)} KB`;
        explanation = "AWS RDS Multi-AZ synchronous standby automatically promoted with CNAME repointing.";
        guidance = "Public cloud multi-AZ automated recovery provided sub-2 minute restoration.";
        steps = [
          { timestamp_offset_seconds: 0, severity: 'err', message: "[00:00] RDS Primary instance hardware failure in us-east-1a." },
          { timestamp_offset_seconds: 20, severity: 'warn', message: "[00:20] Cloud monitoring detects unhealthy instance health check." },
          { timestamp_offset_seconds: 40, severity: 'info', message: "[00:40] Automated RDS failover triggered to standby in us-east-1b." },
          { timestamp_offset_seconds: 120, severity: 'ok', message: "[02:00] All application nodes reconnected. Incident resolved." }
        ];
      } else {
        actual_rto = 25.0;
        actual_rpo = 1.5;
        affected_users = Math.round(users * 0.70);
        avail_drop = 28.0;
        data_loss = "4.2 MB";
        explanation = "On-premises secondary database required VIP reassignment and engineer verification.";
        guidance = "Private cloud failover requires on-call engineer manual validation, delaying recovery.";
        steps = [
          { timestamp_offset_seconds: 0, severity: 'err', message: "[00:00] SAN storage controller failure halted primary DB write transactions." },
          { timestamp_offset_seconds: 300, severity: 'info', message: "[05:00] On-call DBA acknowledged alert. Commencing manual verification." },
          { timestamp_offset_seconds: 1500, severity: 'ok', message: "[25:00] Secondary DB promoted. Video streaming operational." }
        ];
      }
    } else if (recovery_cfg === 'backup_restore') {
      actual_rto = model !== 'private' ? 55.0 : 180.0;
      actual_rpo = backup_freq * 60.0;
      affected_users = Math.round(users * 0.95);
      avail_drop = 60.0;
      data_loss = `~${backup_freq} hours of user viewing logs & watch history`;
      explanation = `No active standby available. Restored database instance from cold backup snapshot taken ${backup_freq}h ago.`;
      guidance = "Restoring from backups incurs significant RTO (45-180 min) and data loss equal to backup frequency.";
      steps = [
        { timestamp_offset_seconds: 0, severity: 'err', message: "[00:00] Primary database disk corruption corrupted catalog tables." },
        { timestamp_offset_seconds: 60, severity: 'err', message: "[01:00] No active standby replica detected. Initiating backup restore." },
        { timestamp_offset_seconds: 1200, severity: 'info', message: `[20:00] Fetching snapshot taken ${backup_freq} hours ago from S3 vault...` },
        { timestamp_offset_seconds: 3300, severity: 'ok', message: `[55:00] Backup restore complete. Service operational. Data loss: ${data_loss}.` }
      ];
    } else {
      // no_standby (The case study problem!)
      actual_rto = 2880.0; // 48 hours
      actual_rpo = 1440.0; // 24 hours
      affected_users = users;
      avail_drop = 99.8;
      data_loss = "24+ hours of streaming metadata, user signups, and transaction logs";
      explanation = "CASE STUDY PROBLEM: On-premises database crashed with no live standby and corrupted local backup tapes. Required days of manual recovery.";
      guidance = "Running without automated cloud replication or tested off-site backups results in multi-day business downtime and catastrophic SLA breach.";
      steps = [
        { timestamp_offset_seconds: 0, severity: 'err', message: "[00:00] Catastrophic SAN RAID controller failure corrupts primary DB volume." },
        { timestamp_offset_seconds: 120, severity: 'err', message: "[00:02] Application server pool experiences 100% database query timeout errors." },
        { timestamp_offset_seconds: 600, severity: 'err', message: "[00:10] Standby replica: NONE CONFIGURED. Streaming service completely offline." },
        { timestamp_offset_seconds: 3600, severity: 'warn', message: "[01:00] On-premises team attempts tape backup restore; tape drive read errors encountered." },
        { timestamp_offset_seconds: 86400, severity: 'warn', message: "[24:00] Day 1: Replacement hardware shipped and delivered to on-premises datacenter." },
        { timestamp_offset_seconds: 172800, severity: 'ok', message: "[48:00] Day 2: Database rebuilt from stale offsite tape. Severe data loss detected." }
      ];
    }
  } else if (scenario === 'storage_failure') {
    title = "Media Video Storage Volume Degradation";
    actual_rto = model === 'hybrid' ? 4.0 : (model === 'public' ? 2.0 : 120.0);
    actual_rpo = 5.0;
    affected_users = Math.round(users * 0.40);
    avail_drop = 15.0;
    data_loss = "0 MB (Read-only object replicas preserved)";
    explanation = "Primary video storage mount degraded. Video playback requests rerouted to redundant cloud object storage.";
    guidance = "Cloud object storage with multi-AZ replication prevents streaming interruption compared to single on-premises SAN arrays.";
    steps = [
      { timestamp_offset_seconds: 0, severity: 'warn', message: "[00:00] Storage I/O throughput throttled below SLA threshold." },
      { timestamp_offset_seconds: 30, severity: 'info', message: "[00:30] Edge CDN origin failover triggered to secondary S3 bucket." },
      { timestamp_offset_seconds: 120, severity: 'ok', message: "[02:00] Video chunk playback normal across all regions." }
    ];
  } else if (scenario === 'network_outage') {
    title = "Core Transit ISP & Gateway Outage";
    actual_rto = model !== 'private' ? 3.0 : 90.0;
    actual_rpo = 0.0;
    affected_users = Math.round(users * 0.60);
    avail_drop = 35.0;
    data_loss = "0 MB";
    explanation = "Primary fiber link cut. Anycast DNS and BGP route failover diverted traffic to backup cloud CDN points of presence.";
    guidance = "Cloud multi-region edge points of presence provide automatic BGP rerouting during ISP transit fiber cuts.";
    steps = [
      { timestamp_offset_seconds: 0, severity: 'err', message: "[00:00] BGP session dropped on primary datacenter upstream link." },
      { timestamp_offset_seconds: 45, severity: 'info', message: "[00:45] Cloudflare/CloudFront Anycast automatically reroutes client DNS requests." },
      { timestamp_offset_seconds: 180, severity: 'ok', message: "[03:00] Network transit restored via secondary peering point." }
    ];
  } else {
    // traffic_spike
    title = "10x Viral Streaming Traffic Surge";
    actual_rto = model === 'public' ? 1.5 : (model === 'hybrid' ? 2.5 : 60.0);
    actual_rpo = 0.0;
    affected_users = model === 'private' ? Math.round(users * 0.65) : Math.round(users * 0.05);
    avail_drop = model === 'private' ? 45.0 : 1.5;
    data_loss = "0 MB";
    explanation = model === 'private'
      ? "Hardware ceiling reached. Datacenter ran out of CPU/memory capacity. 503 errors served."
      : "Elastic capacity expansion provisioned additional application workers in seconds.";
    guidance = "Elasticity allows on-demand provisioning to absorb peak events without investing in permanent idle hardware.";
    steps = [
      { timestamp_offset_seconds: 0, severity: 'warn', message: "[00:00] Influx of concurrent streaming sessions detected (+300% in 2 minutes)." },
      { timestamp_offset_seconds: 30, severity: 'info', message: "[00:30] Auto-scaling alarm triggered: CPU utilization exceeded 80%." },
      { timestamp_offset_seconds: 150, severity: 'ok', message: "[02:30] Request latency returned to normal (p95 < 120ms)." }
    ];
  }

  const rto_breached = actual_rto > rto_target;
  const rpo_breached = actual_rpo > rpo_target;

  const is_db = scenario === 'database_failure';
  const is_storage = scenario === 'storage_failure';
  const is_net = scenario === 'network_outage';
  const is_spike = scenario === 'traffic_spike';

  const nodes: ComponentNodeState[] = [
    { id: "cdn", name: "Global Edge CDN", category: "network", domain: "edge", status: is_net ? "Degraded" : "Healthy", latency_ms: is_net ? 120.0 : 18.0, capacity_pct: is_spike ? 88.0 : 42.0, role: "Global Edge Traffic Distribution" },
    { id: "app_servers", name: "Streaming App Cluster", category: "compute", domain: model === 'private' ? 'private' : (model === 'hybrid' ? 'hybrid' : 'public'), status: (is_db && recovery_cfg === 'no_standby') ? "Failed" : (is_db ? "Degraded" : "Healthy"), latency_ms: is_db ? 850.0 : 35.0, capacity_pct: is_spike ? 98.0 : 55.0, role: "Video Transcoding & Session Management" },
    { id: "primary_db", name: "Primary Database (On-Prem / Multi-AZ)", category: "database", domain: model !== 'public' ? 'private' : 'public', status: is_db ? "Failed" : "Healthy", latency_ms: is_db ? 9999.0 : 4.0, capacity_pct: 65.0, role: "Subscriber Catalog & Rights Management" },
    { id: "secondary_db", name: "Standby DB Replica (Cloud DR)", category: "database", domain: model === 'hybrid' ? 'public' : model, status: (is_db && recovery_cfg === 'standby_failover') ? "Recovering" : (recovery_cfg !== 'no_standby' ? "Standby" : "Failed"), latency_ms: 12.0, capacity_pct: 30.0, role: "Hot Standby Asynchronous Replica" },
    { id: "media_storage", name: "Media Storage (S3 / SAN)", category: "storage", domain: model !== 'private' ? 'public' : 'private', status: is_storage ? "Degraded" : "Healthy", latency_ms: is_storage ? 450.0 : 25.0, capacity_pct: 68.0, role: "Raw & Transcoded Video Bitstreams" },
    { id: "backup_repo", name: "Cloud Snapshot Backup Vault", category: "backup", domain: model !== 'private' ? 'public' : 'private', status: "Healthy", latency_ms: 50.0, capacity_pct: 45.0, role: `Cold Snapshots (Frequency: ${backup_freq}h)` },
    { id: "cloud_dr_burst", name: "Cloud DR Pilot Light Environment", category: "compute", domain: "public", status: model !== 'private' ? "Healthy" : "Standby", latency_ms: 22.0, capacity_pct: 15.0, role: "Automated Recovery VPC & Elastic Transcoders" }
  ];

  return {
    incident_code,
    title,
    scenario_type: scenario,
    deployment_model: model,
    recovery_config: recovery_cfg,
    severity: is_db ? "Critical" : "High",
    simulated_rto_minutes: Math.round(actual_rto * 100) / 100,
    simulated_rpo_minutes: Math.round(actual_rpo * 100) / 100,
    rto_target_minutes: rto_target,
    rpo_target_minutes: rpo_target,
    rto_breached,
    rpo_breached,
    affected_users,
    availability_drop_pct: avail_drop,
    data_loss_estimate: data_loss,
    recovery_steps: steps,
    nodes_state: nodes,
    explanation,
    recovery_guidance: guidance,
    is_simulation_estimate: true
  };
}

// --- Scalability Simulation in Browser ---
export function runLocalScalability(params: {
  deployment_model: string;
  concurrent_viewers: number;
  requests_per_second: number;
  burst_multiplier: number;
  base_compute_capacity_units?: number;
  max_scalable_units?: number;
  db_connections_limit?: number;
}): ScalabilityOutput {
  const model = params.deployment_model.toLowerCase();
  const viewers = params.concurrent_viewers || 35000;
  const rps = params.requests_per_second || 12000;
  const burst = params.burst_multiplier || 2.5;
  const base_units = params.base_compute_capacity_units || 10;
  const max_units = params.max_scalable_units || 30;
  const db_limit = params.db_connections_limit || 1500;

  const effective_viewers = Math.round(viewers * burst);
  const effective_rps = Math.round(rps * burst);
  const workload_score = Math.min(100.0, Math.round(((effective_viewers / 100000.0) * 50 + (effective_rps / 50000.0) * 50) * 10) / 10);
  const needed_units = Math.max(1, Math.round(Math.max(effective_viewers / 2500, effective_rps / 1200)));

  let instances = base_units;
  let shortfall = 0;
  let util = 50;
  let action = "";
  let perf = "Optimal";
  let elasticity = "High";
  let cost_change = 0;
  let exp = "";

  if (model === 'public') {
    instances = Math.min(max_units, Math.max(base_units, needed_units));
    shortfall = Math.max(0, Math.round(((needed_units - instances) / Math.max(1, needed_units)) * 1000) / 10);
    util = Math.min(100, Math.round((needed_units / Math.max(1, instances)) * 750) / 10);
    action = `Auto-scaled from ${base_units} to ${instances} cloud instances (CloudWatch metric trigger).`;
    perf = shortfall === 0 ? "Optimal" : "Degraded (Hit Max Scale Limit)";
    elasticity = "Excellent (Native Elasticity)";
    cost_change = (instances - base_units) * 65.0;
    exp = "Public Cloud Elasticity dynamically added compute instances to accommodate the traffic surge. Resource pooling allowed immediate allocation without procuring physical servers.";
  } else if (model === 'private') {
    instances = base_units;
    shortfall = Math.max(0, Math.round(((needed_units - base_units) / Math.max(1, needed_units)) * 1000) / 10);
    util = Math.min(100, Math.round((needed_units / Math.max(1, base_units)) * 850) / 10);
    action = `Scaling BLOCKED. Fixed datacenter capacity ceiling: ${base_units} physical servers.`;
    perf = shortfall < 10 ? "Optimal" : (shortfall < 40 ? "Degraded" : "Throttled (503 Service Unavailable)");
    elasticity = "None (Fixed Hardware Limits)";
    cost_change = 0.0;
    exp = `Private Cloud lacks elasticity. Workload exceeded the physical server capacity ceiling. Resulted in ${shortfall}% capacity shortfall and high response latencies.`;
  } else {
    // hybrid
    const overflow = Math.max(0, needed_units - base_units);
    const burst_inst = Math.min(max_units - base_units, overflow);
    instances = base_units + burst_inst;
    shortfall = Math.max(0, Math.round(((needed_units - instances) / Math.max(1, needed_units)) * 1000) / 10);
    util = Math.min(100, Math.round((needed_units / Math.max(1, instances)) * 780) / 10);
    action = `Private base: ${base_units} nodes (100% utilized) + Hybrid Cloud Burst: ${burst_inst} on-demand nodes provisioned.`;
    perf = shortfall === 0 ? "Optimal" : "Degraded";
    elasticity = "High (Hybrid Cloud Bursting)";
    cost_change = burst_inst * 60.0;
    exp = "Hybrid Cloud demonstrated Cloud Bursting: Steady-state baseline workload ran on owned hardware, while sudden peak streaming demand was seamlessly absorbed by public cloud compute instances.";
  }

  const db_conn = Math.min(db_limit * 2, Math.round(effective_viewers * 0.04));
  const db_load = Math.min(100, Math.round((db_conn / Math.max(1, db_limit)) * 1000) / 10);
  const storage_util = Math.min(98.0, Math.round((45.0 + (burst * 4.5)) * 10) / 10);

  return {
    deployment_model: model,
    workload_score,
    effective_concurrent_viewers: effective_viewers,
    effective_rps: effective_rps,
    compute_utilization_pct: util,
    storage_utilization_pct: storage_util,
    db_connections_used: db_conn,
    db_load_pct: db_load,
    capacity_shortfall_pct: shortfall,
    instances_provisioned: instances,
    scaling_action_taken: action,
    performance_status: perf,
    estimated_cost_change_usd: Math.round(cost_change * 100) / 100,
    elasticity_rating: elasticity,
    explanation: exp
  };
}

// --- Multi-Criteria Recommendation in Browser ---
export function calculateLocalRecommendation(weights: WeightCriteria): RecommendationOutput {
  const ratings: Record<string, Record<string, number>> = {
    public: { cost: 84.0, availability: 94.0, recovery: 92.0, scalability: 98.0, security: 78.0, control: 62.0, simplicity: 85.0 },
    private: { cost: 42.0, availability: 72.0, recovery: 45.0, scalability: 38.0, security: 96.0, control: 98.0, simplicity: 40.0 },
    hybrid: { cost: 86.0, availability: 96.0, recovery: 95.0, scalability: 90.0, security: 92.0, control: 88.0, simplicity: 74.0 }
  };

  const raw_w = {
    cost: Math.max(0, weights.cost),
    availability: Math.max(0, weights.availability),
    recovery: Math.max(0, weights.recovery),
    scalability: Math.max(0, weights.scalability),
    security: Math.max(0, weights.security),
    control: Math.max(0, weights.control),
    simplicity: Math.max(0, weights.simplicity)
  };
  const sum_w = Object.values(raw_w).reduce((a, b) => a + b, 0) || 1.0;
  const norm_w: Record<string, number> = {};
  for (const [k, v] of Object.entries(raw_w)) {
    norm_w[k] = v / sum_w;
  }

  const scores = Object.keys(ratings).map(m => {
    let tot = 0;
    const subs: Record<string, number> = {};
    for (const [crit, val] of Object.entries(ratings[m])) {
      const s = val * norm_w[crit];
      subs[crit] = Math.round(s * 100) / 100;
      tot += s;
    }
    const name = m === 'public' ? "Public Cloud (AWS / Azure / GCP)" : (m === 'private' ? "Private Cloud (Dedicated On-Premises)" : "Hybrid Cloud (Private Core + Cloud DR & Burst)");
    return {
      model: m,
      name,
      total_score: Math.round(tot * 100) / 100,
      rank: 1,
      subscores: subs
    };
  });

  scores.sort((a, b) => b.total_score - a.total_score);
  scores.forEach((s, idx) => { s.rank = idx + 1; });

  const winner = scores[0].model;
  const winnerName = scores[0].name;

  let summary = "";
  let reasons: string[] = [];
  let tradeoffs: string[] = [];
  let remaining_risks: string[] = [];
  let dr_guidance = "";
  let migration_phases: Array<{ phase: string; detail: string }> = [];

  if (winner === 'hybrid') {
    summary = `Based on the weighted decision matrix, Hybrid Cloud emerges as the optimal architecture with a composite score of ${scores[0].total_score}/100. It directly resolves the streaming company's catastrophic database outage by introducing an automated Cloud Standby Replica while arresting rising storage expenditures through tiered S3 cloud media lifecycle rules.`;
    reasons = [
      "Disaster Recovery Excellence: Scored 95/100 in recovery due to cross-cloud pilot-light standby database, achieving <4 minute RTO vs 48+ hours on-premises.",
      "Cost Optimization: Combining existing amortized on-premises base capacity with elastic cloud burst eliminates over-provisioning waste.",
      "Security & Compliance: Subscriber billing profiles and licensing DRM stay on private infrastructure, while high-volume video bitstreams are distributed via public cloud CDNs.",
      "Elastic Scalability: Cloud burst auto-scales during unpredictable viral streaming events without purchasing unneeded physical server racks."
    ];
    tradeoffs = [
      "Network Interconnect Dependency: Requires high-reliability Direct Connect / Cloud Interconnect links with redundancy.",
      "Dual-Domain Operational Tooling: Infrastructure team must manage both on-premises hypervisors and cloud Terraform / IAM policies."
    ];
    remaining_risks = [
      "Data replication latency over WAN if direct fiber links experience packet loss.",
      "Egress data transfer costs if media routing between private core and cloud CDN is not tightly cached."
    ];
    dr_guidance = "Deploy an asynchronous PostgreSQL/Aurora standby replica in a secondary cloud region with automated health-check failover. Supplement with hourly S3 snapshots retained for 30 days with object lock for ransomware protection.";
    migration_phases = [
      { phase: "Phase 1: Cloud Storage Offload (Month 1-2)", detail: "Migrate cold video catalog to Cloud S3 Infrequent Access. Keep hot streaming buffer in current SAN." },
      { phase: "Phase 2: Cloud DR Pilot Light (Month 3-4)", detail: "Provision standby PostgreSQL replica in AWS with automated replication stream and DNS health checks." },
      { phase: "Phase 3: Hybrid Traffic Bursting (Month 5-6)", detail: "Route edge client sessions through global CDN. Configure auto-scaling cloud video transcoders for peak hours." },
      { phase: "Phase 4: Unified Observability (Month 7+)", detail: "Consolidate monitoring with Prometheus/OpenTelemetry across on-prem datacenter and cloud VPC." }
    ];
  } else if (winner === 'public') {
    summary = `Based on your configured emphasis on scalability, availability, and low operational overhead, Public Cloud is the recommended model with a score of ${scores[0].total_score}/100. It completely eliminates physical datacenter maintenance, delegating infrastructure resiliency to hyperscale providers.`;
    reasons = [
      "Maximum Scalability: True cloud elasticity allows instant provisioning of hundreds of video streaming instances.",
      "Managed High Availability: Multi-AZ database clustering guarantees 99.99% availability with automated sub-2 minute failover.",
      "Zero Datacenter Capex: Eliminates server hardware refresh cycles, power, cooling, and physical facility leases.",
      "Developer Velocity: On-demand self-service APIs allow engineers to spin up test staging environments in minutes."
    ];
    tradeoffs = [
      "Data Egress Costs: Video streaming generates massive outbound bandwidth that requires negotiated cloud volume tiers.",
      "Vendor Lock-in: Heavy adoption of proprietary managed services complicates future provider transitions."
    ];
    remaining_risks = [
      "Runaway cloud costs if auto-scaling quotas and budget alert guardrails are not strictly enforced."
    ];
    dr_guidance = "Utilize Multi-AZ managed databases with cross-region read replicas. Automated failover occurs within 120 seconds.";
    migration_phases = [
      { phase: "Phase 1: Cloud Assessment", detail: "Audit current virtual machines, database schemas, and network dependencies." },
      { phase: "Phase 2: Database Migration to Cloud RDS", detail: "Establish continuous replication via AWS DMS to cloud target." },
      { phase: "Phase 3: Full Cutover", detail: "Flip DNS traffic to cloud load balancers and decommission physical server racks." }
    ];
  } else {
    // private
    summary = `Based on your high prioritization of physical control and security sovereignty, Private Cloud was selected with a score of ${scores[0].total_score}/100. However, this model requires significant capital expenditure and active operational reforms to resolve the recent multi-day database disaster.`;
    reasons = [
      "Absolute Data Sovereignty & Control: Zero shared tenant exposure; full compliance with strict regional broadcast licensing.",
      "Predictable Baseline Workload: For constant 24/7 non-fluctuating streaming loads, owned hardware avoids recurring per-hour cloud rental margins."
    ];
    tradeoffs = [
      "Severe Scalability Constraints: Inability to elastically handle viral traffic spikes beyond owned physical rack limits.",
      "Costly High Availability: Redundancy requires purchasing, powering, and maintaining duplicate idle physical hardware in a secondary facility."
    ];
    remaining_risks = [
      "Single Point of Failure: The original multi-day database disaster will recur unless a secondary physical datacenter is constructed."
    ];
    dr_guidance = "Urgent requirement: Construct a secondary warm-standby physical datacenter facility connected by dark fiber to eliminate the single point of failure.";
    migration_phases = [
      { phase: "Phase 1: Datacenter Redundancy Overhaul", detail: "Install redundant SAN controllers, dual power grids, and secondary ISP uplinks." },
      { phase: "Phase 2: Local Clustering & Replication", detail: "Deploy synchronous Pacemaker/Corosync database clustering across separate server racks." },
      { phase: "Phase 3: Automated Off-Site Vaulting", detail: "Replace tape transport with encrypted daily network snapshot replication." }
    ];
  }

  return {
    recommended_model: winner,
    winner_name: winnerName,
    scores,
    weights_used: raw_w,
    executive_summary: summary,
    key_reasons: reasons,
    tradeoffs,
    remaining_risks,
    migration_phases,
    dr_guidance,
    case_study_mapping_summary: "Case study risks mapped to Elasticity, Resource Pooling, and On-Demand Self-Service."
  };
}
