const processor = require("./processor");
const config = require("./config");
const path = require("path");

const isLambda = !!process.env.AWS_REGION;
const basePath = isLambda
  ? ""
  : path.join(__dirname, "../../../layers/common/nodejs");

const logger = require(isLambda
  ? "utils/logger"
  : path.join(basePath, "utils/logger"));

/**
 * Lambda handler for creating a new chatbot
 * @param {Object} event - The Lambda event object
 * @param {Object} context - The Lambda context object
 * @returns {Object} Response object with status code and body
 */
exports.handler = async (event) => {
  logger.info("Received event:", event);

  try {
    const signUpResponse = await processor.signUp(event);

    return signUpResponse;
  } catch (error) {
    logger.error("Unexpected error creating chatbot:", {
      error: error.message,
      stack: error.stack,
    });

    return {
      statusCode: config.STATUS_CODES.INTERNAL_SERVER_ERROR,
      body: JSON.stringify({ error: config.ERROR_MESSAGES.UNKNOWN_ERROR }),
    };
  }
};
