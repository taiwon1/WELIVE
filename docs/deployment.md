# WELIVE 로컬 연동 및 AWS 배포 안내

최종 갱신: 2026-10-01

## 준비된 실행 구조

```text
사용자
  -> ALB (HTTPS 인증서)
  -> EC2:80 / Nginx
       -> /        Next.js:3000
       -> /api/*   Express:4000
       -> /api/notifications/sse (버퍼링 해제)

Express -> RDS PostgreSQL
        -> Redis 컨테이너
        -> 비공개 S3 -> CloudFront
```

브라우저는 API 서버 주소를 따로 저장하지 않고 같은 출처의 `/api`만 사용한다. 로컬에서는 Next rewrite 또는 Nginx가 요청을 백엔드로 전달하고, 운영에서는 Nginx가 전달한다.

## 로컬 통합 실행

Docker Desktop을 시작하고 WSL Integration에서 Ubuntu를 활성화한 다음 저장소 루트에서 실행한다.

```bash
docker compose -f compose.local.yaml build
docker compose -f compose.local.yaml --profile tools run --rm migration
docker compose -f compose.local.yaml up -d
```

- 서비스: `http://localhost:3000`
- 백엔드 직접 확인: `http://localhost:4000/health`
- 종료: `docker compose -f compose.local.yaml down`
- 로컬 DB까지 삭제: `docker compose -f compose.local.yaml down -v` (로컬 데이터가 삭제되므로 필요한 경우에만 실행)

S3 업로드를 로컬에서 검증하려면 별도의 로컬 AWS 자격 증명과 실제 버킷이 필요하다. 로그인, 민원, 공동 문제, 알림 등 S3를 사용하지 않는 기능은 기본 placeholder로 실행할 수 있다.

## AWS에서 사용자가 준비할 자원

아래 단계부터는 AWS 계정 소유자가 콘솔이나 IaC로 생성한다. 기존 팀 계정 ID와 저장소 이름은 배포 코드에서 제거되어 있다.

### 1. 비용과 리전

1. 개인 AWS 계정에서 Billing의 AWS Budget 월 예산 알림을 만든다.
2. 리전은 모든 자원에 `ap-northeast-2`를 사용한다.
3. Route 53에서 사용할 도메인을 준비하거나 보유한 도메인의 DNS를 사용할 수 있게 한다.

### 2. 네트워크와 보안 그룹

같은 VPC에 ALB, EC2, RDS를 둔다.

- ALB 보안 그룹: 인터넷에서 80/443 허용
- EC2 보안 그룹: 80을 ALB 보안 그룹에서만 허용. SSH를 쓸 경우 22는 본인 IP만 허용
- RDS 보안 그룹: 5432를 EC2 보안 그룹에서만 허용
- 3000, 4000, 5432, 6379는 인터넷에 공개하지 않는다.

### 3. RDS PostgreSQL

1. PostgreSQL 16 인스턴스를 생성한다.
2. Public access를 끄고 EC2와 같은 VPC에 둔다.
3. 저장소 암호화와 자동 백업을 켠다.
4. DB 이름, 사용자, 비밀번호, 엔드포인트를 비밀번호 관리자에 보관한다.

테스트 DB가 아닌 운영 RDS에 CI 테스트를 연결하지 않는다. CI 테스트는 GitHub Actions의 임시 PostgreSQL만 사용한다.

### 4. ECR

ECR Private registry에 저장소 두 개를 만든다.

- `welive-backend`
- `welive-frontend`

배포는 `latest`도 만들지만 실제 EC2 배포에는 Git commit SHA 태그를 사용한다.

### 5. S3와 CloudFront

1. S3 버킷을 만들고 Block Public Access를 유지한다.
2. CloudFront 배포를 만들고 S3를 Origin Access Control(OAC)로 연결한다.
3. `assets.<도메인>` 인증서와 DNS 레코드를 CloudFront에 연결한다.
4. EC2 인스턴스 역할에는 해당 버킷의 `PutObject`, `DeleteObject`만 허용한다.
5. 앱의 `ASSET_BASE_URL`에는 `https://assets.<도메인>`을 넣는다.

현재 서버는 업로드한 URL을 DB에 저장하므로 CloudFront 주소를 운영 시작 전에 확정한다.

### 6. EC2

