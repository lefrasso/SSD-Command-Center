// Messages Console — threaded comms with templates + AI assist.
import { store, addMessage } from '../store.js';
import { PERSONAS } from '../roles.js';
import { pageHeader, aiChip, esc, sentimentPill } from '../components.js';
import { icon } from '../icons.js';
import { suggestReply, toneCheck, summarizeThread } from '../ai.js';

const TEMPLATES = {
  '': '',
  'Dispatch': 'Assigning you a new engagement. Please complete Day 0 outreach today and confirm the Day 1 sync window.',
  'Reminder': 'Friendly reminder: milestone artifacts are due before the review. Let me know if you need anything.',
  'Escalation ack': 'Acknowledged — I’ve logged the escalation and looped in the SDM. We’ll track mitigation to SLA.',
};

let selectedThread = null;
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

export function renderMessages(container) {
  const d = store.data;
  const list = threads(d);
  if (!selectedThread || !list.find((t) => t.tid === selectedThread)) selectedThread = list[0] && list[0].tid;
  const cur = list.find((t) => t.tid === selectedThread);
  const me = PERSONAS[store.role].name;

  container.innerHTML = `
    ${pageHeader({ title: 'Messages Console', description: 'Threaded communication with Partner CSAs — every thread tied to an engagement. Templates speed dispatch; AI offers replies, tone check and summaries.' })}
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
          <button class="btn sm" id="summ">${icon('sparkle', 14)} Summarize</button>
        </div>
        ${aiNote ? `<div style="padding:8px 14px;background:var(--ai-bg);font-size:13px">${aiChip()} ${esc(aiNote)}</div>` : ''}
        <div class="conv-body" id="conv-body">
          ${cur.msgs.map((m) => `<div class="bubble ${m.from === me ? 'me' : 'them'}"><div>${esc(m.body)}</div><div class="b-meta">${esc(m.from)} · ${new Date(m.timestamp).toLocaleString()} · ${m.sentiment}</div></div>`).join('')}
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
  if (!cur) return;
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
