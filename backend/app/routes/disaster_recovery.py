from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models import Incident, IncidentEvent, InfrastructureComponent
from backend.app.schemas import (
    SimulationTriggerInput, SimulationResultOutput
)
from backend.app.services.simulation import simulate_incident

router = APIRouter(prefix="/api/simulations", tags=["Disaster Recovery"])

@router.post("/run", response_model=SimulationResultOutput)
def run_simulation(input_data: SimulationTriggerInput, db: Session = Depends(get_db)):
    result = simulate_incident(input_data)

    # Persist incident in database
    new_incident = Incident(
        incident_code=result.incident_code,
        title=result.title,
        model=result.deployment_model,
        scenario_type=result.scenario_type,
        recovery_config=result.recovery_config,
        severity=result.severity,
        start_time=datetime.utcnow(),
        end_time=datetime.utcnow(),
        downtime_minutes=result.simulated_rto_minutes,
        rto_target_minutes=result.rto_target_minutes,
        rpo_target_minutes=result.rpo_target_minutes,
        simulated_rto_minutes=result.simulated_rto_minutes,
        simulated_rpo_minutes=result.simulated_rpo_minutes,
        rto_breached=result.rto_breached,
        rpo_breached=result.rpo_breached,
        affected_users=result.affected_users,
        data_loss_estimate=result.data_loss_estimate,
        status="Resolved",
        summary=result.explanation
    )
    db.add(new_incident)
    db.flush()

    for step in result.recovery_steps:
        evt = IncidentEvent(
            incident_id=new_incident.id,
            step_offset_seconds=step.timestamp_offset_seconds,
            severity=step.severity,
            message=step.message
        )
        db.add(evt)

    # Update infrastructure components table
    for node in result.nodes_state:
        comp = db.query(InfrastructureComponent).filter(InfrastructureComponent.id == node.id).first()
        if comp:
            comp.status = node.status
            comp.latency_ms = node.latency_ms
            comp.capacity_pct = node.capacity_pct

    db.commit()
    return result

@router.get("/incidents")
def list_incidents(db: Session = Depends(get_db)):
    incidents = db.query(Incident).order_by(Incident.id.desc()).all()
    res = []
    for inc in incidents:
        events = [
            {"offset": e.step_offset_seconds, "severity": e.severity, "message": e.message}
            for e in inc.events
        ]
        res.append({
            "id": inc.id,
            "incident_code": inc.incident_code,
            "title": inc.title,
            "model": inc.model,
            "scenario_type": inc.scenario_type,
            "recovery_config": inc.recovery_config,
            "severity": inc.severity,
            "downtime_minutes": inc.downtime_minutes,
            "rto_target_minutes": inc.rto_target_minutes,
            "rpo_target_minutes": inc.rpo_target_minutes,
            "rto_breached": inc.rto_breached,
            "rpo_breached": inc.rpo_breached,
            "affected_users": inc.affected_users,
            "data_loss_estimate": inc.data_loss_estimate,
            "status": inc.status,
            "summary": inc.summary,
            "start_time": inc.start_time.isoformat() if inc.start_time else None,
            "events": events
        })
    return res

@router.get("/incidents/{incident_id}")
def get_incident(incident_id: int, db: Session = Depends(get_db)):
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")
    events = [
        {"offset": e.step_offset_seconds, "severity": e.severity, "message": e.message}
        for e in inc.events
    ]
    return {
        "id": inc.id,
        "incident_code": inc.incident_code,
        "title": inc.title,
        "model": inc.model,
        "scenario_type": inc.scenario_type,
        "recovery_config": inc.recovery_config,
        "severity": inc.severity,
        "downtime_minutes": inc.downtime_minutes,
        "rto_target_minutes": inc.rto_target_minutes,
        "rpo_target_minutes": inc.rpo_target_minutes,
        "rto_breached": inc.rto_breached,
        "rpo_breached": inc.rpo_breached,
        "affected_users": inc.affected_users,
        "data_loss_estimate": inc.data_loss_estimate,
        "status": inc.status,
        "summary": inc.summary,
        "start_time": inc.start_time.isoformat() if inc.start_time else None,
        "events": events
    }

@router.post("/reset")
def reset_simulation(db: Session = Depends(get_db)):
    # Reset all components to Healthy
    comps = db.query(InfrastructureComponent).all()
    for c in comps:
        c.status = "Healthy" if c.id != "secondary_db" else "Standby"
        c.latency_ms = 18.0 if c.id == "cdn" else 35.0
        c.capacity_pct = 45.0
    db.commit()
    return {"status": "ok", "message": "Simulation topology reset to healthy baseline state."}
