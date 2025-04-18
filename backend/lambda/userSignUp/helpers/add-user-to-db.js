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

const addUserToDB = async (userId, email, knowledgeBaseId) => {
  logger.info("Adding user to DynamoDB");

  const params = {
    TableName: process.env.USERS_TABLE_NAME,
    Item: {
      userId,
      email,
      knowledgeBaseId,
      createdAt: new Date().toISOString(),
    },
  };

  try {
    const result = await putDBItem(params);

    if (result.isError) {
      logger.error("Error adding user to DynamoDB:");
      return {
        isError: true,
        error: result.error,
      };
    }

    logger.info("User added to DynamoDB:");

    return {
      isError: false,
      message: "User added to DynamoDB",
    };
  } catch (error) {
    logger.error("Error adding user to DynamoDB:", {
      error: error.message,
      stack: error.stack,
    });
    return {
      isError: true,
      error: error.message,
    };
  }
};

module.exports = addUserToDB;
