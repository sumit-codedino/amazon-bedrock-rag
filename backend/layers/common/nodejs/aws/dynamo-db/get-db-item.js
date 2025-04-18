const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand } = require("@aws-sdk/lib-dynamodb");

const logger = require("../../utils/logger");

const getDBItem = async (params) => {
  logger.info("Getting item from DynamoDB:", params);

  try {
    const client = new DynamoDBClient({ region: process.env.AWS_REGION });
    const docClient = DynamoDBDocumentClient.from(client);

    const command = new GetCommand(params);
    const result = await docClient.send(command);

    logger.info("Item retrieved from DynamoDB:", result);
    return {
      isError: false,
      message: "Item retrieved from DynamoDB successfully",
      data: result,
    };
  } catch (error) {
    logger.error("Error retrieving item from DynamoDB:", {
      error: error.message,
      stack: error.stack,
    });
    return {
      isError: true,
      error: error.message,
    };
  }
};

module.exports = getDBItem;
