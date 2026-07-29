// Quality & CPE — experience trends + Recommended Practices auto-scoring.
import { store } from '../store.js';
import { pageHeader, kpiCard, aiChip, esc, sentimentPill, scoreColor, COLORS, clearCharts, line, bar } from '../components.js';
import { icon } from '../icons.js';
import { scoreQuality } from '../ai.js';
import { TRACKS } from '../../data/generate.js';

const PRACTICES = [
  ['Day 0 outreach completed', (e) => e.outreach.day0],
  ['Day 1 sync scheduled', (e) => e.outreach.day1],
  ['Stakeholders engaged (Day 2+)', (e) => e.outreach.day2],
  ['Milestone plan baselined', (e) => e.milestones.length > 0],
  ['Artifacts captured', (e) => e.milestones.some((m) => m.done)],
  ['CPE survey requested', (e) => e.status === 'complete'],
];

let selEng = null;

export function renderQuality(container) {
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

  container.innerHTML = `
    ${pageHeader({ title: 'Quality & CPE', description: 'Customer & Partner Experience management and quality checks against the Proactive Delivery CPE Recommended Practices.' })}

    <div class="kpi-grid">
      ${kpiCard({ label: 'Rolling CPE', value: rolling.toFixed(1), iconName: 'star', tone: scoreColor(rolling), hint: 'Target ≥ 4.4' })}
      ${kpiCard({ label: 'CPE responses', value: d.cpe.length, iconName: 'report' })}
      ${kpiCard({ label: 'Positive share', value: positivePct + '%', iconName: 'emoji', tone: COLORS.positive })}
    </div>

    <div class="two-col">
      <div class="card chart-card"><div class="chart-head"><strong>CPE trend</strong></div><div class="chart-holder" style="height:220px"><canvas id="c-trend"></canvas></div></div>
      <div class="card chart-card"><div class="chart-head"><strong>CPE by track</strong></div><div class="chart-holder" style="height:220px"><canvas id="c-track"></canvas></div></div>
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
    </div>`;

  clearCharts();
  line(container.querySelector('#c-trend'), { labels: months, datasets: [{ label: 'Avg CPE', values: trend, color: COLORS.brand }] });
  bar(container.querySelector('#c-track'), { labels: TRACKS.map((t) => t.replace(' (P&E)', '')), values: byTrack, color: '#2aa0a4', label: 'CPE' });

  container.querySelector('#sel-eng').addEventListener('change', (e) => { selEng = e.target.value; renderQuality(container); });
}
