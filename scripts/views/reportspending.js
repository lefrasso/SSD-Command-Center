// Reports Pending — overdue delivery reports + T-3W proactive engagement tracking.
// The proactive dispatch process (Day 0-3 outreach owned by the Partner CSA) should
// prevent reports from becoming pending; this module tracks both the problem and the prevention.
import { store } from '../store.js';
import { pageHeader, kpiCard, aiChip, esc, COLORS, clearCharts, bar, donut } from '../components.js';
import { icon } from '../icons.js';
import { TRACKS, TZ_MAP } from '../../data/generate.js';

const NOW = Date.parse('2026-07-28T09:00:00Z');
const daysUntil = (s) => Math.round((Date.parse(s) - NOW) / 864e5);

let fTrack = 'All';
let fTz = 'All';

const csaOf = (e) => (e.assignedTo ? store.data.csas.find((x) => x.id === e.assignedTo) : null);
const podOf = (e) => { const c = csaOf(e); return c ? store.data.pods.find((p) => p.id === c.podId) : null; };
const tzOf = (e) => { const p = podOf(e); return p ? p.tz : 'Unassigned'; };
const outreachCount = (e) => Object.values(e.outreach).filter(Boolean).length;

function proStatus(e) {
  const dd = daysUntil(e.dueDate); const o = outreachCount(e);
  if (dd < 0) return { key: 'overdue', label: 'Overdue', color: COLORS.negative };
  if (o === 0) return { key: 'none', label: 'Not started', color: COLORS.negative };
  if (o >= 3) return { key: 'ontrack', label: 'On track', color: COLORS.positive };
  return { key: 'progress', label: 'In progress', color: COLORS.warning };
}
function reason(e) {
  if (outreachCount(e) === 0) return 'No proactive outreach (T-3W missed)';
  if (e.atRisk) return 'At-risk engagement';
  return 'Delivery running late';
}

