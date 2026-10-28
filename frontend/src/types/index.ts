export type DeploymentModelId = 'public' | 'private' | 'hybrid';

export type PageId =
  | 'overview'
  | 'comparison'
  | 'dr-lab'
  | 'cost-explorer'
  | 'scalability'
  | 'architecture'
  | 'recommendations'
  | 'reports'
  | 'settings';

export interface UserConfig {
  company_name: string;
  currency: string;
  currency_symbol: string;
  exchange_rate_to_inr: number;
  rto_target_minutes: number;
  rpo_target_minutes: number;
  backup_frequency_hours: number;
  replication_lag_seconds: number;
  failover_policy: string;
}

export interface AlertNotification {
  id: string;
  title: string;
  message: string;
  severity: 'info' | 'warn' | 'err' | 'ok';
  timestamp: string;
  read: boolean;
}

export interface EventStep {
  timestamp_offset_seconds: number;
  severity: 'ok' | 'info' | 'warn' | 'err';
  message: string;
}

export interface ComponentNodeState {
  id: string;
  name: string;
  category: string;
  domain: string;
  status: 'Healthy' | 'Degraded' | 'Failed' | 'Recovering' | 'Standby';
  latency_ms: number;
  capacity_pct: number;
  role: string;
}

export interface SimulationResultOutput {
  incident_code: string;
  title: string;
  scenario_type: string;
  deployment_model: string;
  recovery_config: string;
  severity: string;
  simulated_rto_minutes: number;
  simulated_rpo_minutes: number;
  rto_target_minutes: number;
  rpo_target_minutes: number;
  rto_breached: boolean;
  rpo_breached: boolean;
  affected_users: number;
  availability_drop_pct: number;
  data_loss_estimate: string;
  recovery_steps: EventStep[];
  nodes_state: ComponentNodeState[];
  explanation: string;
  recovery_guidance: string;
  is_simulation_estimate: boolean;
}

export interface CostBreakdownItem {
  category: string;
  amount_usd: number;
  amount_display: number;
  percentage: number;
  description: string;
}

export interface MonthProjection {
  month: number;
  storage_tb: number;
  public_cost: number;
  private_cost: number;
  hybrid_cost: number;
  onprem_baseline: number;
}

export interface CostCalculationOutput {
  model: string;
  currency: string;
  currency_symbol: string;
  monthly_cost_usd: number;
  monthly_cost_display: number;
  annual_cost_display: number;
  cost_per_1k_users_display: number;
  cost_per_tb_display: number;
  monthly_savings_vs_baseline_display: number;
  annual_savings_vs_baseline_display: number;
  break_even_months: number | null;
  breakdown: CostBreakdownItem[];
  twelve_month_projection: MonthProjection[];
  all_models_comparison: Record<string, number>;
  is_simulation_estimate: boolean;
}

export interface ScalabilityOutput {
  deployment_model: string;
  workload_score: number;
  effective_concurrent_viewers: number;
  effective_rps: number;
  compute_utilization_pct: number;
  storage_utilization_pct: number;
  db_connections_used: number;
  db_load_pct: number;
  capacity_shortfall_pct: number;
  instances_provisioned: number;
  scaling_action_taken: string;
  performance_status: string;
  estimated_cost_change_usd: number;
  elasticity_rating: string;
  explanation: string;
}

export interface WeightCriteria {
  cost: number;
  availability: number;
  recovery: number;
  scalability: number;
  security: number;
  control: number;
  simplicity: number;
}

export interface ModelScoreDetail {
  model: string;
  name: string;
  total_score: number;
  rank: number;
  subscores: Record<string, number>;
}

export interface RecommendationOutput {
  recommended_model: string;
  winner_name: string;
  scores: ModelScoreDetail[];
  weights_used: Record<string, number>;
  executive_summary: string;
  key_reasons: string[];
  tradeoffs: string[];
  remaining_risks: string[];
  migration_phases: Array<{ phase: string; detail: string }>;
  dr_guidance: string;
  case_study_mapping_summary: string;
}

export interface ArchNode {
  id: string;
  name: string;
  type: string;
  domain: string;
  x: number;
  y: number;
  status: string;
  properties: Record<string, any>;
}

export interface ArchEdge {
  id: string;
  from_node: string;
  to_node: string;
  label?: string;
  protocol?: string;
  style?: string;
}

export interface ArchitectureLayout {
  template_name: string;
  deployment_model: string;
  nodes: ArchNode[];
  edges: ArchEdge[];
  failure_domain_description: string;
}
