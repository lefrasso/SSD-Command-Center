// SSD IQ — System of Records catalog.
import { store } from '../store.js';
import { can } from '../roles.js';
import { nlSearch, dataQualityFlags } from '../ai.js';
import {
  pageHeader, aiChip, badge, sourceBadge, statusPill, severityPill, sentimentPill, esc, emptyState,
} from '../components.js';
import { icon } from '../icons.js';

const engCustomer = (id) => { const e = store.data.engagements.find((x) => x.id === id); return e ? e.customer : id; };
const csaName = (id) => { const c = store.data.csas.find((x) => x.id === id); return c ? c.name : id; };

const CFG = [
  { key: 'partners', name: 'Partner', description: 'Delivery Partners under MOSA.', source: 'MOSA', icon: 'building', label: (r) => r.name,
    columns: [['id', 'ID'], ['name', 'Name'], ['region', 'Region'], ['cpe', 'CPE'], ['deliveries', 'Deliveries'], ['status', 'Status', (r) => statusPill(r.status)]] },
  { key: 'csas', name: 'CSA', description: 'Partner Cloud Solution Architects.', source: 'Operations', icon: 'personAdd', label: (r) => r.name,
    columns: [['id', 'ID'], ['name', 'Name'], ['vendor', 'Vendor'], ['tracks', 'Families', (r) => r.tracks.join(', ')], ['utilization', 'Util %'], ['cpe', 'CPE'], ['lifecycle', 'Lifecycle', (r) => statusPill(r.lifecycle)]] },
  { key: 'pods', name: 'POD', description: 'Managed groups of CSAs.', source: 'SSD IQ', icon: 'people', label: (r) => r.name,
    columns: [['id', 'ID'], ['name', 'Name'], ['region', 'Region'], ['leadName', 'Lead'], ['utilization', 'Util %']] },
  { key: 'engagements', name: 'Engagement', description: 'Dispatched delivery engagements.', source: 'Dispatch', icon: 'send', label: (r) => r.customer,
    columns: [['id', 'ID'], ['customer', 'Customer'], ['track', 'Family'], ['program', 'Program'], ['status', 'Status', (r) => statusPill(r.status)], ['dueDate', 'Due']] },
  { key: 'escalations', name: 'Escalation', description: 'Delivery escalations tracked in ADO.', source: 'Azure DevOps', icon: 'warning', label: (r) => r.id,
    columns: [['id', 'ID'], ['engagementId', 'Customer', (r) => engCustomer(r.engagementId)], ['severity', 'Severity', (r) => severityPill(r.severity)], ['status', 'Status', (r) => statusPill(r.status)], ['ownerName', 'Owner'], ['opened', 'Opened']] },
  { key: 'actions', name: 'Action Item', description: 'Action items from escalations.', source: 'Azure DevOps', icon: 'flag', label: (r) => r.title,
    columns: [['id', 'ID'], ['title', 'Title'], ['ownerName', 'Owner'], ['due', 'Due'], ['status', 'Status', (r) => statusPill(r.status)]] },
  { key: 'cpe', name: 'CPE Feedback', description: 'Customer & Partner Experience scores.', source: 'CPE/Forms', icon: 'star', label: (r) => `${r.score} · ${r.track}`,
    columns: [['id', 'ID'], ['engagementId', 'Customer', (r) => engCustomer(r.engagementId)], ['score', 'Score'], ['track', 'Track'], ['sentiment', 'Sentiment', (r) => sentimentPill(r.sentiment)]] },
  { key: 'messages', name: 'Message', description: 'Threaded partner communications.', source: 'Teams', icon: 'chat', label: (r) => `${r.from} → ${r.to}`,
    columns: [['id', 'ID'], ['threadId', 'Thread'], ['from', 'From'], ['to', 'To'], ['sentiment', 'Sentiment', (r) => sentimentPill(r.sentiment)]] },
  { key: 'pips', name: 'PIP', description: 'Performance Improvement Plans (confidential).', source: 'Confidential/HR', icon: 'lock', label: (r) => r.id,
    columns: [['id', 'ID'], ['csaId', 'CSA', (r) => csaName(r.csaId)], ['status', 'Status', (r) => statusPill(r.status)], ['outcome', 'Outcome']] },
  { key: 'sentiment', name: 'Sentiment Rollup', description: 'AI sentiment aggregates.', source: 'AI Services', icon: 'emoji', label: (r) => `${r.scope} · ${r.period}`,
    columns: [['id', 'ID'], ['scope', 'Scope'], ['period', 'Period'], ['net', 'Net']] },
  { key: 'deliveries', name: 'Delivery', description: 'Completed deliveries.', source: 'Power BI', icon: 'check', label: (r) => r.type,
    columns: [['id', 'ID'], ['engagementId', 'Customer', (r) => engCustomer(r.engagementId)], ['type', 'Type'], ['completedDate', 'Completed'], ['track', 'Track']] },
];

