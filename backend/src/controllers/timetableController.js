import axios from "axios";
import Timetable from "../models/Timetable.js";
import CalendarSync from "../models/CalendarSync.js";
import { generateOptimizedSchedule, findScheduleConflicts } from "../utils/timetableScheduler.js";
import { assertOpenAIConfigured, createChatCompletion, getChatCompletionText } from "../config/openai.js";

/**
 * Create Raw Timetable
 * POST /api/timetable
 *
 * Body:
 * {
 *   universitySchedule: [
 *     { title, subjectCode, type?, start, end, location? }
 *   ]
 * }
 */
export const createRawTimetable = async (req, res) => {
  try {
    const { universitySchedule } = req.body;

    if (!Array.isArray(universitySchedule) || universitySchedule.length === 0) {
      return res.status(400).json({
        success: false,
        message: "universitySchedule must be a non-empty array of subject blocks"
      });
    }

    const timetable = await Timetable.create({
      user: req.user._id,
      universitySchedule,
      optimizedSchedule: []
    });

    const conflicts = findScheduleConflicts(universitySchedule);

    return res.status(201).json({
      success: true,
      message: "Timetable saved successfully",
      data: {
        timetable,
        conflicts,
        hasConflicts: conflicts.length > 0
      }
    });
  } catch (error) {
    console.error("Create timetable error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to save timetable",
      error: error.message
    });
  }
};

/**
 * Get User Timetable
 * GET /api/timetable/:userId
 *
 * Returns the latest timetable for the user.
 */
export const getUserTimetable = async (req, res) => {
  try {
    const { userId } = req.params;

    // Only allow users to access their own timetable (or admins)
    if (req.user.role !== "admin" && String(req.user._id) !== String(userId)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view this timetable"
      });
    }

    const timetable = await Timetable.findOne({ user: userId })
      .sort({ createdAt: -1 })
      .lean();

    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: "No timetable found for this user"
      });
    }

    return res.status(200).json({
      success: true,
      data: timetable
    });
  } catch (error) {
    console.error("Get timetable error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch timetable",
      error: error.message
    });
  }
};

/**
 * Generate Optimized Timetable (Rule-based)
 * POST /api/timetable/generate
 *
 * Body:
 * {
 *   difficultyLevels: { [subjectCode]: "easy" | "medium" | "hard" },
 *   preferredStudyHours: { startHour: number, endHour: number }
 * }
 */
export const generateOptimizedTimetable = async (req, res) => {
  try {
    const { difficultyLevels, preferredStudyHours } = req.body || {};

    // Get latest timetable for the current user
    const timetable = await Timetable.findOne({ user: req.user._id })
      .sort({ createdAt: -1 });

    if (!timetable || !Array.isArray(timetable.universitySchedule) || timetable.universitySchedule.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No base university timetable found for this user"
      });
    }

    const optimizedSchedule = generateOptimizedSchedule(
      timetable.universitySchedule,
      { difficultyLevels, preferredStudyHours }
    );

    timetable.optimizedSchedule = optimizedSchedule;
    await timetable.save();

    const conflicts = findScheduleConflicts(optimizedSchedule);

    return res.status(200).json({
      success: true,
      message: "Optimized timetable generated successfully",
      data: {
        timetable,
        conflicts,
        hasConflicts: conflicts.length > 0
      }
    });
  } catch (error) {
    console.error("Generate optimized timetable error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate optimized timetable",
      error: error.message
    });
  }
};

/**
 * Dashboard Ongoing Event
 * GET /api/timetable/ongoing
 *
 * Returns the current active event from the optimized schedule (or fallback to university schedule).
 */
