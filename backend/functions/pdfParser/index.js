const {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const {
  PutCommand,
  UpdateCommand,
  ScanCommand,
} = require("@aws-sdk/lib-dynamodb");
const { v4: uuidv4 } = require("uuid");
const Joi = require("joi");
const pdfParse = require("pdf-parse");
const { docClient } = require("../../utils/dynamodb");
const { success, error } = require("../../utils/response");
const { withErrorHandler } = require("../../utils/errorHandler");
const { verifyToken, requireAdmin } = require("../../middleware/auth");

const S3_BUCKET = process.env.S3_PDF_BUCKET || "quiz-app-pdfs-961776040458";
const QUIZ_SETS_TABLE = "quiz-app-quiz-sets";
const QUESTIONS_TABLE = "quiz-app-questions";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "ap-northeast-2",
});

// ─── Joi 스키마 ───────────────────────────────────────────────
const uploadSchema = Joi.object({
  filename: Joi.string().required(),
  quizSetId: Joi.string().required(),
});

// ─── HTTP 핸들러 ──────────────────────────────────────────────
const handler = async (event) => {
  const { httpMethod, pathParameters } = event;
  const jobId = pathParameters?.jobId;

  if (httpMethod === "POST") return await requestPresignedUrl(event);
  if (httpMethod === "GET" && jobId) return await getParsingStatus(jobId);

  return error("Not Found", 404);
};

// POST /quiz-sets/upload-pdf
const requestPresignedUrl = async (event) => {
  const authResult = await verifyToken(event);
  if (!authResult.isValid) return authResult.response;

  const adminError = requireAdmin(authResult);
  if (adminError) return adminError;

  const body = JSON.parse(event.body || "{}");
  const { error: validationError, value } = uploadSchema.validate(body);
  if (validationError) return error(validationError.details[0].message, 400);

  const { filename, quizSetId } = value;
  const s3Key = `pdfs/${quizSetId}/${Date.now()}-${filename}`;
  const jobId = uuidv4();

  // Presigned URL 생성
  const putCommand = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: s3Key,
    ContentType: "application/pdf",
  });
  const uploadUrl = await getSignedUrl(s3Client, putCommand, {
    expiresIn: 300,
  });

  // quiz-app-quiz-sets 테이블에 parseJob 상태 저장
  const now = new Date().toISOString();
  await docClient.send(
    new UpdateCommand({
      TableName: QUIZ_SETS_TABLE,
      Key: { quizSetId },
      UpdateExpression: "SET parseJob = :parseJob, updatedAt = :updatedAt",
      ExpressionAttributeValues: {
        ":parseJob": { jobId, status: "pending", s3Key, createdAt: now },
        ":updatedAt": now,
      },
    }),
  );

  return success({ uploadUrl, s3Key, jobId }, 201);
};

// GET /quiz-sets/upload-pdf/:jobId
const getParsingStatus = async (jobId) => {
  const result = await docClient.send(
    new ScanCommand({
      TableName: QUIZ_SETS_TABLE,
      FilterExpression: "parseJob.jobId = :jobId",
      ExpressionAttributeValues: { ":jobId": jobId },
    }),
  );

  const item = result.Items && result.Items[0];
  if (!item) return error("Job을 찾을 수 없습니다.", 404);

  const { parseJob, quizSetId } = item;
  const response = { jobId, status: parseJob.status, quizSetId };
  if (parseJob.error) response.error = parseJob.error;

  return success(response);
};

