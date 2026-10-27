#!/usr/bin/env bash
set -euo pipefail

# Ubuntu 24.04 ARM64 EC2에서 한 번 실행한다. SSH 세션을 다시 열면 docker 그룹이 적용된다.
if [ "$(id -u)" -eq 0 ]; then
  echo "ubuntu 사용자로 실행하세요. sudo는 스크립트에서 사용합니다." >&2
  exit 2
fi
. /etc/os-release
if [ "$ID" != ubuntu ] || [ "${VERSION_ID:-}" != 24.04 ] || [ "$(dpkg --print-architecture)" != arm64 ]; then
  echo "Ubuntu 24.04 ARM64 서버에서만 실행할 수 있습니다." >&2
  exit 2
fi
sudo apt-get update
sudo apt-get install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
sudo tee /etc/apt/sources.list.d/docker.sources >/dev/null <<EOF
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: ${UBUNTU_CODENAME:-$VERSION_CODENAME}
Components: stable
Architectures: $(dpkg --print-architecture)
Signed-By: /etc/apt/keyrings/docker.asc
EOF
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl enable --now docker
sudo usermod -aG docker "$(id -un)"
echo "Docker 설치 완료. SSH에 다시 접속한 뒤 docker compose version을 확인하세요."
