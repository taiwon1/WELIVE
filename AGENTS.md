# WELIVE 작업 안내와 포트폴리오 확장 계획

최종 확인: 2026-10-01. 다음 작업은 이 파일부터 읽는다. 코드와 설정이 바뀌면 해당 항목을 갱신한다. 이 문서는 재탐색을 줄이기 위한 기준이며, 설치·실행 성공을 보증하지 않는다.

## 프로젝트 목적과 범위

- 부트캠프 팀 프로젝트인 아파트 입주민·관리 통합 플랫폼의 백엔드. 취업 포트폴리오용 개인 확장이 목적이다.
- README 기준 박태원 담당: 팀장, 민원, 공지사항, 댓글, 이벤트. 팀 개발 성과와 개인 확장 성과를 구분해 기록한다.
- 제공받은 Next.js 프런트엔드를 `frontend/`에 반입하고 백엔드와 같은 출처의 `/api`로 연결했다.
- 공동 문제(Incident) 수동 연결·처리 이력·작성자별 중복 방지 알림의 백엔드와 관리자·주민 프런트 1차 구현을 완료했다. 아래 초기 계획 중 AI 추천·공지 연계는 아직 미구현이다.

## 확인된 환경

- 작업 경로: `/home/taewon/projects/WELIVE`, Linux/WSL 경로 체계, bash.
- 브랜치 main에 공동 문제, 프런트 도입, 배포 준비 변경이 아직 커밋되지 않은 상태다. 브랜치와 변경 상태는 매 작업 시작 시 간단히 확인한다.
- 설치 도구: Node v24.13.0, npm 11.6.2. Docker 실행 파일은 Windows Docker 경로에 있으나 2026-10-01 확인 당시 Docker Desktop/WSL Integration이 꺼져 있어 이미지와 Compose 실행은 검증하지 못했다.
- 백엔드와 프런트 node_modules가 설치되어 있다. .env는 만들지 않았다. psql과 redis-cli는 PATH에서 발견되지 않음.
- 기본 셸 샌드박스는 bwrap 미설치로 실행 실패했다. 이 세션의 파일 조회·문서 작성은 승인된 대체 실행을 사용했다. 이는 호스트 상태이므로 다음 세션에서도 같다고 단정하지 않는다.
- 임시 PostgreSQL 18.4에서 마이그레이션과 관련 통합 테스트를 실행했다. 실제 브라우저·Docker·PostgreSQL 16 CI는 아직 검증하지 않았다.

## 기술과 탐색 지도

- TypeScript 5.5, ESM, Express 5, PostgreSQL, Prisma 7.6, pg adapter, Redis/ioredis, BullMQ, AWS S3.
- 잠금 파일의 @prisma/client Node 요구사항: `^20.19 || ^22.12 || >=24.0`. Docker/CI는 Node 20 계열, 현재 로컬은 24 계열이다.
- `src/app.ts`: Express 설정, 라우트 등록, /health, /api/ping.
- `src/server.ts`: API, Redis Pub/Sub, 알림 큐·워커, 투표 스케줄러 시작 및 종료 처리.
- `src/routes` → `controllers` → `services` → `repositories`: 일반적인 요청 흐름.
- `src/structs`: superstruct 입력 검증. `src/types`: DTO와 타입.
- `prisma/schema.prisma`, `prisma/migrations`, `prisma.config.ts`: 모델과 DB 변경.
- `src/docs`: Swagger. `tests`: Jest/Supertest. `.github/workflows`: CI와 배포.
- `src/lib/prisma.ts`는 DATABASE_URL, `src/lib/db.ts`는 별도의 DB_* 설정으로 연결한다. 두 설정은 같은 대상 DB를 가리켜야 한다.
- Board.id는 게시판 ID다. Comment.boardId와 Event.boardId는 게시글 ID 용도로 사용되므로 혼동하지 않는다.

## 현재 기능 지도

