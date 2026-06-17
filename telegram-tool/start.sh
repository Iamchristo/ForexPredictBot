#!/bin/bash

echo "========================================"
echo "  Telegram Scraper & Bulk Messenger      "
echo "========================================"
echo ""

cd "$(dirname "$0")"

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "Creating .env from template..."
    cp .env.example .env
    echo ""
fi

# Load .env
if [ -f ".env" ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Install Python deps
echo "[1/3] Installing Python dependencies..."
pip install -r requirements.txt -q
echo "      Done."
echo ""

# Install Node deps
echo "[2/3] Installing Node.js dependencies..."
cd frontend
if [ ! -d "node_modules" ]; then
    npm install --legacy-peer-deps
else
    echo "      node_modules already present, skipping."
fi
cd ..
echo "      Done."
echo ""

# Start both servers
echo "[3/3] Starting servers..."
echo ""
echo "  Backend API  -> http://localhost:8001"
echo "  Frontend App -> http://localhost:3001"
echo "  API Docs     -> http://localhost:8001/docs"
echo ""
echo "  Press Ctrl+C to stop all servers."
echo "========================================"
echo ""

# Start backend in background
uvicorn backend.main:app --host 0.0.0.0 --port 8001 --reload &
BACKEND_PID=$!

# Start frontend
cd frontend && npm run dev &
FRONTEND_PID=$!

# Wait for both - cleanup on exit
trap "echo ''; echo 'Shutting down...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" SIGINT SIGTERM

wait $BACKEND_PID $FRONTEND_PID
