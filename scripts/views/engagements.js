// Engagements & Dispatch — dispatch board + engagement detail with AI dispatch.
import { store, assignEngagement } from '../store.js';
import { pageHeader, badge, statusPill, aiChip, esc, kanban, openDrawer, closeDrawer, COLORS } from '../components.js';
import { icon } from '../icons.js';
import { recommendCSA, draftOutreach } from '../ai.js';

const COLS = [['new', 'New'], ['assigned', 'Assigned'], ['in-delivery', 'In delivery'], ['complete', 'Complete']];

export function renderEngagements(container) {
  const d = store.data;
  const columns = COLS.map(([status, title]) => {
    const engs = d.engagements.filter((e) => e.status === status);
    return {
      title, count: engs.length,
      cards: engs.slice(0, 40).map((e) => {
        const csa = d.csas.find((c) => c.id === e.assignedTo);
        return `<div class="kan-card" data-id="${e.id}">
          <div class="kc-title">${esc(e.customer)}${e.atRisk ? ` <span style="color:${COLORS.warning}">${icon('warning', 13)}</span>` : ''}</div>
          <div class="kc-meta">${esc(e.track)} · ${esc(e.program)}</div>
          <div class="kc-foot">${badge(e.dispatchStage, 'outline')}${csa ? `<span class="muted" style="font-size:11px">${esc(csa.name)}</span>` : badge('Unassigned', 'tint-warn')}</div>
        </div>`;
      }),
    };
  });

  container.innerHTML = `
    ${pageHeader({ title: 'Engagements & Dispatch', description: 'Proactive Dispatch — move demand from new to complete. Open an engagement for milestones, Day 0–3 outreach and AI best-fit dispatch.' })}
    ${kanban(columns)}`;

  container.querySelectorAll('.kan-card').forEach((el) => el.addEventListener('click', () => openEngagement(el.getAttribute('data-id'))));
}

function openEngagement(id) {
  const d = store.data;
  const e = d.engagements.find((x) => x.id === id);
  if (!e) return;
  const csa = d.csas.find((c) => c.id === e.assignedTo);
  const outreach = ['day0', 'day1', 'day2', 'day3'].map((k, i) => `<span class="badge ${e.outreach[k] ? 'tint-info' : 'outline'}">Day ${i} ${e.outreach[k] ? '✓' : '—'}</span>`).join(' ');
  const milestones = e.milestones.map((m) => `<div class="check-item"><span class="check-box ${m.done ? 'done' : ''}">${m.done ? icon('check', 12) : ''}</span><span>${esc(m.label)} <span class="muted">· ${m.done ? 'done' : 'due ' + m.due}</span></span></div>`).join('');

  const body = `
    <div class="row wrap mb8" style="gap:8px">${statusPill(e.status)} ${e.atRisk ? badge('At risk', 'tint-warn') : ''}</div>
    <div class="field"><span class="field-key">Customer</span><span class="field-val">${esc(e.customer)}</span></div>
    <div class="field"><span class="field-key">CSAM</span><span class="field-val">${esc(e.csamName)}</span></div>
    <div class="field"><span class="field-key">Track / Program</span><span class="field-val">${esc(e.track)} · ${esc(e.program)}</span></div>
    <div class="field"><span class="field-key">Assigned CSA</span><span class="field-val">${csa ? esc(csa.name) + ' (' + esc(csa.vendor) + ')' : 'Unassigned'}</span></div>
    <div class="field"><span class="field-key">Due</span><span class="field-val">${esc(e.dueDate)}</span></div>
    <div class="section-title">Day 0–3 outreach</div><div class="row wrap" style="gap:6px">${outreach}</div>
    <div class="section-title">Milestones</div>${milestones}
    <div class="section-title">AI dispatch</div>
    <div class="row wrap mb8" style="gap:6px">
      <button class="btn sm" id="rec">${icon('sparkle', 14)} Recommend best-fit CSA</button>
      <button class="btn sm" id="draft">${icon('sparkle', 14)} Draft outreach</button>
    </div>
    <div id="ai-out"></div>`;

  openDrawer(`${esc(e.customer)} · ${esc(e.id)}`, body, (dr) => {
    const out = dr.querySelector('#ai-out');
    dr.querySelector('#rec').addEventListener('click', () => {
      const r = recommendCSA(e, d);
      out.innerHTML = `<div class="card pad" style="background:var(--bg-2)"><div class="row mb8">${aiChip()}</div><div>${esc(r.text)}</div>
        <div class="row wrap mt8" style="gap:6px">${r.sources.map((s) => `<button class="btn sm" data-assign="${s.id}">Assign ${esc(s.label)}</button>`).join('')}</div></div>`;
      out.querySelectorAll('[data-assign]').forEach((b) => b.addEventListener('click', () => { assignEngagement(e.id, b.getAttribute('data-assign')); closeDrawer(); }));
    });
    dr.querySelector('#draft').addEventListener('click', () => {
      const r = draftOutreach(e, d);
      out.innerHTML = `<div class="card pad" style="background:var(--bg-2)"><div class="row mb8">${aiChip()}<span class="muted" style="font-size:12px">Editable draft</span></div><pre style="white-space:pre-wrap;font-family:inherit;font-size:13px;margin:0">${esc(r.text)}</pre></div>`;
    });
  });
}
