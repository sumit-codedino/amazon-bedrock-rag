const path = require("path");

const isLambda = !!process.env.AWS_REGION;
const basePath = isLambda
  ? ""
  : path.join(__dirname, "../../../layers/common/nodejs");

const logger = require(isLambda
  ? "utils/logger"
  : path.join(basePath, "utils/logger"));

const createKnowledgeBase = require(isLambda
  ? "aws/bedrock/create-knowledge-base"
  : path.join(basePath, "aws/bedrock/create-knowledge-base"));

module.exports = async (chatBotId) => {
  logger.info("Creating knowledge base for chatbot:", chatBotId);

  try {
    const params = {
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
    };

    const result = await createKnowledgeBase(params);

    if (result.isError) {
      logger.error("Error creating knowledge base:", {
        error: result.error,
      });
      return {
        isError: true,
        error: result.error,
      };
    }
    logger.info("Knowledge base created:", result.data);

    const knowledgeBaseId = result.data.knowledgeBase.knowledgeBaseId;

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
