SHELL := /usr/bin/env bash

RUN_DIR := .run
APP_PID_FILE := $(RUN_DIR)/app.pid
TESTS_PID_FILE := $(RUN_DIR)/tests.pid

API_URL ?= http://localhost:3000
METRO_PORT ?= 8081
SIMULATOR ?= iPhone 16 Pro

.PHONY: dev-ios start stop start\:tests stop\:tests

dev-ios:
	API_URL="$(API_URL)" METRO_PORT="$(METRO_PORT)" SIMULATOR="$(SIMULATOR)" ./scripts/dev-ios.sh

start:
	@mkdir -p "$(RUN_DIR)"
	@if [[ -f "$(TESTS_PID_FILE)" ]]; then \
		tests_pid="$$(cat "$(TESTS_PID_FILE)")"; \
		if kill -0 "$$tests_pid" >/dev/null 2>&1; then \
			echo "Tests are running (PID $$tests_pid). Stopping tests first..."; \
			$(MAKE) stop\:tests; \
		else \
			rm -f "$(TESTS_PID_FILE)"; \
		fi; \
	fi
	@if [[ -f "$(APP_PID_FILE)" ]]; then \
		app_pid="$$(cat "$(APP_PID_FILE)")"; \
		if kill -0 "$$app_pid" >/dev/null 2>&1; then \
			echo "App stack is already running (PID $$app_pid)."; \
			exit 0; \
		fi; \
		rm -f "$(APP_PID_FILE)"; \
	fi
	@nohup env API_URL="$(API_URL)" METRO_PORT="$(METRO_PORT)" SIMULATOR="$(SIMULATOR)" ./scripts/dev-ios.sh > "$(RUN_DIR)/start.log" 2>&1 < /dev/null & \
		app_pid=$$!; \
		echo "$$app_pid" > "$(APP_PID_FILE)"; \
		ready=0; \
		for _ in {1..20}; do \
			if ! kill -0 "$$app_pid" >/dev/null 2>&1; then \
				echo "Failed to start app stack. Logs: $(RUN_DIR)/start.log"; \
				rm -f "$(APP_PID_FILE)"; \
				tail -n 80 "$(RUN_DIR)/start.log" || true; \
				exit 1; \
			fi; \
			if grep -q "Starting React Native iOS app" "$(RUN_DIR)/start.log" 2>/dev/null; then \
				ready=1; \
				break; \
			fi; \
			sleep 1; \
		done; \
		if [[ "$$ready" -eq 1 ]]; then \
			sleep 2; \
			if ! kill -0 "$$app_pid" >/dev/null 2>&1; then \
				echo "App stack exited shortly after startup. Logs: $(RUN_DIR)/start.log"; \
				rm -f "$(APP_PID_FILE)"; \
				tail -n 80 "$(RUN_DIR)/start.log" || true; \
				exit 1; \
			fi; \
			if command -v curl >/dev/null 2>&1; then \
				api_ready=0; \
				for _ in {1..20}; do \
					if curl -fsS --max-time 1 "$(API_URL)/api/trainings/home?date=$$(date +%F)" >/dev/null 2>&1; then \
						api_ready=1; \
						break; \
					fi; \
					if ! kill -0 "$$app_pid" >/dev/null 2>&1; then \
						echo "App stack exited while waiting for API readiness. Logs: $(RUN_DIR)/start.log"; \
						rm -f "$(APP_PID_FILE)"; \
						tail -n 80 "$(RUN_DIR)/start.log" || true; \
						exit 1; \
					fi; \
					sleep 1; \
				done; \
				if [[ "$$api_ready" -ne 1 ]]; then \
					echo "API did not become ready at $(API_URL). Logs: $(RUN_DIR)/start.log"; \
					rm -f "$(APP_PID_FILE)"; \
					tail -n 80 "$(RUN_DIR)/start.log" || true; \
					exit 1; \
				fi; \
			fi; \
		fi; \
		if [[ "$$ready" -eq 1 ]]; then \
			echo "Started app stack on simulator '$(SIMULATOR)' (PID $$app_pid). Logs: $(RUN_DIR)/start.log"; \
		else \
			echo "App stack is still booting in background (PID $$app_pid). Logs: $(RUN_DIR)/start.log"; \
		fi

