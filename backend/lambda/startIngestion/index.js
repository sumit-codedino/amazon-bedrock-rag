const processor = require("./processor");
const path = require("path");

const isLambda = !!process.env.AWS_REGION;
const basePath = isLambda
  ? ""
  : path.join(__dirname, "../../../layers/common/nodejs");

const logger = require(isLambda
  ? "utils/logger"
  : path.join(basePath, "utils/logger"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Amz-Date, X-Api-Key, X-Amz-Security-Token, X-Amz-User-Agent",
};

/**
 * Lambda handler for starting ingestion
 * @param {Object} event - The Lambda event object
 * @param {Object} context - The Lambda context object
 * @returns {Object} Response object with status code and body
 */
exports.handler = async (event) => {
  logger.info("Received event:", event);

  // Handle preflight requests
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: "",
    };
  }

  try {
    const startIngestionResult = await processor.startIngestion(event);

    logger.info("Start ingestion result:", startIngestionResult);

    return {
      ...startIngestionResult,
      headers: corsHeaders,
    };
  } catch (error) {
    logger.error("Unexpected error starting ingestion:", {
      error: error.message,
      stack: error.stack,
    });

    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Unknown error starting ingestion" }),
    };
  }
};
