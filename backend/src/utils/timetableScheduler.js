/**
 * Detect overlapping events in a schedule.
 * Returns an array of conflict pairs: [{ a, b }, ...]
 */
export const findScheduleConflicts = (events = []) => {
  if (!Array.isArray(events) || events.length < 2) {
    return [];
  }

  const sorted = [...events].sort(
    (a, b) => new Date(a.start) - new Date(b.start)
  );

  const conflicts = [];

  for (let i = 0; i < sorted.length; i++) {
    const a = sorted[i];
    const aStart = new Date(a.start);
    const aEnd = new Date(a.end);

    for (let j = i + 1; j < sorted.length; j++) {
      const b = sorted[j];
      const bStart = new Date(b.start);
      const bEnd = new Date(b.end);

      // Since list is sorted by start time, if the next event starts
      // after the current one ends, no further conflicts with "a".
      if (bStart >= aEnd) {
        break;
      }

      const overlaps =
        aStart < bEnd &&
        bStart < aEnd;

      if (overlaps) {
        conflicts.push({ a, b });
      }
    }
  }

  return conflicts;
};

/**
 * Simple rule-based timetable optimizer.
 *
 * Inputs:
 * - universitySchedule: array of events (title, subjectCode, start, end, etc.)
 * - options: { difficultyLevels, preferredStudyHours }
 *
 * Behaviour:
 * - Adds study sessions based on subject difficulty.
 * - Tries to place sessions inside the preferredStudyHours window,
 *   avoiding overlaps with existing events where possible.
 *
 * Output:
 * - optimizedSchedule: array of events including added study blocks.
 */
export const generateOptimizedSchedule = (universitySchedule = [], options = {}) => {
  const {
    difficultyLevels = {},
    preferredStudyHours = { startHour: 18, endHour: 21 }
  } = options;

  // Clone base schedule so we don't mutate incoming data
  const optimized = [...universitySchedule];

  // Helper to get all events on a given calendar date
  const getEventsOnDate = (events, date) => {
    return events.filter((evt) => {
      const d = new Date(evt.start);
      return (
        d.getFullYear() === date.getFullYear() &&
        d.getMonth() === date.getMonth() &&
        d.getDate() === date.getDate()
      );
    });
  };

  // Group events by subjectCode to know what needs more study time
  const subjects = new Map();
  for (const event of universitySchedule) {
    const code = event.subjectCode || event.title;
    if (!code) continue;
    if (!subjects.has(code)) {
      subjects.set(code, []);
    }
    subjects.get(code).push(event);
  }

  const today = new Date();

  // For each subject, add a number of study blocks per week based on difficulty
  for (const [code] of subjects.entries()) {
    const difficulty = difficultyLevels[code] || "medium";

    let studySessionsPerWeek;
    let studyDurationMinutes;

    switch (difficulty) {
      case "easy":
        studySessionsPerWeek = 1;
        studyDurationMinutes = 45;
        break;
      case "hard":
        studySessionsPerWeek = 3;
        studyDurationMinutes = 90;
        break;
      case "medium":
      default:
        studySessionsPerWeek = 2;
        studyDurationMinutes = 60;
        break;
    }

    for (let i = 0; i < studySessionsPerWeek; i++) {
      const baseDate = new Date(today);
      baseDate.setDate(today.getDate() + i); // spread across upcoming days

      // Try to find a free slot within the preferred window on this day
      const dayEvents = getEventsOnDate(optimized, baseDate).sort(
        (a, b) => new Date(a.start) - new Date(b.start)
      );

      // Start with preferred window
      let slotStart = new Date(baseDate);
      slotStart.setHours(preferredStudyHours.startHour, 0, 0, 0);

      const windowEnd = new Date(baseDate);
      windowEnd.setHours(preferredStudyHours.endHour, 0, 0, 0);

      let placed = false;

      const fitsInWindow = (start) => {
        const end = new Date(start);
        end.setMinutes(end.getMinutes() + studyDurationMinutes);
        return end <= windowEnd;
      };

      // Slide the study block after any overlapping classes until we find a gap
      for (const evt of dayEvents) {
        const evtStart = new Date(evt.start);
        const evtEnd = new Date(evt.end);

        // If our proposed slot ends before this event starts, we are good
        const proposedEnd = new Date(slotStart);
        proposedEnd.setMinutes(proposedEnd.getMinutes() + studyDurationMinutes);

        if (proposedEnd <= evtStart) {
          if (fitsInWindow(slotStart)) {
            placed = true;
          }
          break;
        }

        // If our slot overlaps this event, push it to after the class
        if (slotStart < evtEnd && proposedEnd > evtStart) {
          slotStart = new Date(evtEnd);
        }
      }

      // If we went through all events and still haven't placed, try at final slotStart
      if (!placed && fitsInWindow(slotStart)) {
        placed = true;
      }

      if (!placed) {
        // Could not fit this session into the preferred window without conflicts
        continue;
      }

      const finalStart = new Date(slotStart);
      const finalEnd = new Date(finalStart);
      finalEnd.setMinutes(finalEnd.getMinutes() + studyDurationMinutes);

      optimized.push({
        title: `${code} - Study Session`,
        subjectCode: code,
        type: "study",
        start: finalStart,
        end: finalEnd,
        location: "Self-study",
        metadata: {
          difficulty,
          generated: true
        }
      });
    }
  }

  // Basic sort by start time
  optimized.sort((a, b) => new Date(a.start) - new Date(b.start));

  return optimized;
};

