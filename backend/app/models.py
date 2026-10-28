import json
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.database import Base

class SimulationScenario(Base):
    __tablename__ = "simulation_scenarios"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    is_default = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    data = Column(Text, nullable=False)  # JSON-serialized state

    def get_data(self):
        return json.loads(self.data) if self.data else {}

    def set_data(self, val):
        self.data = json.dumps(val)


class DeploymentModel(Base):
    __tablename__ = "deployment_models"

    id = Column(String(50), primary_key=True)  # public, private, hybrid
    name = Column(String(100), nullable=False)
    tagline = Column(String(200), nullable=True)
    description = Column(Text, nullable=False)
    setup_cost = Column(Float, default=0.0)
    base_monthly_cost = Column(Float, default=0.0)
    storage_cost_per_tb = Column(Float, default=0.0)
    compute_cost_per_unit = Column(Float, default=0.0)
    bandwidth_cost_per_tb = Column(Float, default=0.0)
    rto_minutes = Column(Float, default=60.0)
    rpo_minutes = Column(Float, default=60.0)
    availability_sla = Column(Float, default=99.9)
    scalability_score = Column(Float, default=80.0)
    security_score = Column(Float, default=80.0)
    control_score = Column(Float, default=80.0)
    simplicity_score = Column(Float, default=80.0)
    pros = Column(Text, nullable=True)  # JSON array
    cons = Column(Text, nullable=True)  # JSON array
    suitable_use_cases = Column(Text, nullable=True)


class InfrastructureComponent(Base):
    __tablename__ = "infrastructure_components"

    id = Column(String(50), primary_key=True)
    name = Column(String(100), nullable=False)
    category = Column(String(50), nullable=False)  # compute, storage, database, network, backup
    domain = Column(String(50), nullable=False)    # private, public, edge, hybrid
    status = Column(String(50), default="Healthy")  # Healthy, Degraded, Failed, Recovering, Standby
    latency_ms = Column(Float, default=5.0)
    capacity_pct = Column(Float, default=45.0)
    redundancy_mode = Column(String(50), default="Primary")
    description = Column(Text, nullable=True)


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    incident_code = Column(String(50), unique=True, index=True)
    title = Column(String(200), nullable=False)
    model = Column(String(50), nullable=False)
    scenario_type = Column(String(100), nullable=False)  # database_failure, storage_failure, network_outage, traffic_spike
    recovery_config = Column(String(100), nullable=False) # no_standby, standby_failover, backup_restore
    severity = Column(String(50), default="Critical")     # Critical, High, Medium, Low
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime, nullable=True)
    downtime_minutes = Column(Float, default=0.0)
    rto_target_minutes = Column(Float, default=15.0)
    rpo_target_minutes = Column(Float, default=15.0)
    simulated_rto_minutes = Column(Float, default=0.0)
    simulated_rpo_minutes = Column(Float, default=0.0)
    rto_breached = Column(Boolean, default=False)
    rpo_breached = Column(Boolean, default=False)
    affected_users = Column(Integer, default=0)
    data_loss_estimate = Column(String(100), default="0 MB")
    status = Column(String(50), default="Resolved")      # Active, Recovering, Resolved
    summary = Column(Text, nullable=True)

    events = relationship("IncidentEvent", back_populates="incident", cascade="all, delete-orphan")


class IncidentEvent(Base):
    __tablename__ = "incident_events"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id"), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    step_offset_seconds = Column(Integer, default=0)
    severity = Column(String(20), default="info")  # ok, info, warn, err
    message = Column(Text, nullable=False)

    incident = relationship("Incident", back_populates="events")


class CostAssumption(Base):
    __tablename__ = "cost_assumptions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    model = Column(String(50), nullable=False)
    compute_hourly_rate = Column(Float, default=0.08)
    storage_gb_month_rate = Column(Float, default=0.023)
    egress_gb_rate = Column(Float, default=0.08)
    db_instance_rate = Column(Float, default=0.25)
    backup_gb_month_rate = Column(Float, default=0.015)
    support_fixed_monthly = Column(Float, default=500.0)
    capex_hardware = Column(Float, default=0.0)
    amortization_months = Column(Integer, default=36)


class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    recommended_model = Column(String(50), nullable=False)
    public_score = Column(Float, default=0.0)
    private_score = Column(Float, default=0.0)
    hybrid_score = Column(Float, default=0.0)
    weights_json = Column(Text, nullable=False)
    justification = Column(Text, nullable=False)
    tradeoffs = Column(Text, nullable=False)
    migration_phases = Column(Text, nullable=False)


class UserConfiguration(Base):
    __tablename__ = "user_configurations"

    id = Column(Integer, primary_key=True, index=True)
    company_name = Column(String(100), default="StreamPulse Media Networks")
    currency = Column(String(10), default="INR")
    currency_symbol = Column(String(10), default="₹")
    exchange_rate_to_inr = Column(Float, default=83.0)  # For USD to INR display
    rto_target_minutes = Column(Float, default=15.0)
    rpo_target_minutes = Column(Float, default=15.0)
    backup_frequency_hours = Column(Float, default=4.0)
    replication_lag_seconds = Column(Float, default=15.0)
    failover_policy = Column(String(50), default="Automatic Cloud Multi-AZ")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
