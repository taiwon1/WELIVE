# 포트폴리오용 AWS 배포 진행표

최종 확인: 2026-10-27

## 이 계정에서 확인한 조건

- AWS **무료 플랜**, 남은 크레딧 **US$100**, 남은 기간 **약 180일**을 로그인한 콘솔에서 확인했다. 화면 수치는 시간이 지나면 바뀐다.
- 무료 플랜은 서울 리전의 EC2 접근을 막고 시드니(`ap-southeast-2`) 리전을 안내한다. Lightsail도 읽기 API가 거부된다. AWS 공식 무료 서비스 표에서 Lightsail 체험은 유료 플랜 대상으로 표시된다.
- 따라서 현재 계정에서는 **시드니 EC2 t4g.small (ARM64, 2 vCPU, 2 GiB)** 한 대를 우선 후보로 삼는다. 콘솔의 Linux 온디맨드 요금은 **US$0.0212/시간**이다. 730시간 가동 시 인스턴스만 약 **US$15.48**이며, EBS 디스크·공인 IPv4·전송량·세금 등은 별도다. 이 값은 청구 금액이나 상한이 아니다.
- 무료 플랜은 크레딧 소진 또는 기간 종료 시 계정 접근이 종료된다. 유료 플랜으로 바꾸면 잔여 크레딧은 적용되지만 초과 사용에 요금이 발생할 수 있다. **현재 유료 전환은 진행하지 않았다.**
- 도메인은 없고 실제 입주민 정보는 사용하지 않는다. 고정 IPv4에 `<IP를 하이픈으로 바꾼 값>.sslip.io`를 연결하고 Caddy가 HTTPS 인증서를 발급받는 구성을 준비했다. 이 무료 DNS 서비스에 대한 의존성이 있다.

