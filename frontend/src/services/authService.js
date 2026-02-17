import api from "./api";

/**
 * Register a new user
 */
export const register = async (userData) => {
  const response = await api.post("/api/auth/register", userData);
  return response.data;
};

/**
 * Login user
 */
export const login = async (credentials) => {
  const response = await api.post("/api/auth/login", credentials);
  return response.data;
};

/**
 * Logout user
 */
export const logout = async (refreshToken) => {
  const response = await api.post("/api/auth/logout", { refreshToken });
  return response.data;
};

/**
 * Get current user profile
 */
export const getMe = async () => {
  const response = await api.get("/api/auth/me");
  return response.data;
};

/**
 * Update user profile
 */
export const updateProfile = async (profileData) => {
  const response = await api.put("/api/auth/profile", profileData);
  return response.data;
};

/**
 * Refresh access token
 */
export const refreshToken = async (refreshToken) => {
  const response = await api.post("/api/auth/refresh", { refreshToken });
  return response.data;
};
