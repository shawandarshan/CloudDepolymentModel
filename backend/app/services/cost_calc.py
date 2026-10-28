from typing import List, Dict
from backend.app.schemas import (
    CostCalculationInput, CostCalculationOutput, CostBreakdownItem, MonthProjection
)

RATES_USD = {
    "public": {
        "compute_hour": 0.096,  # 4 vCPU / 16 GB instance
        "storage_gb": 0.023,
        "egress_gb": 0.08,
        "db_hour": 0.28,
        "backup_gb": 0.015,
        "support_pct": 0.05,
    },
    "private": {
        "compute_overhead_per_inst": 55.0, # power, rack space, maintenance
        "storage_tb_month": 115.0,         # SAN depreciation & maintenance
        "bandwidth_fixed": 2800.0,         # Dedicated leased circuit
        "db_license_per_instance": 1400.0, # Enterprise DB license
        "backup_maintenance": 1800.0,      # Tape storage, robot arms, offsite transport
        "datacenter_staff_support": 4200.0,# Hardware engineers & facility maintenance
    },
    "hybrid": {
        "private_compute_split": 0.60,     # 60% private steady-state, 40% public burst
        "tiered_storage_hot_gb": 0.025,
        "tiered_storage_cold_gb": 0.0125,
        "cdn_egress_gb": 0.042,            # CDN volume discount
        "direct_connect_fee": 1200.0,
        "hybrid_db_split": 0.65,
        "cloud_pilot_light_dr": 650.0,
        "hybrid_support": 1950.0,
    }
}

EXCHANGE_RATES = {
    "INR": 83.5,
    "USD": 1.0,
    "EUR": 0.92,
    "GBP": 0.79
}

SYMBOLS = {
    "INR": "₹",
    "USD": "$",
    "EUR": "€",
    "GBP": "£"
}

def calculate_model_monthly_cost(input_data: CostCalculationInput, target_model: str) -> Dict[str, float]:
    hours_per_month = 730
    storage_gb = input_data.storage_tb * 1024
    backup_gb = input_data.backup_storage_tb * 1024
    egress_gb = input_data.monthly_data_transfer_tb * 1024

    if target_model == "public":
        # Compute: on-demand instances with auto-scaling headroom
        compute_cost = input_data.compute_instances * hours_per_month * RATES_USD["public"]["compute_hour"]
        # Storage: S3 Standard tier
        storage_cost = storage_gb * RATES_USD["public"]["storage_gb"]
        # Egress: Internet data out
        egress_cost = egress_gb * RATES_USD["public"]["egress_gb"]
        # Database: Managed multi-AZ RDS
        db_cost = input_data.db_instances * hours_per_month * RATES_USD["public"]["db_hour"]
        # Backup: S3 Glacier & automated daily snapshots
        backup_cost = backup_gb * RATES_USD["public"]["backup_gb"]
        # Support: Cloud Business Support tier
        subtotal_before_support = compute_cost + storage_cost + egress_cost + db_cost + backup_cost
        support_cost = max(input_data.support_fixed_monthly, subtotal_before_support * RATES_USD["public"]["support_pct"])

    elif target_model == "private":
        # Amortized hardware Capex
        amortized_capex = input_data.private_capex_hardware / max(12, input_data.amortization_months)
        compute_cost = amortized_capex + (input_data.compute_instances * RATES_USD["private"]["compute_overhead_per_inst"])
        # Storage: Fixed SAN arrays
        storage_cost = input_data.storage_tb * RATES_USD["private"]["storage_tb_month"]
        # Egress: Fixed leased transit lines
        egress_cost = RATES_USD["private"]["bandwidth_fixed"]
        # Database: Per-core enterprise licensing
        db_cost = input_data.db_instances * RATES_USD["private"]["db_license_per_instance"]
        # Backup: Tape libraries and off-site courier
        backup_cost = RATES_USD["private"]["backup_maintenance"]
        # Support: Facility power, cooling, on-prem hardware techs
        support_cost = RATES_USD["private"]["datacenter_staff_support"]

    else: # hybrid
        # Compute: steady private core + elastic public burst
        split_p = RATES_USD["hybrid"]["private_compute_split"]
        private_part = (input_data.private_capex_hardware * 0.5 / max(12, input_data.amortization_months)) + \
                       (input_data.compute_instances * split_p * 40.0)
        public_burst = (input_data.compute_instances * (1 - split_p) * hours_per_month * RATES_USD["public"]["compute_hour"] * 1.1)
        compute_cost = private_part + public_burst

        # Storage: Hot DB on private NVMe + video media assets tiered in Cloud S3
        hot_gb = storage_gb * 0.3
        cold_gb = storage_gb * 0.7
        storage_cost = (hot_gb * RATES_USD["hybrid"]["tiered_storage_hot_gb"]) + \
                       (cold_gb * RATES_USD["hybrid"]["tiered_storage_cold_gb"])

        # Egress: Edge CDN distribution + direct connect interconnect
        egress_cost = (egress_gb * RATES_USD["hybrid"]["cdn_egress_gb"]) + RATES_USD["hybrid"]["direct_connect_fee"]

        # Database: On-prem primary + low-cost cloud read replica for DR
        db_cost = (input_data.db_instances * 750.0) + (hours_per_month * RATES_USD["public"]["db_hour"])

        # Backup & DR: Cloud pilot-light DR environment + S3 lifecycle backup
        backup_cost = (backup_gb * 0.014) + RATES_USD["hybrid"]["cloud_pilot_light_dr"]

        # Support: Hybrid tooling + cloud support
        support_cost = RATES_USD["hybrid"]["hybrid_support"]

    # Round individual items cleanly
    compute_cost = round(compute_cost, 2)
    storage_cost = round(storage_cost, 2)
    egress_cost = round(egress_cost, 2)
    db_cost = round(db_cost, 2)
    backup_cost = round(backup_cost, 2)
    support_cost = round(support_cost, 2)
    total_cost = round(compute_cost + storage_cost + egress_cost + db_cost + backup_cost + support_cost, 2)

    return {
        "compute": compute_cost,
        "storage": storage_cost,
        "egress": egress_cost,
        "database": db_cost,
        "backup": backup_cost,
        "support": support_cost,
        "total": total_cost
    }

