const path = require("path");

const isLambda = !!process.env.AWS_REGION;
const basePath = isLambda
  ? ""
  : path.join(__dirname, "../../../layers/common/nodejs");

const logger = require(isLambda
  ? "utils/logger"
  : path.join(basePath, "utils/logger"));

const generateSignedUrls = require("./helpers/generate-signed-url");
const getChatbotDetails = require("./helpers/get-chatbot-details");

const processor = async (event) => {
  const response = {
    isError: true,
    error: "An unexpected error occurred",
  };

  try {
    logger.info("Processing generate signed URL request", { event });

    if (!event.body) {
      logger.error("Missing request body");
      response.error = "Missing request body";
      return response;
    }

    const eventBody = event.body;
    const parsedEventBody = JSON.parse(eventBody);
    const { fileName, chatBotId } = parsedEventBody;

    if (!fileName || !chatBotId) {
      logger.error("Missing required parameters", { fileName, chatBotId });
      response.error = "Missing required parameters: fileName and chatBotId";
      return response;
    }

    logger.info("Fetching chatbot details", { chatBotId });
    const chatbotDetails = await getChatbotDetails(chatBotId);

    if (chatbotDetails.isError) {
      logger.error("Error getting chatbot details", {
        error: chatbotDetails.error,
        chatBotId,
      });
      response.error = chatbotDetails.error || "Failed to get chatbot details";
      return response;
    }

    if (!chatbotDetails.Item) {
      logger.error("Chatbot not found", { chatBotId });
      response.error = "Chatbot not found";
      return response;
    }

    const { createdBy } = chatbotDetails.Item;
    logger.info("Generating signed URL", { fileName, chatBotId, createdBy });

    const signedUrlResponse = await generateSignedUrls(
      fileName,
      chatBotId,
      createdBy
    );

    if (signedUrlResponse.isError) {
      logger.error("Error generating signed URLs", {
        error: signedUrlResponse.error,
        fileName,
        chatBotId,
      });
      response.error =
        signedUrlResponse.error || "Failed to generate signed URL";
      return response;
    }

    const signedUrl = signedUrlResponse.signedUrl;
    logger.info("Successfully generated signed URL", {
      fileName,
      chatBotId,
      urlLength: signedUrl.length,
    });

    response.isError = false;
    response.data = JSON.stringify({
      signedUrl,
    });
  } catch (error) {
    logger.error("Unexpected error in processor", {
      error: error.message,
      stack: error.stack,
      event: JSON.stringify(event),
    });
    response.error = "Internal server error";
  }

  return response;
};

module.exports = processor;
