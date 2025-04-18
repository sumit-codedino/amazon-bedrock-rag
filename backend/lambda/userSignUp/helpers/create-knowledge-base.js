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
    const client = new Client({
      ...AwsSigv4Signer({
        region: process.env.AWS_REGION || "us-east-1",
        service: "aoss",
        getCredentials: () => {
          const credentialsProvider = defaultProvider();
          return credentialsProvider();
        },
      }),
      node: "https://xl54vdjv2ith3i43w4rc.us-east-1.aoss.amazonaws.com",
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

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const createKnowledgeBaseWithRetry = async (params, maxRetries = 3) => {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.info(`Attempt ${attempt} to create knowledge base`);
      const result = await createKnowledgeBase(params);

      if (result.isError) {
        throw new Error(result.error);
      }

      return result;
    } catch (error) {
      lastError = error;
      logger.error(`Attempt ${attempt} failed:`, {
        error: error.message,
        stack: error.stack,
      });

      if (attempt < maxRetries) {
        logger.info(`Retrying in 5 seconds... (${attempt}/${maxRetries})`);
        await sleep(5000); // 5 second delay
      }
    }
  }

  throw lastError;
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
          collectionArn:
            "arn:aws:aoss:us-east-1:905418372486:collection/xl54vdjv2ith3i43w4rc",
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
