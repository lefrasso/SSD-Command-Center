// Capabilities — the SSD delivery capability map (Live / Partial / Planned).
import { pageHeader, kpiCard, esc, COLORS } from '../components.js';
import { icon } from '../icons.js';
import { navigate } from '../router.js';

const STATUS = {
  live: { label: 'Live', color: COLORS.positive, ic: 'check' },
  partial: { label: 'Partial', color: COLORS.warning, ic: 'clock' },
  planned: { label: 'Planned', color: COLORS.neutral, ic: 'wrench' },
};

const CAPS = [
  { group: 'Delivery', items: [
    { name: 'Delivery Management', status: 'live', to: '/engagements', note: 'Dispatch board, best-fit CSA, Day 0–3 outreach.' },
    { name: 'Scheduler / Sender', status: 'live', to: '/engagements', note: 'Dispatch scheduling + outreach send.' },
    { name: 'Planning', status: 'live', to: '/capacity', note: 'Demand & capacity planning.' },
    { name: 'Agentic Delivery', status: 'live', to: '/agentic', note: 'AI agents assist every engagement.' },
    { name: 'Delivery Agent', status: 'live', to: '/agentic', note: 'Per-engagement AI delivery agent.' },
  ] },
  { group: 'Quality', items: [
    { name: 'Quality Management', status: 'live', to: '/quality', note: 'CPE & Recommended Practices scoring.' },
    { name: 'Delivery Quality', status: 'live', to: '/quality', note: 'Quality Checks form + reporting.' },
    { name: 'Deliverables Quality', status: 'live', to: '/quality', note: 'Mock Deliveries QC guide & tracking.' },
    { name: 'Feedback Management', status: 'live', to: '/quality', note: 'CPE feedback & verbatims.' },
  ] },
  { group: 'Escalation & risk', items: [
    { name: 'Escalation Management', status: 'live', to: '/escalations', note: 'Triage, SLA timers, actions, AI severity.' },
    { name: 'Reports Pending (T-3W)', status: 'live', to: '/reports-pending', note: 'Overdue reports + proactive engagement tracking.' },
  ] },
  { group: 'AI & agentic', items: [
    { name: 'Compass Copilot', status: 'live', note: 'Contextual, labelled AI on every screen.' },
    { name: 'Cortana', status: 'live', note: 'Assistant surface via Compass Copilot.' },
    { name: 'Deliverables Generation', status: 'live', to: '/agentic', note: 'AI drafts delivery artifacts from SSD IQ.' },
    { name: 'IP', status: 'live', to: '/agentic', note: 'Reusable delivery IP & asset library.' },
  ] },
  { group: 'Comms & enablement', items: [
    { name: 'Comms', status: 'live', to: '/messages', note: 'Threaded partner communication.' },
    { name: 'Email Template Manager', status: 'live', to: '/messages', note: 'Template library for dispatch, reminders, acks.' },
    { name: 'Shadowing Management', status: 'live', to: '/enablement', note: 'Mentor/mentee shadowing assignments.' },
    { name: 'Accreditations', status: 'live', to: '/enablement', note: 'CSA certifications & coverage.' },
    { name: 'User Voice', status: 'live', to: '/enablement', note: 'Ideas intake, voting & triage.' },
  ] },
  { group: 'People & capacity', items: [
    { name: 'Headcount Management', status: 'live', to: '/pods', note: 'Roster, tenure and status.' },
    { name: 'Capacity Management', status: 'live', to: '/pods', note: 'Capacity heatmap & utilization.' },
    { name: 'POD Lead Tools', status: 'live', to: '/home', note: 'Cockpit, dispatch, coaching, MBRs.' },
    { name: 'Coverage Analysis', status: 'live', to: '/capacity', note: '≥1 per program, per language, per time zone.' },
    { name: 'Forecasting', status: 'live', to: '/capacity', note: 'Demand & headcount forecast.' },
    { name: 'Headcount Mapping', status: 'live', to: '/capacity', note: 'Map demand to headcount by Family.' },
    { name: 'Headcount Assignment', status: 'live', to: '/capacity', note: 'Assign / hire recommendations.' },
    { name: 'HC Consolidation (Active & Future)', status: 'live', to: '/capacity', note: 'Active + pipeline HC vs required/target.' },
    { name: 'Hiring Progress', status: 'live', to: '/capacity', note: 'Requisition funnel, fill rate, planned starts.' },
  ] },
  { group: 'Partner & provider', items: [
    { name: 'Partner Management', status: 'live', to: '/ssdiq', note: 'Partners governed in SSD IQ.' },
    { name: 'Profile Management', status: 'live', to: '/delivery-partners', note: 'Partner profiles & scorecards.' },
    { name: 'DP Onboarding', status: 'live', to: '/delivery-partners', note: 'Partner-level onboarding checklist.' },
    { name: 'Provider Management', status: 'live', to: '/delivery-partners', note: 'Provider governance & contracts.' },
    { name: 'DP Management', status: 'live', to: '/delivery-partners', note: 'Delivery Partner scorecards.' },
  ] },
  { group: 'Programs & governance', items: [
    { name: 'Performance & PIPs', status: 'live', to: '/performance', note: 'Confidential scorecards & improvement plans.' },
    { name: 'S500 Eligibility', status: 'live', to: '/enablement', note: 'S500 eligibility by CPE / quality / tenure.' },
    { name: 'SDM Onboarding', status: 'live', to: '/enablement', note: 'Service Delivery Manager onboarding.' },
  ] },
];

