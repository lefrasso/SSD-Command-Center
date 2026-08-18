// Performance & PIPs — confidential, role-gated (POD Lead + HR-equivalent).
import { store, draftPip, activatePip, togglePipObjective, addPipObjective, addPipCheckIn, closePip } from '../store.js';
import { pageHeader, badge, aiChip, esc, meter, scoreColor, COLORS, sentimentPill, statusPill, openDrawer, closeDrawer } from '../components.js';
import { icon } from '../icons.js';
import { can } from '../roles.js';
import { performanceSummary, suggestPipObjectives } from '../ai.js';
import { QC_CRITERIA, PROGRAMS, MS_CERTIFICATIONS, TRACKS } from '../../data/generate.js';

let selCsa = null;

const CATEGORY_LABELS = { 'technical-skills': 'Technical skills', 'soft-skills': 'Soft skills', 'language-proficiency': 'Language proficiency', 'delivery-skills': 'Delivery skills' };
const KIND_BADGE = { training: ['Training', 'tint-info'], certification: ['Certification', 'tint-warn'], 'quality-check': ['Quality check', 'outline'] };
const trainingOptions = (csa) => { const own = [...new Set(csa.tracks.flatMap((t) => PROGRAMS[t] || []))]; return own.length ? own : [...new Set(TRACKS.flatMap((t) => PROGRAMS[t] || []))]; };

export function renderPerformance(container) {
  const d = store.data;
  const csas = d.csas.filter((c) => c.lifecycle === 'active' || c.lifecycle === 'offboarding');
  if (!selCsa || !csas.find((c) => c.id === selCsa)) selCsa = csas[0] && csas[0].id;
  const c = d.csas.find((x) => x.id === selCsa);
  const canEdit = can(store.role, 'edit:pip');

  const mine = d.engagements.filter((e) => e.assignedTo === (c && c.id));
  const complete = mine.filter((e) => e.status === 'complete').length;
  const escs = d.escalations.filter((e) => mine.some((m) => m.id === e.engagementId));
  const pip = d.pips.find((p) => p.csaId === (c && c.id) && p.status !== 'closed') || d.pips.find((p) => p.csaId === (c && c.id));
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
        ${pipCardBody(pip, canEdit, c)}
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
  if (!c) return;

  const draftBtn = container.querySelector('#pip-draft');
  if (draftBtn) draftBtn.addEventListener('click', () => openDraftPip(c, container));

  const activateBtn = container.querySelector('#pip-activate');
  if (activateBtn) activateBtn.addEventListener('click', () => { activatePip(pip.id); renderPerformance(container); });

  container.querySelectorAll('[data-obj-idx]').forEach((el) => el.addEventListener('click', () => { togglePipObjective(pip.id, Number(el.getAttribute('data-obj-idx'))); renderPerformance(container); }));

  if (pip && pip.status === 'active' && canEdit) {
    wirePipObjectiveForm(container, 'pip-add', c, (objective) => {
      try { addPipObjective(pip.id, objective); renderPerformance(container); }
      catch (err) { showPipError(container, err.message); }
    });
  }

  const checkinBtn = container.querySelector('#pip-checkin-add');
  if (checkinBtn) checkinBtn.addEventListener('click', () => {
    const ta = container.querySelector('#pip-checkin-note');
    try { addPipCheckIn(pip.id, ta.value); renderPerformance(container); }
    catch (err) { showPipError(container, err.message); }
  });

  container.querySelectorAll('[data-pip-close]').forEach((el) => el.addEventListener('click', () => { closePip(pip.id, el.getAttribute('data-pip-close')); renderPerformance(container); }));
}

