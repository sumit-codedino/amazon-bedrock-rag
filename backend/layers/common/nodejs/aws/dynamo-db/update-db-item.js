const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  UpdateCommand,
} = require("@aws-sdk/lib-dynamodb");

const logger = require("../../utils/logger");

const updateDBItem = async (params) => {
  logger.info("Updating item in DynamoDB:", params);

  try {
    const client = new DynamoDBClient({ region: process.env.AWS_REGION });
    const docClient = DynamoDBDocumentClient.from(client);

    const command = new UpdateCommand(params);
    await docClient.send(command);

    logger.info("Item updated in DynamoDB successfully");
    return {
      isError: false,
      message: "Item updated in DynamoDB successfully",
    };
  } catch (error) {
    logger.error("Error updating item in DynamoDB:", {
      error: error.message,
      stack: error.stack,
    });
    return {
      isError: true,
      error: error.message,
    };
  }
};

module.exports = updateDBItem;
