const path = require("path");
const isLambda = !!process.env.AWS_REGION;
const basePath = isLambda
  ? ""
  : path.join(__dirname, "../../../layers/common/nodejs");

const logger = require(isLambda
  ? "utils/logger"
  : path.join(basePath, "utils/logger"));

const putDBItem = require(isLambda
  ? "aws/dynamo-db/put-db-item"
  : path.join(basePath, "aws/dynamo-db/put-db-item"));

const addJobDetails = async (
  jobId,
  createdBy,
  status,
  knowledgeBaseId,
  dataSourceId,
  dataSourceType
) => {
  logger.info("Adding job details", {
    jobId,
    createdBy,
    status,
    knowledgeBaseId,
    dataSourceId,
    dataSourceType,
  });

  try {
    const params = {
      TableName: process.env.INGESTION_JOB_TABLE_NAME,
      Item: {
        jobId,
        knowledgeBaseId,
        dataSourceId,
        dataSourceType,
        createdBy,
        createdAt: new Date().toISOString(),
        status,
      },
    };

    const result = await putDBItem(params);
    if (result.isError) {
      logger.error("Error adding job details", {
        error: result.error,
      });
      return {
        isError: true,
        error: result.error,
      };
    }
    logger.info("Job details added", {
      jobId,
      createdBy,
      status,
      knowledgeBaseId,
      dataSourceId,
      dataSourceType,
    });
    return {
      isError: false,
      message: "Job details added",
      jobId,
      createdBy,
    };
  } catch (error) {
    logger.error("Error adding job details", {
      error: error.message,
      stack: error.stack,
    });
    return {
      isError: true,
      error: error.message,
    };
  }
};

module.exports = addJobDetails;
