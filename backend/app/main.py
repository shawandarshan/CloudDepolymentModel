from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.database import engine, Base, SessionLocal
from backend.app.seed_data import seed_database
from backend.app.routes import (
    dashboard,
    models_comparison,
    disaster_recovery,
    costs,
    scalability,
    architecture,
    recommendations,
    scenarios,
    reports
)

# Create tables
Base.metadata.create_all(bind=engine)

# Seed initial data
with SessionLocal() as db:
    seed_database(db)

app = FastAPI(
    title="StreamCloud Intelligence API",
    description="Backend API for Cloud Deployment Model & Disaster Recovery Simulator",
    version="1.0.0"
)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routes
app.include_router(dashboard.router)
app.include_router(models_comparison.router)
app.include_router(disaster_recovery.router)
app.include_router(costs.router)
app.include_router(scalability.router)
app.include_router(architecture.router)
app.include_router(recommendations.router)
app.include_router(scenarios.router)
app.include_router(reports.router)

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "StreamCloud Intelligence API",
        "version": "1.0.0",
        "database": "SQLite (Connected)",
        "simulation_mode": "Active"
    }

@app.get("/")
def root():
    return {
        "message": "StreamCloud Intelligence API is running. Access interactive docs at /docs",
        "documentation": "/docs"
    }
