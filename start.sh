#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
FRONTEND="$ROOT/frontend"
URL="http://localhost:5174"

# Check Docker containers
if ! docker ps --format '{{.Names}}' 2>/dev/null | grep -q "xampp-php"; then
  echo "⚠  XAMPP containers not running. Start them with: cd ~/repos/xampp-docker && docker compose up -d"
fi

# Kill any stale Vite process on 5174
lsof -ti :5174 | xargs kill -9 2>/dev/null || true

# Start Vite dev server in background
cd "$FRONTEND"
npm run dev &
VITE_PID=$!

# Wait for Vite to be ready
echo "Starting dev server..."
for i in $(seq 1 20); do
  if curl -s -o /dev/null "$URL"; then
    break
  fi
  sleep 0.5
done

# Open in Arc (avoids Chrome SW cache conflicts on localhost:5173)
if open -a "Arc" "$URL" 2>/dev/null; then
  :
elif command -v open &>/dev/null; then
  open "$URL"
else
  xdg-open "$URL"
fi

echo "Scan & Save running at $URL (PID $VITE_PID)"
echo "Press Ctrl+C to stop."

wait $VITE_PID
