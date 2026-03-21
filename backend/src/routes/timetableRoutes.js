import express from "express";
import { authenticate } from "../middlewares/auth.js";
import {
  createRawTimetable,
  getUserTimetable,
  generateOptimizedTimetable,
  getOngoingEvent,
  syncGoogleCalendar,
  aiTimetableChat,
  getGoogleAuthUrl,
  googleCallback
} from "../controllers/timetableController.js";
import {
  validateCreateTimetable,
  validateGenerateTimetable,
  validateGoogleSync
} from "../middlewares/timetableValidation.js";

const router = express.Router();

// Google OAuth callback (no auth – called by Google)
router.get("/timetable/google-callback", googleCallback);

// All other timetable routes require authentication
router.use(authenticate);

// Google OAuth URL (uses GOOGLE_CLIENT_ID from .env)
router.get("/timetable/google-auth-url", getGoogleAuthUrl);

// 1️⃣ Create Raw Timetable
router.post("/timetable", validateCreateTimetable, createRawTimetable);

// 2️⃣ Get User Timetable
router.get("/timetable/:userId", getUserTimetable);

// 3️⃣ Generate Optimized Timetable (rule-based for now)
router.post("/timetable/generate", validateGenerateTimetable, generateOptimizedTimetable);

// 4️⃣ Dashboard Ongoing Event
router.get("/timetable/ongoing", getOngoingEvent);

// 5️⃣ Google Calendar Sync
router.post("/timetable/sync-google", validateGoogleSync, syncGoogleCalendar);

// 6️⃣ AI Timetable Chat
router.post("/timetable/ai-chat", aiTimetableChat);

export default router;


