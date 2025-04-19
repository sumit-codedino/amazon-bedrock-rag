import axios from "axios";

interface GenerateSignedUrlParams {
  fileName: string;
  chatBotId: string;
  token: string;
}

interface GenerateSignedUrlResponse {
  isError: boolean;
  error?: string;
  signedUrl?: string;
}

const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/generate-signed-url`;

export const generateSignedUrl = async ({
  fileName,
  chatBotId,
  token,
}: GenerateSignedUrlParams): Promise<GenerateSignedUrlResponse> => {
  try {
    const response = await axios.post(
      API_URL,
      {
        fileName,
        chatBotId,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = response.data;

    const parsedData = JSON.parse(data);

    return {
      isError: false,
      signedUrl: parsedData.signedUrl,
    };
  } catch (error) {
    console.error("Error generating signed URL:", error);
    return {
      isError: true,
      error: "Failed to generate signed URL",
    };
  }
};
