# My One Room

원룸 사용자가 가구 배치와 동선을 빠르게 검토할 수 있도록 만든 2D/3D 인테리어 플래너입니다.

## 포트폴리오 자료

- [포트폴리오 PPT](docs/portfolio/MyOneRoom_Portfolio.pptx)

## 주요 기능

- 이메일 회원가입, 로그인, 비밀번호 재설정
- 카카오/네이버 OAuth2 소셜 로그인
- 사용자 기본 정보 저장 및 수정
- 원룸 프로젝트 생성, 저장, 이어서 작업하기
- 2D 가구 배치, 선택, 이동, 회전, 정렬, 삭제
- 3D 공간 시각화 및 사용자 시점으로 둘러보기
- 현재 배치 상태 기반 AI Pick 가구 추천
- 추천 키워드 기반 쿠팡 검색 연결

## 기술 스택

### Frontend

- React 19
- Vite 8
- Three.js
- @react-three/fiber
- CSS 기반 반응형 UI

### Backend

- Spring Boot 3
- Spring Security
- OAuth2 Client
- Java Mail Sender
- JSON 파일 기반 사용자/작업공간 저장소

## 프로젝트 구조

```text
src/
  App.jsx
  App.css
  components/
  data/
  features/planner/
  services/

backend/
  src/main/java/com/roomplanner/backend/
    auth/
    workspace/
    common/
  src/main/resources/application.properties
```

## 실행 방법

### Frontend

```bash
npm install
npm run dev
```

### Backend

```bash
cd backend
./mvnw.cmd spring-boot:run
```

## 환경 변수

OAuth와 메일 발송 정보는 코드에 직접 넣지 않고 환경 변수 또는 `backend/.mail-local.properties`로 관리합니다.

```properties
KAKAO_CLIENT_ID=
KAKAO_CLIENT_SECRET=
NAVER_CLIENT_ID=
NAVER_CLIENT_SECRET=
SPRING_MAIL_HOST=
SPRING_MAIL_PORT=
SPRING_MAIL_USERNAME=
SPRING_MAIL_PASSWORD=
APP_MAIL_FROM=
APP_ALLOWED_ORIGINS=http://localhost:5173
APP_FRONTEND_BASE_URL=http://localhost:5173
```

## 검증

```bash
npm run lint
npm test
npm run build

cd backend
./mvnw.cmd test
```

## 포트폴리오 포인트

- 2D 편집, 3D 시각화, 프로젝트 저장, 추천 기능이 하나의 사용자 흐름으로 연결되도록 설계했습니다.
- 3D 가구가 바닥에서 뜨는 문제를 높이 보정 계산으로 개선했습니다.
- 뷰어 모드 카메라를 별도 상태로 관리해 사용자가 배치 결과를 직접 둘러볼 수 있도록 구현했습니다.
- 실제 외부 API 키 없이도 추천 키워드를 쿠팡 검색으로 연결하는 MVP 흐름을 구성했습니다.
