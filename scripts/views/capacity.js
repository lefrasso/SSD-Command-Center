// Capacity & Forecasting — planning, coverage, and Active & Future HC tracking + hiring progress.
// HC tracking + hiring progress are representative of the Active & Future SP HC Consolidation PBI.
import { store } from '../store.js';
import { pageHeader, kpiCard, aiChip, esc, badge, COLORS, clearCharts, bar, donut, utilColor } from '../components.js';
import { icon } from '../icons.js';
import { attritionSummary } from '../ai.js';
import { TRACKS, TZ_MAP, TZ_LANGUAGES, PROGRAMS } from '../../data/generate.js';

const CAP_PER_CSA = 4;
const daysBetween = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 864e5);
let tab = 'forecast';
let fAtrTz = 'All';
let fAtrFamily = 'All';
let fAtrType = 'All';
let fAtrResource = 'All';

export function renderCapacity(container) {
  const tabs = [['forecast', 'Forecast & Coverage'], ['hc', 'HC Tracking'], ['hiring', 'Hiring Progress'], ['attrition', 'Attrition Analysis']];
  container.innerHTML = `
    ${pageHeader({ title: 'Capacity & Forecasting', description: 'Demand forecasting and coverage, plus Active & Future headcount consolidation, hiring progress and attrition.', actions: aiChip('Planning') })}
    <div class="tabs">${tabs.map(([k, l]) => `<div class="tab ${tab === k ? 'active' : ''}" data-tab="${k}">${l}</div>`).join('')}</div>
    <div id="tabc"></div>`;
  container.querySelectorAll('[data-tab]').forEach((el) => el.addEventListener('click', () => { tab = el.getAttribute('data-tab'); renderCapacity(container); }));
  ({ forecast: renderForecast, hc: renderHc, hiring: renderHiring, attrition: renderAttrition })[tab](container.querySelector('#tabc'));
}

