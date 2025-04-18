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

const addKnowledgeBaseToDB = async (userId, knowledgeBaseId) => {
  logger.info("Adding knowledge base to DynamoDB");

  try {
    const params = {
      TableName: process.env.KNOWLEDGE_BASE_TABLE_NAME,
      Item: {
        knowledgeBaseId,
        createdBy: userId,
        createdAt: new Date().toISOString(),
      },
    };

    logger.info("Knowledge base params:", { params });

    const result = await putDBItem(params);

    if (result.isError) {
      logger.error("Error adding knowledge base to DynamoDB:", {
        error: result.error,
      });
      return {
        isError: true,
        error: result.error,
      };
    }

    logger.info("Knowledge base added to DynamoDB:");

    return {
      isError: false,
      message: "Knowledge base added to DynamoDB",
    };
  } catch (error) {
    logger.error("Error adding knowledge base to DynamoDB:", {
      error: error.message,
      stack: error.stack,
    });

    return {
      isError: true,
      error: error.message,
    };
  }
};

module.exports = addKnowledgeBaseToDB;
