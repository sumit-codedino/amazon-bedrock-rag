const {
  BedrockAgentClient,
  CreateKnowledgeBaseCommand,
} = require("@aws-sdk/client-bedrock-agent");

const logger = require("../../utils/logger");

const createKnowledgeBase = async (params) => {
  logger.info("Creating knowledge base:", params);

  try {
    const client = new BedrockAgentClient({ region: process.env.AWS_REGION });

    const command = new CreateKnowledgeBaseCommand(params);
    const response = await client.send(command);

    logger.info("Knowledge base created successfully:", response);
    return {
      isError: false,
      message: "Knowledge base created successfully",
      data: response,
    };
  } catch (error) {
    logger.error("Error creating knowledge base:", {
      error: error.message,
      stack: error.stack,
    });
    return {
      isError: true,
      message: "Error creating knowledge base",
    };
  }
};

module.exports = createKnowledgeBase;
