// CPE Management — Customer & Partner Experience trends, Recommended Practices scoring, and DSAT close-the-loop.
import { store, addCpeLoopUpdate, closeCpeLoop } from '../store.js';
import { pageHeader, kpiCard, aiChip, esc, badge, sentimentPill, scoreColor, COLORS, clearCharts, line, bar, openDrawer, closeDrawer } from '../components.js';
import { icon } from '../icons.js';
import { scoreQuality } from '../ai.js';
import { TRACKS } from '../../data/generate.js';
import { PERSONAS } from '../roles.js';

const PRACTICES = [
  ['Day 0 outreach completed', (e) => e.outreach.day0],
  ['Day 1 sync scheduled', (e) => e.outreach.day1],
  ['Stakeholders engaged (Day 2+)', (e) => e.outreach.day2],
  ['Milestone plan baselined', (e) => e.milestones.length > 0],
  ['Artifacts captured', (e) => e.milestones.some((m) => m.done)],
  ['CPE survey requested', (e) => e.status === 'complete'],
];
const LOOP_STATUS_BADGE = { open: ['Open', 'tint-danger'], 'in-progress': ['In progress', 'tint-warn'], closed: ['Closed', 'tint-info'] };

let selEng = null;

export function renderCpe(container) {
  clearCharts();
  const d = store.data;
  const scored = d.engagements.filter((e) => e.status === 'in-delivery' || e.status === 'complete');
  if (!selEng || !scored.find((e) => e.id === selEng)) selEng = scored[0] && scored[0].id;
  const eng = d.engagements.find((e) => e.id === selEng);
  const rolling = d.cpe.length ? Math.round((d.cpe.reduce((s, c) => s + c.score, 0) / d.cpe.length) * 10) / 10 : 0;
  const positivePct = d.cpe.length ? Math.round((d.cpe.filter((c) => c.sentiment === 'positive').length / d.cpe.length) * 100) : 0;
  const months = [...new Set(d.cpe.map((c) => c.date.slice(0, 7)))].sort();
  const trend = months.map((m) => { const items = d.cpe.filter((c) => c.date.slice(0, 7) === m); return items.length ? Math.round((items.reduce((s, c) => s + c.score, 0) / items.length) * 10) / 10 : null; });
  const byTrack = TRACKS.map((t) => { const items = d.cpe.filter((c) => c.track === t); return items.length ? Math.round((items.reduce((s, c) => s + c.score, 0) / items.length) * 10) / 10 : 0; });
  const q = eng ? scoreQuality(eng) : null;
  const checklist = eng ? PRACTICES.map(([label, fn]) => { const done = fn(eng); return `<div class="check-item"><span class="check-box ${done ? 'done' : ''}">${done ? icon('check', 12) : ''}</span><span>${esc(label)}</span></div>`; }).join('') : '';
  const engOpts = scored.slice(0, 60).map((e) => `<option value="${e.id}" ${e.id === selEng ? 'selected' : ''}>${esc(e.customer)} · ${esc(e.program)}</option>`).join('');
  const recent = [...d.cpe].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 20);

  const dsatLoops = d.cpe.filter((c) => c.score <= 2).sort((a, b) => {
    const rank = { open: 0, 'in-progress': 1, closed: 2 };
    return (rank[a.loopStatus] ?? 3) - (rank[b.loopStatus] ?? 3) || b.date.localeCompare(a.date);
  });
  const openLoops = dsatLoops.filter((c) => c.loopStatus !== 'closed').length;

  container.innerHTML = `
    ${pageHeader({ title: 'CPE Management', description: 'Customer & Partner Experience trends, Recommended Practices scoring, and DSAT close-the-loop follow-up.' })}
    <div class="kpi-grid">
      ${kpiCard({ label: 'Rolling CPE', value: rolling.toFixed(1), iconName: 'star', tone: scoreColor(rolling), hint: 'Target ≥ 4.4' })}
      ${kpiCard({ label: 'CPE responses', value: d.cpe.length, iconName: 'report' })}
      ${kpiCard({ label: 'Positive share', value: positivePct + '%', iconName: 'emoji', tone: COLORS.positive })}
      ${kpiCard({ label: 'Open DSAT loops', value: openLoops, iconName: 'warning', tone: openLoops ? COLORS.negative : COLORS.positive, hint: '1–2★ responses' })}
    </div>
    <div class="two-col">
      <div class="card chart-card"><div class="chart-head"><strong>CPE trend</strong></div><div class="chart-holder" style="height:220px"><canvas id="c-trend"></canvas></div></div>
      <div class="card chart-card"><div class="chart-head"><strong>CPE by family</strong></div><div class="chart-holder" style="height:220px"><canvas id="c-track"></canvas></div></div>
    </div>
    <div class="two-col">
      <div class="card pad">
        <div class="row mb8" style="justify-content:space-between"><strong>Recommended Practices check</strong><select class="select" id="sel-eng">${engOpts}</select></div>
        ${checklist}
        ${q ? `<div class="card pad mt8" style="background:var(--bg-2)"><div class="row mb8">${icon('sparkle', 16)}<strong>AI auto-score</strong>${aiChip()}</div>
          <div style="font-size:22px;font-weight:700;color:${scoreColor(q.score)}">${q.score} / 5</div>
          <div class="muted" style="font-size:13px;margin-top:4px">${esc(q.text)}</div></div>` : ''}
      </div>
      <div class="card pad">
        <strong>Recent CPE verbatims</strong>
        <div class="mt8">
          ${recent.map((c) => { const e = d.engagements.find((x) => x.id === c.engagementId); return `<div style="padding:8px 0;border-bottom:1px solid var(--stroke-2)">
            <div class="row" style="justify-content:space-between"><strong style="font-size:13px">${esc(e ? e.customer : c.engagementId)} · ${c.score}</strong>${sentimentPill(c.sentiment)}</div>
            <div class="muted" style="font-size:12px">“${esc(c.verbatim)}” — ${esc(c.track)}</div></div>`; }).join('')}
        </div>
      </div>
    </div>
    <div class="section-title">DSAT close-the-loop (1–2★) — ${dsatLoops.length}</div>
    <div class="muted mb8" style="font-size:12px">Every 1–2 star response must be followed up and closed with a documented resolution — logged here rather than left to a verbatim alone.</div>
    <div class="table-wrap"><table class="grid"><thead><tr><th>Customer</th><th>Family</th><th>Score</th><th>Root cause</th><th>Status</th><th></th></tr></thead><tbody>
      ${dsatLoops.map((c) => { const e = d.engagements.find((x) => x.id === c.engagementId); const [label, variant] = LOOP_STATUS_BADGE[c.loopStatus] || LOOP_STATUS_BADGE.open; return `<tr>
        <td><strong>${esc(e ? e.customer : c.engagementId)}</strong></td>
        <td>${esc(c.track)}</td>
        <td style="color:${COLORS.negative};font-weight:600">${c.score}</td>
        <td>${esc(c.rootCauseCategory || 'Needs classification')}</td>
        <td>${badge(label, variant)}</td>
        <td><button class="btn sm" data-loop="${c.id}">Manage</button></td>
      </tr>`; }).join('') || '<tr><td colspan="6" class="muted" style="padding:16px">No 1–2 star responses in scope.</td></tr>'}
    </tbody></table></div>`;

  line(container.querySelector('#c-trend'), { labels: months, datasets: [{ label: 'Avg CPE', values: trend, color: COLORS.brand }] });
  bar(container.querySelector('#c-track'), { labels: TRACKS.map((t) => t.replace(' (P&E)', '')), values: byTrack, color: '#2aa0a4', label: 'CPE' });
  container.querySelector('#sel-eng').addEventListener('change', (e) => { selEng = e.target.value; renderCpe(container); });
  container.querySelectorAll('[data-loop]').forEach((b) => b.addEventListener('click', () => openLoopDrawer(b.getAttribute('data-loop'), container)));
}

