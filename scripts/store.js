// In-memory SSD IQ store + derived KPIs and selectors.
import { dataset, IP_TAGS, CAP_PER_CSA, BASELINE_UTILIZATION } from '../data/generate.js';
import { MODULES, moduleById } from './nav.js';
import { runFullPipeline } from './ipFeedbackAgents.js';
import { runAgentById, phaseForEngagement, agentsForEngagement, SCHEDULE_INTERVAL_MS } from './agenticSupportAgents.js';

export const store = {
  data: dataset,
  role: 'pod-lead',
  navCollapsed: false,
  copilotOpen: true,
  accessOverrides: {}, // { [role]: { [moduleId]: true|false } } — Admin-managed module access, layered over nav.js defaults
  agentRuns: {}, // { "<engagementId>::<agentId>": { schedule, status, lastRunAt, lastTrigger, lastPhase, lastOutput, runCount, history } }
  _listeners: [],
};

export function onChange(fn) { store._listeners.push(fn); }
function emit(reason) { store._listeners.forEach((fn) => fn(reason)); }
export function notifyAccessChange() { emit('access'); }

export function setRole(role) { store.role = role; emit('role'); }
export function toggleNav() { store.navCollapsed = !store.navCollapsed; emit('nav'); }
export function toggleCopilot(force) { store.copilotOpen = typeof force === 'boolean' ? force : !store.copilotOpen; emit('copilot'); }

// ---- Module access (Roles & Permissions, Admin-only) ----
export function roleHasModuleAccess(role, moduleId) {
  const override = store.accessOverrides[role] && store.accessOverrides[role][moduleId];
  if (override != null) return override;
  const mod = moduleById(moduleId);
  return !!mod && mod.roles.includes(role);
}
export function modulesForRoleEffective(role) {
  return MODULES.filter((m) => roleHasModuleAccess(role, m.id));
}
export function isModuleAccessOverridden(role, moduleId) {
  return !!(store.accessOverrides[role] && store.accessOverrides[role][moduleId] != null);
}
export function setModuleAccess(role, moduleId, allowed) {
  if (!store.accessOverrides[role]) store.accessOverrides[role] = {};
  store.accessOverrides[role][moduleId] = allowed;
  emit('access');
}
export function resetModuleAccess(role, moduleId) {
  if (store.accessOverrides[role]) delete store.accessOverrides[role][moduleId];
  emit('access');
}
export function resetAllModuleAccess() {
  store.accessOverrides = {};
  emit('access');
}

// ---- Relationship helpers ----
export const byId = (arr, id) => arr.find((x) => x.id === id);
export const csasByPod = (podId) => store.data.csas.filter((c) => c.podId === podId);
export const csasByPartner = (partnerId) => store.data.csas.filter((c) => c.partnerId === partnerId);
export const engagementsByCsa = (csaId) => store.data.engagements.filter((e) => e.assignedTo === csaId);
// "My CSA record" for the self-scoped CSA / Partner CSA personas — a stable stand-in since these
// personas aren't individually linked to a generated CSA record. FTE (Nebula/GSCD) vs FTC distinguishes them.
export function myCsa(role, d = store.data) {
  if (role === 'csa') return d.csas.find((c) => c.lifecycle === 'active' && c.resourceType === 'FTE') || null;
  if (role === 'partner-csa') return d.csas.find((c) => c.lifecycle === 'active' && c.resourceType === 'FTC') || null;
  return null;
}
export const successStoriesByEngagement = (engId) => store.data.successStories.filter((story) => (story.engagementIds || [story.engagementId]).includes(engId));
export const escalationsByEngagement = (engId) => store.data.escalations.filter((e) => e.engagementId === engId);
export const actionsByEscalation = (escId) => store.data.actions.filter((a) => a.escalationId === escId);
export const actionsByThread = (threadId) => store.data.actions.filter((a) => a.threadId === threadId);
export const actionsByEngagement = (engId) => store.data.actions.filter((a) => a.engagementId === engId);
export const openActions = (d = store.data) => d.actions.filter((a) => a.status !== 'done');

const NOW = new Date('2026-07-28T09:00:00Z').getTime();
export const hoursSince = (iso) => (NOW - new Date(iso).getTime()) / 3.6e6;
export const todayISO = () => new Date(NOW).toISOString().slice(0, 10);
export const daysFromNowISO = (n) => new Date(NOW + n * 864e5).toISOString().slice(0, 10);

export const CANONICAL_ENTITIES = [
  { entity: 'People', owner: 'People & POD Ops', source: 'HR roster + partner registry', key: 'people', count: (d) => d.csas.length + d.partners.length },
  { entity: 'PODs', owner: 'POD leadership', source: 'SSD IQ org model', key: 'pods', count: (d) => d.pods.length },
  { entity: 'Partners', owner: 'Delivery partner management', source: 'MOSA / provider registry', key: 'partners', count: (d) => d.partners.length },
  { entity: 'Engagements', owner: 'Dispatch & delivery lead', source: 'Demand + assignment pipeline', key: 'engagements', count: (d) => d.engagements.length },
  { entity: 'Success Stories', owner: 'Comms & Insight', source: 'SSD IQ', key: 'successStories', count: (d) => d.successStories.length },
  { entity: 'Escalations', owner: 'Escalation triage', source: 'Azure DevOps + service desk', key: 'escalations', count: (d) => d.escalations.length },
  { entity: 'Actions', owner: 'Ops follow-through', source: 'Action backlog', key: 'actions', count: (d) => d.actions.length },
  { entity: 'Messages', owner: 'Communications', source: 'Teams thread hub', key: 'messages', count: (d) => d.messages.length },
  { entity: 'Quality', owner: 'Quality & CPE', source: 'CPE / quality program', key: 'cpe', count: (d) => d.cpe.length },
  { entity: 'Capacity', owner: 'Capacity planning', source: 'Forecast + hiring plan', key: 'hiring', count: (d) => d.hiring.length },
  { entity: 'Financials', owner: 'SSD business management', source: 'Finance / Power BI', key: 'financials', count: (d) => d.financials.length },
  { entity: 'Strategy & IP', owner: 'Tech strategy & IP leads', source: 'Portfolio Management', key: 'initiatives', count: (d) => d.initiatives.length },
  { entity: 'Sentiment Signals', owner: 'Voice of customer', source: 'AI Services', key: 'sentimentSignals', count: (d) => d.sentimentSignals.length },
  { entity: 'Sentiment', owner: 'Voice of customer', source: 'AI sentiment rollup', key: 'sentiment', count: (d) => d.sentiment.length },
  { entity: 'Shadow Requests', owner: 'Enablement', source: 'Shadowing program', key: 'shadowRequests', count: (d) => d.shadowRequests.length },
  { entity: 'KYPL Sessions', owner: 'Enablement', source: 'Partner CSA onboarding', key: 'kyplSessions', count: (d) => d.kyplSessions.length },
  { entity: 'IP Feedback', owner: 'IP Lead · CSAM Innovation', source: 'Agentic Delivery', key: 'ipFeedback', count: (d) => d.ipFeedback.length },
  { entity: 'IP Content Feedback', owner: 'IP Lead · CSAM Innovation', source: 'IP Feedback (agentic triage)', key: 'ipFeedbackCases', count: (d) => d.ipFeedbackCases.length },
  { entity: 'Engagement Feedback', owner: 'Delivery agents · Agentic Delivery', source: 'Agentic Delivery', key: 'engagementFeedback', count: (d) => d.engagementFeedback.length },
  { entity: 'Attrition', owner: 'Capacity planning', source: 'HC Consolidation', key: 'attrition', count: (d) => d.attrition.length },
];

export function canonicalEntityMap(d = store.data) {
  return CANONICAL_ENTITIES.map((e) => ({
    ...e,
    count: e.count(d),
  }));
}

