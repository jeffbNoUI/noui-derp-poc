# NoUI DERP POC — Top-level Makefile
# Consumed by: CI/CD, developer workflow
# Depends on: Go 1.22+, Node.js 20+, services/*/go.mod, services/frontend/package.json

GO ?= go
NPX ?= npx
CONNECTOR_DIR := services/connector
INTELLIGENCE_DIR := services/intelligence
FRONTEND_DIR := services/frontend

.PHONY: test-all test-unit test-backend test-frontend test-connector test-intelligence test-yaml build lint clean

# Run the complete test suite
test-all: test-backend test-frontend
	@echo ""
	@echo "=== ALL TESTS PASSED ==="

# Run all backend tests (connector + intelligence + YAML)
test-backend: test-connector test-intelligence
	@echo "Backend tests complete."

# Run all unit tests (alias for test-backend)
test-unit: test-backend

# Connector service tests
test-connector:
	@echo "=== Connector Tests ==="
	cd $(CONNECTOR_DIR) && $(GO) test ./... -count=1

# Intelligence service tests (includes YAML-derived tests)
test-intelligence:
	@echo "=== Intelligence Tests ==="
	cd $(INTELLIGENCE_DIR) && $(GO) test ./... -count=1

# YAML-derived test runner only (subset of intelligence)
test-yaml:
	@echo "=== YAML Rule Tests ==="
	cd $(INTELLIGENCE_DIR) && $(GO) test ./internal/rules/ -v -count=1

# Frontend tests (Vitest)
test-frontend:
	@echo "=== Frontend Tests ==="
	cd $(FRONTEND_DIR) && $(NPX) vitest run

# Build all services
build: build-connector build-intelligence build-frontend

build-connector:
	@echo "=== Building Connector ==="
	cd $(CONNECTOR_DIR) && $(GO) build -o bin/connector .

build-intelligence:
	@echo "=== Building Intelligence ==="
	cd $(INTELLIGENCE_DIR) && $(GO) build -o bin/intelligence .

build-frontend:
	@echo "=== Building Frontend ==="
	cd $(FRONTEND_DIR) && $(NPX) vite build

# TypeScript type checking
lint:
	@echo "=== TypeScript Check ==="
	cd $(FRONTEND_DIR) && $(NPX) tsc -b --noEmit

# Verbose test output (for debugging)
test-verbose: test-connector-verbose test-intelligence-verbose test-frontend

test-connector-verbose:
	cd $(CONNECTOR_DIR) && $(GO) test ./... -v -count=1

test-intelligence-verbose:
	cd $(INTELLIGENCE_DIR) && $(GO) test ./... -v -count=1

# Clean build artifacts
clean:
	rm -rf $(CONNECTOR_DIR)/bin
	rm -rf $(INTELLIGENCE_DIR)/bin
	rm -rf $(FRONTEND_DIR)/dist
