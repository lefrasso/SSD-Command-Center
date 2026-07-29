// Capacity & Forecasting — planning, headcount mapping/assignment, coverage analysis.
import { store } from '../store.js';
import { pageHeader, kpiCard, aiChip, esc, COLORS, clearCharts, bar, utilColor } from '../components.js';
import { icon } from '../icons.js';
import { TRACKS, TZ_MAP, TZ_LANGUAGES, PROGRAMS } from '../../data/generate.js';

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

  // Coverage: at least one accredited CSA who speaks a language of the TZ (no territory restriction).
  const tzs = Object.keys(TZ_MAP);
  const programs = TRACKS.flatMap((t) => (PROGRAMS[t] || []).map((p) => ({ family: t, program: p })));
  const speaksTz = (c, tz) => (c.languages || []).some((l) => (TZ_LANGUAGES[tz] || []).includes(l));
  const cover = (program, tz) => active.filter((c) => (c.accreditations || []).includes(program) && speaksTz(c, tz)).length;
  const coverGaps = programs.reduce((s, { program }) => s + tzs.filter((tz) => cover(program, tz) === 0).length, 0);
  const langCover = (lang) => active.filter((c) => (c.languages || []).includes(lang)).length;

  const cell = (n) => { const c = n === 0 ? COLORS.negative : n === 1 ? COLORS.warning : COLORS.positive; return `<td style="text-align:center;font-weight:600;color:${c};background:color-mix(in srgb, ${c} 12%, var(--bg-1))">${n}</td>`; };
  const worst = rows.slice().sort((a, b) => b.gap - a.gap)[0];
  const aiText = `Forecast: ${open.length} open engagements imply ${rows.reduce((s, r) => s + r.required, 0)} required CSAs vs ${active.length} active. ${totalGap > 0 ? `Headcount gap of ${totalGap} concentrated in ${worst.t}. ` : 'Headcount is sufficient. '}Coverage: ${coverGaps} Program×time-zone cells have no accredited, language-capable CSA (target: ≥1 per Program, per language, per time zone).`;

  container.innerHTML = `
    ${pageHeader({ title: 'Capacity & Forecasting', description: 'Demand forecasting, headcount mapping & assignment, and coverage analysis — ≥1 CSA per Program, per language and per time zone. A CSA can deliver in any territory.', actions: aiChip('Planning') })}

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

  bar(container.querySelector('#cap-chart'), { labels: TRACKS, values: rows.map((r) => r.demand), color: COLORS.brand, label: 'Open demand' });
}
