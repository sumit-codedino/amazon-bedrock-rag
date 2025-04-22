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
 * Creates a web data source for knowledge base ingestion
 * @param {string} userId - The ID of the user
 * @param {string} knowledgeBaseId - The ID of the knowledge base
 * @param {string} url - The URL to crawl
 * @returns {Promise<Object>} The result of the data source creation
 */
const createWebDataSource = async (userId, knowledgeBaseId, url) => {
  logger.info("Creating Web data source", { userId, knowledgeBaseId, url });

  try {
    const params = {
      knowledgeBaseId,
      name: `Web Data Source for ${userId}`,
      description: `Web Data Source for ${userId}`,
      dataSourceConfiguration: {
        type: "WEB",
        webConfiguration: {
          crawlerConfiguration: {
            crawlerLimits: {
              maxPages: 10, // Maximum number of pages to crawl
              rateLimit: 1, // Rate limit in pages per second
            },
            exclusionFilters: [], // URLs to exclude from crawling
            inclusionFilters: [], // URLs to include in crawling
            scope: "SUBDOMAINS", // Crawl scope: SUBDOMAINS, HOST, or CUSTOM
            userAgent: "Amazon Bedrock Web Crawler", // User agent for crawling
            userAgentHeader: "User-Agent", // Header name for user agent
          },
          sourceConfiguration: {
            urlConfiguration: {
              seedUrls: [
                {
                  url,
                },
              ],
            },
          },
        },
      },
      vectorIngestionConfiguration: {
        chunkingConfiguration: {
          chunkingStrategy: "FIXED_SIZE",
          fixedSizeChunkingConfiguration: {
            maxTokens: 1000, // Maximum tokens per chunk
            overlapPercentage: 20, // Percentage of overlap between chunks
          },
        },
        parsingConfiguration: {
          parsingStrategy: "BEDROCK_FOUNDATION_MODEL",
          bedrockFoundationModelConfiguration: {
            modelArn: process.env.BEDROCK_MODEL_ARN,
            parsingModality: "TEXT",
            parsingPrompt: {
              parsingPromptText:
                "Extract relevant information from the following text:",
            },
          },
        },
      },
    };

    logger.debug("Creating web data source with params:", { params });

    const result = await createDataSource(params);

    if (result.isError) {
      logger.error("Error creating Web data source:", {
        error: result.error,
        params,
      });
      return {
        isError: true,
        error: result.error,
      };
    }

    logger.info("Web data source created successfully", {
      dataSourceId: result.dataSource.dataSourceId,
    });

    return {
      isError: false,
      webDataSourceId: result.dataSource.dataSourceId,
    };
  } catch (error) {
    logger.error("Error creating Web data source:", {
      error: error.message,
      stack: error.stack,
    });
    return {
      isError: true,
      error: error.message,
    };
  }
};

module.exports = createWebDataSource;
