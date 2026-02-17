import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import groupReducer from "../features/groups/groupSlice";
import chatReducer from "../features/chat/chatSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    groups: groupReducer,
    chat: chatReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false
    })
});

export default store;
