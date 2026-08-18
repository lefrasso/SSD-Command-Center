// Raise a Delivery Concern — CSAM-only intake that triages into Escalations & Actions.
import { store, addEscalation } from '../store.js';
import { pageHeader, badge, aiChip, esc, statusPill, severityPill, openDrawer, COLORS } from '../components.js';
import { icon } from '../icons.js';
import { can, PERSONAS } from '../roles.js';
import { classifySeverity } from '../ai.js';

// Creative catalog of the concerns a CSAM most commonly needs to raise about a live delivery.
const SCENARIOS = [
  { id: 'timeline', label: 'Milestone slipping / delivery behind schedule', icon: 'clock', severity: 'sev3',
    template: 'The delivery is falling behind the agreed milestone plan and risks missing the committed due date. ' },
  { id: 'unresponsive', label: 'Partner CSA unresponsive or missed check-ins', icon: 'chat', severity: 'sev2',
    template: 'The assigned Partner CSA has missed scheduled Day 0–3 outreach / check-ins and is not responding to the customer or me. ' },
  { id: 'exec', label: 'Customer executive escalation — relationship at risk', icon: 'warning', severity: 'sev1',
    template: 'A customer executive has raised concerns directly with me; the relationship and trust in this engagement are at risk. ' },
  { id: 'technical', label: "Technical blocker beyond the CSA's expertise", icon: 'wrench', severity: 'sev2',
    template: "The delivery has hit a technical blocker that appears to be beyond the assigned CSA's current skill set; specialist support may be needed. " },
  { id: 'scope', label: 'Scope creep / customer requesting out-of-SOW work', icon: 'flag', severity: 'sev3',
    template: 'The customer is requesting work that falls outside the agreed scope of the Program/SOW. ' },
  { id: 'security', label: 'Security, privacy or compliance concern', icon: 'lock', severity: 'sev1',
    template: 'A security, privacy or compliance concern was raised during delivery that needs immediate review. ' },
  { id: 'quality', label: 'Customer dissatisfaction with delivery quality', icon: 'thumbDown', severity: 'sev2',
    template: 'The customer has expressed dissatisfaction with the quality or depth of the delivery so far. ' },
  { id: 'access', label: 'Access, tooling or environment blocker', icon: 'building', severity: 'sev3',
    template: 'Delivery is blocked because the CSA/customer lacks required access, tooling or environment setup. ' },
  { id: 'resourcing', label: 'Resourcing gap — need a backup or additional CSA', icon: 'personAdd', severity: 'sev2',
    template: 'Additional or backup Partner CSA support is needed to keep this delivery on track. ' },
  { id: 'other', label: 'Other delivery concern', icon: 'docSearch', severity: 'sev4',
    template: '' },
];

let selEngagement = null;
let selScenario = null;

