// In-memory SSD IQ store + derived KPIs and selectors.
import { dataset } from '../data/generate.js';

export const store = {
  data: dataset,
  role: 'pod-lead',
  navCollapsed: false,
  copilotOpen: true,
  _listeners: [],
};

export function onChange(fn) { store._listeners.push(fn); }
function emit(reason) { store._listeners.forEach((fn) => fn(reason)); }

export function setRole(role) { store.role = role; emit('role'); }
export function toggleNav() { store.navCollapsed = !store.navCollapsed; emit('nav'); }
export function toggleCopilot(force) { store.copilotOpen = typeof force === 'boolean' ? force : !store.copilotOpen; emit('copilot'); }

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
  return { activeEngagements: active, onTimePct, rollingCpe, openEscalations: open.length, slaBreaches, utilization, netSentiment, deliveriesCompleted: d.deliveries.length };
}

export function sentimentBreakdown(d = store.data) {
  const src = d.sentimentSignals.map((signal) => signal.score >= 0.15 ? 'positive' : signal.score <= -0.15 ? 'negative' : 'neutral');
  return {
    positive: src.filter((s) => s === 'positive').length,
    neutral: src.filter((s) => s === 'neutral').length,
    negative: src.filter((s) => s === 'negative').length,
  };
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
export function addEscalation({ engagementId, severity, summary, ownerName, sdmName }) {
  const id = `ESC${escSeq++}`;
  store.data.escalations.unshift({ id, engagementId, severity, status: 'new', ownerName, sdmName, adoRef: `AB#${Math.floor(Math.random() * 80000 + 10000)}`, opened: new Date().toISOString().slice(0, 10), slaHours: { sev1: 8, sev2: 24, sev3: 48, sev4: 72 }[severity], actionIds: [], summary, sourceOfTruth: 'Azure DevOps', updatedAt: new Date().toISOString().slice(0, 10), audit: [{ at: new Date().toISOString(), who: 'you', action: 'escalation raised' }] });
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
