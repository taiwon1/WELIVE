#!/usr/bin/env bash
set -euo pipefail

: "${AWS_REGION:?AWS_REGION is required}"
: "${ECR_REGISTRY:?ECR_REGISTRY is required}"
: "${BACKEND_IMAGE:?BACKEND_IMAGE is required}"
: "${FRONTEND_IMAGE:?FRONTEND_IMAGE is required}"
: "${MIGRATION_IMAGE:?MIGRATION_IMAGE is required}"

DEPLOY_DIR="${DEPLOY_DIR:-$HOME/deploy/welive}"
cd "$DEPLOY_DIR"

if [[ ! -f .env ]]; then
  echo "Missing $DEPLOY_DIR/.env. Create it from .env.example before deploying."
  exit 1
fi

if [[ -f .deploy-images.env ]]; then
  cp .deploy-images.env .deploy-images.previous.env
fi

cat > .deploy-images.env <<EOF
BACKEND_IMAGE=$BACKEND_IMAGE
FRONTEND_IMAGE=$FRONTEND_IMAGE
MIGRATION_IMAGE=$MIGRATION_IMAGE
EOF

export BACKEND_IMAGE FRONTEND_IMAGE MIGRATION_IMAGE

sudo docker compose config > /dev/null

aws ecr get-login-password --region "$AWS_REGION" \
| sudo docker login --username AWS --password-stdin "$ECR_REGISTRY"

sudo docker compose --profile tools pull

sudo docker compose --profile tools run --rm --no-deps migration

sudo docker compose up -d --remove-orphans

healthy=false
for _ in $(seq 1 30); do
  if curl --fail --silent http://127.0.0.1/healthz > /dev/null; then
    healthy=true
    break
  fi
  sleep 2
done

if [[ "$healthy" != "true" ]]; then
  sudo docker compose ps
  sudo docker compose logs --tail=100 proxy frontend backend

  if [[ -f .deploy-images.previous.env ]]; then
    set -a
    # shellcheck disable=SC1091
    source .deploy-images.previous.env
    set +a
    mv .deploy-images.previous.env .deploy-images.env
    sudo docker compose up -d --remove-orphans
    echo "Health check failed. Previous application images were restored."
  fi

  exit 1
fi

rm -f .deploy-images.previous.env
sudo docker image prune -f
