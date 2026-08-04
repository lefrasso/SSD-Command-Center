// Shared action-item UI — assign drawer, row rendering and toggle wiring.
// Reused by the Messages Console (assign per thread/message) and the Delivery
// Cockpit (check/mark done). Actions unify escalation and message follow-ups.
import { store, addAction, setActionStatus, todayISO, daysFromNowISO } from './store.js';
import { PERSONAS } from './roles.js';
import { openDrawer, closeDrawer, statusPill, badge, esc } from './components.js';
import { icon } from './icons.js';
import { extractActions } from './ai.js';

// Candidate owners for an action: the current user, plus the engagement's CSA and POD Lead.
export function actionOwners(eng) {
  const d = store.data;
  const names = new Set([PERSONAS[store.role].name]);
  if (eng) {
    const csa = d.csas.find((c) => c.id === eng.assignedTo);
    if (csa) { names.add(csa.name); const pod = d.pods.find((p) => p.id === csa.podId); if (pod && pod.leadName) names.add(pod.leadName); }
  }
  return [...names];
}

function sourceMeta(a) {
  if (a.escalationId) return ['Escalation', 'tint-warn'];
  if (a.threadId) return ['Message', 'tint-info'];
  return ['Action', 'outline'];
}

// One action row with a done toggle. `data-act` carries the id; wire with wireActionToggles.
// withOpen adds a deep-link button (`data-open`) to the source thread/escalation.
export function actionItemHtml(a, { showSource = false, withOpen = false } = {}) {
  const done = a.status === 'done';
  const overdue = !done && a.due && a.due < todayISO();
  const [src, variant] = sourceMeta(a);
  const openTarget = a.threadId ? `thread:${a.threadId}` : a.escalationId ? 'esc' : '';
  return `<div class="check-item${done ? ' act-done' : ''}">
    <button class="btn sm subtle" data-act="${esc(a.id)}" data-done="${done}" aria-label="Toggle done">
      <span class="check-box ${done ? 'done' : ''}">${done ? icon('check', 12) : ''}</span>
    </button>
    <span class="flex1">${esc(a.title)} <span class="muted">· ${esc(a.ownerName)} · due <span class="${overdue ? 'due-over' : ''}">${esc(a.due)}</span></span></span>
    ${showSource ? badge(src, variant) : ''}
    ${statusPill(a.status)}
    ${withOpen && openTarget ? `<button class="btn subtle sm" data-open="${esc(openTarget)}" aria-label="Open source">${icon('chevronRight', 14)}</button>` : ''}
  </div>`;
}

// Attach done/undone toggles to any container holding [data-act] buttons.
export function wireActionToggles(root, after) {
  root.querySelectorAll('[data-act]').forEach((b) => b.addEventListener('click', () => {
    const done = b.getAttribute('data-done') === 'true';
    setActionStatus(b.getAttribute('data-act'), done ? 'open' : 'done');
    if (after) after();
  }));
}

const threadForEngagement = (engId) => { const m = store.data.messages.find((x) => x.engagementId === engId); return m ? m.threadId : null; };

// Open the "Assign action" drawer. Pass an engagement/thread to lock context
// (Messages), or omit to let the user pick an engagement (Home). prefillTitle
// seeds the description (e.g. from a specific message).
export function openAssignActionDrawer({ engagementId = null, threadId = null, prefillTitle = '', onCreated } = {}) {
  const d = store.data;
  const engs = d.engagements.filter((e) => e.status !== 'complete');
  const lockedEng = engagementId ? d.engagements.find((e) => e.id === engagementId) : null;
  const ownerOpts = (eng) => actionOwners(eng).map((n) => `<option value="${esc(n)}">${esc(n)}</option>`).join('');
  const fieldStyle = 'width:100%;border:1px solid var(--stroke-1);border-radius:4px;padding:8px;font-family:inherit;margin-bottom:10px';

  const body = `
    <div class="section-title">Assign an action</div>
    ${lockedEng
      ? `<div class="field"><span class="field-key">Engagement</span><span class="field-val">${esc(lockedEng.customer)} · ${esc(lockedEng.program)}</span></div>`
      : `<label class="muted" style="font-size:12px">Engagement / thread</label>
         <select class="select" id="a-eng" style="${fieldStyle}">${engs.map((e) => `<option value="${e.id}">${esc(e.customer)} · ${esc(e.program)}</option>`).join('')}</select>`}
    <div class="row mb8" style="gap:6px;justify-content:space-between;align-items:center">
      <label class="muted" style="font-size:12px">What needs to be done?</label>
      <button class="btn sm" id="a-suggest">${icon('sparkle', 14)} Suggest from thread</button>
    </div>
    <textarea id="a-title" style="${fieldStyle};min-height:70px" placeholder="Describe the action (e.g. schedule stakeholder sync, chase the pending report)…">${esc(prefillTitle)}</textarea>
    <label class="muted" style="font-size:12px">Owner</label>
    <select class="select" id="a-owner" style="${fieldStyle}">${ownerOpts(lockedEng)}</select>
    <label class="muted" style="font-size:12px">Due date</label>
    <input type="date" id="a-due" value="${daysFromNowISO(7)}" min="${todayISO()}" style="${fieldStyle}"/>
    <label class="muted" style="font-size:12px">Status</label>
    <select class="select" id="a-status" style="${fieldStyle};margin-bottom:14px"><option value="open">Open</option><option value="in-progress">In progress</option></select>
    <button class="btn primary" id="a-create">${icon('check', 16)} Assign action</button>`;

  openDrawer('Assign action', body, (dr) => {
    const engSel = dr.querySelector('#a-eng');
    const curEng = () => (engSel ? d.engagements.find((e) => e.id === engSel.value) : lockedEng);
    if (engSel) engSel.addEventListener('change', () => { dr.querySelector('#a-owner').innerHTML = ownerOpts(curEng()); });

    dr.querySelector('#a-suggest').addEventListener('click', () => {
      const eng = curEng();
      const thr = threadId || (eng && threadForEngagement(eng.id));
      const msgs = thr ? d.messages.filter((m) => m.threadId === thr).sort((a, b) => a.timestamp.localeCompare(b.timestamp)) : [];
      const last = msgs.length ? msgs[msgs.length - 1].body : (eng ? eng.program : '');
      dr.querySelector('#a-title').value = extractActions(last)[0] || 'Follow up with the customer';
    });

    dr.querySelector('#a-create').addEventListener('click', () => {
      const eng = curEng();
      if (!eng) return;
      addAction({
        engagementId: eng.id,
        threadId: threadId || threadForEngagement(eng.id),
        title: dr.querySelector('#a-title').value.trim(),
        ownerName: dr.querySelector('#a-owner').value,
        due: dr.querySelector('#a-due').value,
        status: dr.querySelector('#a-status').value,
      });
      closeDrawer();
      if (onCreated) onCreated();
    });
  });
}
