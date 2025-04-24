const path = require("path");

const isLambda = !!process.env.AWS_REGION;
const basePath = isLambda
  ? ""
  : path.join(__dirname, "../../../layers/common/nodejs");

const logger = require(isLambda
  ? "utils/logger"
  : path.join(basePath, "utils/logger"));

const getUserDB = require("./helpers/get-user-details");

const getUserDetails = async (event) => {
  logger.info("Received event:", event);

  try {
    const userId = event.queryStringParameters.userId;

    if (!userId) {
      logger.error("User ID is required");
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "User ID is required" }),
      };
    }

    const userDetails = await getUserDB(userId);
    if (userDetails.isError || !userDetails.Item) {
      logger.error("Error getting user details:", userDetails.error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Error getting user details" }),
      };
    }

    const { knowledgeBaseId, s3DataSourceId, webCrawlerDataSourceId } =
      userDetails.Item;

    return {
      statusCode: 200,
      body: JSON.stringify({
        knowledgeBaseId,
        s3DataSourceId,
        webCrawlerDataSourceId,
      }),
    };
  } catch (error) {
    logger.error("Error in getUserDetails:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Error in getUserDetails" }),
    };
  }
};

module.exports = getUserDetails;
