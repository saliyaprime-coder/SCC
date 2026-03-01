import api from "./api";

// 1️⃣ Create Raw Timetable
export const createRawTimetable = async (universitySchedule) => {
  const response = await api.post("/api/timetable", { universitySchedule });

  if (!response.data?.success) {
    throw new Error(response.data?.message || "Failed to save timetable");
  }

  // data: { timetable, conflicts, hasConflicts }
  return response.data.data;
};

// 2️⃣ Get User Timetable (latest)
export const getUserTimetable = async (userId) => {
  const response = await api.get(`/api/timetable/${userId}`);

  if (!response.data?.success) {
    throw new Error(response.data?.message || "Failed to fetch timetable");
  }

  return response.data.data;
};

// 3️⃣ Generate Optimized Timetable (rule-based)
export const generateOptimizedTimetable = async ({ difficultyLevels, preferredStudyHours }) => {
  const response = await api.post("/api/timetable/generate", {
    difficultyLevels,
    preferredStudyHours
  });

  if (!response.data?.success) {
    throw new Error(response.data?.message || "Failed to generate optimized timetable");
  }

  // data: { timetable, conflicts, hasConflicts }
  return response.data.data;
};

// 4️⃣ Get ongoing event for dashboard
export const getOngoingEvent = async () => {
  const response = await api.get("/api/timetable/ongoing");

  if (!response.data?.success) {
    throw new Error(response.data?.message || "Failed to fetch ongoing event");
  }

  return response.data.data; // may be null
};

// 5a Get Google OAuth URL (uses GOOGLE_CLIENT_ID from backend .env)
export const getGoogleAuthUrl = async () => {
  const response = await api.get("/api/timetable/google-auth-url");
  if (!response.data?.success) {
    throw new Error(response.data?.message || "Failed to get Google auth URL");
  }
  return response.data.data;
};

// 5️⃣ Sync optimized schedule to Google Calendar (accessToken optional if already connected via OAuth)
export const syncGoogleCalendar = async ({ accessToken, refreshToken } = {}) => {
  const response = await api.post("/api/timetable/sync-google", {
    accessToken: accessToken || undefined,
    refreshToken: refreshToken || undefined
  });

  if (!response.data?.success) {
    throw new Error(response.data?.message || "Failed to sync with Google Calendar");
  }

  return response.data;
};

// 6️⃣ AI timetable chat -> generate + (optional) sync
export const aiTimetableChat = async ({ message, googleAccessToken }) => {
  const response = await api.post("/api/timetable/ai-chat", {
    message,
    googleAccessToken
  });

  if (!response.data?.success) {
    throw new Error(response.data?.message || "Failed to generate timetable from AI chat");
  }

  return response.data.data;
};

