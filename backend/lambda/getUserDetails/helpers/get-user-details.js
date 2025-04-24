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

const getUserDB = async (userId) => {
  logger.info("Getting user from database:", { userId });

  const params = {
    TableName: process.env.USER_TABLE_NAME,
    Key: {
      userId,
    },
  };

  try {
    const result = await getDBItem(params);
    if (result.isError) {
      logger.error("Error getting user from database:", {
        userId,
        error: result.error,
      });
      return {
        isError: true,
        error: result.error,
      };
    }
    logger.info("User retrieved from database:", { userId, result });
    return {
      isError: false,
      Item: result.Item,
    };
  } catch (error) {
    logger.error("Error getting user from database:", {
      userId,
      error: error.message,
      stack: error.stack,
    });
    return {
      isError: true,
      error: error.message,
    };
  }
};

module.exports = getUserDB;
