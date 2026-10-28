import json
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models import DeploymentModel, UserConfiguration

router = APIRouter(prefix="/api/models", tags=["Cloud Models"])

@router.get("")
def list_models(db: Session = Depends(get_db)):
    config = db.query(UserConfiguration).first()
    symbol = config.currency_symbol if config else "₹"
    rate = config.exchange_rate_to_inr if config else 83.5

    models = db.query(DeploymentModel).all()
    res = []
    for m in models:
        res.append({
            "id": m.id,
            "name": m.name,
            "tagline": m.tagline,
            "description": m.description,
            "setup_cost_display": round(m.setup_cost * rate, 2),
            "base_monthly_cost_display": round(m.base_monthly_cost * rate, 2),
            "storage_cost_per_tb_display": round(m.storage_cost_per_tb * rate, 2),
            "compute_cost_per_unit_display": round(m.compute_cost_per_unit * rate, 2),
            "bandwidth_cost_per_tb_display": round(m.bandwidth_cost_per_tb * rate, 2),
            "rto_minutes": m.rto_minutes,
            "rpo_minutes": m.rpo_minutes,
            "availability_sla": m.availability_sla,
            "scalability_score": m.scalability_score,
            "security_score": m.security_score,
            "control_score": m.control_score,
            "simplicity_score": m.simplicity_score,
            "pros": json.loads(m.pros) if m.pros else [],
            "cons": json.loads(m.cons) if m.cons else [],
            "suitable_use_cases": m.suitable_use_cases,
            "currency_symbol": symbol
        })
    return res

@router.get("/matrix")
def get_comparison_matrix(db: Session = Depends(get_db)):
    config = db.query(UserConfiguration).first()
    symbol = config.currency_symbol if config else "₹"

    # Multi-dimensional comparison matrix
    criteria = [
        {
            "category": "Financial",
            "name": "Initial Setup & Capex",
            "public": f"{symbol}4.17 Lakh (Minimal migration)",
            "private": f"{symbol}1.5 Crore (High server/SAN capital expense)",
            "hybrid": f"{symbol}29.2 Lakh (Interconnect & hybrid gateway)",
            "winner": "public",
            "description": "Public cloud requires zero hardware purchasing; private cloud demands massive upfront capital investment."
        },
        {
            "category": "Financial",
            "name": "Estimated Monthly Cost",
            "public": f"{symbol}5.18 Lakh / mo",
            "private": f"{symbol}15.4 Lakh / mo (Facility, power, staff)",
            "hybrid": f"{symbol}7.01 Lakh / mo (Optimized blend)",
            "winner": "public",
            "description": "Continuous monthly operational expenditures including power, cooling, datacenter staff, and bandwidth."
        },
        {
            "category": "Disaster Recovery",
            "name": "Recovery Time Objective (RTO)",
            "public": "2 minutes (Automated Multi-AZ RDS failover)",
            "private": "48–72 hours (Tape/cold rebuild without secondary DC)",
            "hybrid": "3.5 minutes (Cloud pilot-light standby database)",
            "winner": "public",
            "description": "Target time elapsed from database failure detection to full streaming service restoration."
        },
        {
            "category": "Disaster Recovery",
            "name": "Recovery Point Objective (RPO)",
            "public": "Sub-minute (<30s replication lag)",
            "private": "24 hours (Daily offsite tape snapshot backup)",
            "hybrid": "Sub-minute (<15s asynchronous replication)",
            "winner": "hybrid",
            "description": "Maximum age of data lost in the event of primary database cluster corruption."
        },
        {
            "category": "Architecture & Scalability",
            "name": "Scalability & Elasticity",
            "public": "Score 98/100 (Near-infinite elastic compute auto-scaling)",
            "private": "Score 38/100 (Constrained by owned physical rack count)",
            "hybrid": "Score 90/100 (Private steady state + public burst)",
            "winner": "public",
            "description": "Ability to automatically adapt capacity to sudden viral streaming viewership surges."
        },
        {
            "category": "Architecture & Scalability",
            "name": "Resource Pooling & Utilization",
            "public": "High (Multi-tenant shared hyperscaler infrastructure)",
            "private": "Low (Dedicated hardware idle during off-peak hours)",
            "hybrid": "High (Shared cloud tiering for media storage)",
            "winner": "hybrid",
            "description": "Pooling shared infrastructure avoids purchasing permanent peak capacity that sits unused 80% of the day."
        },
        {
            "category": "Governance",
            "name": "Security & Data Residency",
            "public": "Score 78/100 (Shared responsibility model)",
            "private": "Score 96/100 (Physical isolation, full data sovereignty)",
            "hybrid": "Score 92/100 (PII in private core; media in cloud)",
            "winner": "private",
            "description": "Protection of subscriber payment details, DRM keys, and broadcast licensing compliance."
        },
        {
            "category": "Operations",
            "name": "On-Demand Self-Service",
            "public": "Instant via AWS/GCP API & Console in seconds",
            "private": "Manual tickets & physical procurement (weeks/months)",
            "hybrid": "Self-service cloud bursts via Terraform / Kubernetes",
            "winner": "public",
            "description": "Ability to provision new video transcoders or database nodes without physical datacenter intervention."
        }
    ]

    # Radar comparison dataset
    radar_data = [
        {"subject": "Cost Efficiency", "Public": 84, "Private": 42, "Hybrid": 86},
        {"subject": "Availability SLA", "Public": 94, "Private": 72, "Hybrid": 96},
        {"subject": "Disaster Recovery", "Public": 92, "Private": 45, "Hybrid": 95},
        {"subject": "Elastic Scalability", "Public": 98, "Private": 38, "Hybrid": 90},
        {"subject": "Security & Compliance", "Public": 78, "Private": 96, "Hybrid": 92},
        {"subject": "Operational Simplicity", "Public": 85, "Private": 40, "Hybrid": 74},
        {"subject": "On-Demand Agility", "Public": 96, "Private": 35, "Hybrid": 88}
    ]

    return {
        "criteria": criteria,
        "radar_data": radar_data,
        "is_simulation_estimate": True
    }