| 영역 | 확인한 구현 |
| --- | --- |
| 인증·계정 | USER/ADMIN/SUPER_ADMIN, 회원가입·로그인·로그아웃·토큰 재발급, 가입 승인·거절·일괄 관리, 프로필·비밀번호 변경 |
| 단지·입주민 | 단지 공개/인증 조회, 관리자 가입 흐름의 단지 생성, 입주민 CRUD, 사용자에서 입주민 등록, CSV 가져오기·내보내기·템플릿 |
| 민원 | 공개/비공개, 목록 검색·필터, 조회수, 본인 수정, PENDING/IN_PROGRESS/RESOLVED, 생성·완료 알림 |
| 공지 | 카테고리·고정·조회수·댓글수, CRUD, 생성 알림, 날짜 지정 시 일정 생성 |
| 댓글 | 공지·민원 댓글 생성·수정·삭제, 본인/관리자 권한 |
| 일정 | 단지별 월 조회, 공지·투표를 참조하는 일정 생성/수정·삭제 |
| 투표 | 동 단위 참여 제한, 선택지, 참여·취소, 사용자/투표 중복 방지 DB 제약, 1분 주기 시작·종료 및 결과 공지 |
| 알림·운영 | SSE, Redis Pub/Sub·Stream 기록, Notification/Outbox 트랜잭션, 재시도·오래된 PROCESSING 회수, 최고관리자 큐 요약·실패 조회 |
| 파일·배포 | S3 이미지 업로드, Docker, GitHub Actions, OpenTelemetry 초기화 코드 |

기능 존재 여부를 코드로 확인한 것으로, 전체 API가 정상 동작함을 검증한 결과는 아니다.

## 실행과 검증 기준

1. 기본 설치는 잠금 파일을 사용하는 `npm ci`.
2. `.env.example`을 참고해 로컬 .env를 작성하되 아래 누락 항목을 보완한다. 실제 비밀값은 문서·Git·출력에 남기지 않는다.
3. 로컬 전용 PostgreSQL과 Redis를 준비한다. 기존 compose.yaml은 ECR의 배포 이미지를 실행하고 Redis만 제공한다. 로컬 소스 빌드 및 PostgreSQL까지 준비하는 개발 Compose가 아니다.
4. `npx prisma generate`, 대상 DB가 확실한 상태에서 `npx prisma migrate deploy`로 기존 마이그레이션 적용. 새 스키마 변경을 만들 때만 개발 전용 DB에서 `npx prisma migrate dev --name <변경명>`.
5. `npm run dev`로 실행. 기본 API 포트 4000. `/health`는 프로세스 응답만 확인하며 DB/Redis 준비 상태를 보증하지 않는다.
6. 변경에 맞춰 `npm run typecheck`, `npm run build`, 필요한 도메인 테스트를 실행한다. 예: `npm test -- --testPathPattern=complaint`.
7. 전체 검증은 `npm run test:ci`. tests 일부는 deleteMany로 테이블 데이터를 삭제하므로 테스트 전용 DB에서만 실행한다. tests/setup.ts는 dotenv를 읽으며 DB URL을 테스트 전용으로 강제하지 않는다.

필요 설정:

| 설정 | 용도·주의 |
| --- | --- |
| NODE_ENV, PORT, CORS_ORIGIN | 서버 환경. 개발 CORS는 연결할 프런트 주소를 명시 |
| DATABASE_URL | Prisma 및 Prisma CLI 연결 |
| DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD, DB_SSL | 별도 pg Pool 연결 |
| JWT_ACCESS_SECRET, JWT_REFRESH_SECRET | getEnv가 두 값 모두 요구. .env.example에 ACCESS 누락. JWT_SECRET은 대체할 수 없음 |
| REDIS_URL | 로컬은 redis://127.0.0.1:6379 등 명시. 기본값은 host.docker.internal. Compose 내부는 redis 서비스 주소 사용 |
| AWS_REGION, S3_BUCKET | upload 라우트 import 단계에서 필요 |
| AWS 자격 증명 | 실제 업로드 시 SDK가 사용할 IAM 역할 또는 로컬 자격 증명 필요. 값은 저장하지 않음 |

