# WELIVE 프론트엔드

## 패키지 설치

```
npm install
```

## 개발 환경에서 실행하기

로컬에서 개발 서버로 실행할 수 있습니다.

```
npm run dev
```

프론트엔드 사이트(<http://localhost:3000>)에서 API 주소 설정 페이지(<http://localhost:3000/setting>)로 접근해 API 주소를 변경해 테스트할 수 있습니다.


## 환경변수 설정하기

`.env.example` 파일을 참고해서 `.env` 파일을 만들고 `NEXT_PUBLIC_API_BASE_URL`을 설정합니다.

```
NEXT_PUBLIC_API_BASE_URL=https://nb-project-codiit-be.vercel.app/api
```


## 프로덕션 실행

Next.js 프로젝트를 빌드 후 실행할 수 있습니다.

```
npm run build
npm run start
```

## API 연동 관련 안내

API 리퀘스트를 하는 코드는 `src/shared/lib/axios.ts` 파일의 `axiosInstance`를 통해 axios 인스턴스를 가져와서 리퀘스트를 보내고 있습니다.
세부적인 엔드포인트 경로나 데이터 형식을 수정하고 싶다면 `axiosInstance`를 검색해 해당하는 부분의 소스 코드를 수정해 주세요.