1. EC2를 생성하고 Elastic IP를 연결한다.
2. EC2 인스턴스 역할에 ECR pull 권한과 위 S3 최소 권한을 연결한다.
3. Docker, Docker Compose plugin, AWS CLI, curl을 설치한다.
4. `~/deploy/welive/.env`를 `.env.production.example` 기준으로 작성한다.

비밀값은 다음처럼 EC2에서 직접 만든다.

```bash
openssl rand -base64 48
openssl rand -base64 48
```

각 결과를 `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`에 한 번씩 넣는다. 결과를 GitHub 이슈, README, Git commit에 남기지 않는다. 장기 AWS Access Key는 `.env`에 넣지 않고 EC2 인스턴스 역할을 사용한다.

### 7. ALB, ACM, Route 53

1. ACM에서 서비스 도메인의 인증서를 발급하고 DNS 검증한다.
2. ALB HTTPS 443 리스너에 인증서를 연결한다.
3. ALB 대상 그룹은 EC2의 80 포트, 상태 확인 경로는 `/healthz`로 설정한다.
4. HTTP 80 리스너는 HTTPS 443으로 리다이렉트한다.
5. Route 53 A/AAAA Alias 레코드를 ALB로 연결한다.

운영 백엔드는 Secure 쿠키를 사용하므로 실제 로그인 검증은 HTTPS 연결 후 수행한다.

### 8. GitHub OIDC와 배포 설정

GitHub Actions용 IAM OIDC provider와 역할을 만든다. 역할의 신뢰 정책은 이 저장소와 `main` 브랜치로 제한하고 ECR 두 저장소에 push할 권한만 준다.

GitHub 저장소의 Settings → Environments에서 `production` 환경을 만들고 다음 값을 설정한다.

Variables:

| 이름 | 예시 |
| --- | --- |
| `AWS_REGION` | `ap-northeast-2` |
| `AWS_DEPLOY_ROLE_ARN` | `arn:aws:iam::<account>:role/welive-github-deploy` |
| `ECR_BACKEND_REPOSITORY` | `welive-backend` |
| `ECR_FRONTEND_REPOSITORY` | `welive-frontend` |
| `ASSET_HOST` | `assets.example.com` (프로토콜 제외) |

Secrets:

| 이름 | 값 |
| --- | --- |
| `SSH_HOST` | EC2 Elastic IP 또는 접속용 호스트 |
| `SSH_USER` | AMI의 SSH 사용자, 예: `ubuntu` |
| `SSH_PRIVATE_KEY` | 해당 EC2 키의 private key 전체 내용 |

가능하면 production 환경에 Required reviewers를 설정해 CI 통과 후 수동 승인을 받아 배포한다.

## 첫 배포

1. 기능 브랜치에서 PR을 만든다.
2. `CI`의 PostgreSQL 16 마이그레이션, 백엔드 테스트·빌드, 프론트 빌드, Docker 빌드가 모두 통과하는지 확인한다.
3. PR을 `main`에 병합한다.
4. `CI` main 실행이 성공하면 `Deploy to EC2`가 시작된다.
5. 배포 스크립트가 앱 이미지와 일회용 마이그레이션 이미지를 pull하고 `prisma migrate deploy`를 실행한 뒤 컨테이너를 바꾼다. 운영 백엔드 이미지에는 Prisma CLI와 개발 의존성이 포함되지 않는다.
6. `/healthz`가 실패하면 직전 애플리케이션 이미지를 다시 실행한다. 이미 적용된 DB 마이그레이션은 자동으로 되돌리지 않으므로 마이그레이션은 이전 앱과 호환되는 순서로 작성한다.

## 배포 후 확인

1. HTTPS 페이지와 `/healthz`, `/api/ping` 응답
2. 가입 전 단지 조회
3. 로그인, 새로고침 세션 복구, 토큰 갱신, 로그아웃
4. 주민 민원 작성과 관리자 조회
5. 여러 민원을 공동 문제로 생성
6. 처리 상황 등록 후 주민 한 명당 알림 한 건 생성
7. 알림 클릭 후 주민 처리 이력 화면 이동
8. SSE 연결을 끊었다가 브라우저 자동 재연결
9. 이미지 업로드와 CloudFront 이미지 조회
10. EC2 재시작 후 네 컨테이너 자동 재시작

문제가 나면 EC2에서 다음을 확인한다.

```bash
cd ~/deploy/welive
sudo docker compose ps
sudo docker compose logs --tail=200 proxy frontend backend redis
```
