const {
  BedrockAgentRuntimeClient,
  RetrieveAndGenerateCommand,
} = require("@aws-sdk/client-bedrock-agent-runtime");
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
  defaultMeta: { service: "rag-app", function: "query" },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});

const client = new BedrockAgentRuntimeClient({
  region: process.env.AWS_REGION,
});

exports.handler = middy()
  .use(httpJsonBodyParser())
  .use(httpHeaderNormalizer())
  .handler(async (event, context) => {
    const requestId = context.awsRequestId;
    logger.info("Query Lambda invoked", {
      requestId,
      event: {
        path: event.path,
        httpMethod: event.httpMethod,
        headers: event.headers,
      },
    });

    try {
      const { question, requestSessionId, modelId } = event.body;

      logger.info("Processing query", {
        requestId,
        question,
        requestSessionId: requestSessionId || "none (new session)",
        modelId: modelId || "default",
        knowledgeBaseId: process.env.KNOWLEDGE_BASE_ID,
      });

      const input = {
        sessionId: requestSessionId,
        input: {
          text: question,
        },
        retrieveAndGenerateConfiguration: {
          type: "KNOWLEDGE_BASE",
          knowledgeBaseConfiguration: {
            knowledgeBaseId: process.env.KNOWLEDGE_BASE_ID,
            modelArn: `arn:aws:bedrock:${process.env.AWS_REGION}:${process.env.ACCOUNT_ID}:inference-profile/us.meta.llama3-3-70b-instruct-v1:0`,
          },
        },
      };

      const command = new RetrieveAndGenerateCommand(input);
      const response = await client.send(command);

      logger.info("Received response from Bedrock", {
        requestId,
        responseLength: response.output?.text?.length,
        hasCitations: !!response.citations?.length,
        sessionId: response.sessionId,
        isNewSession: !requestSessionId,
      });

      if (response.citations?.length) {
        logger.debug("Citations details", {
          requestId,
          citations: response.citations.map((c) => ({
            generatedResponsePart: c.generatedResponsePart,
            retrievedReferences: c.retrievedReferences?.map((r) => ({
              location: r.location,
            })),
          })),
        });
      }

      const location = response.citations[0]?.retrievedReferences[0]?.location;
      const sourceType = location?.type;

      logger.info("Determining response source type", {
        requestId,
        sourceType,
        location,
      });

      const result = makeResults(
        200,
        response.output.text,
        sourceType === "S3"
          ? location?.s3Location?.uri
          : sourceType === "WEB"
          ? location?.webLocation?.url
          : null,
        response.sessionId
      );

      logger.info("Query processing completed successfully", {
        requestId,
        statusCode: result.statusCode,
        responseLength: result.body.length,
        sessionId: response.sessionId,
      });

      return result;
    } catch (err) {
      logger.error("Error processing query", {
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

      // Handle specific error cases
      if (err.name === "AccessDeniedException" || err.statusCode === 403) {
        return makeResults(
          403,
          "Access denied to Bedrock model. Please check your AWS permissions and model access.",
          null,
          null
        );
      }

      return makeResults(
        500,
        "Server side error: please check function logs",
        null,
        null
      );
    }
  });

function makeResults(
  statusCode,
  responseText,
  citationText,
  responseSessionId
) {
  return {
    statusCode: statusCode,
    body: JSON.stringify({
      response: responseText,
      citation: citationText,
      sessionId: responseSessionId,
      message: responseSessionId
        ? "Use this sessionId in subsequent queries to maintain context"
        : "No sessionId available - check function logs for error details",
    }),
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
  };
}
