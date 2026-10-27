# 포트폴리오용 AWS 배포 진행표

최종 확인: 2026-10-27

## 현재 공개 배포 결과 (2026-10-27)

- [데모 사이트](https://3-107-54-69.sslip.io/)가 시드니 EC2 `i-0214bf7486f75e867`에서 실행 중이다. HTTPS 화면과 `/api/ping`은 200, HTTP는 308로 HTTPS 이동. 인스턴스의 `3.107.54.69`는 자동 할당 주소이며, **중지 후 재시작하면 바뀔 수 있다**. Elastic IP와 유료 도메인은 연결하지 않았다. IP가 바뀌면 `SITE_HOST` 등 환경값과 Caddy 인증서 주소를 갱신해야 한다.
- 서버 구성: Ubuntu 24.04 ARM64, t4g.small, 암호화 20 GiB gp3, 공식 Docker Engine/Compose, 1 GiB swap, Caddy/Next/Express/PostgreSQL/Redis. 26개 마이그레이션을 적용했다. SSH는 생성 당시 사용자 공인 IP로만, HTTP 80·HTTPS 443은 공개한다.
- 초기 운영자 `portfolio_root`, 데모 관리자 `demo_admin`, 주민 `demo_resident1`/`demo_resident2`는 가상 정보다. 비밀번호와 SSH 개인키는 `C:\Users\taewon\projects\welive`의 접근 제한 파일에만 보관한다. 주민 브라우저 시연 시 해당 파일을 로컬에서 확인한다.
- 2026-10-28 주민 공지 상세의 원시 ISO 날짜를 한국 시간 형식으로 수정해 프런트 ARM64 이미지 재빌드·교체 완료. 프런트 컨테이너 healthy, 공개 첫 화면·API 200 확인. 브라우저 새로고침 후 한국 시간 표시를 사용자가 확인했다.
- 실제 HTTPS API에서 관리자 가입/승인, 주민 2명 가입/승인/로그인, 게시판 3종, 민원 2건 연결, 공동 문제 처리중/완료 동기화, 동일 요청 멱등성, 주민별 비공개 민원 격리(HTTP 403), 관리자 최종 공지 발행 및 주민 목록 표시를 확인했다. 완료 상태 저장만으로 공지가 자동 발행되지 않는 것도 확인했다. 알림 DB에서 공동 문제 업데이트 알림 4건과 처리 완료 Outbox 8건을 확인했다. 관리자·주민 브라우저 로그인과 민원·공동 문제·완료 공지 화면을 사용자가 확인했다. SSE 장시간 재연결은 별도 점검 범위다.
- 서버 백업을 생성하고 별도 DB로 복원해 마이그레이션 26개, 사용자 4명, 공동 문제 1건을 확인했다. 서버 외부 사본: `C:\Users\taewon\projects\welive\backups`. 백업은 자격 증명 해시를 포함하므로 비공개로 보관한다. 새 데이터가 쌓이면 정기 백업이 필요하다.
- PR #2는 2026-10-28 개인 저장소 `main`에 병합됐다(병합 커밋 `314aaa9`). 최신 PR 커밋 `4c821d9`의 CI 전체가 성공했다. 로컬 `main`도 동기화했다.
- EC2 콘솔의 컴퓨트 요금은 US$0.0212/시간(730시간 약 US$15.48), 공인 IPv4는 별도이며 EBS·전송량 등도 별도다. 2026-10-28 AWS Billing에서 무료 플랜 크레딧 US$100 잔액·남은 178일을 확인했다. 집계는 지연될 수 있다. 월 US$5 비용 예산 `WELIVE-portfolio-monthly-5`를 만들었지만 이메일 수신자 인증 발송에 필요한 `notifications-contacts` 권한이 없어 수신 상태가 Inactive다. 따라서 **이메일 알림은 아직 동작하지 않는다**. 예산은 비용 상한이 아니다.

## 이 계정에서 확인한 조건

- AWS **무료 플랜**, 남은 크레딧 **US$100**, 남은 기간 **약 180일**을 로그인한 콘솔에서 확인했다. 화면 수치는 시간이 지나면 바뀐다.
- 무료 플랜은 서울 리전의 EC2 접근을 막고 시드니(`ap-southeast-2`) 리전을 안내한다. Lightsail도 읽기 API가 거부된다. AWS 공식 무료 서비스 표에서 Lightsail 체험은 유료 플랜 대상으로 표시된다.
- 따라서 현재 계정에서는 **시드니 EC2 t4g.small (ARM64, 2 vCPU, 2 GiB)** 한 대를 우선 후보로 삼는다. 콘솔의 Linux 온디맨드 요금은 **US$0.0212/시간**이다. 730시간 가동 시 인스턴스만 약 **US$15.48**이며, EBS 디스크·공인 IPv4·전송량·세금 등은 별도다. 이 값은 청구 금액이나 상한이 아니다.
- 무료 플랜은 크레딧 소진 또는 기간 종료 시 계정 접근이 종료된다. 유료 플랜으로 바꾸면 잔여 크레딧은 적용되지만 초과 사용에 요금이 발생할 수 있다. **현재 유료 전환은 진행하지 않았다.**
- 도메인은 없고 실제 입주민 정보는 사용하지 않는다. 현재 자동 할당 공인 IPv4에 `<IP를 하이픈으로 바꾼 값>.sslip.io`를 연결했고 Caddy가 HTTPS 인증서를 발급받았다. 이 무료 DNS 서비스에 대한 의존성이 있다.

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
5. 최종 코드의 ARM64 백엔드·마이그레이션·프런트 이미지와 356 MiB 전송 묶음을 만들었다. ARM64 백엔드 실행 파일 권한 및 ARM64 마이그레이션 이미지에서 26개 마이그레이션 기록을 확인했다. AWS 기동·공인 HTTPS·서버 백업 복원은 현재 공개 배포 결과에서 확인했다. 주민/관리자 브라우저 화면 최종 검증은 남았다.

## 이후 운영 중 확인할 일

1. AWS Billing에서 무료 플랜 크레딧과 월 예산 사용액을 주기적으로 확인한다. 예산 이메일은 현재 계정 권한 부족으로 Inactive이며 비용을 자동 차단하지 않는다.
2. 포트폴리오 시연 전 공개 주소와 서버 상태를 확인한다. EC2 중지 후 재시작하면 자동 할당 IP와 `sslip.io` 주소가 바뀔 수 있다.
3. 새 데모 데이터가 쌓이면 `scripts/portfolio-backup.sh`로 백업해 서버 밖에 보관하고 `scripts/portfolio-verify-backup.sh`로 복원 가능성을 확인한다.
4. 장시간 SSE 재연결과 여러 기기 화면은 이번 배포의 미검증 범위로 남겨두고, 필요할 때 별도 점검한다.

## 운영 시 주의

- `.env.portfolio.example`은 예시다. 실제 `.env.portfolio`와 SSH 개인키는 저장소/채팅에 올리지 않는다.
- `prisma/seed.ts`에는 개발용 기본 최고관리자 비밀번호가 있으므로 공개 서버에서 실행하지 않는다. `dist/cli/bootstrap-admin.js`로 최초 최고관리자를 생성한다.
- DB 덤프와 이미지 볼륨을 **서버 밖으로 복사**하고 복원 확인 후 시연 데이터를 올린다. 같은 서버에만 둔 백업은 서버 손실을 막지 못한다.
- 예산 알림은 비용을 자동 차단하지 않으며 집계가 지연될 수 있다. 현재 무료 플랜을 유지하는 것이 무과금 보호 장치다.

## 첫 서버 설치 명령 (EC2 생성 후)

아래 명령은 Ubuntu 24.04 ARM64 인스턴스에 SSH로 접속한 뒤 실행한다. 최초 SSH 사용자는 `ubuntu`다. 접속 키는 로컬 PC에만 보관하고 GitHub·채팅·서버에 올리지 않는다. 보안 그룹은 SSH 22를 본인 공인 IP로만, HTTP 80과 HTTPS 443을 공개로 설정한다. EC2 공인 IP가 바뀌면 HTTPS 주소도 바뀐다. 현재 Elastic IP가 없으므로 IP·`SITE_HOST`·Caddy 주소를 함께 갱신한다.

1. 개발 PC에서 `bash scripts/portfolio-package.sh <출력 경로>/welive-arm64.tar.gz`로 이미지를 만든다. 2026-10-27 최종 보안 업데이트 기준 묶음은 로컬 `/tmp/welive-arm64-secure.tar.gz`에 만들었고 압축 무결성 및 세 이미지의 ARM64 아키텍처를 확인했다. `compose.portfolio.yaml`, `caddy/Caddyfile`, `scripts/portfolio-server-install.sh`, `scripts/portfolio-init-env.sh`, `scripts/portfolio-start.sh`, `scripts/portfolio-backup.sh` 및 이미지 묶음을 SSH/SCP로 서버의 `~/welive`에 전송한다. 실제 환경 파일과 개인키는 전송 대상에서 제외한다.
2. 서버에서 `bash scripts/portfolio-server-install.sh`를 실행한다. [Docker 공식 Ubuntu 설치 절차](https://docs.docker.com/engine/install/ubuntu/)의 apt 저장소 방식을 사용한다. 완료 후 SSH를 끊고 다시 접속해 `docker compose version`을 확인한다.
3. `bash scripts/portfolio-init-env.sh <EC2의 현재 공인 IPv4>`로 랜덤 DB/JWT 비밀값과 무료 `sslip.io` 주소를 생성한다. 이 명령은 기존 `.env.portfolio`를 덮어쓰지 않는다. `chmod 600 .env.portfolio`를 유지하고 값을 출력·공유하지 않는다.
4. `bash scripts/portfolio-start.sh ./welive-arm64.tar.gz`로 ARM64 이미지를 불러오고 PostgreSQL/Redis → 마이그레이션 → API/화면/Caddy 순서로 시작한다. `docker compose --env-file .env.portfolio -f compose.portfolio.yaml ps`와 `https://<SITE_HOST>/api/ping`을 확인한다. DNS·인증서 발급 지연 중에는 몇 분 기다린 뒤 다시 확인한다.
5. 초기 최고관리자는 `docker compose --env-file .env.portfolio -f compose.portfolio.yaml exec -T backend node dist/cli/bootstrap-admin.js`를 실행한 뒤 JSON 한 줄을 표준 입력으로 전달한다. 필수 필드는 `username`, `password`, `contact`(010으로 시작하는 11자리), `name`, `email`, `role: "SUPER_ADMIN"`, `joinStatus: "APPROVED"`다. 비밀번호는 8~20자이며 입력 내용을 명령 인자·셸 기록·파일에 남기지 않는다. 공개용 데모 계정은 실제 주민 이름·연락처 대신 가상값을 사용한다.
6. 주민·관리자 브라우저에서 로그인, 민원 두 건 묶기, 처리 상태, 공지 발행, 알림, 파일 업로드를 확인한다. `bash scripts/portfolio-backup.sh <서버 백업 디렉터리>` 실행 후 백업 파일을 로컬 PC로 복사하고 복원을 검증한다.

`docker` 그룹에 추가된 사용자는 사실상 서버 관리자 권한을 가진다. SSH 개인키와 해당 계정을 공유하지 않는다. 초기 서버 비밀값 생성과 공개 HTTPS 검증은 완료했다. 실제 AWS 청구와 예산 알림 상태는 AWS Billing에서 계속 확인한다.

## 로컬 Docker Desktop 시작 오류 (2026-10-27)

Windows에서 `dockerInference: The file cannot be accessed by the system` 오류가 발생했다. Docker Desktop의 임시 AF_UNIX 소켓이 남아 백엔드가 시작하지 못한 상태였고, `%LOCALAPPDATA%\Docker\run`과 `%LOCALAPPDATA%\docker-secrets-engine` 두 **런타임 폴더**를 같은 상위 디렉터리에서 `.stale-날짜` 이름으로 옮긴 뒤 재시작해 Docker Engine 29.3.1과 Ubuntu WSL 연결을 확인했다. 이미지·볼륨 데이터가 있는 `%LOCALAPPDATA%\Docker\wsl`은 건드리지 않았다. 이전 소켓 파일 자체 삭제는 Windows에서 접근 오류로 실패했다.

같은 오류 재발 시 먼저 Docker Desktop 로그의 정확한 경로를 확인한다. 공장 초기화는 누르지 않는다. [Docker Desktop 동일 오류 보고](https://github.com/docker/desktop-feedback/issues/531)와 [공식 초기화 안내](https://docs.docker.com/desktop/troubleshoot-and-support/troubleshoot/)를 참고한다.

## 최종 로컬 검증 (2026-10-27)

- `npm run typecheck`, 전용 PostgreSQL 16의 Jest **20개 묶음·260개 테스트**, `bash -n scripts/portfolio-*.sh`, `git diff --check` 통과.
- `npm audit --omit=dev` **0건**. 전체 개발 의존성에는 `esbuild`의 Windows 개발 서버 관련 low 1건이 남는다. 최종 ARM64 운영 의존성 설치 로그도 취약점 0건이다.
- `/tmp/welive-arm64-secure.tar.gz`의 gzip 검사, 세 이미지의 ARM64 아키텍처, backend의 node 사용자 파일 읽기, ARM64 migrator의 26개 마이그레이션 조회를 확인했다. migrator는 x86 PC의 에뮬레이션 환경에서 실행했으므로 실제 EC2 성능 검증은 아니다.
- AWS EC2는 2026-10-27 사용자가 최종 생성했고, 공개 HTTPS와 실서버 API를 확인했다.
