// Non-customer-facing automation — the "art of the possible" read on the Events Task Inventory:
// every recurring activity across an engagement's lifecycle, classified customer-facing vs.
// back-office/ops, plus a crew of simulated ops agents that action the highest-value back-office
// opportunities. SIMULATED, deterministic, data-driven (same approach as agenticSupportAgents.js) —
// no network calls, and no store.js/ai.js import so this stays safe from the store → data/generate.js
// → agenticSupportAgents.js import cycle (small formulas below are intentionally mirrored, not
// imported, from store.js/ai.js for that reason).
import { computeT3W } from './t3w.js';

export const OPS_PHASE_LABEL = { 'pre-delivery': 'Pre-delivery', delivery: 'Delivery', 'post-delivery': 'Post-delivery', ops: 'Cross-engagement ops' };

// The inventory: reconstructed from the Events Task Inventory categories (engagement setup,
// outreach, content, QC, survey, escalation, onboarding, capacity, reporting). Customer-facing rows
// keep a human in the loop — agents draft/assist only; non-customer-facing rows are the automation
// opportunity this view is built to surface.
export const TASK_INVENTORY = [
  { activity: 'Kickoff & Day 0\u20133 proactive outreach', phase: 'pre-delivery', customerFacing: true, potential: 'medium', agentId: 'outreach-concierge', note: 'Agent drafts every touch; a human sends it.' },
  { activity: 'Discovery & delivery workshops / working sessions', phase: 'delivery', customerFacing: true, potential: 'low', agentId: null, note: 'Human-delivered by design \u2014 no agent substitutes for the session itself.' },
  { activity: 'Milestone review & stakeholder syncs', phase: 'delivery', customerFacing: true, potential: 'low', agentId: null, note: 'Human-delivered; agent preps the talking points.' },
  { activity: 'CPE / VSAT survey ask', phase: 'post-delivery', customerFacing: true, potential: 'medium', agentId: 'survey-herald', note: 'Agent times and drafts the ask; a human can still personalize it.' },
  { activity: 'Close-out & thank-you communication', phase: 'post-delivery', customerFacing: true, potential: 'medium', agentId: 'outreach-concierge', note: 'Agent drafts the note from the milestone record.' },

  { activity: 'Engagement intake, MSX/SSD IQ sync & CSA dispatch matching', phase: 'ops', customerFacing: false, potential: 'high', agentId: 'intake-provisioner', note: 'Fully data-driven \u2014 agent recommends + assigns, a human approves.' },
  { activity: 'Kickoff content & IP Kit prep', phase: 'pre-delivery', customerFacing: false, potential: 'high', agentId: 'chronicle-keeper', note: 'Already agent-run today (Chronicle Keeper).' },
  { activity: 'Quality Check pre-scoring & backlog triage', phase: 'ops', customerFacing: false, potential: 'high', agentId: 'qc-autorater', note: 'Auto-scores against the Recommended Practices checklist; POD Lead confirms.' },
  { activity: 'Escalation triage, SLA monitoring & routing', phase: 'ops', customerFacing: false, potential: 'high', agentId: 'escalation-sentinel', note: 'Already agent-run today (Escalation Sentinel).' },
  { activity: 'KYPL session scheduling for new Partner CSAs', phase: 'ops', customerFacing: false, potential: 'high', agentId: 'onboarding-concierge', note: 'Auto-detects onboarding CSAs with no session booked yet.' },
  { activity: 'Shadow-request matching & confirmation', phase: 'ops', customerFacing: false, potential: 'medium', agentId: 'onboarding-concierge', note: 'Matches an open request to the next confirmed delivery slot.' },
  { activity: 'S500 eligibility \u2194 readiness reconciliation', phase: 'ops', customerFacing: false, potential: 'high', agentId: 's500-reconciler', note: 'Flags every mismatch and who should mark a CSA ready.' },
  { activity: 'Utilization balancing & attrition-driven backfill triage', phase: 'ops', customerFacing: false, potential: 'high', agentId: 'capacity-rebalancer', note: 'Surfaces over/under-utilized CSAs and unmatched backfill requisitions.' },
  { activity: 'T-3W / Reports Pending compliance chasing', phase: 'ops', customerFacing: false, potential: 'high', agentId: 'compliance-chaser', note: 'Nudges the CSA/POD Lead before a report goes overdue.' },
  { activity: 'SSD IQ data-quality flag triage', phase: 'ops', customerFacing: false, potential: 'high', agentId: 'dq-sentinel', note: 'Same engine behind the notification bell, packaged as an actionable backlog.' },
  { activity: 'MBR/QBR narrative drafting & deck assembly', phase: 'ops', customerFacing: false, potential: 'medium', agentId: null, note: 'Partially automated today (one-click deck export); narrative drafting is next.' },
  { activity: 'Success story nomination & first-draft write-up', phase: 'post-delivery', customerFacing: false, potential: 'medium', agentId: null, note: 'Human judgment on which wins are story-worthy; an agent could draft the first pass.' },
];

