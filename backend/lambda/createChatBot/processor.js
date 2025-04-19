const path = require("path");

const isLambda = !!process.env.AWS_REGION;
const basePath = isLambda
  ? ""
  : path.join(__dirname, "../../../layers/common/nodejs");

const logger = require(isLambda
  ? "utils/logger"
  : path.join(basePath, "utils/logger"));

const { v4: uuidv4 } = require("uuid");
const addChatbotDB = require("./helpers/add-chatbot-db.js");
const addUserChatbotDB = require("./helpers/add-user-chatbot-db.js");
const getUserDB = require("./helpers/get-user-db.js");
const config = require("./config");

/**
 * Creates a new chatbot with the given parameters
 * @param {string} name - Name of the chatbot
 * @param {string} description - Description of the chatbot
 * @param {string} userId - User ID of the chatbot
 */
const createChatBot = async (event) => {
  let body;
  try {
    body = typeof event.body === "string" ? JSON.parse(event.body) : event.body;
  } catch (error) {
    logger.error("Invalid request body:", error);
    return {
      statusCode: config.STATUS_CODES.BAD_REQUEST,
      body: JSON.stringify({ error: "Invalid request body format" }),
    };
  }

  const { name, description, userId } = body;

  // Validate required fields
  if (!name || !description || !userId) {
    logger.error("Missing required fields:", {
      name,
      description,
      userId,
    });
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
    userId,
  });

  try {
    let knowledgeBaseId;
    if (!body.knowledgeBaseId) {
      const getUserDBResult = await getUserDB(userId);
      if (getUserDBResult.isError) {
        logger.error("Failed to get user from database:", {
          userId,
          error: getUserDBResult.error,
        });
        return {
          statusCode: config.STATUS_CODES.INTERNAL_SERVER_ERROR,
          body: { error: config.ERROR_MESSAGES.DATABASE_OPERATION_FAILED },
        };
      }
      knowledgeBaseId = getUserDBResult.Item.knowledgeBaseId;
    } else {
      knowledgeBaseId = body.knowledgeBaseId;
    }

    const chatBotId = uuidv4();
    logger.info("Generated chatbot ID:", { chatBotId });

    const addChatbotDBResult = await addChatbotDB(
      chatBotId,
      name,
      description,
      userId,
      knowledgeBaseId
    );

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

    const addUserChatbotDBResult = await addUserChatbotDB(
      userId,
      chatBotId,
      name,
      description,
      knowledgeBaseId
    );

    if (addUserChatbotDBResult.isError) {
      logger.error("Failed to add user chatbot to database:", {
        userId,
        chatBotId,
        error: addUserChatbotDBResult.error,
      });
      return {
        statusCode: config.STATUS_CODES.INTERNAL_SERVER_ERROR,
        body: { error: config.ERROR_MESSAGES.DATABASE_OPERATION_FAILED },
      };
    }

    logger.info("User chatbot added to database:", {
      userId,
      chatBotId,
      knowledgeBaseId,
    });

    return {
      statusCode: config.STATUS_CODES.SUCCESS,
      body: { chatBotId, knowledgeBaseId },
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
