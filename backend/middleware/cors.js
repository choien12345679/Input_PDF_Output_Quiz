const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
};

/**
 * OPTIONS preflight 요청에 대한 CORS 응답 반환
 */
const handlePreflight = () => ({
  statusCode: 200,
  headers: CORS_HEADERS,
  body: "",
});

/**
 * 응답 객체에 CORS 헤더 추가
 */
const addCorsHeaders = (response) => ({
  ...response,
  headers: {
    ...CORS_HEADERS,
    ...(response.headers || {}),
  },
});

module.exports = { CORS_HEADERS, handlePreflight, addCorsHeaders };