README의 ‘모든 테스트 mock 없음’ 표현과 달리 알림·큐 테스트에는 mock이 있다. 테스트 210개 주장은 이번에 재실행해 확인하지 않았다. 투표 스케줄러의 ‘일반 공지 API 없음’ 주석은 현재 코드와 다르다.

## 확장 전 우선 해결할 문제

코드 정적 검토 결과다. 수정 시 재현 테스트로 범위와 결과를 확정한다.

1. **단지 격리와 승인 상태**: authMiddleware는 토큰 검증만 한다. 민원 상세/상태 변경 등에서 소속 단지 검증이 부족하고, 댓글 생성도 게시글 존재 확인만 한다. 요청의 boardId/apartmentId를 믿지 말고 인증 사용자의 소속과 대상 자원을 비교한다. 퇴거·비활성화·승인 취소 후 기존 토큰 정책도 정한다.
2. **최고관리자 생성·업로드 보호**: /signup/super-admin이 공개되고 서비스에서 APPROVED로 생성한다. 외부 공개 경로를 제거하고 초기 운영자 생성 절차를 마련한다. /upload에는 인증이 없어 업로드 권한과 비용 제한을 추가한다.
3. **업무 데이터와 알림의 원자성**: Notification과 Outbox는 함께 저장되지만 민원/공지 변경과는 별도 트랜잭션이다. 업무 변경과 전달할 이벤트까지 동일 트랜잭션으로 남기고 발송은 비동기로 처리한다. Outbox 이름만으로 업무 이벤트 유실이 해결됐다고 주장하지 않는다.
4. **투표 마감 정합성**: castVote는 상태만 확인하고 마감 시각을 직접 검증하지 않는다. cancelVote에는 마감 상태 검사도 없다. 스케줄러의 마감·결과 공지 생성은 별도 작업으로 재시작/복수 인스턴스에서 누락·중복 가능성이 있다. 요청 시각 검증, 조건부 상태 전환, 결과 생성의 멱등성을 보강한다.
5. **공지와 일정 동기화**: 공지 생성 시 일정 생성은 별도 작업이며 실패가 로그로만 남는다. 수정·삭제 흐름에서도 연결 일정을 일관되게 갱신/삭제하도록 관계와 원자성을 정리한다.

## 포트폴리오 확장 추천

중심 방향: **주민이 처리 근거를 확인하고, 관리자가 반복 문제를 줄이는 민원 운영 서비스**.
아파트너 공식 소개에 민원 진행 확인, 투표, 시설 예약이 이미 있다. 기능 목록 자체를 독창성으로 주장하지 않는다. 아래 차별화는 구현할 제품의 방향이며 경쟁사가 제공하지 않는다고 검증한 주장은 아니다.
참고: https://www.aptner.com/ , https://www.aptner.com/service/resident , https://www.apti.co.kr/ (2026-09-18 공식 소개 확인).

### 1. 민원 처리 이력·처리 기한·주민 재접수 — 최우선

- 사용 예: 엘리베이터 고장 접수 → 관리자 접수 및 예상 처리일 → 부품 주문 지연 사유 → 수리 내용/사진 → 주민 확인 또는 사유를 적어 재접수.
- 가치: ‘처리중’이라는 표시를 넘어 무엇을 했고 왜 늦어지는지 설명해 재문의와 일방적 종결을 줄인다.
- MVP: 상태 변경 이력, 예상 처리일, 완료 설명, 작성자 재접수, 지연 알림. 담당자 여러 명 지원은 현재 단지/관리자 1:1 모델이므로 후속 단계로 분리한다.
- 설계 고민: 허용 상태 전이, 관리자 동시 수정 충돌, 이력 변경 금지, 재접수마다 달라지는 이벤트 식별자, 개인정보가 있는 내부 메모와 주민 공개 이력 분리.
- 검증: 동시 상태 변경 시 한 건만 성공; 업무 상태·이력·Outbox 모두 커밋/롤백; Redis 장애 뒤 복구; 재접수 후 재완료 알림도 정상 생성.
- 지표: 첫 응답 시간, 해결 시간의 중앙값/P95, 기한 초과율, 재접수율. 실제 사용자 데이터와 시연 데이터를 구분한다.

