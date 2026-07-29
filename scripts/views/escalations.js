// Escalations & Actions — triage board, SLA timers, actions, AI triage.
import { store, setEscalationStatus, setActionStatus, addEscalation, hoursSince } from '../store.js';
import { pageHeader, badge, severityPill, statusPill, aiChip, esc, kanban, openDrawer, closeDrawer, COLORS } from '../components.js';
import { icon } from '../icons.js';
import { similarCases, extractActions, draftResolution, classifySeverity } from '../ai.js';

const COLS = [['new', 'New'], ['investigating', 'Investigating'], ['mitigating', 'Mitigating'], ['resolved', 'Resolved']];
const NEXT = ['investigating', 'mitigating', 'resolved'];

export function renderEscalations(container) {
  const d = store.data;
  const columns = COLS.map(([status, title]) => {
    const items = d.escalations.filter((e) => e.status === status);
    return {
      title, count: items.length,
      cards: items.map((e) => {
        const eng = d.engagements.find((x) => x.id === e.engagementId);
        const hrs = hoursSince(e.opened); const breach = e.status !== 'resolved' && hrs > e.slaHours;
        return `<div class="kan-card" data-id="${e.id}">
          <div class="row" style="justify-content:space-between">${severityPill(e.severity)}${breach ? badge('SLA breached', 'tint-danger') : (e.status !== 'resolved' ? badge(`${Math.max(0, Math.round(e.slaHours - hrs))}h left`, 'outline') : '')}</div>
          <div class="kc-title mt8">${esc(eng ? eng.customer : e.engagementId)}</div>
          <div class="kc-meta">${esc(e.summary)}</div>
          <div class="kc-foot"><span class="muted" style="font-size:11px">${esc(e.adoRef)} · ${esc(e.ownerName)}</span></div>
        </div>`;
      }),
    };
  });

  container.innerHTML = `
    ${pageHeader({ title: 'Escalations & Actions', description: 'Escalation management for all delivery concerns — intake to triage to resolution, with SDM co-ownership and SLA timers.', actions: `<button class="btn primary" id="new-esc">${icon('warning', 16)} New escalation</button>` })}
    ${kanban(columns)}`;

  container.querySelectorAll('.kan-card').forEach((el) => el.addEventListener('click', () => openEsc(el.getAttribute('data-id'))));
  container.querySelector('#new-esc').addEventListener('click', openIntake);
}

function openEsc(id) {
  const d = store.data;
  const e = d.escalations.find((x) => x.id === id); if (!e) return;
  const eng = d.engagements.find((x) => x.id === e.engagementId);
  const acts = d.actions.filter((a) => e.actionIds.includes(a.id));
  const hrs = hoursSince(e.opened); const breach = e.status !== 'resolved' && hrs > e.slaHours;

  const body = `
    <div class="row wrap mb8" style="gap:8px">${severityPill(e.severity)} ${statusPill(e.status)} ${breach ? badge('SLA breached', 'tint-danger') : badge(`SLA ${e.slaHours}h`, 'outline')}</div>
    <div class="field"><span class="field-key">Customer</span><span class="field-val">${esc(eng ? eng.customer : e.engagementId)}</span></div>
    <div class="field"><span class="field-key">Summary</span><span class="field-val">${esc(e.summary)}</span></div>
    <div class="field"><span class="field-key">Owner (POD Lead)</span><span class="field-val">${esc(e.ownerName)}</span></div>
    <div class="field"><span class="field-key">SDM</span><span class="field-val">${esc(e.sdmName)}</span></div>
    <div class="field"><span class="field-key">ADO</span><span class="field-val">${esc(e.adoRef)}</span></div>
    <div class="field"><span class="field-key">Opened</span><span class="field-val">${esc(e.opened)} (${Math.round(hrs)}h ago)</span></div>

    <div class="section-title">Triage</div>
    <div class="row wrap" style="gap:6px">${NEXT.map((s) => `<button class="btn sm ${e.status === s ? 'primary' : ''}" data-status="${s}">${s}</button>`).join('')}</div>

    <div class="section-title">Action items</div>
    ${acts.map((a) => `<div class="check-item"><button class="btn sm subtle" data-act="${a.id}" data-done="${a.status === 'done'}"><span class="check-box ${a.status === 'done' ? 'done' : ''}">${a.status === 'done' ? icon('check', 12) : ''}</span></button><span class="flex1">${esc(a.title)} <span class="muted">· ${esc(a.ownerName)} · due ${a.due}</span></span>${statusPill(a.status)}</div>`).join('') || '<div class="muted">No action items.</div>'}

    <div class="section-title">AI triage</div>
    <div class="row wrap mb8" style="gap:6px">
      <button class="btn sm" id="similar">${icon('sparkle', 14)} Similar cases</button>
      <button class="btn sm" id="extract">${icon('sparkle', 14)} Extract actions</button>
      <button class="btn sm" id="resolve">${icon('sparkle', 14)} Draft resolution</button>
    </div>
    <div id="ai-out"></div>`;

  openDrawer(`Escalation · ${esc(e.id)}`, body, (dr) => {
    dr.querySelectorAll('[data-status]').forEach((b) => b.addEventListener('click', () => { setEscalationStatus(e.id, b.getAttribute('data-status')); openEsc(e.id); }));
    dr.querySelectorAll('[data-act]').forEach((b) => b.addEventListener('click', () => { const done = b.getAttribute('data-done') === 'true'; setActionStatus(b.getAttribute('data-act'), done ? 'open' : 'done'); openEsc(e.id); }));
    const out = dr.querySelector('#ai-out');
    const show = (r, extra = '') => { out.innerHTML = `<div class="card pad" style="background:var(--bg-2)"><div class="row mb8">${aiChip()}</div><div>${esc(r.text)}</div>${extra}</div>`; };
    dr.querySelector('#similar').addEventListener('click', () => show(similarCases(e.id, d)));
    dr.querySelector('#resolve').addEventListener('click', () => show(draftResolution(e.id, d)));
    dr.querySelector('#extract').addEventListener('click', () => { const list = extractActions(e.summary); out.innerHTML = `<div class="card pad" style="background:var(--bg-2)"><div class="row mb8">${aiChip()}<span class="muted" style="font-size:12px">Suggested action items</span></div>${list.map((t) => `<div class="check-item"><span class="check-box"></span><span>${esc(t)}</span></div>`).join('')}</div>`; });
  });
}