function renderForecast(tc) {
  clearCharts();
  const d = store.data;
  const active = d.csas.filter((c) => c.lifecycle === 'active');
  const ftcs = d.csas.filter((c) => c.resourceType === 'FTC');
  const open = d.engagements.filter((e) => e.status !== 'complete');

  const rows = TRACKS.map((t) => {
    const headcount = active.filter((c) => c.tracks.includes(t)).length;
    const demand = open.filter((e) => e.track === t).length;
    const required = Math.ceil(demand / CAP_PER_CSA);
    const gap = required - headcount;
    return { t, headcount, demand, required, gap };
  });
  const totalGap = rows.reduce((s, r) => s + Math.max(0, r.gap), 0);
  const avgUtil = active.length ? Math.round(active.reduce((s, c) => s + c.utilization, 0) / active.length) : 0;

  const tzs = Object.keys(TZ_MAP);
  const programs = TRACKS.flatMap((t) => (PROGRAMS[t] || []).map((p) => ({ family: t, program: p })));
  const speaksTz = (c, tz) => (c.languages || []).some((l) => (TZ_LANGUAGES[tz] || []).includes(l));
  const cover = (program, tz) => active.filter((c) => (c.accreditations || []).includes(program) && speaksTz(c, tz)).length;
  const coverGaps = programs.reduce((s, { program }) => s + tzs.filter((tz) => cover(program, tz) === 0).length, 0);
  const langCover = (lang) => active.filter((c) => (c.languages || []).includes(lang)).length;

  const cell = (n) => { const c = n === 0 ? COLORS.negative : n === 1 ? COLORS.warning : COLORS.positive; return `<td style="text-align:center;font-weight:600;color:${c};background:color-mix(in srgb, ${c} 12%, var(--bg-1))">${n}</td>`; };
  const worst = rows.slice().sort((a, b) => b.gap - a.gap)[0];
  const aiText = `Forecast: ${open.length} open engagements imply ${rows.reduce((s, r) => s + r.required, 0)} required CSAs vs ${active.length} active. ${totalGap > 0 ? `Headcount gap of ${totalGap} concentrated in ${worst.t}. ` : 'Headcount is sufficient. '}Coverage: ${coverGaps} Program×time-zone cells have no accredited, language-capable CSA (target: ≥1 per Program, per language, per time zone).`;

  tc.innerHTML = `
    <div class="kpi-grid">
      ${kpiCard({ label: 'FTC workforce', value: ftcs.length, iconName: 'people', hint: 'Target operating population' })}
      ${kpiCard({ label: 'Active CSAs', value: active.length, iconName: 'people' })}
      ${kpiCard({ label: 'Avg utilization', value: avgUtil + '%', iconName: 'trending', tone: utilColor(avgUtil) })}
      ${kpiCard({ label: 'Headcount gap', value: totalGap, iconName: 'personAdd', tone: totalGap ? COLORS.negative : COLORS.positive, hint: 'to meet demand' })}
      ${kpiCard({ label: 'Coverage gaps', value: coverGaps, iconName: 'warning', tone: coverGaps ? COLORS.warning : COLORS.positive, hint: 'Program × time zone' })}
    </div>

    <div class="card pad mb16" style="border-left:4px solid var(--brand-primary)"><div class="row mb8">${icon('sparkle', 16)}<strong>Forecast & planning insight</strong>${aiChip()}</div><div>${esc(aiText)}</div></div>

    <div class="two-col">
      <div>
        <div class="section-title">Headcount mapping & assignment — by Family</div>
        <div class="table-wrap"><table class="grid"><thead><tr><th>Family</th><th>Headcount</th><th>Demand</th><th>Required</th><th>Gap</th><th>Recommendation</th></tr></thead><tbody>
          ${rows.map((r) => `<tr>
            <td><strong>${esc(r.t)}</strong></td><td>${r.headcount}</td><td>${r.demand}</td><td>${r.required}</td>
            <td style="color:${r.gap > 0 ? COLORS.negative : COLORS.positive};font-weight:600">${r.gap > 0 ? '+' + r.gap : r.gap}</td>
            <td class="muted" style="font-size:12px">${r.gap > 0 ? `Assign / hire ${r.gap}` : 'Balanced'}</td>
          </tr>`).join('')}
        </tbody></table></div>
      </div>
      <div class="card chart-card"><div class="chart-head"><strong>Open demand by Family</strong></div><div class="chart-holder" style="height:260px"><canvas id="cap-chart"></canvas></div></div>
    </div>

    <div class="section-title">Coverage analysis — Program × time zone</div>
    <div class="muted mb8" style="font-size:12px">A CSA covers a time zone if accredited in the Program and speaks a language supported there — no territory restriction.</div>
    <div class="table-wrap mb16"><table class="grid"><thead><tr><th>Family</th><th>Program</th>${tzs.map((tz) => `<th style="text-align:center">${esc(tz)}</th>`).join('')}</tr></thead><tbody>
      ${programs.map(({ family, program }) => `<tr><td class="muted" style="font-size:12px">${esc(family)}</td><td><strong>${esc(program)}</strong></td>${tzs.map((tz) => cell(cover(program, tz))).join('')}</tr>`).join('')}
    </tbody></table></div>
    <div class="section-title">Language coverage by time zone</div>
    <div class="table-wrap"><table class="grid"><thead><tr><th>Time zone</th><th>Supported languages · active CSAs speaking each</th></tr></thead><tbody>
      ${tzs.map((tz) => `<tr><td><strong>${esc(tz)}</strong></td><td><div class="row wrap" style="gap:6px">${(TZ_LANGUAGES[tz] || []).map((l) => { const n = langCover(l); return `<span class="badge ${n ? 'tint-info' : 'tint-warn'}">${esc(l)} · ${n}</span>`; }).join('')}</div></td></tr>`).join('')}
    </tbody></table></div>`;

  bar(tc.querySelector('#cap-chart'), { labels: TRACKS, values: rows.map((r) => r.demand), color: COLORS.brand, label: 'Open demand' });
}

