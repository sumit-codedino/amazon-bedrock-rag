const path = require("path");
const isLambda = !!process.env.AWS_REGION;
const basePath = isLambda
  ? ""
  : path.join(__dirname, "../../../layers/common/nodejs");

const logger = require(isLambda
  ? "utils/logger"
  : path.join(basePath, "utils/logger"));

const getUserDetails = require("./helpers/get-user-details");
const createS3DataSource = require("./helpers/create-s3-data-source");
const createWebDataSource = require("./helpers/create-web-data-source");
const updateUserDetails = require("./helpers/update-user-details");
const updateUserChatDetails = require("./helpers/update-user-chat-details");

/**
 * Starts the ingestion process for either S3 or Web data sources
 * @param {Object} event - The event object containing chatbotId, userId, and ingestionType
 * @returns {Object} Response object with status code and message
 */
const createDataSource = async (event) => {
  try {
    // Validate required parameters
    const parsedBody = JSON.parse(event.body);
    logger.info("Parsed body", { parsedBody });
    const { chatBotId, userId, dataSourceType } = parsedBody;

    if (!chatBotId || !userId || !dataSourceType) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message:
            "Missing required parameters: chatBotId, userId, or dataSourceType",
        }),
      };
    }
    // Get user details from database
    const userDetails = await getUserDetails(userId);
    if (userDetails.isError) {
      logger.error("Failed to get user details", {
        userId,
        error: userDetails.error,
      });
      return {
        statusCode: 500,
        body: JSON.stringify({
          message: "Error getting user details",
          error: userDetails.error,
        }),
      };
    }

    let { knowledgeBaseId, s3DataSourceId, webDataSourceId } = userDetails.Item;

    logger.info("User details:", userDetails.Item);

    // Handle S3 ingestion
    if (dataSourceType.toLowerCase() === "s3" && !s3DataSourceId) {
      logger.info("Creating S3 data source", { userId, knowledgeBaseId });

      const s3DataSourceResult = await createS3DataSource(
        userId,
        knowledgeBaseId,
        process.env.S3_BUCKET_NAME
      );

      if (s3DataSourceResult.isError) {
        logger.error("Failed to create S3 data source", {
          error: s3DataSourceResult.error,
        });
        return {
          statusCode: 500,
          body: JSON.stringify({
            message: "Error creating S3 data source",
            error: s3DataSourceResult.error,
          }),
        };
      }

      logger.info("S3 data source created successfully", {
        s3DataSourceId: s3DataSourceResult.s3DataSourceId,
      });

      s3DataSourceId = s3DataSourceResult.s3DataSourceId;

      // Update user details with new S3 data source ID
      const updateUserDetailsResult = await updateUserDetails(
        userId,
        s3DataSourceResult.s3DataSourceId,
        null
      );

      if (updateUserDetailsResult.isError) {
        logger.error("Failed to update user details with S3 data source", {
          error: updateUserDetailsResult.error,
        });
        return {
          statusCode: 500,
          body: JSON.stringify({
            message: "Error updating user details",
            error: updateUserDetailsResult.error,
          }),
        };
      }

      logger.info("User details updated successfully with S3 data source");
    }
    // Handle Web ingestion
    else if (dataSourceType.toLowerCase() === "web" && !webDataSourceId) {
      logger.info("Creating Web data source", { userId, knowledgeBaseId });

      const webDataSourceResult = await createWebDataSource(
        userId,
        knowledgeBaseId
      );

      if (webDataSourceResult.isError) {
        logger.error("Failed to create Web data source", {
          error: webDataSourceResult.error,
        });
        return {
          statusCode: 500,
          body: JSON.stringify({
            message: "Error creating web data source",
            error: webDataSourceResult.error,
          }),
        };
      }

      logger.info("Web data source created successfully", {
        webDataSourceId: webDataSourceResult.webDataSourceId,
      });

      webDataSourceId = webDataSourceResult.webDataSourceId;

      // Update user details with new Web data source ID
      const updateUserDetailsResult = await updateUserDetails(
        userId,
        null,
        webDataSourceResult.webDataSourceId
      );

      if (updateUserDetailsResult.isError) {
        logger.error("Failed to update user details with Web data source", {
          error: updateUserDetailsResult.error,
        });
        return {
          statusCode: 500,
          body: JSON.stringify({
            message: "Error updating user details",
            error: updateUserDetailsResult.error,
          }),
        };
      }

      logger.info("User details updated successfully with Web data source");
    } else if (
      dataSourceType.toLowerCase() !== "web" &&
      dataSourceType.toLowerCase() !== "s3"
    ) {
      logger.error("Invalid data source type", { dataSourceType });
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Invalid data source type. Please use 's3' or 'web'.",
        }),
      };
    } else {
      logger.info("Data Source already exists", {
        s3DataSourceId,
        webDataSourceId,
      });
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "Data source already exists",
          s3DataSourceId,
          webDataSourceId,
        }),
      };
    }

    if (dataSourceType.toLowerCase() === "s3") {
      logger.info("Updating user chat details for S3 data source", {
        userId,
        chatBotId,
        s3DataSourceId,
      });

      const updateUserChatDetailsResult = await updateUserChatDetails(
        userId,
        chatBotId,
        s3DataSourceId,
        null
      );

      if (updateUserChatDetailsResult.isError) {
        logger.error("Failed to update user chat details", {
          error: updateUserChatDetailsResult.error,
        });
        return {
          statusCode: 500,
          body: JSON.stringify({
            message: "Error updating user chat details",
            error: updateUserChatDetailsResult.error,
          }),
        };
      }

      logger.info("User chat details updated successfully");
    }
    if (dataSourceType.toLowerCase() === "web") {
      logger.info("Updating user chat details for Web data source", {
        userId,
        chatBotId,
        webDataSourceId,
      });

      const updateUserChatDetailsResult = await updateUserChatDetails(
        userId,
        chatBotId,
        null,
        webDataSourceId
      );

      if (updateUserChatDetailsResult.isError) {
        logger.error("Failed to update user chat details", {
          error: updateUserChatDetailsResult.error,
        });
        return {
          statusCode: 500,
          body: JSON.stringify({
            message: "Error updating user chat details",
            error: updateUserChatDetailsResult.error,
          }),
        };
      }

      logger.info("User chat details updated successfully");
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Data source created successfully",
        dataSourceType,
        dataSourceId:
          dataSourceType.toLowerCase() === "s3"
            ? s3DataSourceId
            : webDataSourceId,
      }),
    };
  } catch (error) {
    logger.error("Unexpected error in ingestion process:", {
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
  createDataSource,
};
