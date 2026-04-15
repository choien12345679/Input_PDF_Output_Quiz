const {
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  ScanCommand,
} = require("@aws-sdk/lib-dynamodb");
const { v4: uuidv4 } = require("uuid");
const Joi = require("joi");
const { docClient } = require("../../utils/dynamodb");
const { success, error } = require("../../utils/response");
const { withErrorHandler } = require("../../utils/errorHandler");
const { verifyToken, requireAdmin } = require("../../middleware/auth");

const TABLE_NAME = "quiz-app-quiz-sets";

const createSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().allow("", null),
  category: Joi.string().required(),
  isPublic: Joi.boolean().default(false),
});

const updateSchema = Joi.object({
  title: Joi.string(),
  description: Joi.string().allow("", null),
  category: Joi.string(),
  isPublic: Joi.boolean(),
});

const handler = async (event) => {
  const { httpMethod, pathParameters } = event;
  const id = pathParameters?.id;

  if (httpMethod === "GET" && !id) return await listQuizSets(event);
  if (httpMethod === "POST" && !id) return await createQuizSet(event);
  if (httpMethod === "GET" && id) return await getQuizSet(event, id);
  if (httpMethod === "PUT" && id) return await updateQuizSet(event, id);
  if (httpMethod === "DELETE" && id) return await deleteQuizSet(event, id);

  return error("Not Found", 404);
};

const listQuizSets = async (event) => {
  const { category, limit, lastKey } = event.queryStringParameters || {};
  const pageLimit = parseInt(limit) || 20;

  const params = {
    TableName: TABLE_NAME,
    FilterExpression: "isPublic = :isPublic",
    ExpressionAttributeValues: { ":isPublic": true },
    Limit: pageLimit,
  };

  if (category) {
    params.FilterExpression += " AND category = :category";
    params.ExpressionAttributeValues[":category"] = category;
  }

  if (lastKey) {
    try {
      params.ExclusiveStartKey = JSON.parse(
        Buffer.from(lastKey, "base64").toString("utf8"),
      );
    } catch {
      return error("Invalid lastKey", 400);
    }
  }

  const result = await docClient.send(new ScanCommand(params));

  const responseLastKey = result.LastEvaluatedKey
    ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString("base64")
    : null;

  return success({ items: result.Items || [], lastKey: responseLastKey });
};

const createQuizSet = async (event) => {
  const authResult = await verifyToken(event);
  if (!authResult.isValid) return authResult.response;

  const adminError = requireAdmin(authResult);
  if (adminError) return adminError;

  const body = JSON.parse(event.body || "{}");
  const { error: validationError, value } = createSchema.validate(body);
  if (validationError) return error(validationError.details[0].message, 400);

  const now = new Date().toISOString();
  const quizSet = {
    quizSetId: uuidv4(),
    title: value.title,
    description: value.description || "",
    category: value.category,
    isPublic: value.isPublic,
    questionCount: 0,
    createdBy: authResult.userId,
    sourceType: "manual",
    createdAt: now,
    updatedAt: now,
  };

  await docClient.send(
    new PutCommand({ TableName: TABLE_NAME, Item: quizSet }),
  );

  return success(quizSet, 201);
};

const getQuizSet = async (event, id) => {
  const result = await docClient.send(
    new GetCommand({ TableName: TABLE_NAME, Key: { quizSetId: id } }),
  );

  if (!result.Item) return error("퀴즈 세트를 찾을 수 없습니다.", 404);

  return success(result.Item);
};

const updateQuizSet = async (event, id) => {
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
      TableName: TABLE_NAME,
      Key: { quizSetId: id },
      UpdateExpression: "SET " + updateExprParts.join(", "),
      ExpressionAttributeValues: exprAttrValues,
      ExpressionAttributeNames: exprAttrNames,
      ConditionExpression: "attribute_exists(quizSetId)",
      ReturnValues: "ALL_NEW",
    }),
  );

  return success(result.Attributes);
};

const deleteQuizSet = async (event, id) => {
  const authResult = await verifyToken(event);
  if (!authResult.isValid) return authResult.response;

  const adminError = requireAdmin(authResult);
  if (adminError) return adminError;

  await docClient.send(
    new DeleteCommand({ TableName: TABLE_NAME, Key: { quizSetId: id } }),
  );

  return success({ message: "퀴즈 세트가 삭제되었습니다." });
};

exports.handler = withErrorHandler(handler);
