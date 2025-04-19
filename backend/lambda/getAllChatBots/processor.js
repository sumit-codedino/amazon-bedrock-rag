const path = require("path");

const isLambda = !!process.env.AWS_REGION;
const basePath = isLambda
  ? ""
  : path.join(__dirname, "../../../layers/common/nodejs");

const logger = require(isLambda
  ? "utils/logger"
  : path.join(basePath, "utils/logger"));
const queryUserChatbot = require(isLambda
  ? "helpers/query-user-chatbot"
  : path.join(basePath, "helpers/query-user-chatbot"));

const getAllChatBots = async (event) => {
  logger.info("Received event:", event);

  try {
    const body = JSON.parse(event.body);
    const userId = body.userId;

    if (!userId) {
      logger.error("User ID is required");
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "User ID is required" }),
      };
    }

    const userChatbotResult = await queryUserChatbot(userId);
    if (userChatbotResult.isError) {
      throw new Error(userChatbotResult.error);
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
      };
    });

    logger.info("Chatbot details:", chatBotDetails);

    return {
      statusCode: 200,
      body: JSON.stringify({ chatBotDetails }),
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

module.exports = getAllChatBots;
