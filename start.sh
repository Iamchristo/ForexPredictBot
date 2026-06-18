#!/bin/bash

echo "========================================"
echo "  ForexPredictBot AI - Trading Platform  "
echo "========================================"
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "Creating .env from template..."
    cp .env.example .env
    echo "Edit .env to add your ANTHROPIC_API_KEY for AI-enhanced chat analysis."
    echo ""
fi

# Load .env
if [ -f ".env" ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Install Python deps in an isolated virtualenv to avoid conflicts with
# system-installed packages (e.g. Ubuntu's apt-managed cryptography/cffi),
# and to avoid bleeding-edge default `python3` versions for which pandas/
# numpy don't yet ship prebuilt wheels (forcing slow/fragile source builds).
echo "[1/3] Installing Python dependencies..."
PYBIN=""
for cand in python3.12 python3.11 python3.10 python3; do
    if command -v "$cand" >/dev/null 2>&1; then
        PYBIN="$cand"
        break
    fi
done
if [ ! -d "venv" ]; then
    "$PYBIN" -m venv venv
fi
source venv/bin/activate
if ! pip install -r requirements.txt; then
    echo ""
    echo "ERROR: pip install failed. See the output above for the real error."
    exit 1
fi
if ! command -v uvicorn >/dev/null 2>&1; then
    echo ""
    echo "ERROR: uvicorn not found after pip install. The venv install did not complete."
    exit 1
fi
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

# Free up stale processes from a previous run that didn't shut down cleanly
# (npm run dev spawns a child `next dev` process that a plain kill misses)
for port in 3000 8000; do
    pid=$(lsof -ti tcp:"$port" 2>/dev/null)
    if [ -n "$pid" ]; then
        echo "Port $port is in use by PID $pid, stopping it..."
        kill -9 $pid 2>/dev/null
    fi
done

# Start both servers
echo "[3/3] Starting servers..."
echo ""
echo "  Backend API  -> http://localhost:8000"
echo "  Frontend App -> http://localhost:3000"
echo "  API Docs     -> http://localhost:8000/docs"
echo ""
echo "  Admin login: admin@forexpredictbot.com / Admin@2024!"
echo ""
echo "  Press Ctrl+C to stop all servers."
echo "========================================"
echo ""

# Start backend in background
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

# Start frontend
cd frontend && npm run dev &
FRONTEND_PID=$!

# Wait for both - cleanup on exit
trap "echo ''; echo 'Shutting down...'; kill $BACKEND_PID 2>/dev/null; pkill -P $FRONTEND_PID 2>/dev/null; kill $FRONTEND_PID 2>/dev/null; exit" SIGINT SIGTERM

wait $BACKEND_PID $FRONTEND_PID
