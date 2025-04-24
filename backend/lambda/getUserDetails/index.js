const path = require("path");

const isLambda = !!process.env.AWS_REGION;
const basePath = isLambda
  ? ""
  : path.join(__dirname, "../../../layers/common/nodejs");

const logger = require(isLambda
  ? "utils/logger"
  : path.join(basePath, "utils/logger"));

const getUserDetails = require("./processor");

/**
 * Lambda handler for creating a new chatbot
 * @param {Object} event - The Lambda event object
 * @param {Object} context - The Lambda context object
 * @returns {Object} Response object with status code and body
 */
exports.handler = async (event) => {
  logger.info("Received event:", event);

  try {
    const processorResult = await getUserDetails(event);

    return {
      ...processorResult,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        "Access-Control-Allow-Headers":
          "Content-Type, Authorization, X-Amz-Date, X-Api-Key, X-Amz-Security-Token, X-Amz-User-Agent",
      },
    };
  } catch (error) {
    logger.error("Unexpected error creating chatbot:", {
      error: error.message,
      stack: error.stack,
    });

    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
