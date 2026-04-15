const jwt = require("jsonwebtoken");
const jwksClient = require("jwks-rsa");
const { error } = require("../utils/response");

const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;
const REGION = process.env.AWS_REGION || "ap-northeast-2";

const client = jwksClient({
  jwksUri: `https://cognito-idp.${REGION}.amazonaws.com/${USER_POOL_ID}/.well-known/jwks.json`,
  cache: true,
  cacheMaxEntries: 5,
  cacheMaxAge: 600000, // 10분
});

const getSigningKey = (header) =>
  new Promise((resolve, reject) => {
    client.getSigningKey(header.kid, (err, key) => {
      if (err) return reject(err);
      resolve(key.getPublicKey());
    });
  });

/**
 * Cognito JWT 토큰 검증
 */
const verifyToken = async (event) => {
  const authHeader =
    event.headers?.Authorization || event.headers?.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      isValid: false,
      response: error("Authorization token missing", 401),
    };
  }

  const token = authHeader.slice(7);

  try {
    const decoded = await new Promise((resolve, reject) => {
      jwt.verify(
        token,
        (header, callback) => {
          getSigningKey(header)
            .then((key) => callback(null, key))
            .catch(callback);
        },
        { algorithms: ["RS256"] },
        (err, payload) => {
          if (err) return reject(err);
          resolve(payload);
        },
      );
    });

    return {
      isValid: true,
      userId: decoded.sub,
      email: decoded.email,
      role: decoded["custom:role"] || "user",
    };
  } catch (err) {
    console.error("Token verification failed:", err.message);
    return {
      isValid: false,
      response: error("Invalid or expired token", 401),
    };
  }
};

/**
 * 관리자 권한 확인
 */
const requireAdmin = (authResult) => {
  if (authResult.role !== "admin") {
    return error("Admin access required", 403);
  }
  return null;
};

module.exports = { verifyToken, requireAdmin };