export function computeKpis(d = store.data) {
  const active = d.engagements.filter((e) => e.status === 'assigned' || e.status === 'in-delivery').length;
  const onTime = d.deliveries.filter((dl) => { const e = d.engagements.find((x) => x.id === dl.engagementId); return e ? dl.completedDate <= e.dueDate : false; }).length;
  const onTimePct = d.deliveries.length ? Math.round((onTime / d.deliveries.length) * 100) : 0;
  const rollingCpe = d.cpe.length ? Math.round((d.cpe.reduce((s, c) => s + c.score, 0) / d.cpe.length) * 10) / 10 : 0;
  const open = d.escalations.filter((e) => e.status !== 'resolved');
  const slaBreaches = open.filter((e) => hoursSince(e.opened) > e.slaHours).length;
  const activeCsas = d.csas.filter((c) => c.lifecycle === 'active');
  const utilization = activeCsas.length ? Math.round(activeCsas.reduce((s, c) => s + c.utilization, 0) / activeCsas.length) : 0;
  const latest = d.sentiment.filter((s) => s.scopeType === 'partner' && s.period === '2026-07');
  const netSentiment = latest.length ? Math.round(latest.reduce((s, r) => s + r.net, 0) / latest.length) : 0;
  const attritionRate = activeCsas.length ? Math.round((d.attrition.length / (activeCsas.length + d.attrition.length)) * 1000) / 10 : 0;
  return { activeEngagements: active, onTimePct, rollingCpe, openEscalations: open.length, slaBreaches, utilization, netSentiment, deliveriesCompleted: d.deliveries.length, attritionRate };
}

export function sentimentBreakdown(d = store.data) {
  const src = d.sentimentSignals.map((signal) => signal.score >= 0.15 ? 'positive' : signal.score <= -0.15 ? 'negative' : 'neutral');
  return {
    positive: src.filter((s) => s === 'positive').length,
    neutral: src.filter((s) => s === 'neutral').length,
    negative: src.filter((s) => s === 'negative').length,
  };
}

// Composite POD performance — blends CPE, quality, utilization, escalations and sentiment into a single
// 0-100 score (mirrors the per-CSA scorecard on Performance & PIPs, rolled up to POD level).
export function computePodPerformance(d = store.data) {
  return d.pods.map((pod) => {
    const csas = d.csas.filter((c) => c.podId === pod.id && c.lifecycle === 'active');
    const engIds = new Set(d.engagements.filter((e) => csas.some((c) => c.id === e.assignedTo)).map((e) => e.id));
    const mine = d.engagements.filter((e) => engIds.has(e.id));
    const complete = mine.filter((e) => e.status === 'complete').length;
    const dels = d.deliveries.filter((dl) => engIds.has(dl.engagementId));
    const onTime = dels.filter((dl) => { const e = mine.find((x) => x.id === dl.engagementId); return e && dl.completedDate <= e.dueDate; }).length;
    const onTimePct = dels.length ? Math.round((onTime / dels.length) * 100) : null;
    const escs = d.escalations.filter((e) => engIds.has(e.engagementId));
    const openEsc = escs.filter((e) => e.status !== 'resolved').length;
    const slaBreach = escs.filter((e) => e.status !== 'resolved' && hoursSince(e.opened) > e.slaHours).length;
    const avgCpe = csas.length ? Math.round((csas.reduce((s, c) => s + c.cpe, 0) / csas.length) * 10) / 10 : 0;
    const avgQuality = csas.length ? Math.round((csas.reduce((s, c) => s + c.quality, 0) / csas.length) * 10) / 10 : 0;
    const util = csas.length ? Math.round(csas.reduce((s, c) => s + c.utilization, 0) / csas.length) : pod.utilization;
    const positive = csas.filter((c) => c.sentiment === 'positive').length;
    const negative = csas.filter((c) => c.sentiment === 'negative').length;
    const netSentiment = csas.length ? Math.round(((positive - negative) / csas.length) * 100) : 0;
    const deliveryRate = mine.length ? Math.round((complete / mine.length) * 100) : 0;
    const attritionCount = d.attrition.filter((a) => a.podId === pod.id && hoursSince(a.exitDate) <= 8760).length;

    const cpeNorm = (avgCpe / 5) * 100;
    const qualityNorm = (avgQuality / 5) * 100;
    const utilNorm = Math.max(0, 100 - Math.abs(util - 85) * 2);
    const escNorm = Math.max(0, 100 - openEsc * 15);
    const sentimentNorm = (netSentiment + 100) / 2;
    const score = Math.round(cpeNorm * 0.3 + qualityNorm * 0.25 + utilNorm * 0.15 + escNorm * 0.15 + sentimentNorm * 0.15);
    const tier = score >= 90 ? 'Leading' : score >= 80 ? 'On track' : 'Needs attention';

    return {
      id: pod.id, name: pod.name, leadName: pod.leadName, csaManager: pod.csaManager, tz: pod.tz, region: pod.region, tracks: pod.tracks,
      csaCount: csas.length, activeEngagements: mine.filter((e) => e.status === 'assigned' || e.status === 'in-delivery').length,
      onTimePct, openEsc, slaBreach, avgCpe, avgQuality, util, netSentiment, deliveryRate, attritionCount, score, tier,
    };
  });
}

// S500 = eligibility (computed from CPE/quality/tenure) reconciled against readiness (marked independently,
// e.g. in SharePoint). A reconciliation gap is when the marked flag doesn't match computed eligibility.
export function computeS500(d = store.data) {
  return d.csas.filter((c) => c.lifecycle === 'active').map((c) => {
    const eligible = c.cpe >= 4.4 && c.quality >= 4.4 && c.tenureMonths >= 6;
    const reason = eligible ? 'Meets CPE, quality & tenure' : c.cpe < 4.4 ? 'CPE below 4.4' : c.quality < 4.4 ? 'Quality below 4.4' : 'Tenure < 6 months';
    return { csa: c, eligible, ready: c.s500Ready, reconciled: c.s500Ready === eligible, reason };
  });
}

// S500 customers must be served by an S500-ready CSA; flag any that are not (target: 0).
export function s500FlaggedEngagements(d = store.data) {
  const readyById = new Map(d.csas.map((c) => [c.id, c.s500Ready]));
  return d.engagements.filter((e) => e.s500Customer && e.assignedTo && !readyById.get(e.assignedTo));
}

