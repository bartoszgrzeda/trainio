#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
API_PROJECT="$ROOT_DIR/api/Trainio.Api/Trainio.Api.csproj"
APP_DIR="$ROOT_DIR/app"
RUN_DIR="$ROOT_DIR/.run"
API_URL="${API_URL:-http://localhost:3000}"
SIMULATOR="${SIMULATOR:-}"
METRO_PORT="${METRO_PORT:-8081}"
METRO_HOST="${METRO_HOST:-0.0.0.0}"
API_PORT="${API_URL##*:}"
API_PORT="${API_PORT%%/*}"
METRO_LOG="$RUN_DIR/start-metro.log"

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

wait_for_metro() {
  local timeout_seconds="${1:-20}"
  local _attempt=0
  while [[ "$_attempt" -lt "$timeout_seconds" ]]; do
    if ! kill -0 "$metro_pid" >/dev/null 2>&1; then
      return 1
    fi

    if command -v curl >/dev/null 2>&1; then
      if curl -fsS --max-time 1 "http://127.0.0.1:$METRO_PORT/status" 2>/dev/null | grep -q "packager-status:running"; then
        return 0
      fi
    elif command -v lsof >/dev/null 2>&1; then
      if lsof -ti "tcp:$METRO_PORT" -sTCP:LISTEN >/dev/null 2>&1; then
        return 0
      fi
    fi

    sleep 1
    _attempt=$((_attempt + 1))
  done

  return 1
}

start_metro() {
  local host="$1"
  local startup_timeout="${2:-20}"

  : > "$METRO_LOG"
  echo "Starting Metro on port $METRO_PORT (host $host) ..."
  npm run start -- --host "$host" --port "$METRO_PORT" >"$METRO_LOG" 2>&1 &
  metro_pid=$!

  if wait_for_metro "$startup_timeout"; then
    echo "Metro is running on port $METRO_PORT. Logs: $METRO_LOG"
    return 0
  fi

  if kill -0 "$metro_pid" >/dev/null 2>&1; then
    kill "$metro_pid" >/dev/null 2>&1 || true
    wait "$metro_pid" >/dev/null 2>&1 || true
  fi

  return 1
}

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

cd "$APP_DIR"
if command -v lsof >/dev/null 2>&1 && lsof -ti "tcp:$METRO_PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "Metro is already running on port $METRO_PORT. Reusing it."
  metro_pid=""
else
  if ! start_metro "$METRO_HOST" 25; then
    if grep -q "listen EPERM: operation not permitted 0.0.0.0:$METRO_PORT" "$METRO_LOG" 2>/dev/null; then
      echo "Metro could not bind 0.0.0.0:$METRO_PORT. Retrying with host 127.0.0.1 ..."
      if ! start_metro "127.0.0.1" 25; then
        echo "Metro process exited during startup."
        tail -n 80 "$METRO_LOG" || true
        exit 1
      fi
    else
      echo "Metro process exited during startup."
      tail -n 80 "$METRO_LOG" || true
      exit 1
    fi
  fi
fi

echo "Starting React Native iOS app (Fast Refresh enabled by default) ..."
if [[ -n "$SIMULATOR" ]]; then
  if ! npm run ios -- --simulator "$SIMULATOR" --no-packager --port "$METRO_PORT"; then
    echo "Warning: react-native run-ios failed. Keeping API and Metro running."
  fi
else
  if ! npm run ios -- --no-packager --port "$METRO_PORT"; then
    echo "Warning: react-native run-ios failed. Keeping API and Metro running."
  fi
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
