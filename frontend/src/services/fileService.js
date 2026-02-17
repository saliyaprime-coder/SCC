import api from "./api";

/**
 * Upload a file
 */
export const uploadFile = async (groupId, file, metadata = {}) => {
  const formData = new FormData();
  formData.append("file", file);
  if (metadata.description) formData.append("description", metadata.description);
  if (metadata.category) formData.append("category", metadata.category);
  if (metadata.tags) formData.append("tags", metadata.tags);

  const response = await api.post(`/api/groups/${groupId}/files`, formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });
  return response.data;
};

/**
 * Get files from a group
 */
export const getFiles = async (groupId, params = {}) => {
  const response = await api.get(`/api/groups/${groupId}/files`, { params });
  return response.data;
};

/**
 * Download a file
 */
export const downloadFile = async (fileId) => {
  const response = await api.get(`/api/files/${fileId}/download`, {
    responseType: "blob"
  });
  return response.data;
};

/**
 * Delete a file
 */
export const deleteFile = async (fileId) => {
  const response = await api.delete(`/api/files/${fileId}`);
  return response.data;
};

/**
 * Get file info
 */
export const getFileInfo = async (fileId) => {
  const response = await api.get(`/api/files/${fileId}`);
  return response.data;
};
