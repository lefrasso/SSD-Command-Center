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
export const escalationsByEngagement = (engId) => store.data.escalations.filter((e) => e.engagementId === engId);
export const actionsByEscalation = (escId) => store.data.actions.filter((a) => a.escalationId === escId);

const NOW = new Date('2026-07-28T09:00:00Z').getTime();
export const hoursSince = (iso) => (NOW - new Date(iso).getTime()) / 3.6e6;

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
  const src = [...d.cpe.map((c) => c.sentiment), ...d.messages.map((m) => m.sentiment)];
  return {
    positive: src.filter((s) => s === 'positive').length,
    neutral: src.filter((s) => s === 'neutral').length,
    negative: src.filter((s) => s === 'negative').length,
  };
}

// ---- Mutations (mutate in-memory data + notify) ----
let msgSeq = 9000;
let escSeq = 9000;
export function assignEngagement(engId, csaId) {
  const e = byId(store.data.engagements, engId);
  if (e) { e.assignedTo = csaId; if (e.status === 'new') e.status = 'assigned'; if (e.dispatchStage === 'Day 0') e.dispatchStage = 'Day 1'; }
  emit('data');
}
export function setEngagementStatus(engId, status) { const e = byId(store.data.engagements, engId); if (e) e.status = status; emit('data'); }
export function setEscalationStatus(escId, status) { const e = byId(store.data.escalations, escId); if (e) e.status = status; emit('data'); }
export function setActionStatus(actId, status) { const a = byId(store.data.actions, actId); if (a) a.status = status; emit('data'); }
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
