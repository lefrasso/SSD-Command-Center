// Messages Console — threaded comms with templates + AI assist.
import { store, addMessage, actionsByThread } from '../store.js';
import { PERSONAS } from '../roles.js';
import { pageHeader, aiChip, esc, sentimentPill } from '../components.js';
import { icon } from '../icons.js';
import { suggestReply, toneCheck, summarizeThread } from '../ai.js';
import { openAssignActionDrawer, actionItemHtml, wireActionToggles } from '../actions.js';
import { navigate } from '../router.js';

const TEMPLATES = {
  '': '',
  'Dispatch': 'Assigning you a new engagement. Please complete Day 0 outreach today and confirm the Day 1 sync window.',
  'Reminder': 'Friendly reminder: milestone artifacts are due before the review. Let me know if you need anything.',
  'Escalation ack': 'Acknowledged — I’ve logged the escalation and looped in the SDM. We’ll track mitigation to SLA.',
};

let selectedThread = null;
let appliedParam = null;
let aiNote = '';

function threads(d) {
  const ids = [...new Set(d.messages.map((m) => m.threadId))];
  return ids.map((tid) => {
    const msgs = d.messages.filter((m) => m.threadId === tid).sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    const eng = d.engagements.find((e) => e.id === msgs[0].engagementId);
    const neg = msgs.filter((m) => m.sentiment === 'negative').length;
    const pos = msgs.filter((m) => m.sentiment === 'positive').length;
    const sentiment = neg > msgs.length / 3 ? 'negative' : pos >= neg ? 'positive' : 'neutral';
    return { tid, msgs, eng, sentiment };
  }).filter((t) => t.eng);
}

