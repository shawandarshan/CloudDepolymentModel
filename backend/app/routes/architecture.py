from typing import List, Dict, Any
from fastapi import APIRouter
from backend.app.schemas import ArchitectureLayout, ArchNode, ArchEdge

router = APIRouter(prefix="/api/architecture", tags=["Architecture Designer"])

TEMPLATES = {
    "traditional_onprem": ArchitectureLayout(
        template_name="Traditional On-Premises Datacenter",
        deployment_model="private",
        failure_domain_description="Single Physical Datacenter Failure Domain: Susceptible to localized power grid outages, fiber cuts, and catastrophic SAN RAID failures.",
        nodes=[
            ArchNode(id="clients", name="Streaming Viewers", type="cdn", domain="edge", x=80, y=180, status="Healthy", properties={"protocol": "HLS / DASH", "connections": "25,000 active"}),
            ArchNode(id="firewall", name="Hardware Firewall & LB", type="network", domain="private", x=260, y=180, status="Healthy", properties={"model": "F5 BIG-IP", "throughput": "10 Gbps"}),
            ArchNode(id="app_pool", name="App Server Rack (8x)", type="app", domain="private", x=440, y=180, status="Healthy", properties={"cpus": "64 Cores", "ram": "256 GB", "capacity": "Fixed ceiling"}),
            ArchNode(id="primary_db", name="Primary Database (SPOF)", type="db", domain="private", x=620, y=100, status="Healthy", properties={"engine": "PostgreSQL 16", "ha_mode": "None (Single Point of Failure)", "storage": "Local SAN"}),
            ArchNode(id="san_storage", name="SAN Media Storage", type="storage", domain="private", x=620, y=260, status="Healthy", properties={"capacity": "16 TB Fixed", "technology": "Fiber Channel SAN"}),
            ArchNode(id="tape_backup", name="Offsite Tape Backup", type="backup", domain="private", x=800, y=100, status="Healthy", properties={"frequency": "Daily 24h", "recovery_speed": "48+ Hours manual"})
        ],
        edges=[
            ArchEdge(id="e1", from_node="clients", to_node="firewall", label="HTTPS / TLS"),
            ArchEdge(id="e2", from_node="firewall", to_node="app_pool", label="Internal LAN"),
            ArchEdge(id="e3", from_node="app_pool", to_node="primary_db", label="SQL Queries"),
            ArchEdge(id="e4", from_node="app_pool", to_node="san_storage", label="NFS / iSCSI"),
            ArchEdge(id="e5", from_node="primary_db", to_node="tape_backup", label="Nightly Dump", style="dashed")
        ]
    ),
    "pure_public": ArchitectureLayout(
        template_name="Hyperscale Public Cloud (AWS / Multi-AZ)",
        deployment_model="public",
        failure_domain_description="Hyperscale Multi-Region Failure Domain: Independent Availability Zones in us-east-1 (Zone A, B, C) with automated failover and regional decoupling.",
        nodes=[
            ArchNode(id="clients", name="Global Viewers", type="cdn", domain="edge", x=80, y=180, status="Healthy", properties={"cdn": "Amazon CloudFront", "pops": "450+ Edge Locations"}),
            ArchNode(id="alb", name="Application Load Balancer", type="network", domain="public", x=260, y=180, status="Healthy", properties={"type": "AWS ALB", "health_checks": "HTTP 200 every 10s"}),
            ArchNode(id="ecs_fargate", name="Elastic App Containers (Auto-Scale)", type="app", domain="public", x=440, y=180, status="Healthy", properties={"orchestrator": "AWS ECS Fargate", "min_tasks": 6, "max_tasks": 50}),
            ArchNode(id="rds_primary", name="Amazon Aurora RDS (Primary)", type="db", domain="public", x=620, y=80, status="Healthy", properties={"zone": "us-east-1a", "mode": "Multi-AZ Synchronous"}),
            ArchNode(id="rds_standby", name="Amazon Aurora RDS (Standby)", type="db", domain="public", x=620, y=180, status="Standby", properties={"zone": "us-east-1b", "auto_failover": "< 60 seconds"}),
            ArchNode(id="s3_storage", name="Amazon S3 Standard Video Bucket", type="storage", domain="public", x=440, y=300, status="Healthy", properties={"durability": "99.999999999%", "replication": "Cross-Region"}),
            ArchNode(id="glacier_backup", name="S3 Glacier Flexible Archive", type="backup", domain="public", x=640, y=300, status="Healthy", properties={"lifecycle": "Auto-transition after 90 days", "cost": "$0.0036/GB"})
        ],
        edges=[
            ArchEdge(id="e1", from_node="clients", to_node="alb", label="Edge Routing"),
            ArchEdge(id="e2", from_node="alb", to_node="ecs_fargate", label="Private Subnet"),
            ArchEdge(id="e3", from_node="ecs_fargate", to_node="rds_primary", label="Read/Write"),
            ArchEdge(id="e4", from_node="rds_primary", to_node="rds_standby", label="Sync Replication", style="dashed"),
            ArchEdge(id="e5", from_node="ecs_fargate", to_node="s3_storage", label="S3 API"),
            ArchEdge(id="e6", from_node="s3_storage", to_node="glacier_backup", label="Lifecycle Rule", style="dashed")
        ]
    ),
    "hybrid_dr": ArchitectureLayout(
        template_name="Hybrid Cloud with Disaster Recovery & Bursting",
        deployment_model="hybrid",
        failure_domain_description="Hybrid Dual-Domain Architecture: Private core datacenter handles steady-state transcoding and subscriber billing; public cloud acts as an automated DR site and absorbs traffic spikes.",
        nodes=[
            ArchNode(id="clients", name="Global Viewers", type="cdn", domain="edge", x=80, y=180, status="Healthy", properties={"cdn": "Anycast Edge CDN", "routing": "Geo-DNS + Latency"}),
            ArchNode(id="onprem_gateway", name="Private Core Gateway", type="network", domain="private", x=260, y=110, status="Healthy", properties={"location": "Bangalore Datacenter", "link": "Direct Connect 10G"}),
            ArchNode(id="onprem_app", name="Private App Nodes (Steady)", type="app", domain="private", x=440, y=110, status="Healthy", properties={"role": "80% Base Load", "hosting": "Owned VMware/KVM"}),
            ArchNode(id="onprem_db", name="Primary Database (On-Prem)", type="db", domain="private", x=620, y=110, status="Healthy", properties={"engine": "PostgreSQL 16 Enterprise", "role": "Active Read/Write"}),
            ArchNode(id="cloud_burst", name="Cloud Burst Transcoders", type="app", domain="public", x=440, y=260, status="Standby", properties={"trigger": "CPU > 75%", "cloud": "AWS EC2 Spot / On-Demand"}),
            ArchNode(id="cloud_standby_db", name="Cloud DR Standby DB", type="db", domain="public", x=620, y=260, status="Standby", properties={"rto": "< 4 minutes", "rpo": "< 15 seconds", "replication": "Asynchronous WAL"}),
            ArchNode(id="cloud_s3_media", name="Tiered Cloud Media Storage", type="storage", domain="public", x=800, y=180, status="Healthy", properties={"policy": "Hot NVMe + Cold S3 Infrequent", "durability": "11 9s"})
        ],
        edges=[
            ArchEdge(id="e1", from_node="clients", to_node="onprem_gateway", label="Base Traffic"),
            ArchEdge(id="e2", from_node="clients", to_node="cloud_burst", label="Peak Overflow Burst", style="dashed"),
            ArchEdge(id="e3", from_node="onprem_gateway", to_node="onprem_app", label="Internal Bus"),
            ArchEdge(id="e4", from_node="onprem_app", to_node="onprem_db", label="SQL Connection"),
            ArchEdge(id="e5", from_node="onprem_db", to_node="cloud_standby_db", label="WAL Stream (Direct Connect)", style="dashed"),
            ArchEdge(id="e6", from_node="cloud_burst", to_node="cloud_standby_db", label="Failover Path", style="dashed"),
            ArchEdge(id="e7", from_node="onprem_app", to_node="cloud_s3_media", label="Media Tiering")
        ]
    )
}

@router.get("/templates")
def get_templates():
    return {k: v.template_name for k, v in TEMPLATES.items()}

@router.get("")
def get_architecture(template: str = "hybrid_dr"):
    return TEMPLATES.get(template, TEMPLATES["hybrid_dr"])
