// Agentic Delivery — per-engagement support agents. SIMULATED. Deterministic, data-driven (same
// approach as ai.js / ipFeedbackAgents.js) — no network calls, no store import (kept pure so both
// the view and the seed-data generator can use it without a circular import).
import { computeT3W } from './t3w.js';
import { OPS_AGENTS, runOpsAgentById } from './opsAutomation.js';

// Agentic Delivery stages are the Engagement Backlog statuses themselves — every engagement's
// agent execution moves through the exact same 4 stages as its dispatch status, so "where is this
// in agentic delivery" always matches "where is this in the backlog".
export const STAGES = [
  ['new', 'New'],
  ['assigned', 'Assigned'],
  ['in-delivery', 'In delivery'],
  ['complete', 'Complete'],
];

// Every agent runs under one of these schedules — "on-stage-change" (the default) re-runs an agent
// whenever the engagement moves to a new stage; "manual" never runs itself, only on explicit request.
export const SCHEDULES = [
  ['on-phase-change', 'On stage change'],
  ['daily', 'Daily'],
  ['weekly', 'Weekly'],
  ['manual', 'Manual only'],
];
export const SCHEDULE_INTERVAL_MS = { daily: 24 * 60 * 60 * 1000, weekly: 7 * 24 * 60 * 60 * 1000 };

// The stage shown everywhere in Agentic Delivery is simply the engagement's backlog status.
export function stageForEngagement(e) { return e.status; }

// Domain content (expert tips + common-agent copy below) was authored around 3 delivery moments;
// 'new' and 'assigned' share the pre-delivery read since a CSA isn't dispatched yet at 'new'. This
// maps the 4 visible stages down to that content, without duplicating every tip four ways.
function contentStage(stage) {
  if (stage === 'complete') return 'post-delivery';
  if (stage === 'in-delivery') return 'delivery';
  return 'pre-delivery';
}

// Common agents work every engagement, regardless of track — the "always-on" crew.
export const COMMON_AGENTS = [
  { id: 'signal-scout', name: 'Signal Scout', role: 'Account & CPE insights', icon: 'database', blurb: 'Pulls MSX account context, CPE trend and Engage Center activity into one read.' },
  { id: 'outreach-concierge', name: 'Outreach Concierge', role: 'CSAM & customer communications', icon: 'send', blurb: 'Tracks the outreach cadence and drafts the next CSAM or customer email.' },
  { id: 'chronicle-keeper', name: 'Chronicle Keeper', role: 'Content prep & close-out', icon: 'report', blurb: 'Prepares kickoff content, milestone deliverables and the close-out package.' },
  { id: 'survey-herald', name: 'Survey Herald', role: 'CPE/VSAT survey reminders', icon: 'star', blurb: 'Times the CPE/VSAT survey ask and chases a response if one is missing.' },
  { id: 'escalation-sentinel', name: 'Escalation Sentinel', role: 'Risk monitoring & support routing', icon: 'warning', blurb: 'Watches for risk signals and is the fast path to an urgent support request.' },
];

