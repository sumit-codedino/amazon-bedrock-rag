const path = require("path");

const isLambda = !!process.env.AWS_REGION;
const basePath = isLambda
  ? ""
  : path.join(__dirname, "../../../layers/common/nodejs");

const logger = require(isLambda
  ? "utils/logger"
  : path.join(basePath, "utils/logger"));
const putDBItem = require(isLambda
  ? "aws/dynamo-db/put-db-item"
  : path.join(basePath, "aws/dynamo-db/put-db-item"));

const addUserChatbotDB = async (
  userId,
  chatBotId,
  chatBotName,
  chatBotDescription,
  knowledgeBaseId
) => {
  logger.info("Adding user chatbot to database:", { userId, chatBotId });

  const params = {
    TableName: process.env.USER_CHATBOT_TABLE_NAME,
    Item: {
      userId,
      chatBotId,
      chatBotName,
      chatBotDescription,
      knowledgeBaseId,
      createdBy: userId,
      createdAt: new Date().toISOString(),
      lastUpdatedAt: new Date().toISOString(),
    },
  };

  try {
    const result = await putDBItem(params);
    if (result.isError) {
      logger.error("Error adding user chatbot to database:");
      return {
        isError: true,
        error: result.error,
      };
    }
    logger.info("User chatbot added to database:", { userId, chatBotId });
    return {
      isError: false,
    };
  } catch (error) {
    logger.error("Error adding user chatbot to database:", {
      error: error.message,
      stack: error.stack,
    });
    return {
      isError: true,
      error: error.message,
    };
  }
};

module.exports = addUserChatbotDB;
