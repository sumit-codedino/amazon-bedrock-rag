import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface ChatBot {
  chatBotId: string;
  chatBotName: string;
  chatBotDescription: string;
  dataSources: string[];
  s3DataSourceId: string | null;
  webPageDataSourceId: string | null;
  knowledgeBaseId: string | null;
  lastUpdatedAt: string | null;
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
    setChatBotList: (state, action: PayloadAction<ChatBot[]>) => {
      state.chatBots = action.payload;
    },
    addChatBot: (state, action: PayloadAction<ChatBot>) => {
      state.chatBots.push(action.payload);
    },
    updateChatBot: (state, action: PayloadAction<ChatBot>) => {
      const index = state.chatBots.findIndex(
        (chatBot) => chatBot.chatBotId === action.payload.chatBotId
      );
      if (index !== -1) {
        state.chatBots[index] = action.payload;
      }
    },
    deleteChatBot: (state, action: PayloadAction<string>) => {
      state.chatBots = state.chatBots.filter(
        (chatBot) => chatBot.chatBotId !== action.payload
      );
    },
  },
});

export const { addChatBot, updateChatBot, deleteChatBot, setChatBotList } =
  chatBotListSlice.actions;
export default chatBotListSlice.reducer;