// ─── S3 이벤트 핸들러 ─────────────────────────────────────────
const handleS3Event = async (event) => {
  const record = event.Records[0].s3;
  const bucket = record.bucket.name;
  const key = decodeURIComponent(record.object.key.replace(/\+/g, " "));

  console.log(`S3 event: bucket=${bucket}, key=${key}`);

  // s3Key 패턴: pdfs/{quizSetId}/...
  const keyMatch = key.match(/^pdfs\/([^/]+)\//);
  if (!keyMatch) {
    console.error("Unexpected S3 key format:", key);
    return { statusCode: 400 };
  }
  const quizSetId = keyMatch[1];

  try {
    // PDF 다운로드
    const getResult = await s3Client.send(
      new GetObjectCommand({ Bucket: bucket, Key: key }),
    );
    const chunks = [];
    for await (const chunk of getResult.Body) {
      chunks.push(chunk);
    }
    const pdfBuffer = Buffer.concat(chunks);

    // 텍스트 추출
    const pdfData = await pdfParse(pdfBuffer);
    const text = pdfData.text;

    // 문제 파싱
    const questions = parsePdfText(text, quizSetId);
    console.log(`Parsed ${questions.length} questions from PDF`);

    // DynamoDB에 문제 저장
    for (const question of questions) {
      await docClient.send(
        new PutCommand({ TableName: QUESTIONS_TABLE, Item: question }),
      );
    }

    // questionCount 업데이트
    const now = new Date().toISOString();
    await docClient.send(
      new UpdateCommand({
        TableName: QUIZ_SETS_TABLE,
        Key: { quizSetId },
        UpdateExpression:
          "SET questionCount = :count, updatedAt = :updatedAt, parseJob.#st = :status, parseJob.completedAt = :completedAt",
        ExpressionAttributeNames: { "#st": "status" },
        ExpressionAttributeValues: {
          ":count": questions.length,
          ":updatedAt": now,
          ":status": "completed",
          ":completedAt": now,
        },
      }),
    );

    return { statusCode: 200 };
  } catch (err) {
    console.error("PDF parsing failed:", err);

    // 실패 상태 업데이트
    try {
      await docClient.send(
        new UpdateCommand({
          TableName: QUIZ_SETS_TABLE,
          Key: { quizSetId },
          UpdateExpression:
            "SET parseJob.#st = :status, parseJob.#err = :error, updatedAt = :updatedAt",
          ExpressionAttributeNames: { "#st": "status", "#err": "error" },
          ExpressionAttributeValues: {
            ":status": "failed",
            ":error": err.message || "Unknown error",
            ":updatedAt": new Date().toISOString(),
          },
        }),
      );
    } catch (updateErr) {
      console.error("Failed to update error status:", updateErr);
    }

    return { statusCode: 500 };
  }
};

// ─── PDF 텍스트 파싱 ──────────────────────────────────────────
const OPTION_CHARS = ["①", "②", "③", "④", "⑤"];
const OPTION_MAP = { "①": "A", "②": "B", "③": "C", "④": "D", "⑤": "E" };

/**
 * PDF 텍스트에서 문제 목록을 파싱합니다.
 * 지원 패턴:
 *   1. 문제텍스트
 *   ① 선택지1  또는  1) 선택지1
 *   정답: ①   또는  정답: 1
 */
const parsePdfText = (text, quizSetId) => {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const questions = [];

  let current = null;

  const saveCurrentQuestion = () => {
    if (!current) return;
    if (current.options.length >= 2 && current.correctOptionId) {
      const now = new Date().toISOString();
      questions.push({
        questionId: uuidv4(),
        quizSetId,
        order: current.order,
        questionText: current.questionText,
        options: current.options,
        correctOptionId: current.correctOptionId,
        createdAt: now,
      });
    }
    current = null;
  };

  for (const line of lines) {
    // 새 문제 시작: "1. 문제텍스트"
    const questionMatch = line.match(/^(\d+)\.\s+(.+)/);
    if (questionMatch) {
      saveCurrentQuestion();
      current = {
        order: parseInt(questionMatch[1]),
        questionText: questionMatch[2],
        options: [],
        correctOptionId: null,
      };
      continue;
    }

    if (!current) continue;

    // 정답 라인: "정답: ①" 또는 "정답: 1"
    const answerMatch = line.match(/^정답\s*[:：]\s*(.+)/);
    if (answerMatch) {
      const answerRaw = answerMatch[1].trim();
      // 원형 숫자 문자 처리
      if (OPTION_MAP[answerRaw]) {
        current.correctOptionId = OPTION_MAP[answerRaw];
      } else {
        // 숫자 처리: "1" → "A", "2" → "B" ...
        const num = parseInt(answerRaw);
        if (!isNaN(num) && num >= 1 && num <= 5) {
          current.correctOptionId = String.fromCharCode(64 + num); // 1→A, 2→B ...
        }
      }
      continue;
    }

    // 선택지: "① 텍스트" 또는 "1) 텍스트"
    const circleMatch = line.match(/^([①②③④⑤])\s*(.+)/);
    if (circleMatch) {
      const optionId = OPTION_MAP[circleMatch[1]];
      current.options.push({ optionId, text: circleMatch[2] });
      continue;
    }

    const numMatch = line.match(/^([1-5])\)\s*(.+)/);
    if (numMatch) {
      const optionId = String.fromCharCode(64 + parseInt(numMatch[1]));
      current.options.push({ optionId, text: numMatch[2] });
      continue;
    }

    // 문제 텍스트가 여러 줄인 경우 이어붙이기 (선택지/정답 전까지)
    if (current.options.length === 0) {
      current.questionText += " " + line;
    }
  }

  // 마지막 문제 저장
  saveCurrentQuestion();

  return questions;
};

// ─── 단일 exports.handler ─────────────────────────────────────
const httpHandler = withErrorHandler(handler);

exports.handler = async (event, context) => {
  // S3 이벤트
  if (event.Records && event.Records[0]?.eventSource === "aws:s3") {
    return await handleS3Event(event);
  }
  // HTTP 요청
  return await httpHandler(event, context);
};
