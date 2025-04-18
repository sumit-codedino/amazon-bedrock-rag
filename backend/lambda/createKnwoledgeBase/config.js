/**
 * Configuration file for the createChatBot Lambda function
 */

module.exports = {
  // AWS Configuration
  AWS_REGION: process.env.AWS_REGION || "us-east-1",

  // DynamoDB Configuration
  CHATBOT_TABLE_NAME: process.env.CHATBOT_TABLE_NAME,

  // Logging Configuration
  LOG_LEVEL: process.env.LOG_LEVEL || "info",

  // Error Messages
  ERROR_MESSAGES: {
    MISSING_REQUIRED_FIELDS: "Name and description are required",
    KNOWLEDGE_BASE_CREATION_FAILED: "Failed to create knowledge base",
    CHATBOT_CREATION_FAILED: "Failed to create chatbot",
    DATABASE_OPERATION_FAILED: "Failed to add chatbot",
    INVALID_DB_RESPONSE: "Invalid response from database operation",
    UNKNOWN_ERROR: "An unexpected error occurred",
  },

  // HTTP Status Codes
  STATUS_CODES: {
    SUCCESS: 200,
    BAD_REQUEST: 400,
    INTERNAL_SERVER_ERROR: 500,
  },

  // Retry Configuration
  RETRY_CONFIG: {
    MAX_ATTEMPTS: 1,
    BASE_DELAY: 1000, // milliseconds
  },
};
