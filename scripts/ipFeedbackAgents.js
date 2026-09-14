// IP Feedback — simulated multi-agent pipeline. SIMULATED. Deterministic, text-driven heuristics
// (same approach as ai.js) — no network calls. Standalone module (no store/roles imports) so it can be
// shared by both the seed-data generator (data/generate.js) and the runtime store (scripts/store.js)
// without creating a circular import.

export const AGENTS = [
  { id: 'guide-sentinel', name: 'Guide Sentinel', role: 'Delivery Guide validator', icon: 'docSearch', blurb: 'Checks whether the Delivery Guide already answers the feedback before a change is opened.' },
  { id: 'kit-cartographer', name: 'Kit Cartographer', role: 'IP Kit gap analyst', icon: 'database', blurb: 'Cross-references the relevant IP Kit to scope what needs to change.' },
  { id: 'draft-weaver', name: 'Draft Weaver', role: 'Change drafter', icon: 'sparkle', blurb: 'Pre-prepares a first-pass redline of the content change.' },
  { id: 'content-sage', name: 'Content Sage', role: 'Subject-matter expert reviewer', icon: 'star', blurb: 'Validates any change the submitter proposed against delivery content standards.' },
  { id: 'triage-marshal', name: 'Triage Marshal', role: 'Prioritization & routing', icon: 'flag', blurb: 'Assigns category, priority and an IP Lead, then places the case in the backlog.' },
];

// A small slice of the Delivery Guide's FAQ index — used by Guide Sentinel to decide whether
// feedback is actually already answered rather than a genuine content gap.
export const DELIVERY_GUIDE_FAQ = [
  { topic: 'Day 0–3 outreach cadence', section: '§2.1 Engagement Kickoff', keywords: ['outreach cadence', 'day 0', 'day 1 sync', 'day1 sync', 'kickoff outreach'], answer: 'The Delivery Guide requires Day 0–3 outreach: a Day 0 introduction, a Day 1 stakeholder sync, and Day 3 confirmation of scope and success criteria.' },
  { topic: 'CPE survey timing', section: '§5.4 Customer Perception of Excellence', keywords: ['cpe survey', 'vsat timing', 'survey timing', 'when to send survey', 'send the survey'], answer: 'CPE/VSAT surveys should be requested within 5 business days of the final milestone — never before the customer confirms delivery completion.' },
  { topic: 'Milestone plan baselining', section: '§3.2 Delivery Planning', keywords: ['milestone plan', 'baseline plan', 're-baseline'], answer: 'Milestone plans must be baselined at kickoff; any re-baseline requires POD Lead sign-off recorded in SSD IQ.' },
  { topic: 'S500 CSA eligibility', section: '§6.1 S500 Readiness', keywords: ['s500', 'strategic account eligibility'], answer: 'S500 customers must be served only by an S500-ready CSA — eligibility requires CPE ≥ 4.4, quality ≥ 4.4 and 6+ months tenure.' },
  { topic: 'Scope change / SOW', section: '§4.3 Scope Management', keywords: ['out of scope', 'sow', 'scope creep', 'change order'], answer: 'Requests outside the signed SOW must be routed to the SDM as a change order — the CSA should not self-approve added scope.' },
  { topic: 'Escalation SLA', section: '§7.2 Escalation Management', keywords: ['escalation sla', 'sev1 sla', 'response time'], answer: 'Escalation SLAs are Sev1 8h, Sev2 24h, Sev3 48h and Sev4 72h from the time the escalation is opened.' },
  { topic: 'Delivery language coverage', section: '§2.4 Delivery Languages', keywords: ['language requirement', 'translat', 'local language', 'localization'], answer: 'Each time zone maintains a minimum supported language list; delivering (or translating collateral) in an unsupported language requires TZ Lead approval.' },
  { topic: 'Accreditation requirement', section: '§8.1 Enablement & Accreditation', keywords: ['accreditation', 'certification required', 'need certification'], answer: 'Each Program maps 1:1 to a required accreditation — a CSA cannot be dispatched to a Program without the matching accreditation on file.' },
];

