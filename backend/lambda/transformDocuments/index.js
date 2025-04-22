const path = require("path");
const isLambda = !!process.env.AWS_REGION;
const basePath = isLambda
  ? ""
  : path.join(__dirname, "../../../layers/common/nodejs");

const logger = require(isLambda
  ? "utils/logger"
  : path.join(basePath, "utils/logger"));

/**
 * Extracts chatbotId from S3 URI path
 * @param {string} s3Uri - S3 URI in format s3://bucket/userId/chatbotId/filename
 * @returns {string} Extracted chatbotId
 */
const extractChatbotId = (s3Uri) => {
  try {
    const parts = s3Uri.replace("s3://", "").split("/");
    return parts[2] || "unknown";
  } catch (error) {
    logger.error("Error extracting chatbotId from S3 URI:", { s3Uri, error });
    return "unknown";
  }
};

/**
 * Lambda handler for transforming documents from S3 ingestion
 */
exports.handler = async (event) => {
  logger.info("Starting document transformation", { event });

  try {
    if (!event.inputFiles || !Array.isArray(event.inputFiles)) {
      throw new Error("Invalid input: 'inputFiles' array is required");
    }

    const outputFiles = event.inputFiles.map((file) => {
      const chatbotId = extractChatbotId(
        file.originalFileLocation.s3_location.uri
      );

      // Process content batches
      const contentBatches = file.contentBatches.map((batch) => ({
        key: batch.key,
      }));

      return {
        originalFileLocation: file.originalFileLocation,
        fileMetadata: {
          chatbotId,
          source: "s3-ingestion",
          timestamp: new Date().toISOString(),
          ...file.fileMetadata,
        },
        contentBatches,
      };
    });

    logger.info("Transformation successful", {
      fileCount: outputFiles.length,
    });

    return {
      outputFiles,
    };
  } catch (error) {
    logger.error("Transformation error:", {
      message: error.message,
      stack: error.stack,
    });

    throw error; // Let Bedrock handle the error
  }
};
