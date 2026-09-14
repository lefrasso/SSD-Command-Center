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

// ---- Proactive Dispatch escalation cadence (SSD Proactive Dispatch Management) ----
// Four CSA-owned steps, each one business day apart, escalating who's copied until the Resource
// Manager is looped in. Maps 1:1 onto the existing Day 0-3 outreach flags (day0 = Step 0, etc.).
export const T3W_STEPS = [
  {
    key: 'day0', stage: 'Step 0', name: 'Initial outreach',
    when: 'Start as soon as the dispatch is assigned; ideally at T-3 weeks or earlier.',
    owner: 'CSA',
    action: 'Email the CSAM to confirm the customer meeting, invite status, customer POC, and a 30-minute prep discussion.',
    advanceWhen: 'No CSAM response or customer meeting not confirmed after ~1 business day.',
    toRole: 'csam', ccRoles: ['podLead'],
    subject: (e) => `${e.program} — confirming kickoff meeting for ${e.customer}`,
    body: (e, c) => `Hi ${firstName(e.csamName)},\n\nI'm ${c.csaName}, assigned to deliver ${e.program} (${e.track}) for ${e.customer}. Could you confirm the customer meeting/invite status and the customer POC, and hold 30 minutes with me beforehand to prep?\n\nThanks,\n${c.csaName}`,
  },
  {
    key: 'day1', stage: 'Step 1', name: 'Follow-up',
    when: '~1 business day after Step 0 if no response or scheduling remains blocked.',
    owner: 'CSA',
    action: 'Reply on the original thread, restate the scheduling need, and offer to coordinate directly if helpful.',
    advanceWhen: 'No response, no invite, or no confirmed customer contact after 1 additional business day.',
    toRole: 'csam', ccRoles: ['podLead'],
    subject: (e) => `RE: ${e.program} — confirming kickoff meeting for ${e.customer}`,
    body: (e, c) => `Hi ${firstName(e.csamName)},\n\nFollowing up on my note below — I still need to confirm the customer meeting, invite and POC for ${e.customer}. Happy to coordinate directly with the customer if that's easier.\n\nThanks,\n${c.csaName}`,
  },
  {
    key: 'day2', stage: 'Step 2', name: 'Escalation',
    when: '~1 business day after Step 1 if scheduling or context is still blocked.',
    owner: 'CSA',
    action: 'Escalate on the original thread, ask for next steps or customer contact, and add the CSAM M1 for visibility.',
    advanceWhen: 'No response or no path to confirm the customer meeting after 1 additional business day.',
    toRole: 'csam', ccRoles: ['podLead', 'csamM1'],
    subject: (e) => `ESCALATION — ${e.program} kickoff still unconfirmed for ${e.customer}`,
    body: (e, c) => `Hi ${firstName(e.csamName)} (+${firstName(c.csamM1)}),\n\nThis is now blocking the delivery timeline for ${e.customer} — two prior notes have gone unanswered. Could you advise next steps or a direct customer contact so we can confirm the kickoff meeting?\n\nThanks,\n${c.csaName}`,
  },
  {
    key: 'day3', stage: 'Step 3', name: 'Final escalation',
    when: 'Use when Step 2 has not produced a confirmed meeting, POC or clear next action within 1 business day — or sooner if delivery readiness is at risk.',
    owner: 'CSA',
    action: 'Email the Resource Manager for the relevant time zone to help resolve scheduling and protect the delivery timeline.',
    advanceWhen: 'RM confirms next action, customer scheduling is resolved/cancelled, or a reassignment/reschedule path is needed.',
    toRole: 'resourceManager', ccRoles: ['csam', 'csamM1', 'podLead'],
    subject: (e) => `FINAL ESCALATION — ${e.program} kickoff unresolved for ${e.customer}, delivery timeline at risk`,
    body: (e, c) => `Hi ${firstName(c.resourceManager)},\n\nWe've been unable to confirm the kickoff meeting for ${e.customer} (${e.program}) despite two prior follow-ups with the CSAM. This now puts the delivery timeline at risk — could you help resolve scheduling, or advise on a reassignment/reschedule path?\n\nThanks,\n${c.csaName}`,
  },
];
const firstName = (name) => (name || '').split(' ')[0] || name || '';

// A stand-in "CSAM M1" per CSAM, since the prototype doesn't model a CSAM reporting line.
const CSAM_M1_BY_NAME = {
  'Julia Meyer': 'Grace Liu', 'Tom Baker': 'Owen Bishop', 'Sara Lind': 'Sofia Marín', 'Marcus Webb': 'Derek Voss', 'Elif Demir': 'Grace Liu',
  'Paulo Neto': 'Owen Bishop', 'Hannah Ross': 'Sofia Marín', 'Ken Adachi': 'Derek Voss', 'Bea Fontana': 'Grace Liu', 'Ivan Petrov': 'Owen Bishop',
};
export const csamM1For = (csamName) => CSAM_M1_BY_NAME[csamName] || 'the CSAM manager';

function podFor(engagement, d) {
  const csa = d.csas.find((c) => c.id === engagement.assignedTo);
  return csa ? d.pods.find((p) => p.id === csa.podId) : null;
}
export const podLeadFor = (engagement, d) => { const p = podFor(engagement, d); return (p && p.leadName) || 'the POD Lead'; };
// Step 3's "Resource Manager for the relevant time zone" — the prototype's closest stand-in is the
// CSA Manager who sits over the POD (between the TZ Lead and POD Leads).
export const resourceManagerFor = (engagement, d) => { const p = podFor(engagement, d); return (p && p.csaManager) || 'the Resource Manager'; };

// Everyone a step's To/Cc can resolve to, computed once per engagement.
export function t3wContacts(engagement, d, csaName) {
  return {
    csaName: csaName || 'your assigned Partner CSA', csam: engagement.csamName,
    podLead: podLeadFor(engagement, d), csamM1: csamM1For(engagement.csamName), resourceManager: resourceManagerFor(engagement, d),
  };
}
export function t3wDraft(step, engagement, d, csaName) {
  const c = t3wContacts(engagement, d, csaName);
  const roleName = { csam: c.csam, podLead: c.podLead, csamM1: c.csamM1, resourceManager: c.resourceManager };
  return { to: roleName[step.toRole], cc: step.ccRoles.map((r) => roleName[r]), subject: step.subject(engagement), body: step.body(engagement, c) };
}

// Business-day math for the "~1 business day" advance-to-next-step rule (skips Sat/Sun).
export function addBusinessDays(iso, days) {
  const d = new Date(iso);
  let added = 0;
  while (added < days) { d.setDate(d.getDate() + 1); if (d.getDay() !== 0 && d.getDay() !== 6) added++; }
  return d;
}
export const nextStepIndex = (engagement) => T3W_STEPS.findIndex((s) => !engagement.outreach[s.key]);
// Whether the current (next undone) step is "due" to be sent — Step 0 is always ready; later steps
// wait ~1 business day after the prior step's send time, matching each step's "move to next when".
export function isStepDue(engagement) {
  const idx = nextStepIndex(engagement);
  if (idx <= 0) return true;
  const prevLog = (engagement.outreachLog || []).find((l) => l.day === T3W_STEPS[idx - 1].key);
  if (!prevLog) return true;
  return Date.now() >= addBusinessDays(prevLog.at, 1).getTime();
}