// Composite Partner performance — same blend as computePodPerformance, rolled up to the Delivery Partner
// (Supplier), plus S500 readiness and the S500-customer/non-ready-CSA flag (CAP-10 FR-DP-5/FR-DP-7).
export function computePartnerPerformance(d = store.data) {
  const flagged = s500FlaggedEngagements(d);
  return d.partners.map((partner) => {
    const csas = d.csas.filter((c) => c.partnerId === partner.id && c.lifecycle === 'active');
    const engIds = new Set(d.engagements.filter((e) => csas.some((c) => c.id === e.assignedTo)).map((e) => e.id));
    const mine = d.engagements.filter((e) => engIds.has(e.id));
    const complete = mine.filter((e) => e.status === 'complete').length;
    const dels = d.deliveries.filter((dl) => engIds.has(dl.engagementId));
    const onTime = dels.filter((dl) => { const e = mine.find((x) => x.id === dl.engagementId); return e && dl.completedDate <= e.dueDate; }).length;
    const onTimePct = dels.length ? Math.round((onTime / dels.length) * 100) : null;
    const escs = d.escalations.filter((e) => engIds.has(e.engagementId));
    const openEsc = escs.filter((e) => e.status !== 'resolved').length;
    const slaBreach = escs.filter((e) => e.status !== 'resolved' && hoursSince(e.opened) > e.slaHours).length;
    const avgCpe = csas.length ? Math.round((csas.reduce((s, c) => s + c.cpe, 0) / csas.length) * 10) / 10 : partner.cpe;
    const avgQuality = csas.length ? Math.round((csas.reduce((s, c) => s + c.quality, 0) / csas.length) * 10) / 10 : partner.quality;
    const util = csas.length ? Math.round(csas.reduce((s, c) => s + c.utilization, 0) / csas.length) : 0;
    const positive = csas.filter((c) => c.sentiment === 'positive').length;
    const negative = csas.filter((c) => c.sentiment === 'negative').length;
    const netSentiment = csas.length ? Math.round(((positive - negative) / csas.length) * 100) : 0;
    const deliveryRate = mine.length ? Math.round((complete / mine.length) * 100) : 0;
    const s500ReadyCount = csas.filter((c) => c.s500Ready).length;
    const s500ReadyPct = csas.length ? Math.round((s500ReadyCount / csas.length) * 100) : 0;
    const s500Flags = flagged.filter((e) => csas.some((c) => c.id === e.assignedTo)).length;
    const attritionCount = d.attrition.filter((a) => a.partnerId === partner.id && hoursSince(a.exitDate) <= 8760).length;

    const cpeNorm = (avgCpe / 5) * 100;
    const qualityNorm = (avgQuality / 5) * 100;
    const utilNorm = Math.max(0, 100 - Math.abs(util - 85) * 2);
    const escRate = csas.length ? openEsc / csas.length : 0;
    const escNorm = Math.max(0, 100 - escRate * 100);
    const sentimentNorm = (netSentiment + 100) / 2;
    const score = Math.round(cpeNorm * 0.3 + qualityNorm * 0.25 + utilNorm * 0.15 + escNorm * 0.15 + sentimentNorm * 0.15);
    const tier = score >= 90 ? 'Leading' : score >= 80 ? 'On track' : 'Needs attention';

    return {
      id: partner.id, name: partner.name, region: partner.region, status: partner.status,
      csaCount: csas.length, activeEngagements: mine.filter((e) => e.status === 'assigned' || e.status === 'in-delivery').length,
      onTimePct, openEsc, slaBreach, avgCpe, avgQuality, util, netSentiment, deliveryRate, s500ReadyPct, s500Flags, attritionCount, score, tier,
    };
  });
}

// ---- Capacity Trajectory Simulator ----
// Projects, per key (Family, Time zone or Language), when required headcount (driven by the demand
// trajectory and expected utilization) will exceed available headcount (active + hiring pipeline −
// expected attrition), and works back by the onboarding lead time to say when a hire must be started.
// Gap sign convention: available − required, so a POSITIVE gap is excess capacity and a NEGATIVE gap
// is under capacity. Language scope enforces a floor of at least 1 person (minimum language coverage).
const monthAdd = (key, delta) => { const [y, m] = key.split('-').map(Number); return new Date(Date.UTC(y, m - 1 + delta, 1)).toISOString().slice(0, 7); };
const monthLabel = (key) => { const [y, m] = key.split('-').map(Number); return new Date(Date.UTC(y, m - 1, 1)).toLocaleString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' }); };
const fiscalQuarter = (key) => {
  const [y, m] = key.split('-').map(Number);
  const fyYear = m >= 7 ? y + 1 : y;
  const q = m >= 7 && m <= 9 ? 1 : m >= 10 && m <= 12 ? 2 : m >= 1 && m <= 3 ? 3 : 4;
  return `FY${String(fyYear).slice(-2)} Q${q}`;
};
function detectTrend(engagementCounts) {
  const last = engagementCounts.slice(-3);
  const deltas = [];
  for (let i = 1; i < last.length; i++) if (last[i - 1] > 0) deltas.push((last[i] - last[i - 1]) / last[i - 1]);
  return deltas.length ? deltas.reduce((s, v) => s + v, 0) / deltas.length : 0;
}
const CAPACITY_MEMBER_OF = {
  family: (c, key) => c.tracks.includes(key),
  tz: (c, key, d) => { const pod = d.pods.find((p) => p.id === c.podId); return !!pod && pod.tz === key; },
  language: (c, key) => c.languages.includes(key),
};
export function computeCapacityForecast(d = store.data, opts = {}) {
  const {
    scope = 'family', horizonMonths = 12, utilizationTarget = BASELINE_UTILIZATION, onboardingMonths = 3,
    monthlyTrendOverrides = {}, monthlyTargetOverrides = {},
  } = opts;
  const effectiveCapPerCsa = CAP_PER_CSA * (utilizationTarget / BASELINE_UTILIZATION);
  const active = d.csas.filter((c) => c.lifecycle === 'active');
  const openReqs = (d.hiring || []).filter((h) => h.stage !== 'Hired');
  const currentMonth = todayISO().slice(0, 7);
  const minRequired = scope === 'language' ? 1 : 0;
  const memberOf = CAPACITY_MEMBER_OF[scope];
  // Hiring/attrition records carry family + tz, but not language — pipeline/attrition can't be
  // attributed per language in this dataset, so available headcount for that scope is current-only.
  const pipelineMatches = (h, key) => (scope === 'family' ? h.family === key : scope === 'tz' ? h.tz === key : false);
  const attritionMatches = (a, key) => (scope === 'family' ? a.family === key : scope === 'tz' ? a.tz === key : false);

  const keys = Object.keys(d.demandHistory[scope] || {});
  const items = keys.map((key) => {
    const history = d.demandHistory[scope][key] || [];
    const detectedTrendPct = Math.round(detectTrend(history.map((h) => h.engagements)) * 1000) / 10;
    const currentHeadcount = active.filter((c) => memberOf(c, key, d)).length;
    const baseTarget = (d.capacityTargets[scope] || {})[key] || currentHeadcount;
    const baseDemand = history.length ? history[history.length - 1].engagements : 0;
    const attritionPerMonth = d.attrition.filter((a) => attritionMatches(a, key) && hoursSince(a.exitDate) <= 8760).length / 12;
    const trendOverridesForKey = monthlyTrendOverrides[key] || {};
    const targetOverridesForKey = monthlyTargetOverrides[key] || {};

    let projectedDemand = baseDemand;
    let cumulativeHires = 0;
    let cumulativeAttrition = 0;
    let breach = null;
    const series = [];
    for (let m = 1; m <= horizonMonths; m++) {
      const monthKey = monthAdd(currentMonth, m);
      const trendPct = trendOverridesForKey[m] != null ? trendOverridesForKey[m] : detectedTrendPct;
      projectedDemand *= (1 + trendPct / 100);
      const required = Math.max(minRequired, Math.ceil(projectedDemand / effectiveCapPerCsa));
      cumulativeHires += openReqs.filter((h) => pipelineMatches(h, key) && h.targetStart.slice(0, 7) === monthKey).length;
      cumulativeAttrition += attritionPerMonth;
      const available = Math.max(0, Math.round(currentHeadcount + cumulativeHires - cumulativeAttrition));
      const target = targetOverridesForKey[m] != null ? targetOverridesForKey[m] : baseTarget;
      const gap = available - required;
      if (breach == null && gap < 0) breach = { monthKey, gap, required, available };
      series.push({ monthKey, label: monthLabel(monthKey), demand: Math.round(projectedDemand), required, available, target, trendPct, gap });
    }
    const hireByMonth = breach ? monthAdd(breach.monthKey, -onboardingMonths) : null;
    return {
      key, target: baseTarget, currentHeadcount, detectedTrendPct,
      history: history.map((h) => ({ ...h, isPast: true })), series,
      breach: breach ? { ...breach, label: monthLabel(breach.monthKey), quarter: fiscalQuarter(breach.monthKey) } : null,
      hireByMonth: hireByMonth ? { key: hireByMonth, label: monthLabel(hireByMonth), quarter: fiscalQuarter(hireByMonth), overdue: hireByMonth < currentMonth } : null,
    };
  });

  return { scope, effectiveCapPerCsa, utilizationTarget, onboardingMonths, currentMonth, minRequired, items };
}

// POD - IP Kit Feedback: each engagement has its own IP Kit (derived from its Program) — not a shared
// component library — so usage/rating is rolled up per Kit (Program) across the engagements that used it.
export function ipKitStats(d = store.data) {
  const groups = new Map();
  d.ipFeedback.forEach((f) => {
    const eng = d.engagements.find((e) => e.id === f.engagementId);
    if (!eng) return;
    if (!groups.has(eng.program)) groups.set(eng.program, { program: eng.program, track: eng.track, feedback: [] });
    groups.get(eng.program).feedback.push(f);
  });
  return [...groups.values()].map((g) => {
    const fb = g.feedback;
    const avgRating = fb.length ? Math.round((fb.reduce((s, f) => s + f.rating, 0) / fb.length) * 10) / 10 : null;
    const needsAttention = fb.filter((f) => f.tag === 'Needs major update' || f.tag === 'Outdated — retire').length;
    const latest = fb.length ? [...fb].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))[0] : null;
    return { id: g.program, name: `${g.program} IP Kit`, program: g.program, track: g.track, feedbackCount: fb.length, avgRating, needsAttention, latest };
  });
}

