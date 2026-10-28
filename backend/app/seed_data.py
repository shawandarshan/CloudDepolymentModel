import json
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from backend.app.models import (
    DeploymentModel, UserConfiguration, Incident, IncidentEvent,
    CostAssumption, SimulationScenario, InfrastructureComponent
)

def seed_database(db: Session):
    # 1. Check if already seeded
    if db.query(DeploymentModel).first():
        return

    # 2. Seed Deployment Models
    models = [
        DeploymentModel(
            id="public",
            name="Public Cloud",
            tagline="Multi-tenant hyperscale infrastructure (AWS, Azure, GCP)",
            description="Infrastructure owned and operated by a third-party cloud service provider. Delivers elastic scaling, pay-as-you-go pricing, and automated multi-zone disaster recovery.",
            setup_cost=5000.0,
            base_monthly_cost=6200.0,
            storage_cost_per_tb=23.5,
            compute_cost_per_unit=68.0,
            bandwidth_cost_per_tb=81.9,
            rto_minutes=2.0,
            rpo_minutes=0.5,
            availability_sla=99.99,
            scalability_score=98.0,
            security_score=78.0,
            control_score=62.0,
            simplicity_score=85.0,
            pros=json.dumps([
                "Near-infinite elasticity for sudden viral viewer surges",
                "Automated Multi-AZ database failover (<2 mins RTO)",
                "No capital hardware investment or datacenter facility costs",
                "Global Content Delivery Network (CDN) edge points of presence"
            ]),
            cons=json.dumps([
                "High data egress bandwidth costs for high-bitrate 4K streaming",
                "Potential vendor lock-in to proprietary cloud APIs",
                "Shared-tenant multi-tenancy may require extra security audits"
            ]),
            suitable_use_cases="Unpredictable viewer traffic, rapid global expansion, startups, and bursty streaming events."
        ),
        DeploymentModel(
            id="private",
            name="Private Cloud",
            tagline="Dedicated single-tenant infrastructure in owned data centers",
            description="Infrastructure provisioned for exclusive use by a single organization. Offers total physical control and zero multi-tenancy, but suffers from capital expense burdens and rigid capacity ceilings.",
            setup_cost=180000.0,
            base_monthly_cost=18500.0,
            storage_cost_per_tb=115.0,
            compute_cost_per_unit=140.0,
            bandwidth_cost_per_tb=65.0,
            rto_minutes=2880.0, # 48 hours without active secondary DC
            rpo_minutes=1440.0, # 24 hours tape lag
            availability_sla=94.50,
            scalability_score=38.0,
            security_score=96.0,
            control_score=98.0,
            simplicity_score=40.0,
            pros=json.dumps([
                "Complete governance over hardware, hypervisors, and data residency",
                "Predictable cost structure for continuous steady-state baseline compute",
                "Zero risk of 'noisy neighbor' interference on physical host buses"
            ]),
            cons=json.dumps([
                "Catastrophic failure risk if single database or SAN lacks live replica",
                "High upfront capital expenditure (servers, SAN, power, cooling)",
                "Zero elasticity: Cannot scale beyond physical rack capacity ceiling"
            ]),
            suitable_use_cases="Strict government data residency mandates, fixed non-fluctuating workloads, specialized hardware requirements."
        ),
        DeploymentModel(
            id="hybrid",
            name="Hybrid Cloud",
            tagline="Private core data center coupled with elastic public cloud burst & DR",
            description="Composition of private infrastructure and public cloud environments bound together by standardized network interconnects. Keeps subscriber data in the private core while utilizing public cloud for DRM transcoding bursts and disaster recovery.",
            setup_cost=35000.0,
            base_monthly_cost=8400.0,
            storage_cost_per_tb=35.0,
            compute_cost_per_unit=78.0,
            bandwidth_cost_per_tb=45.0,
            rto_minutes=3.5,
            rpo_minutes=0.25,
            availability_sla=99.95,
            scalability_score=90.0,
            security_score=92.0,
            control_score=88.0,
            simplicity_score=74.0,
            pros=json.dumps([
                "Solves single point of failure via Cloud Standby DB replica (<4 min RTO)",
                "Arrests rising storage costs by tiering cold video archives into Cloud S3",
                "Preserves sensitive subscriber PII & licensing in private core",
                "Cloud bursting absorbs viral streaming traffic without over-buying servers"
            ]),
            cons=json.dumps([
                "Requires reliable dedicated network interconnect (Direct Connect / ExpressRoute)",
                "Operational complexity: Engineering team must manage hybrid tooling"
            ]),
            suitable_use_cases="Video streaming platforms migrating from legacy data centers, organizations seeking disaster recovery resilience without discarding existing hardware."
        )
    ]
    db.add_all(models)

    # 3. Seed Default User Configuration
    config = UserConfiguration(
        company_name="StreamPulse Media Networks",
        currency="INR",
        currency_symbol="₹",
        exchange_rate_to_inr=83.5,
        rto_target_minutes=15.0,
        rpo_target_minutes=15.0,
        backup_frequency_hours=4.0,
        replication_lag_seconds=15.0,
        failover_policy="Automatic Cloud Multi-AZ"
    )
    db.add(config)

    # 4. Seed Historical Incidents (including the actual case study crisis!)
    past_time = datetime.utcnow() - timedelta(days=14)
    case_study_incident = Incident(
        incident_code="INC-8921-CRISIS",
        title="CASE STUDY: Primary Database SAN Crash (On-Premises Baseline)",
        model="private",
        scenario_type="database_failure",
        recovery_config="no_standby",
        severity="Critical",
        start_time=past_time,
        end_time=past_time + timedelta(hours=54),
        downtime_minutes=3240.0, # 54 hours
        rto_target_minutes=60.0,
        rpo_target_minutes=60.0,
        simulated_rto_minutes=3240.0,
        simulated_rpo_minutes=1440.0,
        rto_breached=True,
        rpo_breached=True,
        affected_users=35000,
        data_loss_estimate="24+ hours catalog changes & viewing watch history",
        status="Resolved",
        summary="Historical incident that prompted this Cloud Architecture review. Primary database hardware corrupted without a standby replica. Streaming service was offline for over 2 days."
    )
    db.add(case_study_incident)
    db.flush()

    events = [
        IncidentEvent(incident_id=case_study_incident.id, step_offset_seconds=0, severity="err", message="[Day 0 08:00] SAN Disk Controller failure unmounted primary PostgreSQL partition."),
        IncidentEvent(incident_id=case_study_incident.id, step_offset_seconds=1800, severity="err", message="[Day 0 08:30] Standby replica: NONE CONFIGURED. Streaming application server pool failed."),
        IncidentEvent(incident_id=case_study_incident.id, step_offset_seconds=28800, severity="warn", message="[Day 0 16:00] Backup tape retrieval initiated from physical offsite secure vault."),
        IncidentEvent(incident_id=case_study_incident.id, step_offset_seconds=86400, severity="warn", message="[Day 1 08:00] Replacement SAN controller hardware delivered to datacenter floor."),
        IncidentEvent(incident_id=case_study_incident.id, step_offset_seconds=194400, severity="ok", message="[Day 2 14:00] Service restored from tape backup. Severe customer churn observed.")
    ]
    db.add_all(events)

    # 5. Seed Infrastructure Components
    components = [
        InfrastructureComponent(id="cdn", name="Global Edge CDN", category="network", domain="edge", status="Healthy", latency_ms=18.0, capacity_pct=42.0, redundancy_mode="Anycast PoPs", description="CloudFront / Fastly distributed edge caching nodes"),
        InfrastructureComponent(id="app_servers", name="Streaming Application Pool", category="compute", domain="hybrid", status="Healthy", latency_ms=35.0, capacity_pct=52.0, redundancy_mode="Auto-Scale Pool", description="Kubernetes cluster running HLS/DASH video packaging services"),
        InfrastructureComponent(id="primary_db", name="Primary Database (On-Prem)", category="database", domain="private", status="Healthy", latency_ms=4.0, capacity_pct=65.0, redundancy_mode="Primary Node", description="PostgreSQL 16 Enterprise Cluster with NVMe storage"),
        InfrastructureComponent(id="secondary_db", name="Cloud DR Standby DB (AWS)", category="database", domain="public", status="Standby", latency_ms=12.0, capacity_pct=30.0, redundancy_mode="Hot Standby", description="Continuous WAL streaming replication over Direct Connect"),
        InfrastructureComponent(id="media_storage", name="Tiered Video Storage (S3 / SAN)", category="storage", domain="public", status="Healthy", latency_ms=25.0, capacity_pct=68.0, redundancy_mode="Cross-AZ Replicated", description="Hot catalog on NVMe, archive seasons tiered to S3 Infrequent Access"),
        InfrastructureComponent(id="backup_repo", name="Cloud Snapshot Backup Vault", category="backup", domain="public", status="Healthy", latency_ms=50.0, capacity_pct=45.0, redundancy_mode="Immutable Object Lock", description="Automated point-in-time snapshots with 30-day retention")
    ]
    db.add_all(components)

    # 6. Seed Default Simulation Scenario
    scenario = SimulationScenario(
        name="Production Hybrid Cloud Baseline",
        description="Standard operating environment with 25,000 active viewers, 12 TB video storage, and Cloud Pilot-Light DR enabled.",
        is_default=True,
        data=json.dumps({
            "model": "hybrid",
            "active_users": 25000,
            "storage_tb": 12.0,
            "monthly_storage_growth_pct": 8.0,
            "monthly_data_transfer_tb": 45.0,
            "rto_target_minutes": 15.0,
            "rpo_target_minutes": 15.0,
            "recovery_config": "standby_failover"
        })
    )
    db.add(scenario)

    db.commit()
