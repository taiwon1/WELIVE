#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -ne 1 ] || ! [[ "$1" =~ ^([0-9]{1,3}\.){3}[0-9]{1,3}$ ]]; then
  echo "사용법: $0 <EC2 공인 IPv4>" >&2
  exit 2
fi
IFS=. read -r a b c d <<< "$1"
for octet in "$a" "$b" "$c" "$d"; do
  if [ "$octet" -gt 255 ]; then
    echo "유효하지 않은 IPv4 주소입니다." >&2
    exit 2
  fi
done

project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$project_dir"
if [ -e .env.portfolio ]; then
  echo "기존 .env.portfolio가 있어 덮어쓰지 않았습니다." >&2
  exit 1
fi

host="${1//./-}.sslip.io"
db_password="$(openssl rand -hex 32)"
access_secret="$(openssl rand -hex 32)"
refresh_secret="$(openssl rand -hex 32)"
umask 077
cat > .env.portfolio <<EOF
SITE_HOST=$host
CORS_ORIGIN=https://$host
NODE_ENV=production
PORT=4000
DB_HOST=postgres
DB_PORT=5432
DB_NAME=welive
DB_USER=welive
DB_PASSWORD=$db_password
DB_SSL=false
DATABASE_URL=postgresql://welive:$db_password@postgres:5432/welive
JWT_ACCESS_SECRET=$access_secret
JWT_REFRESH_SECRET=$refresh_secret
AWS_REGION=ap-southeast-2
S3_BUCKET=unused-local
UPLOAD_STORAGE=local
LOCAL_ASSET_DIR=/app/uploads
ASSET_BASE_URL=
BACKEND_IMAGE=welive-backend:portfolio-arm64
FRONTEND_IMAGE=welive-frontend:portfolio-arm64
MIGRATION_IMAGE=welive-migration:portfolio-arm64
EOF
echo "환경 파일 생성 완료: $host (.env.portfolio, 권한 600)"
