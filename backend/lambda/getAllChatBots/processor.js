const path = require("path");

const isLambda = !!process.env.AWS_REGION;
const basePath = isLambda
  ? ""
  : path.join(__dirname, "../../../layers/common/nodejs");

const logger = require(isLambda
  ? "utils/logger"
  : path.join(basePath, "utils/logger"));

const queryUserChatbot = require("./helpers/query-user-chatbot");
const getUserDB = require("./helpers/get-user-details");

const getAllChatBots = async (event) => {
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
    if (userDetails.isError) {
      logger.error("Error getting user details:", userDetails.error);
      return {
        statusCode: 500,
        body: JSON.stringify({ message: "Internal server error" }),
      };
    }

    if (!userDetails.Item) {
      logger.error("User details not found");
      return {
        statusCode: 200,
        body: JSON.stringify({
          chatBotDetails: [],
          knowledgeBaseId: null,
          s3DataSourceId: null,
          webDataSourceId: null,
        }),
      };
    }

    const { knowledgeBaseId, s3DataSourceId, webDataSourceId } =
      userDetails.Item;

    logger.info("User details:", userDetails.Item);
    const userChatbotResult = await queryUserChatbot(userId);
    if (userChatbotResult.isError) {
      logger.error("Error getting user chatbot:", userChatbotResult.error);
      return {
        statusCode: 500,
        body: JSON.stringify({ message: "Internal server error" }),
      };
    }

    if (userChatbotResult.Items.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({ chatBotDetails: [] }),
      };
    }

    const chatBotDetails = userChatbotResult.Items.map((item) => {
      return {
        chatBotId: item.chatBotId,
        chatBotName: item.chatBotName,
        chatBotDescription: item.chatBotDescription,
        dataSources: item.dataSources || [],
        s3DataSourceId: item.s3DataSourceId || null,
        webPageDataSourceId: item.webPageDataSourceId || null,
        knowledgeBaseId: item.knowledgeBaseId,
        lastUpdatedAt: item.lastUpdatedAt,
      };
    });

    logger.info("Chatbot details:", chatBotDetails);

    return {
      statusCode: 200,
      body: JSON.stringify({
        chatBotDetails,
        knowledgeBaseId,
        s3DataSourceId,
        webDataSourceId,
      }),
    };
  } catch (error) {
    logger.error("Error getting all chatbots:", {
      error: error.message,
      stack: error.stack,
    });
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal server error" }),
    };
  }
};

module.exports = {
  getAllChatBots,
};
