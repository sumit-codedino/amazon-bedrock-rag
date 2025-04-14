const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");

const logger = require("../../utils/logger");

const putDBItem = async (params) => {
  logger.info("Putting item into DynamoDB:", params);

  try {
    const client = new DynamoDBClient({ region: process.env.AWS_REGION });
    const docClient = DynamoDBDocumentClient.from(client);

    const command = new PutCommand(params);
    await docClient.send(command);

    logger.info("Item put into DynamoDB successfully");
    return {
      isError: false,
      message: "Item put into DynamoDB successfully",
    };
  } catch (error) {
    logger.error("Error putting item into DynamoDB:", {
      error: error.message,
      stack: error.stack,
    });
    return {
      isError: true,
      message: "Error putting item into DynamoDB",
    };
  }
};

module.exports = putDBItem;
