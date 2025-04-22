const path = require("path");
const isLambda = !!process.env.AWS_REGION;
const basePath = isLambda
  ? ""
  : path.join(__dirname, "../../../layers/common/nodejs");

const logger = require(isLambda
  ? "utils/logger"
  : path.join(basePath, "utils/logger"));

const startIngestion = async (event) => {
  logger.info("Received event:", event);

  try {
    const body = JSON.parse(event.body);
    const { knowledgeBaseId, dataSourceId } = body;

    if (!knowledgeBaseId || !dataSourceId) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Knowledge base ID and data source ID are required",
        }),
      };
    }

    const ingestionJobResult = await startIngestionJob(
      knowledgeBaseId,
      dataSourceId
    );

    if (ingestionJobResult.isError) {
      logger.error("Error starting ingestion job:");
      return {
        statusCode: 500,
        body: JSON.stringify({
          message: "Error starting ingestion job",
          error: ingestionJobResult.error,
        }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(ingestionJobResult),
    };
  } catch (error) {
    logger.error("Error starting ingestion:", {
      error: error.message,
      stack: error.stack,
    });
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error starting ingestion",
        error: error.message,
      }),
    };
  }
};

module.exports = {
  startIngestion,
};