// One specialist per Family/Track — deep on that delivery domain, on top of the common crew.
export const EXPERT_AGENTS = {
  Health: {
    id: 'crisis-readiness-advisor', name: 'Crisis Readiness Advisor', role: 'Health delivery specialist', icon: 'lock', track: 'Health',
    tips: {
      'pre-delivery': [
        { text: 'Confirm business-continuity stakeholders are looped in before kickoff.' },
        { rx: /crisis/i, text: 'For a Crisis Management simulation, pre-stage the scenario script 48h ahead.' },
        { rx: /esa/i, text: 'For an ESA, request the tenant Secure Score export ahead of the assessment session.' },
      ],
      delivery: [
        { text: 'Re-validate incident response contacts are current mid-engagement.' },
        { rx: /crisis/i, text: 'Debrief stakeholders immediately after each simulation exercise.' },
        { rx: /esa/i, text: 'Cross-check findings against the latest Secure Score baseline.' },
      ],
      'post-delivery': [
        { text: 'Package the Recommended Practices as a standalone leave-behind.' },
        { text: 'Flag any critical findings for the CSAM to track after close.' },
      ],
    },
  },
  'AI Innovation': {
    id: 'copilot-adoption-strategist', name: 'Copilot Adoption Strategist', role: 'AI Innovation delivery specialist', icon: 'sparkle', track: 'AI Innovation',
    tips: {
      'pre-delivery': [
        { text: 'Confirm Copilot licensing and eligible personas before the workshop.' },
        { rx: /secure copilot/i, text: 'Loop in security/compliance stakeholders before the Secure Copilot session.' },
        { rx: /agents/i, text: 'Scope 1–2 candidate agent scenarios with the customer sponsor up front.' },
        { rx: /adoption/i, text: 'Align on 2–3 target use cases with the customer sponsor.' },
      ],
      delivery: [
        { text: 'Track adoption blockers — change management and licensing — as they surface.' },
        { text: 'Capture quick-win prompts the customer can reuse immediately.' },
      ],
      'post-delivery': [
        { text: 'Nominate this for a Success Story if adoption signals are strong.' },
        { text: 'Share the Copilot Center of Excellence as a follow-on track.' },
      ],
    },
  },
  'Cloud Deployment': {
    id: 'landing-zone-architect', name: 'Landing Zone Architect', role: 'Cloud Deployment delivery specialist', icon: 'building', track: 'Cloud Deployment',
    tips: {
      'pre-delivery': [
        { text: 'Validate subscription/tenant topology before the design session.' },
        { rx: /macc|air/i, text: 'Confirm FinOps stakeholders are included from day one.' },
        { rx: /github copilot/i, text: 'Confirm repository access and org policy before the trial starts.' },
      ],
      delivery: [
        { text: 'Watch for scope creep beyond the agreed footprint.' },
        { rx: /cloud modernization/i, text: 'Re-validate the migration wave plan against actual readiness.' },
      ],
      'post-delivery': [
        { text: 'Hand off the Landing Zone Playbook with environment-specific notes.' },
        { text: 'Flag any reusable-IP improvements back to the IP Lead.' },
      ],
    },
  },
  Foundations: {
    id: 'enablement-navigator', name: 'Enablement Navigator', role: 'Foundations delivery specialist', icon: 'flag', track: 'Foundations',
    tips: {
      'pre-delivery': [
        { text: 'Confirm attendee roles match the Foundations curriculum track.' },
        { text: 'Pre-share the onboarding kit 24h before the session.' },
      ],
      delivery: [
        { rx: /capability briefing/i, text: 'Check engagement on the capability briefing content as it runs.' },
        { text: 'Surface any customer questions that need a specialist follow-up.' },
      ],
      'post-delivery': [
        { text: 'Recommend a next-step Foundations or Cloud Deployment offering.' },
        { text: "Log common questions to improve the next cohort's kit." },
      ],
    },
  },
};

function signalScout(engagement, d, phase) {
  // CPE (not the decoupled Session Health Signals) is the one system of record legitimately scoped
  // to this specific engagement/customer, so it's the read used here — see Session Health Signals'
  // POD/track-only attribution policy.
  const cpeForEng = d.cpe.filter((c) => c.engagementId === engagement.id);
  const activity = d.messages.filter((m) => m.engagementId === engagement.id);
  const avg = cpeForEng.length ? cpeForEng.reduce((sum, c) => sum + c.score, 0) / cpeForEng.length : null;
  const cxRead = avg == null ? 'no CPE signal on file yet' : avg >= 4.3 ? `CPE trending positive (${avg.toFixed(1)}/5 avg across ${cpeForEng.length} response(s))` : avg <= 3.6 ? `CPE trending negative (${avg.toFixed(1)}/5 avg across ${cpeForEng.length} response(s)) — watch closely` : `CPE steady/neutral (${avg.toFixed(1)}/5 avg across ${cpeForEng.length} response(s))`;
  const account = `MSX: ${engagement.customer}${engagement.s500Customer ? ' — S500 strategic account' : ''}, ${engagement.program} (${engagement.track})`;
  const engage = `Engage Center: ${activity.length} logged touchpoint(s)${activity.length ? ` — last on ${activity[activity.length - 1].timestamp.slice(0, 10)}` : ''}.`;
  const lead = phase === 'pre-delivery' ? 'Baseline read before kickoff.' : phase === 'delivery' ? 'Mid-engagement pulse check.' : 'Final read for the close-out record.';
  return { text: `${lead} ${account}. ${cxRead}. ${engage}` };
}

function outreachConcierge(engagement, d, phase) {
  const o = engagement.outreach;
  if (phase === 'pre-delivery') {
    const pending = ['day0', 'day1'].filter((k) => !o[k]);
    const t3w = computeT3W(engagement);
    const t3wNote = t3w.inWindow
      ? ` T-3W: due in ${t3w.daysUntil}d, proactive status "${t3w.label}" (${t3w.outreach}/4 outreach logged).`
      : t3w.status === 'overdue' ? ` T-3W: ${Math.abs(t3w.daysUntil)}d past due with no report — flag it in Reports Pending.` : '';
    return { text: `${pending.length ? `Day 0–1 outreach still pending — ready to draft the kickoff introduction to ${engagement.csamName}.` : 'Day 0–1 outreach is logged — ready to draft the Day 1 stakeholder sync invite.'}${t3wNote}` };
  }
  if (phase === 'delivery') {
    const pending = ['day2', 'day3'].filter((k) => !o[k]);
    return { text: pending.length ? `${pending.length} outreach check-in(s) not yet logged (${pending.map((k) => k.replace('day', 'Day ')).join(', ')}) — drafting a cadence reminder to the CSA.` : 'Outreach cadence is fully on track — no reminder needed this cycle.' };
  }
  return { text: `Ready to draft a customer thank-you and next-steps email to ${engagement.csamName} for close-out.` };
}

