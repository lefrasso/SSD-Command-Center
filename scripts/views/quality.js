// Quality & CPE — CPE trends, Quality Check forms + reporting, and Mock Deliveries.
import { store } from '../store.js';
import { pageHeader, kpiCard, aiChip, esc, badge, sentimentPill, scoreColor, COLORS, clearCharts, line, bar, openDrawer } from '../components.js';
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
const QC_CRITERIA = [
  'Scope & success criteria documented',
  'Day 0–3 outreach completed on time',
  'Stakeholders identified & engaged',
  'Milestone plan baselined & tracked',
  'Technical guidance accurate & actionable',
  'Artifacts captured & shared',
  'Risks & blockers escalated appropriately',
  'CPE survey requested at close',
];
const MOCK_QC_GUIDE = ['Delivery narrative & structure', 'Technical accuracy & depth', 'Stakeholder handling & Q&A', 'Artifact & deliverable quality', 'Time management & pacing', 'Proactive risk identification'];
const RATINGS = [['2', 'Met'], ['1', 'Partial'], ['0', 'Not met']];

let tab = 'cpe';
let selEng = null;
let qcEng = null;
const qcSubmissions = [];
const seedOf = (id) => [...id].reduce((a, ch) => a + ch.charCodeAt(0), 0);

export function renderQuality(container) {
  const tabs = [['cpe', 'CPE & Trends'], ['qc', 'Quality Checks'], ['mock', 'Mock Deliveries']];
  container.innerHTML = `
    ${pageHeader({ title: 'Quality & CPE', description: 'Experience management, quality checks and mock delivery QC — against the Proactive Delivery CPE Recommended Practices.' })}
    <div class="tabs">${tabs.map(([k, l]) => `<div class="tab ${tab === k ? 'active' : ''}" data-tab="${k}">${l}</div>`).join('')}</div>
    <div id="tabc"></div>`;
  container.querySelectorAll('[data-tab]').forEach((el) => el.addEventListener('click', () => { tab = el.getAttribute('data-tab'); renderQuality(container); }));
  const tc = container.querySelector('#tabc');
  if (tab === 'cpe') renderCpe(tc);
  else if (tab === 'qc') renderQc(tc);
  else renderMock(tc);
}

