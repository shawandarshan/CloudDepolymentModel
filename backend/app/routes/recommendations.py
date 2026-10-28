from fastapi import APIRouter
from backend.app.schemas import WeightCriteria, RecommendationOutput
from backend.app.services.scoring import calculate_recommendation

router = APIRouter(prefix="/api/recommendations", tags=["Risk & Recommendations"])

RISK_REGISTER = [
    {
        "id": "RISK-01",
        "name": "Single Point of Database Failure (Catastrophic Outage)",
        "severity": "Critical",
        "likelihood": "High",
        "business_impact": "Multi-day streaming downtime, SLA breaches, subscriber churn, loss of advertising revenue.",
        "related_characteristic": "On-Demand Self-Service & Elasticity",
        "mitigation": "Deploy automated multi-AZ or cross-cloud standby database replica with continuous replication and automatic health probe failovers.",
        "relevant_models": ["Public Cloud", "Hybrid Cloud"],
        "status": "Mitigated in Hybrid / Public (Failed in Private)"
    },
    {
        "id": "RISK-02",
        "name": "Exponentially Rising Storage Costs",
        "severity": "High",
        "likelihood": "Certain",
        "business_impact": "Rapid hardware depreciation, over-buying SAN capacity for worst-case projections, ballooning capital budgets.",
        "related_characteristic": "Resource Pooling & Elasticity",
        "mitigation": "Adopt tiered object storage with automated lifecycle rules (hot NVMe for active streams -> cold S3 Infrequent Access/Glacier for catalog back issues).",
        "relevant_models": ["Hybrid Cloud", "Public Cloud"],
        "status": "Mitigated via Cloud Storage Tiering"
    },
    {
        "id": "RISK-03",
        "name": "Viral Viewing Peaks Exceeding Fixed Server Capacity",
        "severity": "High",
        "likelihood": "High",
        "business_impact": "Streaming buffer stutter, 503 HTTP gateway errors during major sporting/live events, negative brand reputation.",
        "related_characteristic": "Elasticity (Auto-Scaling)",
        "mitigation": "Implement cloud bursting to dynamically spin up containerized video transcoders when CPU utilization exceeds 75%.",
        "relevant_models": ["Hybrid Cloud", "Public Cloud"],
        "status": "Mitigated via Elastic Bursting"
    },
    {
        "id": "RISK-04",
        "name": "Slow Physical Hardware Procurement & Staging",
        "severity": "Medium",
        "likelihood": "High",
        "business_impact": "6 to 12 week hardware supply chain delays when scaling or replacing broken server components.",
        "related_characteristic": "On-Demand Self-Service",
        "mitigation": "Use programmatic cloud APIs and Infrastructure-as-Code (Terraform) to spin up replacement instances in seconds.",
        "relevant_models": ["Public Cloud", "Hybrid Cloud"],
        "status": "Mitigated via Cloud APIs"
    },
    {
        "id": "RISK-05",
        "name": "Excessive Cloud Data Egress Invoicing",
        "severity": "Medium",
        "likelihood": "Medium",
        "business_impact": "Unpredictable monthly operational bills from high-bitrate video streaming out of cloud data centers.",
        "related_characteristic": "Resource Pooling (CDN Optimization)",
        "mitigation": "Retain core video egress on negotiated edge CDN and optimize transcode bitrates using modern AV1/HEVC codecs.",
        "relevant_models": ["Hybrid Cloud"],
        "status": "Protected via Hybrid Architecture"
    }
]

CASE_STUDY_MAPPINGS = [
    {
        "case_risk": "Risk 1: Database failure interrupts streaming services for days (Actual Incident)",
        "cloud_char": "On-Demand Self-Service & Elasticity",
        "how_it_helps": "On-demand self-service allows rapid automated provisioning of replacement DB nodes without manual datacenter hardware technicians. Elasticity accommodates spikes during transaction log replay.",
        "limitations": "CRITICAL QUALIFICATION: Neither characteristic independently guarantees database recovery. High availability requires active replication topology (Multi-AZ / WAL streaming), tested automated failover policies, and immutable backup snapshots.",
        "required_config": "Asynchronous replication to cloud standby, automated DNS/VIP failover, 15-minute RPO snapshot schedule."
    },
    {
        "case_risk": "Risk 2: Storage and infrastructure costs continue to increase exponentially",
        "cloud_char": "Resource Pooling & Elasticity",
        "how_it_helps": "Resource pooling shares underlying hyperscaler disk arrays across millions of customers, driving economies of scale. Elasticity allows dynamic scaling of provisioned volume sizes without upfront hardware over-allocation.",
        "limitations": "Raw cloud storage without lifecycle governance can become expensive due to data egress and API call fees.",
        "required_config": "Object lifecycle management rules (S3 Intelligent-Tiering / Glacier), retention expirations for temporary transcode caches, capacity monitoring."
    },
    {
        "case_risk": "Risk 3: Traffic demand changes substantially during peak streaming hours",
        "cloud_char": "Elasticity",
        "how_it_helps": "Dynamically scales out compute instances during peak viewer surges (e.g. 8 PM prime time) and scales in during early morning hours (e.g. 4 AM) to eliminate idle infrastructure waste.",
        "limitations": "Scaling triggers must be properly tuned to avoid thrashing. Cold-start latency of container instances must be mitigated via warm standby pools.",
        "required_config": "Target-tracking scaling policies on CPU (>70%) and request latency (<150ms)."
    },
    {
        "case_risk": "Risk 4: Provisioning replacement hardware takes weeks in physical datacenters",
        "cloud_char": "On-Demand Self-Service",
        "how_it_helps": "Authorized cloud engineers and automation scripts can provision configured virtual machines, managed databases, and storage buckets instantly via API or CLI without waiting for physical vendor procurement.",
        "limitations": "Requires strict IAM role-based access control and budget guardrails to prevent unauthorized or runaway resource creation.",
        "required_config": "Terraform / OpenTofu templates, CI/CD automated deployment pipelines, AWS Organizations Service Control Policies (SCPs)."
    }
]

@router.get("", response_model=RecommendationOutput)
def get_default_recommendation():
    weights = WeightCriteria(
        cost=25.0,
        availability=25.0,
        recovery=20.0,
        scalability=15.0,
        security=5.0,
        control=5.0,
        simplicity=5.0
    )
    return calculate_recommendation(weights)

@router.post("/calculate", response_model=RecommendationOutput)
def recalculate_recommendation(weights: WeightCriteria):
    return calculate_recommendation(weights)

@router.get("/risks")
def get_risk_register():
    return {
        "risks": RISK_REGISTER,
        "case_study_mappings": CASE_STUDY_MAPPINGS
    }
