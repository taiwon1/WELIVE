#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -ne 1 ]; then
  echo "사용법: $0 <출력할 .tar.gz 경로>" >&2
  exit 2
fi

project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$project_dir"
output="$1"
mkdir -p "$(dirname "$output")"

docker buildx build --platform linux/arm64 --target runner \
  -t welive-backend:portfolio-arm64 --load .
docker buildx build --platform linux/arm64 --target migrator \
  -t welive-migration:portfolio-arm64 --load .
docker buildx build --platform linux/arm64 \
  -t welive-frontend:portfolio-arm64 --load ./frontend

for image in welive-backend:portfolio-arm64 welive-migration:portfolio-arm64 welive-frontend:portfolio-arm64; do
  arch="$(docker image inspect "$image" --format '{{.Architecture}}')"
  if [ "$arch" != "arm64" ]; then
    echo "$image 아키텍처 오류: $arch" >&2
    exit 1
  fi
done

docker save \
  welive-backend:portfolio-arm64 \
  welive-migration:portfolio-arm64 \
  welive-frontend:portfolio-arm64 | gzip -1 > "$output"
echo "ARM64 이미지 묶음 생성 완료: $output"
