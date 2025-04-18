import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface ChatBotState {
  chatBotId: string | null;
  chatBotName: string | null;
  chatBotDescription: string | null;
  dataSources: string[] | null;
}

const initialState: ChatBotState = {
  chatBotId: null,
  chatBotName: null,
  chatBotDescription: null,
  dataSources: null,
};

const chatBotSlice = createSlice({
  name: "chatBot",
  initialState,
  reducers: {
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
  },
});

export const {
  setChatBotId,
  setChatBotName,
  setChatBotDescription,
  setDataSources,
} = chatBotSlice.actions;
export default chatBotSlice.reducer;
