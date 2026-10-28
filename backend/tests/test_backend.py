import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.cost_calc import calculate_costs
from backend.app.services.simulation import simulate_incident
from backend.app.services.scoring import calculate_recommendation
from backend.app.schemas import (
    CostCalculationInput, SimulationTriggerInput, WeightCriteria
)

client = TestClient(app)

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "StreamCloud" in data["service"]

def test_cost_calculation_math():
    inp = CostCalculationInput(
        model="hybrid",
        currency="INR",
        compute_instances=8,
        storage_tb=12.0,
        active_users=25000,
        monthly_data_transfer_tb=45.0
    )
    result = calculate_costs(inp)
    assert result.monthly_cost_usd > 0
    assert result.monthly_cost_display > 0
    # Verify categories sum equals monthly total
    sum_items_usd = round(sum(item.amount_usd for item in result.breakdown), 2)
    assert abs(sum_items_usd - result.monthly_cost_usd) <= 0.05
    # Verify 12 month projection
    assert len(result.twelve_month_projection) == 12
    # Verify storage growth over 12 months
    assert result.twelve_month_projection[-1].storage_tb > result.twelve_month_projection[0].storage_tb

def test_disaster_recovery_simulation_database_failure():
    # Case study problem: Database failure with NO standby
    no_standby_inp = SimulationTriggerInput(
        scenario_type="database_failure",
        deployment_model="private",
        recovery_config="no_standby",
        rto_target_minutes=15.0,
        rpo_target_minutes=15.0
    )
    res_no_standby = simulate_incident(no_standby_inp)
    assert res_no_standby.rto_breached is True
    assert res_no_standby.simulated_rto_minutes >= 1440.0 # days
    assert res_no_standby.affected_users > 0

    # Hybrid Cloud with automated Standby failover
    standby_inp = SimulationTriggerInput(
        scenario_type="database_failure",
        deployment_model="hybrid",
        recovery_config="standby_failover",
        rto_target_minutes=15.0,
        rpo_target_minutes=15.0
    )
    res_standby = simulate_incident(standby_inp)
    assert res_standby.rto_breached is False
    assert res_standby.simulated_rto_minutes < 15.0 # ~3.5 min
    assert len(res_standby.recovery_steps) > 0

def test_recommendation_scoring():
    # High recovery & cost weight favors Hybrid
    weights = WeightCriteria(
        cost=30.0,
        availability=25.0,
        recovery=25.0,
        scalability=10.0,
        security=5.0,
        control=3.0,
        simplicity=2.0
    )
    rec = calculate_recommendation(weights)
    assert rec.recommended_model in ["hybrid", "public"]
    assert len(rec.scores) == 3
    assert len(rec.key_reasons) > 0
    assert len(rec.migration_phases) > 0

def test_api_endpoints():
    # Dashboard
    res = client.get("/api/dashboard?model=hybrid")
    assert res.status_code == 200
    assert "traffic_points" in res.json()

    # Models
    res = client.get("/api/models")
    assert res.status_code == 200
    assert len(res.json()) == 3

    # Scalability
    res = client.post("/api/scalability/simulate", json={
        "deployment_model": "hybrid",
        "concurrent_viewers": 30000,
        "requests_per_second": 10000,
        "burst_multiplier": 2.0
    })
    assert res.status_code == 200
    data = res.json()
    assert "instances_provisioned" in data
    assert data["performance_status"] == "Optimal"

    # Architecture
    res = client.get("/api/architecture?template=hybrid_dr")
    assert res.status_code == 200
    assert len(res.json()["nodes"]) >= 6

    # Reports
    res = client.get("/api/reports/summary?model=hybrid")
    assert res.status_code == 200
    assert "problem_statement" in res.json()
