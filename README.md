# CloudDepolymentModel

# StreamCloud Intelligence
> **Cloud Deployment Model & Disaster Recovery Simulator**  
> *Simulate. Compare. Optimize.*

A production-grade, interactive web application and decision-support prototype built for a university **Cloud Computing Case Study**.

StreamCloud Intelligence helps engineering leadership, cloud architects, and stakeholders evaluate **Public Cloud**, **Private Cloud**, and **Hybrid Cloud** deployment models to solve real-world infrastructure crises: catastrophic database failures, multi-day outages, and exponentially rising media storage costs.

---

## 🚀 Live Demo & Quick Start (macOS / Linux)

### One-Command Startup
The project includes an automated startup script that launches both the **FastAPI backend** and the **Vite React frontend** simultaneously:

```bash
# 1. Clone repository
git clone https://github.com/shawandarshan/CloudDepolymentModel.git
cd CloudDepolymentModel

# 2. Make startup scripts executable & launch
chmod +x start.sh run_tests.sh
./start.sh
```

### Access URLs
| Service | URL | Description |
| :--- | :--- | :--- |
| **Frontend Web App** | [http://localhost:5173](http://localhost:5173) | Interactive SaaS Analytics & Simulator Dashboard |
| **Backend REST API** | [http://localhost:8000](http://localhost:8000) | Python FastAPI with SQLite persistence |
| **Interactive API Docs** | [http://localhost:8000/docs](http://localhost:8000/docs) | Swagger UI for exploring all REST endpoints |

---

## 🧪 Verification & Automated Testing
To run the full end-to-end verification suite (Pytest backend test suite + TypeScript / Vite build validation):

```bash
./run_tests.sh
```

### Manual Individual Commands
If you prefer running services in separate terminal tabs:

#### 1. Backend (FastAPI + SQLite)
```bash
python3 -m pip install -r backend/requirements.txt
python3 -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### 2. Frontend (React + TypeScript + Vite)
```bash
cd frontend
npm install
npm run dev
```

---

## 🏛️ Case Study Background & Problem Statement

### The Fictional Streaming Company
**StreamPulse Media Networks** operates its own dedicated on-premises data centers. Recently, a severe primary database hardware failure unmounted disk volumes with **zero automated standby failover**, resulting in **over 54 hours of continuous streaming service outage** (Incident `INC-8921-CRISIS`). Simultaneously, unmanaged video asset library growth is causing on-premises SAN storage and operational staff expenditures to escalate unsustainably.

### Architectural Evaluation
The company must evaluate three deployment models:
1. **Public Cloud (AWS / Azure / GCP):** Multi-tenant hyperscale infrastructure offering near-infinite elasticity and automated Multi-AZ failover, but subject to high video egress bandwidth costs.
2. **Private Cloud (Dedicated On-Premises):** Total physical data sovereignty and hardware control, but crippled by capital expenditure (Capex) burdens and fixed capacity ceilings.
3. **Hybrid Cloud (Private Core + Cloud DR Standby):** Retains subscriber billing and DRM licensing in the private core while utilizing public cloud for asynchronous standby database replication (<4m RTO) and elastic peak transcoding bursts.

---

## 🗺️ Mapping Case Study Risks to NIST Cloud Characteristics

| Case Study Problem | NIST Cloud Characteristic | How It Helps | Crucial Architectural Qualification |
| :--- | :--- | :--- | :--- |
| **1. Database Multi-Day Outage** | **On-Demand Self-Service & Elasticity** | Programmatic APIs allow rapid provisioning of replacement database instances without manual datacenter hardware procurement. | **CRITICAL QUALIFICATION:** Cloud characteristics alone do NOT guarantee database recovery. True high availability requires active standby replication (WAL stream), automated DNS failover, and verified point-in-time snapshot backups. |
| **2. Rising Media Storage Expenses** | **Resource Pooling & Elasticity** | Hyperscaler resource pooling drives economies of scale ($0.023/GB vs $115/TB SAN). Elasticity eliminates purchasing 5-year hardware buffers in advance. | Requires automated lifecycle management rules (e.g. S3 Intelligent-Tiering / Glacier) to prevent unexpected retrieval and access tier fees. |
| **3. Prime-Time Viewer Surges** | **Elasticity** | Dynamically scales out video transcoding workers during the 8 PM – 10 PM viewer surge and scales down during off-peak hours. | Container tasks must be stateless, and warm standby pools should be maintained to mitigate cold-start initialization latency. |
| **4. Slow Physical Hardware Procurement** | **On-Demand Self-Service** | Authorized engineers provision replacement virtual machines, managed databases, or object storage buckets instantly via API or CLI. | Requires strict IAM role-based access control and budget guardrails to prevent unauthorized or runaway resource creation. |

---

## ✨ Application Features & Navigation

StreamCloud Intelligence features 9 fully functional pages with zero dead links or placeholders:

### 1. Overview Dashboard
- Executive KPI cards: Active Deployment Model, Availability SLA, Active Viewers, Storage Consumed vs Provisioned, Estimated Monthly Cost (in INR ₹ or USD $), and Last Recovery Duration.
- 24-hour streaming traffic & bandwidth curve chart.
- Monthly cost comparison across Public, Private, and Hybrid models.
- Recent incident history table detailing the case study crisis and simulated events.

### 2. Cloud Model Comparison
- 17-criteria evaluation matrix covering Financial, Disaster Recovery, Scalability, Governance, and Operations.
- Interactive Recharts Radar Chart comparing capabilities across 7 architectural pillars.
- Expandable assumptions detailing case study technical rationale.

### 3. Disaster Recovery Lab (Core Feature)
- Interactive node topology canvas (Edge CDN → App Cluster → Primary DB → Cloud Standby DB → Media Storage → Backup Vault → Cloud Pilot Light).
- Failure injection controls: Primary DB Failure, Storage Volume Failure, Network Outage, Traffic Surge.
- 3 recovery configurations:
  - **Standby Replica with Auto-Failover:** Sub-4 minute RTO, sub-15 second RPO.
  - **Backup Restoration without Standby:** 45–180 minute RTO, RPO equal to backup frequency (1–24h).
  - **No Standby Replica (Original Case Study Fragility):** 48–72 hours downtime, catastrophic SLA breach.
- Animated real-time recovery workflow with progress bar, step-by-step incident log, and breach detection.
- Deep dive distinguishing database replicas (rapid failover) from backups (point-in-time corruption recovery).

### 4. Cost Explorer & 12-Month Forecast
- Interactive input sliders: Compute Instances, Storage (TB), Monthly Growth %, Data Transfer (TB), Active Users, Database Instances, Support Tier, and On-Premises Baseline.
- Itemized cost breakdown: Compute, Storage, Network Egress, Database, Backup/DR, and Support.
- 12-month compounding growth forecast chart.
- Baseline savings and break-even calculation.
- One-click CSV export of cost models.

### 5. Scalability Simulator
- Live workload sliders: Concurrent Viewers, API Requests/Sec (RPS), and Traffic Surge Multiplier (1.0x to 4.0x).
- Dynamic performance status: Optimal vs Degraded vs Throttled (503 Service Unavailable).
- Demonstrates Public Cloud elasticity, Private Cloud hardware ceiling limits, and Hybrid Cloud bursting.

### 6. Architecture Designer
- Visual node canvas with failure-domain boundaries.
- 3 Predefined Architecture Templates:
  1. Traditional On-Premises
  2. Pure Public Cloud (AWS Multi-AZ)
  3. Hybrid Cloud with Disaster Recovery & Bursting
- Component Inspector side panel with latency, redundancy mode, and technical specifications.
- Text specification export.

### 7. Risk & Recommendation Center
- Multi-Criteria Decision Analysis (MCDA) weighted scoring engine.
- Interactive sliders for 7 criterion weights: Cost, Availability, Recovery/RTO, Scalability, Security, Control, and Simplicity.
- Dynamic written executive recommendation recalculated in real time based on weights.
- Enterprise Risk Register and Section 12 case study mapping table.

### 8. Reports & Export
- Formally synthesized university case study report.
- Clean `@media print` styling supporting native browser **Print / Save to PDF**.
- CSV data exports (Cost breakdown, Incident logs, Risk register).
- Complete scenario configuration export as JSON.

### 9. Settings & Simulation Data
- Company title configuration.
- Currency selector (defaults to INR ₹, supports USD $, EUR €, GBP £).
- Target RTO and RPO SLA threshold settings.
- Scenario import and export as JSON.
- Global Reset Demo control with confirmation modal.

---

## 🛠️ Technology Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Recharts.
- **Backend:** Python 3, FastAPI, SQLite, SQLAlchemy ORM, Pydantic v2.
- **Testing:** Pytest, HTTPX, TypeScript (`tsc -b`), Vite Build.
- **Resiliency:** Dual-mode architecture—connects to FastAPI backend over REST APIs, with automatic client-side in-browser simulation fallback (`localStorage`) if running offline.

---

## 📄 License & Academic Note
This project is prepared for educational and academic case study demonstration. All cost figures, recovery durations, and SLA numbers represent configurable illustrative estimates.