// ---- HC Tracking (Active & Future consolidation) ----
function renderHc(tc) {
  clearCharts();
  const d = store.data;
  const active = d.csas.filter((c) => c.lifecycle === 'active');
  const open = d.engagements.filter((e) => e.status !== 'complete');
  const openReqs = (d.hiring || []).filter((h) => h.stage !== 'Hired');
  const tzs = Object.keys(TZ_MAP);
  const podTz = (podId) => { const p = d.pods.find((x) => x.id === podId); return p ? p.tz : null; };

  const famRows = TRACKS.map((t) => {
    const activeHC = active.filter((c) => c.tracks.includes(t)).length;
    const pipeline = openReqs.filter((h) => h.family === t).length;
    const future = activeHC + pipeline;
    const required = Math.ceil(open.filter((e) => e.track === t).length / CAP_PER_CSA);
    return { t, activeHC, pipeline, future, required, gap: required - future };
  });
  const tzRows = tzs.map((tz) => {
    const activeHC = active.filter((c) => podTz(c.podId) === tz).length;
    const pipeline = openReqs.filter((h) => h.tz === tz).length;
    const future = activeHC + pipeline;
    const target = d.pods.filter((p) => p.tz === tz).reduce((s, p) => s + (p.hcTarget || 0), 0);
    return { tz, activeHC, pipeline, future, target, vs: future - target };
  });

  const totalActive = active.length;
  const totalPipeline = openReqs.length;
  const totalFuture = totalActive + totalPipeline;
  const totalRequired = famRows.reduce((s, r) => s + r.required, 0);
  const gapToPlan = Math.max(0, totalRequired - totalFuture);
  const worst = famRows.slice().sort((a, b) => b.gap - a.gap)[0];
  const aiText = `HC consolidation: ${totalActive} active + ${totalPipeline} in the hiring pipeline = ${totalFuture} future HC vs ${totalRequired} required. ${gapToPlan > 0 ? `A residual gap of ${gapToPlan} remains${worst && worst.gap > 0 ? `, concentrated in ${worst.t}` : ''} — open more requisitions.` : 'Future HC meets the forecast.'}`;

  tc.innerHTML = `
    <div class="row wrap mb8" style="gap:8px;align-items:center"><strong style="font-size:15px">Active & Future headcount consolidation</strong>${badge('representative · pending real PBI', 'outline')}</div>
    <div class="kpi-grid">
      ${kpiCard({ label: 'Active HC', value: totalActive, iconName: 'people' })}
      ${kpiCard({ label: 'In hiring pipeline', value: totalPipeline, iconName: 'personAdd', tone: COLORS.info })}
      ${kpiCard({ label: 'Future HC', value: totalFuture, iconName: 'trending', tone: COLORS.positive, hint: 'active + pipeline' })}
      ${kpiCard({ label: 'Gap to plan', value: gapToPlan, iconName: 'warning', tone: gapToPlan ? COLORS.negative : COLORS.positive, hint: 'vs required' })}
    </div>

    <div class="card pad mb16" style="border-left:4px solid var(--brand-primary)"><div class="row mb8">${icon('sparkle', 16)}<strong>HC consolidation insight</strong>${aiChip()}</div><div>${esc(aiText)}</div></div>

    <div class="two-col">
      <div>
        <div class="section-title">HC by Family — Active vs Future</div>
        <div class="table-wrap"><table class="grid"><thead><tr><th>Family</th><th>Active</th><th>Pipeline</th><th>Future</th><th>Required</th><th>Gap</th></tr></thead><tbody>
          ${famRows.map((r) => `<tr><td><strong>${esc(r.t)}</strong></td><td>${r.activeHC}</td><td>${r.pipeline}</td><td>${r.future}</td><td>${r.required}</td><td style="color:${r.gap > 0 ? COLORS.negative : COLORS.positive};font-weight:600">${r.gap > 0 ? '+' + r.gap : r.gap}</td></tr>`).join('')}
        </tbody></table></div>
      </div>
      <div class="card chart-card"><div class="chart-head"><strong>Future HC by Family</strong></div><div class="chart-holder" style="height:260px"><canvas id="hc-fam"></canvas></div></div>
    </div>

    <div class="section-title">HC by time zone — Active vs Future vs Target</div>
    <div class="table-wrap"><table class="grid"><thead><tr><th>Time zone</th><th>Active</th><th>Pipeline</th><th>Future</th><th>Target</th><th>vs Target</th></tr></thead><tbody>
      ${tzRows.map((r) => `<tr><td><strong>${esc(r.tz)}</strong></td><td>${r.activeHC}</td><td>${r.pipeline}</td><td>${r.future}</td><td>${r.target}</td><td style="color:${r.vs < 0 ? COLORS.negative : COLORS.positive};font-weight:600">${r.vs > 0 ? '+' + r.vs : r.vs}</td></tr>`).join('')}
    </tbody></table></div>`;

  bar(tc.querySelector('#hc-fam'), { labels: TRACKS, values: famRows.map((r) => r.future), color: COLORS.brand, label: 'Future HC' });
}