export function renderCsamEscalation(container) {
  const d = store.data;
  const persona = PERSONAS.csam;
  const canRaise = can(store.role, 'raise:escalation');
  const myEngagements = d.engagements.filter((e) => e.csamName === persona.name && e.status !== 'complete');
  if (!selEngagement || !myEngagements.find((e) => e.id === selEngagement)) selEngagement = myEngagements[0] && myEngagements[0].id;
  const myEscalations = d.escalations.filter((e) => e.raisedBy === persona.name).sort((a, b) => b.opened.localeCompare(a.opened));

  const engOpts = myEngagements.map((e) => {
    const csa = d.csas.find((c) => c.id === e.assignedTo);
    return `<option value="${e.id}" ${e.id === selEngagement ? 'selected' : ''}>${esc(e.customer)} · ${esc(e.program)}${csa ? ' · ' + esc(csa.name) : ' · Unassigned'}</option>`;
  }).join('');

  container.innerHTML = `
    ${pageHeader({ title: 'Raise a Delivery Concern', description: 'CSAM-only intake — flag a problem with one of your deliveries and it will be triaged as an escalation with the POD Lead and SDM.', actions: badge('CSAM', 'tint-info') })}

    <div class="confidential-note mb16">${icon('warning', 16)} Visible only to the CSAM persona. Submitting here creates a tracked escalation in Escalations &amp; Actions, owned by the delivery's POD Lead.</div>

    ${!canRaise ? '<div class="muted">Your current role cannot raise a delivery concern.</div>' : !myEngagements.length ? '<div class="muted">No open deliveries are assigned to you as CSAM right now.</div>' : `
    <div class="two-col">
      <div class="card pad">
        <div class="section-title">Which delivery?</div>
        <select class="select" id="csam-eng" style="width:100%;margin-bottom:12px">${engOpts}</select>

        <div class="section-title">What's the concern?</div>
        <div class="scenario-grid mb16">
          ${SCENARIOS.map((s) => `<button class="scenario-card ${selScenario === s.id ? 'active' : ''}" data-scenario="${s.id}">${icon(s.icon, 18)}<span>${esc(s.label)}</span></button>`).join('')}
        </div>

        <label class="muted" style="font-size:12px">Describe the impact</label>
        <textarea id="csam-desc" style="width:100%;min-height:90px;border:1px solid var(--stroke-1);border-radius:4px;padding:8px;font-family:inherit;margin:6px 0 10px" placeholder="Add any specifics the delivery team should know…">${selScenario ? esc(SCENARIOS.find((s) => s.id === selScenario).template) : ''}</textarea>

        <div class="row mb8" style="gap:6px"><button class="btn sm" id="csam-classify">${icon('sparkle', 14)} Classify severity</button><span id="csam-sevout"></span></div>
        <label class="muted" style="font-size:12px">Severity</label>
        <select class="select" id="csam-sev" style="width:100%;margin-bottom:12px">
          <option value="sev1" ${selScenario && SCENARIOS.find((s) => s.id === selScenario).severity === 'sev1' ? 'selected' : ''}>Sev 1</option>
          <option value="sev2" ${selScenario && SCENARIOS.find((s) => s.id === selScenario).severity === 'sev2' ? 'selected' : ''}>Sev 2</option>
          <option value="sev3" ${!selScenario || SCENARIOS.find((s) => s.id === selScenario).severity === 'sev3' ? 'selected' : ''}>Sev 3</option>
          <option value="sev4" ${selScenario && SCENARIOS.find((s) => s.id === selScenario).severity === 'sev4' ? 'selected' : ''}>Sev 4</option>
        </select>
        <button class="btn primary" id="csam-submit">Submit escalation</button>
        <div id="csam-error"></div>
      </div>
      <div class="card pad">
        <div class="row mb8">${icon('sparkle', 16)}<strong>Why this matters</strong>${aiChip()}</div>
        <div style="font-size:13px;line-height:1.6">Raising a concern here gives the POD Lead and SDM full context — the engagement, the scenario, your description and a suggested severity — so it can be triaged with the same SLA as any other escalation.</div>
        <div class="section-title">My submitted concerns</div>
        <div class="table-wrap"><table class="grid"><thead><tr><th>Customer</th><th>Severity</th><th>Status</th><th>Opened</th><th></th></tr></thead><tbody>
          ${myEscalations.length ? myEscalations.map((s) => {
            const eng = d.engagements.find((e) => e.id === s.engagementId);
            return `<tr><td><strong>${esc(eng ? eng.customer : s.engagementId)}</strong></td><td>${severityPill(s.severity)}</td><td>${statusPill(s.status)}</td><td>${esc(s.opened)}</td><td><button class="btn sm subtle" data-view-esc="${s.id}">View</button></td></tr>`;
          }).join('') : '<tr><td colspan="5" class="muted" style="padding:16px">No concerns submitted yet.</td></tr>'}
        </tbody></table></div>
      </div>
    </div>`}`;

  const engSel = container.querySelector('#csam-eng');
  if (engSel) engSel.addEventListener('change', (e) => { selEngagement = e.target.value; renderCsamEscalation(container); });

  container.querySelectorAll('[data-scenario]').forEach((b) => b.addEventListener('click', () => { selScenario = b.getAttribute('data-scenario'); renderCsamEscalation(container); }));

  const classifyBtn = container.querySelector('#csam-classify');
  if (classifyBtn) classifyBtn.addEventListener('click', () => {
    const r = classifySeverity(container.querySelector('#csam-desc').value);
    container.querySelector('#csam-sev').value = r.severity;
    container.querySelector('#csam-sevout').innerHTML = `${aiChip()} <span style="font-size:12px">${esc(r.text)}</span>`;
  });

  const submitBtn = container.querySelector('#csam-submit');
  if (submitBtn) submitBtn.addEventListener('click', () => {
    const eng = d.engagements.find((e) => e.id === selEngagement);
    const desc = container.querySelector('#csam-desc').value.trim();
    if (!eng) { showError(container, 'Select a delivery first.'); return; }
    if (!desc) { showError(container, 'Describe the concern before submitting.'); return; }
    const csa = d.csas.find((c) => c.id === eng.assignedTo);
    const pod = csa && d.pods.find((p) => p.id === csa.podId);
    const scenarioLabel = selScenario ? SCENARIOS.find((s) => s.id === selScenario).label : 'General delivery concern';
    addEscalation({
      engagementId: eng.id,
      severity: container.querySelector('#csam-sev').value,
      summary: `[${scenarioLabel}] ${desc}`,
      ownerName: pod ? pod.leadName : 'Alex Navarro',
      sdmName: 'Priya Nair',
      raisedBy: persona.name,
      channel: 'csam',
    });
    selScenario = null;
    renderCsamEscalation(container);
  });

  container.querySelectorAll('[data-view-esc]').forEach((b) => b.addEventListener('click', () => openMyEscalation(b.getAttribute('data-view-esc'))));
}

function showError(container, message) {
  const out = container.querySelector('#csam-error');
  if (out) out.innerHTML = `<div class="muted" style="color:${COLORS.negative};font-size:12px;margin-top:6px">${esc(message)}</div>`;
}

function openMyEscalation(id) {
  const d = store.data;
  const s = d.escalations.find((e) => e.id === id);
  if (!s) return;
  const eng = d.engagements.find((e) => e.id === s.engagementId);
  const acts = d.actions.filter((a) => (s.actionIds || []).includes(a.id));
  const body = `
    <div class="row wrap mb8" style="gap:8px">${severityPill(s.severity)} ${statusPill(s.status)}</div>
    <div class="field"><span class="field-key">Customer</span><span class="field-val">${esc(eng ? eng.customer : s.engagementId)}</span></div>
    <div class="field"><span class="field-key">Owner (POD Lead)</span><span class="field-val">${esc(s.ownerName)}</span></div>
    <div class="field"><span class="field-key">SDM</span><span class="field-val">${esc(s.sdmName)}</span></div>
    <div class="field"><span class="field-key">Opened</span><span class="field-val">${esc(s.opened)}</span></div>
    <div class="field"><span class="field-key">Summary</span><span class="field-val">${esc(s.summary)}</span></div>
    <div class="section-title">Action items</div>
    ${acts.map((a) => `<div class="check-item"><span class="check-box ${a.status === 'done' ? 'done' : ''}">${a.status === 'done' ? icon('check', 12) : ''}</span><span>${esc(a.title)} <span class="muted">· ${esc(a.ownerName)} · due ${a.due}</span></span></div>`).join('') || '<div class="muted">No action items yet.</div>'}`;
  openDrawer(`Your concern · ${esc(s.id)}`, body);
}
