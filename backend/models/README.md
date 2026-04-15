# DynamoDB 데이터 모델

이 디렉토리는 DynamoDB 테이블 스키마 정의 및 접근 패턴을 문서화합니다.

## 테이블 목록

### quiz-app-users

- PK: `userId` (Cognito sub)
- 속성: email, nickname, role (user|admin), bookmarkedQuestionIds[], createdAt

### quiz-app-quiz-sets

- PK: `quizSetId` (UUID)
- 속성: title, description, category, isPublic, questionCount, createdBy, createdAt, updatedAt, sourceType, s3PdfKey

### quiz-app-questions

- PK: `questionId` (UUID)
- GSI: `quizSetId-index` (quizSetId)
- 속성: quizSetId, order, questionText, questionImageUrl, options[], correctOptionId, explanation, createdAt

### quiz-app-results

- PK: `resultId` (UUID)
- GSI: `userId-index` (userId), `quizSetId-index` (quizSetId)
- 속성: userId, quizSetId, score, totalQuestions, correctCount, wrongQuestionIds[], completedAt, mode (exam|practice)

## 접근 패턴

| 패턴                     | 테이블/인덱스                        | 키 조건                              |
| ------------------------ | ------------------------------------ | ------------------------------------ |
| 퀴즈 세트 목록 조회      | quiz-app-quiz-sets                   | Scan (isPublic=true 필터)            |
| 특정 퀴즈 세트 문제 조회 | quiz-app-questions / quizSetId-index | quizSetId = :id                      |
| 사용자 결과 이력 조회    | quiz-app-results / userId-index      | userId = :userId                     |
| 특정 퀴즈 결과 이력      | quiz-app-results / quizSetId-index   | quizSetId = :id AND userId = :userId |
