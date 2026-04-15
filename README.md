# Quiz App

PDF 또는 수동 입력 기반의 퀴즈 웹 애플리케이션.
운전면허 필기시험처럼 문제를 풀고, 채점하고, 틀린 문제를 복습할 수 있는 환경을 제공합니다.

## 기술 스택

### Frontend

- **React** (Vite) - SPA 프레임워크
- **Tailwind CSS** - 스타일링
- **Zustand** - 상태 관리
- **Axios** - HTTP 클라이언트
- **React Router v6** - 클라이언트 라우팅

### Backend

- **Node.js 20.x** - Lambda 런타임
- **AWS Lambda** - 서버리스 함수
- **AWS API Gateway** - REST API
- **Serverless Framework** - 배포 도구

### AWS 서비스

- **S3** - 정적 파일 호스팅 + PDF 저장
- **CloudFront** - CDN
- **DynamoDB** - NoSQL 데이터베이스
- **Cognito** - 사용자 인증 (이메일 + Google OAuth)
- **Lambda** - 서버리스 컴퓨팅

## 프로젝트 구조

```
quiz-app/
├── frontend/               # React + Vite SPA
│   ├── src/
│   │   ├── pages/          # 라우트별 페이지 컴포넌트
│   │   ├── components/     # 재사용 UI 컴포넌트
│   │   ├── store/          # Zustand 상태 관리
│   │   ├── api/            # Axios API 클라이언트
│   │   ├── hooks/          # 커스텀 훅
│   │   └── utils/          # 유틸리티 함수
│   └── package.json
├── backend/                # Node.js Lambda 함수
│   ├── functions/
│   │   ├── auth/           # 인증 핸들러
│   │   ├── quizSet/        # 퀴즈 세트 CRUD
│   │   ├── question/       # 문제 CRUD
│   │   ├── pdfParser/      # PDF 파싱
│   │   └── result/         # 결과 저장/조회
│   ├── middleware/         # 공통 미들웨어
│   ├── models/             # DynamoDB 데이터 모델
│   ├── utils/              # 유틸리티
│   └── serverless.yml
├── infrastructure/         # AWS CDK 인프라 코드
│   └── package.json
└── .github/
    └── workflows/          # GitHub Actions CI/CD
```

## 로컬 개발 환경 설정

### 사전 요구사항

- Node.js 20.x 이상
- npm 10.x 이상
- AWS CLI 설정 (`aws configure`)

### 설치

```bash
# 저장소 클론
git clone https://github.com/your-org/quiz-app.git
cd quiz-app

# 전체 의존성 설치
npm install

# 환경변수 설정
cp .env.example frontend/.env.local
# frontend/.env.local 파일을 열어 실제 값으로 수정
```

### 프론트엔드 개발 서버 실행

```bash
npm run dev:frontend
# http://localhost:5173 에서 확인
```

### 백엔드 로컬 실행 (Serverless Offline)

```bash
cd backend
npm install
npx serverless offline
# http://localhost:3000 에서 API 확인
```

## 배포

### 프론트엔드 배포 (S3 + CloudFront)

```bash
npm run build:frontend
# GitHub Actions가 main 브랜치 push 시 자동 배포
```

### 백엔드 배포 (Lambda + API Gateway)

```bash
cd backend
npx serverless deploy --stage prod
# GitHub Actions가 main 브랜치 push 시 자동 배포
```

### 인프라 배포 (AWS CDK)

```bash
cd infrastructure
npm run deploy
```

## CI/CD

GitHub Actions를 통해 자동 배포가 구성되어 있습니다.

- `frontend/**` 변경 → 프론트엔드 빌드 후 S3 업로드 + CloudFront 캐시 무효화
- `backend/**` 변경 → Serverless Framework로 Lambda 배포

필요한 GitHub Secrets:

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`

## 환경변수

`.env.example` 파일을 참고하여 각 환경에 맞게 설정하세요.

| 변수                         | 설명                            |
| ---------------------------- | ------------------------------- |
| `VITE_API_BASE_URL`          | API Gateway 엔드포인트 URL      |
| `VITE_COGNITO_USER_POOL_ID`  | Cognito User Pool ID            |
| `VITE_COGNITO_APP_CLIENT_ID` | Cognito App Client ID           |
| `VITE_COGNITO_REGION`        | AWS 리전 (기본: ap-northeast-2) |
| `AWS_REGION`                 | Lambda 실행 리전                |
| `DYNAMODB_TABLE_PREFIX`      | DynamoDB 테이블 이름 접두사     |
| `S3_PDF_BUCKET`              | PDF 저장용 S3 버킷 이름         |
| `COGNITO_USER_POOL_ID`       | 백엔드 JWT 검증용 User Pool ID  |
