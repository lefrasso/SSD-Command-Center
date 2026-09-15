// Non-customer-facing automation — the "art of the possible" read on the Events Task Inventory:
// every recurring activity across an engagement's lifecycle, classified customer-facing vs.
// back-office/ops, plus a crew of simulated ops agents that action the highest-value back-office
// opportunities. Like the common/expert agents in agenticSupportAgents.js, every ops agent runs
// against ONE engagement at a time — each engagement gets its own, independently controlled run
// (own schedule, own "Run now", own history) via the same per-engagement agent execution in
// store.js. SIMULATED, deterministic, data-driven — no network calls, and no store.js/ai.js import
// so this stays safe from the store → data/generate.js → agenticSupportAgents.js import cycle
// (a couple of small formulas below are intentionally mirrored, not imported, from store.js/ai.js).
import { computeT3W } from './t3w.js';

export const OPS_PHASE_LABEL = { 'pre-delivery': 'Pre-delivery', delivery: 'Delivery', 'post-delivery': 'Post-delivery', ops: 'Ops (any phase)' };

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
  { activity: 'KYPL session scheduling for new Partner CSAs', phase: 'ops', customerFacing: false, potential: 'high', agentId: 'onboarding-concierge', note: 'Auto-detects an onboarding assigned CSA with no session booked yet.' },
  { activity: 'Shadow-request matching & confirmation', phase: 'ops', customerFacing: false, potential: 'medium', agentId: 'onboarding-concierge', note: 'Matches an open request on this engagement to the next confirmed delivery slot.' },
  { activity: 'S500 eligibility \u2194 readiness reconciliation', phase: 'ops', customerFacing: false, potential: 'high', agentId: 's500-reconciler', note: 'Flags a mismatch for the assigned CSA and recommends whether to mark them ready.' },
  { activity: 'Utilization balancing & attrition-driven backfill triage', phase: 'ops', customerFacing: false, potential: 'high', agentId: 'capacity-rebalancer', note: 'Reads the assigned CSA against their POD\u2019s utilization band.' },
  { activity: 'T-3W / Reports Pending compliance chasing', phase: 'ops', customerFacing: false, potential: 'high', agentId: 'compliance-chaser', note: 'Nudges the CSA/POD Lead before this engagement\u2019s report goes overdue.' },
  { activity: 'SSD IQ data-quality flag triage', phase: 'ops', customerFacing: false, potential: 'high', agentId: 'dq-sentinel', note: 'Same checks behind the notification bell, scoped to this engagement.' },
  { activity: 'MBR/QBR narrative drafting & deck assembly', phase: 'ops', customerFacing: false, potential: 'medium', agentId: null, note: 'Partially automated today (one-click deck export); narrative drafting is next.' },
  { activity: 'Success story nomination & first-draft write-up', phase: 'post-delivery', customerFacing: false, potential: 'medium', agentId: null, note: 'Human judgment on which wins are story-worthy; an agent could draft the first pass.' },
];

// New back-office ops agents. They join the common/expert crew on every engagement's own roster —
// same per-engagement schedule + "Run now" controls, just aimed at the non-customer-facing side of
// the delivery.
export const OPS_AGENTS = [
  { id: 'intake-provisioner', name: 'Intake Provisioner', role: 'Engagement setup & CSA dispatch matching', icon: 'send' },
  { id: 'qc-autorater', name: 'QC Auto-Rater', role: 'Quality Check pre-scoring & backlog triage', icon: 'check' },
  { id: 'onboarding-concierge', name: 'Onboarding Concierge', role: 'KYPL scheduling & shadow-request matching', icon: 'personAdd' },
  { id: 's500-reconciler', name: 'S500 Reconciler', role: 'Eligibility \u2194 readiness reconciliation', icon: 'star' },
  { id: 'capacity-rebalancer', name: 'Capacity Rebalancer', role: 'Utilization & attrition-driven backfill triage', icon: 'trending' },
  { id: 'compliance-chaser', name: 'Compliance Chaser', role: 'T-3W / Reports Pending nudges', icon: 'clock' },
  { id: 'dq-sentinel', name: 'Data Quality Sentinel', role: 'SSD IQ data-quality flag triage', icon: 'database' },
];

function intakeProvisioner(e) {
  if (!e.assignedTo) {
    return e.status === 'new'
      ? ['New and unassigned \u2014 a best-fit CSA recommendation is staged from track, skills and utilization.', 'Queued for a human approval before assignment \u2014 this agent never dispatches on its own.']
      : [`Status is "${e.status}" with no CSA assigned \u2014 escalating to the POD Lead for immediate dispatch.`];
  }
  return ['A CSA is already assigned \u2014 no dispatch action needed on this engagement.'];
}

// Mirrors ai.js's scoreQuality() formula (kept local — see the file header for why).
function qcAutoScore(e) {
  const outreach = Object.values(e.outreach || {}).filter(Boolean).length;
  const done = e.milestones.filter((m) => m.done).length;
  return Math.min(5, Math.round((2.6 + outreach * 0.35 + (done / Math.max(1, e.milestones.length)) * 1.2) * 10) / 10);
}
function qcAutoRater(e) {
  if (e.status !== 'in-delivery' && e.status !== 'complete') return ['Not yet in delivery \u2014 nothing to pre-score until milestones start closing.'];
  const score = qcAutoScore(e);
  return [`Pre-scored ${score}/5 against the Recommended Practices checklist.`, score < 4 ? 'Below the 4/5 threshold \u2014 queued for priority POD Lead review.' : 'Above threshold \u2014 no priority review needed this cycle.'];
}