function capPill(status) {
  const s = STATUS[status];
  return `<span class="pill" style="color:${s.color}">${icon(s.ic, 12)}<span class="pill-label">${s.label}</span></span>`;
}

export function renderCapabilities(container) {
  const all = CAPS.flatMap((g) => g.items);
  const live = all.filter((c) => c.status === 'live').length;
  const partial = all.filter((c) => c.status === 'partial').length;
  const planned = all.filter((c) => c.status === 'planned').length;

  container.innerHTML = `
    ${pageHeader({ title: 'Capabilities', description: 'The SSD delivery capability map — what Compass covers today and what is on the roadmap. Open a live capability to jump straight to it.' })}

    <div class="kpi-grid">
      ${kpiCard({ label: 'Capabilities', value: all.length, iconName: 'grid' })}
      ${kpiCard({ label: 'Live', value: live, iconName: 'check', tone: COLORS.positive })}
      ${kpiCard({ label: 'Partial', value: partial, iconName: 'clock', tone: COLORS.warning })}
      ${kpiCard({ label: 'Planned', value: planned, iconName: 'wrench', tone: COLORS.neutral })}
    </div>

    ${CAPS.map((g) => `
      <div class="section-title">${esc(g.group)}</div>
      <div class="catalog">
        ${g.items.map((c) => { const s = STATUS[c.status]; return `<div class="card tile" style="cursor:default;align-items:stretch">
          <span class="tile-ico" style="background:color-mix(in srgb, ${s.color} 15%, var(--bg-1));color:${s.color}">${icon(s.ic, 20)}</span>
          <div style="flex:1;display:flex;flex-direction:column">
            <div class="row" style="justify-content:space-between;gap:6px"><strong>${esc(c.name)}</strong>${capPill(c.status)}</div>
            <div class="muted" style="font-size:12px;flex:1;margin-top:2px">${esc(c.note)}</div>
            <div class="mt8">${c.to ? `<button class="btn sm" data-to="${esc(c.to)}">Open</button>` : '<span class="badge outline">Roadmap</span>'}</div>
          </div>
        </div>`; }).join('')}
      </div>`).join('')}`;

  container.querySelectorAll('[data-to]').forEach((b) => b.addEventListener('click', () => navigate(b.getAttribute('data-to'))));
}
