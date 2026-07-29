// Performance & PIPs — confidential, role-gated (POD Lead + HR-equivalent).
import { store } from '../store.js';
import { pageHeader, badge, aiChip, esc, meter, scoreColor, COLORS, sentimentPill, statusPill } from '../components.js';
import { icon } from '../icons.js';
import { performanceSummary } from '../ai.js';

let selCsa = null;

export function renderPerformance(container) {
  const d = store.data;
  const csas = d.csas.filter((c) => c.lifecycle === 'active' || c.lifecycle === 'offboarding');
  if (!selCsa || !csas.find((c) => c.id === selCsa)) selCsa = csas[0] && csas[0].id;
  const c = d.csas.find((x) => x.id === selCsa);

  const mine = d.engagements.filter((e) => e.assignedTo === (c && c.id));
  const complete = mine.filter((e) => e.status === 'complete').length;
  const escs = d.escalations.filter((e) => mine.some((m) => m.id === e.engagementId));
  const pip = d.pips.find((p) => p.csaId === (c && c.id));
  const summary = c ? performanceSummary(c, d) : null;

  const csaOpts = csas.map((x) => `<option value="${x.id}" ${x.id === selCsa ? 'selected' : ''}>${esc(x.name)} · ${esc(x.vendor)}</option>`).join('');

  const scoreItem = (label, val, color, sub) => `<div class="score-item"><div class="muted" style="font-size:12px">${label}</div><div class="score-val" style="color:${color || 'inherit'}">${val}</div>${sub ? `<div class="muted" style="font-size:12px">${sub}</div>` : ''}</div>`;

  container.innerHTML = `
    ${pageHeader({ title: 'Performance & PIPs', description: 'Composite performance view and structured improvement plans.', actions: badge('Confidential', 'tint-danger') })}

    <div class="confidential-note mb16">${icon('lock', 16)} Confidential — restricted to POD Lead and HR-equivalent roles. AI outputs are <strong>advisory inputs</strong> to a manager’s judgement, never automated decisions about a person.</div>

    <div class="row mb16" style="gap:8px"><strong>Partner CSA</strong><select class="select" id="sel-csa">${csaOpts}</select></div>

    ${c ? `
    <div class="row wrap mb16" style="gap:8px">${sentimentPill(c.sentiment)} ${badge(c.vendor, 'outline')} ${badge(c.tracks.join(', '), 'outline')}</div>

    <div class="section-title">Composite scorecard</div>
    <div class="score-grid mb16">
      ${scoreItem('Delivery', `${complete}/${mine.length}`, COLORS.brand, 'completed / assigned')}
      ${scoreItem('CPE', c.cpe.toFixed(1), scoreColor(c.cpe), 'rolling')}
      ${scoreItem('Quality', c.quality.toFixed(1), scoreColor(c.quality), 'vs practices')}
      ${scoreItem('Escalations', String(escs.length), escs.length > 2 ? COLORS.negative : COLORS.neutral, 'linked')}
      ${scoreItem('Utilization', c.utilization + '%', COLORS.neutral, 'of capacity')}
    </div>

    <div class="two-col">
      <div class="card pad">
        <div class="row mb8" style="justify-content:space-between"><strong>Improvement plan (PIP)</strong>${pip ? statusPill(pip.status) : badge('None', 'outline')}</div>
        ${pip ? `
          <div class="field"><span class="field-key">Opened</span><span class="field-val">${esc(pip.opened)}</span></div>
          <div class="field"><span class="field-key">Outcome</span><span class="field-val">${esc(pip.outcome)}</span></div>
          <div class="section-title">Objectives</div>
          ${pip.objectives.map((o) => `<div class="check-item"><span class="check-box"></span><span>${esc(o)}</span></div>`).join('')}
          <div class="section-title">Check-ins</div>
          ${pip.checkIns.map((ci) => `<div class="tl-item"><div class="tl-date">${esc(ci.date)}</div><div>${esc(ci.note)}</div></div>`).join('')}
        ` : `<div class="muted">No active PIP. Performance is within expectations. A PIP can be opened with structured objectives, milestones and check-ins if needed.</div>
          <button class="btn mt8">Draft PIP</button>`}
      </div>
      <div class="card pad">
        <div class="row mb8">${icon('sparkle', 16)}<strong>AI performance summary</strong>${aiChip()}</div>
        <div style="font-size:13px;line-height:1.6">${esc(summary.text)}</div>
        <div class="muted mt8" style="font-size:12px">Evidence: ${summary.sources.map((s) => esc(s.label)).join(', ') || '—'}</div>
        <div class="section-title">Coaching log</div>
        ${(pip ? pip.checkIns : [{ date: '2026-07-10', note: 'Reviewed CPE trend; agreed focus on outreach cadence.' }, { date: '2026-06-20', note: 'Positive delivery feedback from CSAM.' }]).map((ci) => `<div class="tl-item"><div class="tl-date">${esc(ci.date)}</div><div>${esc(ci.note)}</div></div>`).join('')}
      </div>
    </div>` : '<div class="muted">No Partner CSA selected.</div>'}`;

  const sel = container.querySelector('#sel-csa');
  if (sel) sel.addEventListener('change', (e) => { selCsa = e.target.value; renderPerformance(container); });
}
