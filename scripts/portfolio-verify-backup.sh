#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -ne 2 ]; then
  echo "사용법: $0 <DB SQL gzip 파일> <이미지 tar gzip 파일>" >&2
  exit 2
fi

project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$project_dir"
db_file="$1"
assets_file="$2"
test -s "$db_file"
test -s "$assets_file"
gzip -t "$db_file"
tar -tzf "$assets_file" >/dev/null

compose=(docker compose --env-file .env.portfolio -f compose.portfolio.yaml)
restore_db="welive_restore_check_$$"
cleanup() {
  "${compose[@]}" exec -T postgres sh -c 'dropdb --if-exists --force -U "$POSTGRES_USER" "$1"' sh "$restore_db" >/dev/null 2>&1 || true
}
trap cleanup EXIT
"${compose[@]}" exec -T postgres sh -c 'createdb -U "$POSTGRES_USER" "$1"' sh "$restore_db"
gzip -dc "$db_file" | "${compose[@]}" exec -T postgres sh -c 'psql -v ON_ERROR_STOP=1 -q -U "$POSTGRES_USER" -d "$1"' sh "$restore_db" >/dev/null
counts=$("${compose[@]}" exec -T postgres sh -c 'psql -v ON_ERROR_STOP=1 -At -U "$POSTGRES_USER" -d "$1" -c "SELECT (SELECT count(*) FROM \"_prisma_migrations\" WHERE finished_at IS NOT NULL), (SELECT count(*) FROM \"User\"), (SELECT count(*) FROM \"Incident\");"' sh "$restore_db")
IFS='|' read -r migrations users incidents <<< "$counts"
if [ "$migrations" -ne 26 ] || [ "$users" -lt 4 ] || [ "$incidents" -lt 1 ]; then
  echo "복원 데이터 검증 실패: migrations=$migrations users=$users incidents=$incidents" >&2
  exit 1
fi
echo "백업 복원 검증 완료: 마이그레이션 $migrations, 사용자 $users, 공동 문제 $incidents"
