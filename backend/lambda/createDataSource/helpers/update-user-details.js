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

const updateUserDetails = async (
  userId,
  s3DataSourceId = null,
  webDataSourceId = null
) => {
  logger.info("Updating user details", {
    userId,
    s3DataSourceId,
    webDataSourceId,
  });

  try {
    const updateExpression = [];
    const expressionAttributeValues = {};
    const expressionAttributeNames = {};

    // Only add s3DataSourceId if it's provided
    if (s3DataSourceId !== null) {
      updateExpression.push("#s3DataSourceId = :s3DataSourceId");
      expressionAttributeValues[":s3DataSourceId"] = s3DataSourceId;
      expressionAttributeNames["#s3DataSourceId"] = "s3DataSourceId";
    }

    // Only add webDataSourceId if it's provided
    if (webDataSourceId !== null) {
      updateExpression.push("#webDataSourceId = :webDataSourceId");
      expressionAttributeValues[":webDataSourceId"] = webDataSourceId;
      expressionAttributeNames["#webDataSourceId"] = "webDataSourceId";
    }

    // If no updates are needed, return early
    if (updateExpression.length === 0) {
      return {
        isError: false,
        data: { message: "No updates required" },
      };
    }

    const params = {
      TableName: process.env.USER_TABLE_NAME,
      Key: {
        userId,
      },
      UpdateExpression: `SET ${updateExpression.join(", ")}`,
      ExpressionAttributeValues: expressionAttributeValues,
      ExpressionAttributeNames: expressionAttributeNames,
      ReturnValues: "ALL_NEW",
    };

    const result = await updateDBItem(params);

    return {
      isError: false,
      data: result.Attributes,
    };
  } catch (error) {
    logger.error("Error updating user details:", {
      error: error.message,
      stack: error.stack,
    });
    return {
      isError: true,
      error: error.message,
    };
  }
};

module.exports = updateUserDetails;