export function ipFeedbackForEngagement(engagementId, d = store.data) {
  return d.ipFeedback.filter((f) => f.engagementId === engagementId);
}

// ---- Mutations (mutate in-memory data + notify) ----
let msgSeq = 9000;
let escSeq = 9000;
let actSeq = 9000;
let storySeq = store.data.successStories.reduce((max, story) => Math.max(max, Number(story.id.replace(/^SS/, '')) || 0), 0) + 1;
export function assignEngagement(engId, csaId) {
  const e = byId(store.data.engagements, engId);
  if (e) { e.assignedTo = csaId; if (e.status === 'new') e.status = 'assigned'; if (e.dispatchStage === 'Day 0') e.dispatchStage = 'Day 1'; }
  emit('data');
}
export function setEngagementStatus(engId, status) { const e = byId(store.data.engagements, engId); if (e) e.status = status; emit('data'); }

// ---- Proactive Dispatch (T-3W) — interactive outreach cadence + one-click / auto execution ----
const OUTREACH_DAYS = ['day0', 'day1', 'day2', 'day3'];
function stageForOutreach(e) {
  const doneCount = OUTREACH_DAYS.filter((k) => e.outreach[k]).length;
  return doneCount >= 4 ? 'engaged' : `Day ${doneCount}`;
}
function logOutreach(e, day, mode, by, draft) {
  if (!e.outreachLog) e.outreachLog = [];
  e.outreachLog.unshift({ day, at: new Date().toISOString(), by: by || 'you', mode, to: draft?.to || null, cc: draft?.cc || null, subject: draft?.subject || null, note: draft?.body || null });
}
// Manual check/uncheck of a single Day 0-3 touch — the CSA (or POD Lead) confirming it happened.
export function toggleOutreachDay(engId, day, by) {
  const e = byId(store.data.engagements, engId);
  if (!e || !OUTREACH_DAYS.includes(day)) return;
  e.outreach[day] = !e.outreach[day];
  logOutreach(e, day, e.outreach[day] ? 'manual-complete' : 'manual-reopen', by);
  if (e.dispatchStage !== 'engaged' || !e.outreach[day]) e.dispatchStage = stageForOutreach(e);
  emit('data');
}
// One-click send: complete the next outstanding step and log the drafted email (to/cc/subject/body) used.
export function sendOutreachStep(engId, draft, by) {
  const e = byId(store.data.engagements, engId);
  if (!e) return null;
  const day = OUTREACH_DAYS.find((k) => !e.outreach[k]);
  if (!day) return null;
  e.outreach[day] = true;
  logOutreach(e, day, 'automated', by || 'you', draft);
  e.dispatchStage = stageForOutreach(e);
  emit('data');
  return day;
}
// Automate the whole remaining cadence for this one engagement in one go — draftsByDay: { day0: {to,cc,subject,body}, ... }
export function sendAllRemainingSteps(engId, draftsByDay, by) {
  const e = byId(store.data.engagements, engId);
  if (!e) return [];
  const done = [];
  OUTREACH_DAYS.forEach((day) => {
    if (!e.outreach[day] && draftsByDay[day]) {
      e.outreach[day] = true;
      logOutreach(e, day, 'automated', by || 'you', draftsByDay[day]);
      done.push(day);
    }
  });
  if (done.length) e.dispatchStage = stageForOutreach(e);
  emit('data');
  return done;
}
const STORY_STATUSES = new Set(['draft', 'sdm-review', 'pod-review', 'leadership-review', 'approved', 'published', 'archived']);
export const SUCCESS_STORY_TRANSITIONS = {
  draft: ['sdm-review'],
  'sdm-review': ['draft', 'pod-review'],
  'pod-review': ['draft', 'leadership-review'],
  'leadership-review': ['draft', 'approved'],
  approved: ['published'],
  published: ['archived'],
  archived: ['draft'],
};
function validateSuccessStory(story) {
  const engagementIds = Array.isArray(story.engagementIds) && story.engagementIds.length ? story.engagementIds : [story.engagementId];
  if (!engagementIds.length || engagementIds.some((id) => !byId(store.data.engagements, id))) throw new Error('At least one valid engagement is required for a success story.');
  const cpe = story.cpeId ? byId(store.data.cpe, story.cpeId) : null;
  if (story.cpeId && !cpe) throw new Error(`VSAT/CPE record ${story.cpeId} was not found.`);
  if (cpe && !engagementIds.includes(cpe.engagementId)) throw new Error(`VSAT/CPE record ${story.cpeId} must be linked to one of the story engagements.`);
  if (!String(story.title || '').trim()) throw new Error('A success story title is required.');
  if (!String(story.summary || '').trim()) throw new Error('A success story summary is required.');
  if (!String(story.keyOutcomes || '').trim()) throw new Error('Success story key outcomes are required.');
  if (!String(story.insights || '').trim()) throw new Error('Success story insights are required.');
  if (!String(story.impact || '').trim()) throw new Error('A success story impact statement is required.');
  if (!String(story.customerQuote || '').trim() && !String(story.csamQuote || '').trim()) throw new Error('Customer or CSAM feedback is required.');
  ['family', 'area', 'country', 'industry', 'segment', 'fiscalYear', 'month', 'csamName', 'podLeadName', 'partnerName', 'partnerCsaName'].forEach((field) => {
    if (!String(story[field] || '').trim()) throw new Error(`Success story ${field} is required.`);
  });
  if (!Array.isArray(story.eventNames) || !story.eventNames.length) throw new Error('At least one Success Program event is required.');
  if (!STORY_STATUSES.has(story.status)) throw new Error(`Unsupported success story status: ${story.status}`);
  if (story.ltApproved && !['published', 'archived'].includes(story.status)) throw new Error('LT approval can only be applied after a story is published.');
}
function normalizedStoryFields(story, now) {
  const engagementIds = [...new Set((Array.isArray(story.engagementIds) && story.engagementIds.length ? story.engagementIds : [story.engagementId]).filter(Boolean))];
  const published = story.status === 'published';
  const uploaded = published || (story.status === 'archived' && story.sharePointStatus === 'uploaded');
  return {
    engagementId: engagementIds[0],
    engagementIds,
    cpeId: story.cpeId || null,
    feedbackSource: String(story.feedbackSource || 'Impactful delivery').trim(),
    title: String(story.title).trim(),
    headline: String(story.headline || 'Partner-led delivery driving executive trust and actionable outcomes').trim(),
    summary: String(story.summary).trim(),
    keyOutcomes: String(story.keyOutcomes).trim(),
    insights: String(story.insights).trim(),
    impact: String(story.impact).trim(),
    customerQuote: String(story.customerQuote || '').trim(),
    customerQuoteAttribution: String(story.customerQuoteAttribution || '').trim(),
    csamQuote: String(story.csamQuote || '').trim(),
    tags: [...new Set((Array.isArray(story.tags) ? story.tags : []).map((tag) => String(tag).trim()).filter(Boolean))],
    family: String(story.family).trim(),
    eventNames: [...new Set(story.eventNames.map((event) => String(event).trim()).filter(Boolean))],
    timeZone: String(story.timeZone || 'Global').trim(),
    area: String(story.area).trim(),
    country: String(story.country).trim(),
    industry: String(story.industry).trim(),
    segment: String(story.segment).trim(),
    fiscalYear: String(story.fiscalYear).trim(),
    month: String(story.month).trim(),
    csamName: String(story.csamName).trim(),
    podLeadName: String(story.podLeadName).trim(),
    partnerName: String(story.partnerName).trim(),
    partnerCsaName: String(story.partnerCsaName).trim(),
    status: story.status,
    ownerName: String(story.ownerName || '').trim() || 'Unassigned',
    reviewHistory: Array.isArray(story.reviewHistory) ? story.reviewHistory : [],
    featured: published && Boolean(story.featured),
    ltApproved: Boolean(story.ltApproved),
    ltApprovedBy: story.ltApproved ? String(story.ltApprovedBy || '').trim() : null,
    ltApprovedAt: story.ltApproved ? (story.ltApprovedAt || now) : null,
    sharePointStatus: uploaded ? 'uploaded' : 'not-uploaded',
    sharePointUrl: uploaded ? (story.sharePointUrl || `https://microsoft.sharepoint.com/sites/SuccessServicesDelivery/success-stories/${story.id}`) : null,
    publishDate: published ? (story.publishDate || now.slice(0, 10)) : (story.status === 'archived' ? story.publishDate : null),
    approvedAt: ['approved', 'published', 'archived'].includes(story.status) ? (story.approvedAt || now) : null,
    customerLogoDataUrl: story.customerLogoDataUrl || null,
    customerLogoName: story.customerLogoDataUrl ? (story.customerLogoName || 'customer-logo') : null,
  };
}
export function addSuccessStory(input) {
  const now = new Date().toISOString();
  const candidate = { status: 'draft', ...input };
  validateSuccessStory(candidate);
  const story = {
    id: `SS${String(storySeq++).padStart(3, '0')}`,
    ...normalizedStoryFields(candidate, now),
    createdAt: now.slice(0, 10),
    sourceOfTruth: 'SSD IQ',
    updatedAt: now.slice(0, 10),
    audit: [{ at: now, who: store.role, action: 'success story created' }],
  };
  store.data.successStories.unshift(story);
  emit('data');
  return story.id;
}
export function updateSuccessStory(id, changes) {
  const story = byId(store.data.successStories, id);
  if (!story) throw new Error(`Success story ${id} was not found.`);
  const now = new Date().toISOString();
  const candidate = { ...story, ...changes };
  validateSuccessStory(candidate);
  const previousStatus = story.status;
  Object.assign(story, normalizedStoryFields(candidate, now), { updatedAt: now.slice(0, 10) });
  story.audit.push({
    at: now,
    who: store.role,
    action: previousStatus === story.status ? 'success story updated' : `status changed from ${previousStatus} to ${story.status}`,
  });
  emit('data');
}
export function transitionSuccessStory(id, nextStatus, { actorName, comment = '' } = {}) {
  const story = byId(store.data.successStories, id);
  if (!story) throw new Error(`Success story ${id} was not found.`);
  if (!(SUCCESS_STORY_TRANSITIONS[story.status] || []).includes(nextStatus)) throw new Error(`Success story cannot move from ${story.status} to ${nextStatus}.`);
  const stage = {
    'sdm-review': 'SDM review', 'pod-review': 'POD Lead review', 'leadership-review': 'SSD Leadership review',
    approved: 'SSD Leadership approval', published: 'SharePoint publication', archived: 'Archive', draft: 'Changes requested',
  }[nextStatus];
  const reviewHistory = [...story.reviewHistory, {
    at: new Date().toISOString(),
    by: actorName || store.role,
    stage,
    decision: nextStatus === 'draft' ? 'changes-requested' : 'approved',
    comment: String(comment || '').trim(),
  }];
  updateSuccessStory(id, {
    status: nextStatus,
    reviewHistory,
    ...(nextStatus === 'draft' ? { ltApproved: false, ltApprovedBy: null, ltApprovedAt: null } : {}),
  });
}
export function setSuccessStoryLtApproval(id, approved, approverName) {
  updateSuccessStory(id, {
    ltApproved: approved,
    ltApprovedBy: approved ? approverName : null,
    ltApprovedAt: approved ? new Date().toISOString() : null,
  });
}
export function deleteSuccessStory(id) {
  const index = store.data.successStories.findIndex((story) => story.id === id);
  if (index < 0) throw new Error(`Success story ${id} was not found.`);
  if (store.data.successStories[index].status !== 'draft') throw new Error('Only draft success stories can be deleted.');
  store.data.successStories.splice(index, 1);
  emit('data');
}
export function setEscalationStatus(escId, status) { const e = byId(store.data.escalations, escId); if (e) e.status = status; emit('data'); }
export function setActionStatus(actId, status) { const a = byId(store.data.actions, actId); if (a) a.status = status; emit('data'); }
export function acknowledgeSentimentAlert(signalId) {
  const signal = byId(store.data.sentimentSignals, signalId);
  if (!signal) throw new Error(`Sentiment signal ${signalId} was not found.`);
  if (signal.alertStatus !== 'open') throw new Error(`Sentiment signal ${signalId} does not have an open alert.`);
  const now = new Date().toISOString();
  signal.alertStatus = 'acknowledged';
  signal.acknowledgedBy = store.role;
  signal.acknowledgedAt = now;
  signal.updatedAt = now.slice(0, 10);
  signal.audit.push({ at: now, who: store.role, action: 'sentiment alert acknowledged' });
  emit('data');
}
export function addEscalation({ engagementId, severity, summary, ownerName, sdmName, raisedBy = null, channel = 'internal' }) {
  const id = `ESC${escSeq++}`;
  store.data.escalations.unshift({ id, engagementId, severity, status: 'new', ownerName, sdmName, raisedBy: raisedBy || 'you', channel, adoRef: `AB#${Math.floor(Math.random() * 80000 + 10000)}`, opened: new Date().toISOString().slice(0, 10), slaHours: { sev1: 8, sev2: 24, sev3: 48, sev4: 72 }[severity], actionIds: [], summary, sourceOfTruth: 'Azure DevOps', updatedAt: new Date().toISOString().slice(0, 10), audit: [{ at: new Date().toISOString(), who: raisedBy || 'you', action: 'escalation raised' }] });
  emit('data');
  return id;
}
let pipSeq = store.data.pips.reduce((max, p) => Math.max(max, Number(p.id.replace(/^PIP/, '')) || 0), 0) + 1;
const PIP_CATEGORIES = ['technical-skills', 'soft-skills', 'language-proficiency', 'delivery-skills'];
const PIP_KINDS = ['objective', 'training', 'certification', 'quality-check'];
function normalizePipObjective(o) {
  if (typeof o === 'string') return { label: o.trim(), category: 'delivery-skills', kind: 'objective' };
  return {
    label: String((o && o.label) || '').trim(),
    category: PIP_CATEGORIES.includes(o && o.category) ? o.category : 'delivery-skills',
    kind: PIP_KINDS.includes(o && o.kind) ? o.kind : 'objective',
  };
}
export function draftPip(csaId, objectiveInputs) {
  if (store.data.pips.some((p) => p.csaId === csaId && p.status !== 'closed')) throw new Error('An active or draft PIP already exists for this Partner CSA.');
  const objectives = (objectiveInputs || []).map(normalizePipObjective).filter((o) => o.label);
  if (!objectives.length) throw new Error('At least one objective is required to draft a PIP.');
  const id = `PIP${String(pipSeq++).padStart(3, '0')}`;
  store.data.pips.unshift({
    id, csaId, status: 'draft', opened: todayISO(),
    objectives: objectives.map((o) => ({ ...o, done: false })),
    checkIns: [], outcome: 'in-progress', sourceOfTruth: 'Confidential/HR', updatedAt: todayISO(),
    audit: [{ at: new Date().toISOString(), who: store.role, action: 'PIP drafted' }],
  });
  emit('data');
  return id;
}
export function addPipObjective(pipId, objectiveInput) {
  const pip = byId(store.data.pips, pipId);
  if (!pip) throw new Error(`PIP ${pipId} was not found.`);
  if (pip.status === 'closed') throw new Error('Cannot add objectives to a closed PIP.');
  const objective = normalizePipObjective(objectiveInput);
  if (!objective.label) throw new Error('An objective description is required.');
  pip.objectives.push({ ...objective, done: false });
  pip.updatedAt = todayISO();
  pip.audit.push({ at: new Date().toISOString(), who: store.role, action: `objective added: "${objective.label}"` });
  emit('data');
}
export function activatePip(pipId) {
  const pip = byId(store.data.pips, pipId);
  if (!pip) throw new Error(`PIP ${pipId} was not found.`);
  if (pip.status !== 'draft') throw new Error('Only a draft PIP can be activated.');
  pip.status = 'active';
  pip.updatedAt = todayISO();
  pip.audit.push({ at: new Date().toISOString(), who: store.role, action: 'PIP activated' });
  emit('data');
}
export function togglePipObjective(pipId, index) {
  const pip = byId(store.data.pips, pipId);
  const obj = pip && pip.objectives[index];
  if (!obj) return;
  obj.done = !obj.done;
  pip.updatedAt = todayISO();
  pip.audit.push({ at: new Date().toISOString(), who: store.role, action: `objective "${obj.label}" marked ${obj.done ? 'done' : 'open'}` });
  emit('data');
}
export function addPipCheckIn(pipId, note) {
  const pip = byId(store.data.pips, pipId);
  if (!pip) throw new Error(`PIP ${pipId} was not found.`);
  const text = String(note || '').trim();
  if (!text) throw new Error('A check-in note is required.');
  pip.checkIns.unshift({ date: todayISO(), note: text });
  pip.updatedAt = todayISO();
  pip.audit.push({ at: new Date().toISOString(), who: store.role, action: 'check-in added' });
  emit('data');
}
export function closePip(pipId, outcome) {
  const pip = byId(store.data.pips, pipId);
  if (!pip) throw new Error(`PIP ${pipId} was not found.`);
  if (!['met', 'not-met'].includes(outcome)) throw new Error('PIP outcome must be "met" or "not-met".');
  pip.status = 'closed';
  pip.outcome = outcome;
  pip.updatedAt = todayISO();
  pip.audit.push({ at: new Date().toISOString(), who: store.role, action: `PIP closed (outcome: ${outcome})` });
  emit('data');
}
let shdSeq = store.data.shadowRequests.reduce((max, s) => Math.max(max, Number(s.id.replace(/^SHD/, '')) || 0), 0) + 1;
export function requestShadow({ engagementId, requesterId, note }) {
  const eng = byId(store.data.engagements, engagementId);
  if (!eng) throw new Error(`Engagement ${engagementId} was not found.`);
  if (!eng.assignedTo) throw new Error('This delivery has no assigned delivery resource to request from yet.');
  if (!requesterId) throw new Error('Select who is requesting to shadow.');
  if (store.data.shadowRequests.some((s) => s.engagementId === engagementId && s.requesterId === requesterId && s.status !== 'declined')) throw new Error('A shadow request for this delivery already exists.');
  const id = `SHD${String(shdSeq++).padStart(3, '0')}`;
  store.data.shadowRequests.unshift({
    id, engagementId, requesterId, ownerId: eng.assignedTo, status: 'requested',
    note: String(note || '').trim(), requestedAt: todayISO(), respondedAt: null,
    sourceOfTruth: 'Enablement', updatedAt: todayISO(),
    audit: [{ at: new Date().toISOString(), who: store.role, action: 'shadow request sent' }],
  });
  emit('data');
  return id;
}
export function respondShadowRequest(id, status) {
  const req = byId(store.data.shadowRequests, id);
  if (!req) throw new Error(`Shadow request ${id} was not found.`);
  if (!['confirmed', 'declined'].includes(status)) throw new Error('Shadow request status must be "confirmed" or "declined".');
  req.status = status;
  req.respondedAt = todayISO();
  req.updatedAt = todayISO();
  req.audit.push({ at: new Date().toISOString(), who: store.role, action: `shadow request ${status}` });
  emit('data');
}