function openLoopDrawer(cpeId, container) {
  const d = store.data;
  const c = d.cpe.find((item) => item.id === cpeId);
  if (!c) return;
  const e = d.engagements.find((x) => x.id === c.engagementId);
  const [label, variant] = LOOP_STATUS_BADGE[c.loopStatus] || LOOP_STATUS_BADGE.open;
  const canAct = c.loopStatus !== 'closed';

  const body = `
    <div class="row wrap mb16" style="gap:8px">${badge(label, variant)}<span class="muted" style="font-size:12px">Score ${c.score}/5 · ${esc(c.track)}</span></div>
    <div class="field"><span class="field-key">Customer</span><span class="field-val">${esc(e ? e.customer : c.engagementId)}</span></div>
    <div class="field"><span class="field-key">Root cause</span><span class="field-val">${esc(c.rootCauseCategory || 'Needs classification')}</span></div>
    <div class="field"><span class="field-key">Suggested action</span><span class="field-val">${esc(c.rootCauseAction || '—')}</span></div>
    <div class="story-quote">“${esc(c.verbatim)}”</div>
    <div class="section-title">Closure log</div>
    <div class="timeline">${(c.loopLog || []).map((item) => `<div class="tl-item"><div class="row" style="justify-content:space-between"><strong style="font-size:13px">${esc(item.by)}</strong><span class="tl-date">${esc(item.at.slice(0, 16).replace('T', ' '))}</span></div><div class="muted mt8">${esc(item.note)}</div></div>`).join('') || '<div class="muted" style="font-size:12px">No updates logged yet.</div>'}</div>
    ${canAct ? `
      <textarea id="loop-note" style="width:100%;min-height:70px;border:1px solid var(--stroke-1);border-radius:4px;padding:8px;font-family:inherit;margin:8px 0" placeholder="Log the outreach, root cause confirmation or resolution…"></textarea>
      <div class="row" style="gap:6px">
        <button class="btn sm" id="loop-update">Log update</button>
        <button class="btn sm primary" id="loop-close">Close the loop</button>
      </div>
      <div id="loop-error"></div>` : '<div class="muted mt8" style="font-size:12px">This loop is closed.</div>'}`;

  openDrawer(`DSAT close-the-loop · ${esc(c.id)}`, body, (dr) => {
    const note = () => dr.querySelector('#loop-note').value;
    const showError = (msg) => { dr.querySelector('#loop-error').innerHTML = `<div class="muted" style="color:${COLORS.negative};font-size:12px;margin-top:6px">${esc(msg)}</div>`; };
    dr.querySelector('#loop-update')?.addEventListener('click', () => {
      try { addCpeLoopUpdate(c.id, note(), PERSONAS[store.role].name); closeDrawer(); renderCpe(container); }
      catch (err) { showError(err.message); }
    });
    dr.querySelector('#loop-close')?.addEventListener('click', () => {
      try { closeCpeLoop(c.id, note(), PERSONAS[store.role].name); closeDrawer(); renderCpe(container); }
      catch (err) { showError(err.message); }
    });
  });
}