function pipCardBody(pip, canEdit, csa) {
  if (!pip) {
    return `<div class="muted">No active PIP. Performance is within expectations. A PIP can be opened with structured objectives, milestones and check-ins if needed.</div>
      ${canEdit ? '<button class="btn mt8" id="pip-draft">Draft PIP</button>' : ''}
      <div id="pip-error"></div>`;
  }
  const objectivesHtml = pip.objectives.map((o, i) => {
    const kindBadge = KIND_BADGE[o.kind];
    return `<button class="check-item" data-obj-idx="${i}" ${canEdit && pip.status === 'active' ? '' : 'disabled'} style="background:none;border:0;border-bottom:1px solid var(--stroke-2);width:100%;text-align:left;font:inherit;color:inherit;cursor:${canEdit && pip.status === 'active' ? 'pointer' : 'default'}">
      <span class="check-box ${o.done ? 'done' : ''}">${o.done ? icon('check', 12) : ''}</span>
      <span class="flex1">${esc(o.label)} <span class="muted" style="font-size:11px">· ${esc(CATEGORY_LABELS[o.category] || o.category)}</span></span>
      ${kindBadge ? badge(kindBadge[0], kindBadge[1]) : ''}
    </button>`;
  }).join('');

  return `
    <div class="field"><span class="field-key">Opened</span><span class="field-val">${esc(pip.opened)}</span></div>
    <div class="field"><span class="field-key">Outcome</span><span class="field-val">${esc(pip.outcome)}</span></div>
    <div class="section-title">Objectives</div>
    ${objectivesHtml}
    ${pip.status === 'draft' && canEdit ? '<button class="btn sm mt8" id="pip-activate">Activate PIP</button>' : ''}
    ${pip.status === 'active' && canEdit ? pipObjectiveFormHtml('pip-add', csa, 'Add objective, training or certification') : ''}
    <div class="section-title">Check-ins</div>
    ${pip.checkIns.map((ci) => `<div class="tl-item"><div class="tl-date">${esc(ci.date)}</div><div>${esc(ci.note)}</div></div>`).join('') || '<div class="muted" style="font-size:12px">No check-ins yet.</div>'}
    ${pip.status === 'active' && canEdit ? `
      <textarea id="pip-checkin-note" style="width:100%;min-height:60px;border:1px solid var(--stroke-1);border-radius:4px;padding:8px;font-family:inherit;margin:8px 0" placeholder="Log a coaching conversation or check-in…"></textarea>
      <div class="row" style="gap:6px"><button class="btn sm" id="pip-checkin-add">Add check-in</button></div>
      <div class="section-title">Close PIP</div>
      <div class="row" style="gap:6px">
        <button class="btn sm" data-pip-close="met">Close · objectives met</button>
        <button class="btn sm subtle" data-pip-close="not-met">Close · not met</button>
      </div>` : ''}
    ${pip.status === 'closed' && canEdit ? '<button class="btn sm mt8" id="pip-draft">Draft new PIP</button>' : ''}
    <div id="pip-error"></div>`;
}

function showPipError(container, message) {
  const out = container.querySelector('#pip-error');
  if (out) out.innerHTML = `<div class="muted" style="color:${COLORS.negative};font-size:12px;margin-top:6px">${esc(message)}</div>`;
}

// Compact form to describe one improvement objective — a custom goal, a training, a certification or a quality-check focus area.
function pipObjectiveFormHtml(idPrefix, csa, title) {
  return `
    <div class="section-title">${esc(title)}</div>
    <select class="select" id="${idPrefix}-kind" style="width:100%;margin-bottom:8px">
      <option value="objective">Custom objective</option>
      <option value="quality-check">Quality check focus area</option>
      <option value="training">Assign training</option>
      <option value="certification">Assign Microsoft certification</option>
    </select>
    <div id="${idPrefix}-field-objective">
      <select class="select" id="${idPrefix}-category" style="width:100%;margin-bottom:8px">
        <option value="technical-skills">Technical skills</option>
        <option value="soft-skills">Soft skills</option>
        <option value="language-proficiency">Language proficiency</option>
        <option value="delivery-skills" selected>Delivery skills</option>
      </select>
      <input class="input" id="${idPrefix}-text" style="width:100%;margin-bottom:8px" placeholder="Describe the objective…"/>
    </div>
    <div id="${idPrefix}-field-quality-check" style="display:none">
      <select class="select" id="${idPrefix}-qc" style="width:100%;margin-bottom:8px">${QC_CRITERIA.map((c) => `<option value="${esc(c)}">${esc(c)}</option>`).join('')}</select>
    </div>
    <div id="${idPrefix}-field-training" style="display:none">
      <select class="select" id="${idPrefix}-training" style="width:100%;margin-bottom:8px">${trainingOptions(csa).map((p) => `<option value="${esc(p)}">${esc(p)}</option>`).join('')}</select>
    </div>
    <div id="${idPrefix}-field-certification" style="display:none">
      <select class="select" id="${idPrefix}-cert" style="width:100%;margin-bottom:8px">${MS_CERTIFICATIONS.map((c) => `<option value="${esc(c)}">${esc(c)}</option>`).join('')}</select>
    </div>
    <button class="btn sm" id="${idPrefix}-add">Add</button>`;
}

