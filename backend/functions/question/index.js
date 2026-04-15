const {
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
} = require("@aws-sdk/lib-dynamodb");
const { v4: uuidv4 } = require("uuid");
const Joi = require("joi");
const { docClient } = require("../../utils/dynamodb");
const { success, error } = require("../../utils/response");
const { withErrorHandler } = require("../../utils/errorHandler");
const { verifyToken, requireAdmin } = require("../../middleware/auth");

const QUESTIONS_TABLE = "quiz-app-questions";
const QUIZ_SETS_TABLE = "quiz-app-quiz-sets";

const createSchema = Joi.object({
  questionText: Joi.string().required(),
  options: Joi.array()
    .items(
      Joi.object({
        optionId: Joi.string().required(),
        text: Joi.string().required(),
      }),
    )
    .min(2)
    .max(5)
    .required(),
  correctOptionId: Joi.string().required(),
  explanation: Joi.string().allow("", null),
});

const updateSchema = Joi.object({
  questionText: Joi.string(),
  options: Joi.array()
    .items(
      Joi.object({
        optionId: Joi.string().required(),
        text: Joi.string().required(),
      }),
    )
    .min(2)
    .max(5),
  correctOptionId: Joi.string(),
  explanation: Joi.string().allow("", null),
});

const handler = async (event) => {
  const { httpMethod, pathParameters } = event;
  const id = pathParameters?.id;
  const qid = pathParameters?.qid;

  if (httpMethod === "GET" && !qid) return await listQuestions(event, id);
  if (httpMethod === "POST" && !qid) return await createQuestion(event, id);
  if (httpMethod === "PUT" && qid) return await updateQuestion(event, id, qid);
  if (httpMethod === "DELETE" && qid)
    return await deleteQuestion(event, id, qid);

  return error("Not Found", 404);
};

const listQuestions = async (event, quizSetId) => {
  const result = await docClient.send(
    new QueryCommand({
      TableName: QUESTIONS_TABLE,
      IndexName: "quizSetId-index",
      KeyConditionExpression: "quizSetId = :quizSetId",
      ExpressionAttributeValues: { ":quizSetId": quizSetId },
      ScanIndexForward: true,
    }),
  );

  return success({ items: result.Items || [] });
};

const createQuestion = async (event, quizSetId) => {
  const authResult = await verifyToken(event);
  if (!authResult.isValid) return authResult.response;

  const adminError = requireAdmin(authResult);
  if (adminError) return adminError;

  const body = JSON.parse(event.body || "{}");
  const { error: validationError, value } = createSchema.validate(body);
  if (validationError) return error(validationError.details[0].message, 400);

  // 현재 questionCount 조회
  const quizSetResult = await docClient.send(
    new GetCommand({ TableName: QUIZ_SETS_TABLE, Key: { quizSetId } }),
  );

  if (!quizSetResult.Item) return error("퀴즈 세트를 찾을 수 없습니다.", 404);

  const currentCount = quizSetResult.Item.questionCount || 0;
  const now = new Date().toISOString();

  const question = {
    questionId: uuidv4(),
    quizSetId,
    order: currentCount + 1,
    questionText: value.questionText,
    options: value.options,
    correctOptionId: value.correctOptionId,
    explanation: value.explanation || "",
    createdAt: now,
  };

  await docClient.send(
    new PutCommand({ TableName: QUESTIONS_TABLE, Item: question }),
  );

  // questionCount +1 업데이트
  await docClient.send(
    new UpdateCommand({
      TableName: QUIZ_SETS_TABLE,
      Key: { quizSetId },
      UpdateExpression: "SET questionCount = questionCount + :inc",
      ExpressionAttributeValues: { ":inc": 1 },
    }),
  );

  return success(question, 201);
};

const updateQuestion = async (event, quizSetId, questionId) => {
  const authResult = await verifyToken(event);
  if (!authResult.isValid) return authResult.response;

  const adminError = requireAdmin(authResult);
  if (adminError) return adminError;

  const body = JSON.parse(event.body || "{}");
  const { error: validationError, value } = updateSchema.validate(body);
  if (validationError) return error(validationError.details[0].message, 400);

  const fields = Object.keys(value);
  if (fields.length === 0) return error("업데이트할 필드가 없습니다.", 400);

  const now = new Date().toISOString();
  const updateExprParts = ["updatedAt = :updatedAt"];
  const exprAttrValues = { ":updatedAt": now };
  const exprAttrNames = {};

  fields.forEach((field) => {
    updateExprParts.push(`#${field} = :${field}`);
    exprAttrValues[`:${field}`] = value[field];
    exprAttrNames[`#${field}`] = field;
  });

  const result = await docClient.send(
    new UpdateCommand({
      TableName: QUESTIONS_TABLE,
      Key: { questionId },
      UpdateExpression: "SET " + updateExprParts.join(", "),
      ExpressionAttributeValues: exprAttrValues,
      ExpressionAttributeNames: exprAttrNames,
      ConditionExpression: "attribute_exists(questionId)",
      ReturnValues: "ALL_NEW",
    }),
  );

  return success(result.Attributes);
};

const deleteQuestion = async (event, quizSetId, questionId) => {
  const authResult = await verifyToken(event);
  if (!authResult.isValid) return authResult.response;

  const adminError = requireAdmin(authResult);
  if (adminError) return adminError;

  await docClient.send(
    new DeleteCommand({ TableName: QUESTIONS_TABLE, Key: { questionId } }),
  );

  // questionCount -1 업데이트 (최소 0)
  await docClient
    .send(
      new UpdateCommand({
        TableName: QUIZ_SETS_TABLE,
        Key: { quizSetId },
        UpdateExpression:
          "SET questionCount = if_not_exists(questionCount, :zero) - :dec",
        ConditionExpression: "questionCount > :zero",
        ExpressionAttributeValues: { ":dec": 1, ":zero": 0 },
      }),
    )
    .catch(() => {
      // questionCount가 이미 0이면 조건 실패 — 무시
    });

  return success({ message: "문제가 삭제되었습니다." });
};

exports.handler = withErrorHandler(handler);