### 2. 중복 민원을 공동 문제로 묶기 — 중심 차별화

- 사용 예: 같은 엘리베이터를 신고한 주민 12명에게 공통 수리 진행을 제공하고, 각자의 원문과 개인정보는 보호한다.
- MVP: 관리자가 민원을 공용 문제(Incident)에 수동 연결, 공용 문제 구독, 처리 업데이트 알림. 자동 유사도 추천은 이후 추가한다.
- 설계 고민: 동일 장소라도 다른 원인일 수 있으므로 강제 병합하지 않기; 비공개 민원 제목·동호수·작성자 노출 방지; 문제 분리·오연결 취소; 구독과 중복 알림 방지.
- 검증: 다른 단지 접근 금지, 비공개 원문 비노출, 연결/해제 후 구독 정책, 여러 민원 연결 시 사용자별 알림 중복 제거.
- 지표: 문제당 중복 접수 수, 공통 업데이트 후 재문의 수, 관리자의 반복 답변 수.

### 3. 중요 공지의 명시적 확인·버전 관리 — 기존 담당 영역과 연결

- 사용 예: 101동 단수 공지를 대상 세대에 전달하고, 주민은 ‘확인했어요’를 누른다. 단수 시간이 바뀌면 수정 내용을 보여주고 재확인한다.
- MVP: 동 단위 대상, 공지 버전, 사용자 확인 기록, 미확인자 제한된 재알림. 세대 기준 확인은 세대/입주 관계 모델을 정한 뒤 확장한다.
- 설계 고민: SSE 전송 성공/화면 열람/명시적 확인을 분리; 대상자를 발송 시점에 고정할지 결정; 중요한 변경만 재확인; 야간 재알림 정책.
- 검증: 이전 버전 확인이 새 버전을 확인 처리하지 않음; 동일 버전 반복 요청 멱등성; 비대상자 접근 정책; 수정과 일정 동기화.
- 지표: 기한 내 확인율, 최초 확인까지 걸린 시간, 사용자당 재알림 수.

### 4. 공용시설 예약·대기열 — 별도 백엔드 역량 시연

- 사용 예: 마지막 독서실 자리를 동시에 예약해도 한 사람만 확정, 취소하면 대기 순서대로 승급.
- MVP: 고정 시간 슬롯, 정원 제한, 예약/취소, 세대별 이용 제한. 결제는 제외한 범위로 시작한다.
- 설계 고민: DB 제약/조건부 갱신/락 선택, 요청 재전송의 멱등성, 대기열 공정성, 예약과 취소·승급 원자성, 퇴거 시 예약 처리.
- 검증: 정원 1에 동시 100개 요청을 보내 확정 1건 보장; 취소·승급 재시도에서 중복 확정 없음.
- 시설 예약 자체는 경쟁 서비스에도 있다. 포트폴리오 강조점은 동시성 처리와 측정된 결과다.

### 5. 근거가 있는 민원 답변 지원 — 선택 확장

- 사용 예: 관리규약·공지 검색으로 관련 문서와 날짜를 보여주고 관리자에게 답변 초안을 제공한다.
- MVP: 먼저 권한을 적용한 문서 검색과 출처 표시. AI 초안은 관리자가 확인한 뒤 전송한다.
- 설계 고민: 다른 단지 문서 검색 차단, 폐기/변경 문서 반영, 근거 없을 때 답변 보류, 개인정보 외부 전송 최소화, 비용/지연과 품질 평가.
- 검증: 정답/근거가 있는 평가 질문 묶음, 단지 간 정보 누출 0건 목표, 근거 없는 질문의 보류율. 목표치를 달성 결과로 표현하지 않는다.

## 권장 구현 순서와 기록

1. 로컬 개발/테스트 DB 환경 재현 및 위 정합성·권한 문제 수정.
2. 민원 처리 이력·재접수 MVP와 실패/동시성 테스트.
3. 공동 문제 묶음과 개인정보 보호 시연.
4. 중요 공지 확인을 연결. 이후 채용 목표에 따라 예약 또는 답변 지원 하나를 선택.

