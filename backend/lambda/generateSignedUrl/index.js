const processor = require("./processor");
const winston = require("winston");

const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [new winston.transports.Console()],
});

exports.handler = async (event) => {
  const response = {
    statusCode: 500,
    body: "Internal Server Error",
    headers: {
      "Access-Control-Allow-Headers":
        "Access-Control-Allow-Methods,Access-Control-Allow-Origin,Content-Type,X-Amz-Date,X-Amz-Security-Token,Authorization,X-Api-Key,X-Requested-With,Accept,tenant-id,service-account-id",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "*",
    },
  };
  try {
    const processorResponse = await processor(event);
    if (processorResponse.isError === false) {
      return {
        statusCode: 200,
        body: JSON.stringify(processorResponse.data),
        headers: {
          "Access-Control-Allow-Headers":
            "Access-Control-Allow-Methods,Access-Control-Allow-Origin,Content-Type,X-Amz-Date,X-Amz-Security-Token,Authorization,X-Api-Key,X-Requested-With,Accept,tenant-id,service-account-id",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "*",
        },
      };
    } else {
      logger.error("Processor encountered an error", {
        error: processorResponse.error,
      });
    }
  } catch (error) {
    logger.error("Lambda handler encountered an error", {
      error: error.message,
      stack: error.stack,
    });
  }
  return response;
};
