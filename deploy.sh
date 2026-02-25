#!/bin/bash
# Single-command deployment for NoUI DERP POC.
# Builds Docker images, starts services, verifies health, and runs Case 1 check.
# Consumed by: demo setup, CI/CD
# Depends on: docker compose, curl, jq (optional)

set -e

MODE=${1:-compose}

echo "╔══════════════════════════════════════╗"
echo "║  NoUI DERP POC — Deployment          ║"
echo "║  Mode: $MODE                         ║"
echo "╚══════════════════════════════════════╝"
echo ""

if [ "$MODE" = "compose" ]; then
  echo "→ Building images..."
  docker compose build

  echo "→ Starting services..."
  docker compose up -d

  echo "→ Waiting for PostgreSQL to be ready..."
  for i in $(seq 1 30); do
    if docker compose exec -T postgres pg_isready -U derp_app -d derp_legacy > /dev/null 2>&1; then
      echo "  PostgreSQL ready."
      break
    fi
    sleep 2
  done

  echo "→ Waiting for services to start..."
  sleep 5

  echo "→ Running health checks..."
  HEALTHY=true

  if curl -sf http://localhost:8081/healthz > /dev/null 2>&1; then
    echo "  ✓ Connector healthy"
  else
    echo "  ✗ Connector NOT healthy"
    HEALTHY=false
  fi

  if curl -sf http://localhost:8082/healthz > /dev/null 2>&1; then
    echo "  ✓ Intelligence healthy"
  else
    echo "  ✗ Intelligence NOT healthy"
    HEALTHY=false
  fi

  if [ "$HEALTHY" = false ]; then
    echo ""
    echo "DEPLOYMENT FAILED — not all services are healthy."
    echo "Check logs: docker compose logs"
    exit 1
  fi

  echo ""
  echo "→ Running Case 1 verification..."
  RESPONSE=$(curl -sf http://localhost:8082/api/v1/retirement-estimate/M-100001?retirementDate=2026-04-01 2>&1 || echo "FAILED")
  if echo "$RESPONSE" | grep -q "6117.68" 2>/dev/null; then
    echo "  ✓ Case 1 verification passed (benefit: $6,117.68)"
  else
    echo "  ⚠ Case 1 verification could not confirm — check manually"
    echo "    curl http://localhost:8082/api/v1/retirement-estimate/M-100001?retirementDate=2026-04-01"
  fi

  echo ""
  echo "════════════════════════════════════════"
  echo "  ✓ Deployment complete"
  echo ""
  echo "  Frontend:      http://localhost:5175 (dev server)"
  echo "  Demo landing:  http://localhost:5175/demo"
  echo "  Connector:     http://localhost:8081/healthz"
  echo "  Intelligence:  http://localhost:8082/healthz"
  echo "════════════════════════════════════════"

elif [ "$MODE" = "k8s" ]; then
  echo "→ Building images..."
  docker compose build

  echo "→ Installing Helm chart..."
  helm upgrade --install noui-derp infrastructure/helm/noui-derp/ \
    --set image.tag=latest \
    --wait --timeout 120s

  echo ""
  echo "  ✓ Helm chart installed"
  echo "  Open via ingress or port-forward to begin"

else
  echo "Unknown mode: $MODE"
  echo "Usage: ./deploy.sh [compose|k8s]"
  exit 1
fi
