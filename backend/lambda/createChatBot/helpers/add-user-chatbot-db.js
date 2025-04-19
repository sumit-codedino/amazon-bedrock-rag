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
  chatbotId,
  chatbotName,
  chatbotDescription,
  knowledgeBaseId
) => {
  logger.info("Adding user chatbot to database:", { userId, chatbotId });

  const params = {
    TableName: process.env.USER_CHATBOT_TABLE_NAME,
    Item: {
      userId,
      chatbotId,
      chatbotName,
      chatbotDescription,
      knowledgeBaseId,
      createdBy: userId,
      createdAt: new Date().toISOString(),
      lastUpdatedAt: new Date().toISOString(),
    },
  };

  try {
    await putDBItem(params);
    logger.info("User chatbot added to database:", { userId, chatbotId });
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
