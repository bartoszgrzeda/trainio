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
	@API_URL="$(API_URL)" METRO_PORT="$(METRO_PORT)" SIMULATOR="$(SIMULATOR)" ./scripts/dev-ios.sh > "$(RUN_DIR)/start.log" 2>&1 & \
		app_pid=$$!; \
		echo "$$app_pid" > "$(APP_PID_FILE)"; \
		sleep 1; \
		if kill -0 "$$app_pid" >/dev/null 2>&1; then \
			echo "Started app stack on simulator '$(SIMULATOR)' (PID $$app_pid). Logs: $(RUN_DIR)/start.log"; \
		else \
			echo "Failed to start app stack. Logs: $(RUN_DIR)/start.log"; \
			rm -f "$(APP_PID_FILE)"; \
			exit 1; \
		fi

stop:
	@if [[ ! -f "$(APP_PID_FILE)" ]]; then \
		echo "App stack is not running."; \
	else \
		app_pid="$$(cat "$(APP_PID_FILE)")"; \
		if kill -0 "$$app_pid" >/dev/null 2>&1; then \
			kill "$$app_pid" >/dev/null 2>&1 || true; \
			for _ in {1..20}; do \
				if kill -0 "$$app_pid" >/dev/null 2>&1; then sleep 0.5; else break; fi; \
			done; \
			if kill -0 "$$app_pid" >/dev/null 2>&1; then \
				kill -9 "$$app_pid" >/dev/null 2>&1 || true; \
			fi; \
			echo "Stopped app stack."; \
		else \
			echo "App stack process was already stopped."; \
		fi; \
		rm -f "$(APP_PID_FILE)"; \
	fi

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
	@set -o pipefail; \
		API_URL="$(API_URL)" METRO_PORT="$(METRO_PORT)" ./scripts/dev-tests-ios.sh 2>&1 | tee "$(RUN_DIR)/start-tests.log"

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
