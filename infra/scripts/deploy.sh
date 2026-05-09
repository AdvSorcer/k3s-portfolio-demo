#!/usr/bin/env bash
set -euo pipefail

HOST="${1:-}"
FRONTEND_IMAGE="${2:-}"
BACKEND_IMAGE="${3:-}"

if [ -z "$HOST" ] || [ -z "$FRONTEND_IMAGE" ] || [ -z "$BACKEND_IMAGE" ]; then
  echo "Usage: bash infra/scripts/deploy.sh <host> <frontend_image> <backend_image>"
  echo "Example: bash infra/scripts/deploy.sh 1.2.3.4.sslip.io ghcr.io/me/k3s-portfolio-frontend:latest ghcr.io/me/k3s-portfolio-backend:latest"
  exit 1
fi

FRONTEND_REPO="${FRONTEND_IMAGE%:*}"
FRONTEND_TAG="${FRONTEND_IMAGE##*:}"
BACKEND_REPO="${BACKEND_IMAGE%:*}"
BACKEND_TAG="${BACKEND_IMAGE##*:}"

helm upgrade --install k3s-portfolio ./infra/helm/k3s-portfolio \
  --namespace portfolio \
  --create-namespace \
  --set app.host="$HOST" \
  --set frontend.image.repository="$FRONTEND_REPO" \
  --set frontend.image.tag="$FRONTEND_TAG" \
  --set backend.image.repository="$BACKEND_REPO" \
  --set backend.image.tag="$BACKEND_TAG"

kubectl rollout status deploy/k3s-portfolio-backend -n portfolio
kubectl rollout status deploy/k3s-portfolio-frontend -n portfolio
kubectl get pods,svc,ingress -n portfolio

