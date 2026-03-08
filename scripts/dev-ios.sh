#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
API_PROJECT="$ROOT_DIR/api/Trainio.Api/Trainio.Api.csproj"
APP_DIR="$ROOT_DIR/app"
API_URL="${API_URL:-http://localhost:3000}"
SIMULATOR="${SIMULATOR:-}"
METRO_PORT="${METRO_PORT:-8081}"
API_PORT="${API_URL##*:}"
API_PORT="${API_PORT%%/*}"

if [[ ! -f "$API_PROJECT" ]]; then
  echo "API project not found at $API_PROJECT"
  exit 1
fi

if [[ ! -f "$APP_DIR/package.json" ]]; then
  echo "React Native app not found at $APP_DIR"
  exit 1
fi

if [[ ! -d "$APP_DIR/node_modules" ]]; then
  echo "Missing $APP_DIR/node_modules. Run: cd app && npm install"
  exit 1
fi

cleanup() {
  if [[ -n "${api_pid:-}" ]] && kill -0 "$api_pid" >/dev/null 2>&1; then
    kill "$api_pid" >/dev/null 2>&1 || true
    wait "$api_pid" >/dev/null 2>&1 || true
  fi
  if [[ -n "${metro_pid:-}" ]] && kill -0 "$metro_pid" >/dev/null 2>&1; then
    kill "$metro_pid" >/dev/null 2>&1 || true
    wait "$metro_pid" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT INT TERM

if command -v lsof >/dev/null 2>&1 && lsof -ti "tcp:$API_PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  existing_api_pids="$(lsof -ti "tcp:$API_PORT" -sTCP:LISTEN | tr '\n' ' ')"
  echo "Stopping existing API listeners on port $API_PORT: $existing_api_pids"
  kill $existing_api_pids >/dev/null 2>&1 || true
  sleep 1
fi

echo "Starting API with hot reload at $API_URL ..."
ASPNETCORE_URLS="$API_URL" dotnet watch --project "$API_PROJECT" run --no-launch-profile &
api_pid=$!

sleep 3
if ! kill -0 "$api_pid" >/dev/null 2>&1; then
  echo "API process exited during startup."
  exit 1
fi

echo "Starting Metro on port $METRO_PORT ..."
cd "$APP_DIR"
if command -v lsof >/dev/null 2>&1 && lsof -ti "tcp:$METRO_PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "Metro is already running on port $METRO_PORT. Reusing it."
  metro_pid=""
else
  npm run start -- --port "$METRO_PORT" &
  metro_pid=$!
  sleep 3
  if ! kill -0 "$metro_pid" >/dev/null 2>&1; then
    echo "Metro process exited during startup."
    exit 1
  fi
fi

echo "Starting React Native iOS app (Fast Refresh enabled by default) ..."
if [[ -n "$SIMULATOR" ]]; then
  npm run ios -- --simulator "$SIMULATOR" --no-packager --port "$METRO_PORT"
else
  npm run ios -- --no-packager --port "$METRO_PORT"
fi

echo "API and Metro are running. Press Ctrl+C to stop."
while true; do
  if [[ -n "${api_pid:-}" ]] && ! kill -0 "$api_pid" >/dev/null 2>&1; then
    echo "API process stopped."
    exit 1
  fi

  if [[ -n "${metro_pid:-}" ]] && ! kill -0 "$metro_pid" >/dev/null 2>&1; then
    echo "Metro process stopped."
    exit 1
  fi

  sleep 2
done
