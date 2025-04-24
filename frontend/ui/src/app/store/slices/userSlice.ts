import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UserState {
  userId: string;
  token: string;
  knowledgeBaseId: string | null;
  s3DataSourceId: string | null;
  webDataSourceId: string | null;
}

const initialState: UserState = {
  userId: "",
  token: "",
  knowledgeBaseId: null,
  s3DataSourceId: null,
  webDataSourceId: null,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUserId: (state, action: PayloadAction<string>) => {
      state.userId = action.payload;
    },
    setToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
    },
    setKnowledgeBaseId: (state, action: PayloadAction<string>) => {
      state.knowledgeBaseId = action.payload;
    },
    setS3DataSourceId: (state, action: PayloadAction<string>) => {
      state.s3DataSourceId = action.payload;
    },
    setWebDataSourceId: (state, action: PayloadAction<string>) => {
      state.webDataSourceId = action.payload;
    },
  },
});

export const {
  setUserId,
  setToken,
  setKnowledgeBaseId,
  setS3DataSourceId,
  setWebDataSourceId,
} = userSlice.actions;

export default userSlice.reducer;