처음부터 모든 기능을 만들지 않는다. 각 확장의 README/개발 기록에는 문제, 사용 시나리오, 후보 설계와 선택 이유, 실패 조건, 검증 방법, 실제 측정 결과, 남은 한계를 남긴다. 실제 운영 근거 없이 트래픽·재문의 감소 수치를 만들어 쓰지 않는다.

면접 시연 예시: 같은 고장 민원 여러 건 접수 → 공용 문제 연결 → 처리 기한 변경 이유 공개 → Redis 장애 중에도 상태/이력/이벤트 저장 → 복구 후 업데이트 알림 → 주민 재접수. 각각의 단계에서 권한·원자성·멱등성을 설명한다.

## 제공받은 프런트 분석과 연동 권장안 (2026-09-18)

- 원본 ZIP: `/mnt/c/Users/taewon/Downloads/Project_WeLive_FE_1.2.0.zip`, 내부 루트 `project-welive-fe-1.2.0/`. 압축 해제·설치·실행은 하지 않고 ZIP 내부 소스를 읽었다.
- Next 15.3.2 Pages Router, React 19, Axios, Zustand persist, React Hook Form/Zod, Tailwind 4. package-lock.json 포함.
- 관리자·입주민의 민원/공지/일정/투표/프로필, 가입·입주민 관리·최고관리자 화면이 있다. 단지 정보 화면의 useApartmentInfo는 mockData를 사용한다.
- 권장 저장 방식: 당분간 기존 백엔드 루트 구조를 유지하고 `frontend/`에 프런트를 독립 package.json/lockfile로 추가한다. 두 프로세스를 각각 실행·빌드하며, 원본 도입과 개인 수정 이력을 분리한다. 현재 구조에서 바로 apps/api로 이동하면 Docker·CI 경로도 바뀌므로 후속 정리로 미룬다. 이 구조 변경은 아직 실행하지 않았다.
- 권장 연결: 브라우저는 공통 `/api` 주소 사용. 로컬은 Next rewrites로 Express 4000에 전달, 운영은 동일 HTTPS 도메인에서 `/` → Next, `/api/` → Express를 역방향 프록시한다. SSE 경로의 버퍼링·타임아웃 및 쿠키 전달을 별도 검증한다.
- 빠른 직접 연결 시 프런트 NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api, 백엔드 CORS_ORIGIN=http://localhost:3000. 두 서비스 모두 localhost를 사용하며 기존 localStorage.apiBaseUrl을 제거해야 한다. 이 설정만으로 모든 기능이 맞지는 않는다.
- Axios는 localStorage.apiBaseUrl 우선, SSE는 NEXT_PUBLIC_API_BASE_URL만 사용한다. 설정 페이지의 setUrl은 이미 생성된 Axios 인스턴스 baseURL도 즉시 바꾸지 않는다. 운영에서는 사용자 API 주소 설정 대신 고정 /api를 권장한다.
- 쿠키 불일치: 프런트 middleware/blockLoginUser는 access_token, 백엔드는 accessToken/refreshToken. 백엔드 HttpOnly 쿠키를 유지한다. JWT decode는 검증이 아니므로 서버 권한 판단의 근거로 쓰지 않는다. 세션 확인용 GET /api/users/me 추가와 앱 초기화 시 조회를 권장한다. 현재 백엔드에는 PATCH /users/me만 있다.
- 로그인 응답은 사용자 객체를 직접 반환하며 프런트의 response.data 기대와 대체로 맞는다. avatar/apartmentId/residentDong 등의 null 가능성은 프런트 타입에 반영한다. PENDING/REJECTED 로그인은 백엔드가 401로 거절하므로 프런트의 성공 응답 후 대기/거절 화면 분기와 정책을 맞춘다.
- 가입 전 프런트는 /apartments 및 /apartments/:id를 호출하지만 백엔드는 인증이 필요하다. 가입 전 조회에는 /apartments/public 및 /apartments/public/:id를 사용하고 응답 필드를 맞춘다.
- 민원 타입에는 COMPLETED가 남아 있지만 상세 화면과 백엔드는 RESOLVED를 사용한다. 프런트 상태 타입을 통일한다.
- SSE 경로 /notifications/sse와 alarm 이벤트·배열 형식은 맞는다. 다만 프런트 onerror에서 close()하므로 연결 종료 후 자동 재연결이 막힌다. 세션 갱신·재연결·로그아웃 해제·중복 제거·미확인 목록 동기화를 보완한다. Axios refresh는 동시 401 요청들의 갱신을 하나로 합칠 필요가 있다.
- Next Image 허용 호스트가 제공받은 S3 버킷에 고정되어 있다. 실제 사용하는 버킷/CDN에 맞춘다.
- 연동 검증 순서: 로그인/새로고침/토큰갱신/로그아웃 → 가입 전 단지 조회 → 주민 민원 등록/관리자 처리/댓글 → 알림과 재연결 → 공지/일정 → 투표/CSV/프로필. 운영 전 프런트 의존성 보안 패치 검토 및 기존 권한 문제 수정.
- 공식 설정 참고: https://nextjs.org/docs/app/api-reference/config/next-config-js/rewrites , https://nginx.org/en/docs/http/ngx_http_proxy_module.html . 설치 버전에 맞는 설정과 실제 스트리밍 동작을 구현 시 확인한다.