// ---- Know Your POD Lead (KYPL) — first structured session with the POD Lead, after account creation ----
let kypSeq = store.data.kyplSessions.reduce((max, k) => Math.max(max, Number(k.id.replace(/^KYP/, '')) || 0), 0) + 1;
export const kyplSessionForCsa = (csaId, d = store.data) => d.kyplSessions.find((k) => k.csaId === csaId) || null;
export function scheduleKyplSession({ csaId, scheduledAt, notes = '' }) {
  const csa = byId(store.data.csas, csaId);
  if (!csa) throw new Error(`CSA ${csaId} was not found.`);
  if (!scheduledAt) throw new Error('Pick a date for the session.');
  const now = new Date().toISOString();
  let session = store.data.kyplSessions.find((k) => k.csaId === csaId);
  if (!session) {
    session = { id: `KYP${String(kypSeq++).padStart(3, '0')}`, csaId, status: 'not-scheduled', scheduledAt: null, completedAt: null, notes: '', sourceOfTruth: 'Enablement', updatedAt: now, audit: [] };
    store.data.kyplSessions.unshift(session);
  }
  session.status = 'scheduled';
  session.scheduledAt = scheduledAt;
  session.notes = String(notes || '').trim();
  session.updatedAt = now;
  session.audit.push({ at: now, who: store.role, action: `KYPL session scheduled for ${scheduledAt}` });
  emit('data');
  return session.id;
}
export function completeKyplSession(csaId, notes = '') {
  const session = store.data.kyplSessions.find((k) => k.csaId === csaId);
  if (!session) throw new Error('Schedule the session before marking it complete.');
  const now = new Date().toISOString();
  session.status = 'completed';
  session.completedAt = todayISO();
  if (notes) session.notes = String(notes).trim();
  session.updatedAt = now;
  session.audit.push({ at: now, who: store.role, action: 'KYPL session completed' });
  emit('data');
}
const KYPL_READINESS = ['ready', 'needs-support', 'not-ready'];
export function evaluateKyplSession(csaId, { rating, readiness, strengths = '', concerns = '', assignActivity = false, sdmName = '', activityTitle = '', due = '', evaluatedBy = '' } = {}) {
  const session = store.data.kyplSessions.find((k) => k.csaId === csaId);
  if (!session) throw new Error('Schedule and complete the KYPL session before evaluating.');
  if (session.status !== 'completed') throw new Error('Complete the KYPL session before evaluating.');
  const ratingNum = Number(rating);
  if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) throw new Error('Rating must be between 1 and 5.');
  if (!KYPL_READINESS.includes(readiness)) throw new Error('Select a readiness call.');
  let actionId = null;
  if (assignActivity) {
    if (!sdmName) throw new Error('Select an SDM to assign the activity to.');
    if (!String(activityTitle || '').trim()) throw new Error('Describe the activity for the SDM.');
    actionId = addAction({ title: activityTitle.trim(), ownerName: sdmName, due: due || undefined, status: 'open', source: 'kypl', kyplSessionId: session.id });
  }
  const now = new Date().toISOString();
  session.evaluation = {
    rating: ratingNum, readiness, strengths: String(strengths || '').trim(), concerns: String(concerns || '').trim(),
    evaluatedBy: evaluatedBy || store.role, evaluatedAt: now, actionId,
  };
  session.updatedAt = now;
  session.audit.push({ at: now, who: evaluatedBy || store.role, action: `PCSA evaluated (${readiness}, rating ${ratingNum}/5)${actionId ? ` — activity assigned to ${sdmName}` : ''}` });
  emit('data');
  return session.evaluation;
}

