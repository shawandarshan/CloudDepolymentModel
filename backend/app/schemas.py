from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field

# --- General & Settings ---
class UserConfigSchema(BaseModel):
    company_name: str = "StreamPulse Media Networks"
    currency: str = "INR"
    currency_symbol: str = "₹"
    exchange_rate_to_inr: float = 83.0
    rto_target_minutes: float = 15.0
    rpo_target_minutes: float = 15.0
    backup_frequency_hours: float = 4.0
    replication_lag_seconds: float = 15.0
    failover_policy: str = "Automatic Cloud Multi-AZ"

# --- Cost Explorer Schemas ---
class CostCalculationInput(BaseModel):
    model: str = "hybrid" # public, private, hybrid
    compute_instances: int = Field(default=8, ge=1, le=200)
    instance_vcpu: int = Field(default=4, ge=1, le=64)
    storage_tb: float = Field(default=12.0, ge=0.5, le=500.0)
    monthly_storage_growth_pct: float = Field(default=8.0, ge=0.0, le=50.0)
    monthly_data_transfer_tb: float = Field(default=45.0, ge=1.0, le=2000.0)
    active_users: int = Field(default=25000, ge=100, le=1000000)
    peak_traffic_multiplier: float = Field(default=2.5, ge=1.0, le=10.0)
    db_instances: int = Field(default=2, ge=1, le=20)
    backup_storage_tb: float = Field(default=15.0, ge=0.5, le=500.0)
    redundancy_level: str = "Multi-AZ Replication"
    support_fixed_monthly: float = Field(default=600.0, ge=0.0)
    onprem_baseline_monthly: float = Field(default=19500.0, ge=1000.0)
    # Private Capex parameters
    private_capex_hardware: float = Field(default=180000.0, ge=0.0)
    amortization_months: int = Field(default=36, ge=12, le=60)
    currency: str = "INR"

class CostBreakdownItem(BaseModel):
    category: str
    amount_usd: float
    amount_display: float
    percentage: float
    description: str

class MonthProjection(BaseModel):
    month: int
    storage_tb: float
    public_cost: float
    private_cost: float
    hybrid_cost: float
    onprem_baseline: float

class CostCalculationOutput(BaseModel):
    model: str
    currency: str
    currency_symbol: str
    monthly_cost_usd: float
    monthly_cost_display: float
    annual_cost_display: float
    cost_per_1k_users_display: float
    cost_per_tb_display: float
    monthly_savings_vs_baseline_display: float
    annual_savings_vs_baseline_display: float
    break_even_months: Optional[float] = None
    breakdown: List[CostBreakdownItem]
    twelve_month_projection: List[MonthProjection]
    all_models_comparison: Dict[str, float]
    is_simulation_estimate: bool = True

# --- Disaster Recovery Lab Schemas ---
class SimulationTriggerInput(BaseModel):
    scenario_type: str = "database_failure" # database_failure, storage_failure, network_outage, traffic_spike
    deployment_model: str = "hybrid"         # public, private, hybrid
    recovery_config: str = "standby_failover" # no_standby, standby_failover, backup_restore
    active_users: int = 25000
    rto_target_minutes: float = 15.0
    rpo_target_minutes: float = 15.0
    backup_frequency_hours: float = 4.0
    replication_lag_seconds: float = 15.0

class EventStep(BaseModel):
    timestamp_offset_seconds: int
    severity: str # ok, info, warn, err
    message: str

class ComponentNodeState(BaseModel):
    id: str
    name: str
    category: str
    domain: str
    status: str # Healthy, Degraded, Failed, Recovering, Standby
    latency_ms: float
    capacity_pct: float
    role: str

class SimulationResultOutput(BaseModel):
    incident_code: str
    title: str
    scenario_type: str
    deployment_model: str
    recovery_config: str
    severity: str
    simulated_rto_minutes: float
    simulated_rpo_minutes: float
    rto_target_minutes: float
    rpo_target_minutes: float
    rto_breached: bool
    rpo_breached: bool
    affected_users: int
    availability_drop_pct: float
    data_loss_estimate: str
    recovery_steps: List[EventStep]
    nodes_state: List[ComponentNodeState]
    explanation: str
    recovery_guidance: str
    is_simulation_estimate: bool = True

# --- Scalability Schemas ---
class ScalabilityInput(BaseModel):
    deployment_model: str = "hybrid"
    concurrent_viewers: int = Field(default=35000, ge=1000, le=250000)
    requests_per_second: int = Field(default=12000, ge=500, le=100000)
    burst_multiplier: float = Field(default=2.5, ge=1.0, le=5.0)
    base_compute_capacity_units: int = Field(default=10, ge=1, le=100)
    max_scalable_units: int = Field(default=30, ge=1, le=100)
    db_connections_limit: int = Field(default=1500, ge=100, le=10000)
    utilization_threshold_pct: float = Field(default=75.0, ge=50.0, le=95.0)

class ScalabilityOutput(BaseModel):
    deployment_model: str
    workload_score: float
    effective_concurrent_viewers: int
    effective_rps: int
    compute_utilization_pct: float
    storage_utilization_pct: float
    db_connections_used: int
    db_load_pct: float
    capacity_shortfall_pct: float
    instances_provisioned: int
    scaling_action_taken: str
    performance_status: str # Optimal, Scaled, Degraded, Throttled
    estimated_cost_change_usd: float
    elasticity_rating: str
    explanation: str

# --- Scoring & Recommendation Schemas ---
class WeightCriteria(BaseModel):
    cost: float = Field(default=25.0, ge=0.0, le=100.0)
    availability: float = Field(default=25.0, ge=0.0, le=100.0)
    recovery: float = Field(default=20.0, ge=0.0, le=100.0)
    scalability: float = Field(default=15.0, ge=0.0, le=100.0)
    security: float = Field(default=5.0, ge=0.0, le=100.0)
    control: float = Field(default=5.0, ge=0.0, le=100.0)
    simplicity: float = Field(default=5.0, ge=0.0, le=100.0)

class ModelScoreDetail(BaseModel):
    model: str
    name: str
    total_score: float
    rank: int
    subscores: Dict[str, float]

class RecommendationOutput(BaseModel):
    recommended_model: str
    winner_name: str
    scores: List[ModelScoreDetail]
    weights_used: Dict[str, float]
    executive_summary: str
    key_reasons: List[str]
    tradeoffs: List[str]
    remaining_risks: List[str]
    migration_phases: List[Dict[str, str]]
    dr_guidance: str
    case_study_mapping_summary: str

# --- Architecture Designer Schemas ---
class ArchNode(BaseModel):
    id: str
    name: str
    type: str # cdn, app, db, storage, backup, dr_cloud
    domain: str # private, public, edge
    x: float
    y: float
    status: str = "Healthy"
    properties: Dict[str, Any] = {}

class ArchEdge(BaseModel):
    id: str
    from_node: str
    to_node: str
    label: Optional[str] = None
    protocol: Optional[str] = "HTTPS"
    style: Optional[str] = "solid" # solid, dashed

class ArchitectureLayout(BaseModel):
    template_name: str
    deployment_model: str
    nodes: List[ArchNode]
    edges: List[ArchEdge]
    failure_domain_description: str
