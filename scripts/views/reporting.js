// Reporting & AI — Executive View + MBR generator + ask-your-data.
import { store, computeKpis } from '../store.js';
import { pageHeader, kpiCard, aiChip, esc, badge, clearCharts, bar, donut, line, COLORS, scoreColor, utilColor } from '../components.js';
import { icon } from '../icons.js';
import { mbrNarrative, askData, execSummary } from '../ai.js';
import { TRACKS, TZ_MAP } from '../../data/generate.js';

const PERIODS = ['2026-04', '2026-05', '2026-06', '2026-07'];
let tab = 'exec';
let selPartner = null;
let selPeriod = '2026-07';
let mbrOut = '';
let askOut = '';

export function renderReporting(container) {
  const tabs = [['exec', 'Executive View'], ['mbr', 'MBR & Ask-your-data']];
  container.innerHTML = `
    ${pageHeader({ title: 'Reporting & AI', description: 'Executive Success Programs insights, AI-assisted MBRs, and ask-your-data over SSD IQ.' })}
    <div class="tabs">${tabs.map(([k, l]) => `<div class="tab ${tab === k ? 'active' : ''}" data-tab="${k}">${l}</div>`).join('')}</div>
    <div id="tabc"></div>`;
  container.querySelectorAll('[data-tab]').forEach((el) => el.addEventListener('click', () => { tab = el.getAttribute('data-tab'); renderReporting(container); }));
  const tc = container.querySelector('#tabc');
  if (tab === 'exec') renderExec(tc);
  else renderMbr(tc);
}

function tzOf(csaId) { const c = store.data.csas.find((x) => x.id === csaId); if (!c) return null; const p = store.data.pods.find((pp) => pp.id === c.podId); return p ? p.tz : null; }

// ---- Executive View (representative of the FY27 Success Programs exec PBI) ----
function renderExec(tc) {
  clearCharts();
  const d = store.data;
  const k = computeKpis(d);
  const exec = execSummary(d);

  const months = [...new Set([...d.deliveries.map((x) => x.completedDate.slice(0, 7)), ...d.cpe.map((c) => c.date.slice(0, 7))])].filter(Boolean).sort();
  const delByMonth = months.map((m) => d.deliveries.filter((x) => x.completedDate.slice(0, 7) === m).length);
  const cpeByMonth = months.map((m) => { const items = d.cpe.filter((c) => c.date.slice(0, 7) === m); return items.length ? Math.round((items.reduce((s, c) => s + c.score, 0) / items.length) * 10) / 10 : null; });
  const delByTrack = TRACKS.map((t) => d.deliveries.filter((x) => x.track === t).length);
  const tzs = Object.keys(TZ_MAP);
  const delByTz = tzs.map((tz) => d.deliveries.filter((dl) => { const e = d.engagements.find((x) => x.id === dl.engagementId); return e && tzOf(e.assignedTo) === tz; }).length);
  const delByPartner = d.partners.map((p) => { const ids = d.csas.filter((c) => c.partnerId === p.id).map((c) => c.id); return d.deliveries.filter((dl) => { const e = d.engagements.find((x) => x.id === dl.engagementId); return e && ids.includes(e.assignedTo); }).length; });
  const sev = ['sev1', 'sev2', 'sev3', 'sev4'].map((s) => d.escalations.filter((e) => e.severity === s).length);

  tc.innerHTML = `
    <div class="row wrap mb8" style="gap:8px;align-items:center"><strong style="font-size:15px">Success Programs — Executive View</strong>${badge('FY27', 'tint-info')}${badge('representative · pending real PBI', 'outline')}</div>

    <div class="kpi-grid">
      ${kpiCard({ label: 'Deliveries completed', value: k.deliveriesCompleted, iconName: 'check', tone: COLORS.brand })}
      ${kpiCard({ label: 'On-time delivery', value: k.onTimePct + '%', iconName: 'send', tone: k.onTimePct >= 90 ? COLORS.positive : COLORS.warning })}
      ${kpiCard({ label: 'Rolling CPE', value: k.rollingCpe.toFixed(1), iconName: 'star', tone: scoreColor(k.rollingCpe) })}
      ${kpiCard({ label: 'Active engagements', value: k.activeEngagements, iconName: 'send' })}
      ${kpiCard({ label: 'Open escalations', value: k.openEscalations, iconName: 'warning', tone: k.slaBreaches ? COLORS.negative : COLORS.neutral, hint: `${k.slaBreaches} breaching SLA` })}
      ${kpiCard({ label: 'Utilization', value: k.utilization + '%', iconName: 'people', tone: utilColor(k.utilization) })}
      ${kpiCard({ label: 'Net sentiment', value: k.netSentiment > 0 ? '+' + k.netSentiment : k.netSentiment, iconName: 'emoji', tone: k.netSentiment >= 0 ? COLORS.positive : COLORS.negative })}
    </div>

    <div class="card pad mb16" style="border-left:4px solid var(--brand-primary)">
      <div class="row mb8">${icon('sparkle', 16)}<strong>Executive summary</strong>${aiChip()}</div>
      <div>${esc(exec.text)}</div>
    </div>

    <div class="two-col">
      <div class="card chart-card"><div class="chart-head"><strong>Deliveries by month</strong></div><div class="chart-holder" style="height:220px"><canvas id="e-delm"></canvas></div></div>
      <div class="card chart-card"><div class="chart-head"><strong>CPE trend</strong></div><div class="chart-holder" style="height:220px"><canvas id="e-cpem"></canvas></div></div>
    </div>
    <div class="two-col">
      <div class="card chart-card"><div class="chart-head"><strong>Deliveries by Success Program</strong></div><div class="chart-holder" style="height:220px"><canvas id="e-track"></canvas></div></div>
      <div class="card chart-card"><div class="chart-head"><strong>Deliveries by time zone</strong></div><div class="chart-holder" style="height:220px"><canvas id="e-tz"></canvas></div></div>
    </div>
    <div class="two-col">
      <div class="card chart-card"><div class="chart-head"><strong>Deliveries by partner</strong></div><div class="chart-holder" style="height:220px"><canvas id="e-partner"></canvas></div></div>
      <div class="card chart-card"><div class="chart-head"><strong>Escalations by severity</strong></div><div class="chart-holder" style="height:220px"><canvas id="e-sev"></canvas></div></div>
    </div>`;

  bar(tc.querySelector('#e-delm'), { labels: months, values: delByMonth, color: COLORS.brand, label: 'Deliveries' });
  line(tc.querySelector('#e-cpem'), { labels: months, datasets: [{ label: 'Avg CPE', values: cpeByMonth, color: '#2aa0a4' }] });
  bar(tc.querySelector('#e-track'), { labels: TRACKS.map((t) => t.replace(' (P&E)', '')), values: delByTrack, color: '#6b69d6', label: 'Deliveries' });
  bar(tc.querySelector('#e-tz'), { labels: tzs, values: delByTz, color: '#f7a600', label: 'Deliveries' });
  bar(tc.querySelector('#e-partner'), { labels: d.partners.map((p) => p.name), values: delByPartner, color: COLORS.brand, label: 'Deliveries' });
  donut(tc.querySelector('#e-sev'), { labels: ['Sev 1', 'Sev 2', 'Sev 3', 'Sev 4'], values: sev, colors: [COLORS.sev1, COLORS.sev2, COLORS.sev3, COLORS.sev4] });
}

