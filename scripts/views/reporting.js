// Reporting & AI — Executive View + MBR generator + ask-your-data.
import { store, computeKpis, hoursSince } from '../store.js';
import { pageHeader, kpiCard, aiChip, esc, badge, clearCharts, bar, donut, line, meter, COLORS, scoreColor, utilColor } from '../components.js';
import { icon } from '../icons.js';
import { mbrNarrative, askData, execSummary } from '../ai.js';
import { TRACKS, TZ_MAP } from '../../data/generate.js';

const PERIODS = ['2026-04', '2026-05', '2026-06', '2026-07'];
let tab = 'exec';
let selPartner = null;
let selPeriod = '2026-07';
let mbrOut = '';
let askOut = '';
let groupBy = 'tz';
let fTz = 'All';
let fTrack = 'All';
let fPartner = 'All';
let fStatus = 'All';

export function renderReporting(container) {
  const tabs = [['exec', 'Executive View'], ['territory', 'Territory Ops'], ['mbr', 'MBR & Ask-your-data']];
  container.innerHTML = `
    ${pageHeader({ title: 'Reporting & AI', description: 'Executive Success Programs insights, AI-assisted MBRs, and ask-your-data over SSD IQ.' })}
    <div class="tabs">${tabs.map(([k, l]) => `<div class="tab ${tab === k ? 'active' : ''}" data-tab="${k}">${l}</div>`).join('')}</div>
    <div id="tabc"></div>`;
  container.querySelectorAll('[data-tab]').forEach((el) => el.addEventListener('click', () => { tab = el.getAttribute('data-tab'); renderReporting(container); }));
  const tc = container.querySelector('#tabc');
  if (tab === 'exec') renderExec(tc);
  else if (tab === 'territory') renderTerritory(tc);
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

// ---- Territory Ops (operational; inclusive of Time Zones and US OUs) ----
function metaOf(e) {
  const d = store.data;
  const c = e.assignedTo ? d.csas.find((x) => x.id === e.assignedTo) : null;
  const pod = c ? d.pods.find((p) => p.id === c.podId) : null;
  return { tz: pod ? pod.tz : 'Unassigned', region: pod ? pod.region : 'Unassigned', partnerId: c ? c.partnerId : null, partner: c ? ((d.partners.find((p) => p.id === c.partnerId) || {}).name || 'Unassigned') : 'Unassigned' };
}
function renderTerritory(tc) {
  clearCharts();
  const d = store.data;
  const tzs = Object.keys(TZ_MAP);
  const regions = [...new Set(d.pods.map((p) => p.region))].sort();
  const statuses = ['new', 'assigned', 'in-delivery', 'complete'];
  const partnerName = (id) => (d.partners.find((p) => p.id === id) || {}).name;

  const engs = d.engagements.filter((e) => { const m = metaOf(e); return (fTz === 'All' || m.tz === fTz) && (fTrack === 'All' || e.track === fTrack) && (fPartner === 'All' || m.partnerId === fPartner) && (fStatus === 'All' || e.status === fStatus); });
  const groupOf = (e) => { const m = metaOf(e); return groupBy === 'tz' ? m.tz : groupBy === 'region' ? m.region : groupBy === 'partner' ? m.partner : e.track; };
  const groupNames = groupBy === 'tz' ? tzs : groupBy === 'region' ? regions : groupBy === 'partner' ? d.partners.map((p) => p.name) : TRACKS;
  const csasIn = (g) => d.csas.filter((c) => { if (c.lifecycle !== 'active') return false; const pod = d.pods.find((p) => p.id === c.podId); if (!pod) return false; if (groupBy === 'tz') return pod.tz === g; if (groupBy === 'region') return pod.region === g; if (groupBy === 'partner') return partnerName(c.partnerId) === g; return c.tracks.includes(g); });

  const rows = groupNames.map((g) => {
    const ge = engs.filter((e) => groupOf(e) === g);
    const dels = d.deliveries.filter((dl) => ge.some((e) => e.id === dl.engagementId));
    const onTime = dels.filter((dl) => { const e = ge.find((x) => x.id === dl.engagementId); return e && dl.completedDate <= e.dueDate; }).length;
    const escs = d.escalations.filter((x) => ge.some((e) => e.id === x.engagementId));
    const cpeItems = d.cpe.filter((c) => ge.some((e) => e.id === c.engagementId));
    const csas = csasIn(g);
    return {
      g, count: ge.length,
      active: ge.filter((e) => e.status === 'assigned' || e.status === 'in-delivery').length,
      atRisk: ge.filter((e) => e.atRisk).length,
      onTimePct: dels.length ? Math.round((onTime / dels.length) * 100) : null,
      openEsc: escs.filter((x) => x.status !== 'resolved').length,
      slaBreach: escs.filter((x) => x.status !== 'resolved' && hoursSince(x.opened) > x.slaHours).length,
      csas: csas.length,
      util: csas.length ? Math.round(csas.reduce((s, c) => s + c.utilization, 0) / csas.length) : 0,
      avgCpe: cpeItems.length ? Math.round((cpeItems.reduce((s, c) => s + c.score, 0) / cpeItems.length) * 10) / 10 : 0,
    };
  }).filter((r) => r.count > 0 || r.csas > 0);

  const delsF = d.deliveries.filter((dl) => engs.some((e) => e.id === dl.engagementId));
  const escsF = d.escalations.filter((x) => engs.some((e) => e.id === x.engagementId));
  const csasF = d.csas.filter((c) => { if (c.lifecycle !== 'active') return false; const pod = d.pods.find((p) => p.id === c.podId); if (!pod) return false; if (fTz !== 'All' && pod.tz !== fTz) return false; if (fPartner !== 'All' && c.partnerId !== fPartner) return false; if (fTrack !== 'All' && !c.tracks.includes(fTrack)) return false; return true; });
  const cpeF = d.cpe.filter((c) => engs.some((e) => e.id === c.engagementId));
  const T = {
    active: engs.filter((e) => e.status === 'assigned' || e.status === 'in-delivery').length,
    atRisk: engs.filter((e) => e.atRisk).length,
    openEsc: escsF.filter((x) => x.status !== 'resolved').length,
    sla: escsF.filter((x) => x.status !== 'resolved' && hoursSince(x.opened) > x.slaHours).length,
    onTime: delsF.length ? Math.round((delsF.filter((dl) => { const e = engs.find((x) => x.id === dl.engagementId); return e && dl.completedDate <= e.dueDate; }).length / delsF.length) * 100) : 0,
    util: csasF.length ? Math.round(csasF.reduce((s, c) => s + c.utilization, 0) / csasF.length) : 0,
    cpe: cpeF.length ? Math.round((cpeF.reduce((s, c) => s + c.score, 0) / cpeF.length) * 10) / 10 : 0,
  };

  const scope = [fTz !== 'All' ? fTz : null, fPartner !== 'All' ? partnerName(fPartner) : null, fTrack !== 'All' ? fTrack : null, fStatus !== 'All' ? fStatus : null].filter(Boolean).join(' · ') || 'all territories';
  const worst = [...rows].sort((a, b) => b.slaBreach - a.slaBreach)[0];
  const aiText = `Operational view — ${scope}: ${T.active} active engagements, ${T.atRisk} at risk, ${T.openEsc} open escalations (${T.sla} breaching SLA). On-time ${T.onTime}%, utilization ${T.util}%, CPE ${T.cpe}. ${T.sla > 0 && worst ? `Highest SLA pressure: ${worst.g} (${worst.slaBreach}).` : 'No SLA breaches in scope.'}`;

  const GROUP_OPTS = [['tz', 'Time Zone'], ['region', 'Territory (Region / OU)'], ['partner', 'Partner'], ['track', 'Success Program']];
  const opt = (v, sel, label) => `<option value="${esc(v)}" ${v === sel ? 'selected' : ''}>${esc(label)}</option>`;
  const groupLabel = GROUP_OPTS.find((x) => x[0] === groupBy)[1];

  tc.innerHTML = `
    <div class="muted mb8" style="font-size:12px">Territories roll up to Time Zones globally and to OUs in the US — pick any grouping and combine filters for an operational read.</div>
    <div class="row wrap mb16" style="gap:8px;align-items:center">
      <label class="row" style="gap:4px"><span class="muted" style="font-size:12px">Group by</span><select class="select" id="t-group">${GROUP_OPTS.map(([v, l]) => opt(v, groupBy, l)).join('')}</select></label>
      <select class="select" id="t-tz">${['All', ...tzs].map((v) => opt(v, fTz, v === 'All' ? 'All time zones' : v)).join('')}</select>
      <select class="select" id="t-track">${['All', ...TRACKS].map((v) => opt(v, fTrack, v === 'All' ? 'All programs' : v)).join('')}</select>
      <select class="select" id="t-partner">${['All', ...d.partners.map((p) => p.id)].map((v) => opt(v, fPartner, v === 'All' ? 'All partners' : partnerName(v))).join('')}</select>
      <select class="select" id="t-status">${['All', ...statuses].map((v) => opt(v, fStatus, v === 'All' ? 'All statuses' : v)).join('')}</select>
      <button class="btn sm" id="t-reset">Reset</button>
    </div>

    <div class="kpi-grid">
      ${kpiCard({ label: 'Active engagements', value: T.active, iconName: 'send' })}
      ${kpiCard({ label: 'At-risk', value: T.atRisk, iconName: 'warning', tone: T.atRisk ? COLORS.warning : COLORS.neutral })}
      ${kpiCard({ label: 'Open escalations', value: T.openEsc, iconName: 'warning', tone: T.sla ? COLORS.negative : COLORS.neutral, hint: `${T.sla} breaching SLA` })}
      ${kpiCard({ label: 'On-time', value: T.onTime + '%', iconName: 'check', tone: T.onTime >= 90 ? COLORS.positive : COLORS.warning })}
      ${kpiCard({ label: 'Utilization', value: T.util + '%', iconName: 'people', tone: utilColor(T.util) })}
      ${kpiCard({ label: 'Avg CPE', value: T.cpe.toFixed(1), iconName: 'star', tone: scoreColor(T.cpe) })}
    </div>

    <div class="card pad mb16" style="border-left:4px solid var(--brand-primary)"><div class="row mb8">${icon('sparkle', 16)}<strong>Operational summary</strong>${aiChip()}</div><div>${esc(aiText)}</div></div>

    <div class="section-title">By ${esc(groupLabel)}</div>
    <div class="table-wrap mb16"><table class="grid"><thead><tr><th>${esc(groupLabel)}</th><th>Engagements</th><th>Active</th><th>At-risk</th><th>On-time</th><th>Open esc</th><th>SLA breach</th><th>CSAs</th><th>Utilization</th><th>CPE</th></tr></thead><tbody>
      ${rows.map((r) => `<tr>
        <td><strong>${esc(r.g)}</strong></td>
        <td>${r.count}</td>
        <td>${r.active}</td>
        <td>${r.atRisk ? `<span style="color:${COLORS.warning}">${r.atRisk}</span>` : '0'}</td>
        <td>${r.onTimePct == null ? '—' : r.onTimePct + '%'}</td>
        <td>${r.openEsc}</td>
        <td>${r.slaBreach ? `<span style="color:${COLORS.negative}">${r.slaBreach}</span>` : '0'}</td>
        <td>${r.csas}</td>
        <td><div class="row" style="gap:6px">${meter(r.util, utilColor(r.util))}<span>${r.util}%</span></div></td>
        <td style="color:${scoreColor(r.avgCpe)}">${r.avgCpe ? r.avgCpe.toFixed(1) : '—'}</td>
      </tr>`).join('') || '<tr><td colspan="10" class="muted" style="padding:16px">No data for this filter combination.</td></tr>'}
    </tbody></table></div>

    <div class="two-col">
      <div class="card chart-card"><div class="chart-head"><strong>Active engagements by ${esc(groupLabel)}</strong></div><div class="chart-holder" style="height:220px"><canvas id="t-active"></canvas></div></div>
      <div class="card chart-card"><div class="chart-head"><strong>Open escalations by ${esc(groupLabel)}</strong></div><div class="chart-holder" style="height:220px"><canvas id="t-esc"></canvas></div></div>
    </div>`;

  bar(tc.querySelector('#t-active'), { labels: rows.map((r) => r.g), values: rows.map((r) => r.active), color: COLORS.brand, label: 'Active' });
  bar(tc.querySelector('#t-esc'), { labels: rows.map((r) => r.g), values: rows.map((r) => r.openEsc), color: COLORS.sev2, label: 'Open esc' });

  const rerender = () => renderTerritory(tc);
  tc.querySelector('#t-group').addEventListener('change', (e) => { groupBy = e.target.value; rerender(); });
  tc.querySelector('#t-tz').addEventListener('change', (e) => { fTz = e.target.value; rerender(); });
  tc.querySelector('#t-track').addEventListener('change', (e) => { fTrack = e.target.value; rerender(); });
  tc.querySelector('#t-partner').addEventListener('change', (e) => { fPartner = e.target.value; rerender(); });
  tc.querySelector('#t-status').addEventListener('change', (e) => { fStatus = e.target.value; rerender(); });
  tc.querySelector('#t-reset').addEventListener('click', () => { fTz = 'All'; fTrack = 'All'; fPartner = 'All'; fStatus = 'All'; rerender(); });
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