export const getOngoingEvent = async (req, res) => {
  try {
    const now = new Date();

    const timetable = await Timetable.findOne({ user: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: "No timetable found for this user"
      });
    }

    const sourceSchedule = (timetable.optimizedSchedule && timetable.optimizedSchedule.length > 0)
      ? timetable.optimizedSchedule
      : timetable.universitySchedule;

    const currentEvent = sourceSchedule.find((event) => {
      const start = new Date(event.start);
      const end = new Date(event.end);
      return start <= now && now <= end;
    });

    return res.status(200).json({
      success: true,
      data: currentEvent || null
    });
  } catch (error) {
    console.error("Get ongoing event error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch ongoing event",
      error: error.message
    });
  }
};

const GOOGLE_CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.events";
const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

/**
 * Get Google OAuth URL for Calendar (uses GOOGLE_CLIENT_ID from .env)
 * GET /api/timetable/google-auth-url
 */
export const getGoogleAuthUrl = async (req, res) => {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const apiUrl = (process.env.API_URL || `http://localhost:${process.env.PORT || 5000}`).replace(/\/$/, "");
    const clientUrl = (process.env.CLIENT_URL || "http://localhost:5173").replace(/\/$/, "");

    if (!clientId) {
      return res.status(500).json({
        success: false,
        message: "GOOGLE_CLIENT_ID is not configured"
      });
    }

    const redirectUri = `${apiUrl}/api/timetable/google-callback`;
    const state = String(req.user._id);
    const url = `${GOOGLE_AUTH_URL}?${new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: GOOGLE_CALENDAR_SCOPE,
      state,
      access_type: "offline",
      prompt: "consent"
    })}`;

    return res.status(200).json({
      success: true,
      data: { url, redirectUri }
    });
  } catch (error) {
    console.error("Google auth URL error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to build Google auth URL",
      error: error.message
    });
  }
};

/**
 * Google OAuth callback (no auth – called by Google with ?code= & state=userId)
 * GET /api/timetable/google-callback
 * Uses GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET from .env.
 */
export const googleCallback = async (req, res) => {
  try {
    const { code, state } = req.query;
    const clientUrl = (process.env.CLIENT_URL || "http://localhost:5173").replace(/\/$/, "");
    const apiUrl = (process.env.API_URL || `http://localhost:${process.env.PORT || 5000}`).replace(/\/$/, "");

    if (!code || !state) {
      return res.redirect(`${clientUrl}/timetable?google_error=missing_code_or_state`);
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      return res.redirect(`${clientUrl}/timetable?google_error=server_not_configured`);
    }

    const redirectUri = `${apiUrl}/api/timetable/google-callback`;
    const tokenRes = await axios.post(
      GOOGLE_TOKEN_URL,
      new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code"
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const accessToken = tokenRes.data?.access_token;
    const refreshToken = tokenRes.data?.refresh_token;

    if (!accessToken) {
      return res.redirect(`${clientUrl}/timetable?google_error=no_token`);
    }

    await CalendarSync.findOneAndUpdate(
      { user: state },
      {
        googleRefreshToken: refreshToken || undefined,
        lastSyncedAt: new Date()
      },
      { upsert: true, new: true }
    );

    return res.redirect(`${clientUrl}/timetable?google_connected=1`);
  } catch (error) {
    console.error("Google callback error:", error?.response?.data || error.message);
    const clientUrl = (process.env.CLIENT_URL || "http://localhost:5173").replace(/\/$/, "");
    return res.redirect(`${clientUrl}/timetable?google_error=exchange_failed`);
  }
};

/**
 * Get a new access token from stored refresh token (uses GOOGLE_CLIENT_* from .env)
 */
async function getAccessTokenFromRefreshToken(refreshToken) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret || !refreshToken) return null;

  const res = await axios.post(
    GOOGLE_TOKEN_URL,
    new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token"
    }),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );
  return res.data?.access_token ?? null;
}

/**
 * Google Calendar Sync
 * POST /api/timetable/sync-google
 *
 * Body:
 * {
 *   accessToken?: string,   // optional if user already connected via OAuth (uses .env Google keys)
 *   refreshToken?: string   // optional, stored for future syncs
 * }
 * If accessToken is omitted, uses stored refresh token (from Connect Google flow) and GOOGLE_CLIENT_* from .env.
 */
