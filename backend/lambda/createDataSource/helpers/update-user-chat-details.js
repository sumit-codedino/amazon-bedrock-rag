const path = require("path");

const isLambda = !!process.env.AWS_REGION;
const basePath = isLambda
  ? ""
  : path.join(__dirname, "../../../layers/common/nodejs");

const logger = require(isLambda
  ? "utils/logger"
  : path.join(basePath, "utils/logger"));

const updateDBItem = require(isLambda
  ? "aws/dynamo-db/update-db-item"
  : path.join(basePath, "aws/dynamo-db/update-db-item"));

const updateUserChatDetails = async (
  userId,
  chatBotId,
  s3DataSourceId,
  webDataSourceId
) => {
  logger.info("Updating user chat details", {
    userId,
    chatBotId,
    s3DataSourceId,
    webDataSourceId,
  });

  try {
    const updateExpression = [];
    const expressionAttributeValues = {};
    const expressionAttributeNames = {};

    if (s3DataSourceId) {
      updateExpression.push("s3DataSourceId = :s3DataSourceId");
      expressionAttributeValues[":s3DataSourceId"] = s3DataSourceId;
      expressionAttributeNames[":s3DataSourceId"] = "s3DataSourceId";
    }

    if (webDataSourceId) {
      updateExpression.push("webDataSourceId = :webDataSourceId");
      expressionAttributeValues[":webDataSourceId"] = webDataSourceId;
      expressionAttributeNames[":webDataSourceId"] = "webDataSourceId";
    }

    const params = {
      TableName: process.env.USER_CHATBOT_TABLE_NAME,
      Key: {
        userId: userId,
        chatBotId: chatBotId,
      },
      UpdateExpression: updateExpression.join(", "),
      ExpressionAttributeValues: expressionAttributeValues,
      ExpressionAttributeNames: expressionAttributeNames,
    };

    const result = await updateDBItem(params);
    logger.info("User chat details updated successfully", { result });
    return {
      isError: false,
      result,
    };
  } catch (error) {
    logger.error("Error updating user chat details", {
      error: error.message,
      stack: error.stack,
    });
  }
};

module.exports = updateUserChatDetails;