function openIntake() {
  const d = store.data;
  const engs = d.engagements.filter((e) => e.status !== 'complete');
  const body = `
    <div class="section-title">Log a new escalation</div>
    <label class="muted" style="font-size:12px">Engagement</label>
    <select class="select" id="i-eng" style="width:100%;margin-bottom:10px">${engs.map((e) => `<option value="${e.id}">${esc(e.customer)} · ${esc(e.program)}</option>`).join('')}</select>
    <label class="muted" style="font-size:12px">What's happening?</label>
    <textarea id="i-notes" style="width:100%;min-height:90px;border:1px solid var(--stroke-1);border-radius:4px;padding:8px;font-family:inherit;margin-bottom:10px" placeholder="Describe the concern (e.g. access blocker, milestone at risk, security finding)…"></textarea>
    <div class="row mb8" style="gap:6px"><button class="btn sm" id="i-classify">${icon('sparkle', 14)} Classify severity</button><span id="i-sevout"></span></div>
    <label class="muted" style="font-size:12px">Severity</label>
    <select class="select" id="i-sev" style="width:100%;margin-bottom:12px"><option value="sev1">Sev 1</option><option value="sev2">Sev 2</option><option value="sev3" selected>Sev 3</option><option value="sev4">Sev 4</option></select>
    <button class="btn primary" id="i-create">Create escalation</button>`;

  openDrawer('New escalation', body, (dr) => {
    dr.querySelector('#i-classify').addEventListener('click', () => {
      const r = classifySeverity(dr.querySelector('#i-notes').value);
      dr.querySelector('#i-sev').value = r.severity;
      dr.querySelector('#i-sevout').innerHTML = `${aiChip()} <span style="font-size:12px">${esc(r.text)}</span>`;
    });
    dr.querySelector('#i-create').addEventListener('click', () => {
      const engId = dr.querySelector('#i-eng').value;
      const eng = d.engagements.find((e) => e.id === engId);
      const csa = eng && d.csas.find((c) => c.id === eng.assignedTo);
      const pod = csa && d.pods.find((p) => p.id === csa.podId);
      addEscalation({ engagementId: engId, severity: dr.querySelector('#i-sev').value, summary: dr.querySelector('#i-notes').value || 'New delivery concern', ownerName: pod ? pod.leadName : 'Leandro Frasso', sdmName: 'Priya Nair' });
      closeDrawer();
    });
  });
}
