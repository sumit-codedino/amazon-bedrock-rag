const path = require("path");
const { defaultProvider } = require("@aws-sdk/credential-provider-node");
const { Client } = require("@opensearch-project/opensearch");
const { AwsSigv4Signer } = require("@opensearch-project/opensearch/aws");

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

const checkIndexExists = async (indexName) => {
  try {
    const collectionEndpoint = `https://${process.env.OPEN_SEARCH_SERVICE_COLLECTION_ID}.us-east-1.aoss.amazonaws.com`;
    const client = new Client({
      ...AwsSigv4Signer({
        region: process.env.AWS_REGION || "us-east-1",
        service: "aoss",
        getCredentials: () => {
          const credentialsProvider = defaultProvider();
          return credentialsProvider();
        },
      }),
      node: collectionEndpoint,
      ssl: {
        rejectUnauthorized: false,
      },
    });

    const response = await client.indices.exists({ index: indexName });
    return response.body;
  } catch (error) {
    logger.error("Error checking index existence:", {
      error: error.message,
      stack: error.stack,
    });
    return false;
  }
};

const createKnowledgeBaseWithRetry = async (params, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    const result = await createKnowledgeBase(params);
    if (!result.isError) {
      return result;
    }
    logger.info(
      `Retry attempt ${i + 1} failed, waiting 3 seconds before next attempt...`
    );
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }
  return { isError: true, error: "Failed to create knowledge base" };
};

module.exports = async (userId, indexName) => {
  logger.info("Creating knowledge base for user:", userId);

  try {
    // Check if index exists first
    const indexExists = await checkIndexExists(indexName);
    if (!indexExists) {
      logger.error("Index does not exist:", { indexName });
      return {
        isError: true,
        error: "Vector index does not exist. Please create the index first.",
      };
    }

    logger.info("Index exists:", { indexName });

    const params = {
      name: `knowledge-base-${userId}`,
      description: "Knowledge Base for " + userId,
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
          collectionArn: `arn:aws:aoss:${
            process.env.AWS_REGION || "us-east-1"
          }:${process.env.AWS_ACCOUNT_ID}:collection/${
            process.env.OPEN_SEARCH_SERVICE_COLLECTION_ID
          }`,
          vectorIndexName: indexName,
          fieldMapping: {
            vectorField: "embedding",
            textField: "text",
            metadataField: "metadata",
          },
        },
      },
    };

    logger.info("Params:", { params });

    const result = await createKnowledgeBaseWithRetry(params);

    if (result.isError) {
      logger.error("Error creating knowledge base:", {
        error: result.error,
      });
      return {
        isError: true,
        error: result.error,
      };
    }

    logger.info("Knowledge base created:", {
      knowledgeBaseId: result.data.knowledgeBase.knowledgeBaseId,
    });

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
