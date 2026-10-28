import {
  CostCalculationOutput, SimulationResultOutput, ScalabilityOutput,
  RecommendationOutput, WeightCriteria, UserConfig, ArchitectureLayout
} from '../types';
import {
  calculateLocalCosts, runLocalDRSimulation, runLocalScalability,
  calculateLocalRecommendation, DEFAULT_USER_CONFIG
} from '../services/localSimulation';

const API_BASE = 'http://localhost:8000/api';

class ApiClient {
  private backendAvailable: boolean | null = null;

  async checkHealth(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/health`, { method: 'GET', signal: AbortSignal.timeout(1500) });
      if (res.ok) {
        this.backendAvailable = true;
        return true;
      }
    } catch (e) {
      this.backendAvailable = false;
    }
    this.backendAvailable = false;
    return false;
  }

  isBackendOnline(): boolean {
    return this.backendAvailable === true;
  }

  // --- Dashboard ---
  async getDashboard(model: string = 'hybrid'): Promise<any> {
    try {
      if (await this.checkHealth()) {
        const res = await fetch(`${API_BASE}/dashboard?model=${model}`);
        if (res.ok) return await res.json();
      }
    } catch (e) {}

    // Fallback: Local calculation
    const costs = calculateLocalCosts({
      model,
      currency: "INR",
      compute_instances: 8,
      storage_tb: 12.0,
      monthly_storage_growth_pct: 8.0,
      monthly_data_transfer_tb: 45.0,
      active_users: 25000,
      db_instances: 2,
      backup_storage_tb: 15.0
    });

    const traffic_points = [
      { time: "00:00", users: 14200, bandwidth_gbps: 18.5 },
      { time: "03:00", users: 8100,  bandwidth_gbps: 10.2 },
      { time: "06:00", users: 6500,  bandwidth_gbps: 8.0 },
      { time: "09:00", users: 12400, bandwidth_gbps: 15.6 },
      { time: "12:00", users: 19800, bandwidth_gbps: 26.0 },
      { time: "15:00", users: 22300, bandwidth_gbps: 29.5 },
      { time: "18:00", users: 28900, bandwidth_gbps: 38.2 },
      { time: "20:00", users: 34500, bandwidth_gbps: 46.8 },
      { time: "21:00", users: 36200, bandwidth_gbps: 48.9 },
      { time: "22:00", users: 31000, bandwidth_gbps: 41.5 },
      { time: "23:00", users: 23500, bandwidth_gbps: 31.0 }
    ];

    const model_names: Record<string, string> = {
      public: "Public Cloud (AWS Multi-AZ)",
      private: "Private Cloud (On-Premises)",
      hybrid: "Hybrid Cloud (Private Core + Cloud DR)"
    };

    return {
      company_name: "StreamPulse Media Networks",
      current_model: model,
      current_model_name: model_names[model] || "Hybrid Cloud",
      availability_sla: model === 'public' ? 99.99 : (model === 'hybrid' ? 99.95 : 94.5),
      active_simulated_users: 25000,
      storage_consumed_tb: 12.0,
      storage_capacity_tb: model === 'hybrid' ? 25.0 : (model === 'private' ? 16.0 : 100.0),
      monthly_cost_display: costs.monthly_cost_display,
      currency_symbol: costs.currency_symbol,
      currency: costs.currency,
      monthly_savings_vs_baseline: costs.monthly_savings_vs_baseline_display,
      last_recovery_duration_min: model === 'hybrid' ? 3.5 : (model === 'public' ? 2.0 : 3240.0),
      current_incident_status: "Operational - All systems nominal",
      traffic_points,
      all_models_cost_comparison: costs.all_models_comparison,
      recent_incidents: [
        {
          id: 1,
          incident_code: "INC-8921-CRISIS",
          title: "CASE STUDY: Primary Database SAN Crash (On-Premises Baseline)",
          model: "private",
          severity: "Critical",
          status: "Resolved",
          downtime_minutes: 3240.0,
          affected_users: 35000,
          data_loss_estimate: "24+ hours metadata & viewing logs",
          rto_breached: true,
          rpo_breached: true,
          start_time: "14 days ago"
        }
      ],
      is_simulation_estimate: true
    };
  }

  // --- Costs ---
  async calculateCosts(params: any): Promise<CostCalculationOutput> {
    try {
      if (await this.checkHealth()) {
        const res = await fetch(`${API_BASE}/costs/calculate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params)
        });
        if (res.ok) return await res.json();
      }
    } catch (e) {}
    return calculateLocalCosts(params);
  }

  // --- DR Simulation ---
  async runSimulation(params: any): Promise<SimulationResultOutput> {
    try {
      if (await this.checkHealth()) {
        const res = await fetch(`${API_BASE}/simulations/run`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params)
        });
        if (res.ok) return await res.json();
      }
    } catch (e) {}
    return runLocalDRSimulation(params);
  }

  // --- Scalability ---
  async simulateScalability(params: any): Promise<ScalabilityOutput> {
    try {
      if (await this.checkHealth()) {
        const res = await fetch(`${API_BASE}/scalability/simulate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params)
        });
        if (res.ok) return await res.json();
      }
    } catch (e) {}
    return runLocalScalability(params);
  }

  // --- Recommendations ---
  async getRecommendations(weights?: WeightCriteria): Promise<RecommendationOutput> {
    try {
      if (await this.checkHealth()) {
        const url = weights ? `${API_BASE}/recommendations/calculate` : `${API_BASE}/recommendations`;
        const method = weights ? 'POST' : 'GET';
        const body = weights ? JSON.stringify(weights) : undefined;
        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body
        });
        if (res.ok) return await res.json();
      }
    } catch (e) {}

    const defaultWeights: WeightCriteria = weights || {
      cost: 25.0,
      availability: 25.0,
      recovery: 20.0,
      scalability: 15.0,
      security: 5.0,
      control: 5.0,
      simplicity: 5.0
    };
    return calculateLocalRecommendation(defaultWeights);
  }

  // --- Architecture ---
  async getArchitecture(template: string = 'hybrid_dr'): Promise<ArchitectureLayout> {
    try {
      if (await this.checkHealth()) {
        const res = await fetch(`${API_BASE}/architecture?template=${template}`);
        if (res.ok) return await res.json();
      }
    } catch (e) {}

    // Fallback template
    return {
      template_name: "Hybrid Cloud with Disaster Recovery & Bursting",
      deployment_model: "hybrid",
      failure_domain_description: "Hybrid Dual-Domain Architecture: Private core datacenter handles steady-state transcoding and subscriber billing; public cloud acts as an automated DR site and absorbs traffic spikes.",
      nodes: [
        { id: "clients", name: "Global Viewers", type: "cdn", domain: "edge", x: 80, y: 180, status: "Healthy", properties: { cdn: "Anycast Edge CDN", routing: "Geo-DNS + Latency" } },
        { id: "onprem_gateway", name: "Private Core Gateway", type: "network", domain: "private", x: 260, y: 110, status: "Healthy", properties: { location: "Bangalore Datacenter", link: "Direct Connect 10G" } },
        { id: "onprem_app", name: "Private App Nodes (Steady)", type: "app", domain: "private", x: 440, y: 110, status: "Healthy", properties: { role: "80% Base Load", hosting: "Owned VMware/KVM" } },
        { id: "onprem_db", name: "Primary Database (On-Prem)", type: "db", domain: "private", x: 620, y: 110, status: "Healthy", properties: { engine: "PostgreSQL 16 Enterprise", role: "Active Read/Write" } },
        { id: "cloud_burst", name: "Cloud Burst Transcoders", type: "app", domain: "public", x: 440, y: 260, status: "Standby", properties: { trigger: "CPU > 75%", cloud: "AWS EC2 Spot / On-Demand" } },
        { id: "cloud_standby_db", name: "Cloud DR Standby DB", type: "db", domain: "public", x: 620, y: 260, status: "Standby", properties: { rto: "< 4 minutes", rpo: "< 15 seconds", replication: "Asynchronous WAL" } },
        { id: "cloud_s3_media", name: "Tiered Cloud Media Storage", type: "storage", domain: "public", x: 800, y: 180, status: "Healthy", properties: { policy: "Hot NVMe + Cold S3 Infrequent", durability: "11 9s" } }
      ],
      edges: [
        { id: "e1", from_node: "clients", to_node: "onprem_gateway", label: "Base Traffic" },
        { id: "e2", from_node: "clients", to_node: "cloud_burst", label: "Peak Overflow Burst", style: "dashed" },
        { id: "e3", from_node: "onprem_gateway", to_node: "onprem_app", label: "Internal Bus" },
        { id: "e4", from_node: "onprem_app", to_node: "onprem_db", label: "SQL Connection" },
        { id: "e5", from_node: "onprem_db", to_node: "cloud_standby_db", label: "WAL Stream (Direct Connect)", style: "dashed" },
        { id: "e6", from_node: "cloud_burst", to_node: "cloud_standby_db", label: "Failover Path", style: "dashed" },
        { id: "e7", from_node: "onprem_app", to_node: "cloud_s3_media", label: "Media Tiering" }
      ]
    };
  }

  // --- User Config ---
  async getConfig(): Promise<UserConfig> {
    try {
      if (await this.checkHealth()) {
        const res = await fetch(`${API_BASE}/scenarios/config`);
        if (res.ok) return await res.json();
      }
    } catch (e) {}

    const saved = localStorage.getItem('streamcloud_user_config');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return DEFAULT_USER_CONFIG;
  }

  async saveConfig(cfg: UserConfig): Promise<void> {
    localStorage.setItem('streamcloud_user_config', JSON.stringify(cfg));
    try {
      if (await this.checkHealth()) {
        await fetch(`${API_BASE}/scenarios/config`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cfg)
        });
      }
    } catch (e) {}
  }
}

export const api = new ApiClient();
