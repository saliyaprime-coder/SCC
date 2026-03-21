import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Brain,
  Plus,
  Sparkles,
  UploadCloud,
  Clock,
  AlertCircle
} from "lucide-react";
import {
  createRawTimetable,
  generateOptimizedTimetable,
  getUserTimetable,
  getGoogleAuthUrl,
  syncGoogleCalendar,
  aiTimetableChat
} from "../services/timetableService";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";

const defaultPreferredStudyHours = {
  startHour: 18,
  endHour: 21
};

const Timetable = () => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [universitySchedule, setUniversitySchedule] = useState([]);
  const [difficultyLevels, setDifficultyLevels] = useState({});
  const [preferredStudyHours, setPreferredStudyHours] = useState(
    defaultPreferredStudyHours
  );
  const [optimizedSchedule, setOptimizedSchedule] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [googleAccessToken, setGoogleAccessToken] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [connectingGoogle, setConnectingGoogle] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const googleConnected = params.get("google_connected");
    const googleError = params.get("google_error");
    if (googleConnected === "1") {
      setSuccess("Google Calendar connected. You can sync your timetable without pasting a token.");
      window.history.replaceState({}, "", window.location.pathname);
    } else if (googleError) {
      setError(`Google connection failed: ${googleError}`);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    const fetchTimetable = async () => {
      if (!user?._id) return;
      try {
        setLoading(true);
        const data = await getUserTimetable(user._id);
        setUniversitySchedule(data.universitySchedule || []);
        setOptimizedSchedule(data.optimizedSchedule || []);
      } catch {
        // Ignore if no timetable exists yet
      } finally {
        setLoading(false);
      }
    };

    fetchTimetable();
  }, [isAuthenticated, navigate, user]);

  const handleAddEmptyEvent = () => {
    setUniversitySchedule((prev) => [
      ...prev,
      {
        title: "",
        subjectCode: "",
        type: "lecture",
        start: "",
        end: "",
        location: ""
      }
    ]);
  };

  const handleChangeEventField = (index, field, value) => {
    setUniversitySchedule((prev) =>
      prev.map((event, i) =>
        i === index
          ? {
              ...event,
              [field]: value
            }
          : event
      )
    );
  };

  const handleChangeDifficulty = (subjectCode, value) => {
    setDifficultyLevels((prev) => ({
      ...prev,
      [subjectCode]: value
    }));
  };

  const handleSaveTimetable = async () => {
    setError("");
    setSuccess("");
    setConflicts([]);
    try {
      setSaving(true);

      const normalizedSchedule = universitySchedule
        .filter((e) => e.title && e.start && e.end)
        .map((e) => ({
          ...e,
          start: new Date(e.start).toISOString(),
          end: new Date(e.end).toISOString()
        }));

      const { timetable, conflicts: foundConflicts = [], hasConflicts } =
        await createRawTimetable(normalizedSchedule);

      setUniversitySchedule(timetable.universitySchedule || []);
      setOptimizedSchedule(timetable.optimizedSchedule || []);
      setConflicts(foundConflicts);
      setSuccess(
        hasConflicts
          ? "Timetable saved. We found some overlapping events to review."
          : "Timetable saved successfully."
      );
    } catch (err) {
      setError(err.message || "Failed to save timetable");
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateOptimized = async () => {
    setError("");
    setSuccess("");
    setConflicts([]);
    try {
      setGenerating(true);
      const {
        timetable,
        conflicts: foundConflicts = [],
        hasConflicts
      } = await generateOptimizedTimetable({
        difficultyLevels,
        preferredStudyHours
      });
      setOptimizedSchedule(timetable.optimizedSchedule || []);
      setConflicts(foundConflicts);
      setSuccess(
        hasConflicts
          ? "Optimized timetable generated with some overlapping events to review."
          : "Optimized timetable generated."
      );
    } catch (err) {
      setError(err.message || "Failed to generate optimized timetable");
    } finally {
      setGenerating(false);
    }
  };

  const handleConnectGoogle = async () => {
    setError("");
    setSuccess("");
    try {
      setConnectingGoogle(true);
      const { url } = await getGoogleAuthUrl();
      window.location.href = url;
    } catch (err) {
      setError(err.message || "Failed to get Google sign-in URL");
      setConnectingGoogle(false);
    }
  };

  const handleSyncGoogle = async () => {
    setError("");
    setSuccess("");
    try {
      setSyncing(true);
      await syncGoogleCalendar(
        googleAccessToken ? { accessToken: googleAccessToken } : {}
      );
      setSuccess("Synced to Google Calendar (best-effort).");
    } catch (err) {
      setError(err.message || "Failed to sync with Google Calendar");
    } finally {
      setSyncing(false);
    }
  };

  const handleAiChatGenerate = async () => {
    setError("");
    setSuccess("");
    setConflicts([]);
    try {
      if (!aiPrompt.trim()) {
        setError("Please describe your classes or study plan for the AI.");
        return;
      }
      setAiLoading(true);
      const {
        timetable,
        conflicts: foundConflicts = [],
        hasConflicts
      } = await aiTimetableChat({
        message: aiPrompt,
        googleAccessToken: googleAccessToken || undefined
      });

      setUniversitySchedule(timetable.universitySchedule || []);
      setOptimizedSchedule(timetable.optimizedSchedule || []);
      setConflicts(foundConflicts);
      setSuccess(
        googleAccessToken
          ? hasConflicts
            ? "AI created and synced an optimized timetable, with some overlaps to review."
            : "AI created and synced an optimized timetable to Google Calendar."
          : hasConflicts
          ? "AI created an optimized timetable with some overlaps to review."
          : "AI created an optimized timetable for you."
      );
    } catch (err) {
      setError(err.message || "Failed to generate timetable from AI chat");
    } finally {
      setAiLoading(false);
    }
  };

  const hasTimetable = useMemo(
    () => universitySchedule.length > 0 || optimizedSchedule.length > 0,
    [universitySchedule.length, optimizedSchedule.length]
  );

  if (!user) {
    return <LoadingSpinner text="Loading timetable..." />;
  }

  return (
    <div className="dashboard-container">
      <nav className="dashboard-nav fade-in">
        <div className="nav-brand">
          <Calendar size={32} style={{ color: "var(--color-primary-600)" }} />
          <h2>AI Timetable</h2>
        </div>
        <div className="nav-links">
          <button
            type="button"
            className="nav-link"
            onClick={() => navigate("/dashboard")}
          >
            Dashboard
          </button>
        </div>
      </nav>

      <div className="dashboard-content">
        <div className="welcome-section fade-in" style={{ marginBottom: "2rem" }}>
          <div style={{ position: "relative", zIndex: 1 }}>
            <h1>
              Smart timetable for{" "}
              {user.name.split(" ")[0]}
            </h1>
            <p className="user-info">
              Feed your raw university schedule, then let the{" "}
              <strong>rule-based engine</strong> generate a personalized study
              plan you can sync to Google Calendar.
            </p>
          </div>
        </div>

        {error && (
          <div className="alert alert-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="alert alert-success">
            <Sparkles size={16} />
            <span>{success}</span>
          </div>
        )}
        {conflicts.length > 0 && (
          <div className="alert alert-warning">
            <AlertCircle size={16} />
            <span>
              Detected {conflicts.length} overlapping time slot
              {conflicts.length > 1 ? "s" : ""}. Review your timetable to avoid
              clashes.
            </span>
          </div>
        )}

        <div
          className="card fade-in"
          style={{ marginBottom: "2rem", animationDelay: "40ms" }}
        >
          <div className="card-header">
            <h3 className="card-title">
              <Brain size={20} style={{ marginRight: 8 }} />
              AI chat timetable assistant
            </h3>
            <p className="card-description">
              Describe your week in natural language (classes, preferred study time,
              exams), and let the AI build and optimize your timetable. If you fill in
              the Google token below, it will also sync to your calendar.
            </p>
          </div>
          <div className="card-body">
            <div className="form-field">
              <label className="form-label">Tell the AI about your schedule</label>
              <textarea
                className="form-textarea"
                rows={4}
                placeholder="Example: I have Math 101 lectures Monday and Wednesday 9-11am, CS201 labs Friday 2-4pm, I want at least 2 hours of study per day between 7pm and 10pm, and avoid Sunday evenings..."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
              />
            </div>
          </div>
          <div className="card-footer">
            <button
              type="button"
              className={`btn btn-success ${aiLoading ? "loading" : ""}`}
              onClick={handleAiChatGenerate}
              disabled={aiLoading}
            >
              <Sparkles size={16} />
              Generate timetable from AI chat
            </button>
          </div>
        </div>

        <div
          className="card fade-in"
          style={{ marginBottom: "2rem", animationDelay: "80ms" }}
        >
          <div className="card-header">
            <h3 className="card-title">
              <Brain size={20} style={{ marginRight: 8 }} />
              University timetable
            </h3>
            <p className="card-description">
              Paste in your current university classes. These blocks are the
              foundation the scheduler uses.
            </p>
          </div>

          {universitySchedule.length === 0 && (
            <EmptyState
              title="No timetable yet"
              description="Add your first subject block to get started."
            />
          )}

          <div className="card-body">
            {universitySchedule.map((event, index) => (
              <div
                key={index}
                className="profile-info-item"
                style={{ marginBottom: "1rem" }}
              >
                <div className="form-row">
                  <div className="form-field">
                    <label className="form-label">Title</label>
                    <input
                      className="form-input"
                      value={event.title}
                      onChange={(e) =>
                        handleChangeEventField(index, "title", e.target.value)
                      }
                      placeholder="e.g. Data Structures Lecture"
                    />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Subject code</label>
                    <input
                      className="form-input"
                      value={event.subjectCode}
                      onChange={(e) =>
                        handleChangeEventField(index, "subjectCode", e.target.value)
                      }
                      placeholder="e.g. CS201"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-field">
                    <label className="form-label">Start</label>
                    <input
                      type="datetime-local"
                      className="form-input"
                      value={event.start}
                      onChange={(e) =>
                        handleChangeEventField(index, "start", e.target.value)
                      }
                    />
                  </div>
                  <div className="form-field">
                    <label className="form-label">End</label>
                    <input
                      type="datetime-local"
                      className="form-input"
                      value={event.end}
                      onChange={(e) =>
                        handleChangeEventField(index, "end", e.target.value)
                      }
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-field">
                    <label className="form-label">Location</label>
                    <input
                      className="form-input"
                      value={event.location}
                      onChange={(e) =>
                        handleChangeEventField(index, "location", e.target.value)
                      }
                      placeholder="e.g. Room B12"
                    />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Difficulty</label>
                    <select
                      className="form-select"
                      value={
                        difficultyLevels[event.subjectCode || event.title] || "medium"
                      }
                      onChange={(e) =>
                        handleChangeDifficulty(
                          event.subjectCode || event.title,
                          e.target.value
                        )
                      }
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              className="btn btn-outline"
              onClick={handleAddEmptyEvent}
            >
              <Plus size={16} />
              Add subject block
            </button>
          </div>

          <div className="card-footer">
            <button
              type="button"
              className={`btn btn-primary ${saving ? "loading" : ""}`}
              onClick={handleSaveTimetable}
              disabled={saving || universitySchedule.length === 0}
            >
              Save timetable
            </button>
          </div>
        </div>

        <div
          className="card fade-in"
          style={{ marginBottom: "2rem", animationDelay: "160ms" }}
        >
          <div className="card-header">
            <h3 className="card-title">
              <Sparkles size={20} style={{ marginRight: 8 }} />
              Generate optimized study plan
            </h3>
            <p className="card-description">
              Configure your preferred evening study window and let the engine
              sprinkle in focused sessions based on difficulty.
            </p>
          </div>

          <div className="card-body">
            <div className="form-row">
              <div className="form-field">
                <label className="form-label">Preferred start hour</label>
                <input
                  type="number"
                  className="form-input"
                  min={0}
                  max={23}
                  value={preferredStudyHours.startHour}
                  onChange={(e) =>
                    setPreferredStudyHours((prev) => ({
                      ...prev,
                      startHour: Number(e.target.value)
                    }))
                  }
                />
                <p className="form-hint">24h format, 0–23</p>
              </div>
              <div className="form-field">
                <label className="form-label">Preferred end hour</label>
                <input
                  type="number"
                  className="form-input"
                  min={0}
                  max={23}
                  value={preferredStudyHours.endHour}
                  onChange={(e) =>
                    setPreferredStudyHours((prev) => ({
                      ...prev,
                      endHour: Number(e.target.value)
                    }))
                  }
                />
                <p className="form-hint">24h format, 0–23</p>
              </div>
            </div>
          </div>

          <div className="card-footer">
            <button
              type="button"
              className={`btn btn-success ${generating ? "loading" : ""}`}
              onClick={handleGenerateOptimized}
              disabled={generating || universitySchedule.length === 0}
            >
              <Brain size={16} />
              Generate optimized timetable
            </button>
          </div>
        </div>

        <div
          className="card fade-in"
          style={{ marginBottom: "2rem", animationDelay: "240ms" }}
        >
          <div className="card-header">
            <h3 className="card-title">
              <Clock size={20} style={{ marginRight: 8 }} />
              Optimized schedule preview
            </h3>
            <p className="card-description">
              This is what will be pushed to Google Calendar. Study sessions are
              labeled and color-coded by difficulty.
            </p>
          </div>

          <div className="card-body">
            {!hasTimetable && (
              <EmptyState
                title="No schedule yet"
                description="Save a base timetable and generate an optimized plan to see your upcoming events."
              />
            )}

            {hasTimetable && (
              <div className="profile-info">
                {(optimizedSchedule.length > 0
                  ? optimizedSchedule
                  : universitySchedule
                ).map((event, index) => (
                  <div key={index} className="profile-info-item">
                    <strong>{event.title}</strong>
                    <span>
                      {event.subjectCode && `${event.subjectCode} • `}
                      {event.type === "study" ? "Study session" : "Class"}
                    </span>
                    <span>
                      {new Date(event.start).toLocaleString()} –{" "}
                      {new Date(event.end).toLocaleString()}
                    </span>
                    {event.location && <span>{event.location}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="card fade-in" style={{ animationDelay: "320ms" }}>
          <div className="card-header">
            <h3 className="card-title">
              <UploadCloud size={20} style={{ marginRight: 8 }} />
              Sync to Google Calendar
            </h3>
            <p className="card-description">
              Connect with Google (uses your app&apos;s Google keys from .env), then sync the
              optimized schedule to your primary Google Calendar. Or paste an access token if you have one.
            </p>
          </div>

          <div className="card-body">
            <div className="form-field">
              <label className="form-label">Connect with Google (recommended)</label>
              <button
                type="button"
                className={`btn btn-outline ${connectingGoogle ? "loading" : ""}`}
                onClick={handleConnectGoogle}
                disabled={connectingGoogle}
              >
                Connect Google Calendar
              </button>
              <p className="form-hint">
                Uses GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET from backend .env. Add the callback URL in Google Cloud Console: your API_URL + /api/timetable/google-callback
              </p>
            </div>
            <div className="form-field">
              <label className="form-label">Or paste access token (optional)</label>
              <textarea
                className="form-textarea"
                rows={2}
                placeholder="Optional: paste a Google OAuth access token..."
                value={googleAccessToken}
                onChange={(e) => setGoogleAccessToken(e.target.value)}
              />
            </div>
          </div>

          <div className="card-footer">
            <button
              type="button"
              className={`btn btn-primary ${syncing ? "loading" : ""}`}
              onClick={handleSyncGoogle}
              disabled={syncing || optimizedSchedule.length === 0}
            >
              Sync optimized schedule
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Timetable;

