#!/bin/bash
# Run Test Harness — compose-sim 100-scenario evaluation
# Usage: ./run_test_harness.sh [count] [concurrency]

COUNT=${1:-100}
CONCURRENCY=${2:-2}

export ANTHROPIC_API_KEY="REDACTED"

echo "=== Compose-Sim Test Harness ==="
echo "Count: $COUNT | Concurrency: $CONCURRENCY"
echo ""

python3 -m compose_sim.cli run \
    --count "$COUNT" \
    --sample-strategy stratified \
    --no-cache \
    --concurrency "$CONCURRENCY"
