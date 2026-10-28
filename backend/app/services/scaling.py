from backend.app.schemas import ScalabilityInput, ScalabilityOutput

def simulate_scaling(input_data: ScalabilityInput) -> ScalabilityOutput:
    model = input_data.deployment_model.lower()
    viewers = input_data.concurrent_viewers
    rps = input_data.requests_per_second
    burst = input_data.burst_multiplier
    base_units = input_data.base_compute_capacity_units
    max_units = input_data.max_scalable_units
    db_limit = input_data.db_connections_limit
    threshold = input_data.utilization_threshold_pct

    # Workload score (0-100)
    effective_viewers = int(viewers * burst)
    effective_rps = int(rps * burst)
    workload_score = min(100.0, round((effective_viewers / 100000.0) * 50 + (effective_rps / 50000.0) * 50, 1))

    # Required compute units calculation: ~2,500 viewers or 1,200 RPS per unit
    needed_units = max(1, int(max(effective_viewers / 2500, effective_rps / 1200)))

    # Compute utilization and scaling behavior by model
    if model == "public":
        # Elastic auto-scaling: spins up instances up to max_units
        instances_provisioned = min(max_units, max(base_units, needed_units))
        capacity_shortfall = max(0.0, round(((needed_units - instances_provisioned) / max(1, needed_units)) * 100, 1))
        compute_util = min(100.0, round((needed_units / max(1, instances_provisioned)) * 75.0, 1))
        scaling_action = f"Auto-scaled from {base_units} to {instances_provisioned} cloud instances (CloudWatch metric trigger)."
        performance = "Optimal" if capacity_shortfall == 0 else "Degraded (Hit Max Scale Limit)"
        elasticity_rating = "Excellent (Native Elasticity)"
        cost_change = (instances_provisioned - base_units) * 65.0
        explanation = (
            "Public Cloud Elasticity dynamically added compute instances to accommodate the traffic surge. "
            "Resource pooling allowed immediate allocation without procuring physical servers."
        )

    elif model == "private":
        # Hard hardware boundary at base_units (cannot exceed owned servers!)
        instances_provisioned = base_units
        capacity_shortfall = max(0.0, round(((needed_units - base_units) / max(1, needed_units)) * 100, 1))
        compute_util = min(100.0, round((needed_units / max(1, base_units)) * 85.0, 1))
        scaling_action = f"Scaling BLOCKED. Fixed datacenter capacity ceiling: {base_units} physical servers."
        performance = "Optimal" if capacity_shortfall < 10 else ("Degraded" if capacity_shortfall < 40 else "Throttled (503 Service Unavailable)")
        elasticity_rating = "None (Fixed Hardware Limits)"
        cost_change = 0.0 # No on-demand cost change, but lost subscriber revenue
        explanation = (
            "Private Cloud lacks elasticity. Workload exceeded the physical server capacity ceiling. "
            f"Resulted in {capacity_shortfall}% capacity shortfall and high response latencies."
        )

    else: # hybrid
        # Private handles base, public cloud bursts for excess
        overflow_needed = max(0, needed_units - base_units)
        burst_provisioned = min(max_units - base_units, overflow_needed)
        instances_provisioned = base_units + burst_provisioned
        capacity_shortfall = max(0.0, round(((needed_units - instances_provisioned) / max(1, needed_units)) * 100, 1))
        compute_util = min(100.0, round((needed_units / max(1, instances_provisioned)) * 78.0, 1))
        scaling_action = f"Private base: {base_units} nodes (100% utilized) + Hybrid Cloud Burst: {burst_provisioned} on-demand nodes provisioned."
        performance = "Optimal" if capacity_shortfall == 0 else "Degraded"
        elasticity_rating = "High (Hybrid Cloud Bursting)"
        cost_change = burst_provisioned * 60.0
        explanation = (
            "Hybrid Cloud demonstrated Cloud Bursting: Steady-state baseline workload ran on owned hardware, "
            "while sudden peak streaming demand was seamlessly absorbed by public cloud compute instances."
        )

    # Database load & connection calculation
    db_connections_used = min(db_limit * 2, int(effective_viewers * 0.04))
    db_load_pct = min(100.0, round((db_connections_used / max(1, db_limit)) * 100, 1))
    storage_util = min(98.0, round(45.0 + (burst * 4.5), 1))

    return ScalabilityOutput(
        deployment_model=model,
        workload_score=workload_score,
        effective_concurrent_viewers=effective_viewers,
        effective_rps=effective_rps,
        compute_utilization_pct=compute_util,
        storage_utilization_pct=storage_util,
        db_connections_used=db_connections_used,
        db_load_pct=db_load_pct,
        capacity_shortfall_pct=capacity_shortfall,
        instances_provisioned=instances_provisioned,
        scaling_action_taken=scaling_action,
        performance_status=performance,
        estimated_cost_change_usd=round(cost_change, 2),
        elasticity_rating=elasticity_rating,
        explanation=explanation
    )
