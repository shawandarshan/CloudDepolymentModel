#!/bin/bash

echo "=========================================================="
echo "🚀 Starting StreamCloud Intelligence Platform"
echo "   Case Study: Cloud Deployment & Disaster Recovery"
echo "=========================================================="

cleanup() {
  echo ""
  echo "Shutting down servers..."
  kill $(jobs -p) 2>/dev/null || true
  exit 0
}

trap cleanup INT TERM

# 1. Start Python FastAPI Backend
echo "[1/2] Launching Python FastAPI backend on http://localhost:8000..."
python3 -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

# Wait 2 seconds for backend to initialize
sleep 2

# 2. Start Vite React Frontend
echo "[2/2] Launching Vite React frontend on http://localhost:5173..."
cd frontend && npm run dev -- --host 0.0.0.0 --port 5173 &
FRONTEND_PID=$!

echo ""
echo "=========================================================="
echo "🎉 StreamCloud Intelligence is LIVE!"
echo "   - Frontend Dashboard: http://localhost:5173"
echo "   - Backend REST APIs:  http://localhost:8000"
echo "   - Interactive Docs:   http://localhost:8000/docs"
echo "=========================================================="
echo "Press Ctrl+C to stop both servers."

wait
