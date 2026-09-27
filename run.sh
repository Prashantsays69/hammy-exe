#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

echo "========================================================"
echo "        Hamster Reaction Cam — Launching..."
echo "========================================================"

if [ -f ".venv/bin/python" ]; then
    .venv/bin/python main.py "$@"
elif command -v python3 &>/dev/null; then
    python3 main.py "$@"
else
    echo "[ERROR] Python 3 not found. Please set up .venv first."
    exit 1
fi
