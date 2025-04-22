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
 * Lambda handler for creating a data source
 * @param {Object} event - The Lambda event object
 * @param {Object} context - The Lambda context object
 * @returns {Object} Response object with status code and body
 */
exports.handler = async (event) => {
  logger.info("Received event:", event);

  try {
    const createDataSourceResult = await processor.createDataSource(event);

    logger.info("Create data source result:", createDataSourceResult);

    return {
      statusCode: createDataSourceResult.statusCode,
      body: JSON.stringify(createDataSourceResult.body),
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        "Access-Control-Allow-Headers":
          "Content-Type, Authorization, X-Amz-Date, X-Api-Key, X-Amz-Security-Token, X-Amz-User-Agent",
      },
    };
  } catch (error) {
    logger.error("Unexpected error creating data source:", {
      error: error.message,
      stack: error.stack,
    });

    return {
      statusCode: config.STATUS_CODES.INTERNAL_SERVER_ERROR,
      body: JSON.stringify({ error: config.ERROR_MESSAGES.UNKNOWN_ERROR }),
    };
  }
};
