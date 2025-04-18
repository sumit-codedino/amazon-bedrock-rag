const path = require("path");
const config = require("./config");
const addUserToDB = require("./helpers/add-user-to-db");
const createKnowledgeBase = require("./helpers/create-knowledge-base");
const createVectorIndex = require("./helpers/create-vector-index");
const addKnowledgeBaseToDB = require("./helpers/add-knowledge-base-to-db");
const isLambda = !!process.env.AWS_REGION;
const basePath = isLambda
  ? ""
  : path.join(__dirname, "../../../layers/common/nodejs");

const logger = require(isLambda
  ? "utils/logger"
  : path.join(basePath, "utils/logger"));

const signUp = async (event) => {
  logger.info("Processing user signup event");

  try {
    // Parse the event body if it's a string
    const eventBody =
      typeof event.body === "string" ? JSON.parse(event.body) : event.body;

    if (!eventBody || !eventBody.data) {
      return {
        statusCode: config.STATUS_CODES.BAD_REQUEST,
        body: JSON.stringify({ error: "Invalid event data" }),
      };
    }

    const { data } = eventBody;
    const userId = data.id;
    const emailAddress = data.email_addresses[0]?.email_address;

    if (!userId || !emailAddress) {
      return {
        statusCode: config.STATUS_CODES.BAD_REQUEST,
        body: JSON.stringify({ error: "Missing required user data" }),
      };
    }

    logger.info("Creating vector index for user:", userId);

    const createVectorIndexResult = await createVectorIndex(userId);

    if (createVectorIndexResult.isError) {
      return {
        statusCode: config.STATUS_CODES.INTERNAL_SERVER_ERROR,
        body: JSON.stringify({ error: createVectorIndexResult.message }),
      };
    }

    const { indexName } = createVectorIndexResult;

    logger.info("Vector index created:", indexName);

    const createKnowledgeBaseResult = await createKnowledgeBase(
      userId,
      indexName
    );

    if (createKnowledgeBaseResult.isError) {
      return {
        statusCode: config.STATUS_CODES.INTERNAL_SERVER_ERROR,
        body: JSON.stringify({ error: createKnowledgeBaseResult.error }),
      };
    }

    logger.info(
      "Knowledge base created:",
      createKnowledgeBaseResult.knowledgeBaseId
    );

    const addUserToDBResult = await addUserToDB(
      userId,
      emailAddress,
      createKnowledgeBaseResult.knowledgeBaseId
    );

    if (addUserToDBResult.isError) {
      return {
        statusCode: config.STATUS_CODES.INTERNAL_SERVER_ERROR,
        body: JSON.stringify({ error: addUserToDBResult.error }),
      };
    }

    logger.info("User added to database");

    const addKnowledgeBaseToDBResult = await addKnowledgeBaseToDB(
      userId,
      createKnowledgeBaseResult.knowledgeBaseId
    );

    if (addKnowledgeBaseToDBResult.isError) {
      return {
        statusCode: config.STATUS_CODES.INTERNAL_SERVER_ERROR,
        body: JSON.stringify({ error: addKnowledgeBaseToDBResult.error }),
      };
    }

    logger.info("Knowledge base added to database");

    return {
      statusCode: config.STATUS_CODES.OK,
      body: JSON.stringify({ message: "User signed up successfully" }),
    };
  } catch (error) {
    logger.error("Error in user signup:", {
      error: error.message,
      stack: error.stack,
    });

    return {
      statusCode: config.STATUS_CODES.INTERNAL_SERVER_ERROR,
      body: JSON.stringify({ error: config.ERROR_MESSAGES.UNKNOWN_ERROR }),
    };
  }
};

module.exports = {
  signUp,
};
