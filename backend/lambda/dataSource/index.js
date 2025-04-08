const {
  BedrockAgentClient,
  CreateDataSourceCommand,
} = require("@aws-sdk/client-bedrock-agent");
const winston = require("winston");
const middy = require("@middy/core");
const httpJsonBodyParser = require("@middy/http-json-body-parser");
const httpHeaderNormalizer = require("@middy/http-header-normalizer");

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: "rag-app", function: "dataSource" },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});

const client = new BedrockAgentClient({ region: process.env.AWS_REGION });

exports.handler = middy()
  .use(httpJsonBodyParser())
  .use(httpHeaderNormalizer())
  .handler(async (event, context) => {
    const requestId = context.awsRequestId;
    logger.info("DataSource Lambda invoked", {
      requestId,
      event: {
        path: event.path,
        httpMethod: event.httpMethod,
        headers: event.headers,
      },
    });

    try {
      const { name, description, type, bucketName, prefix, urls } = event.body;
      logger.info("Processing data source creation", {
        requestId,
        name,
        type,
        bucketName,
        prefix,
        urlCount: urls?.length || 0,
      });

      const input = {
        knowledgeBaseId: process.env.KNOWLEDGE_BASE_ID,
        name: name,
        description: description,
        dataSourceConfiguration: {
          type: type,
          s3Configuration:
            type === "S3"
              ? {
                  bucketArn: `arn:aws:s3:::${bucketName}`,
                  inclusionPrefixes: prefix ? [prefix] : undefined,
                }
              : undefined,
          webConfiguration:
            type === "WEB"
              ? {
                  sourceConfiguration: {
                    urlConfiguration: {
                      seedUrls: urls.map((url) => ({ url })),
                    },
                  },
                  crawlerConfiguration: {
                    crawlerLimits: {
                      rateLimit: 10,
                      maxPages: 10,
                    },
                    inclusionFilters: urls.map((url) => {
                      // Extract domain and create pattern for up to 3 levels deep
                      const domain = new URL(url).hostname;
                      return `https://${domain}/[^/]+(/[^/]+)?(/[^/]+)?$`;
                    }),
                    exclusionFilters: [
                      // File extensions (non-text content)
                      ".*\\.pdf$",
                      ".*\\.jpg$",
                      ".*\\.jpeg$",
                      ".*\\.png$",
                      ".*\\.gif$",
                      ".*\\.zip$",
                      ".*\\.rar$",
                      ".*\\.doc$",
                      ".*\\.docx$",
                      ".*\\.xls$",
                      ".*\\.xlsx$",
                      ".*\\.ppt$",
                      ".*\\.pptx$",
                      // Non-content pages
                      ".*/tag/.*",
                      ".*/category/.*",
                      ".*/author/.*",
                      ".*/feed/.*",
                      ".*/wp-json/.*",
                      // Authentication pages
                      ".*/login.*",
                      ".*/signup.*",
                      ".*/register.*",
                      // Shopping/transaction pages
                      ".*/cart.*",
                      ".*/checkout.*",
                      ".*/payment.*",
                      // Social media and sharing
                      ".*/share/.*",
                      ".*/like/.*",
                      ".*/comment/.*",
                      // Admin and backend (more specific)
                      ".*/wp-admin/.*",
                      ".*/admin/dashboard.*",
                      ".*/admin/settings.*",
                      // Specific API endpoints
                      ".*/api/v1/.*",
                      ".*/graphql$",
                      // Specific media directories
                      ".*/media/images/.*",
                      ".*/assets/images/.*",
                      ".*/static/images/.*",
                      ".*/uploads/images/.*",
                    ],
                    scope: "HOST_ONLY",
                    userAgent:
                      "Mozilla/5.0 (compatible; AWS-Bedrock-Crawler/1.0)",
                  },
                }
              : undefined,
        },
      };

      logger.debug("Bedrock request configuration", {
        requestId,
        input: {
          ...input,
          dataSourceConfiguration: {
            type: input.dataSourceConfiguration.type,
            s3Configuration: input.dataSourceConfiguration.s3Configuration
              ? {
                  bucketArn:
                    input.dataSourceConfiguration.s3Configuration.bucketArn,
                  inclusionPrefixes:
                    input.dataSourceConfiguration.s3Configuration
                      .inclusionPrefixes,
                }
              : undefined,
            webConfiguration: input.dataSourceConfiguration.webConfiguration
              ? {
                  sourceConfiguration: {
                    urlConfiguration: {
                      seedUrls:
                        input.dataSourceConfiguration.webConfiguration
                          .sourceConfiguration.urlConfiguration.seedUrls,
                    },
                  },
                  crawlerConfiguration: {
                    rateLimit:
                      input.dataSourceConfiguration.webConfiguration
                        .crawlerConfiguration.rateLimit,
                    scope:
                      input.dataSourceConfiguration.webConfiguration
                        .crawlerConfiguration.scope,
                  },
                }
              : undefined,
          },
        },
      });

      const command = new CreateDataSourceCommand(input);
      const response = await client.send(command);

      logger.info("Data source created successfully", {
        requestId,
        dataSourceId: response.dataSource.dataSourceId,
        status: response.dataSource.status,
      });

      return {
        statusCode: 200,
        body: JSON.stringify({
          dataSourceId: response.dataSource.dataSourceId,
          status: response.dataSource.status,
        }),
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      };
    } catch (err) {
      logger.error("Error creating data source", {
        requestId,
        error: {
          message: err.message,
          name: err.name,
          stack: err.stack,
        },
        event: {
          body: event.body,
          path: event.path,
        },
      });

      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "Server side error: please check function logs",
        }),
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      };
    }
  });