stop:
	@set -euo pipefail; \
	stop_pid() { \
		local pid="$$1"; \
		if [[ -z "$$pid" ]] || ! kill -0 "$$pid" >/dev/null 2>&1; then \
			return; \
		fi; \
		kill "$$pid" >/dev/null 2>&1 || true; \
		for _ in {1..20}; do \
			if kill -0 "$$pid" >/dev/null 2>&1; then \
				sleep 0.25; \
			else \
				return; \
			fi; \
		done; \
		kill -9 "$$pid" >/dev/null 2>&1 || true; \
	}; \
	stop_listeners() { \
		local port="$$1"; \
		local label="$$2"; \
		if ! command -v lsof >/dev/null 2>&1; then \
			return; \
		fi; \
		local pids; \
		pids="$$(lsof -ti "tcp:$$port" -sTCP:LISTEN 2>/dev/null || true)"; \
		pids="$$(printf '%s' "$$pids" | tr '\n' ' ' | sed 's/[[:space:]]*$$//')"; \
		if [[ -z "$$pids" ]]; then \
			return; \
		fi; \
		echo "Stopping $$label listeners on port $$port: $$pids"; \
		kill $$pids >/dev/null 2>&1 || true; \
		sleep 1; \
		pids="$$(lsof -ti "tcp:$$port" -sTCP:LISTEN 2>/dev/null || true)"; \
		pids="$$(printf '%s' "$$pids" | tr '\n' ' ' | sed 's/[[:space:]]*$$//')"; \
		if [[ -n "$$pids" ]]; then \
			echo "Force-stopping $$label listeners on port $$port: $$pids"; \
			kill -9 $$pids >/dev/null 2>&1 || true; \
		fi; \
	}; \
	echo "Stopping app stack..."; \
	if [[ -f "$(TESTS_PID_FILE)" ]]; then \
		tests_pid="$$(cat "$(TESTS_PID_FILE)")"; \
		stop_pid "$$tests_pid"; \
		rm -f "$(TESTS_PID_FILE)"; \
	fi; \
	if [[ -f "$(APP_PID_FILE)" ]]; then \
		app_pid="$$(cat "$(APP_PID_FILE)")"; \
		stop_pid "$$app_pid"; \
		rm -f "$(APP_PID_FILE)"; \
	fi; \
	api_watch_pids="$$(ps -axo pid=,command= 2>/dev/null | awk -v self="$$$$" -v parent="$$PPID" 'index($$0,"dotnet-watch") && index($$0,"$(CURDIR)/api/Trainio.Api/Trainio.Api.csproj") && $$1 != self && $$1 != parent {print $$1}' || true)"; \
	api_watch_pids="$$(printf '%s' "$$api_watch_pids" | tr '\n' ' ' | sed 's/[[:space:]]*$$//')"; \
	if [[ -n "$$api_watch_pids" ]]; then \
		echo "Stopping API watch processes: $$api_watch_pids"; \
		kill $$api_watch_pids >/dev/null 2>&1 || true; \
		sleep 1; \
		kill -9 $$api_watch_pids >/dev/null 2>&1 || true; \
	fi; \
	stop_listeners "$(API_PORT)" "API"; \
	stop_listeners "$(METRO_PORT)" "Metro"; \
	if command -v xcrun >/dev/null 2>&1; then \
		xcrun simctl shutdown all >/dev/null 2>&1 || true; \
	fi; \
	simulator_pids="$$(ps -axo pid=,comm= 2>/dev/null | awk '$$2 == "Simulator" { print $$1 }' || true)"; \
	simulator_pids="$$(printf '%s' "$$simulator_pids" | tr '\n' ' ' | sed 's/[[:space:]]*$$//')"; \
	if [[ -n "$$simulator_pids" ]]; then \
		kill $$simulator_pids >/dev/null 2>&1 || true; \
		sleep 1; \
		kill -9 $$simulator_pids >/dev/null 2>&1 || true; \
	fi; \
	echo "Stopped app stack, API/Metro, and simulator."

