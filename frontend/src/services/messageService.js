import api from "./api";

/**
 * Send a message
 */
export const sendMessage = async (groupId, messageData) => {
  const response = await api.post(`/api/groups/${groupId}/messages`, messageData);
  return response.data;
};

/**
 * Get messages from a group
 */
export const getMessages = async (groupId, params = {}) => {
  const response = await api.get(`/api/groups/${groupId}/messages`, { params });
  return response.data;
};

/**
 * Edit a message
 */
export const editMessage = async (messageId, content) => {
  const response = await api.put(`/api/messages/${messageId}`, { content });
  return response.data;
};

/**
 * Delete a message
 */
export const deleteMessage = async (messageId) => {
  const response = await api.delete(`/api/messages/${messageId}`);
  return response.data;
};

/**
 * Add reaction to message
 */
export const addReaction = async (messageId, emoji) => {
  const response = await api.post(`/api/messages/${messageId}/reactions`, { emoji });
  return response.data;
};

/**
 * Remove reaction from message
 */
export const removeReaction = async (messageId) => {
  const response = await api.delete(`/api/messages/${messageId}/reactions`);
  return response.data;
};