let selectedEntity = 'partners';
let query = '';
let showFlags = false;
let host = null;

export function renderSsdIq(container, initialQuery) {
  host = container;
  if (initialQuery != null) query = initialQuery;
  renderContent();
}

function entities() { return CFG.filter((c) => c.key !== 'pips' || can(store.role, 'view:pip')); }

function renderContent() {
  const d = store.data;
  const list = entities();
  const cfg = list.find((c) => c.key === selectedEntity) || list[0];
  selectedEntity = cfg.key;
  const flags = dataQualityFlags(d);
  const results = query.trim() ? nlSearch(query, d) : [];

  const catalog = list.map((c) => `
    <div class="card tile ${selectedEntity === c.key ? 'active' : ''}" data-entity="${c.key}">
      <span class="tile-ico">${icon(c.icon, 22)}</span>
      <div>
        <strong>${esc(c.name)}</strong>
        <div class="tile-count">${d[c.key].length}</div>
        <div class="muted" style="font-size:12px">${esc(c.description)}</div>
        <div class="mt8">${sourceBadge(c.source)}</div>
      </div>
    </div>`).join('');

  const rows = d[cfg.key].slice(0, 60);
  const table = `
    <div class="row mb8" style="gap:8px">
      <strong style="font-size:16px">${esc(cfg.name)} records</strong>
      ${badge(String(d[cfg.key].length), 'tint-info')}
      ${sourceBadge(cfg.source)}
    </div>
    <div class="table-wrap">
      <table class="grid">
        <thead><tr>${cfg.columns.map((c) => `<th>${c[1]}</th>`).join('')}</tr></thead>
        <tbody>
          ${rows.map((r) => `<tr class="clickable" data-id="${esc(r.id)}">${cfg.columns.map((c) => `<td>${c[2] ? c[2](r) : esc(r[c[0]] ?? '—')}</td>`).join('')}</tr>`).join('')}
        </tbody>
      </table>
    </div>
    ${d[cfg.key].length > 60 ? `<div class="muted mt8">Showing first 60 of ${d[cfg.key].length}.</div>` : ''}`;

  const searchView = `
    <div class="card" style="padding:8px">
      <div class="muted" style="padding:6px 8px">${results.length} result(s) for “${esc(query)}”</div>
      ${results.map((r) => `
        <div class="search-result" data-key="${r.key}" data-id="${esc(r.id)}">
          ${badge(r.entity, 'outline')}
          <strong>${esc(r.label)}</strong>
          <span class="muted" style="font-size:12px">${esc(r.snippet)}</span>
        </div>`).join('') || emptyState({ title: 'No matching records', description: 'Try a partner name, track, severity or record id.' })}
    </div>`;

  host.innerHTML = `
    ${pageHeader({
      title: 'SSD IQ — System of Records',
      description: 'The governed source of truth. Browse and search every entity, inspect a record and its relationships, and see source-of-truth badges and the audit trail.',
      actions: aiChip('NL search + DQ'),
    })}
    <div class="row wrap mb16" style="gap:10px">
      <div class="input-wrap flex1" style="max-width:520px">
        <span class="in-ico">${icon('search', 18)}</span>
        <input class="input" id="ssd-search" placeholder="Natural-language record search (e.g. “Avanade”, “sev1”, “ENG012”, “landing zone”)" value="${esc(query)}" style="width:100%"/>
      </div>
      <button class="btn ${showFlags ? 'primary' : ''}" id="dq-btn">${icon('sparkle', 16)} Data-quality flags (${flags.length})</button>
    </div>

    ${showFlags ? `<div class="card pad mb16">
      <div class="row mb8">${'<strong>Data-quality flags</strong>'} ${aiChip()}</div>
      ${flags.map((f) => `<div class="row" style="gap:8px; padding:3px 0">${badge(f.severity, f.severity === 'high' ? 'tint-danger' : f.severity === 'medium' ? 'tint-warn' : 'tint-info')}<span>${esc(f.message)}</span></div>`).join('') || '<div class="muted">No data-quality issues detected.</div>'}
    </div>` : ''}

    ${query.trim() ? searchView : `<div class="catalog">${catalog}</div>${table}`}

    <div class="drawer-scrim" id="scrim"></div>
    <aside class="drawer" id="drawer" aria-label="Record detail"></aside>`;

  wire();
}

