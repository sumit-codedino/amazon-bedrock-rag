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

const addChatbotDB = async (
  chatBotId,
  chatBotName,
  chatBotDescription,
  userId,
  knowledgeBaseId
) => {
  logger.info("Updating chatbot in DynamoDB:", {
    chatBotId,
    chatBotName,
    chatBotDescription,
    userId,
    knowledgeBaseId,
  });

  try {
    const params = {
      TableName: process.env.CHATBOT_TABLE_NAME,
      Item: {
        chatBotId,
        chatBotName,
        chatBotDescription,
        knowledgeBaseId,
        createdAt: new Date().toISOString(),
        lastUpdatedAt: new Date().toISOString(),
        createdBy: userId,
      },
    };

    const result = await putDBItem(params);

    if (result.isError) {
      logger.error("Error updating chatbot in DynamoDB:");
      return {
        isError: true,
        error: result.error,
      };
    }

    return {
      isError: false,
      message: "Chatbot added successfully",
    };
  } catch (error) {
    logger.error("Error updating chatbot in DynamoDB:", {
      error: error.message,
      stack: error.stack,
    });

    return {
      isError: true,
      error: error.message,
    };
  }
};

module.exports = addChatbotDB;
