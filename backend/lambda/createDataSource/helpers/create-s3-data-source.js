const path = require("path");

const isLambda = !!process.env.AWS_REGION;
const basePath = isLambda
  ? ""
  : path.join(__dirname, "../../../layers/common/nodejs");

const logger = require(isLambda
  ? "utils/logger"
  : path.join(basePath, "utils/logger"));

const createDataSource = require(isLambda
  ? "aws/bedrock/create-data-source"
  : path.join(basePath, "aws/bedrock/create-data-source"));

/**
 * Creates an S3 data source for knowledge base ingestion
 * @param {string} userId - The ID of the user
 * @param {string} knowledgeBaseId - The ID of the knowledge base
 * @param {string} bucketName - The name of the S3 bucket
 * @returns {Promise<Object>} The result of the data source creation
 */
const createS3DataSource = async (userId, knowledgeBaseId, bucketName) => {
  logger.info("Creating S3 data source", {
    userId,
    knowledgeBaseId,
    bucketName,
  });

  try {
    // Sanitize userId to match the required pattern
    const sanitizedUserId = userId.replace(/[^a-zA-Z0-9_-]/g, "_");

    const params = {
      knowledgeBaseId,
      name: `s3_datasource_${sanitizedUserId}`,
      description: `S3 Data Source for ${userId}`,
      dataSourceConfiguration: {
        type: "S3",
        s3Configuration: {
          bucketArn: `arn:aws:s3:::${bucketName}`,
          bucketOwnerAccountId: process.env.AWS_ACCOUNT_ID,
          inclusionPrefixes: [`${userId}/`],
        },
      },
      vectorIngestionConfiguration: {
        customTransformationConfiguration: {
          intermediateStorage: {
            s3Location: {
              uri: `s3://${process.env.INTERMEDIATE_BUCKET_NAME}/${userId}/`,
            },
          },
          transformations: [
            {
              transformationFunction: {
                transformationLambdaConfiguration: {
                  lambdaArn: process.env.TRANSFORM_DOCUMENTS_LAMBDA_ARN,
                },
              },
              stepToApply: "POST_CHUNKING",
            },
          ],
        },
        chunkingConfiguration: {
          chunkingStrategy: "FIXED_SIZE",
          fixedSizeChunkingConfiguration: {
            maxTokens: 1000, // Optimal for most LLMs
            overlapPercentage: 20, // Higher overlap for better context retention
          },
        },
        // parsingConfiguration: {
        //   // ParsingConfiguration
        //   parsingStrategy:
        //     "BEDROCK_FOUNDATION_MODEL" || "BEDROCK_DATA_AUTOMATION", // required
        //   bedrockFoundationModelConfiguration: {
        //     // BedrockFoundationModelConfiguration
        //     modelArn: "STRING_VALUE", // required
        //     parsingPrompt: {
        //       // ParsingPrompt
        //       parsingPromptText: "STRING_VALUE", // required
        //     },
        //     parsingModality: "MULTIMODAL",
        //   },
        //   bedrockDataAutomationConfiguration: {
        //     // BedrockDataAutomationConfiguration
        //     parsingModality: "MULTIMODAL",
        //   },
        // },
      },
    };

    logger.debug("Creating S3 data source with params:", { params });

    const result = await createDataSource(params);

    if (result.isError) {
      logger.error("Error creating S3 data source:", {
        error: result.error,
        params,
      });
      return {
        isError: true,
        error: result.error,
      };
    }

    logger.info("S3 data source created successfully", {
      dataSourceId: result.data.dataSource.dataSourceId,
    });

    return {
      isError: false,
      s3DataSourceId: result.data.dataSource.dataSourceId,
    };
  } catch (error) {
    logger.error("Error creating S3 data source:", {
      error: error.message,
      stack: error.stack,
    });
    return {
      isError: true,
      error: error.message,
    };
  }
};

module.exports = createS3DataSource;
