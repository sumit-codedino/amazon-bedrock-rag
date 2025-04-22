import { configureStore } from "@reduxjs/toolkit";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import chatReducer from "./slices/chatSlice";
import authReducer from "./slices/authSlice";
import chatBotReducer from "./slices/chatBotSlice";
import chatBotListReducer from "./slices/chatBotListSlice";
import userReducer from "./slices/userSlice";

// Import your reducers here
// import chatReducer from './slices/chatSlice';
// import authReducer from './slices/authSlice';

export const store = configureStore({
  reducer: {
    chat: chatReducer,
    auth: authReducer,
    chatBot: chatBotReducer,
    chatBotList: chatBotListReducer,
    user: userReducer,
    // Add your reducers here
    // chat: chatReducer,
    // auth: authReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
