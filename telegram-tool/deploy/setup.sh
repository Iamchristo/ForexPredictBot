#!/bin/bash
# One-time production setup for the Telegram Tool on an Ubuntu server.
# Run from inside the telegram-tool/ directory after cloning the repo:
#   cd ForexPredictBot/telegram-tool && bash deploy/setup.sh
set -e

APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$APP_DIR"

echo "[1/5] Creating Python virtualenv..."
python3 -m venv venv
./venv/bin/pip install -q -r requirements.txt

echo "[2/5] Preparing .env..."
if [ ! -f ".env" ]; then
    cp .env.example .env
    SECRET=$(python3 -c "import secrets; print(secrets.token_hex(32))")
    sed -i "s/^SECRET_KEY=.*/SECRET_KEY=$SECRET/" .env
    echo "      Generated a random SECRET_KEY in .env"
fi

echo "[3/5] Building frontend..."
cd frontend
npm install --legacy-peer-deps
npm run build
cd ..

echo "[4/5] Installing systemd services..."
sudo cp deploy/telegram-tool-backend.service /etc/systemd/system/
sudo cp deploy/telegram-tool-frontend.service /etc/systemd/system/
sudo sed -i "s#/home/ubuntu/ForexPredictBot/telegram-tool#$APP_DIR#g" /etc/systemd/system/telegram-tool-backend.service
sudo sed -i "s#/home/ubuntu/ForexPredictBot/telegram-tool#$APP_DIR#g" /etc/systemd/system/telegram-tool-frontend.service
sudo systemctl daemon-reload

echo "[5/5] Enabling and starting services..."
sudo systemctl enable --now telegram-tool-backend
sudo systemctl enable --now telegram-tool-frontend

echo ""
echo "Done. Check status with:"
echo "  sudo systemctl status telegram-tool-backend telegram-tool-frontend"
echo "  journalctl -u telegram-tool-backend -f"
