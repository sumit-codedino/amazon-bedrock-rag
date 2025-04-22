interface GetChatbotResponse {
  isError: boolean;
  error?: string;
  chatbot?: {
    id: string;
    name: string;
    // Add other chatbot properties as needed
  };
}

export async function getChatbot(
  chatbotId: string
): Promise<GetChatbotResponse> {
  try {
    const response = await fetch(`/api/chatbots/${chatbotId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch chatbot: ${response.statusText}`);
    }
    const data = await response.json();
    return {
      isError: false,
      chatbot: data,
    };
  } catch (error) {
    return {
      isError: true,
      error: error instanceof Error ? error.message : "Failed to fetch chatbot",
    };
  }
}
