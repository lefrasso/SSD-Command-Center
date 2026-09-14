// Agentic Delivery — per-engagement support agents. SIMULATED. Deterministic, data-driven (same
// approach as ai.js / ipFeedbackAgents.js) — no network calls, no store import (kept pure so both
// the view and the seed-data generator can use it without a circular import).

export const PHASES = [
  ['pre-delivery', 'Pre-delivery'],
  ['delivery', 'Delivery'],
  ['post-delivery', 'Post-delivery'],
];

export function phaseForEngagement(e) {
  if (e.status === 'complete') return 'post-delivery';
  if (e.status === 'in-delivery') return 'delivery';
  return 'pre-delivery';
}

// Common agents work every engagement, regardless of track — the "always-on" crew.
export const COMMON_AGENTS = [
  { id: 'signal-scout', name: 'Signal Scout', role: 'Account & sentiment insights', icon: 'database', blurb: 'Pulls MSX account context, CXObserve sentiment and Engage Center activity into one read.' },
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
  const customerSignals = d.sentimentSignals.filter((s) => s.engagementId === engagement.id && s.channel !== 'Teams');
  const activity = d.messages.filter((m) => m.engagementId === engagement.id);
  const avg = customerSignals.length ? customerSignals.reduce((sum, s) => sum + s.score, 0) / customerSignals.length : null;
  const cxRead = avg == null ? 'no CXObserve signal on file yet' : avg >= 0.15 ? `CXObserve trending positive (${avg.toFixed(2)} avg across ${customerSignals.length} signal(s))` : avg <= -0.15 ? `CXObserve trending negative (${avg.toFixed(2)} avg across ${customerSignals.length} signal(s)) — watch closely` : `CXObserve steady/neutral (${avg.toFixed(2)} avg across ${customerSignals.length} signal(s))`;
  const account = `MSX: ${engagement.customer}${engagement.s500Customer ? ' — S500 strategic account' : ''}, ${engagement.program} (${engagement.track})`;
  const engage = `Engage Center: ${activity.length} logged touchpoint(s)${activity.length ? ` — last on ${activity[activity.length - 1].timestamp.slice(0, 10)}` : ''}.`;
  const lead = phase === 'pre-delivery' ? 'Baseline read before kickoff.' : phase === 'delivery' ? 'Mid-engagement pulse check.' : 'Final read for the close-out record.';
  return { text: `${lead} ${account}. ${cxRead}. ${engage}` };
}

function outreachConcierge(engagement, d, phase) {
  const o = engagement.outreach;
  if (phase === 'pre-delivery') {
    const pending = ['day0', 'day1'].filter((k) => !o[k]);
    return { text: pending.length ? `Day 0–1 outreach still pending — ready to draft the kickoff introduction to ${engagement.csamName}.` : 'Day 0–1 outreach is logged — ready to draft the Day 1 stakeholder sync invite.' };
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
  if (engagement.atRisk || behind) return { text: `Risk signals present (${behind ? 'milestones trailing the plan' : 'outreach or timeline slipping'}) — no open escalation yet. Consider "Ask for support" if this needs POD Lead/SDM attention.`, risk: 'medium' };
  return { text: phase === 'post-delivery' ? 'No risk signals were recorded across this delivery.' : 'No risk signals detected right now.', risk: 'low' };
}

export function buildEngagementSupport(engagement, d) {
  const phase = phaseForEngagement(engagement);
  const common = [
    { agent: COMMON_AGENTS[0], ...signalScout(engagement, d, phase) },
    { agent: COMMON_AGENTS[1], ...outreachConcierge(engagement, d, phase) },
    { agent: COMMON_AGENTS[2], ...chronicleKeeper(engagement, d, phase) },
    { agent: COMMON_AGENTS[3], ...surveyHerald(engagement, d, phase) },
    { agent: COMMON_AGENTS[4], ...escalationSentinel(engagement, d, phase) },
  ];
  const expertDef = EXPERT_AGENTS[engagement.track];
  const expert = expertDef
    ? { agent: expertDef, tips: (expertDef.tips[phase] || []).filter((t) => !t.rx || t.rx.test(engagement.program)).map((t) => t.text) }
    : null;
  return { phase, common, expert };
}
