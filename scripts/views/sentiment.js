// Sentiment — cross-channel analysis with theme clustering + early warnings.
import { store, sentimentBreakdown } from '../store.js';
import { pageHeader, kpiCard, aiChip, esc, badge, sentimentPill, COLORS, clearCharts, donut, bar, line } from '../components.js';
import { icon } from '../icons.js';
import { earlyWarnings } from '../ai.js';
import { TRACKS } from '../../data/generate.js';

const PERIODS = ['2026-04', '2026-05', '2026-06', '2026-07'];

export function renderSentiment(container) {
  const d = store.data;
  const bd = sentimentBreakdown(d);
  const total = bd.positive + bd.neutral + bd.negative || 1;
  const net = Math.round(((bd.positive - bd.negative) / total) * 100);

  const partnerRolls = d.sentiment.filter((s) => s.scopeType === 'partner');
  const byPartner = d.partners.map((p) => { const r = partnerRolls.find((s) => s.scope === p.name && s.period === '2026-07'); return r ? r.net : 0; });
  const trend = PERIODS.map((per) => { const rs = partnerRolls.filter((s) => s.period === per); return rs.length ? Math.round(rs.reduce((a, s) => a + s.net, 0) / rs.length) : 0; });
  const byTrack = TRACKS.map((t) => { const r = d.sentiment.find((s) => s.scopeType === 'track' && s.scope === t); return r ? r.net : 0; });

  const themeCount = {};
  d.sentiment.forEach((s) => s.themes.forEach((t) => (themeCount[t] = (themeCount[t] || 0) + 1)));
  const themes = Object.entries(themeCount).sort((a, b) => b[1] - a[1]).slice(0, 8);

  const warn = earlyWarnings(d);
  const negCpe = d.cpe.filter((c) => c.sentiment === 'negative').slice(0, 6);

  container.innerHTML = `
    ${pageHeader({ title: 'Sentiment', description: 'Cross-channel sentiment over messages, CPE verbatims and escalation notes — correlated with CPE and escalations for actionable early warnings.', actions: aiChip('NLP') })}

    <div class="kpi-grid">
      ${kpiCard({ label: 'Net sentiment', value: net > 0 ? '+' + net : net, iconName: 'emoji', tone: net >= 0 ? COLORS.positive : COLORS.negative })}
      ${kpiCard({ label: 'Positive signals', value: bd.positive, iconName: 'emoji', tone: COLORS.positive })}
      ${kpiCard({ label: 'Negative signals', value: bd.negative, iconName: 'warning', tone: COLORS.negative })}
    </div>

    <div class="card pad mb16" style="border-left:4px solid ${COLORS.warning}">
      <div class="row mb8">${icon('sparkle', 16)}<strong>Early-warning</strong>${aiChip()}</div>
      <div>${esc(warn.text)}</div>
    </div>

    <div class="two-col">
      <div class="card chart-card"><div class="chart-head"><strong>Sentiment mix</strong></div><div class="chart-holder" style="height:220px"><canvas id="c-mix"></canvas></div></div>
      <div class="card chart-card"><div class="chart-head"><strong>Net sentiment trend</strong></div><div class="chart-holder" style="height:220px"><canvas id="c-trend"></canvas></div></div>
    </div>

    <div class="two-col">
      <div class="card chart-card"><div class="chart-head"><strong>Net by partner</strong></div><div class="chart-holder" style="height:220px"><canvas id="c-partner"></canvas></div></div>
      <div class="card chart-card"><div class="chart-head"><strong>Net by track</strong></div><div class="chart-holder" style="height:220px"><canvas id="c-track"></canvas></div></div>
    </div>

    <div class="two-col">
      <div class="card pad">
        <strong>Theme clusters</strong>
        <div class="row wrap mt8" style="gap:6px">${themes.map(([t, n]) => `<span class="badge outline">${esc(t)} · ${n}</span>`).join('')}</div>
      </div>
      <div class="card pad">
        <strong>Negative signals to review</strong>
        <div class="mt8">${negCpe.map((c) => { const e = d.engagements.find((x) => x.id === c.engagementId); return `<div style="padding:6px 0;border-bottom:1px solid var(--stroke-2)"><div class="row" style="justify-content:space-between"><span style="font-size:13px">${esc(e ? e.customer : c.engagementId)} · ${esc(c.track)}</span>${sentimentPill('negative')}</div><div class="muted" style="font-size:12px">“${esc(c.verbatim)}”</div></div>`; }).join('') || '<div class="muted">None</div>'}</div>
      </div>
    </div>`;

  clearCharts();
  donut(container.querySelector('#c-mix'), { labels: ['Positive', 'Neutral', 'Negative'], values: [bd.positive, bd.neutral, bd.negative], colors: [COLORS.positive, COLORS.neutral, COLORS.negative] });
  line(container.querySelector('#c-trend'), { labels: PERIODS, datasets: [{ label: 'Avg net', values: trend, color: COLORS.brand }] });
  bar(container.querySelector('#c-partner'), { labels: d.partners.map((p) => p.name), values: byPartner, color: '#6b69d6', label: 'Net' });
  bar(container.querySelector('#c-track'), { labels: TRACKS.map((t) => t.replace(' (P&E)', '')), values: byTrack, color: '#2aa0a4', label: 'Net' });
}
