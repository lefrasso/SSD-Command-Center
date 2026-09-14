// T-3W (three-week proactive outreach window) — the single source of truth shared by Reports
// Pending and Agentic Delivery's Pre-delivery phase, so both compute the exact same status from
// the exact same rules. Pure module (no store import) — same "pinned now" as the rest of the app.
const NOW = Date.parse('2026-07-28T09:00:00Z');
export const T3W_WINDOW_DAYS = 21;

export const daysUntilDue = (engagement) => Math.round((Date.parse(engagement.dueDate) - NOW) / 864e5);
export const outreachCount = (engagement) => Object.values(engagement.outreach).filter(Boolean).length;

export const T3W_STATUS_LABEL = { overdue: 'Overdue', 'not-started': 'Not started', 'in-progress': 'In progress', 'on-track': 'On track' };

// Business rule (shared with Reports Pending): overdue if past due; not-started with 0 outreach;
// on-track with 3+ of the 4 Day 0-3 outreach touches logged; otherwise in-progress.
export function computeT3W(engagement) {
  const daysUntil = daysUntilDue(engagement);
  const outreach = outreachCount(engagement);
  const inWindow = daysUntil >= 0 && daysUntil <= T3W_WINDOW_DAYS;
  const status = daysUntil < 0 ? 'overdue' : outreach === 0 ? 'not-started' : outreach >= 3 ? 'on-track' : 'in-progress';
  return { daysUntil, outreach, inWindow, status, label: T3W_STATUS_LABEL[status] };
}

export function t3wReason(engagement) {
  if (outreachCount(engagement) === 0) return 'No proactive outreach (T-3W missed)';
  if (engagement.atRisk) return 'At-risk engagement';
  return 'Delivery running late';
}
