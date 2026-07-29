// Docked, contextual Copilot panel.
import { store, toggleCopilot } from './store.js';
import { parseHash } from './router.js';
import { MODULES, moduleById } from './nav.js';
import * as ai from './ai.js';
import { aiChip, esc } from './components.js';
import { icon } from './icons.js';

let turns = [];
let host = null;

export function renderCopilot(container) { host = container; draw(); }

function currentModule() { const { id } = parseHash(); return moduleById(id) || MODULES[0]; }

function renderTurns() {
  return turns.map((t) => t.who === 'you'
    ? `<div class="cp-msg cp-you">${esc(t.text)}</div>`
    : `<div class="cp-msg cp-ai"><div class="mb8">${aiChip()}</div>${esc(t.text)}${t.sources && t.sources.length ? `<div class="cp-sources">${t.sources.map((s) => `<span class="cp-source">${esc(s.label)}</span>`).join('')}</div>` : ''}</div>`).join('');
}

function draw() {
  const mod = currentModule();
  host.innerHTML = `
    <div class="cp-head">${icon('sparkle', 20)}<strong class="flex1">Compass Copilot</strong>${aiChip('Simulated')}<button class="icon-btn" id="cp-close" aria-label="Close Copilot" style="color:var(--fg-2)">${icon('x', 18)}</button></div>
    <div class="cp-body" id="cp-body">
      <div class="cp-ctx"><div class="cp-ctx-title">${esc(mod.label)}</div><div style="font-size:13px">${esc(mod.ai)}</div></div>
      <div class="cp-actions">
        <button class="btn sm" id="cp-brief">Brief me today</button>
        <button class="btn sm" id="cp-ctx">${mod.id === 'ssdiq' ? 'Data-quality flags' : 'Portfolio snapshot'}</button>
      </div>
      ${turns.length ? '' : '<div class="muted" style="font-size:13px">Ask about CPE trends, escalations, utilization or on-time delivery — answered from SSD IQ.</div>'}
      ${renderTurns()}
    </div>
    <div class="cp-foot"><textarea id="cp-input" placeholder="Ask your data…"></textarea><button class="btn primary" id="cp-send" aria-label="Send">${icon('send', 18)}</button></div>`;

  host.querySelector('#cp-close').onclick = () => toggleCopilot(false);
  host.querySelector('#cp-brief').onclick = () => {
    const b = ai.dailyBriefing(store.role);
    turns.push({ who: 'you', text: 'Brief me today' });
    turns.push({ who: 'ai', text: `${b.headline}\n\n• ${b.bullets.join('\n• ')}`, sources: b.sources });
    draw(); scrollBottom();
  };
  host.querySelector('#cp-ctx').onclick = () => {
    if (mod.id === 'ssdiq') {
      const flags = ai.dataQualityFlags();
      turns.push({ who: 'you', text: 'Show data-quality flags' });
      turns.push({ who: 'ai', text: flags.length ? flags.map((f) => `• [${f.severity}] ${f.message}`).join('\n') : 'No data-quality issues detected.', sources: flags.slice(0, 4).map((f) => ({ label: f.ref })) });
    } else {
      const r = ai.askData('portfolio snapshot');
      turns.push({ who: 'you', text: 'Portfolio snapshot' });
      turns.push({ who: 'ai', text: r.text, sources: r.sources });
    }
    draw(); scrollBottom();
  };
  const input = host.querySelector('#cp-input');
  const send = () => {
    const q = input.value.trim(); if (!q) return;
    turns.push({ who: 'you', text: q });
    const r = ai.ask(q, store.role);
    turns.push({ who: 'ai', text: r.text, sources: r.sources });
    draw(); scrollBottom();
  };
  host.querySelector('#cp-send').onclick = send;
  input.onkeydown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };
}

function scrollBottom() { const b = host.querySelector('#cp-body'); if (b) b.scrollTop = b.scrollHeight; }
