const { error } = require("./response");
const { handlePreflight } = require("../middleware/cors");

/**
 * Lambda 핸들러를 감싸는 에러 핸들링 래퍼
 * - OPTIONS preflight 자동 처리
 * - 예외 발생 시 500 응답 반환
 */
const withErrorHandler = (handler) => async (event, context) => {
  if (event.httpMethod === "OPTIONS") {
    return handlePreflight();
  }

  try {
    return await handler(event, context);
  } catch (err) {
    console.error("Unhandled error:", err);
    return error(err.message || "Internal server error", 500);
  }
};

module.exports = { withErrorHandler };
