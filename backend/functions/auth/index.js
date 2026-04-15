const Joi = require("joi");
const {
  CognitoIdentityProviderClient,
  SignUpCommand,
  InitiateAuthCommand,
} = require("@aws-sdk/client-cognito-identity-provider");
const { PutCommand } = require("@aws-sdk/lib-dynamodb");
const { docClient } = require("../../utils/dynamodb");
const { success, error } = require("../../utils/response");
const { withErrorHandler } = require("../../utils/errorHandler");

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION || "ap-northeast-2",
});

const CLIENT_ID = process.env.COGNITO_APP_CLIENT_ID;

// Cognito 에러 코드 → 한국어 메시지
const cognitoErrorMessage = (code) => {
  const messages = {
    UsernameExistsException: "이미 사용 중인 이메일입니다.",
    NotAuthorizedException: "이메일 또는 비밀번호가 올바르지 않습니다.",
    UserNotConfirmedException: "이메일 인증이 필요합니다.",
    InvalidPasswordException: "비밀번호는 8자 이상이어야 합니다.",
  };
  return messages[code] || null;
};

// POST /auth/signup
const signup = async (event) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    nickname: Joi.string().required(),
  });

  const body = JSON.parse(event.body || "{}");
  const { error: validationError, value } = schema.validate(body);
  if (validationError) {
    return error(validationError.details[0].message, 400);
  }

  const { email, password, nickname } = value;

  try {
    const signUpResult = await cognitoClient.send(
      new SignUpCommand({
        ClientId: CLIENT_ID,
        Username: email,
        Password: password,
        UserAttributes: [{ Name: "email", Value: email }],
      }),
    );

    const userId = signUpResult.UserSub;

    await docClient.send(
      new PutCommand({
        TableName: "quiz-app-users",
        Item: {
          userId,
          email,
          nickname,
          role: "user",
          bookmarkedQuestionIds: [],
          createdAt: new Date().toISOString(),
        },
      }),
    );

    return success(
      { message: "회원가입이 완료되었습니다. 이메일을 확인해주세요.", userId },
      201,
    );
  } catch (err) {
    const msg = cognitoErrorMessage(err.name);
    if (msg) return error(msg, 400);
    throw err;
  }
};

// POST /auth/signin
const signin = async (event) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  });

  const body = JSON.parse(event.body || "{}");
  const { error: validationError, value } = schema.validate(body);
  if (validationError) {
    return error(validationError.details[0].message, 400);
  }

  const { email, password } = value;

  try {
    const result = await cognitoClient.send(
      new InitiateAuthCommand({
        AuthFlow: "USER_PASSWORD_AUTH",
        ClientId: CLIENT_ID,
        AuthParameters: {
          USERNAME: email,
          PASSWORD: password,
        },
      }),
    );

    const auth = result.AuthenticationResult;
    return success({
      accessToken: auth.AccessToken,
      idToken: auth.IdToken,
      refreshToken: auth.RefreshToken,
      expiresIn: auth.ExpiresIn,
    });
  } catch (err) {
    const msg = cognitoErrorMessage(err.name);
    if (msg) return error(msg, 401);
    throw err;
  }
};

// POST /auth/refresh
const refresh = async (event) => {
  const schema = Joi.object({
    refreshToken: Joi.string().required(),
  });

  const body = JSON.parse(event.body || "{}");
  const { error: validationError, value } = schema.validate(body);
  if (validationError) {
    return error(validationError.details[0].message, 400);
  }

  const { refreshToken } = value;

  try {
    const result = await cognitoClient.send(
      new InitiateAuthCommand({
        AuthFlow: "REFRESH_TOKEN_AUTH",
        ClientId: CLIENT_ID,
        AuthParameters: {
          REFRESH_TOKEN: refreshToken,
        },
      }),
    );

    const auth = result.AuthenticationResult;
    return success({
      accessToken: auth.AccessToken,
      idToken: auth.IdToken,
      expiresIn: auth.ExpiresIn,
    });
  } catch (err) {
    const msg = cognitoErrorMessage(err.name);
    if (msg) return error(msg, 401);
    throw err;
  }
};

const handler = async (event) => {
  const { httpMethod, path } = event;

  if (httpMethod === "POST" && path.endsWith("/signup")) {
    return await signup(event);
  }
  if (httpMethod === "POST" && path.endsWith("/signin")) {
    return await signin(event);
  }
  if (httpMethod === "POST" && path.endsWith("/refresh")) {
    return await refresh(event);
  }

  return error("Not Found", 404);
};

exports.handler = withErrorHandler(handler);
