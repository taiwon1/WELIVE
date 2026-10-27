#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -ne 1 ] || [ ! -f "$1" ]; then
  echo "사용법: $0 <ARM64 이미지 묶음 .tar.gz>" >&2
  exit 2
fi
archive="$(realpath "$1")"
project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$project_dir"
if [ ! -f .env.portfolio ]; then
  echo "먼저 portfolio-init-env.sh를 실행하세요." >&2
  exit 2
fi

gzip -dc "$archive" | docker load
for image in welive-backend:portfolio-arm64 welive-migration:portfolio-arm64 welive-frontend:portfolio-arm64; do
  if [ "$(docker image inspect "$image" --format '{{.Architecture}}')" != arm64 ]; then
    echo "$image가 ARM64 이미지가 아닙니다." >&2
    exit 1
  fi
done

compose=(docker compose --env-file .env.portfolio -f compose.portfolio.yaml)
"${compose[@]}" up -d postgres redis
"${compose[@]}" --profile tools run --rm migration
"${compose[@]}" up -d
"${compose[@]}" ps
echo "기동 완료. HTTPS 인증서 발급에는 DNS 전파와 80/443 인바운드 허용이 필요합니다."
