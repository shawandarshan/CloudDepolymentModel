#!/bin/bash
set -e

echo "============================================="
echo "StreamCloud Intelligence - Verification Suite"
echo "============================================="

echo "[1/2] Running Python FastAPI backend tests with Pytest..."
python3 -m pytest backend/tests -v

echo "[2/2] Validating Frontend TypeScript & Vite production build..."
cd frontend && npm run build

echo "============================================="
echo "✅ All backend & frontend tests passed successfully!"
echo "============================================="
