#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
API_PROJECT="$ROOT_DIR/api/Trainio.Api/Trainio.Api.csproj"
APP_DIR="$ROOT_DIR/app"
RUN_DIR="$ROOT_DIR/.run"
API_URL="${API_URL:-http://localhost:3000}"
METRO_PORT="${METRO_PORT:-8081}"
API_PORT="${API_URL##*:}"
API_PORT="${API_PORT%%/*}"
API_LOG="$RUN_DIR/start-tests-api.log"

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

mkdir -p "$RUN_DIR"

stop_pid() {
  local pid="$1"
  if [[ -z "$pid" ]] || ! kill -0 "$pid" >/dev/null 2>&1; then
    return
  fi

  kill "$pid" >/dev/null 2>&1 || true
  for _ in {1..20}; do
    if kill -0 "$pid" >/dev/null 2>&1; then
      sleep 0.25
    else
      return
    fi
  done

  kill -9 "$pid" >/dev/null 2>&1 || true
}

stop_port_listeners() {
  local port="$1"
  local label="$2"
  local phase="$3"
  local pids

  if ! command -v lsof >/dev/null 2>&1; then
    return
  fi

  pids="$(
    lsof -ti "tcp:$port" -sTCP:LISTEN 2>/dev/null || true
  )"
  pids="$(printf '%s' "$pids" | tr '\n' ' ' | sed 's/[[:space:]]*$//')"
  if [[ -z "$pids" ]]; then
    return
  fi

  echo "$phase $label listeners on port $port: $pids"
  kill $pids >/dev/null 2>&1 || true
  sleep 1

  pids="$(
    lsof -ti "tcp:$port" -sTCP:LISTEN 2>/dev/null || true
  )"
  pids="$(printf '%s' "$pids" | tr '\n' ' ' | sed 's/[[:space:]]*$//')"
  if [[ -n "$pids" ]]; then
    echo "Force-stopping $label listeners on port $port: $pids"
    kill -9 $pids >/dev/null 2>&1 || true
  fi
}

cleanup() {
  local exit_code="${1:-0}"
  set +e

  stop_pid "${tests_pid:-}"
  stop_pid "${api_pid:-}"
  stop_port_listeners "$API_PORT" "API" "Stopping leftover"
  stop_port_listeners "$METRO_PORT" "Metro" "Stopping leftover"

  exit "$exit_code"
}
trap 'cleanup $?' EXIT
trap 'exit 130' INT TERM

stop_port_listeners "$API_PORT" "API" "Stopping existing"
stop_port_listeners "$METRO_PORT" "Metro" "Stopping existing"

echo "Starting API at $API_URL ..."
ASPNETCORE_URLS="$API_URL" dotnet run --project "$API_PROJECT" --no-launch-profile >"$API_LOG" 2>&1 &
api_pid=$!

sleep 3
if ! kill -0 "$api_pid" >/dev/null 2>&1; then
  echo "API process exited during startup."
  tail -n 80 "$API_LOG" || true
  exit 1
fi

cd "$APP_DIR"

echo "Building Detox iOS app ..."
npm run e2e:build:ios

echo "Running Detox iOS tests ..."
npm run e2e:test:ios

echo "Detox iOS tests finished."
