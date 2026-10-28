import uuid
from typing import List, Dict, Tuple
from backend.app.schemas import (
    SimulationTriggerInput, SimulationResultOutput, EventStep, ComponentNodeState
)

def simulate_incident(input_data: SimulationTriggerInput) -> SimulationResultOutput:
    model = input_data.deployment_model.lower()
    scenario = input_data.scenario_type.lower()
    recovery_cfg = input_data.recovery_config.lower()
    users = input_data.active_users
    rto_target = input_data.rto_target_minutes
    rpo_target = input_data.rpo_target_minutes
    backup_freq = input_data.backup_frequency_hours
    rep_lag = input_data.replication_lag_seconds

    incident_code = f"INC-{uuid.uuid4().hex[:6].upper()}"
    steps: List[EventStep] = []
    nodes: List[ComponentNodeState] = []

    # Calculate actual RTO (Recovery Time Objective achieved) and RPO (Recovery Point Objective achieved)
    # based on model + recovery_config + scenario
    if scenario == "database_failure":
        title = "Primary Database Cluster Catastrophic Outage"
        severity = "Critical"

        if recovery_cfg == "standby_failover":
            # Multi-AZ / Cloud Standby auto-failover
            if model == "hybrid":
                actual_rto = 3.5  # 3.5 minutes
                actual_rpo = round(rep_lag / 60.0, 2) # e.g. 15s lag = 0.25 min
                affected_users = int(users * 0.15) # Temporary degradation during DNS/VIP flip
                avail_drop = 3.2
                data_loss = f"{int(rep_lag * 1.8)} KB (inflight transactions)"
                explanation = "Hybrid cloud standby database in AWS promoted to active primary via automated DNS flip and heartbeat detection."
                guidance = "Standby replica provided rapid failover (<4 mins), meeting strict RTO/RPO targets. Replication stream ensured negligible data loss."
                steps = [
                    EventStep(timestamp_offset_seconds=0, severity="err", message="[00:00] Critical: Heartbeat loss detected on Primary On-Prem Database (Error 500 Connection Refused)."),
                    EventStep(timestamp_offset_seconds=15, severity="warn", message="[00:15] Quorum controller declares primary host dead after 3 failed probes."),
                    EventStep(timestamp_offset_seconds=45, severity="info", message="[00:45] Hybrid Cloud Orchestrator triggers automated failover to AWS Multi-AZ Standby DB."),
                    EventStep(timestamp_offset_seconds=90, severity="info", message="[00:90] Cloud standby replica promoted to READ/WRITE primary node. Replaying WAL logs..."),
                    EventStep(timestamp_offset_seconds=150, severity="info", message="[02:30] Internal API Gateway routing updated to cloud DB endpoint. Connection pool restored."),
                    EventStep(timestamp_offset_seconds=210, severity="ok", message=f"[03:30] Service restored. Total downtime: 3.5 min. Data loss: {data_loss}.")
                ]
            elif model == "public":
                actual_rto = 2.0  # 2 minutes RDS Multi-AZ
                actual_rpo = round(rep_lag / 60.0, 2)
                affected_users = int(users * 0.10)
                avail_drop = 2.0
                data_loss = f"{int(rep_lag * 1.2)} KB"
                explanation = "AWS RDS Multi-AZ synchronous standby automatically promoted with automated CNAME flip."
                guidance = "Public cloud multi-AZ automated recovery provided near-zero downtime and zero administrative intervention."
                steps = [
                    EventStep(timestamp_offset_seconds=0, severity="err", message="[00:00] RDS Primary instance hardware failure in us-east-1a."),
                    EventStep(timestamp_offset_seconds=20, severity="warn", message="[00:20] Cloud monitoring detects unhealthy instance health check."),
                    EventStep(timestamp_offset_seconds=40, severity="info", message="[00:40] Automated RDS failover triggered to synchronous standby in us-east-1b."),
                    EventStep(timestamp_offset_seconds=80, severity="info", message="[01:20] Standby promoted. Database endpoint CNAME repointed."),
                    EventStep(timestamp_offset_seconds=120, severity="ok", message="[02:00] All application nodes re-established DB connection pool. Incident resolved.")
                ]
            else: # private cloud standby
                actual_rto = 25.0  # 25 minutes manual or VIP clustering
                actual_rpo = 1.5   # 1.5 minutes lag
                affected_users = int(users * 0.70)
                avail_drop = 28.0
                data_loss = "4.2 MB"
                explanation = "On-premises secondary database required VIP reassignment and engineer verification."
                guidance = "Private cloud failover requires dedicated networking scripts and on-call engineer validation, delaying recovery."
                steps = [
                    EventStep(timestamp_offset_seconds=0, severity="err", message="[00:00] SAN storage controller failure halted primary DB write transactions."),
                    EventStep(timestamp_offset_seconds=60, severity="warn", message="[01:00] Monitoring alert triggered PagerDuty incident to infrastructure team."),
                    EventStep(timestamp_offset_seconds=300, severity="info", message="[05:00] On-call DBA acknowledged alert. Commencing manual health verification."),
                    EventStep(timestamp_offset_seconds=900, severity="info", message="[15:00] Split-brain checks passed. Executing virtual IP takeover to secondary rack."),
                    EventStep(timestamp_offset_seconds=1500, severity="ok", message="[25:00] Secondary DB promoted. Video streaming catalog operational.")
                ]

        elif recovery_cfg == "backup_restore":
            # Point in time restore from backup
            actual_rto = 55.0 if model != "private" else 180.0
            actual_rpo = backup_freq * 60.0 # RPO is elapsed time since last snapshot
            affected_users = int(users * 0.95)
            avail_drop = 60.0
            data_loss = f"~{backup_freq:.1f} hours of user viewing logs, watch history & bookmarks"
            explanation = f"No active standby available. Restored database instance from cold backup snapshot taken {backup_freq}h ago."
            guidance = "Restoring from backups incurs significant RTO (45-180 min) and irreversible data loss corresponding to backup frequency (RPO)."
            steps = [
                EventStep(timestamp_offset_seconds=0, severity="err", message="[00:00] Primary database disk corruption corrupted catalog tables."),
                EventStep(timestamp_offset_seconds=60, severity="err", message="[01:00] No active standby replica detected. Initiating disaster recovery backup restore."),
                EventStep(timestamp_offset_seconds=300, severity="info", message=f"[05:00] Fetching snapshot taken {backup_freq} hours ago from S3/backup repository."),
                EventStep(timestamp_offset_seconds=1200, severity="info", message="[20:00] Provisioning clean database compute instance. Extracting 450 GB snapshot image..."),
                EventStep(timestamp_offset_seconds=2400, severity="info", message="[40:00] Replaying available transaction logs up to point-of-failure..."),
                EventStep(timestamp_offset_seconds=3300, severity="ok", message=f"[55:00] Backup restore complete. Service operational. Data loss incurred: {data_loss}.")
            ]

        else: # no_standby
            # The exact case study failure scenario!
            actual_rto = 2880.0 # 48 hours (2 days)
            actual_rpo = 1440.0 # 24 hours
            affected_users = users
            avail_drop = 99.8
            data_loss = "24+ hours of streaming metadata, user signups, and transaction logs"
            explanation = "CASE STUDY PROBLEM: On-premises database crashed with no live standby and corrupted local backup tapes. Required days of manual recovery."
            guidance = "Running without automated cloud replication or tested off-site backups results in multi-day business downtime and catastrophic SLA breach."
            steps = [
                EventStep(timestamp_offset_seconds=0, severity="err", message="[00:00] Catastrophic SAN RAID controller failure corrupts primary DB volume."),
                EventStep(timestamp_offset_seconds=120, severity="err", message="[00:02] Application server pool experiences 100% database query timeout errors."),
                EventStep(timestamp_offset_seconds=600, severity="err", message="[00:10] Standby replica: NONE CONFIGURED. Streaming service completely offline."),
                EventStep(timestamp_offset_seconds=3600, severity="warn", message="[01:00] On-premises team attempts tape backup restore; tape drive read errors encountered."),
                EventStep(timestamp_offset_seconds=86400, severity="warn", message="[24:00] Day 1: Replacement hardware shipped and delivered to on-premises datacenter."),
                EventStep(timestamp_offset_seconds=172800, severity="ok", message="[48:00] Day 2: Database rebuilt from stale offsite tape. Severe data loss detected.")
            ]

    elif scenario == "storage_failure":
        title = "Media Video Storage Volume Degradation"
        severity = "High"
        actual_rto = 4.0 if model == "hybrid" else (2.0 if model == "public" else 120.0)
        actual_rpo = 5.0
        affected_users = int(users * 0.40)
        avail_drop = 15.0
        data_loss = "0 MB (Read-only object replicas preserved)"
        explanation = "Primary video storage mount degraded. Video playback requests rerouted to redundant cloud object storage."
        guidance = "Cloud object storage with multi-AZ replication prevents streaming interruption compared to single on-premises SAN arrays."
        steps = [
            EventStep(timestamp_offset_seconds=0, severity="warn", message="[00:00] Storage I/O throughput throttled below SLA threshold."),
            EventStep(timestamp_offset_seconds=30, severity="info", message="[00:30] Edge CDN origin failover triggered to secondary S3 bucket."),
            EventStep(timestamp_offset_seconds=120, severity="ok", message="[02:00] Video chunk playback normal across all regions.")
        ]

    elif scenario == "network_outage":
        title = "Core Transit ISP & Gateway Outage"
        severity = "High"
        actual_rto = 3.0 if model != "private" else 90.0
        actual_rpo = 0.0
        affected_users = int(users * 0.60)
        avail_drop = 35.0
        data_loss = "0 MB"
        explanation = "Primary fiber link cut. Anycast DNS and BGP route failover diverted traffic to backup cloud CDN points of presence."
        guidance = "Cloud multi-region edge points of presence provide automatic BGP rerouting during ISP transit fiber cuts."
        steps = [
            EventStep(timestamp_offset_seconds=0, severity="err", message="[00:00] BGP session dropped on primary datacenter upstream link."),
            EventStep(timestamp_offset_seconds=45, severity="info", message="[00:45] Cloudflare/CloudFront Anycast automatically reroutes client DNS requests."),
            EventStep(timestamp_offset_seconds=180, severity="ok", message="[03:00] Network transit restored via secondary peering point.")
        ]

    else: # traffic_spike
        title = "10x Viral Streaming Traffic Surge"
        severity = "Medium"
        if model == "public":
            actual_rto = 1.5
            affected_users = int(users * 0.05)
            avail_drop = 1.0
            explanation = "Cloud Auto Scaling Group automatically launched 18 additional container instances within 90 seconds."
        elif model == "hybrid":
            actual_rto = 2.5
            affected_users = int(users * 0.08)
            avail_drop = 2.0
            explanation = "Private core sustained 100% capacity; cloud burst controller dynamically spun up cloud video transcoders."
        else: # private
            actual_rto = 60.0
            affected_users = int(users * 0.65)
            avail_drop = 45.0
            explanation = "Hardware ceiling reached. Datacenter ran out of CPU/memory capacity. 503 Service Unavailable errors served to 65% of viewers."

        actual_rpo = 0.0
        data_loss = "0 MB"
        guidance = "Elasticity allows on-demand provisioning to absorb peak events without investing in permanent idle hardware."
        steps = [
            EventStep(timestamp_offset_seconds=0, severity="warn", message="[00:00] Influx of concurrent streaming sessions detected (+300% in 2 minutes)."),
            EventStep(timestamp_offset_seconds=30, severity="info", message="[00:30] Auto-scaling alarm triggered: CPU utilization exceeded 80%."),
            EventStep(timestamp_offset_seconds=90, severity="info", message="[01:30] Elastic capacity expansion provisioned additional application workers."),
            EventStep(timestamp_offset_seconds=150, severity="ok", message="[02:30] Request latency returned to normal (p95 < 120ms).")
        ]

    # Target comparison and breach flags
    rto_breached = actual_rto > rto_target
    rpo_breached = actual_rpo > rpo_target

    # Determine node states during incident
    is_db_incident = scenario == "database_failure"
    is_storage_incident = scenario == "storage_failure"
    is_net_incident = scenario == "network_outage"
    is_spike = scenario == "traffic_spike"

    nodes = [
        ComponentNodeState(
            id="cdn",
            name="CloudFront / CDN Edge",
            category="network",
            domain="edge",
            status="Degraded" if is_net_incident else "Healthy",
            latency_ms=18.0 if not is_net_incident else 120.0,
            capacity_pct=88.0 if is_spike else 42.0,
            role="Global Edge Traffic Distribution"
        ),
        ComponentNodeState(
            id="app_servers",
            name="Streaming App Cluster",
            category="compute",
            domain="private" if model == "private" else ("hybrid" if model == "hybrid" else "public"),
            status="Failed" if (is_db_incident and recovery_cfg == "no_standby") else ("Degraded" if is_db_incident else "Healthy"),
            latency_ms=35.0 if not is_db_incident else 850.0,
            capacity_pct=98.0 if is_spike else 55.0,
            role="Video Transcoding & Session Management"
        ),
        ComponentNodeState(
            id="primary_db",
            name="Primary Database (On-Prem / Multi-AZ)",
            category="database",
            domain="private" if model != "public" else "public",
            status="Failed" if is_db_incident else "Healthy",
            latency_ms=4.0 if not is_db_incident else 9999.0,
            capacity_pct=65.0,
            role="Subscriber Catalog & Rights Management"
        ),
        ComponentNodeState(
            id="secondary_db",
            name="Standby DB Replica (Cloud DR)",
            category="database",
            domain="public" if model == "hybrid" else (model),
            status="Recovering" if (is_db_incident and recovery_cfg == "standby_failover") else ("Standby" if recovery_cfg != "no_standby" else "Failed"),
            latency_ms=12.0,
            capacity_pct=30.0,
            role="Hot Standby Asynchronous Replica"
        ),
        ComponentNodeState(
            id="media_storage",
            name="Media Storage (S3 / SAN)",
            category="storage",
            domain="public" if model != "private" else "private",
            status="Degraded" if is_storage_incident else "Healthy",
            latency_ms=25.0 if not is_storage_incident else 450.0,
            capacity_pct=68.0,
            role="Raw & Transcoded Video Bitstreams"
        ),
        ComponentNodeState(
            id="backup_repo",
            name="Backup Repository & Snapshots",
            category="backup",
            domain="public" if model != "private" else "private",
            status="Healthy",
            latency_ms=50.0,
            capacity_pct=45.0,
            role=f"Cold Snapshots (Frequency: {backup_freq}h)"
        ),
        ComponentNodeState(
            id="cloud_dr_burst",
            name="Cloud DR Pilot Light Environment",
            category="compute",
            domain="public",
            status="Healthy" if model != "private" else "Standby",
            latency_ms=22.0,
            capacity_pct=15.0,
            role="Automated Recovery VPC & Elastic Transcoders"
        )
    ]

    return SimulationResultOutput(
        incident_code=incident_code,
        title=title,
        scenario_type=scenario,
        deployment_model=model,
        recovery_config=recovery_cfg,
        severity=severity,
        simulated_rto_minutes=round(actual_rto, 2),
        simulated_rpo_minutes=round(actual_rpo, 2),
        rto_target_minutes=rto_target,
        rpo_target_minutes=rpo_target,
        rto_breached=rto_breached,
        rpo_breached=rpo_breached,
        affected_users=affected_users,
        availability_drop_pct=avail_drop,
        data_loss_estimate=data_loss,
        recovery_steps=steps,
        nodes_state=nodes,
        explanation=explanation,
        recovery_guidance=guidance,
        is_simulation_estimate=True
    )