// ---- Hiring Progress ----
function renderHiring(tc) {
  clearCharts();
  const d = store.data;
  const hiring = d.hiring || [];
  const openReqs = hiring.filter((h) => h.stage !== 'Hired');
  const hired = hiring.filter((h) => h.stage === 'Hired');
  const lateStage = openReqs.filter((h) => h.stage === 'Interview' || h.stage === 'Offer').length;
  const planned90 = openReqs.filter((h) => { const dd = daysBetween('2026-07-28', h.targetStart); return dd >= 0 && dd <= 90; }).length;
  const fillRate = hiring.length ? Math.round((hired.length / hiring.length) * 100) : 0;
  const tth = hired.length ? Math.round(hired.reduce((s, h) => s + Math.max(0, daysBetween(h.opened, h.hiredDate)), 0) / hired.length) : 0;

  const STAGES = ['Sourcing', 'Screening', 'Interview', 'Offer'];
  const funnel = STAGES.map((s) => openReqs.filter((h) => h.stage === s).length);
  const months = [...new Set(openReqs.map((h) => h.targetStart.slice(0, 7)))].sort();
  const startsByMonth = months.map((m) => openReqs.filter((h) => h.targetStart.slice(0, 7) === m).length);
  const partnerName = (id) => (d.partners.find((p) => p.id === id) || {}).name || '—';
  const podName = (id) => (d.pods.find((p) => p.id === id) || {}).name || '—';
  const backfillFor = (reqId) => d.attrition.find((a) => a.backfillReqId === reqId);

  const worstStage = STAGES.map((s, i) => ({ s, n: funnel[i] })).sort((a, b) => b.n - a.n)[0];
  const aiText = `Hiring progress: ${openReqs.length} open requisitions (${lateStage} in interview/offer), ${planned90} planned to start within 90 days. Fill rate ${fillRate}% with an average ${tth}-day time-to-hire. ${worstStage && worstStage.n ? `Most reqs sit in ${worstStage.s}.` : ''}`;

  tc.innerHTML = `
    <div class="row wrap mb8" style="gap:8px;align-items:center"><strong style="font-size:15px">Hiring progress</strong>${badge('representative · pending real PBI', 'outline')}</div>
    <div class="kpi-grid">
      ${kpiCard({ label: 'Open requisitions', value: openReqs.length, iconName: 'personAdd' })}
      ${kpiCard({ label: 'Interview / Offer', value: lateStage, iconName: 'trending', tone: COLORS.info })}
      ${kpiCard({ label: 'Planned starts (90d)', value: planned90, iconName: 'clock', tone: COLORS.warning })}
      ${kpiCard({ label: 'Fill rate', value: fillRate + '%', iconName: 'check', tone: fillRate >= 40 ? COLORS.positive : COLORS.warning })}
      ${kpiCard({ label: 'Avg time-to-hire', value: tth + 'd', iconName: 'clock' })}
    </div>

    <div class="card pad mb16" style="border-left:4px solid var(--brand-primary)"><div class="row mb8">${icon('sparkle', 16)}<strong>Hiring insight</strong>${aiChip()}</div><div>${esc(aiText)}</div></div>

    <div class="two-col">
      <div class="card chart-card"><div class="chart-head"><strong>Pipeline funnel</strong></div><div class="chart-holder" style="height:240px"><canvas id="hire-funnel"></canvas></div></div>
      <div class="card chart-card"><div class="chart-head"><strong>Planned starts by month</strong></div><div class="chart-holder" style="height:240px"><canvas id="hire-month"></canvas></div></div>
    </div>

    <div class="section-title">Open requisitions (${openReqs.length})</div>
    <div class="table-wrap"><table class="grid"><thead><tr><th>Req</th><th>Family</th><th>Partner</th><th>POD · TZ</th><th>Type</th><th>Stage</th><th>Opened</th><th>Target start</th></tr></thead><tbody>
      ${openReqs.slice().sort((a, b) => a.targetStart.localeCompare(b.targetStart)).map((h) => { const atr = backfillFor(h.id); return `<tr>
        <td><strong>${esc(h.id)}</strong></td><td>${esc(h.family)}</td><td>${esc(partnerName(h.partnerId))}</td>
        <td>${esc(podName(h.podId))} · ${esc(h.tz)}</td><td>${badge(h.type, 'outline')}${atr ? badge('Attrition backfill', 'tint-warn') : ''}</td>
        <td><span class="pill" style="color:${h.stage === 'Offer' ? COLORS.positive : h.stage === 'Interview' ? COLORS.info : COLORS.neutral}"><span class="pill-label">${esc(h.stage)}</span></span></td>
        <td>${esc(h.opened)}</td><td>${esc(h.targetStart)}</td>
      </tr>`; }).join('') || '<tr><td colspan="8" class="muted" style="padding:16px">No open requisitions.</td></tr>'}
    </tbody></table></div>`;

  bar(tc.querySelector('#hire-funnel'), { labels: STAGES, values: funnel, color: '#6b69d6', label: 'Open reqs' });
  bar(tc.querySelector('#hire-month'), { labels: months, values: startsByMonth, color: COLORS.brand, label: 'Planned starts' });
}

