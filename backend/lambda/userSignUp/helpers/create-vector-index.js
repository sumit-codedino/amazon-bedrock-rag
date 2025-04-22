const { defaultProvider } = require("@aws-sdk/credential-provider-node");
const { Client } = require("@opensearch-project/opensearch");
const { AwsSigv4Signer } = require("@opensearch-project/opensearch/aws");
const path = require("path");

const isLambda = !!process.env.AWS_REGION;
const basePath = isLambda
  ? ""
  : path.join(__dirname, "../../../layers/common/nodejs");

const logger = require(isLambda
  ? "utils/logger"
  : path.join(basePath, "utils/logger"));

const createVectorIndex = async (userId) => {
  try {
    // Use the exact collection name from the policy
    const indexName = `${userId}-index`.toLowerCase();
    const collectionEndpoint = `https://${process.env.OPEN_SEARCH_SERVICE_COLLECTION_ID}.us-east-1.aoss.amazonaws.com`;

    // Create OpenSearch client with AWS SigV4 signing
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
      requestTimeout: 30000,
      connectionClass: "http",
    });

    // Check if index exists
    const indexExists = await client.indices.exists({ index: indexName });

    if (!indexExists.body) {
      const indexBody = {
        settings: {
          index: {
            knn: true,
            "knn.algo_param.ef_search": 512,
          },
        },
        mappings: {
          properties: {
            embedding: {
              type: "knn_vector",
              dimension: 1024, // Updated to match Amazon Titan Embed Text v2
              method: {
                name: "hnsw",
                engine: "faiss",
                parameters: {
                  encoder: {
                    name: "sq",
                    parameters: {
                      type: "fp16",
                      clip: true,
                    },
                  },
                },
                space_type: "l2",
              },
            },
            text: {
              type: "text",
            },
            metadata: {
              type: "text",
            },
            chatBotId: {
              type: "text",
            },
            source: {
              type: "text",
            },
            timestamp: {
              type: "date",
            },
          },
        },
      };

      logger.info(
        "Creating index with body:",
        JSON.stringify(indexBody, null, 2)
      );

      const response = await client.indices.create({
        index: indexName,
        body: indexBody,
      });

      logger.info("Vector index created successfully:", {
        indexName,
        response: response.body,
      });

      return {
        isError: false,
        indexName,
        message: "Vector index created successfully",
      };
    } else {
      logger.info("Vector index already exists:", { indexName });
      return {
        isError: false,
        indexName,
        message: "Vector index already exists",
      };
    }
  } catch (error) {
    logger.error("Error creating vector index:", {
      error: error.message,
      stack: error.stack,
      details: error.details || "No additional details",
    });

    return {
      isError: true,
      message: error.message,
      details: error.details || "No additional details",
    };
  }
};

module.exports = createVectorIndex;