// ---- Readiness Plan — structured SDM follow-up on a Partner CSA's progress after KYPL ----
export const READINESS_OBJECTIVES_DEFAULT = [
  'Shadow two live deliveries in the assigned track',
  'Complete a supervised delivery with POD Lead sign-off',
  'Maintain on-time Day 0–3 outreach across two consecutive engagements',
  'Pass a quality/QC review on delivered artifacts',
  'Readiness review sign-off with the SDM',
];
let rdpSeq = store.data.readinessPlans.reduce((max, p) => Math.max(max, Number(p.id.replace(/^RDP/, '')) || 0), 0) + 1;
export const readinessPlanForCsa = (csaId, d = store.data) => d.readinessPlans.find((p) => p.csaId === csaId && p.status !== 'closed') || null;
export const readinessPlansForSdm = (sdmName, d = store.data) => d.readinessPlans.filter((p) => p.sdmName === sdmName);
export function createReadinessPlan(csaId, { sdmName, targetDate, objectives, createdBy = '' } = {}) {
  const csa = byId(store.data.csas, csaId);
  if (!csa) throw new Error(`CSA ${csaId} was not found.`);
  const session = store.data.kyplSessions.find((k) => k.csaId === csaId);
  if (!session || session.status !== 'completed') throw new Error('Complete the KYPL session before creating a readiness plan.');
  if (!sdmName) throw new Error('Select an SDM to own the readiness plan.');
  if (store.data.readinessPlans.some((p) => p.csaId === csaId && p.status !== 'closed')) throw new Error('An active readiness plan already exists for this Partner CSA.');
  const objs = (objectives && objectives.length ? objectives : READINESS_OBJECTIVES_DEFAULT).map((label) => ({ label: String(label).trim(), done: false })).filter((o) => o.label);
  if (!objs.length) throw new Error('At least one objective is required.');
  const now = new Date().toISOString();
  const id = `RDP${String(rdpSeq++).padStart(3, '0')}`;
  const by = createdBy || store.role;
  store.data.readinessPlans.unshift({
    id, csaId, kyplSessionId: session.id, sdmName, createdBy: by,
    status: 'active', targetDate: targetDate || daysFromNowISO(30),
    objectives: objs, checkIns: [], outcome: 'in-progress',
    sourceOfTruth: 'Enablement', createdAt: now, updatedAt: now,
    audit: [{ at: now, who: by, action: `readiness plan created, owned by ${sdmName}` }],
  });
  if (session.evaluation) session.evaluation.readinessPlanId = id;
  addAction({ title: `Readiness plan review — ${csa.name}`, ownerName: sdmName, due: targetDate || daysFromNowISO(30), status: 'open', source: 'readiness-plan', readinessPlanId: id });
  emit('data');
  return id;
}
export function toggleReadinessObjective(planId, index, by = '') {
  const plan = byId(store.data.readinessPlans, planId);
  const obj = plan && plan.objectives[index];
  if (!obj) return;
  obj.done = !obj.done;
  plan.updatedAt = todayISO();
  plan.audit.push({ at: new Date().toISOString(), who: by || store.role, action: `objective "${obj.label}" marked ${obj.done ? 'done' : 'open'}` });
  emit('data');
}
export function addReadinessCheckIn(planId, note, by = '') {
  const plan = byId(store.data.readinessPlans, planId);
  if (!plan) throw new Error(`Readiness plan ${planId} was not found.`);
  const text = String(note || '').trim();
  if (!text) throw new Error('A check-in note is required.');
  plan.checkIns.unshift({ date: todayISO(), note: text, by: by || store.role });
  plan.updatedAt = todayISO();
  plan.audit.push({ at: new Date().toISOString(), who: by || store.role, action: 'check-in added' });
  emit('data');
}
export function closeReadinessPlan(planId, outcome, by = '') {
  const plan = byId(store.data.readinessPlans, planId);
  if (!plan) throw new Error(`Readiness plan ${planId} was not found.`);
  if (!['ready', 'extended'].includes(outcome)) throw new Error('Outcome must be "ready" or "extended".');
  plan.status = 'closed';
  plan.outcome = outcome;
  plan.updatedAt = todayISO();
  plan.audit.push({ at: new Date().toISOString(), who: by || store.role, action: `readiness plan closed (${outcome})` });
  emit('data');
}

