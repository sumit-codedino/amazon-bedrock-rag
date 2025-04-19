const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  QueryCommand,
} = require("@aws-sdk/lib-dynamodb");

const logger = require("../../utils/logger");

const queryDB = async (params) => {
  logger.info("Querying database:", params);

  try {
    const client = new DynamoDBClient({ region: process.env.AWS_REGION });
    const docClient = DynamoDBDocumentClient.from(client);

    const command = new QueryCommand(params);
    const result = await docClient.send(command);
    logger.info("Query result:", result);
    return {
      isError: false,
      Items: result.Items,
    };
  } catch (error) {
    logger.error("Error querying database:", {
      error: error.message,
      stack: error.stack,
    });
    return {
      isError: true,
      error: error.message,
    };
  }
};

module.exports = queryDB;