start\:tests:
	@mkdir -p "$(RUN_DIR)"
	@if [[ -f "$(APP_PID_FILE)" ]]; then \
		app_pid="$$(cat "$(APP_PID_FILE)")"; \
		if kill -0 "$$app_pid" >/dev/null 2>&1; then \
			echo "App stack is running (PID $$app_pid). Stopping app first..."; \
			$(MAKE) stop; \
		else \
			rm -f "$(APP_PID_FILE)"; \
		fi; \
	fi
	@if [[ -f "$(TESTS_PID_FILE)" ]]; then \
		tests_pid="$$(cat "$(TESTS_PID_FILE)")"; \
		if kill -0 "$$tests_pid" >/dev/null 2>&1; then \
			echo "Tests are running in a legacy background process (PID $$tests_pid). Stopping them first..."; \
			$(MAKE) stop\:tests; \
		fi; \
		rm -f "$(TESTS_PID_FILE)"; \
	fi
	@set -euo pipefail; \
		: > "$(RUN_DIR)/start-tests.log"; \
		API_URL="$(API_URL)" METRO_PORT="$(METRO_PORT)" ./scripts/dev-tests-ios.sh > >(tee -a "$(RUN_DIR)/start-tests.log") 2>&1 & \
		tests_pid=$$!; \
		echo "$$tests_pid" > "$(TESTS_PID_FILE)"; \
		trap 'if kill -0 "$$tests_pid" >/dev/null 2>&1; then kill "$$tests_pid" >/dev/null 2>&1 || true; fi; rm -f "$(TESTS_PID_FILE)"; exit 130' INT TERM; \
		ready=0; \
		for _ in {1..20}; do \
			if ! kill -0 "$$tests_pid" >/dev/null 2>&1; then \
				echo "Failed to start tests. Logs: $(RUN_DIR)/start-tests.log"; \
				rm -f "$(TESTS_PID_FILE)"; \
				tail -n 80 "$(RUN_DIR)/start-tests.log" || true; \
				wait "$$tests_pid" >/dev/null 2>&1 || true; \
				exit 1; \
			fi; \
			if grep -q "Running Detox iOS tests" "$(RUN_DIR)/start-tests.log" 2>/dev/null; then \
				ready=1; \
				break; \
			fi; \
			sleep 1; \
		done; \
		if [[ "$$ready" -eq 1 ]]; then \
			echo "Started Detox test flow (PID $$tests_pid). Logs: $(RUN_DIR)/start-tests.log"; \
		else \
			echo "Detox test flow is still booting (PID $$tests_pid). Logs: $(RUN_DIR)/start-tests.log"; \
		fi; \
		set +e; \
		wait "$$tests_pid"; \
		tests_exit=$$?; \
		set -e; \
		rm -f "$(TESTS_PID_FILE)"; \
		if [[ "$$tests_exit" -ne 0 ]]; then \
			echo "Tests failed. Logs: $(RUN_DIR)/start-tests.log"; \
			tail -n 80 "$(RUN_DIR)/start-tests.log" || true; \
		fi; \
		exit "$$tests_exit"

stop\:tests:
	@if [[ ! -f "$(TESTS_PID_FILE)" ]]; then \
		echo "Tests are not running."; \
	else \
		tests_pid="$$(cat "$(TESTS_PID_FILE)")"; \
		if kill -0 "$$tests_pid" >/dev/null 2>&1; then \
			kill "$$tests_pid" >/dev/null 2>&1 || true; \
			for _ in {1..20}; do \
				if kill -0 "$$tests_pid" >/dev/null 2>&1; then sleep 0.5; else break; fi; \
			done; \
			if kill -0 "$$tests_pid" >/dev/null 2>&1; then \
				kill -9 "$$tests_pid" >/dev/null 2>&1 || true; \
			fi; \
			echo "Stopped tests."; \
		else \
			echo "Tests process was already stopped."; \
		fi; \
		rm -f "$(TESTS_PID_FILE)"; \
	fi