export function renderMessages(container, threadParam = '') {
  const d = store.data;
  const list = threads(d);
  if (threadParam && threadParam !== appliedParam) {
    const q = threadParam.toLowerCase();
    const hit = list.find((t) => t.tid === threadParam) || list.find((t) => t.eng && t.eng.customer.toLowerCase().includes(q));
    if (hit) selectedThread = hit.tid;
    appliedParam = threadParam;
  }
  if (!selectedThread || !list.find((t) => t.tid === selectedThread)) selectedThread = list[0] && list[0].tid;
  const cur = list.find((t) => t.tid === selectedThread);
  const me = PERSONAS[store.role].name;
  const acts = cur ? actionsByThread(cur.tid).slice().sort((a, b) => (a.status === 'done') - (b.status === 'done') || String(a.due).localeCompare(String(b.due))) : [];
  const openCount = acts.filter((a) => a.status !== 'done').length;
  const myActions = d.actions.filter((a) => a.ownerName === me).sort((a, b) => (a.status === 'done') - (b.status === 'done') || String(a.due).localeCompare(String(b.due)));
  const myOpenCount = myActions.filter((a) => a.status !== 'done').length;

  container.innerHTML = `
    ${pageHeader({ title: 'Messages Console', description: 'Every thread is tied to an engagement record in SSD IQ, with action follow-through and communication history tracked as part of the platform source-of-truth.' })}

    <div class="card pad mb16" id="my-assignments">
      <div class="row mb8" style="justify-content:space-between"><strong style="font-size:14px">${icon('flag', 16)} My assignments</strong><span class="muted" style="font-size:12px">${esc(PERSONAS[store.role].title)} · ${myOpenCount} open</span></div>
      ${myActions.length ? myActions.slice(0, 8).map((a) => actionItemHtml(a, { showSource: true, withOpen: true })).join('') : `<div class="muted" style="font-size:12px">No activities are currently assigned to ${esc(me)}. Switch roles (top-right) to demo another persona's assignments — e.g. assign a KYPL follow-up to an SDM in Enablement, then switch to that SDM here.</div>`}
    </div>

    <div class="msg-layout">
      <div class="thread-list">
        ${list.map((t) => `<div class="thread-item ${t.tid === selectedThread ? 'active' : ''}" data-tid="${t.tid}">
          <div class="row" style="justify-content:space-between"><strong style="font-size:13px">${esc(t.eng.customer)}</strong>${sentimentPill(t.sentiment)}</div>
          <div class="muted" style="font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(t.msgs[t.msgs.length - 1].body)}</div>
        </div>`).join('')}
      </div>
      <div class="conv">
        ${cur ? `
        <div class="row" style="justify-content:space-between;padding:10px 14px;border-bottom:1px solid var(--stroke-2)">
          <strong>${esc(cur.eng.customer)} · ${esc(cur.eng.program)}</strong>
          <div class="row" style="gap:6px">
            <button class="btn sm" id="assign-action">${icon('flag', 14)} Assign action</button>
            <button class="btn sm" id="summ">${icon('sparkle', 14)} Summarize</button>
          </div>
        </div>
        ${aiNote ? `<div style="padding:8px 14px;background:var(--ai-bg);font-size:13px">${aiChip()} ${esc(aiNote)}</div>` : ''}
        <div class="conv-actions">
          <strong style="font-size:13px">${icon('flag', 14)} Actions <span class="muted" style="font-weight:400">· ${openCount} open</span></strong>
          ${acts.length ? `<div class="ca-list">${acts.map((a) => actionItemHtml(a)).join('')}</div>` : '<div class="muted" style="font-size:12px;margin-top:4px">No actions yet — assign one from the button above or any message below.</div>'}
        </div>
        <div class="conv-body" id="conv-body">
          ${cur.msgs.map((m) => `<div class="bubble ${m.from === me ? 'me' : 'them'}"><div>${esc(m.body)}</div><div class="b-meta">${esc(m.from)} · ${new Date(m.timestamp).toLocaleString()} · ${m.sentiment} · <button class="linkish assign-from-msg" data-msg="${esc(m.id)}" title="Assign an action from this message">${icon('flag', 11)} Action</button></div></div>`).join('')}
        </div>
        <div class="conv-foot">
          <div class="row" style="gap:6px">
            <select class="select" id="tmpl" aria-label="Template">${Object.keys(TEMPLATES).map((k) => `<option value="${esc(k)}">${k || 'Template…'}</option>`).join('')}</select>
            <button class="btn sm" id="suggest">${icon('sparkle', 14)} Suggest reply</button>
            <button class="btn sm" id="tone">${icon('sparkle', 14)} Tone check</button>
          </div>
          <textarea id="composer" placeholder="Write a message…"></textarea>
          <div class="row" style="justify-content:flex-end"><button class="btn primary" id="send">${icon('send', 16)} Send</button></div>
        </div>` : '<div class="empty">No threads</div>'}
      </div>
    </div>`;

  container.querySelectorAll('[data-tid]').forEach((el) => el.addEventListener('click', () => { selectedThread = el.getAttribute('data-tid'); aiNote = ''; renderMessages(container); }));
  wireActionToggles(container, () => renderMessages(container));
  const myAssignEl = container.querySelector('#my-assignments');
  if (myAssignEl) myAssignEl.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-open]'); if (!btn) return;
    const v = btn.getAttribute('data-open');
    if (v.startsWith('thread:')) { selectedThread = v.slice(7); appliedParam = null; renderMessages(container); }
    else if (v === 'esc') navigate('/escalations');
  });
  if (!cur) return;
  container.querySelector('#assign-action').addEventListener('click', () => openAssignActionDrawer({ engagementId: cur.eng.id, threadId: cur.tid }));
  container.querySelectorAll('.assign-from-msg').forEach((b) => b.addEventListener('click', () => {
    const m = cur.msgs.find((x) => x.id === b.getAttribute('data-msg'));
    openAssignActionDrawer({ engagementId: cur.eng.id, threadId: cur.tid, prefillTitle: m ? m.body : '' });
  }));
  const body = container.querySelector('#conv-body'); if (body) body.scrollTop = body.scrollHeight;
  const composer = container.querySelector('#composer');
  container.querySelector('#tmpl').addEventListener('change', (e) => { composer.value = TEMPLATES[e.target.value] || ''; });
  container.querySelector('#suggest').addEventListener('click', () => { composer.value = suggestReply(cur.msgs[cur.msgs.length - 1].body).text; });
  container.querySelector('#tone').addEventListener('click', () => { aiNote = toneCheck(composer.value).text; renderMessages(container); });
  container.querySelector('#summ').addEventListener('click', () => { aiNote = summarizeThread(cur.msgs).text; renderMessages(container); });
  container.querySelector('#send').addEventListener('click', () => {
    const v = composer.value.trim(); if (!v) return;
    const csa = store.data.csas.find((c) => c.id === cur.eng.assignedTo);
    addMessage(cur.tid, cur.eng.id, me, csa ? csa.name : 'Partner CSA', v, 'neutral');
  });
}
