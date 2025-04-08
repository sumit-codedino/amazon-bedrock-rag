const {
  BedrockAgentClient,
  ListDataSourcesCommand,
  GetDataSourceCommand,
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
  defaultMeta: { service: "rag-app", function: "listDataSources" },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});

const client = new BedrockAgentClient({
  region: process.env.AWS_REGION,
});

exports.handler = middy()
  .use(httpJsonBodyParser())
  .use(httpHeaderNormalizer())
  .handler(async (event, context) => {
    const requestId = context.awsRequestId;
    logger.info("ListDataSources Lambda invoked", {
      requestId,
      event: {
        path: event.path,
        httpMethod: event.httpMethod,
        headers: event.headers,
      },
    });

    try {
      logger.info("Listing all data sources", {
        requestId,
        knowledgeBaseId: process.env.KNOWLEDGE_BASE_ID,
      });

      // First, list all data sources
      const listCommand = new ListDataSourcesCommand({
        knowledgeBaseId: process.env.KNOWLEDGE_BASE_ID,
      });
      const listResponse = await client.send(listCommand);

      logger.info("Retrieved data sources list", {
        requestId,
        count: listResponse.dataSourceSummaries?.length || 0,
      });

      // For each data source, get detailed information including URLs
      const dataSourcesWithDetails = await Promise.all(
        listResponse.dataSourceSummaries.map(async (ds) => {
          const getCommand = new GetDataSourceCommand({
            knowledgeBaseId: process.env.KNOWLEDGE_BASE_ID,
            dataSourceId: ds.dataSourceId,
          });
          const detailResponse = await client.send(getCommand);

          // Extract URLs based on data source type
          let urls = [];
          if (ds.type === "WEB") {
            urls =
              detailResponse.dataSourceConfiguration?.webConfiguration?.sourceConfiguration?.urlConfiguration?.seedUrls?.map(
                (urlObj) => urlObj.url
              ) || [];
          } else if (ds.type === "S3") {
            urls = [
              `s3://${
                detailResponse.dataSourceConfiguration?.s3Configuration?.bucketArn?.split(
                  ":::"
                )[1]
              }${
                detailResponse.dataSourceConfiguration?.s3Configuration
                  ?.inclusionPrefixes?.[0] || ""
              }`,
            ];
          }

          return {
            dataSourceId: ds.dataSourceId,
            name: ds.name,
            type: ds.type,
            status: ds.status,
            urls: urls,
            description: ds.description,
            createdAt: ds.createdAt,
            updatedAt: ds.updatedAt,
          };
        })
      );

      logger.info("Retrieved detailed information for all data sources", {
        requestId,
        count: dataSourcesWithDetails.length,
      });

      return {
        statusCode: 200,
        body: JSON.stringify({
          dataSources: dataSourcesWithDetails,
        }),
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      };
    } catch (err) {
      logger.error("Error listing data sources", {
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