function onboardingConcierge(e, d) {
  const csa = d.csas.find((c) => c.id === e.assignedTo);
  const lines = [];
  if (csa && csa.lifecycle === 'onboarding') {
    const hasSession = d.kyplSessions.some((k) => k.csaId === csa.id);
    lines.push(hasSession ? `${csa.name} already has a KYPL session booked.` : `${csa.name} is onboarding with no KYPL session booked \u2014 auto-drafting the POD Lead invite.`);
  } else {
    lines.push(csa ? `${csa.name} is not currently onboarding \u2014 nothing to schedule.` : 'No CSA assigned yet \u2014 nothing to schedule.');
  }
  const shadow = d.shadowRequests.filter((s) => s.engagementId === e.id && s.status === 'requested');
  lines.push(shadow.length ? `${shadow.length} shadow request(s) on this engagement awaiting confirmation \u2014 matched to the next scheduled delivery.` : 'No shadow requests waiting on this engagement.');
  return lines;
}

// Mirrors store.js's computeS500() eligibility formula (kept local — see the file header for why).
function s500Reconciler(e, d) {
  const csa = d.csas.find((c) => c.id === e.assignedTo);
  if (!csa) return ['No CSA assigned yet \u2014 nothing to reconcile.'];
  const eligible = csa.cpe >= 4.4 && csa.quality >= 4.4 && csa.tenureMonths >= 6;
  if (csa.s500Ready === eligible) return [`${csa.name} is reconciled \u2014 eligible ${eligible ? 'yes' : 'no'}, marked ready ${csa.s500Ready ? 'yes' : 'no'}.`];
  const lines = [`${csa.name} has a reconciliation gap \u2014 eligible ${eligible ? 'yes' : 'no'}, marked ready ${csa.s500Ready ? 'yes' : 'no'}.`];
  if (eligible && !csa.s500Ready) lines.push('Recommend the POD Lead mark them S500 ready.');
  if (e.s500Customer && !csa.s500Ready) lines.push('This is an S500 customer served by a non-ready CSA \u2014 flag for priority reconciliation.');
  return lines;
}

function capacityRebalancer(e, d) {
  const csa = d.csas.find((c) => c.id === e.assignedTo);
  if (!csa) return ['No CSA assigned yet \u2014 nothing to rebalance.'];
  const pod = d.pods.find((p) => p.id === csa.podId);
  const podPeers = pod ? d.csas.filter((c) => c.podId === pod.id && c.lifecycle === 'active') : [];
  const podAvg = podPeers.length ? Math.round(podPeers.reduce((s, c) => s + c.utilization, 0) / podPeers.length) : csa.utilization;
  const lines = [`${csa.name} is at ${csa.utilization}% utilization vs. ${pod ? pod.name : 'their POD'} average ${podAvg}%.`];
  if (csa.utilization > 92) {
    const under = podPeers.filter((c) => c.utilization < 72 && c.id !== csa.id);
    lines.push(under.length ? `Over 92% \u2014 consider shifting load to ${under[0].name} (${under[0].utilization}% in the same POD).` : 'Over 92% \u2014 no under-utilized peer in the POD to shift to right now.');
  } else if (csa.utilization < 72) {
    lines.push('Under 72% \u2014 has room to take on more demand.');
  } else {
    lines.push('Within the healthy 72\u201392% band \u2014 no rebalancing needed.');
  }
  return lines;
}

function complianceChaser(e) {
  if (e.status === 'complete') return ['Engagement is complete \u2014 no compliance chasing needed.'];
  const t3w = computeT3W(e);
  if (t3w.status === 'overdue') return [`T-3W is ${Math.abs(t3w.daysUntil)}d past due with no report \u2014 nudge drafted to the assigned CSA and POD Lead.`];
  if (t3w.inWindow && t3w.status === 'not-started') return [`T-3W is due in ${t3w.daysUntil}d with no proactive outreach yet \u2014 nudge drafted now.`];
  if (t3w.inWindow) return [`T-3W on pace \u2014 due in ${t3w.daysUntil}d, ${t3w.outreach}/4 outreach logged. No nudge needed.`];
  return ['No T-3W compliance risk detected for this engagement right now.'];
}

// Scoped, single-engagement version of ai.js's dataQualityFlags() checks (kept local — see header).
function dqSentinel(e, d) {
  const flags = [];
  if (e.status === 'in-delivery' && !e.assignedTo) flags.push('In-delivery with no assigned CSA.');
  const csa = d.csas.find((c) => c.id === e.assignedTo);
  if (csa && csa.lifecycle === 'active' && csa.utilization > 95) flags.push(`Assigned CSA ${csa.name} is over-utilized at ${csa.utilization}%.`);
  if (e.s500Customer && csa && !csa.s500Ready) flags.push('S500 customer served by a non-S500-ready CSA.');
  return flags.length ? [`${flags.length} data-quality flag(s) on this engagement.`, ...flags] : ['No open data-quality flags on this engagement.'];
}

// Runs one ops agent against ONE engagement — called the same way as agenticSupportAgents.js's
// runAgentById(), so every ops agent gets the same per-engagement schedule/history in store.js.
export function runOpsAgentById(agentId, e, d) {
  switch (agentId) {
    case 'intake-provisioner': return intakeProvisioner(e);
    case 'qc-autorater': return qcAutoRater(e);
    case 'onboarding-concierge': return onboardingConcierge(e, d);
    case 's500-reconciler': return s500Reconciler(e, d);
    case 'capacity-rebalancer': return capacityRebalancer(e, d);
    case 'compliance-chaser': return complianceChaser(e);
    case 'dq-sentinel': return dqSentinel(e, d);
    default: return null;
  }
}
