const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");

const winston = require("winston");

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
});

const addChatbotDB = async (chatBotId, name, description, knowledgeBaseId) => {
  logger.info("Updating chatbot in DynamoDB:", {
    chatBotId,
    name,
    description,
    knowledgeBaseId,
  });

  try {
    const client = new DynamoDBClient({ region: process.env.AWS_REGION });
    const docClient = DynamoDBDocumentClient.from(client);

    const command = new PutCommand({
      TableName: process.env.CHATBOT_TABLE_NAME,
      Item: {
        chatBotId,
        name,
        description,
        knowledgeBaseId,
        createdAt: new Date().toISOString(),
      },
    });

    await docClient.send(command);

    return {
      isError: false,
      message: "Chatbot added successfully",
    };
  } catch (error) {
    logger.error("Error updating chatbot in DynamoDB:", {
      error: error.message,
      stack: error.stack,
    });

    return {
      isError: true,
      error: error.message,
    };
  }
};

module.exports = {
  addChatbotDB,
};
