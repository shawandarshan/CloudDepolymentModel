from typing import Dict, List
from backend.app.schemas import (
    WeightCriteria, RecommendationOutput, ModelScoreDetail
)

# Raw characteristic ratings (0 to 100) based on cloud architecture capabilities
BASE_MODEL_RATINGS = {
    "public": {
        "cost": 84.0,         # Pay-as-you-go, low upfront, but data egress can add up
        "availability": 94.0, # 99.99% multi-region SLAs
        "recovery": 92.0,     # Rapid multi-AZ automated failover (<2 mins)
        "scalability": 98.0,  # Near-infinite elastic scaling on demand
        "security": 78.0,     # Shared responsibility model, requires cloud IAM discipline
        "control": 62.0,      # Underlying hypervisor/hardware opaque to customer
        "simplicity": 85.0    # Managed services reduce operational burden
    },
    "private": {
        "cost": 42.0,         # High capital expenditure, power, cooling, datacenter staff
        "availability": 72.0, # Limited by physical datacenter redundant power/ISP
        "recovery": 45.0,     # Manual hardware replacement, offsite tape backup lag (days)
        "scalability": 38.0,  # Hard ceiling fixed by purchased server racks
        "security": 96.0,     # Isolated physical hardware, complete data sovereign residency
        "control": 98.0,      # Total control over firmware, hypervisors, networks
        "simplicity": 40.0    # High operational complexity, dedicated 24/7 staff required
    },
    "hybrid": {
        "cost": 86.0,         # Cost-effective: private steady-state base + cheap cloud burst & S3 tiering
        "availability": 96.0, # Active-active or pilot-light cloud failover across boundaries
        "recovery": 95.0,     # Rapid cloud standby replica failover (<4 mins), isolated DR domain
        "scalability": 90.0,  # Burst overflow to cloud during peak viewer surges
        "security": 92.0,     # PII & user accounts retained in private core; media in public cloud
        "control": 88.0,      # Complete governance over core catalog + cloud elasticity
        "simplicity": 74.0    # Requires hybrid interconnect management, but excellent balance
    }
}

MODEL_DISPLAY_NAMES = {
    "public": "Public Cloud (e.g. AWS / Azure / GCP)",
    "private": "Private Cloud (Dedicated On-Premises)",
    "hybrid": "Hybrid Cloud (Private Core + Cloud DR & Burst)"
}

