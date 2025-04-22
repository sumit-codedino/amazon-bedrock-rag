import axios from "axios";

interface GetAllChatBotsResponse {
  isError: boolean;
  error?: string;
  chatBotDetails?: ChatBotDetail[];
  knowledgeBaseId?: string;
  s3DataSourceId?: string;
  webDataSourceId?: string;
}

interface ChatBotDetail {
  chatBotId: string;
  chatBotName: string;
  chatBotDescription: string;
  dataSources: string[];
  s3DataSourceId: string | null;
  webPageDataSourceId: string | null;
  knowledgeBaseId: string | null;
  lastUpdatedAt: string;
}

const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/chatbots`;

export const getAllChatBots = async (
  userId: string
): Promise<GetAllChatBotsResponse> => {
  try {
    const response = await axios.get(API_URL, {
      params: { userId },
    });

    const data = response.data;

    const parsedData = JSON.parse(data);
    return {
      isError: false,
      chatBotDetails: parsedData.chatBotDetails,
      knowledgeBaseId: parsedData.knowledgeBaseId,
      s3DataSourceId: parsedData.s3DataSourceId,
      webDataSourceId: parsedData.webDataSourceId,
    };
  } catch (error) {
    console.error("Error fetching chatbots:", error);
    return {
      isError: true,
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
};
