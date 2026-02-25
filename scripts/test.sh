#!/bin/bash
# Run the complete NoUI DERP POC test suite.
# Consumed by: developers, CI/CD, deploy.sh verification step
# Depends on: Go 1.22+, Node.js 20+, npx

set -e

echo "╔══════════════════════════════════════════╗"
echo "║  NoUI DERP POC — Test Suite              ║"
echo "╚══════════════════════════════════════════╝"
echo ""

PASS=0
FAIL=0

run_section() {
  local name="$1"
  shift
  echo "── $name ──"
  if "$@" 2>&1; then
    echo "  ✓ $name passed"
    PASS=$((PASS + 1))
  else
    echo "  ✗ $name FAILED"
    FAIL=$((FAIL + 1))
  fi
  echo ""
}

# Backend: Connector
run_section "Connector Tests" \
  sh -c "cd services/connector && go test ./... -count=1"

# Backend: Intelligence (includes YAML-derived tests)
run_section "Intelligence Tests" \
  sh -c "cd services/intelligence && go test ./... -count=1"

# Frontend: TypeScript type check
run_section "TypeScript Check" \
  sh -c "cd services/frontend && npx tsc -b --noEmit"

# Frontend: Vitest
run_section "Frontend Tests" \
  sh -c "cd services/frontend && npx vitest run"

# Summary
echo "════════════════════════════════════════════"
echo "  Passed: $PASS  |  Failed: $FAIL"
echo "════════════════════════════════════════════"

if [ "$FAIL" -gt 0 ]; then
  echo "  ✗ TEST SUITE FAILED"
  exit 1
fi

echo "  ✓ ALL TESTS PASSED"