// ---- Tab 1: CPE & Trends ----
function renderCpe(tc) {
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

  tc.innerHTML = `
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
  line(tc.querySelector('#c-trend'), { labels: months, datasets: [{ label: 'Avg CPE', values: trend, color: COLORS.brand }] });
  bar(tc.querySelector('#c-track'), { labels: TRACKS.map((t) => t.replace(' (P&E)', '')), values: byTrack, color: '#2aa0a4', label: 'CPE' });
  tc.querySelector('#sel-eng').addEventListener('change', (e) => { selEng = e.target.value; renderCpe(tc); });
}

// ---- Tab 2: Quality Checks (form + reporting) ----
function qcAutoRatings(eng) {
  if (!eng) return QC_CRITERIA.map(() => 1);
  const o = eng.outreach; const mDone = eng.milestones.filter((m) => m.done).length; const mAll = eng.milestones.length;
  const qs = scoreQuality(eng).score;
  return [
    1 + (o.day0 ? 1 : 0),
    (o.day0 ? 1 : 0) + (o.day1 ? 1 : 0),
    o.day2 ? 2 : (o.day1 ? 1 : 0),
    mAll > 0 ? 2 : 0,
    Math.round(qs - 2),
    mDone > 0 ? 2 : (mAll > 0 ? 1 : 0),
    1,
    eng.status === 'complete' ? 2 : 0,
  ].map((v) => Math.max(0, Math.min(2, v)));
}
function qcResults(d) {
  const base = d.engagements.filter((e) => e.status === 'complete').slice(0, 40).map((e) => { const s = scoreQuality(e).score; return { customer: e.customer, track: e.track, score: s, pass: s >= 4 }; });
  return [...qcSubmissions, ...base];
}
function renderQc(tc) {
  clearCharts();
  const d = store.data;
  const scored = d.engagements.filter((e) => e.status === 'in-delivery' || e.status === 'complete');
  if (!qcEng || !scored.find((e) => e.id === qcEng)) qcEng = scored[0] && scored[0].id;
  const eng = d.engagements.find((e) => e.id === qcEng);
  const results = qcResults(d);
  const avg = results.length ? Math.round((results.reduce((s, r) => s + r.score, 0) / results.length) * 10) / 10 : 0;
  const passRate = results.length ? Math.round((results.filter((r) => r.pass).length / results.length) * 100) : 0;
  const byTrack = TRACKS.map((t) => { const rs = results.filter((r) => r.track === t); return rs.length ? Math.round((rs.reduce((s, r) => s + r.score, 0) / rs.length) * 10) / 10 : 0; });
  const auto = qcAutoRatings(eng);
  const engOpts = scored.slice(0, 60).map((e) => `<option value="${e.id}" ${e.id === qcEng ? 'selected' : ''}>${esc(e.customer)} · ${esc(e.program)}</option>`).join('');
  const critRows = QC_CRITERIA.map((c, i) => `<div class="qc-crit"><span>${esc(c)}</span><select class="select qc-r" data-i="${i}">${RATINGS.map(([v, l]) => `<option value="${v}" ${String(auto[i]) === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div>`).join('');

  tc.innerHTML = `
    <div class="kpi-grid">
      ${kpiCard({ label: 'Avg QC score', value: avg.toFixed(1), iconName: 'star', tone: scoreColor(avg), hint: '0–5' })}
      ${kpiCard({ label: 'QC pass rate', value: passRate + '%', iconName: 'check', tone: passRate >= 80 ? COLORS.positive : COLORS.warning, hint: '≥ 4/5 = pass' })}
      ${kpiCard({ label: 'QCs on record', value: results.length, iconName: 'report' })}
    </div>
    <div class="two-col">
      <div class="card pad">
        <div class="row mb8" style="justify-content:space-between"><strong>Quality Check form</strong><select class="select" id="qc-eng">${engOpts}</select></div>
        <div class="muted mb8" style="font-size:12px">Rate each criterion — AI has pre-filled from the engagement; adjust as needed.</div>
        ${critRows}
        <div class="row mt8" style="justify-content:space-between;align-items:center">
          <div>Score: <strong id="qc-score">—</strong></div>
          <div class="row" style="gap:6px"><button class="btn sm" id="qc-ai">${icon('sparkle', 14)} Explain</button><button class="btn primary sm" id="qc-submit">Submit QC</button></div>
        </div>
        <div id="qc-note" class="mt8"></div>
      </div>
      <div>
        <div class="card chart-card mb16"><div class="chart-head"><strong>Avg QC score by track</strong></div><div class="chart-holder" style="height:220px"><canvas id="c-qc"></canvas></div></div>
        <div class="card pad"><strong>Recent quality checks</strong><div class="mt8">${[...qcSubmissions, ...results].slice(0, 12).map((r) => `<div class="row" style="justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--stroke-2)"><span style="font-size:13px">${esc(r.customer)} · ${esc(r.track)}</span><span class="row" style="gap:6px">${Number(r.score).toFixed(1)} ${r.pass ? badge('Pass', 'tint-info') : badge('Rework', 'tint-warn')}</span></div>`).join('')}</div></div>
      </div>
    </div>`;

  bar(tc.querySelector('#c-qc'), { labels: TRACKS.map((t) => t.replace(' (P&E)', '')), values: byTrack, color: COLORS.brand, label: 'QC' });
  const calc = () => { const vals = [...tc.querySelectorAll('.qc-r')].map((s) => Number(s.value)); const score = Math.round((vals.reduce((a, b) => a + b, 0) / (QC_CRITERIA.length * 2)) * 5 * 10) / 10; tc.querySelector('#qc-score').textContent = `${score}/5`; return score; };
  tc.querySelectorAll('.qc-r').forEach((s) => s.addEventListener('change', calc)); calc();
  tc.querySelector('#qc-eng').addEventListener('change', (e) => { qcEng = e.target.value; renderQc(tc); });
  tc.querySelector('#qc-ai').addEventListener('click', () => { tc.querySelector('#qc-note').innerHTML = `<div class="card pad" style="background:var(--bg-2)"><div class="row mb8">${aiChip()}</div>${esc(scoreQuality(eng).text)}</div>`; });
  tc.querySelector('#qc-submit').addEventListener('click', () => { const score = calc(); qcSubmissions.unshift({ customer: eng.customer, track: eng.track, date: new Date().toISOString().slice(0, 10), score, pass: score >= 4 }); renderQc(tc); });
}

// ---- Tab 3: Mock Deliveries ----
function mockRec(c) {
  const seed = seedOf(c.id);
  const status = ['Scheduled', 'Passed', 'Rework'][seed % 3];
  const pod = store.data.pods.find((p) => p.id === c.podId);
  return { c, status, score: Math.min(5, Math.round((3.0 + (seed % 20) / 10) * 10) / 10), reviewer: pod ? pod.leadName : 'POD Lead', date: `2026-07-${String(10 + (seed % 18)).padStart(2, '0')}` };
}
function renderMock(tc) {
  clearCharts();
  const d = store.data;
  const recs = d.csas.filter((c) => c.lifecycle === 'onboarding' || c.lifecycle === 'selection' || c.lifecycle === 'sourcing').map(mockRec);
  const passRate = recs.length ? Math.round((recs.filter((r) => r.status === 'Passed').length / recs.length) * 100) : 0;
  tc.innerHTML = `
    <div class="muted mb16">Mock deliveries let a Partner CSA rehearse a delivery under QC review before their first live engagement, scored against the Mock Delivery QC Guide.</div>
    <div class="kpi-grid">
      ${kpiCard({ label: 'Mock deliveries', value: recs.length, iconName: 'send' })}
      ${kpiCard({ label: 'Pass rate', value: passRate + '%', iconName: 'check', tone: passRate >= 70 ? COLORS.positive : COLORS.warning })}
      ${kpiCard({ label: 'In onboarding', value: d.csas.filter((c) => c.lifecycle === 'onboarding').length, iconName: 'personAdd' })}
    </div>
    <div class="table-wrap"><table class="grid"><thead><tr><th>Partner CSA</th><th>Vendor</th><th>Reviewer</th><th>Scheduled</th><th>Score</th><th>Status</th><th></th></tr></thead><tbody>
      ${recs.map((r) => `<tr><td><strong>${esc(r.c.name)}</strong></td><td>${esc(r.c.vendor)}</td><td>${esc(r.reviewer)}</td><td>${r.date}</td><td>${r.score.toFixed(1)}</td><td>${r.status === 'Passed' ? badge('Passed', 'tint-info') : r.status === 'Rework' ? badge('Rework', 'tint-warn') : badge('Scheduled', 'outline')}</td><td><button class="btn sm" data-mock="${r.c.id}">Review</button></td></tr>`).join('') || '<tr><td colspan="7" class="muted" style="padding:16px">No mock deliveries in progress.</td></tr>'}
    </tbody></table></div>`;
  tc.querySelectorAll('[data-mock]').forEach((b) => b.addEventListener('click', () => openMock(b.getAttribute('data-mock'))));
}
function openMock(id) {
  const c = store.data.csas.find((x) => x.id === id); if (!c) return;
  const r = mockRec(c); const seed = seedOf(c.id);
  const doneCount = r.status === 'Passed' ? MOCK_QC_GUIDE.length : r.status === 'Rework' ? Math.max(2, seed % MOCK_QC_GUIDE.length) : seed % 3;
  const list = MOCK_QC_GUIDE.map((g, i) => `<div class="check-item"><span class="check-box ${i < doneCount ? 'done' : ''}">${i < doneCount ? icon('check', 12) : ''}</span><span>${esc(g)}</span></div>`).join('');
  const note = r.status === 'Passed' ? 'Strong mock delivery — cleared for first supervised engagement.' : r.status === 'Rework' ? 'Revisit technical depth and Q&A handling; schedule a follow-up mock.' : 'Mock delivery scheduled — prepare narrative and artifacts.';
  const body = `<div class="row wrap mb8" style="gap:8px">${r.status === 'Passed' ? badge('Passed', 'tint-info') : r.status === 'Rework' ? badge('Rework', 'tint-warn') : badge('Scheduled', 'outline')}<span class="muted" style="font-size:12px">Reviewer ${esc(r.reviewer)} · ${r.date} · score ${r.score.toFixed(1)}/5</span></div>
    <div class="section-title">Mock Delivery QC Guide</div>${list}
    <div class="card pad mt8" style="background:var(--bg-2)"><div class="row mb8">${icon('sparkle', 16)}<strong>Reviewer note</strong>${aiChip()}</div><div>${note}</div></div>`;
  openDrawer(`${esc(c.name)} · Mock delivery`, body);
}