공식 근거: [AWS 무료 플랜 서비스](https://aws.amazon.com/free/compute/), [무료 플랜 종료 정책](https://docs.aws.amazon.com/us_en/awsaccountbilling/latest/aboutv2/free-tier-plans.html), [EC2 유형](https://docs.aws.amazon.com/ec2/latest/instancetypes/gp.html), [공인 IPv4 요금](https://aws.amazon.com/blogs/aws/new-aws-public-ipv4-address-charge-public-ip-insights/).

## 실행 구조

```text
방문자 → HTTPS Caddy → Next.js 화면
                  ├→ /api/* Express API
                  └→ /assets/* 서버 디스크 이미지
                         │
                    PostgreSQL + Redis
```

모두 같은 EC2 인스턴스의 Docker Compose에서 실행한다. DB와 업로드 파일은 Docker 볼륨에 남는다. 이미지 빌드는 로컬 PC에서 ARM64로 하고 서버에서는 실행한다. 서버 정지·파손 시 서비스와 DB가 함께 중단된다. 별도 DB·로드밸런서·S3는 첫 포트폴리오 배포 범위에 넣지 않았다.

## 완료된 준비

1. 기존 EC2/ECR 자동 배포 워크플로가 main 병합만으로 실행되지 않도록 수동 전용으로 변경했다.
2. 단지 간 민원·공지·댓글·투표·일정·주민 승인 및 가입 연결의 권한을 보강했다.
3. `compose.portfolio.yaml`, `caddy/Caddyfile`, `.env.portfolio.example`과 로컬 업로드 저장 경로를 추가했다.
4. 전용 PostgreSQL 16 테스트 DB에서 전체 **20개 묶음, 260개 테스트**를 통과했다. 포트폴리오 Compose에서 26개 마이그레이션, API·화면·HTTPS 경로, 이미지 볼륨 제공을 확인했다. DB 덤프를 별도 DB로 복원해 마이그레이션 26개를 재확인했다. 로컬 `localhost` 인증서는 테스트용 자체 서명 인증서다.
5. 최종 코드의 ARM64 백엔드·마이그레이션·프런트 이미지와 356 MiB 전송 묶음을 만들었다. ARM64 백엔드 실행 파일 권한 및 ARM64 마이그레이션 이미지에서 26개 마이그레이션 기록을 확인했다. 실제 AWS 기동·공인 HTTPS·서버 백업 복원·주민/관리자 브라우저 최종 검증은 남았다.

## 남은 순서와 담당

| 순서 | 내용 | 담당 |
| --- | --- | --- |
| 1 | 배포 스크립트·ARM64 이미지·로컬 백업/복원 검증 완료, PR·원격 CI 확인 | 개발자(Codex) |
| 2 | EC2 생성 화면에서 Ubuntu 24.04 ARM64, t4g.small, 20 GiB gp3와 시간당 요금 검토 | 개발자 준비, 사용자 최종 생성 |
| 3 | SSH 키 생성·안전한 보관, 시드니 서버 최종 생성, 고정 IP 연결 | 사용자와 Codex 함께 진행 |
| 4 | 서버 Docker 설치, 이미지·Compose·환경 설정 전달, 마이그레이션·초기 관리자 생성 | Codex 진행, 비밀값 입력은 사용자 |
| 5 | HTTPS·주민/관리자 시나리오·업로드·알림·재시작·백업 복원 확인 | Codex 검증 |
| 6 | 예산 알림과 최종 URL/시연 기록 정리 | Codex 안내, 사용자 알림 수신 확인 |

서버 생성은 **인스턴스 시간당 요금과 관련 저장소·주소 사용량**을 발생시킨다. 브라우저에서의 최종 생성 클릭과 SSH 키 보관은 사용자에게 넘긴다. 현재 AWS 자원은 생성되지 않았다.

## 운영 시 주의

- `.env.portfolio.example`은 예시다. 실제 `.env.portfolio`와 SSH 개인키는 저장소/채팅에 올리지 않는다.
- `prisma/seed.ts`에는 개발용 기본 최고관리자 비밀번호가 있으므로 공개 서버에서 실행하지 않는다. `dist/cli/bootstrap-admin.js`로 최초 최고관리자를 생성한다.
- DB 덤프와 이미지 볼륨을 **서버 밖으로 복사**하고 복원 확인 후 시연 데이터를 올린다. 같은 서버에만 둔 백업은 서버 손실을 막지 못한다.
- 예산 알림은 비용을 자동 차단하지 않으며 집계가 지연될 수 있다. 현재 무료 플랜을 유지하는 것이 무과금 보호 장치다.

## 첫 서버 설치 명령 (EC2 생성 후)

아래 명령은 Ubuntu 24.04 ARM64 인스턴스에 SSH로 접속한 뒤 실행한다. 최초 SSH 사용자는 `ubuntu`다. 접속 키는 로컬 PC에만 보관하고 GitHub·채팅·서버에 올리지 않는다. 보안 그룹은 SSH 22를 본인 공인 IP로만, HTTP 80과 HTTPS 443을 공개로 설정한다. EC2 공인 IP가 바뀌면 HTTPS 주소도 바뀌므로 Elastic IP 연결 상태를 먼저 확인한다.

1. 개발 PC에서 `bash scripts/portfolio-package.sh <출력 경로>/welive-arm64.tar.gz`로 이미지를 만든다. 2026-10-27 최종 보안 업데이트 기준 묶음은 로컬 `/tmp/welive-arm64-secure.tar.gz`에 만들었고 압축 무결성 및 세 이미지의 ARM64 아키텍처를 확인했다. `compose.portfolio.yaml`, `caddy/Caddyfile`, `scripts/portfolio-server-install.sh`, `scripts/portfolio-init-env.sh`, `scripts/portfolio-start.sh`, `scripts/portfolio-backup.sh` 및 이미지 묶음을 SSH/SCP로 서버의 `~/welive`에 전송한다. 실제 환경 파일과 개인키는 전송 대상에서 제외한다.
2. 서버에서 `bash scripts/portfolio-server-install.sh`를 실행한다. [Docker 공식 Ubuntu 설치 절차](https://docs.docker.com/engine/install/ubuntu/)의 apt 저장소 방식을 사용한다. 완료 후 SSH를 끊고 다시 접속해 `docker compose version`을 확인한다.
3. `bash scripts/portfolio-init-env.sh <EC2의 고정 공인 IPv4>`로 랜덤 DB/JWT 비밀값과 무료 `sslip.io` 주소를 생성한다. 이 명령은 기존 `.env.portfolio`를 덮어쓰지 않는다. `chmod 600 .env.portfolio`를 유지하고 값을 출력·공유하지 않는다.
4. `bash scripts/portfolio-start.sh ./welive-arm64.tar.gz`로 ARM64 이미지를 불러오고 PostgreSQL/Redis → 마이그레이션 → API/화면/Caddy 순서로 시작한다. `docker compose --env-file .env.portfolio -f compose.portfolio.yaml ps`와 `https://<SITE_HOST>/api/ping`을 확인한다. DNS·인증서 발급 지연 중에는 몇 분 기다린 뒤 다시 확인한다.
5. 초기 최고관리자는 `docker compose --env-file .env.portfolio -f compose.portfolio.yaml exec -T backend node dist/cli/bootstrap-admin.js`를 실행한 뒤 JSON 한 줄을 표준 입력으로 전달한다. 필수 필드는 `username`, `password`, `contact`(010으로 시작하는 11자리), `name`, `email`, `role: "SUPER_ADMIN"`, `joinStatus: "APPROVED"`다. 비밀번호는 8~20자이며 입력 내용을 명령 인자·셸 기록·파일에 남기지 않는다. 공개용 데모 계정은 실제 주민 이름·연락처 대신 가상값을 사용한다.
6. 주민·관리자 브라우저에서 로그인, 민원 두 건 묶기, 처리 상태, 공지 발행, 알림, 파일 업로드를 확인한다. `bash scripts/portfolio-backup.sh <서버 백업 디렉터리>` 실행 후 백업 파일을 로컬 PC로 복사하고 복원을 검증한다.

`docker` 그룹에 추가된 사용자는 사실상 서버 관리자 권한을 가진다. SSH 개인키와 해당 계정을 공유하지 않는다. 서버에 비밀값을 만드는 단계는 사용자가 서버와 키를 준비한 뒤 Codex가 함께 실행·검증한다. 호스트 공인 HTTPS, AWS 과금, 예산 알림 상태는 아직 실측 전이다.

## 로컬 Docker Desktop 시작 오류 (2026-10-27)

Windows에서 `dockerInference: The file cannot be accessed by the system` 오류가 발생했다. Docker Desktop의 임시 AF_UNIX 소켓이 남아 백엔드가 시작하지 못한 상태였고, `%LOCALAPPDATA%\Docker\run`과 `%LOCALAPPDATA%\docker-secrets-engine` 두 **런타임 폴더**를 같은 상위 디렉터리에서 `.stale-날짜` 이름으로 옮긴 뒤 재시작해 Docker Engine 29.3.1과 Ubuntu WSL 연결을 확인했다. 이미지·볼륨 데이터가 있는 `%LOCALAPPDATA%\Docker\wsl`은 건드리지 않았다. 이전 소켓 파일 자체 삭제는 Windows에서 접근 오류로 실패했다.

같은 오류 재발 시 먼저 Docker Desktop 로그의 정확한 경로를 확인한다. 공장 초기화는 누르지 않는다. [Docker Desktop 동일 오류 보고](https://github.com/docker/desktop-feedback/issues/531)와 [공식 초기화 안내](https://docs.docker.com/desktop/troubleshoot-and-support/troubleshoot/)를 참고한다.

## 최종 로컬 검증 (2026-10-27)

- `npm run typecheck`, 전용 PostgreSQL 16의 Jest **20개 묶음·260개 테스트**, `bash -n scripts/portfolio-*.sh`, `git diff --check` 통과.
- `npm audit --omit=dev` **0건**. 전체 개발 의존성에는 `esbuild`의 Windows 개발 서버 관련 low 1건이 남는다. 최종 ARM64 운영 의존성 설치 로그도 취약점 0건이다.
- `/tmp/welive-arm64-secure.tar.gz`의 gzip 검사, 세 이미지의 ARM64 아키텍처, backend의 node 사용자 파일 읽기, ARM64 migrator의 26개 마이그레이션 조회를 확인했다. migrator는 x86 PC의 에뮬레이션 환경에서 실행했으므로 실제 EC2 성능 검증은 아니다.
- AWS EC2 생성 양식에 Ubuntu 24.04 LTS ARM64, t4g.small, 20 GiB gp3 암호화, SSH 현재 IP 제한까지 입력했다. 키 페어·HTTP/HTTPS 공개 규칙·최종 생성은 사용자 확인을 기다린다. 아직 AWS 자원은 없다.
