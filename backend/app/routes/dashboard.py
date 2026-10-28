import json
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models import Incident, DeploymentModel, UserConfiguration
from backend.app.services.cost_calc import calculate_costs
from backend.app.schemas import CostCalculationInput

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("")
def get_dashboard_summary(model: str = "hybrid", db: Session = Depends(get_db)):
    config = db.query(UserConfiguration).first()
    currency = config.currency if config else "INR"
    rate = config.exchange_rate_to_inr if config else 83.5

    # Recent incidents
    incidents = db.query(Incident).order_by(Incident.id.desc()).limit(5).all()
    recent_incidents = []
    for inc in incidents:
        recent_incidents.append({
            "id": inc.id,
            "incident_code": inc.incident_code,
            "title": inc.title,
            "model": inc.model,
            "severity": inc.severity,
            "status": inc.status,
            "downtime_minutes": inc.downtime_minutes,
            "affected_users": inc.affected_users,
            "data_loss_estimate": inc.data_loss_estimate,
            "rto_breached": inc.rto_breached,
            "rpo_breached": inc.rpo_breached,
            "start_time": inc.start_time.isoformat() if inc.start_time else None
        })

    # Cost calculation for the selected model
    cost_input = CostCalculationInput(
        model=model,
        currency=currency,
        compute_instances=8,
        storage_tb=12.0,
        active_users=25000,
        monthly_data_transfer_tb=45.0
    )
    cost_res = calculate_costs(cost_input)

    # Model metadata
    dep_model = db.query(DeploymentModel).filter(DeploymentModel.id == model).first()
    model_name = dep_model.name if dep_model else model.capitalize() + " Cloud"
    sla = dep_model.availability_sla if dep_model else 99.95

    # Deterministic simulated traffic profile over 24 hours
    traffic_points = [
        {"time": "00:00", "users": 14200, "bandwidth_gbps": 18.5},
        {"time": "03:00", "users": 8100,  "bandwidth_gbps": 10.2},
        {"time": "06:00", "users": 6500,  "bandwidth_gbps": 8.0},
        {"time": "09:00", "users": 12400, "bandwidth_gbps": 15.6},
        {"time": "12:00", "users": 19800, "bandwidth_gbps": 26.0},
        {"time": "15:00", "users": 22300, "bandwidth_gbps": 29.5},
        {"time": "18:00", "users": 28900, "bandwidth_gbps": 38.2},
        {"time": "20:00", "users": 34500, "bandwidth_gbps": 46.8}, # Prime time peak
        {"time": "21:00", "users": 36200, "bandwidth_gbps": 48.9},
        {"time": "22:00", "users": 31000, "bandwidth_gbps": 41.5},
        {"time": "23:00", "users": 23500, "bandwidth_gbps": 31.0}
    ]

    return {
        "company_name": config.company_name if config else "StreamPulse Media Networks",
        "current_model": model,
        "current_model_name": model_name,
        "availability_sla": sla,
        "active_simulated_users": 25000,
        "storage_consumed_tb": 12.0,
        "storage_capacity_tb": 25.0 if model == "hybrid" else (16.0 if model == "private" else 100.0),
        "monthly_cost_display": cost_res.monthly_cost_display,
        "currency_symbol": cost_res.currency_symbol,
        "currency": cost_res.currency,
        "monthly_savings_vs_baseline": cost_res.monthly_savings_vs_baseline_display,
        "last_recovery_duration_min": 3.5 if model == "hybrid" else (2.0 if model == "public" else 3240.0),
        "current_incident_status": "Operational - All systems nominal",
        "traffic_points": traffic_points,
        "all_models_cost_comparison": cost_res.all_models_comparison,
        "recent_incidents": recent_incidents,
        "is_simulation_estimate": True
    }
