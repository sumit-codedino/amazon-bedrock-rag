const path = require("path");

const isLambda = !!process.env.AWS_REGION;
const basePath = isLambda
  ? ""
  : path.join(__dirname, "../../../layers/common/nodejs");

const logger = require(isLambda
  ? "utils/logger"
  : path.join(basePath, "utils/logger"));
const getDBItem = require(isLambda
  ? "aws/dynamo-db/get-db-item"
  : path.join(basePath, "aws/dynamo-db/get-db-item"));

const getChatbotDetails = async (chatBotId) => {
  logger.info("Getting chatbot details:", { chatBotId });

  try {
    const params = {
      TableName: process.env.CHATBOT_TABLE_NAME,
      Key: {
        chatBotId,
      },
    };

    const result = await getDBItem(params);
    logger.info("Chatbot details:", result);

    return {
      isError: false,
      Item: result.Item,
    };
  } catch (error) {
    logger.error("Error getting chatbot details:", {
      error: error.message,
      stack: error.stack,
    });
    return {
      isError: true,
      error: error.message,
    };
  }
};

module.exports = getChatbotDetails;