function chronicleKeeper(engagement, d, phase) {
  if (phase === 'pre-delivery') return { text: `Kickoff content pack staged from the ${engagement.program} IP Kit — intro deck and agenda ready to send.` };
  if (phase === 'delivery') {
    const next = engagement.milestones.find((m) => !m.done);
    return { text: next ? `Preparing content for the next milestone — "${next.label}" (due ${next.due}).` : 'All milestones drafted — preparing the final handover package.' };
  }
  const done = engagement.milestones.filter((m) => m.done).length;
  return { text: `Close-out summary drafted — ${done}/${engagement.milestones.length} milestones complete, ready for CSAM sign-off.` };
}

function surveyHerald(engagement, d, phase) {
  const survey = d.cpe.find((c) => c.engagementId === engagement.id);
  if (phase === 'pre-delivery') return { text: 'Survey ask is scheduled for after the final milestone — nothing due yet.' };
  if (phase === 'delivery') return { text: survey ? `A response is already on file (score ${survey.score}) — will confirm nothing further is needed at close.` : 'Reminder queued to go out 5 business days after the final milestone.' };
  return survey ? { text: `CPE/VSAT received — score ${survey.score}. No further reminder needed.` } : { text: `No survey response yet — sending a reminder to ${engagement.csamName}.` };
}

function escalationSentinel(engagement, d, phase) {
  const openEsc = d.escalations.filter((e) => e.engagementId === engagement.id && e.status !== 'resolved');
  const doneCount = engagement.milestones.filter((m) => m.done).length;
  const behind = doneCount < engagement.milestones.length && engagement.atRisk;
  if (openEsc.length) return { text: `${openEsc.length} open escalation(s) linked to this delivery — highest severity ${openEsc[0].severity.toUpperCase()}. Keep monitoring; use "Ask for support" if it needs to move faster.`, risk: 'high' };
  if (phase === 'pre-delivery') {
    const t3w = computeT3W(engagement);
    if (t3w.status === 'overdue' || (t3w.inWindow && t3w.status === 'not-started')) {
      return { text: `T-3W window: ${t3w.status === 'overdue' ? `${Math.abs(t3w.daysUntil)}d past due with no report` : `due in ${t3w.daysUntil}d with no proactive outreach yet`} — this is exactly the pattern that turns into a pending report. Prioritize Day 0 outreach now, or use "Ask for support".`, risk: 'high' };
    }
    if (t3w.inWindow && t3w.status === 'in-progress') {
      return { text: `T-3W window: due in ${t3w.daysUntil}d, proactive outreach in progress (${t3w.outreach}/4) — on pace, keep the cadence going.`, risk: 'medium' };
    }
  }
  if (engagement.atRisk || behind) return { text: `Risk signals present (${behind ? 'milestones trailing the plan' : 'outreach or timeline slipping'}) — no open escalation yet. Consider "Ask for support" if this needs POD Lead/SDM attention.`, risk: 'medium' };
  return { text: phase === 'post-delivery' ? 'No risk signals were recorded across this delivery.' : 'No risk signals detected right now.', risk: 'low' };
}

// The full agent roster (common + track specialist + back-office ops) that applies to a given
// engagement. Every agent — including the ops crew — runs, schedules and is controlled per
// engagement, independently of every other engagement.
export function agentsForEngagement(engagement) {
  const expertDef = EXPERT_AGENTS[engagement.track];
  const roster = expertDef ? [...COMMON_AGENTS, expertDef] : [...COMMON_AGENTS];
  return [...roster, ...OPS_AGENTS];
}

// Executes a single agent by id against the current engagement/dataset — the "run" behind both the
// manual Run Now action and a due scheduled run. Common agents return a string; the track specialist
// returns an array of tip bullets. `stage` is the real backlog status (STAGES); it's mapped to the
// 3-bucket content stage before reaching any of the functions below.
export function runAgentById(agentId, engagement, d, stage) {
  const cs = contentStage(stage);
  switch (agentId) {
    case 'signal-scout': return signalScout(engagement, d, cs).text;
    case 'outreach-concierge': return outreachConcierge(engagement, d, cs).text;
    case 'chronicle-keeper': return chronicleKeeper(engagement, d, cs).text;
    case 'survey-herald': return surveyHerald(engagement, d, cs).text;
    case 'escalation-sentinel': return escalationSentinel(engagement, d, cs).text;
    default: {
      const expertDef = Object.values(EXPERT_AGENTS).find((a) => a.id === agentId);
      if (expertDef) return (expertDef.tips[cs] || []).filter((t) => !t.rx || t.rx.test(engagement.program)).map((t) => t.text);
      if (OPS_AGENTS.some((a) => a.id === agentId)) return runOpsAgentById(agentId, engagement, d);
      return null;
    }
  }
}
