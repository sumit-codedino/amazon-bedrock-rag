const path = require("path");
const isLambda = !!process.env.AWS_REGION;
const basePath = isLambda
  ? ""
  : path.join(__dirname, "../../../layers/common/nodejs");

const logger = require(isLambda
  ? "utils/logger"
  : path.join(basePath, "utils/logger"));

const getUserDetails = require("./helpers/get-user-details");
const startIngestionJob = require("./helpers/start-ingestion-job");
const addJobDetails = require("./helpers/add-job-details");
const startIngestion = async (event) => {
  logger.info("Received event:", event);

  try {
    const body = JSON.parse(event.body);
    const { userId, dataSourceId, dataSourceType } = body;

    if (!userId || !dataSourceId) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "User ID and data source ID are required",
        }),
      };
    }

    const userDetails = await getUserDetails(userId);

    if (userDetails.isError) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          message: "Error getting user details",
          error: userDetails.error,
        }),
      };
    }

    if (!userDetails.Item && !userDetails.Item.knowledgeBaseId) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "User does not have a knowledge base ID",
        }),
      };
    }

    const knowledgeBaseId = userDetails.Item.knowledgeBaseId;

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

    logger.info("Ingestion job started", { ingestionJobResult });

    const addJobDetailsResult = await addJobDetails(
      ingestionJobResult.jobId,
      userId,
      "STARTED",
      knowledgeBaseId,
      dataSourceId,
      dataSourceType
    );

    if (addJobDetailsResult.isError) {
      logger.error("Error adding job details");
      return {
        statusCode: 500,
        body: JSON.stringify({
          message: "Error adding job details",
          error: addJobDetailsResult.error,
        }),
      };
    }

    logger.info("Job details added", { addJobDetailsResult });

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Ingestion job started",
        jobId: ingestionJobResult.jobId,
      }),
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
