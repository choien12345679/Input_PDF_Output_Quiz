const {
  GetCommand,
  UpdateCommand,
  BatchGetCommand,
} = require("@aws-sdk/lib-dynamodb");
const { docClient } = require("../../utils/dynamodb");
const { success, error } = require("../../utils/response");
const { withErrorHandler } = require("../../utils/errorHandler");
const { verifyToken } = require("../../middleware/auth");

const USERS_TABLE = "quiz-app-users";
const QUESTIONS_TABLE = "quiz-app-questions";

const handler = async (event) => {
  const { httpMethod, pathParameters, path } = event;
  const questionId = pathParameters?.questionId;

  if (httpMethod === "GET" && path.endsWith("/me"))
    return await getMyBookmarks(event);
  if (httpMethod === "POST" && questionId)
    return await addBookmark(event, questionId);
  if (httpMethod === "DELETE" && questionId)
    return await removeBookmark(event, questionId);

  return error("Not Found", 404);
};

const addBookmark = async (event, questionId) => {
  const authResult = await verifyToken(event);
  if (!authResult.isValid) return authResult.response;

  const { userId } = authResult;

  // 현재 북마크 목록 조회 후 중복 확인
  const current = await docClient.send(
    new GetCommand({
      TableName: USERS_TABLE,
      Key: { userId },
      ProjectionExpression: "bookmarkedQuestionIds",
    }),
  );

  const existing = current.Item?.bookmarkedQuestionIds || [];
  if (existing.includes(questionId)) {
    return success({ message: "이미 북마크된 문제입니다.", questionId });
  }

  await docClient.send(
    new UpdateCommand({
      TableName: USERS_TABLE,
      Key: { userId },
      UpdateExpression:
        "SET bookmarkedQuestionIds = list_append(if_not_exists(bookmarkedQuestionIds, :empty), :newId)",
      ExpressionAttributeValues: {
        ":empty": [],
        ":newId": [questionId],
      },
    }),
  );

  return success({ message: "북마크가 추가되었습니다.", questionId });
};

const removeBookmark = async (event, questionId) => {
  const authResult = await verifyToken(event);
  if (!authResult.isValid) return authResult.response;

  const { userId } = authResult;

  const current = await docClient.send(
    new GetCommand({
      TableName: USERS_TABLE,
      Key: { userId },
      ProjectionExpression: "bookmarkedQuestionIds",
    }),
  );

  const existing = current.Item?.bookmarkedQuestionIds || [];
  const updated = existing.filter((id) => id !== questionId);

  await docClient.send(
    new UpdateCommand({
      TableName: USERS_TABLE,
      Key: { userId },
      UpdateExpression: "SET bookmarkedQuestionIds = :updated",
      ExpressionAttributeValues: { ":updated": updated },
    }),
  );

  return success({ message: "북마크가 제거되었습니다.", questionId });
};

const getMyBookmarks = async (event) => {
  const authResult = await verifyToken(event);
  if (!authResult.isValid) return authResult.response;

  const { userId } = authResult;

  const userResult = await docClient.send(
    new GetCommand({
      TableName: USERS_TABLE,
      Key: { userId },
      ProjectionExpression: "bookmarkedQuestionIds",
    }),
  );

  const questionIds = userResult.Item?.bookmarkedQuestionIds || [];
  if (questionIds.length === 0) {
    return success({ items: [] });
  }

  const keys = questionIds.map((questionId) => ({ questionId }));

  const batchResult = await docClient.send(
    new BatchGetCommand({
      RequestItems: {
        [QUESTIONS_TABLE]: { Keys: keys },
      },
    }),
  );

  const questions = batchResult.Responses?.[QUESTIONS_TABLE] || [];

  return success({ items: questions });
};

exports.handler = withErrorHandler(handler);