// ---- Attrition Analysis (trailing 12 months; representative of the Head Count PBI Tracker) ----
function renderAttrition(tc) {
  clearCharts();
  const d = store.data;
  const all = d.attrition;
  const tzs = Object.keys(TZ_MAP);
  const rows = all.filter((a) =>
    (fAtrTz === 'All' || a.tz === fAtrTz) &&
    (fAtrFamily === 'All' || a.family === fAtrFamily) &&
    (fAtrType === 'All' || a.exitType === fAtrType) &&
    (fAtrResource === 'All' || a.resourceType === fAtrResource)
  ).sort((a, b) => b.exitDate.localeCompare(a.exitDate));
  const summary = attritionSummary(d);
  const activeCsas = d.csas.filter((c) => c.lifecycle === 'active').length;
  const orgRate = activeCsas ? Math.round((all.length / (activeCsas + all.length)) * 1000) / 10 : 0;

  const voluntary = rows.filter((a) => a.exitType === 'Voluntary').length;
  const voluntaryPct = rows.length ? Math.round((voluntary / rows.length) * 100) : 0;
  const regretted = rows.filter((a) => a.regretted).length;
  const avgTenure = rows.length ? Math.round(rows.reduce((s, a) => s + a.tenureMonths, 0) / rows.length) : 0;
  const backfilled = rows.filter((a) => a.backfillReqId).length;

  const podName = (id) => (d.pods.find((p) => p.id === id) || {}).name || '—';
  const reqStage = (id) => { const h = d.hiring.find((x) => x.id === id); return h ? h.stage : null; };

  const months = [];
  for (let i = 11; i >= 0; i--) { const dt = new Date('2026-07-28T00:00:00Z'); dt.setMonth(dt.getMonth() - i); months.push(dt.toISOString().slice(0, 7)); }
  const byMonth = months.map((m) => rows.filter((a) => a.exitDate.slice(0, 7) === m).length);

  const podRows = d.pods.map((p) => {
    const podEvents = rows.filter((a) => a.podId === p.id);
    return {
      pod: p, count: podEvents.length,
      voluntary: podEvents.filter((a) => a.exitType === 'Voluntary').length,
      regretted: podEvents.filter((a) => a.regretted).length,
      avgTenure: podEvents.length ? Math.round(podEvents.reduce((s, a) => s + a.tenureMonths, 0) / podEvents.length) : 0,
    };
  }).filter((r) => r.count > 0).sort((a, b) => b.count - a.count);

  const opt = (v, sel, label) => `<option value="${esc(v)}" ${v === sel ? 'selected' : ''}>${esc(label)}</option>`;

  tc.innerHTML = `
    <div class="row wrap mb8" style="gap:8px;align-items:center"><strong style="font-size:15px">Attrition Analysis</strong>${badge('FY27', 'tint-info')}${badge('representative · pending real PBI', 'outline')}</div>
    <div class="muted mb8" style="font-size:12px">Trailing 12-month exits — voluntary vs involuntary, regrettable attrition and linked backfill requisitions.</div>
    <div class="row wrap mb16" style="gap:8px;align-items:center">
      <select class="select" id="atr-tz">${opt('All', fAtrTz, 'All time zones')}${tzs.map((v) => opt(v, fAtrTz, v)).join('')}</select>
      <select class="select" id="atr-family">${opt('All', fAtrFamily, 'All families')}${TRACKS.map((v) => opt(v, fAtrFamily, v)).join('')}</select>
      <select class="select" id="atr-type">${opt('All', fAtrType, 'All exit types')}${['Voluntary', 'Involuntary'].map((v) => opt(v, fAtrType, v)).join('')}</select>
      <select class="select" id="atr-resource">${opt('All', fAtrResource, 'All resource types')}${['FTC', 'FTE'].map((v) => opt(v, fAtrResource, v)).join('')}</select>
      <button class="btn sm" id="atr-reset">Reset</button>
    </div>

    <div class="kpi-grid">
      ${kpiCard({ label: 'Org attrition rate', value: orgRate + '%', iconName: 'trending', tone: orgRate > 12 ? COLORS.negative : COLORS.positive, hint: 'trailing 12mo, all PODs' })}
      ${kpiCard({ label: 'Exits in scope', value: rows.length, iconName: 'personAdd' })}
      ${kpiCard({ label: 'Voluntary', value: voluntaryPct + '%', iconName: 'check', tone: COLORS.info })}
      ${kpiCard({ label: 'Regrettable', value: regretted, iconName: 'warning', tone: regretted ? COLORS.negative : COLORS.neutral, hint: 'high CPE/quality performers' })}
      ${kpiCard({ label: 'Avg tenure at exit', value: avgTenure + 'mo', iconName: 'clock' })}
      ${kpiCard({ label: 'Backfill in progress', value: `${backfilled}/${rows.length || 0}`, iconName: 'personAdd', tone: COLORS.warning })}
    </div>

    <div class="card pad mb16" style="border-left:4px solid var(--brand-primary)"><div class="row mb8">${icon('sparkle', 16)}<strong>Attrition insight</strong>${aiChip()}</div><div>${esc(summary.text)}</div></div>

    <div class="two-col">
      <div class="card chart-card"><div class="chart-head"><strong>Exits by month</strong></div><div class="chart-holder" style="height:240px"><canvas id="atr-month"></canvas></div></div>
      <div class="card chart-card"><div class="chart-head"><strong>Voluntary vs involuntary</strong></div><div class="chart-holder" style="height:240px"><canvas id="atr-typechart"></canvas></div></div>
    </div>

    <div class="section-title">Attrition by POD (${podRows.length})</div>
    <div class="table-wrap mb16"><table class="grid"><thead><tr><th>POD</th><th>TZ</th><th>Exits</th><th>Voluntary</th><th>Regrettable</th><th>Avg tenure</th></tr></thead><tbody>
      ${podRows.map((r) => `<tr>
        <td><strong>${esc(r.pod.name)}</strong></td>
        <td>${esc(r.pod.tz)}</td>
        <td>${r.count}</td>
        <td>${r.voluntary}</td>
        <td>${r.regretted ? `<span style="color:${COLORS.negative}">${r.regretted}</span>` : '0'}</td>
        <td>${r.avgTenure}mo</td>
      </tr>`).join('') || '<tr><td colspan="6" class="muted" style="padding:16px">No exits in scope.</td></tr>'}
    </tbody></table></div>

    <div class="section-title">Recent exits (${rows.length})</div>
    <div class="table-wrap"><table class="grid"><thead><tr><th>Name</th><th>Vendor</th><th>POD</th><th>Family</th><th>Tenure</th><th>Exit type</th><th>Reason</th><th>Date</th><th>Backfill</th></tr></thead><tbody>
      ${rows.slice(0, 40).map((a) => { const stage = reqStage(a.backfillReqId); return `<tr>
        <td><strong>${esc(a.name)}</strong>${a.regretted ? ` ${badge('Regrettable', 'tint-danger')}` : ''}</td>
        <td>${esc(a.vendor)}</td>
        <td>${esc(podName(a.podId))}</td>
        <td>${esc(a.family)}</td>
        <td>${a.tenureMonths}mo</td>
        <td>${badge(a.exitType, a.exitType === 'Voluntary' ? 'outline' : 'tint-warn')}</td>
        <td class="muted" style="font-size:12px">${esc(a.exitReason)}</td>
        <td>${esc(a.exitDate)}</td>
        <td>${stage ? badge(`${stage}`, stage === 'Hired' ? 'tint-info' : 'outline') : '<span class="muted" style="font-size:12px">None</span>'}</td>
      </tr>`; }).join('') || '<tr><td colspan="9" class="muted" style="padding:16px">No exits in scope.</td></tr>'}
    </tbody></table></div>`;

  bar(tc.querySelector('#atr-month'), { labels: months, values: byMonth, color: COLORS.negative, label: 'Exits' });
  donut(tc.querySelector('#atr-typechart'), { labels: ['Voluntary', 'Involuntary'], values: [voluntary, rows.length - voluntary], colors: [COLORS.info, COLORS.warning] });

  const rerender = () => renderAttrition(tc);
  tc.querySelector('#atr-tz').addEventListener('change', (e) => { fAtrTz = e.target.value; rerender(); });
  tc.querySelector('#atr-family').addEventListener('change', (e) => { fAtrFamily = e.target.value; rerender(); });
  tc.querySelector('#atr-type').addEventListener('change', (e) => { fAtrType = e.target.value; rerender(); });
  tc.querySelector('#atr-resource').addEventListener('change', (e) => { fAtrResource = e.target.value; rerender(); });
  tc.querySelector('#atr-reset').addEventListener('click', () => { fAtrTz = 'All'; fAtrFamily = 'All'; fAtrType = 'All'; fAtrResource = 'All'; rerender(); });
}
