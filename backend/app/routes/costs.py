from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models import UserConfiguration
from backend.app.schemas import CostCalculationInput, CostCalculationOutput
from backend.app.services.cost_calc import calculate_costs

router = APIRouter(prefix="/api/costs", tags=["Cost Explorer"])

@router.get("", response_model=CostCalculationOutput)
def get_default_costs(model: str = "hybrid", db: Session = Depends(get_db)):
    config = db.query(UserConfiguration).first()
    currency = config.currency if config else "INR"

    inp = CostCalculationInput(
        model=model,
        currency=currency,
        compute_instances=8,
        instance_vcpu=4,
        storage_tb=12.0,
        monthly_storage_growth_pct=8.0,
        monthly_data_transfer_tb=45.0,
        active_users=25000,
        peak_traffic_multiplier=2.5,
        db_instances=2,
        backup_storage_tb=15.0,
        support_fixed_monthly=600.0,
        onprem_baseline_monthly=19500.0
    )
    return calculate_costs(inp)

@router.post("/calculate", response_model=CostCalculationOutput)
def compute_costs(input_data: CostCalculationInput):
    return calculate_costs(input_data)