export const syncGoogleCalendar = async (req, res) => {
  try {
    let accessToken = req.body?.accessToken;
    const refreshToken = req.body?.refreshToken;

    if (!accessToken) {
      const sync = await CalendarSync.findOne({ user: req.user._id }).select("+googleRefreshToken").lean();
      if (sync?.googleRefreshToken) {
        accessToken = await getAccessTokenFromRefreshToken(sync.googleRefreshToken);
      }
    }

    if (!accessToken) {
      return res.status(400).json({
        success: false,
        message: "No Google access token. Connect Google Calendar first (Connect Google button) or send accessToken."
      });
    }

    const timetable = await Timetable.findOne({ user: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    if (!timetable || !Array.isArray(timetable.optimizedSchedule) || timetable.optimizedSchedule.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No optimized timetable available to sync"
      });
    }

    const schedule = timetable.optimizedSchedule;
    const calendarEndpoint = "https://www.googleapis.com/calendar/v3/calendars/primary/events";

    const requests = schedule.map((event) => {
      const start = new Date(event.start);
      const end = new Date(event.end);
      const googleEvent = {
        summary: event.title,
        description: event.type === "study"
          ? "Study session generated by Smart Campus Companion"
          : "Class from university timetable",
        location: event.location || undefined,
        start: { dateTime: start.toISOString() },
        end: { dateTime: end.toISOString() }
      };
      return axios.post(calendarEndpoint, googleEvent, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        }
      });
    });

    await Promise.allSettled(requests);

    const update = { lastSyncedAt: new Date() };
    if (refreshToken) update.googleRefreshToken = refreshToken;

    await CalendarSync.findOneAndUpdate(
      { user: req.user._id },
      update,
      { upsert: true, new: true }
    );

    if (typeof req.user.googleCalendarConnected !== "undefined") {
      req.user.googleCalendarConnected = true;
      await req.user.save();
    }

    return res.status(200).json({
      success: true,
      message: "Timetable synced to Google Calendar (best-effort)."
    });
  } catch (error) {
    console.error("Google Calendar sync error:", error?.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to sync with Google Calendar",
      error: error?.response?.data || error.message
    });
  }
};

/**
 * AI Timetable Chat
 * POST /api/timetable/ai-chat
 *
 * Body:
 * {
 *   message: string,              // natural language description of classes/tasks
 *   googleAccessToken?: string    // optional, to immediately sync to Google Calendar
 * }
 *
 * Flow:
 * - Uses OpenAI to turn the message into structured events + preferences.
 * - Saves a new raw timetable for the user.
 * - Runs the rule-based optimizer.
 * - Optionally syncs the optimized schedule to Google Calendar.
 */