// New back-office ops agents — cross-engagement, not tied to a single delivery, so they run over
// the whole portfolio (or the caller's already-scoped slice of it) rather than one engagement.
export const OPS_AGENTS = [
  { id: 'intake-provisioner', name: 'Intake Provisioner', role: 'Engagement setup & CSA dispatch matching', icon: 'send' },
  { id: 'qc-autorater', name: 'QC Auto-Rater', role: 'Quality Check pre-scoring & backlog triage', icon: 'check' },
  { id: 'onboarding-concierge', name: 'Onboarding Concierge', role: 'KYPL scheduling & shadow-request matching', icon: 'personAdd' },
  { id: 's500-reconciler', name: 'S500 Reconciler', role: 'Eligibility \u2194 readiness reconciliation', icon: 'star' },
  { id: 'capacity-rebalancer', name: 'Capacity Rebalancer', role: 'Utilization & attrition-driven backfill triage', icon: 'trending' },
  { id: 'compliance-chaser', name: 'Compliance Chaser', role: 'T-3W / Reports Pending nudges', icon: 'clock' },
  { id: 'dq-sentinel', name: 'Data Quality Sentinel', role: 'SSD IQ data-quality flag triage', icon: 'database' },
];

function intakeProvisioner(d) {
  const unassignedNew = d.engagements.filter((e) => e.status === 'new' && !e.assignedTo);
  const unassignedInDelivery = d.engagements.filter((e) => e.status === 'in-delivery' && !e.assignedTo);
  const lines = [
    unassignedNew.length ? `${unassignedNew.length} new engagement(s) awaiting a CSA match \u2014 best-fit recommendations staged by track, skills and utilization for each.` : 'No new demand is waiting on a CSA match.',
  ];
  if (unassignedInDelivery.length) lines.push(`${unassignedInDelivery.length} in-delivery engagement(s) have no CSA assigned \u2014 escalating these to the POD Lead for immediate dispatch.`);
  lines.push('Every matched record is queued for a human approval before assignment \u2014 this agent never dispatches on its own.');
  return lines;
}

// Mirrors ai.js's scoreQuality() formula (kept local — see the file header for why).
function qcAutoScore(e) {
  const outreach = Object.values(e.outreach || {}).filter(Boolean).length;
  const done = e.milestones.filter((m) => m.done).length;
  return Math.min(5, Math.round((2.6 + outreach * 0.35 + (done / Math.max(1, e.milestones.length)) * 1.2) * 10) / 10);
}
function qcAutoRater(d) {
  const inScope = d.engagements.filter((e) => e.status === 'in-delivery' || e.status === 'complete');
  const scored = inScope.map((e) => ({ e, score: qcAutoScore(e) }));
  const needsReview = scored.filter((s) => s.score < 4);
  const lines = [`${scored.length} engagement(s) pre-scored against the Recommended Practices checklist \u2014 avg ${scored.length ? (scored.reduce((s, x) => s + x.score, 0) / scored.length).toFixed(1) : '0.0'}/5.`];
  lines.push(needsReview.length ? `${needsReview.length} scored below 4/5 \u2014 queued for priority POD Lead review: ${needsReview.slice(0, 3).map((s) => s.e.customer).join(', ')}${needsReview.length > 3 ? ', \u2026' : ''}.` : 'Nothing is below the 4/5 review threshold this cycle.');
  return lines;
}

function onboardingConcierge(d) {
  const onboarding = d.csas.filter((c) => c.resourceType === 'FTC' && c.lifecycle === 'onboarding');
  const noSession = onboarding.filter((c) => !d.kyplSessions.some((k) => k.csaId === c.id));
  const pendingShadow = d.shadowRequests.filter((s) => s.status === 'requested');
  const lines = [
    noSession.length ? `${noSession.length} of ${onboarding.length} onboarding Partner CSA(s) have no KYPL session booked \u2014 auto-drafting the POD Lead invite for each.` : `All ${onboarding.length} onboarding Partner CSA(s) already have a KYPL session on the calendar.`,
  ];
  lines.push(pendingShadow.length ? `${pendingShadow.length} shadow request(s) awaiting confirmation \u2014 matched to the requester's next scheduled delivery.` : 'No shadow requests waiting on a match.');
  return lines;
}

