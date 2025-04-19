import axios from "axios";

interface CreateChatBotParams {
  name: string;
  description: string;
  userId: string;
  token: string;
}

interface CreateChatBotResponse {
  isError: boolean;
  error?: string;
  chatBotId?: string;
}

const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/chatbot`;

export const createChatBot = async ({
  name,
  description,
  userId,
  token,
}: CreateChatBotParams): Promise<CreateChatBotResponse> => {
  try {
    const response = await axios.post(
      API_URL,
      { name, description, userId },
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
