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
    // Parse and validate request body
    let body;
    try {
      body =
        typeof event.body === "string" ? JSON.parse(event.body) : event.body;
    } catch (error) {
      logger.error("Invalid request body:", error);
      return {
        statusCode: config.STATUS_CODES.BAD_REQUEST,
        body: JSON.stringify({ error: "Invalid request body format" }),
      };
    }

    const { name, description } = body;

    // Validate required fields
    if (!name || !description) {
      logger.error("Missing required fields:", { name, description });
      return {
        statusCode: config.STATUS_CODES.BAD_REQUEST,
        body: JSON.stringify({
          error: config.ERROR_MESSAGES.MISSING_REQUIRED_FIELDS,
        }),
      };
    }

    logger.info("Processing chatbot creation request", {
      name,
      description,
    });

    const createChatBotResult = await processor.createChatBot(
      name,
      description
    );

    logger.info("Chatbot creation result:", createChatBotResult);

    return {
      statusCode: createChatBotResult.statusCode,
      body: JSON.stringify(createChatBotResult.body),
    };
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
