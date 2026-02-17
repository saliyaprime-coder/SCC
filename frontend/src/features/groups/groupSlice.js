import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as groupService from "../../services/groupService";

const initialState = {
  groups: [],
  currentGroup: null,
  isLoading: false,
  error: null,
  filters: {
    search: "",
    subject: "",
    courseCode: "",
    myGroups: false
  }
};

// Async thunks
export const createGroup = createAsyncThunk(
  "groups/createGroup",
  async (groupData, { rejectWithValue }) => {
    try {
      const response = await groupService.createGroup(groupData);
      return response.data.group;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create group"
      );
    }
  }
);

export const fetchGroups = createAsyncThunk(
  "groups/fetchGroups",
  async (params, { rejectWithValue }) => {
    try {
      const response = await groupService.getGroups(params);
      return response.data.groups;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch groups"
      );
    }
  }
);

export const fetchGroup = createAsyncThunk(
  "groups/fetchGroup",
  async (groupId, { rejectWithValue }) => {
    try {
      const response = await groupService.getGroup(groupId);
      return response.data.group;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch group"
      );
    }
  }
);

export const joinGroup = createAsyncThunk(
  "groups/joinGroup",
  async (groupId, { rejectWithValue }) => {
    try {
      const response = await groupService.joinGroup(groupId);
      return response.data.group;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to join group"
      );
    }
  }
);

export const leaveGroup = createAsyncThunk(
  "groups/leaveGroup",
  async (groupId, { rejectWithValue }) => {
    try {
      await groupService.leaveGroup(groupId);
      return groupId;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to leave group"
      );
    }
  }
);

export const updateGroup = createAsyncThunk(
  "groups/updateGroup",
  async ({ groupId, groupData }, { rejectWithValue }) => {
    try {
      const response = await groupService.updateGroup(groupId, groupData);
      return response.data.group;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update group"
      );
    }
  }
);

export const deleteGroupAction = createAsyncThunk(
  "groups/deleteGroup",
  async (groupId, { rejectWithValue }) => {
    try {
      await groupService.deleteGroup(groupId);
      return groupId;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete group"
      );
    }
  }
);

const groupSlice = createSlice({
  name: "groups",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearCurrentGroup: (state) => {
      state.currentGroup = null;
    },
    addGroupToList: (state, action) => {
      const exists = state.groups.some(g => g._id === action.payload._id);
      if (!exists) {
        state.groups.unshift(action.payload);
      }
    },
    updateGroupInList: (state, action) => {
      const index = state.groups.findIndex(g => g._id === action.payload._id);
      if (index !== -1) {
        state.groups[index] = action.payload;
      }
      if (state.currentGroup?._id === action.payload._id) {
        state.currentGroup = action.payload;
      }
    },
    removeGroupFromList: (state, action) => {
      state.groups = state.groups.filter(g => g._id !== action.payload);
      if (state.currentGroup?._id === action.payload) {
        state.currentGroup = null;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Create group
      .addCase(createGroup.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createGroup.fulfilled, (state, action) => {
        state.isLoading = false;
        state.groups.unshift(action.payload);
        state.currentGroup = action.payload;
      })
      .addCase(createGroup.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch groups
      .addCase(fetchGroups.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchGroups.fulfilled, (state, action) => {
        state.isLoading = false;
        state.groups = action.payload;
      })
      .addCase(fetchGroups.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch group
      .addCase(fetchGroup.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchGroup.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentGroup = action.payload;
      })
      .addCase(fetchGroup.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Join group
      .addCase(joinGroup.fulfilled, (state, action) => {
        const index = state.groups.findIndex(g => g._id === action.payload._id);
        if (index !== -1) {
          state.groups[index] = action.payload;
        } else {
          state.groups.unshift(action.payload);
        }
        state.currentGroup = action.payload;
      })
      // Leave group
      .addCase(leaveGroup.fulfilled, (state, action) => {
        state.groups = state.groups.filter(g => g._id !== action.payload);
        if (state.currentGroup?._id === action.payload) {
          state.currentGroup = null;
        }
      })
      // Update group
      .addCase(updateGroup.fulfilled, (state, action) => {
        const index = state.groups.findIndex(g => g._id === action.payload._id);
        if (index !== -1) {
          state.groups[index] = action.payload;
        }
        if (state.currentGroup?._id === action.payload._id) {
          state.currentGroup = action.payload;
        }
      })
      // Delete group
      .addCase(deleteGroupAction.fulfilled, (state, action) => {
        state.groups = state.groups.filter(g => g._id !== action.payload);
        if (state.currentGroup?._id === action.payload) {
          state.currentGroup = null;
        }
      });
  }
});

export const { clearError, setFilters, clearCurrentGroup, addGroupToList, updateGroupInList, removeGroupFromList } = groupSlice.actions;
export default groupSlice.reducer;