let ipfSeq = store.data.ipFeedback.reduce((max, f) => Math.max(max, Number(f.id.replace(/^IPF/, '')) || 0), 0) + 1;
export function addIpFeedback({ engagementId, rating, tag, comment }) {
  const eng = byId(store.data.engagements, engagementId);
  if (!eng) throw new Error(`Engagement ${engagementId} was not found.`);
  const ratingNum = Number(rating);
  if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) throw new Error('Rating must be between 1 and 5.');
  if (!IP_TAGS.includes(tag)) throw new Error('Select a valid feedback tag.');
  const csa = eng.assignedTo ? byId(store.data.csas, eng.assignedTo) : null;
  const id = `IPF${String(ipfSeq++).padStart(3, '0')}`;
  store.data.ipFeedback.unshift({
    id, engagementId, csaId: csa ? csa.id : null, podId: csa ? csa.podId : null, rating: ratingNum, tag, comment: String(comment || '').trim(),
    submittedAt: todayISO(), sourceOfTruth: 'Agentic Delivery', updatedAt: todayISO(),
    audit: [{ at: new Date().toISOString(), who: store.role, action: 'IP Kit feedback submitted' }],
  });
  emit('data');
  return id;
}

// ---- IP Feedback (content issues → IP Leads, triaged by the simulated agent pipeline) ----
let cfbSeq = store.data.ipFeedbackCases.reduce((max, c) => Math.max(max, Number(c.id.replace(/^CFB/, '')) || 0), 0) + 1;
export const ipFeedbackMine = (name, d = store.data) => d.ipFeedbackCases.filter((c) => c.submittedByName === name);
export const ipFeedbackBacklog = (d = store.data) => d.ipFeedbackCases.filter((c) => ['backlog', 'confirmed', 'in-progress', 'postponed'].includes(c.status));
export function addIpFeedbackCase({ title, description, proposedChange = '', program, track = null, engagementId = null, submittedByName, submittedByRole }) {
  const t = String(title || '').trim();
  const desc = String(description || '').trim();
  if (!t) throw new Error('A short title is required.');
  if (!desc) throw new Error('Describe the content issue before submitting.');
  if (!program) throw new Error('Select the Program / IP Kit this feedback relates to.');
  const id = `CFB${String(cfbSeq++).padStart(3, '0')}`;
  const now = new Date().toISOString();
  const c = {
    id, title: t, description: desc, proposedChange: String(proposedChange || '').trim(),
    program, track, engagementId,
    submittedByName, submittedByRole,
    status: 'submitted', currentStepIndex: 0, agentSteps: [],
    category: null, priority: null, assignedIpLead: null,
    guideResolution: null, kitAnalysis: null, draftChange: null, expertReview: null, triage: null, ipLeadDecision: null,
    createdAt: now, sourceOfTruth: 'IP Feedback (agentic triage)', updatedAt: now,
    audit: [{ at: now, who: submittedByName, action: 'feedback submitted' }],
  };
  runFullPipeline(c);
  c.audit.push({ at: new Date().toISOString(), who: 'IP Feedback agents', action: `pipeline complete — ${c.status}` });
  store.data.ipFeedbackCases.unshift(c);
  emit('data');
  return id;
}
export function decideIpFeedback(id, decision, { by, note = '' } = {}) {
  const c = byId(store.data.ipFeedbackCases, id);
  if (!c) throw new Error(`Feedback case ${id} was not found.`);
  if (!['backlog', 'postponed'].includes(c.status)) throw new Error('This case is not awaiting an IP Lead decision.');
  if (!['confirmed', 'rejected', 'postponed'].includes(decision)) throw new Error('Decision must be confirmed, rejected or postponed.');
  const now = new Date().toISOString();
  const who = by || store.role;
  c.ipLeadDecision = { decision, by: who, at: now, note: String(note || '').trim() };
  c.status = decision;
  c.updatedAt = now;
  c.audit.push({ at: now, who, action: `IP Lead ${decision} the change${note ? `: "${note}"` : ''}` });
  emit('data');
}
export function progressIpFeedbackWork(id, nextStatus) {
  const c = byId(store.data.ipFeedbackCases, id);
  if (!c) throw new Error(`Feedback case ${id} was not found.`);
  const allowed = { confirmed: ['in-progress'], 'in-progress': ['done'] };
  if (!(allowed[c.status] || []).includes(nextStatus)) throw new Error(`Cannot move this case from ${c.status} to ${nextStatus}.`);
  c.status = nextStatus;
  c.updatedAt = new Date().toISOString();
  c.audit.push({ at: c.updatedAt, who: store.role, action: `moved to ${nextStatus}` });
  emit('data');
}

