const { PutCommand, QueryCommand } = require("@aws-sdk/lib-dynamodb");
const { v4: uuidv4 } = require("uuid");
const Joi = require("joi");
const { docClient } = require("../../utils/dynamodb");
const { success, error } = require("../../utils/response");
const { withErrorHandler } = require("../../utils/errorHandler");
const { verifyToken } = require("../../middleware/auth");

const TABLE_NAME = "quiz-app-results";

const resultSchema = Joi.object({
  quizSetId: Joi.string().required(),
  score: Joi.number().required(),
  totalQuestions: Joi.number().required(),
  correctCount: Joi.number().required(),
  wrongQuestionIds: Joi.array().items(Joi.string()).default([]),
  mode: Joi.string().valid("exam", "practice").required(),
});

const handler = async (event) => {
  const { httpMethod, pathParameters } = event;
  const quizSetId = pathParameters?.quizSetId;

  if (httpMethod === "POST") return await saveResult(event);
  if (httpMethod === "GET" && !quizSetId) return await getMyResults(event);
  if (httpMethod === "GET" && quizSetId)
    return await getMyResultsByQuizSet(event, quizSetId);

  return error("Not Found", 404);
};

const saveResult = async (event) => {
  const authResult = await verifyToken(event);
  if (!authResult.isValid) return authResult.response;

  const body = JSON.parse(event.body || "{}");
  const { error: validationError, value } = resultSchema.validate(body);
  if (validationError) return error(validationError.details[0].message, 400);

  const result = {
    resultId: uuidv4(),
    userId: authResult.userId,
    quizSetId: value.quizSetId,
    score: value.score,
    totalQuestions: value.totalQuestions,
    correctCount: value.correctCount,
    wrongQuestionIds: value.wrongQuestionIds,
    mode: value.mode,
    completedAt: new Date().toISOString(),
  };

  await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: result }));

  return success(result, 201);
};

const getMyResults = async (event) => {
  const authResult = await verifyToken(event);
  if (!authResult.isValid) return authResult.response;

  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "userId-index",
      KeyConditionExpression: "userId = :userId",
      ExpressionAttributeValues: { ":userId": authResult.userId },
      ScanIndexForward: false,
      Limit: 20,
    }),
  );

  return success({ items: result.Items || [] });
};

const getMyResultsByQuizSet = async (event, quizSetId) => {
  const authResult = await verifyToken(event);
  if (!authResult.isValid) return authResult.response;

  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "userId-index",
      KeyConditionExpression: "userId = :userId",
      FilterExpression: "quizSetId = :quizSetId",
      ExpressionAttributeValues: {
        ":userId": authResult.userId,
        ":quizSetId": quizSetId,
      },
      ScanIndexForward: false,
    }),
  );

  return success({ items: result.Items || [] });
};

exports.handler = withErrorHandler(handler);
