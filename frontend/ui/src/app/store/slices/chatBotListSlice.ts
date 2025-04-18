import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface ChatBot {
  id: string | null;
  name: string;
  description: string;
  dataSources: string[];
}

interface ChatBotListState {
  chatBots: ChatBot[];
}

const initialState: ChatBotListState = {
  chatBots: [],
};

const chatBotListSlice = createSlice({
  name: "chatBotList",
  initialState,
  reducers: {
    addChatBot: (state, action: PayloadAction<ChatBot>) => {
      state.chatBots.push(action.payload);
    },
    updateChatBot: (state, action: PayloadAction<ChatBot>) => {
      const index = state.chatBots.findIndex(
        (chatBot) => chatBot.id === action.payload.id
      );
      if (index !== -1) {
        state.chatBots[index] = action.payload;
      }
    },
    deleteChatBot: (state, action: PayloadAction<string>) => {
      state.chatBots = state.chatBots.filter(
        (chatBot) => chatBot.id !== action.payload
      );
    },
  },
});

export const { addChatBot, updateChatBot, deleteChatBot } =
  chatBotListSlice.actions;
export default chatBotListSlice.reducer;
