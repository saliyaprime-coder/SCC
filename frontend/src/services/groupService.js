import api from "./api";

/**
 * Create a new group
 */
export const createGroup = async (groupData) => {
  const response = await api.post("/api/groups", groupData);
  return response.data;
};

/**
 * Get all groups
 */
export const getGroups = async (params = {}) => {
  const response = await api.get("/api/groups", { params });
  return response.data;
};

/**
 * Get single group
 */
export const getGroup = async (groupId) => {
  const response = await api.get(`/api/groups/${groupId}`);
  return response.data;
};

/**
 * Join a group
 */
export const joinGroup = async (groupId) => {
  const response = await api.post(`/api/groups/${groupId}/join`);
  return response.data;
};

/**
 * Leave a group
 */
export const leaveGroup = async (groupId) => {
  const response = await api.post(`/api/groups/${groupId}/leave`);
  return response.data;
};

/**
 * Update group
 */
export const updateGroup = async (groupId, groupData) => {
  const response = await api.put(`/api/groups/${groupId}`, groupData);
  return response.data;
};

/**
 * Delete group
 */
export const deleteGroup = async (groupId) => {
  const response = await api.delete(`/api/groups/${groupId}`);
  return response.data;
};

/**
 * Add member to group
 */
export const addMember = async (groupId, userId) => {
  const response = await api.post(`/api/groups/${groupId}/members`, { userId });
  return response.data;
};

/**
 * Remove member from group
 */
export const removeMember = async (groupId, memberId) => {
  const response = await api.delete(`/api/groups/${groupId}/members/${memberId}`);
  return response.data;
};
