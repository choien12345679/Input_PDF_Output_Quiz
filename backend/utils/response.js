const CORS_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
};

const success = (data, statusCode = 200) => ({
  statusCode,
  headers: CORS_HEADERS,
  body: JSON.stringify({ success: true, data }),
});

const error = (message, statusCode = 500) => ({
  statusCode,
  headers: CORS_HEADERS,
  body: JSON.stringify({ success: false, error: message }),
});

module.exports = { success, error };
