import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models import SimulationScenario, UserConfiguration, Incident
from backend.app.schemas import UserConfigSchema

router = APIRouter(prefix="/api/scenarios", tags=["Settings & Scenarios"])

@router.get("")
def list_scenarios(db: Session = Depends(get_db)):
    scenarios = db.query(SimulationScenario).all()
    res = []
    for s in scenarios:
        res.append({
            "id": s.id,
            "name": s.name,
            "description": s.description,
            "is_default": s.is_default,
            "created_at": s.created_at.isoformat() if s.created_at else None,
            "data": s.get_data()
        })
    return res

@router.get("/config", response_model=UserConfigSchema)
def get_user_configuration(db: Session = Depends(get_db)):
    cfg = db.query(UserConfiguration).first()
    if not cfg:
        cfg = UserConfiguration()
        db.add(cfg)
        db.commit()
        db.refresh(cfg)
    return UserConfigSchema(
        company_name=cfg.company_name,
        currency=cfg.currency,
        currency_symbol=cfg.currency_symbol,
        exchange_rate_to_inr=cfg.exchange_rate_to_inr,
        rto_target_minutes=cfg.rto_target_minutes,
        rpo_target_minutes=cfg.rpo_target_minutes,
        backup_frequency_hours=cfg.backup_frequency_hours,
        replication_lag_seconds=cfg.replication_lag_seconds,
        failover_policy=cfg.failover_policy
    )

@router.put("/config", response_model=UserConfigSchema)
def update_user_configuration(config_in: UserConfigSchema, db: Session = Depends(get_db)):
    cfg = db.query(UserConfiguration).first()
    if not cfg:
        cfg = UserConfiguration()
        db.add(cfg)

    cfg.company_name = config_in.company_name
    cfg.currency = config_in.currency
    cfg.currency_symbol = config_in.currency_symbol
    cfg.exchange_rate_to_inr = config_in.exchange_rate_to_inr
    cfg.rto_target_minutes = config_in.rto_target_minutes
    cfg.rpo_target_minutes = config_in.rpo_target_minutes
    cfg.backup_frequency_hours = config_in.backup_frequency_hours
    cfg.replication_lag_seconds = config_in.replication_lag_seconds
    cfg.failover_policy = config_in.failover_policy

    db.commit()
    db.refresh(cfg)
    return config_in

@router.post("")
def save_scenario(payload: dict, db: Session = Depends(get_db)):
    name = payload.get("name", "Custom Saved Scenario")
    desc = payload.get("description", "User-saved simulation configuration")
    data = payload.get("data", {})

    scenario = SimulationScenario(
        name=name,
        description=desc,
        is_default=False,
        data=json.dumps(data)
    )
    db.add(scenario)
    db.commit()
    db.refresh(scenario)

    return {
        "id": scenario.id,
        "name": scenario.name,
        "message": "Scenario saved successfully."
    }

@router.delete("/{scenario_id}")
def delete_scenario(scenario_id: int, db: Session = Depends(get_db)):
    scenario = db.query(SimulationScenario).filter(SimulationScenario.id == scenario_id).first()
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")
    if scenario.is_default:
        raise HTTPException(status_code=400, detail="Cannot delete default scenario")
    db.delete(scenario)
    db.commit()
    return {"message": "Scenario deleted."}

@router.post("/reset-all")
def reset_all_data(db: Session = Depends(get_db)):
    # Reset config to defaults
    cfg = db.query(UserConfiguration).first()
    if cfg:
        cfg.company_name = "StreamPulse Media Networks"
        cfg.currency = "INR"
        cfg.currency_symbol = "₹"
        cfg.exchange_rate_to_inr = 83.5
        cfg.rto_target_minutes = 15.0
        cfg.rpo_target_minutes = 15.0
        cfg.backup_frequency_hours = 4.0
        cfg.replication_lag_seconds = 15.0
        cfg.failover_policy = "Automatic Cloud Multi-AZ"

    # Remove non-default scenarios
    db.query(SimulationScenario).filter(SimulationScenario.is_default == False).delete()
    db.commit()
    return {"status": "ok", "message": "Demo reset to fresh baseline state."}
