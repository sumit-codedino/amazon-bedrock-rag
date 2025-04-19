const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const winston = require("winston");

const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [new winston.transports.Console()],
});

const s3Client = new S3Client();

const generateSignedUrls = async (fileName, chatbotId, userId) => {
  const response = {
    isError: true,
  };
  try {
    const params = {
      Bucket: process.env.BUCKET_NAME,
      Key: `${userId}/${chatbotId}/${fileName}`,
    };
    const signedUrl = await getSignedUrl(
      s3Client,
      new PutObjectCommand(params)
    );
    response.isError = false;
    response.signedUrl = signedUrl;
  } catch (error) {
    logger.error("Error while generating signed urls", {
      error: error.message,
      stack: error.stack,
    });
  }
  return response;
};

module.exports = generateSignedUrls;