export function renderReportsPending(container) {
  clearCharts();
  const d = store.data;
  const match = (e) => (fTrack === 'All' || e.track === fTrack) && (fTz === 'All' || tzOf(e) === fTz);
  const active = d.engagements.filter((e) => e.status !== 'complete' && match(e));
  const overdue = active.filter((e) => daysUntil(e.dueDate) < 0);
  const inWindow = active.filter((e) => { const dd = daysUntil(e.dueDate); return dd >= 0 && dd <= 21; });
  const notStarted = inWindow.filter((e) => outreachCount(e) === 0);
  const proactiveCoverage = inWindow.length ? Math.round((inWindow.filter((e) => e.outreach.day0).length / inWindow.length) * 100) : 100;
  const avgOverdue = overdue.length ? Math.round(overdue.reduce((s, e) => s + Math.abs(daysUntil(e.dueDate)), 0) / overdue.length) : 0;

  const buckets = [['1–7d', (n) => n >= 1 && n <= 7], ['8–14d', (n) => n >= 8 && n <= 14], ['15–30d', (n) => n >= 15 && n <= 30], ['30d+', (n) => n > 30]];
  const bucketVals = buckets.map(([, fn]) => overdue.filter((e) => fn(Math.abs(daysUntil(e.dueDate)))).length);
  const pipeline = [...overdue, ...inWindow];
  const proDist = ['ontrack', 'progress', 'none', 'overdue'].map((k) => pipeline.filter((e) => proStatus(e).key === k).length);

  const worstTrack = TRACKS.map((t) => ({ t, n: overdue.filter((e) => e.track === t).length })).sort((a, b) => b.n - a.n)[0];
  const aiText = `${overdue.length} reports pending (avg ${avgOverdue}d overdue). ${inWindow.length} engagements are in the T-3W window; proactive outreach has started on ${proactiveCoverage}% — ${notStarted.length} have no outreach yet and are likely to become pending. ${worstTrack && worstTrack.n ? `${worstTrack.t} carries the most pending reports. ` : ''}${proactiveCoverage < 80 ? 'Action: enforce the T-3W proactive dispatch on the not-started items.' : 'Proactive cadence is largely on track.'}`;

  const trackOpts = ['All', ...TRACKS].map((t) => `<option value="${esc(t)}" ${t === fTrack ? 'selected' : ''}>${t === 'All' ? 'All families' : esc(t)}</option>`).join('');
  const tzOpts = ['All', ...Object.keys(TZ_MAP)].map((t) => `<option value="${esc(t)}" ${t === fTz ? 'selected' : ''}>${t === 'All' ? 'All territories' : esc(t)}</option>`).join('');
  const chip = (v) => (v ? `<span style="color:${COLORS.positive}">✓</span>` : `<span style="color:${COLORS.negative}">—</span>`);

  container.innerHTML = `
    ${pageHeader({ title: 'Reports Pending', description: 'Overdue delivery reports and proactive engagement (T-3W) tracking — surfacing pending reports and whether the proactive dispatch process is preventing them.', actions: `<select class="select" id="rp-track">${trackOpts}</select><select class="select" id="rp-tz">${tzOpts}</select>` })}

    <div class="kpi-grid">
      ${kpiCard({ label: 'Reports pending', value: overdue.length, iconName: 'clock', tone: overdue.length ? COLORS.negative : COLORS.positive, hint: `avg ${avgOverdue}d overdue` })}
      ${kpiCard({ label: 'In T-3W window', value: inWindow.length, iconName: 'send', hint: 'due within 21 days' })}
      ${kpiCard({ label: 'Proactive coverage', value: proactiveCoverage + '%', iconName: 'check', tone: proactiveCoverage >= 80 ? COLORS.positive : COLORS.warning, hint: 'outreach started' })}
      ${kpiCard({ label: 'T-3W not started', value: notStarted.length, iconName: 'warning', tone: notStarted.length ? COLORS.negative : COLORS.positive, hint: 'no outreach yet' })}
    </div>

    <div class="card pad mb16" style="border-left:4px solid ${overdue.length ? COLORS.negative : COLORS.brand}"><div class="row mb8">${icon('sparkle', 16)}<strong>Insight</strong>${aiChip()}</div><div>${esc(aiText)}</div></div>

    <div class="two-col">
      <div class="card chart-card"><div class="chart-head"><strong>Pending report aging</strong></div><div class="chart-holder" style="height:220px"><canvas id="rp-age"></canvas></div></div>
      <div class="card chart-card"><div class="chart-head"><strong>Proactive (T-3W) status</strong></div><div class="chart-holder" style="height:220px"><canvas id="rp-pro"></canvas></div></div>
    </div>

    <div class="section-title">Reports pending (${overdue.length})</div>
    <div class="table-wrap mb16"><table class="grid"><thead><tr><th>Customer</th><th>CSA</th><th>Family</th><th>Territory</th><th>Due</th><th>Days overdue</th><th>Outreach</th><th>Reason</th></tr></thead><tbody>
      ${overdue.slice().sort((a, b) => daysUntil(a.dueDate) - daysUntil(b.dueDate)).map((e) => { const c = csaOf(e); const p = podOf(e); const od = Math.abs(daysUntil(e.dueDate)); return `<tr>
        <td><strong>${esc(e.customer)}</strong></td>
        <td>${esc(c ? c.name : 'Unassigned')}</td>
        <td>${esc(e.track)}</td>
        <td>${esc(p ? p.tz + ' · ' + p.region : '—')}</td>
        <td>${esc(e.dueDate)}</td>
        <td><span style="color:${od > 14 ? COLORS.negative : COLORS.warning};font-weight:600">${od}d</span></td>
        <td>${outreachCount(e)}/4</td>
        <td><span class="muted" style="font-size:12px">${esc(reason(e))}</span></td>
      </tr>`; }).join('') || '<tr><td colspan="8" class="muted" style="padding:16px">No reports pending in scope.</td></tr>'}
    </tbody></table></div>

    <div class="section-title">T-3W Proactive engagement tracker (${inWindow.length})</div>
    <div class="muted mb8" style="font-size:12px">Engagements due within 3 weeks. The Partner CSA owns the Day 0–3 proactive outreach cadence to prevent the report becoming pending.</div>
    <div class="table-wrap"><table class="grid"><thead><tr><th>Customer</th><th>CSA</th><th>Family</th><th>Due in</th><th>Day 0</th><th>Day 1</th><th>Day 2</th><th>Day 3</th><th>Proactive status</th></tr></thead><tbody>
      ${inWindow.slice().sort((a, b) => daysUntil(a.dueDate) - daysUntil(b.dueDate)).map((e) => { const c = csaOf(e); const dd = daysUntil(e.dueDate); const ps = proStatus(e); return `<tr>
        <td><strong>${esc(e.customer)}</strong></td>
        <td>${esc(c ? c.name : 'Unassigned')}</td>
        <td>${esc(e.track)}</td>
        <td>${dd}d</td>
        <td>${chip(e.outreach.day0)}</td><td>${chip(e.outreach.day1)}</td><td>${chip(e.outreach.day2)}</td><td>${chip(e.outreach.day3)}</td>
        <td><span class="pill" style="color:${ps.color}"><span class="pill-label">${esc(ps.label)}</span></span></td>
      </tr>`; }).join('') || '<tr><td colspan="9" class="muted" style="padding:16px">No engagements in the T-3W window.</td></tr>'}
    </tbody></table></div>`;

  bar(container.querySelector('#rp-age'), { labels: buckets.map((b) => b[0]), values: bucketVals, color: COLORS.sev2, label: 'Pending' });
  donut(container.querySelector('#rp-pro'), { labels: ['On track', 'In progress', 'Not started', 'Overdue'], values: proDist, colors: [COLORS.positive, COLORS.warning, COLORS.negative, COLORS.sev1] });

  container.querySelector('#rp-track').addEventListener('change', (e) => { fTrack = e.target.value; renderReportsPending(container); });
  container.querySelector('#rp-tz').addEventListener('change', (e) => { fTz = e.target.value; renderReportsPending(container); });
}