// Words that signal the submitter is saying the Guide/Kit itself is wrong — even a keyword match
// should NOT be auto-resolved in that case; it's a genuine content gap.
const OVERRIDE_RX = /(outdated|incorrect|wrong|doesn'?t work|broken|out of date|no longer|inaccurate|contradicts)/i;

export function runGuideSentinel(description = '') {
  const text = String(description || '').toLowerCase();
  const override = OVERRIDE_RX.test(text);
  const match = DELIVERY_GUIDE_FAQ.find((entry) => entry.keywords.some((k) => text.includes(k)));
  if (match && !override) {
    return {
      resolved: true, section: match.section, answer: match.answer,
      text: `Matched "${match.topic}" in the Delivery Guide (${match.section}) — the guide already answers this. Responding to the submitter with the existing guidance instead of opening a change.`,
    };
  }
  if (match && override) {
    return { resolved: false, text: `Matched "${match.topic}" (${match.section}), but the submitter flags the guide/kit content itself as wrong or outdated — treating this as a genuine content gap and routing to IP Kit analysis.` };
  }
  return { resolved: false, text: 'No matching section found in the Delivery Guide — this looks like a genuine content gap. Routing to IP Kit analysis.' };
}

export function runKitAnalyst({ description = '', program = '', track = '' } = {}) {
  const text = String(description).toLowerCase();
  let changeNeeded = 'Content clarification';
  if (/missing|doesn'?t cover|not covered|gap in/.test(text)) changeNeeded = 'New guidance section';
  else if (/outdated|deprecated|no longer|old /.test(text)) changeNeeded = 'Content refresh';
  else if (/\blink\b|\burl\b/.test(text)) changeNeeded = 'Broken link / asset repair';
  else if (/wrong|incorrect|inaccurate/.test(text)) changeNeeded = 'Correction to existing guidance';
  else if (/translat|localiz/.test(text)) changeNeeded = 'Localization update';
  const affected = program ? `${program} IP Kit` : `${track || 'General'} IP Kit`;
  return { changeNeeded, affectedAssets: [affected], text: `Cross-referenced the ${affected} — classified this as a "${changeNeeded}" against the current asset set. Flagging it for a drafted change.` };
}

export function runDraftWeaver({ title = '', description = '', program = '' } = {}) {
  const trimmed = description.length > 160 ? `${description.slice(0, 160)}…` : description;
  const draft = `Proposed update to the ${program || 'delivery'} IP Kit — "${title || 'Untitled feedback'}": revise the affected section to address — ${trimmed} Include a changelog note and reference the submitter's example for QA.`;
  return { draft, text: "Prepared a first-pass redline of the content change, referencing the submitter's example, for expert review." };
}

export function runContentSage(proposedChange = '', caseCtx = {}) {
  const len = String(proposedChange || '').trim().length;
  const approved = len >= 40;
  const notes = approved
    ? 'The proposed change is well-specified and aligns with current delivery standards — recommend accepting with light copy-editing.'
    : "The proposed change is too brief to validate with confidence — recommend the IP Lead request more detail or fall back to Draft Weaver's version.";
  return { approved, notes, text: `Reviewed the submitter's proposed change against ${caseCtx.program || 'the'} content standards. ${notes}` };
}

const IP_LEAD_NAME = 'Elif Kaya';
export function runTriageMarshal({ description = '' } = {}) {
  const text = String(description).toLowerCase();
  const urgent = /(customer-facing|security|compliance|legal|urgent|blocking|broken)/.test(text);
  const minor = /(typo|wording|cosmetic|minor)/.test(text);
  const priority = urgent ? 'P1' : minor ? 'P4' : /outdated|missing|no longer/.test(text) ? 'P2' : 'P3';
  const category = /missing|doesn'?t cover|not covered|gap in/.test(text) ? 'Missing guidance'
    : /outdated|deprecated|no longer/.test(text) ? 'Outdated content'
    : /\blink\b|\burl\b/.test(text) ? 'Broken link/asset'
    : /wrong|incorrect|inaccurate/.test(text) ? 'Incorrect guidance'
    : /translat|localiz/.test(text) ? 'Localization gap'
    : /legal|compliance/.test(text) ? 'Compliance/legal update'
    : 'General content update';
  return { category, priority, assignedIpLead: IP_LEAD_NAME, text: `Prioritized ${priority} — "${category}" — assigned to ${IP_LEAD_NAME} and placed in the IP Feedback backlog for confirmation.` };
}

// Runs one agent of the pipeline against the current case state and returns the timeline step plus
// the field updates to merge into the case. Does not mutate `caseObj`.
export function stepAgent(caseObj, stepIndex) {
  const at = new Date().toISOString();
  if (stepIndex === 0) {
    const r = runGuideSentinel(caseObj.description);
    const step = { agent: 'Guide Sentinel', role: 'Delivery Guide validator', status: 'complete', summary: r.text, at };
    if (r.resolved) return { step, updates: { status: 'resolved-by-guide', currentStepIndex: -1, guideResolution: { section: r.section, answer: r.answer }, updatedAt: at } };
    return { step, updates: { status: 'kit-analysis', currentStepIndex: 1, updatedAt: at } };
  }
  if (stepIndex === 1) {
    const r = runKitAnalyst(caseObj);
    const step = { agent: 'Kit Cartographer', role: 'IP Kit gap analyst', status: 'complete', summary: r.text, at };
    return { step, updates: { status: 'drafting', currentStepIndex: 2, kitAnalysis: r, updatedAt: at } };
  }
  if (stepIndex === 2) {
    const r = runDraftWeaver(caseObj);
    const step = { agent: 'Draft Weaver', role: 'Change drafter', status: 'complete', summary: r.text, at };
    return { step, updates: { status: 'expert-review', currentStepIndex: 3, draftChange: r, updatedAt: at } };
  }
  if (stepIndex === 3) {
    if (String(caseObj.proposedChange || '').trim()) {
      const r = runContentSage(caseObj.proposedChange, caseObj);
      const step = { agent: 'Content Sage', role: 'Subject-matter expert reviewer', status: 'complete', summary: r.text, at };
      return { step, updates: { status: 'triage', currentStepIndex: 4, expertReview: r, updatedAt: at } };
    }
    const step = { agent: 'Content Sage', role: 'Subject-matter expert reviewer', status: 'skipped', summary: "No proposed change was attached — Content Sage will validate Draft Weaver's proposal once an owner is assigned.", at };
    return { step, updates: { status: 'triage', currentStepIndex: 4, expertReview: null, updatedAt: at } };
  }
  const r = runTriageMarshal(caseObj);
  const step = { agent: 'Triage Marshal', role: 'Prioritization & routing', status: 'complete', summary: r.text, at };
  return { step, updates: { status: 'backlog', currentStepIndex: -1, category: r.category, priority: r.priority, assignedIpLead: r.assignedIpLead, triage: r, updatedAt: at } };
}

// Runs the full pipeline synchronously to completion (resolved-by-guide or backlog) — used by both
// the seed-data generator and the live "submit feedback" flow.
export function runFullPipeline(caseObj) {
  while (caseObj.currentStepIndex !== -1) {
    const { step, updates } = stepAgent(caseObj, caseObj.currentStepIndex);
    caseObj.agentSteps.push(step);
    Object.assign(caseObj, updates);
  }
  return caseObj;
}