// ---- Engagement Feedback (in-flight check-ins logged from the Agentic Delivery support panel) ----
let efSeq = store.data.engagementFeedback.reduce((max, f) => Math.max(max, Number(f.id.replace(/^EF/, '')) || 0), 0) + 1;
export const engagementFeedbackFor = (engagementId, d = store.data) => d.engagementFeedback.filter((f) => f.engagementId === engagementId);
function classifyFeedbackSentiment(text) {
  const positive = /(great|thank|smooth|helpful|appreciate|excellent|on track)/i.test(text);
  const negative = /(concern|frustrat|slow|delay|unhappy|disappoint|blocker|confus)/i.test(text);
  return positive && !negative ? 'positive' : negative ? 'negative' : 'neutral';
}
export function addEngagementFeedback({ engagementId, phase, message, authorName, authorRole }) {
  const eng = byId(store.data.engagements, engagementId);
  if (!eng) throw new Error(`Engagement ${engagementId} was not found.`);
  const text = String(message || '').trim();
  if (!text) throw new Error('Add a message before submitting feedback.');
  const id = `EF${String(efSeq++).padStart(3, '0')}`;
  const now = new Date().toISOString();
  store.data.engagementFeedback.unshift({
    id, engagementId, phase, authorName, authorRole, message: text, sentiment: classifyFeedbackSentiment(text),
    createdAt: now, sourceOfTruth: 'Agentic Delivery', updatedAt: now,
    audit: [{ at: now, who: authorName, action: 'engagement feedback submitted' }],
  });
  emit('data');
  return id;
}

// ---- Agentic Delivery — per-agent execution & scheduling ----
function agentRunKey(engagementId, agentId) { return `${engagementId}::${agentId}`; }
export function getAgentRunState(engagementId, agentId) {
  const key = agentRunKey(engagementId, agentId);
  if (!store.agentRuns[key]) store.agentRuns[key] = { schedule: 'on-phase-change', status: 'idle', lastRunAt: null, lastTrigger: null, lastPhase: null, lastOutput: null, runCount: 0, history: [] };
  return store.agentRuns[key];
}
function executeAgent(engagementId, agentId, trigger) {
  const eng = byId(store.data.engagements, engagementId);
  if (!eng) return null;
  const phase = phaseForEngagement(eng);
  const output = runAgentById(agentId, eng, store.data, phase);
  const state = getAgentRunState(engagementId, agentId);
  const now = new Date().toISOString();
  state.status = 'completed';
  state.lastRunAt = now;
  state.lastTrigger = trigger;
  state.lastPhase = phase;
  state.lastOutput = output;
  state.runCount += 1;
  state.history.unshift({ at: now, output, trigger, phase });
  if (state.history.length > 5) state.history.length = 5;
  return state;
}
// Silent catch-up for a due schedule — mutates without emitting, safe to call during render (e.g.
// opening the support plan) so status/output are current without triggering a re-render loop.
export function syncAgentSchedule(engagementId, agentId) {
  const eng = byId(store.data.engagements, engagementId);
  if (!eng) return getAgentRunState(engagementId, agentId);
  const state = getAgentRunState(engagementId, agentId);
  if (state.schedule === 'manual') return state;
  if (state.schedule === 'on-phase-change') {
    if (state.lastPhase !== phaseForEngagement(eng)) executeAgent(engagementId, agentId, 'scheduled');
    return state;
  }
  const interval = SCHEDULE_INTERVAL_MS[state.schedule];
  const due = interval && (!state.lastRunAt || Date.now() - new Date(state.lastRunAt).getTime() >= interval);
  if (due) executeAgent(engagementId, agentId, 'scheduled');
  return state;
}
export function runAgentNow(engagementId, agentId) {
  const state = executeAgent(engagementId, agentId, 'manual');
  emit('data');
  return state;
}
export function runAllAgentsNow(engagementId) {
  const eng = byId(store.data.engagements, engagementId);
  if (!eng) return;
  agentsForEngagement(eng).forEach((a) => executeAgent(engagementId, a.id, 'manual'));
  emit('data');
}
export function setAgentSchedule(engagementId, agentId, schedule) {
  const state = getAgentRunState(engagementId, agentId);
  state.schedule = schedule;
  emit('data');
}

export function addMessage(threadId, engagementId, from, to, body, sentiment) {
  const id = `MSG${msgSeq++}`;
  store.data.messages.push({ id, threadId, engagementId, from, to, body, timestamp: new Date().toISOString(), sentiment: sentiment || 'neutral', sourceOfTruth: 'Teams', updatedAt: new Date().toISOString().slice(0, 10), audit: [{ at: new Date().toISOString(), who: 'you', action: 'message sent' }] });
  emit('data');
}
export function addAction({ engagementId = null, threadId = null, escalationId = null, cpeId = null, successStoryId = null, sentimentSignalId = null, kyplSessionId = null, readinessPlanId = null, source = null, title, ownerName, due, status }) {
  const id = `ACT${actSeq++}`;
  const actionSource = source || (escalationId ? 'escalation' : sentimentSignalId ? 'sentiment' : threadId ? 'message' : cpeId ? 'success-story' : readinessPlanId ? 'readiness-plan' : kyplSessionId ? 'kypl' : 'action');
  store.data.actions.unshift({ id, escalationId, threadId, engagementId, cpeId, successStoryId, sentimentSignalId, kyplSessionId, readinessPlanId, title: title || 'Follow-up action', ownerName: ownerName || 'Unassigned', due: due || daysFromNowISO(7), status: status || 'open', source: actionSource, sourceOfTruth: 'Azure DevOps', updatedAt: todayISO(), audit: [{ at: new Date().toISOString(), who: 'you', action: 'action assigned' }] });
  if (escalationId) { const e = byId(store.data.escalations, escalationId); if (e) (e.actionIds = e.actionIds || []).push(id); }
  emit('data');
  return id;
}
