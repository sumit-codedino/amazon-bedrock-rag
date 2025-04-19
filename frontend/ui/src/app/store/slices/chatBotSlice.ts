import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface ChatBotState {
  chatBotId: string | null;
  chatBotName: string | null;
  chatBotDescription: string | null;
  dataSources: string[] | null;
  knowledgeBaseId: string | null;
  s3DataSourceId: string | null;
  webPageDataSourceId: string | null;
  lastUpdatedAt: string | null;
}

const initialState: ChatBotState = {
  chatBotId: null,
  chatBotName: null,
  chatBotDescription: null,
  dataSources: null,
  knowledgeBaseId: null,
  s3DataSourceId: null,
  webPageDataSourceId: null,
  lastUpdatedAt: null,
};

const chatBotSlice = createSlice({
  name: "chatBot",
  initialState,
  reducers: {
    setChatBot: (state, action: PayloadAction<ChatBotState>) => {
      state.chatBotId = action.payload.chatBotId;
      state.chatBotName = action.payload.chatBotName;
      state.chatBotDescription = action.payload.chatBotDescription;
      state.dataSources = action.payload.dataSources;
      state.knowledgeBaseId = action.payload.knowledgeBaseId;
      state.s3DataSourceId = action.payload.s3DataSourceId;
      state.webPageDataSourceId = action.payload.webPageDataSourceId;
      state.lastUpdatedAt = action.payload.lastUpdatedAt;
    },
    setChatBotId: (state, action: PayloadAction<string>) => {
      state.chatBotId = action.payload;
    },
    setChatBotName: (state, action: PayloadAction<string>) => {
      state.chatBotName = action.payload;
    },
    setChatBotDescription: (state, action: PayloadAction<string>) => {
      state.chatBotDescription = action.payload;
    },
    setDataSources: (state, action: PayloadAction<string[]>) => {
      state.dataSources = action.payload;
    },
    setKnowledgeBaseId: (state, action: PayloadAction<string>) => {
      state.knowledgeBaseId = action.payload;
    },
    setS3DataSourceId: (state, action: PayloadAction<string>) => {
      state.s3DataSourceId = action.payload;
    },
    setWebPageDataSourceId: (state, action: PayloadAction<string>) => {
      state.webPageDataSourceId = action.payload;
    },
    setLastUpdatedAt: (state, action: PayloadAction<string>) => {
      state.lastUpdatedAt = action.payload;
    },
  },
});

export const {
  setChatBot,
  setChatBotId,
  setChatBotName,
  setChatBotDescription,
  setDataSources,
  setKnowledgeBaseId,
  setS3DataSourceId,
  setWebPageDataSourceId,
  setLastUpdatedAt,
} = chatBotSlice.actions;
export default chatBotSlice.reducer;
