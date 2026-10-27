#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -ne 1 ]; then
  echo "사용법: $0 <서버 밖으로 복사할 백업 디렉터리>" >&2
  exit 2
fi

project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$project_dir"
if [ ! -f .env.portfolio ]; then
  echo ".env.portfolio 파일이 없습니다." >&2
  exit 2
fi

output_dir="$1"
mkdir -p "$output_dir"
chmod 700 "$output_dir"
stamp="$(date -u +%Y%m%dT%H%M%SZ)"
db_file="$output_dir/welive-db-$stamp.sql.gz"
assets_file="$output_dir/welive-assets-$stamp.tar.gz"

docker compose --env-file .env.portfolio -f compose.portfolio.yaml exec -T postgres \
  sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' | gzip -c > "$db_file"
docker run --rm -v welive-portfolio_asset-data:/assets:ro alpine:3.21 \
  tar -C /assets -czf - . > "$assets_file"
chmod 600 "$db_file" "$assets_file"
echo "DB와 이미지 백업 생성 완료: $output_dir"
echo "두 파일을 서버 밖으로 복사하고 복원 가능 여부를 확인하세요."
