// Capacity & Forecasting — planning, headcount mapping/assignment, coverage analysis.
import { store } from '../store.js';
import { pageHeader, kpiCard, aiChip, esc, COLORS, clearCharts, bar, utilColor } from '../components.js';
import { icon } from '../icons.js';
import { TRACKS, TZ_MAP } from '../../data/generate.js';

const REGION_LANG = { Iberia: 'Spanish', UKI: 'English', DACH: 'German', Nordics: 'Nordic', France: 'French', Italy: 'Italian', 'North America': 'English', LATAM: 'Spanish', India: 'English', ANZ: 'English' };
const CAP_PER_CSA = 4;

export function renderCapacity(container) {
  clearCharts();
  const d = store.data;
  const active = d.csas.filter((c) => c.lifecycle === 'active');
  const open = d.engagements.filter((e) => e.status !== 'complete');

  // Forecast / headcount mapping by track
  const rows = TRACKS.map((t) => {
    const headcount = active.filter((c) => c.tracks.includes(t)).length;
    const demand = open.filter((e) => e.track === t).length;
    const required = Math.ceil(demand / CAP_PER_CSA);
    const gap = required - headcount;
    return { t, headcount, demand, required, gap };
  });
  const totalGap = rows.reduce((s, r) => s + Math.max(0, r.gap), 0);
  const avgUtil = active.length ? Math.round(active.reduce((s, c) => s + c.utilization, 0) / active.length) : 0;

  // Coverage matrix: Track x Time Zone
  const tzs = Object.keys(TZ_MAP);
  const cover = (t, tz) => active.filter((c) => { const pod = d.pods.find((p) => p.id === c.podId); return pod && pod.tz === tz && c.tracks.includes(t); }).length;
  const langByTz = tzs.map((tz) => { const langs = [...new Set(active.filter((c) => { const pod = d.pods.find((p) => p.id === c.podId); return pod && pod.tz === tz; }).map((c) => { const pod = d.pods.find((p) => p.id === c.podId); return REGION_LANG[pod.region] || 'English'; }))]; return { tz, langs }; });
  const coverGaps = TRACKS.reduce((s, t) => s + tzs.filter((tz) => cover(t, tz) === 0).length, 0);

  const cell = (n) => { const c = n === 0 ? COLORS.negative : n === 1 ? COLORS.warning : COLORS.positive; return `<td style="text-align:center;font-weight:600;color:${c};background:color-mix(in srgb, ${c} 12%, var(--bg-1))">${n}</td>`; };
  const aiText = `Forecast: ${open.length} open engagements imply ${rows.reduce((s, r) => s + r.required, 0)} required CSAs vs ${active.length} active. ${totalGap > 0 ? `Headcount gap of ${totalGap} concentrated in ${rows.slice().sort((a, b) => b.gap - a.gap)[0].t}. ` : 'Headcount is sufficient. '}Coverage: ${coverGaps} track×time-zone cells have no CSA (target: ≥1 per program, per time zone).`;

  container.innerHTML = `
    ${pageHeader({ title: 'Capacity & Forecasting', description: 'Demand forecasting, headcount mapping & assignment, and coverage analysis — ensuring at least one CSA per program, per language and per time zone.', actions: aiChip('Planning') })}

    <div class="kpi-grid">
      ${kpiCard({ label: 'Active CSAs', value: active.length, iconName: 'people' })}
      ${kpiCard({ label: 'Avg utilization', value: avgUtil + '%', iconName: 'trending', tone: utilColor(avgUtil) })}
      ${kpiCard({ label: 'Headcount gap', value: totalGap, iconName: 'personAdd', tone: totalGap ? COLORS.negative : COLORS.positive, hint: 'to meet demand' })}
      ${kpiCard({ label: 'Coverage gaps', value: coverGaps, iconName: 'warning', tone: coverGaps ? COLORS.warning : COLORS.positive, hint: 'track × time zone' })}
    </div>

    <div class="card pad mb16" style="border-left:4px solid var(--brand-primary)"><div class="row mb8">${icon('sparkle', 16)}<strong>Forecast & planning insight</strong>${aiChip()}</div><div>${esc(aiText)}</div></div>

    <div class="two-col">
      <div>
        <div class="section-title">Headcount mapping & assignment</div>
        <div class="table-wrap"><table class="grid"><thead><tr><th>Success Program</th><th>Headcount</th><th>Demand</th><th>Required</th><th>Gap</th><th>Recommendation</th></tr></thead><tbody>
          ${rows.map((r) => `<tr>
            <td><strong>${esc(r.t)}</strong></td><td>${r.headcount}</td><td>${r.demand}</td><td>${r.required}</td>
            <td style="color:${r.gap > 0 ? COLORS.negative : COLORS.positive};font-weight:600">${r.gap > 0 ? '+' + r.gap : r.gap}</td>
            <td class="muted" style="font-size:12px">${r.gap > 0 ? `Assign / hire ${r.gap}` : 'Balanced'}</td>
          </tr>`).join('')}
        </tbody></table></div>
      </div>
      <div class="card chart-card"><div class="chart-head"><strong>Demand vs headcount</strong></div><div class="chart-holder" style="height:260px"><canvas id="cap-chart"></canvas></div></div>
    </div>

    <div class="section-title">Coverage analysis — program × time zone</div>
    <div class="table-wrap mb16"><table class="grid"><thead><tr><th>Program \\ TZ</th>${tzs.map((tz) => `<th style="text-align:center">${esc(tz)}</th>`).join('')}</tr></thead><tbody>
      ${TRACKS.map((t) => `<tr><td><strong>${esc(t)}</strong></td>${tzs.map((tz) => cell(cover(t, tz))).join('')}</tr>`).join('')}
    </tbody></table></div>
    <div class="row wrap" style="gap:12px">${langByTz.map((x) => `<span class="badge outline">${esc(x.tz)}: ${esc(x.langs.join(', '))}</span>`).join('')}</div>`;

  bar(container.querySelector('#cap-chart'), { labels: TRACKS.map((t) => t.replace(' (P&E)', '')), values: rows.map((r) => r.demand), color: COLORS.brand, label: 'Open demand' });
}
