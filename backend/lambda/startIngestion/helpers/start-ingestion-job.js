const {
  BedrockAgentClient,
  StartIngestionJobCommand,
} = require("@aws-sdk/client-bedrock-agent");
const path = require("path");
const isLambda = !!process.env.AWS_REGION;
const basePath = isLambda
  ? ""
  : path.join(__dirname, "../../../layers/common/nodejs");

const logger = require(isLambda
  ? "utils/logger"
  : path.join(basePath, "utils/logger"));

const startIngestionJob = async (knowledgeBaseId, dataSourceId) => {
  logger.info("Starting ingestion job", { knowledgeBaseId, dataSourceId });

  try {
    const client = new BedrockAgentClient({ region: process.env.AWS_REGION });
    const command = new StartIngestionJobCommand({
      knowledgeBaseId,
      dataSourceId,
    });

    const response = await client.send(command);
    logger.info("Ingestion job started", { response });
    return {
      isError: false,
      jobId: response.ingestionJob.ingestionJobId,
    };
  } catch (error) {
    logger.error("Error starting ingestion job:", {
      error: error.message,
      stack: error.stack,
    });
    return { isError: true, error: error.message };
  }
};

module.exports = startIngestionJob;
