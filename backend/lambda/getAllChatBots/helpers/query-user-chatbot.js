const path = require("path");

const isLambda = !!process.env.AWS_REGION;
const basePath = isLambda
  ? ""
  : path.join(__dirname, "../../../layers/common/nodejs");

const logger = require(isLambda
  ? "utils/logger"
  : path.join(basePath, "utils/logger"));
const queryDB = require(isLambda
  ? "aws/dynamo-db/query-db"
  : path.join(basePath, "aws/dynamo-db/query-db"));

const queryUserChatbot = async (userId) => {
  logger.info("Querying user chatbot:", { userId });

  try {
    const params = {
      TableName: process.env.USER_CHATBOT_TABLE_NAME,
      IndexName: "createdBy-index",
      KeyConditionExpression: "createdBy = :userId",
      ExpressionAttributeValues: {
        ":userId": userId,
      },
    };

    const result = await queryDB(params);
    logger.info("User chatbot query result:", result);
    return {
      isError: false,
      Items: result.Items,
    };
  } catch (error) {
    logger.error("Error querying user chatbot:", {
      error: error.message,
      stack: error.stack,
    });
    return {
      isError: true,
      error: error.message,
    };
  }
};

module.exports = queryUserChatbot;
