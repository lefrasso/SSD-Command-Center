// Capacity & Forecasting — planning, coverage, and Active & Future HC tracking + hiring progress.
// HC tracking + hiring progress are representative of the Active & Future SP HC Consolidation PBI.
import { store } from '../store.js';
import { pageHeader, kpiCard, aiChip, esc, badge, COLORS, clearCharts, bar, utilColor } from '../components.js';
import { icon } from '../icons.js';
import { TRACKS, TZ_MAP, TZ_LANGUAGES, PROGRAMS } from '../../data/generate.js';

const CAP_PER_CSA = 4;
const daysBetween = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 864e5);
let tab = 'forecast';

export function renderCapacity(container) {
  const tabs = [['forecast', 'Forecast & Coverage'], ['hc', 'HC Tracking'], ['hiring', 'Hiring Progress']];
  container.innerHTML = `
    ${pageHeader({ title: 'Capacity & Forecasting', description: 'Demand forecasting and coverage, plus Active & Future headcount consolidation and hiring progress.', actions: aiChip('Planning') })}
    <div class="tabs">${tabs.map(([k, l]) => `<div class="tab ${tab === k ? 'active' : ''}" data-tab="${k}">${l}</div>`).join('')}</div>
    <div id="tabc"></div>`;
  container.querySelectorAll('[data-tab]').forEach((el) => el.addEventListener('click', () => { tab = el.getAttribute('data-tab'); renderCapacity(container); }));
  ({ forecast: renderForecast, hc: renderHc, hiring: renderHiring })[tab](container.querySelector('#tabc'));
}

function renderForecast(tc) {
  clearCharts();
  const d = store.data;
  const active = d.csas.filter((c) => c.lifecycle === 'active');
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
      ${openReqs.slice().sort((a, b) => a.targetStart.localeCompare(b.targetStart)).map((h) => `<tr>
        <td><strong>${esc(h.id)}</strong></td><td>${esc(h.family)}</td><td>${esc(partnerName(h.partnerId))}</td>
        <td>${esc(podName(h.podId))} · ${esc(h.tz)}</td><td>${badge(h.type, 'outline')}</td>
        <td><span class="pill" style="color:${h.stage === 'Offer' ? COLORS.positive : h.stage === 'Interview' ? COLORS.info : COLORS.neutral}"><span class="pill-label">${esc(h.stage)}</span></span></td>
        <td>${esc(h.opened)}</td><td>${esc(h.targetStart)}</td>
      </tr>`).join('') || '<tr><td colspan="8" class="muted" style="padding:16px">No open requisitions.</td></tr>'}
    </tbody></table></div>`;

  bar(tc.querySelector('#hire-funnel'), { labels: STAGES, values: funnel, color: '#6b69d6', label: 'Open reqs' });
  bar(tc.querySelector('#hire-month'), { labels: months, values: startsByMonth, color: COLORS.brand, label: 'Planned starts' });
}
