const path = require("path");

const isLambda = !!process.env.AWS_REGION;
const basePath = isLambda
  ? ""
  : path.join(__dirname, "../../../layers/common/nodejs");

const logger = require(isLambda
  ? "utils/logger"
  : path.join(basePath, "utils/logger"));

const { v4: uuidv4 } = require("uuid");
const createNewKnowledgeBase = require("./helpers/create-knowledge-base.js");
const addChatbotDB = require("./helpers/add-chatbot-db.js");
const config = require("./config");

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - The function to retry
 * @param {number} maxAttempts - Maximum number of attempts
 * @param {number} baseDelay - Base delay in milliseconds
 * @returns {Promise<any>} The result of the function
 */
const retryWithBackoff = async (
  fn,
  maxAttempts = config.RETRY_CONFIG.MAX_ATTEMPTS,
  baseDelay = config.RETRY_CONFIG.BASE_DELAY
) => {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (error) {
      attempt++;
      if (attempt >= maxAttempts) {
        throw error;
      }
      const delay = baseDelay * Math.pow(2, attempt - 1);
      logger.warn(`Retry attempt ${attempt} after ${delay}ms`, {
        error: error.message,
      });
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};

/**
 * Creates a new chatbot with the given parameters
 * @param {string} name - Name of the chatbot
 * @param {string} description - Description of the chatbot
 * @param {Array} dataSources - Array of data sources
 * @param {Array} s3Files - Array of S3 files
 * @param {Array} webUrls - Array of web URLs
 * @returns {Promise<Object>} Result of the chatbot creation
 */
const createChatBot = async (
  name,
  description,
  dataSources,
  s3Files,
  webUrls
) => {
  logger.info("Starting chatbot creation process", {
    name,
    description,
  });

  try {
    const chatBotId = uuidv4();
    logger.info("Generated chatbot ID:", { chatBotId });

    // Create knowledge base with retry logic
    const createKnowledgeBaseResult = await retryWithBackoff(async () => {
      logger.info("Creating knowledge base", { chatBotId });
      return await createNewKnowledgeBase(chatBotId, dataSources);
    });

    if (createKnowledgeBaseResult.isError) {
      logger.error(
        "Failed to create knowledge base:",
        createKnowledgeBaseResult.error
      );
      return {
        statusCode: config.STATUS_CODES.INTERNAL_SERVER_ERROR,
        body: { error: config.ERROR_MESSAGES.KNOWLEDGE_BASE_CREATION_FAILED },
      };
    }

    logger.info("Knowledge base created successfully", {
      chatBotId,
      knowledgeBaseId: createKnowledgeBaseResult.knowledgeBase,
    });

    // Add chatbot to database with retry logic
    const addChatbotDBResult = await retryWithBackoff(async () => {
      logger.info("Adding chatbot to database", { chatBotId });
      return await addChatbotDB(
        chatBotId,
        name,
        description,
        createKnowledgeBaseResult.knowledgeBaseId
      );
    });

    if (
      !addChatbotDBResult ||
      typeof addChatbotDBResult.isError === "undefined"
    ) {
      logger.error("Invalid response from addChatbotDB", { chatBotId });
      return {
        statusCode: config.STATUS_CODES.INTERNAL_SERVER_ERROR,
        body: { error: config.ERROR_MESSAGES.INVALID_DB_RESPONSE },
      };
    }

    if (addChatbotDBResult.isError) {
      logger.error(
        "Failed to add chatbot to database:",
        addChatbotDBResult.error
      );
      return {
        statusCode: config.STATUS_CODES.INTERNAL_SERVER_ERROR,
        body: { error: config.ERROR_MESSAGES.DATABASE_OPERATION_FAILED },
      };
    }

    logger.info("Chatbot created successfully", { chatBotId });

    return {
      statusCode: config.STATUS_CODES.SUCCESS,
      body: { chatBotId },
    };
  } catch (error) {
    logger.error("Unexpected error in chatbot creation process:", {
      error: error.message,
      stack: error.stack,
    });
    return {
      statusCode: config.STATUS_CODES.INTERNAL_SERVER_ERROR,
      body: { error: config.ERROR_MESSAGES.UNKNOWN_ERROR },
    };
  }
};

module.exports = {
  createChatBot,
};
