// In-memory SSD IQ store + derived KPIs and selectors.
import { dataset, IP_TAGS, TRACKS, CAP_PER_CSA, BASELINE_UTILIZATION } from '../data/generate.js';
import { MODULES, moduleById } from './nav.js';

export const store = {
  data: dataset,
  role: 'pod-lead',
  navCollapsed: false,
  copilotOpen: true,
  accessOverrides: {}, // { [role]: { [moduleId]: true|false } } — Admin-managed module access, layered over nav.js defaults
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
  { entity: 'IP Feedback', owner: 'IP Lead · CSAM Innovation', source: 'Agentic Delivery', key: 'ipFeedback', count: (d) => d.ipFeedback.length },
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
// Projects, per Family, when required headcount (driven by the demand trajectory and expected
// utilization) will exceed available headcount (active + hiring pipeline − expected attrition),
// and works back by the onboarding lead time to say when a hire must be started.
const monthAdd = (key, delta) => { const [y, m] = key.split('-').map(Number); return new Date(Date.UTC(y, m - 1 + delta, 1)).toISOString().slice(0, 7); };
const monthLabel = (key) => { const [y, m] = key.split('-').map(Number); return new Date(Date.UTC(y, m - 1, 1)).toLocaleString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' }); };
const fiscalQuarter = (key) => {
  const [y, m] = key.split('-').map(Number);
  const fyYear = m >= 7 ? y + 1 : y;
  const q = m >= 7 && m <= 9 ? 1 : m >= 10 && m <= 12 ? 2 : m >= 1 && m <= 3 ? 3 : 4;
  return `FY${String(fyYear).slice(-2)} Q${q}`;
};
function detectTrend(history) {
  const last = history.slice(-3);
  const deltas = [];
  for (let i = 1; i < last.length; i++) {
    if (last[i - 1].demand > 0) deltas.push((last[i].demand - last[i - 1].demand) / last[i - 1].demand);
  }
  return deltas.length ? deltas.reduce((s, v) => s + v, 0) / deltas.length : 0;
}
export function computeCapacityForecast(d = store.data, opts = {}) {
  const { horizonMonths = 12, utilizationTarget = BASELINE_UTILIZATION, onboardingMonths = 3, trendOverrides = {} } = opts;
  const effectiveCapPerCsa = CAP_PER_CSA * (utilizationTarget / BASELINE_UTILIZATION);
  const active = d.csas.filter((c) => c.lifecycle === 'active');
  const openReqs = (d.hiring || []).filter((h) => h.stage !== 'Hired');
  const currentMonth = todayISO().slice(0, 7);

  const families = TRACKS.map((track) => {
    const history = d.demandHistory[track] || [];
    const detectedTrendPct = Math.round(detectTrend(history) * 1000) / 10;
    const trend = (trendOverrides[track] != null ? trendOverrides[track] : detectedTrendPct) / 100;
    const currentHeadcount = active.filter((c) => c.tracks.includes(track)).length;
    const target = d.capacityTargets[track] || currentHeadcount;
    const baseDemand = history.length ? history[history.length - 1].demand : 0;
    const attritionPerMonth = d.attrition.filter((a) => a.family === track && hoursSince(a.exitDate) <= 8760).length / 12;

    let projectedDemand = baseDemand;
    let cumulativeHires = 0;
    let cumulativeAttrition = 0;
    let breach = null;
    const series = [];
    for (let m = 1; m <= horizonMonths; m++) {
      const monthKey = monthAdd(currentMonth, m);
      projectedDemand *= (1 + trend);
      const required = Math.max(0, Math.ceil(projectedDemand / effectiveCapPerCsa));
      cumulativeHires += openReqs.filter((h) => h.family === track && h.targetStart.slice(0, 7) === monthKey).length;
      cumulativeAttrition += attritionPerMonth;
      const available = Math.max(0, Math.round(currentHeadcount + cumulativeHires - cumulativeAttrition));
      const gap = required - available;
      if (breach == null && gap > 0) breach = { monthKey, gap, required, available };
      series.push({ monthKey, label: monthLabel(monthKey), demand: Math.round(projectedDemand), required, available });
    }
    const hireByMonth = breach ? monthAdd(breach.monthKey, -onboardingMonths) : null;
    return {
      track, target, currentHeadcount, detectedTrendPct, trendUsedPct: Math.round(trend * 1000) / 10,
      history, series, breach: breach ? { ...breach, label: monthLabel(breach.monthKey), quarter: fiscalQuarter(breach.monthKey) } : null,
      hireByMonth: hireByMonth ? { key: hireByMonth, label: monthLabel(hireByMonth), quarter: fiscalQuarter(hireByMonth), overdue: hireByMonth < currentMonth } : null,
    };
  });

  return { effectiveCapPerCsa, utilizationTarget, onboardingMonths, currentMonth, families };
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
export function addMessage(threadId, engagementId, from, to, body, sentiment) {
  const id = `MSG${msgSeq++}`;
  store.data.messages.push({ id, threadId, engagementId, from, to, body, timestamp: new Date().toISOString(), sentiment: sentiment || 'neutral', sourceOfTruth: 'Teams', updatedAt: new Date().toISOString().slice(0, 10), audit: [{ at: new Date().toISOString(), who: 'you', action: 'message sent' }] });
  emit('data');
}
export function addAction({ engagementId = null, threadId = null, escalationId = null, cpeId = null, successStoryId = null, sentimentSignalId = null, source = null, title, ownerName, due, status }) {
  const id = `ACT${actSeq++}`;
  const actionSource = source || (escalationId ? 'escalation' : sentimentSignalId ? 'sentiment' : threadId ? 'message' : cpeId ? 'success-story' : 'action');
  store.data.actions.unshift({ id, escalationId, threadId, engagementId, cpeId, successStoryId, sentimentSignalId, title: title || 'Follow-up action', ownerName: ownerName || 'Unassigned', due: due || daysFromNowISO(7), status: status || 'open', source: actionSource, sourceOfTruth: 'Azure DevOps', updatedAt: todayISO(), audit: [{ at: new Date().toISOString(), who: 'you', action: 'action assigned' }] });
  if (escalationId) { const e = byId(store.data.escalations, escalationId); if (e) (e.actionIds = e.actionIds || []).push(id); }
  emit('data');
  return id;
}