## 공동 문제 1차 구현 상태 (2026-10-01)

- `docs/incidents.md`에 설계 결정, API 요청 예시, 상태 전이, 후속 범위와 검증 한계를 기록했다. `src/docs/incident.docs.ts`가 Swagger에 등록되어 있다.
- 신규 API `/api/incidents`: 생성/목록/상세, 민원 연결·해제, 처리 업데이트/이력 페이지 조회. 신규 Prisma 모델 Incident/IncidentComplaint/IncidentUpdate 및 마이그레이션 `20261001060000_add_incidents`.
- 민원 하나는 현재 공동 문제 하나에만 연결된다. 원본 민원의 상태·공개 여부는 바꾸지 않는다. 공동 문제 상태는 PENDING→IN_PROGRESS→RESOLVED, 재개 RESOLVED→IN_PROGRESS를 지원한다.
- 새 API는 매 요청마다 현재 DB의 역할·승인·활성·단지·거주 상태를 확인한다. ADMIN만 관리하며 USER는 자기 민원이 연결된 문제만 조회한다. SUPER_ADMIN의 전 단지 조회는 제공하지 않는다. 이 보강이 기존 모든 API의 권한 문제까지 해결한 것은 아니다.
- 주민 응답에는 자신의 complaintIds와 공유용 진행 이력만 포함한다. 다른 주민의 민원 원문·ID·인원수는 제외한다. 공동 문제 제목/설명/업데이트는 관리자가 관련 주민에게 공개할 내용으로 작성해야 한다.
- 동일 requestId/본문은 재시도해도 같은 updateId/version 반환. 같은 ID의 다른 본문 또는 오래된 expectedVersion은 409. 연결과 업데이트는 공동 문제 행 잠금을 공유한다.
- 신규 업데이트는 상태+이력+작성자별 Notification+Outbox를 같은 트랜잭션에 저장한다. 새 알림 종류 INCIDENT_UPDATED, sourceType=INCIDENT, sourceId=공동 문제 ID. 기존 워커가 전송하므로 Redis가 API 저장 성공의 전제조건은 아니다.
- 전송이 딱 한 번이라는 보장은 하지 않는다. 알림 레코드 중복 방지이며, 클라이언트는 재전송 시 notificationId로 중복 표시를 제거해야 한다. 기존 Outbox 워커는 60초 주기·실패 횟수 제한이 있다.
- npm ci의 기존 실패 원인은 잠금 파일의 플랫폼별 msgpackr 선택 의존성 5개 누락이었다. 해당 항목만 추가했고 설치에 성공했다. node_modules와 dist가 로컬에 생성되어 있다.
- Docker/Windows Docker 엔진은 실행되지 않았다. 테스트용 embedded-postgres 도구를 `/tmp/welive-pg-runtime`에만 설치하고 PostgreSQL 18.4 임시 DB에 기존 24개+신규 1개 마이그레이션을 적용했다. 운영 DB에는 적용하지 않았다. 이후 테스트는 다시 격리된 DB를 준비한다.
- 검증: Prisma validate/generate, typecheck, build 통과. 새 통합 테스트 19개 및 기존 민원·알림·큐 회귀 테스트 58개 통과. 전체 테스트/CI PostgreSQL 16/실제 브라우저·Redis 장애 복구는 이번 검증 범위가 아니다.
- 다음 작업: 프런트에서 수동 연결과 진행 이력을 사용할 수 있도록 연동 → 규칙 기반 유사 민원 후보 → AI 키워드/요약 및 추천 근거 → 공지 발행 연계. AI가 연결을 확정하지 않으며 관리자가 최종 확인한다.

