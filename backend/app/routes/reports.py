from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models import UserConfiguration, Incident, DeploymentModel
from backend.app.services.cost_calc import calculate_costs
from backend.app.services.scoring import calculate_recommendation
from backend.app.schemas import CostCalculationInput, WeightCriteria
from backend.app.routes.recommendations import CASE_STUDY_MAPPINGS

router = APIRouter(prefix="/api/reports", tags=["Reports & Export"])

@router.get("/summary")
def get_report_summary(model: str = "hybrid", db: Session = Depends(get_db)):
    config = db.query(UserConfiguration).first()
    currency = config.currency if config else "INR"
    symbol = config.currency_symbol if config else "₹"
    company = config.company_name if config else "StreamPulse Media Networks"

    cost_res = calculate_costs(CostCalculationInput(
        model=model,
        currency=currency,
        compute_instances=8,
        storage_tb=12.0,
        active_users=25000,
        monthly_data_transfer_tb=45.0
    ))

    rec_res = calculate_recommendation(WeightCriteria())
    incidents = db.query(Incident).order_by(Incident.id.desc()).limit(10).all()

    return {
        "report_title": f"StreamCloud Intelligence: Cloud Deployment Model & Disaster Recovery Analysis for {company}",
        "generated_at": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"),
        "company_name": company,
        "selected_model": model,
        "currency": currency,
        "currency_symbol": symbol,
        "problem_statement": (
            f"{company} currently operates dedicated private datacenter facilities. A severe database hardware failure "
            "recently knocked streaming services offline for over 54 hours, inflicting severe customer churn and brand damage. "
            "Simultaneously, unmanaged video asset growth is driving up on-premises SAN storage and operational staff costs."
        ),
        "objectives": [
            "Evaluate Public Cloud, Private Cloud, and Hybrid Cloud architectures against academic criteria.",
            "Eliminate single points of failure (SPOF) with tested, sub-5 minute RTO disaster recovery solutions.",
            "Establish predictable, elastic cost structures leveraging cloud storage lifecycle tiering.",
            "Map case study risks to core NIST cloud characteristics: Elasticity, Resource Pooling, On-Demand Self-Service."
        ],
        "financial_analysis": {
            "monthly_cost_display": cost_res.monthly_cost_display,
            "annual_cost_display": cost_res.annual_cost_display,
            "cost_per_1k_users": cost_res.cost_per_1k_users_display,
            "cost_per_tb": cost_res.cost_per_tb_display,
            "monthly_savings_vs_baseline": cost_res.monthly_savings_vs_baseline_display,
            "annual_savings_vs_baseline": cost_res.annual_savings_vs_baseline_display,
            "break_even_months": cost_res.break_even_months,
            "all_models": cost_res.all_models_comparison
        },
        "recommendation": {
            "winner": rec_res.recommended_model,
            "winner_name": rec_res.winner_name,
            "executive_summary": rec_res.executive_summary,
            "key_reasons": rec_res.key_reasons,
            "tradeoffs": rec_res.tradeoffs,
            "migration_phases": rec_res.migration_phases,
            "dr_guidance": rec_res.dr_guidance
        },
        "case_study_mappings": CASE_STUDY_MAPPINGS,
        "recent_incidents": [
            {
                "code": inc.incident_code,
                "title": inc.title,
                "model": inc.model,
                "downtime_minutes": inc.downtime_minutes,
                "data_loss": inc.data_loss_estimate,
                "rto_breached": inc.rto_breached,
                "rpo_breached": inc.rpo_breached
            }
            for inc in incidents
        ],
        "limitations": [
            "All operational measurements, recovery durations, and cost estimates are simulation-based models designed for academic comparison.",
            "Public cloud egress pricing varies with regional CDN tier volume commitments.",
            "Disaster recovery RTO guarantees require operational drill testing and automated runbooks."
        ],
        "conclusion": (
            f"The quantitative and architectural analysis confirms that a Hybrid Cloud Deployment Model provides the optimal balance "
            f"for {company}. It directly remedies the catastrophic multi-day database disaster through cloud standby replication (<4 min RTO), "
            "harnesses cloud storage elasticity to arrest rising SAN costs, and preserves data sovereignty for core subscriber records."
        )
    }
