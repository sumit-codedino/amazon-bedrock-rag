module.exports = {
  STATUS_CODES: {
    OK: 200,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500,
  },
  ERROR_MESSAGES: {
    UNKNOWN_ERROR: "An unexpected error occurred",
    INVALID_TOKEN: "Invalid authorization token",
    USER_ALREADY_EXISTS: "User already exists",
    INVALID_USER_DATA: "Invalid user data provided",
  },
};
