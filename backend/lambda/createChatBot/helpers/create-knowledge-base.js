const {
  BedrockAgentClient,
  CreateKnowledgeBaseCommand,
} = require("@aws-sdk/client-bedrock-agent");

const winston = require("winston");

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
});

const createKnowledgeBase = async (chatBotId) => {
  logger.info("Creating knowledge base for chatbot:", chatBotId);

  try {
    const client = new BedrockAgentClient({ region: process.env.AWS_REGION });

    const command = new CreateKnowledgeBaseCommand({
      name: "knowledge-base-custom",
      description: "Knowledge Base for " + chatBotId,
      roleArn: process.env.KNOWLEDGE_BASE_ROLE_ARN,
      knowledgeBaseConfiguration: {
        type: "VECTOR",
        vectorKnowledgeBaseConfiguration: {
          embeddingModelArn: process.env.EMBEDDING_MODEL_ARN,
          embeddingModelConfiguration: {
            bedrockEmbeddingModelConfiguration: {
              dimensions: 1024,
              embeddingDataType: "FLOAT32",
            },
          },
        },
      },
      storageConfiguration: {
        type: "OPENSEARCH_SERVERLESS",
        opensearchServerlessConfiguration: {
          collectionArn:
            "arn:aws:aoss:us-east-1:905418372486:collection/xl54vdjv2ith3i43w4rc",
          vectorIndexName: "bedrock-knowledge-base-default-index",
          fieldMapping: {
            vectorField: "bedrock-knowledge-base-default-vector",
            textField: "AMAZON_BEDROCK_TEXT",
            metadataField: "AMAZON_BEDROCK_METADATA",
          },
        },
      },
    });

    const response = await client.send(command);
    logger.info("Knowledge base created:", response);

    const knowledgeBaseId = response.knowledgeBase.knowledgeBaseId;

    return {
      isError: false,
      knowledgeBaseId,
    };
  } catch (error) {
    logger.error("Error creating knowledge base:", {
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
  createKnowledgeBase,
};
