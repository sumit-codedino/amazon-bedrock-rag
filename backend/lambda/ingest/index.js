const {
  BedrockAgentClient,
  StartIngestionJobCommand,
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
  defaultMeta: { service: "rag-app", function: "ingest" },
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
    logger.info("Ingest Lambda invoked", {
      requestId,
      event: {
        path: event.path,
        httpMethod: event.httpMethod,
        headers: event.headers,
      },
    });

    try {
      const { dataSourceId } = event.body;
      logger.info("Starting ingestion job", {
        requestId,
        dataSourceId,
        knowledgeBaseId: process.env.KNOWLEDGE_BASE_ID,
      });

      const input = {
        knowledgeBaseId: process.env.KNOWLEDGE_BASE_ID,
        dataSourceId: dataSourceId,
      };

      logger.debug("Bedrock request configuration", {
        requestId,
        input,
      });

      const command = new StartIngestionJobCommand(input);
      const response = await client.send(command);

      logger.info("Ingestion job started successfully", {
        requestId,
        ingestionJobId: response.ingestionJobId,
        status: response.status,
      });

      return {
        statusCode: 200,
        body: JSON.stringify({
          ingestionJobId: response.ingestionJobId,
          status: response.status,
        }),
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      };
    } catch (err) {
      logger.error("Error starting ingestion job", {
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