function wire() {
  const search = host.querySelector('#ssd-search');
  search.addEventListener('input', (e) => { query = e.target.value; renderContent(); });
  // keep caret at end after re-render
  search.focus(); search.setSelectionRange(query.length, query.length);

  host.querySelector('#dq-btn').addEventListener('click', () => { showFlags = !showFlags; renderContent(); });

  host.querySelectorAll('[data-entity]').forEach((el) => el.addEventListener('click', () => { selectedEntity = el.getAttribute('data-entity'); query = ''; renderContent(); }));
  host.querySelectorAll('tr.clickable').forEach((el) => el.addEventListener('click', () => openRecord(selectedEntity, el.getAttribute('data-id'))));
  host.querySelectorAll('.search-result').forEach((el) => el.addEventListener('click', () => openRecord(el.getAttribute('data-key'), el.getAttribute('data-id'))));

  host.querySelector('#scrim').addEventListener('click', closeDrawer);
}

function closeDrawer() {
  const dr = host.querySelector('#drawer'); const sc = host.querySelector('#scrim');
  if (dr) dr.classList.remove('open'); if (sc) sc.classList.remove('open');
}

function openRecord(key, id) {
  const cfg = CFG.find((c) => c.key === key); if (!cfg) return;
  const r = store.data[key].find((x) => String(x.id) === String(id)); if (!r) return;
  const rels = relationshipsFor(key, r);
  const audit = r.audit || [];
  const skip = new Set(['id', 'audit', 'sourceOfTruth', 'updatedAt', 'actionIds', 'podIds']);

  const dr = host.querySelector('#drawer');
  dr.innerHTML = `
    <div class="drawer-head">
      <span class="drawer-title">${esc(cfg.name)} · ${esc(r.id)}</span>
      <button class="btn subtle icon-only" id="dr-close" aria-label="Close" style="color:var(--fg-2)">${icon('x', 20)}</button>
    </div>
    <div class="drawer-body">
      <div class="row wrap mb8" style="gap:8px">
        ${r.sourceOfTruth ? sourceBadge(r.sourceOfTruth) : ''}
        ${r.updatedAt ? `<span class="muted" style="font-size:12px">Updated ${esc(r.updatedAt)}</span>` : ''}
      </div>
      <div class="section-title">Fields</div>
      ${Object.entries(r).filter(([k]) => !skip.has(k)).map(([k, v]) => `<div class="field"><span class="field-key">${esc(k)}</span><span class="field-val">${renderValue(k, v)}</span></div>`).join('')}
      ${rels.length ? `<div class="section-title">Relationships</div>${rels.map((g) => `
        <div class="rel-group">
          <div class="muted" style="font-size:12px">${esc(g.label)}</div>
          <div class="rel-chips">${g.items.length ? g.items.map((it) => `<span class="badge outline" data-key="${it.key}" data-id="${esc(it.id)}">${esc(it.label)}</span>`).join('') : '<span class="muted">None</span>'}</div>
        </div>`).join('')}` : ''}
      ${audit.length ? `<div class="section-title">Audit trail</div>${audit.map((a) => `<div class="audit-item">• <span><strong>${esc(a.at)}</strong> · ${esc(a.who)} · ${esc(a.action)}</span></div>`).join('')}` : ''}
    </div>`;

  dr.classList.add('open');
  host.querySelector('#scrim').classList.add('open');
  dr.querySelector('#dr-close').addEventListener('click', closeDrawer);
  dr.querySelectorAll('.rel-chips [data-key]').forEach((el) => el.addEventListener('click', () => openRecord(el.getAttribute('data-key'), el.getAttribute('data-id'))));
}