def calculate_recommendation(weights: WeightCriteria) -> RecommendationOutput:
    # Normalize weights so sum equals 100
    raw_weights = {
        "cost": max(0.0, weights.cost),
        "availability": max(0.0, weights.availability),
        "recovery": max(0.0, weights.recovery),
        "scalability": max(0.0, weights.scalability),
        "security": max(0.0, weights.security),
        "control": max(0.0, weights.control),
        "simplicity": max(0.0, weights.simplicity),
    }
    total_weight = sum(raw_weights.values())
    if total_weight <= 0:
        total_weight = 1.0

    normalized_weights = {k: v / total_weight for k, v in raw_weights.items()}

    # Compute weighted scores for each model
    score_details: List[ModelScoreDetail] = []
    model_totals: Dict[str, float] = {}

    for model, ratings in BASE_MODEL_RATINGS.items():
        total = 0.0
        subscores = {}
        for criteria, weight_fraction in normalized_weights.items():
            sub = ratings[criteria] * weight_fraction
            subscores[criteria] = round(sub, 2)
            total += sub
        model_totals[model] = round(total, 2)
        score_details.append(ModelScoreDetail(
            model=model,
            name=MODEL_DISPLAY_NAMES[model],
            total_score=round(total, 2),
            rank=0, # set after sorting
            subscores=subscores
        ))

    # Sort descending by total score
    score_details.sort(key=lambda x: x.total_score, reverse=True)
    for idx, item in enumerate(score_details):
        item.rank = idx + 1

    winner_model = score_details[0].model
    winner_name = MODEL_DISPLAY_NAMES[winner_model]

    # Generate dynamic, evidence-based narrative justification based on winning model & weights
    if winner_model == "hybrid":
        summary = (
            "Based on the weighted decision matrix, Hybrid Cloud emerges as the optimal architecture "
            f"with a composite score of {model_totals['hybrid']}/100. It directly resolves the streaming company's "
            "catastrophic database outage by introducing an automated Cloud Standby Replica while arresting rising "
            "storage expenditures through tiered S3 cloud media lifecycle rules."
        )
        reasons = [
            f"Disaster Recovery Excellence: Scored {BASE_MODEL_RATINGS['hybrid']['recovery']}/100 in recovery due to cross-cloud pilot-light standby database, achieving <4 minute RTO vs 48+ hours on-premises.",
            "Cost Optimization: Combining existing amortized on-premises base capacity with elastic cloud burst eliminates over-provisioning waste.",
            "Security & Compliance: Subscriber billing profiles and licensing DRM stay on private infrastructure, while high-volume video bitstreams are distributed via public cloud CDNs.",
            "Elastic Scalability: Cloud burst auto-scales during unpredictable viral streaming events without purchasing unneeded physical server racks."
        ]
        tradeoffs = [
            "Network Interconnect Dependency: Requires high-reliability Direct Connect / Cloud Interconnect links with redundancy.",
            "Dual-Domain Operational Tooling: Infrastructure team must manage both on-premises hypervisors and cloud Terraform / IAM policies."
        ]
        remaining_risks = [
            "Data replication latency over WAN if direct fiber links experience packet loss.",
            "Egress data transfer costs if media routing between private core and cloud CDN is not tightly cached."
        ]
        dr_guidance = (
            "Deploy an asynchronous PostgreSQL/Aurora standby replica in a secondary cloud region with automated health-check "
            "failover. Supplement with hourly S3 snapshots retained for 30 days with object lock for ransomware protection."
        )
        migration_phases = [
            {"phase": "Phase 1: Cloud Storage Offload (Month 1-2)", "detail": "Migrate cold video catalog to Cloud S3 Infrequent Access. Keep hot streaming buffer in current SAN."},
            {"phase": "Phase 2: Cloud DR Pilot Light (Month 3-4)", "detail": "Provision standby PostgreSQL replica in AWS with automated replication stream and DNS health checks."},
            {"phase": "Phase 3: Hybrid Traffic Bursting (Month 5-6)", "detail": "Route edge client sessions through global CDN. Configure auto-scaling cloud video transcoders for peak hours."},
            {"phase": "Phase 4: Unified Observability (Month 7+)", "detail": "Consolidate monitoring with Prometheus/OpenTelemetry across on-prem datacenter and cloud VPC."}
        ]

    elif winner_model == "public":
        summary = (
            "Based on your configured emphasis on scalability, availability, and low operational overhead, "
            f"Public Cloud is the recommended model with a score of {model_totals['public']}/100. "
            "It completely eliminates physical datacenter maintenance, delegating infrastructure resiliency to hyperscale providers."
        )
        reasons = [
            f"Maximum Scalability ({BASE_MODEL_RATINGS['public']['scalability']}/100): True cloud elasticity allows instant provisioning of hundreds of video streaming instances.",
            "Managed High Availability: Multi-AZ database clustering guarantees 99.99% availability with automated sub-2 minute failover.",
            "Zero Datacenter Capex: Eliminates server hardware refresh cycles, power, cooling, and physical facility leases.",
            "Developer Velocity: On-demand self-service APIs allow engineers to spin up test staging environments in minutes."
        ]
        tradeoffs = [
            "Data Egress Costs: Video streaming generates massive outbound bandwidth that requires negotiated cloud volume tiers.",
            "Vendor Lock-in: Heavy adoption of proprietary managed services (RDS, DynamoDB, CloudFront) complicates future provider transitions."
        ]
        remaining_risks = [
            "Runaway cloud costs if auto-scaling quotas and budget alert guardrails are not strictly enforced.",
            "Shared responsibility compliance audits for strict broadcast media rights."
        ]
        dr_guidance = "Utilize Multi-AZ managed databases with cross-region read replicas. Automated failover occurs within 120 seconds."
        migration_phases = [
            {"phase": "Phase 1: Cloud Lift & Shift Assessment", "detail": "Audit current virtual machines, database schemas, and network dependencies."},
            {"phase": "Phase 2: Database Migration to Cloud RDS", "detail": "Establish continuous replication via AWS DMS / Database Migration Service to cloud target."},
            {"phase": "Phase 3: Full Cutover & Datacenter Decommission", "detail": "Flip DNS traffic to cloud load balancers and shut down physical hardware racks."}
        ]

    else: # private
        summary = (
            "Based on your high prioritization of physical control and security sovereignty, "
            f"Private Cloud was selected with a score of {model_totals['private']}/100. "
            "However, this model requires significant capital expenditure and active operational reforms to resolve the recent multi-day database disaster."
        )
        reasons = [
            f"Absolute Data Sovereignty & Control ({BASE_MODEL_RATINGS['private']['control']}/100): Zero shared tenant exposure; full compliance with strict regional broadcast licensing.",
            "Predictable Baseline Workload: For constant 24/7 non-fluctuating streaming loads, owned hardware avoids recurring per-hour cloud rental margins."
        ]
        tradeoffs = [
            "Severe Scalability Constraints: Inability to elastically handle viral traffic spikes beyond owned physical rack limits.",
            "Costly High Availability: Redundancy requires purchasing, powering, and maintaining duplicate idle physical hardware in a secondary facility."
        ]
        remaining_risks = [
            "Single Point of Failure: The original multi-day database disaster will recur unless a secondary physical datacenter is constructed.",
            "Hardware supply chain delays during catastrophic equipment breakdowns."
        ]
        dr_guidance = "Urgent requirement: Construct a secondary warm-standby physical datacenter facility connected by dark fiber to eliminate the single point of failure."
        migration_phases = [
            {"phase": "Phase 1: Datacenter Redundancy Overhaul", "detail": "Install redundant SAN controllers, dual power grids, and secondary ISP uplinks."},
            {"phase": "Phase 2: Local Clustering & Replication", "detail": "Deploy synchronous Pacemaker/Corosync database clustering across separate server racks."},
            {"phase": "Phase 3: Automated Off-Site Backup Vaulting", "detail": "Replace tape transport with encrypted daily network snapshot replication to an offsite colocation."}
        ]

    case_study_mapping = (
        "Case Study Mapping: 1) Database Multi-Day Outage -> Mitigated via On-demand self-service & Cloud Multi-AZ replication. "
        "2) Rising Storage Costs -> Mitigated via Resource Pooling & Tiered S3 lifecycle policies. "
        "3) Workload Fluctuation -> Mitigated via Elasticity (auto-scaling compute). "
        "4) Slow Hardware Provisioning -> Mitigated via On-Demand Self-Service APIs."
    )

    return RecommendationOutput(
        recommended_model=winner_model,
        winner_name=winner_name,
        scores=score_details,
        weights_used=raw_weights,
        executive_summary=summary,
        key_reasons=reasons,
        tradeoffs=tradeoffs,
        remaining_risks=remaining_risks,
        migration_phases=migration_phases,
        dr_guidance=dr_guidance,
        case_study_mapping_summary=case_study_mapping
    )