## 프런트 연동·배포 준비 상태 (2026-10-01)

- 원본 ZIP을 `frontend/`에 반입했다. Next.js 16.3.8 Pages Router, Axios 1.20.0으로 보안 패치했고 `npm audit --omit=dev`는 취약점 0건이다. 팀 원본과 개인 변경은 아직 커밋으로 분리하지 못했으므로 이후 커밋에서 경로와 메시지로 구분한다.
- 브라우저 API는 같은 출처 `/api`로 고정했다. 쿠키 이름 accessToken/refreshToken 통일, 공개 단지 API, 민원 RESOLVED, 동시 401 refresh 단일화, SSE 자동 재연결을 반영했다.
- 백엔드 `GET /api/users/me`와 프런트 앱 초기 세션 복구를 추가했다. Zustand에는 user만 보존하며 isInitialized는 새로고침마다 서버 확인 후 설정한다.
- 관리자 `/admin/incidents`, 상세 처리 업데이트 화면과 주민 `/resident/incidents` 목록·상세를 추가했다. INCIDENT_UPDATED 알림 클릭 시 역할별 상세로 이동한다.
- `/api/upload`에 해당 POST 경로만 인증을 추가했다. 라우터 전체에 authMiddleware를 걸면 이후 `/api/auth`까지 막히므로 다시 확장하지 않는다. S3는 ASSET_BASE_URL로 CloudFront URL을 저장할 수 있다.
- 로컬 `compose.local.yaml`: Nginx/Next/Express/PostgreSQL 16/Redis. 운영 `compose.yaml`: Nginx/Next/Express/Redis와 일회용 migration 서비스. 운영 백엔드 이미지는 devDependency를 제외하고 Prisma CLI는 migrator target에만 둔다.
- GitHub CI는 main/PR에서 PostgreSQL 16 마이그레이션, 테스트, 양쪽 빌드와 Docker 이미지를 검사한다. 배포는 CI main 성공 뒤 SHA 태그의 backend/frontend/migration 이미지를 ECR에 올리고 EC2로 전달한다. 기존 팀 AWS 계정 하드코딩은 제거했다.
- AWS 생성·GitHub 변수·EC2 .env·첫 배포 절차는 `docs/deployment.md`. 다음 사용자 작업은 Docker Desktop을 켜고 Ubuntu WSL Integration을 활성화하는 것, 이후 개인 AWS 계정/도메인/예산을 준비하는 것이다.
- 검증: 백엔드 typecheck/build 통과. 프런트 build 통과(마지막 변경 후 재검증 필요), lint는 기존 소스의 React effect 규칙을 호환 설정으로 제외하고 경고만 남겼다. 임시 PostgreSQL에서 25개 마이그레이션, 공동 문제 19개, 민원 27개, 사용자 9개, 알림·큐 36개 통과. Docker 엔진 미실행으로 Dockerfile/Compose 실제 기동은 미검증이다.
- 백엔드 npm audit 잔여 high 4건은 devDependency인 Prisma CLI 하위 deepmerge-ts/mysql2 권고다. 강제 수정은 Prisma 7을 6으로 내리므로 적용하지 않았다. 운영 runner는 `npm ci --omit=dev`로 이 도구를 포함하지 않는다. migrator는 신뢰된 마이그레이션 실행 때만 일회성으로 사용한다.
