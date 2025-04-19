const {
  BedrockAgentClient,
  CreateDataSourceCommand,
} = require("@aws-sdk/client-bedrock-agent");

const logger = require("../../utils/logger");

const createDataSource = async (params) => {
  logger.info("Creating data source:", params);

  try {
    const client = new BedrockAgentClient({ region: process.env.AWS_REGION });

    const command = new CreateDataSourceCommand(params);
    const response = await client.send(command);

    logger.info("Data source created successfully:", response);
    return {
      isError: false,
      message: "Data source created successfully",
      data: response,
    };
  } catch (error) {
    logger.error("Error creating data source:", {
      error: error.message,
      stack: error.stack,
    });
    return {
      isError: true,
      message: "Error creating data source",
    };
  }
};

module.exports = createDataSource;