// ---- MBR & Ask-your-data ----
function renderMbr(tc) {
  clearCharts();
  const d = store.data;
  if (!selPartner) selPartner = d.partners[0] && d.partners[0].id;
  const partnerOpts = d.partners.map((p) => `<option value="${p.id}" ${p.id === selPartner ? 'selected' : ''}>${esc(p.name)}</option>`).join('');
  const periodOpts = PERIODS.map((p) => `<option value="${p}" ${p === selPeriod ? 'selected' : ''}>${p}</option>`).join('');
  const deliveriesByPartner = d.partners.map((p) => { const ids = d.csas.filter((c) => c.partnerId === p.id).map((c) => c.id); return d.deliveries.filter((dl) => { const e = d.engagements.find((x) => x.id === dl.engagementId); return e && ids.includes(e.assignedTo); }).length; });

  tc.innerHTML = `
    <div class="two-col">
      <div class="card pad">
        <div class="row mb8" style="gap:8px;flex-wrap:wrap"><strong>Delivery Partner MBR</strong>
          <select class="select" id="mbr-partner">${partnerOpts}</select>
          <select class="select" id="mbr-period">${periodOpts}</select>
          <button class="btn primary sm" id="mbr-gen">${icon('sparkle', 14)} Generate</button>
        </div>
        <div id="mbr-out">${mbrOut || '<div class="muted">Select a partner and period, then generate a draft MBR narrative.</div>'}</div>
      </div>
      <div class="card pad">
        <strong>Ask your data</strong>
        <div class="input-wrap mt8" style="width:100%"><span class="in-ico">${icon('search', 18)}</span><input class="input" id="ask-in" style="width:100%" placeholder="e.g. CPE trend for Avanade"/></div>
        <div class="row wrap mt8" style="gap:6px">
          ${['CPE trend for Avanade', 'open escalations', 'utilization', 'on-time delivery'].map((q) => `<button class="btn sm" data-q="${esc(q)}">${esc(q)}</button>`).join('')}
        </div>
        <div id="ask-out" class="mt8">${askOut}</div>
      </div>
    </div>
    <div class="card chart-card"><div class="chart-head"><strong>Deliveries by partner</strong>${aiChip('outliers')}</div><div class="chart-holder" style="height:240px"><canvas id="c-deliv"></canvas></div></div>`;

  bar(tc.querySelector('#c-deliv'), { labels: d.partners.map((p) => p.name), values: deliveriesByPartner, color: COLORS.brand, label: 'Deliveries' });
  const runMbr = () => { const p = d.partners.find((x) => x.id === selPartner); const r = mbrNarrative(p, selPeriod, d); mbrOut = `<div class="card pad" style="background:var(--bg-2)"><div class="row mb8">${aiChip()}<button class="btn sm" id="mbr-copy">Copy</button></div><pre style="white-space:pre-wrap;font-family:inherit;font-size:13px;margin:0">${esc(r.text)}</pre></div>`; renderMbr(tc); };
  const runAsk = (q) => { askOut = `<div class="card pad" style="background:var(--bg-2)"><div class="row mb8">${aiChip()}</div><div>${esc(askData(q, d).text)}</div></div>`; renderMbr(tc); };
  tc.querySelector('#mbr-partner').addEventListener('change', (e) => { selPartner = e.target.value; });
  tc.querySelector('#mbr-period').addEventListener('change', (e) => { selPeriod = e.target.value; });
  tc.querySelector('#mbr-gen').addEventListener('click', runMbr);
  const copyBtn = tc.querySelector('#mbr-copy'); if (copyBtn) copyBtn.addEventListener('click', () => { const txt = tc.querySelector('#mbr-out pre'); if (txt && navigator.clipboard) navigator.clipboard.writeText(txt.textContent); });
  const askIn = tc.querySelector('#ask-in');
  askIn.addEventListener('keydown', (e) => { if (e.key === 'Enter' && askIn.value.trim()) runAsk(askIn.value.trim()); });
  tc.querySelectorAll('[data-q]').forEach((b) => b.addEventListener('click', () => runAsk(b.getAttribute('data-q'))));
}
