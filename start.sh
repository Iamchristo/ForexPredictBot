#!/bin/bash

echo "========================================"
echo "  ForexPredictBot - AI Trading Analyst  "
echo "========================================"
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "Creating .env from template..."
    cp .env.example .env
    echo "Edit .env to add your ANTHROPIC_API_KEY for AI-enhanced analysis."
    echo ""
fi

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt -q

echo ""
echo "Starting server on http://localhost:8000"
echo "Press Ctrl+C to stop."
echo ""

# Run the app
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