const PIP_OBJECTIVE_KINDS = ['objective', 'quality-check', 'training', 'certification'];
function wirePipObjectiveForm(root, idPrefix, csa, onAdd) {
  const kindSel = root.querySelector(`#${idPrefix}-kind`);
  if (!kindSel) return;
  const show = (k) => PIP_OBJECTIVE_KINDS.forEach((f) => { const el = root.querySelector(`#${idPrefix}-field-${f}`); if (el) el.style.display = f === k ? 'block' : 'none'; });
  show(kindSel.value);
  kindSel.addEventListener('change', () => show(kindSel.value));
  root.querySelector(`#${idPrefix}-add`).addEventListener('click', () => {
    const kind = kindSel.value;
    if (kind === 'quality-check') {
      onAdd({ label: `Quality check focus: ${root.querySelector(`#${idPrefix}-qc`).value}`, category: 'delivery-skills', kind: 'quality-check' });
    } else if (kind === 'training') {
      onAdd({ label: `Complete ${root.querySelector(`#${idPrefix}-training`).value} training and accreditation.`, category: 'technical-skills', kind: 'training' });
    } else if (kind === 'certification') {
      onAdd({ label: root.querySelector(`#${idPrefix}-cert`).value, category: 'technical-skills', kind: 'certification' });
    } else {
      const textEl = root.querySelector(`#${idPrefix}-text`);
      const label = textEl.value.trim();
      if (!label) return;
      onAdd({ label, category: root.querySelector(`#${idPrefix}-category`).value, kind: 'objective' });
      textEl.value = '';
    }
  });
}

function openDraftPip(csa, container) {
  const suggestion = suggestPipObjectives(csa, store.data);
  const staged = [];

  const stagedHtml = () => staged.map((o, i) => {
    const kindBadge = KIND_BADGE[o.kind];
    return `<div class="check-item"><span class="flex1">${esc(o.label)} <span class="muted" style="font-size:11px">· ${esc(CATEGORY_LABELS[o.category] || o.category)}</span></span>${kindBadge ? badge(kindBadge[0], kindBadge[1]) : ''}<button class="btn sm subtle icon-only" data-staged-remove="${i}" aria-label="Remove">${icon('x', 14)}</button></div>`;
  }).join('') || '<div class="muted" style="font-size:12px">None added yet.</div>';

  const body = `
    <div class="row mb8">${icon('sparkle', 16)}<strong>Suggested objectives</strong>${aiChip()}</div>
    <div class="muted mb8" style="font-size:12px">${esc(suggestion.text)}</div>
    ${suggestion.objectives.map((o, i) => {
      const kindBadge = KIND_BADGE[o.kind];
      return `<label class="check-item" style="display:flex;align-items:flex-start;gap:8px"><input type="checkbox" id="sugg-${i}" checked style="margin-top:4px"><span class="flex1">${esc(o.label)} <span class="muted" style="font-size:11px">· ${esc(CATEGORY_LABELS[o.category] || o.category)}</span></span>${kindBadge ? badge(kindBadge[0], kindBadge[1]) : ''}</label>`;
    }).join('')}
    ${pipObjectiveFormHtml('pip-stage', csa, 'Add a quality check, training, certification or custom objective')}
    <div class="section-title">Added to this plan</div>
    <div id="pip-staged-list">${stagedHtml()}</div>
    <button class="btn primary mt8" id="pip-create">Draft PIP</button>
    <div id="pip-drawer-error"></div>`;

  openDrawer(`Draft PIP · ${esc(csa.name)}`, body, (dr) => {
    const wireRemove = () => dr.querySelectorAll('[data-staged-remove]').forEach((b) => b.addEventListener('click', () => { staged.splice(Number(b.getAttribute('data-staged-remove')), 1); dr.querySelector('#pip-staged-list').innerHTML = stagedHtml(); wireRemove(); }));
    wireRemove();
    wirePipObjectiveForm(dr, 'pip-stage', csa, (objective) => { staged.push(objective); dr.querySelector('#pip-staged-list').innerHTML = stagedHtml(); wireRemove(); });
    dr.querySelector('#pip-create').addEventListener('click', () => {
      const checked = suggestion.objectives.filter((_, i) => dr.querySelector(`#sugg-${i}`).checked);
      try { draftPip(csa.id, [...checked, ...staged]); closeDrawer(); renderPerformance(container); }
      catch (err) { dr.querySelector('#pip-drawer-error').innerHTML = `<div class="muted" style="color:${COLORS.negative};font-size:12px;margin-top:6px">${esc(err.message)}</div>`; }
    });
  });
}
