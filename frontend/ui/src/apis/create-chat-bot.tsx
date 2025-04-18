import axios from "axios";

interface CreateChatBotParams {
  name: string;
  description: string;
  token: string;
}

interface CreateChatBotResponse {
  isError: boolean;
  error?: string;
  chatBotId?: string;
}

const API_URL =
  "https://nfcu2gdhve.execute-api.us-east-1.amazonaws.com/dev/chatbot";

export const createChatBot = async ({
  name,
  description,
  token,
}: CreateChatBotParams): Promise<CreateChatBotResponse> => {
  try {
    const response = await axios.post(
      API_URL,
      { name, description },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return {
      isError: false,
      chatBotId: response.data.chatBotId,
    };
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      console.error("Error creating chatbot:", {
        error: error.response?.data,
      });
    }
    return {
      isError: true,
      error: "Failed to create chatbot",
    };
  }
};
