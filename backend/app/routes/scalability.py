from fastapi import APIRouter
from backend.app.schemas import ScalabilityInput, ScalabilityOutput
from backend.app.services.scaling import simulate_scaling

router = APIRouter(prefix="/api/scalability", tags=["Scalability Simulator"])

@router.post("/simulate", response_model=ScalabilityOutput)
def simulate_workload(input_data: ScalabilityInput):
    return simulate_scaling(input_data)