export const aiTimetableChat = async (req, res) => {
  try {
    const { message, googleAccessToken } = req.body || {};

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        success: false,
        message: "message is required and must be a string"
      });
    }

    try {
      assertOpenAIConfigured();
    } catch (e) {
      return res.status(e.status || 500).json({
        success: false,
        message: e.message || "OpenAI is not configured"
      });
    }

    // Ask OpenAI to extract a normalized timetable structure
    const systemPrompt = `You are an assistant that turns a student's free-text description of their classes,
deadlines, and study preferences into a structured timetable.

Return ONLY valid JSON (no markdown, no explanation) with this shape:
{
  "universitySchedule": [
    {
      "title": "string",
      "subjectCode": "string | null",
      "type": "lecture | lab | tutorial | exam | study | other",
      "start": "ISO 8601 datetime",
      "end": "ISO 8601 datetime",
      "location": "string | null"
    }
  ],
  "difficultyLevels": {
    "[subjectCode or title]": "easy | medium | hard"
  },
  "preferredStudyHours": {
    "startHour": number,   // 0-23
    "endHour": number      // 0-23
  }
}`;

    const data = await createChatCompletion({
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      temperature: 0.2
    });

    const rawContent = getChatCompletionText(data);
    if (!rawContent) {
      return res.status(500).json({
        success: false,
        message: "OpenAI did not return a usable response"
      });
    }

    let parsed;
    try {
      parsed = JSON.parse(rawContent);
    } catch (e) {
      // Sometimes the model may wrap JSON in text; try best-effort extraction
      try {
        const first = rawContent.indexOf("{");
        const last = rawContent.lastIndexOf("}");
        if (first !== -1 && last !== -1 && last > first) {
          parsed = JSON.parse(rawContent.slice(first, last + 1));
        } else {
          throw e;
        }
      } catch (e2) {
        return res.status(500).json({
          success: false,
          message: "Failed to parse AI response as JSON",
          error: e2.message
        });
      }
    }

    const universitySchedule = Array.isArray(parsed.universitySchedule)
      ? parsed.universitySchedule
      : [];

    if (universitySchedule.length === 0) {
      return res.status(400).json({
        success: false,
        message: "AI could not extract any timetable events from your message"
      });
    }

    // Basic normalization / safety
    const normalizedSchedule = universitySchedule
      .filter((e) => e.title && e.start && e.end)
      .map((e) => ({
        title: e.title,
        subjectCode: e.subjectCode || "",
        type: e.type || "lecture",
        start: new Date(e.start),
        end: new Date(e.end),
        location: e.location || ""
      }));

    const difficultyLevels = parsed.difficultyLevels || {};
    const preferredStudyHours = parsed.preferredStudyHours || {
      startHour: 18,
      endHour: 21
    };

    // Create or overwrite latest timetable for this user
    const timetable = await Timetable.create({
      user: req.user._id,
      universitySchedule: normalizedSchedule,
      optimizedSchedule: []
    });

    const optimizedSchedule = generateOptimizedSchedule(
      normalizedSchedule,
      { difficultyLevels, preferredStudyHours }
    );

    timetable.optimizedSchedule = optimizedSchedule;
    await timetable.save();

    const conflicts = findScheduleConflicts(optimizedSchedule);

    // Optionally sync to Google Calendar in the same step
    let calendarSyncResult = null;
    if (googleAccessToken) {
      try {
        const calendarEndpoint = "https://www.googleapis.com/calendar/v3/calendars/primary/events";
        const requests = optimizedSchedule.map((event) => {
          const start = new Date(event.start);
          const end = new Date(event.end);

          const googleEvent = {
            summary: event.title,
            description: event.type === "study"
              ? "Study session generated by Smart Campus Companion"
              : "Class from university timetable",
            location: event.location || undefined,
            start: {
              dateTime: start.toISOString()
            },
            end: {
              dateTime: end.toISOString()
            }
          };

          return axios.post(calendarEndpoint, googleEvent, {
            headers: {
              Authorization: `Bearer ${googleAccessToken}`,
              "Content-Type": "application/json"
            }
          });
        });

        const results = await Promise.allSettled(requests);

        await CalendarSync.findOneAndUpdate(
          { user: req.user._id },
          { lastSyncedAt: new Date() },
          { upsert: true, new: true }
        );

        calendarSyncResult = {
          attempted: true,
          successCount: results.filter((r) => r.status === "fulfilled").length,
          failureCount: results.filter((r) => r.status === "rejected").length
        };
      } catch (calendarError) {
        console.error("AI chat calendar sync error:", calendarError?.response?.data || calendarError.message);
        calendarSyncResult = {
          attempted: true,
          error: calendarError?.response?.data || calendarError.message
        };
      }
    }

    return res.status(200).json({
      success: true,
      message: googleAccessToken
        ? "AI-generated timetable created, optimized, and sent to Google Calendar (best-effort)."
        : "AI-generated timetable created and optimized.",
      data: {
        timetable,
        conflicts,
        hasConflicts: conflicts.length > 0,
        difficultyLevels,
        preferredStudyHours,
        calendarSyncResult
      }
    });
  } catch (error) {
    console.error("AI timetable chat error:", error?.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to process AI timetable request",
      error: error?.response?.data || error.message
    });
  }
};