def calculate_costs(input_data: CostCalculationInput) -> CostCalculationOutput:
    currency = input_data.currency.upper()
    rate = EXCHANGE_RATES.get(currency, 83.5)
    symbol = SYMBOLS.get(currency, "₹")

    # Calculate for selected model
    selected_model = input_data.model.lower()
    selected_costs = calculate_model_monthly_cost(input_data, selected_model)

    # Calculate for all three models for comparison
    all_models_usd = {
        "public": calculate_model_monthly_cost(input_data, "public")["total"],
        "private": calculate_model_monthly_cost(input_data, "private")["total"],
        "hybrid": calculate_model_monthly_cost(input_data, "hybrid")["total"],
    }
    all_models_display = {k: round(v * rate, 2) for k, v in all_models_usd.items()}

    monthly_usd = selected_costs["total"]
    monthly_display = round(monthly_usd * rate, 2)
    annual_display = round(monthly_display * 12, 2)
    cost_per_1k_users = round((monthly_display / max(1, input_data.active_users)) * 1000, 2)
    cost_per_tb = round(monthly_display / max(0.1, input_data.storage_tb), 2)

    # Baseline comparison (on-prem baseline)
    baseline_display = round(input_data.onprem_baseline_monthly * (rate if currency == "INR" else 1.0), 2)
    monthly_savings = round(baseline_display - monthly_display, 2)
    annual_savings = round(monthly_savings * 12, 2)

    # Break-even calculation (if private or hybrid has upfront capex vs onprem)
    break_even_months = None
    if monthly_savings > 0 and selected_model == "hybrid":
        upfront_migration = 35000.0 * rate
        break_even_months = round(upfront_migration / monthly_savings, 1)

    # Breakdown items
    breakdown_items: List[CostBreakdownItem] = []
    category_labels = [
        ("Compute Infrastructure", "compute", "Instances, CPU, memory, power & cooling"),
        ("Storage Subsystem", "storage", "Hot media files, NVMe/SAN, object tiers"),
        ("Network & Data Transfer", "egress", "Content delivery, egress bandwidth, transit"),
        ("Database Engine", "database", "Instances, clustering, engine licensing"),
        ("Disaster Recovery & Backup", "backup", "Snapshots, cold archive, standby replicas"),
        ("Support & Operations", "support", "SLA coverage, engineer on-call, tooling"),
    ]

    for label, key, desc in category_labels:
        amt_usd = selected_costs[key]
        amt_disp = round(amt_usd * rate, 2)
        pct = round((amt_usd / max(1.0, monthly_usd)) * 100, 1)
        breakdown_items.append(CostBreakdownItem(
            category=label,
            amount_usd=amt_usd,
            amount_display=amt_disp,
            percentage=pct,
            description=desc
        ))

    # 12-Month Projection with compound monthly storage growth
    projections: List[MonthProjection] = []
    current_storage = input_data.storage_tb
    growth_multiplier = 1.0 + (input_data.monthly_storage_growth_pct / 100.0)

    for m in range(1, 13):
        # Temp copy for projection
        temp_input = input_data.model_copy()
        temp_input.storage_tb = round(current_storage, 2)
        pub = calculate_model_monthly_cost(temp_input, "public")["total"] * rate
        prv = calculate_model_monthly_cost(temp_input, "private")["total"] * rate
        hyb = calculate_model_monthly_cost(temp_input, "hybrid")["total"] * rate

        projections.append(MonthProjection(
            month=m,
            storage_tb=round(current_storage, 1),
            public_cost=round(pub, 2),
            private_cost=round(prv, 2),
            hybrid_cost=round(hyb, 2),
            onprem_baseline=baseline_display
        ))
        current_storage *= growth_multiplier

    return CostCalculationOutput(
        model=selected_model,
        currency=currency,
        currency_symbol=symbol,
        monthly_cost_usd=monthly_usd,
        monthly_cost_display=monthly_display,
        annual_cost_display=annual_display,
        cost_per_1k_users_display=cost_per_1k_users,
        cost_per_tb_display=cost_per_tb,
        monthly_savings_vs_baseline_display=monthly_savings,
        annual_savings_vs_baseline_display=annual_savings,
        break_even_months=break_even_months,
        breakdown=breakdown_items,
        twelve_month_projection=projections,
        all_models_comparison=all_models_display,
        is_simulation_estimate=True
    )
