import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as messageService from "../../services/messageService";

const initialState = {
  messages: {},
  currentGroupId: null,
  isLoading: false,
  error: null,
  typingUsers: {}
};

// Async thunks
export const sendMessage = createAsyncThunk(
  "chat/sendMessage",
  async ({ groupId, content, replyTo }, { rejectWithValue }) => {
    try {
      const response = await messageService.sendMessage(groupId, { content, replyTo });
      return { groupId, message: response.data.message };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to send message"
      );
    }
  }
);

export const fetchMessages = createAsyncThunk(
  "chat/fetchMessages",
  async ({ groupId, page = 1, limit = 50 }, { rejectWithValue }) => {
    try {
      const response = await messageService.getMessages(groupId, { page, limit });
      return { groupId, messages: response.data.messages, pagination: response.data.pagination };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch messages"
      );
    }
  }
);

export const editMessage = createAsyncThunk(
  "chat/editMessage",
  async ({ messageId, content }, { rejectWithValue }) => {
    try {
      const response = await messageService.editMessage(messageId, content);
      return response.data.message;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to edit message"
      );
    }
  }
);

export const deleteMessage = createAsyncThunk(
  "chat/deleteMessage",
  async (messageId, { rejectWithValue }) => {
    try {
      await messageService.deleteMessage(messageId);
      return messageId;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete message"
      );
    }
  }
);

export const addReaction = createAsyncThunk(
  "chat/addReaction",
  async ({ messageId, emoji }, { rejectWithValue }) => {
    try {
      const response = await messageService.addReaction(messageId, emoji);
      return { messageId, reactions: response.data.reactions };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to add reaction"
      );
    }
  }
);

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setCurrentGroup: (state, action) => {
      state.currentGroupId = action.payload;
      if (!state.messages[action.payload]) {
        state.messages[action.payload] = [];
      }
    },
    clearCurrentGroup: (state) => {
      state.currentGroupId = null;
    },
    addMessage: (state, action) => {
      const { groupId, message } = action.payload;
      if (!state.messages[groupId]) {
        state.messages[groupId] = [];
      }
      const exists = state.messages[groupId].some(m => m._id === message._id);
      if (!exists) {
        state.messages[groupId].push(message);
      }
    },
    updateMessage: (state, action) => {
      const { groupId, message } = action.payload;
      if (state.messages[groupId]) {
        const index = state.messages[groupId].findIndex(m => m._id === message._id);
        if (index !== -1) {
          state.messages[groupId][index] = message;
        }
      }
    },
    removeMessage: (state, action) => {
      const { groupId, messageId } = action.payload;
      if (state.messages[groupId]) {
        state.messages[groupId] = state.messages[groupId].filter(m => m._id !== messageId);
      }
    },
    setTyping: (state, action) => {
      const { groupId, userId, isTyping } = action.payload;
      if (!state.typingUsers[groupId]) {
        state.typingUsers[groupId] = [];
      }
      if (isTyping) {
        if (!state.typingUsers[groupId].includes(userId)) {
          state.typingUsers[groupId].push(userId);
        }
      } else {
        state.typingUsers[groupId] = state.typingUsers[groupId].filter(id => id !== userId);
      }
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Send message
      .addCase(sendMessage.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.isLoading = false;
        const { groupId, message } = action.payload;
        if (!state.messages[groupId]) {
          state.messages[groupId] = [];
        }
        state.messages[groupId].push(message);
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch messages
      .addCase(fetchMessages.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.isLoading = false;
        const { groupId, messages } = action.payload;
        state.messages[groupId] = messages;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Edit message
      .addCase(editMessage.fulfilled, (state, action) => {
        const message = action.payload;
        const groupId = message.group;
        if (state.messages[groupId]) {
          const index = state.messages[groupId].findIndex(m => m._id === message._id);
          if (index !== -1) {
            state.messages[groupId][index] = message;
          }
        }
      })
      // Delete message
      .addCase(deleteMessage.fulfilled, (state, action) => {
        const messageId = action.payload;
        Object.keys(state.messages).forEach(groupId => {
          state.messages[groupId] = state.messages[groupId].filter(m => m._id !== messageId);
        });
      })
      // Add reaction
      .addCase(addReaction.fulfilled, (state, action) => {
        const { messageId, reactions } = action.payload;
        Object.keys(state.messages).forEach(groupId => {
          const message = state.messages[groupId].find(m => m._id === messageId);
          if (message) {
            message.reactions = reactions;
          }
        });
      });
  }
});

export const {
  setCurrentGroup,
  clearCurrentGroup,
  addMessage,
  updateMessage,
  removeMessage,
  setTyping,
  clearError
} = chatSlice.actions;

export default chatSlice.reducer;