function renderValue(key, v) {
  if (key === 'outreach' && v && typeof v === 'object') return Object.entries(v).map(([day, done]) => `${day.toUpperCase()} ${done ? '✓' : '—'}`).join('  ');
  if (key === 'milestones' && Array.isArray(v)) return esc(v.map((m) => `${m.label} (${m.done ? 'done' : m.due})`).join(', '));
  if (key === 'checkIns' && Array.isArray(v)) return esc(v.map((c) => `${c.date}: ${c.note}`).join(' · '));
  if (Array.isArray(v)) return esc(v.join(', '));
  if (v && typeof v === 'object') return esc(JSON.stringify(v));
  return esc(v);
}

function relationshipsFor(key, r) {
  const d = store.data;
  const lk = (arr, id, labeler) => { const x = arr.find((y) => y.id === id); return x ? labeler(x) : id; };
  switch (key) {
    case 'partners':
      return [
        { label: 'PODs', items: r.podIds.map((id) => ({ key: 'pods', id, label: lk(d.pods, id, (p) => p.name) })) },
        { label: 'Partner CSAs', items: d.csas.filter((c) => c.partnerId === r.id).slice(0, 12).map((c) => ({ key: 'csas', id: c.id, label: c.name })) },
      ];
    case 'csas':
      return [
        { label: 'Partner', items: [{ key: 'partners', id: r.partnerId, label: lk(d.partners, r.partnerId, (p) => p.name) }] },
        { label: 'POD', items: [{ key: 'pods', id: r.podId, label: lk(d.pods, r.podId, (p) => p.name) }] },
        { label: 'Engagements', items: d.engagements.filter((e) => e.assignedTo === r.id).map((e) => ({ key: 'engagements', id: e.id, label: e.customer })) },
      ];
    case 'pods':
      return [{ label: 'CSAs', items: d.csas.filter((c) => c.podId === r.id).slice(0, 12).map((c) => ({ key: 'csas', id: c.id, label: c.name })) }];
    case 'engagements':
      return [
        { label: 'Assigned CSA', items: r.assignedTo ? [{ key: 'csas', id: r.assignedTo, label: csaName(r.assignedTo) }] : [] },
        { label: 'Escalations', items: d.escalations.filter((e) => e.engagementId === r.id).map((e) => ({ key: 'escalations', id: e.id, label: e.id })) },
        { label: 'CPE feedback', items: d.cpe.filter((c) => c.engagementId === r.id).map((c) => ({ key: 'cpe', id: c.id, label: `CPE ${c.score}` })) },
        { label: 'Deliveries', items: d.deliveries.filter((x) => x.engagementId === r.id).map((x) => ({ key: 'deliveries', id: x.id, label: x.type })) },
      ];
    case 'escalations':
      return [
        { label: 'Engagement', items: [{ key: 'engagements', id: r.engagementId, label: engCustomer(r.engagementId) }] },
        { label: 'Action items', items: r.actionIds.map((id) => ({ key: 'actions', id, label: lk(d.actions, id, (a) => a.title) })) },
      ];
    case 'actions':
      return [{ label: 'Escalation', items: [{ key: 'escalations', id: r.escalationId, label: r.escalationId }] }];
    case 'cpe':
      return [{ label: 'Engagement', items: [{ key: 'engagements', id: r.engagementId, label: engCustomer(r.engagementId) }] }];
    case 'messages':
      return [{ label: 'Engagement', items: r.engagementId ? [{ key: 'engagements', id: r.engagementId, label: engCustomer(r.engagementId) }] : [] }];
    case 'pips':
      return [{ label: 'CSA', items: [{ key: 'csas', id: r.csaId, label: csaName(r.csaId) }] }];
    case 'deliveries':
      return [{ label: 'Engagement', items: [{ key: 'engagements', id: r.engagementId, label: engCustomer(r.engagementId) }] }];
    default:
      return [];
  }
}
