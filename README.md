# 🏠 WeLive — 아파트 주민·관리 통합 플랫폼

아파트 주민과 관리자가 하나의 플랫폼에서 소통하고 관리할 수 있는 통합 서비스입니다.

> **프로젝트 기간:** 2025.03.26 ~ 2025.05.11

<br/>

## 🔗 링크

| 구분 | 링크 |
|------|------|
| 서비스 | [(https://www.nb07weliveteam4.cloud](https://www.nb07weliveteam4.cloud) |
| API Swagger | [nb-project-welive-be.vercel.app/api](https://nb-project-welive-be.vercel.app/api) |
| 프로젝트 문서 (Notion) | [프로젝트 계획서 & 개발 리포트](https://www.notion.so/WELIVE-35d9eb10fd748095a335e517076bf414) |
| 팀 안내 문서 | [위리브 안내](https://codeit.notion.site/1f46fd228e8d80cdbc7af27b082d118d) |

<br/>

## 👥 팀 구성

| 이름 | 역할 |
|------|------|
| 박태원 | 팀장 · 민원 · 공지사항 · 댓글 · 이벤트 관리 |
| 서석규 | 아파트 · 투표 · 투표 스케줄 |
| 이경민 | 서기 · 인증 · 사용자 · 입주민 관리 |
| 이창호 | 알림 · 배포 |

<br/>

## 🛠 기술 스택

### Backend
- **Runtime:** Node.js 20
- **Framework:** Express v5
- **Language:** TypeScript 5.5

### Database
- **DB:** PostgreSQL 16
- **ORM:** Prisma v7
- **Cache / Queue:** Redis 7 · BullMQ

### Infra
- **Server:** AWS EC2
- **Storage:** AWS S3
- **Container:** Docker · Docker Compose
- **CI/CD:** GitHub Actions
- **AI 자동화:** Claude API (PR 리뷰 · 보안 체크 · 배포 알림)

### Testing
- **Framework:** Jest · Supertest
- **방식:** 통합 테스트 (mock 없이 실제 DB + HTTP 요청 기반) · 총 210개

<br/>

## ✨ 주요 기능

| 기능 | 설명 |
|------|------|
| 공지사항 | 관리자가 공지 등록 시 입주민 실시간 알림 전송, 일정 자동 등록 |
| 민원 | 공개·비공개 설정, 상태 관리(접수전→처리중→처리완료), 상태 변경 시 알림 |
| 댓글 | 공지사항·민원에 댓글 등록·수정·삭제, 권한 기반 접근 제어 |
| 이벤트 | 아파트 캘린더 일정 관리, 공지사항 등록 시 자동 생성 |
| 투표 | 입주민 투표 생성·참여·마감 자동화 |
| 실시간 알림 | SSE + Bull Queue + Outbox 패턴 기반 안정적 알림 전송 |
| 배포 자동화 | Claude AI 보안 체크 → Docker 빌드 → EC2 배포 → 에러 분석 → Slack 알림 |

<br/>

## 🏗 시스템 아키텍처

```
Client (Next.js)
      │ HTTPS
      ▼
API Server (Express v5 · Node.js · TypeScript · AWS EC2)
      │
      ├── PostgreSQL (Prisma ORM · AWS RDS)
      ├── Redis (Bull Queue · Pub/Sub)
      └── AWS S3 (파일 업로드)
            │
            ▼
      Notification System (SSE · Queue · Outbox 패턴)
            │
            ▼ 실시간 알림
      Client

CI/CD (GitHub Actions)
  보안 체크 → Docker 빌드 → ECR push → EC2 배포 → 로그 분석 → Slack 알림
```

<br/>

## 📁 프로젝트 구조

```
nb07-welive-team4/
├── .github/
│   └── workflows/
│       ├── ci.yaml                 # PR 테스트 자동화
│       ├── deploy.yaml             # main 브랜치 EC2 자동 배포
│       └── claude-review.yml       # Claude AI PR 코드 리뷰
│
├── prisma/
│   ├── schema.prisma               # DB 스키마 정의
│   └── migrations/                 # 마이그레이션 히스토리
│
├── src/
│   ├── app.ts                      # Express 앱 설정
│   ├── server.ts                   # 서버 진입점
│   │
│   ├── controllers/                # 요청/응답 처리
│   ├── services/                   # 비즈니스 로직
│   ├── repositories/               # DB 쿼리
│   ├── routes/                     # API 엔드포인트 등록
│   ├── middlewares/                # 인증, 에러 처리 등 공통 로직
│   ├── structs/                    # 입력값 유효성 검사 (superstruct)
│   ├── types/                      # TypeScript 타입 정의
│   ├── lib/                        # 외부 서비스 연결 (DB, Redis, S3)
│   ├── queue/                      # 알림 큐 설정
│   ├── workers/                    # 백그라운드 알림 워커
│   ├── utils/                      # 유틸리티 함수
│   └── docs/                       # Swagger 문서
│
├── tests/                          # 통합 테스트 (210개)
│   ├── setup.ts                    # 테스트 환경 설정
│   ├── test-utils.ts               # 공통 유틸
│   ├── auth.test.ts
│   ├── comment.test.ts
│   ├── complaint.test.ts
│   ├── event.test.ts
│   ├── notice.test.ts
│   ├── poll.test.ts
│   ├── resident.test.ts
│   ├── user.test.ts
│   └── ...
│
├── .env                            # 환경변수 (git 제외)
├── .env.example                    # 환경변수 예시
├── .dockerignore
├── .gitignore
├── compose.yaml                    # Docker Compose 설정
├── deploy.sh                       # EC2 배포 스크립트
├── Dockerfile                      # 프로덕션 Docker 이미지
├── jest.config.cjs                 # Jest 설정
├── package.json
├── prisma.config.ts                # Prisma 설정
├── tsconfig.json                   # TypeScript 기본 설정
├── tsconfig.build.json             # 빌드용 TypeScript 설정
├── tsconfig.test.json              # 테스트용 TypeScript 설정
└── tsup.config.ts                  # 번들러 설정
```

<br/>

## 🚀 로컬 실행 방법

프론트와 백엔드를 함께 실행하고 AWS에 배포하는 최신 절차는 [`docs/deployment.md`](docs/deployment.md)를 참고하세요.

### 사전 준비
- Node.js 20+
- Docker
- PostgreSQL 16
- Redis 7

### 설치 및 실행

```bash
# 1. 레포지토리 클론
git clone https://github.com/nb07-welive-team4/nb07-welive-team4.git
cd nb07-welive-team4

# 2. 패키지 설치
npm ci
cd frontend && npm ci && cd ..

# 3. 환경변수 설정
cp .env.example .env
# .env 파일에 아래 환경변수 값 입력

# 4. 기존 DB 마이그레이션 적용
npx prisma migrate deploy
npx prisma generate

# 5. 개발 서버 실행
npm run dev
```

### Docker로 전체 서비스 실행

```bash
docker compose -f compose.local.yaml build
docker compose -f compose.local.yaml --profile tools run --rm migration
docker compose -f compose.local.yaml up -d
```

<br/>

## ⚙️ 환경변수

`.env.example`을 복사해 `.env`를 작성해주세요.

```env
# ── 서버 ──────────────────────────────
NODE_ENV=development
PORT=4000
CORS_ORIGIN=http://localhost:3000

# ── 데이터베이스 ───────────────────────
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/welive
DB_HOST=localhost
DB_PORT=5432
DB_NAME=welive
DB_USER=postgres
DB_PASSWORD=postgres
DB_SSL=false

# ── JWT ───────────────────────────────
JWT_SECRET=your_jwt_secret
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret

# ── Redis ─────────────────────────────
REDIS_URL=redis://localhost:6379

# ── AWS S3 ────────────────────────────
AWS_REGION=ap-northeast-2
S3_BUCKET=your_s3_bucket_name
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key

# ── Slack (배포 알림) ─────────────────
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
```

<br/>

## 🧪 테스트

```bash
# 전체 테스트 실행
npm test

# 특정 도메인만 실행
npm test -- --testPathPattern="comment|complaint|event|notice"

# CI 환경
npm run test:ci
```

> 통합 테스트 총 **210개** — mock 없이 실제 DB + HTTP 요청으로 전체 플로우 검증