// Mirrors store.js's computeS500() eligibility formula (kept local — see the file header for why).
function s500Reconciler(d) {
  const active = d.csas.filter((c) => c.lifecycle === 'active');
  const rows = active.map((c) => { const eligible = c.cpe >= 4.4 && c.quality >= 4.4 && c.tenureMonths >= 6; return { c, eligible, reconciled: c.s500Ready === eligible }; });
  const gaps = rows.filter((r) => !r.reconciled);
  const shouldMark = gaps.filter((r) => r.eligible && !r.c.s500Ready);
  const lines = [gaps.length ? `${gaps.length} reconciliation gap(s) found across ${rows.length} active Partner CSAs.` : `All ${rows.length} active Partner CSAs are reconciled \u2014 no gaps this cycle.`];
  if (shouldMark.length) lines.push(`${shouldMark.length} are eligible but not yet marked ready \u2014 recommend the POD Lead mark ready: ${shouldMark.slice(0, 3).map((r) => r.c.name).join(', ')}${shouldMark.length > 3 ? ', \u2026' : ''}.`);
  return lines;
}

function capacityRebalancer(d) {
  const active = d.csas.filter((c) => c.lifecycle === 'active');
  const over = active.filter((c) => c.utilization > 92);
  const under = active.filter((c) => c.utilization < 72);
  const unbackfilled = d.attrition.filter((a) => !a.backfillReqId);
  const lines = [`${over.length} CSA(s) over 92% utilization, ${under.length} under 72% \u2014 ${over[0] && under[0] ? `suggested shift: ${over[0].name} \u2192 ${under[0].name}.` : 'no rebalancing pair identified this cycle.'}`];
  lines.push(unbackfilled.length ? `${unbackfilled.length} attrition exit(s) have no backfill requisition yet \u2014 draft requisitions queued for Capacity Management.` : 'Every attrition exit already has a matched backfill requisition.');
  return lines;
}

function complianceChaser(d) {
  const open = d.engagements.filter((e) => e.status !== 'complete');
  const flagged = open.map((e) => ({ e, t3w: computeT3W(e) })).filter(({ t3w }) => t3w.status === 'overdue' || (t3w.inWindow && t3w.status === 'not-started'));
  const lines = [flagged.length ? `${flagged.length} engagement(s) are overdue or untouched inside the T-3W window \u2014 nudges drafted to the assigned CSA and POD Lead.` : 'No engagement is overdue or untouched inside the T-3W window right now.'];
  if (flagged.length) lines.push(`Highest priority: ${flagged.slice(0, 3).map(({ e }) => e.customer).join(', ')}${flagged.length > 3 ? ', \u2026' : ''}.`);
  return lines;
}

// Trimmed to the ops-relevant subset of ai.js's dataQualityFlags() (kept local — see file header).
function dqSentinel(d) {
  const flags = [];
  d.engagements.filter((e) => e.status === 'in-delivery' && !e.assignedTo).forEach((e) => flags.push(`Engagement ${e.id} is in-delivery with no assigned CSA.`));
  d.csas.filter((c) => c.lifecycle === 'active' && c.utilization > 95).forEach((c) => flags.push(`${c.name} is over-utilized at ${c.utilization}%.`));
  d.partners.filter((p) => (p.podIds || []).length === 0).forEach((p) => flags.push(`Partner ${p.name} has no PODs mapped.`));
  const lines = [flags.length ? `${flags.length} data-quality flag(s) open across SSD IQ.` : 'No open data-quality flags right now.'];
  if (flags.length) lines.push(...flags.slice(0, 4));
  return lines;
}

export function runOpsAgentById(agentId, d) {
  switch (agentId) {
    case 'intake-provisioner': return intakeProvisioner(d);
    case 'qc-autorater': return qcAutoRater(d);
    case 'onboarding-concierge': return onboardingConcierge(d);
    case 's500-reconciler': return s500Reconciler(d);
    case 'capacity-rebalancer': return capacityRebalancer(d);
    case 'compliance-chaser': return complianceChaser(d);
    case 'dq-sentinel': return dqSentinel(d);
    default: return null;
  }
}
