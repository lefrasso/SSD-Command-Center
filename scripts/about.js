// About & Feedback — app info, support contact, and a lightweight smiley-face feedback form.
// Feedback is a note about the tool itself (not delivery data), so it's kept in localStorage
// rather than the SSD IQ dataset.
import { openDrawer, esc, aiChip } from './components.js';
import { icon } from './icons.js';

const FEEDBACK_KEY = 'compass-feedback';
const FACES = [
  { value: 1, emoji: '😞', label: 'Very unhappy' },
  { value: 2, emoji: '🙁', label: 'Unhappy' },
  { value: 3, emoji: '😐', label: 'Neutral' },
  { value: 4, emoji: '🙂', label: 'Happy' },
  { value: 5, emoji: '😄', label: 'Very happy' },
];

function readFeedback() {
  try { return JSON.parse(localStorage.getItem(FEEDBACK_KEY) || '[]'); } catch (e) { return []; }
}
function saveFeedback(entry) {
  const all = readFeedback();
  all.unshift(entry);
  localStorage.setItem(FEEDBACK_KEY, JSON.stringify(all.slice(0, 50)));
}

export function renderAboutDrawer() {
  let selected = null;

  const body = () => `
    <div class="row mb8" style="gap:10px">
      <img src="assets/compass.svg" width="36" height="36" alt=""/>
      <div><div style="font-weight:700;font-size:16px">Compass</div><div class="muted" style="font-size:12px">SSD Delivery Console · v0.1.0 · Prototype</div></div>
    </div>
    <div class="muted mb16" style="font-size:13px;line-height:1.5">
      Compass is a self-contained prototype over SSD IQ, the System of Records for Success Programs delivery.
      Data is simulated and AI outputs are advisory mock-ups — nothing here calls a production service.
    </div>

    <div class="card pad mb16">
      <div class="row mb8" style="gap:6px">${icon('wrench', 16)}<strong style="font-size:14px">Need help?</strong></div>
      <div class="muted mb8" style="font-size:12px">Reach the platform team for support, access requests, or to report an issue.</div>
      <a class="btn sm" href="mailto:compass-support@microsoft.com?subject=Compass%20support%20request">${icon('send', 14)} Contact support</a>
    </div>

    <div class="card pad" id="fb-card">
      <div class="row mb8" style="gap:6px">${icon('emoji', 16)}<strong style="font-size:14px">Share feedback</strong>${aiChip('Optional')}</div>
      <div class="muted mb8" style="font-size:12px">How's your experience with Compass? A reaction is enough — comments are optional.</div>
      <div class="face-row" role="radiogroup" aria-label="Rate your experience">
        ${FACES.map((f) => `<button type="button" class="face-btn" data-face="${f.value}" role="radio" aria-checked="false" aria-label="${esc(f.label)}" title="${esc(f.label)}">${f.emoji}</button>`).join('')}
      </div>
      <textarea class="input" id="fb-comment" rows="3" placeholder="Anything you'd like us to know? (optional)" style="width:100%;margin-top:10px;resize:vertical;font-family:inherit"></textarea>
      <div class="row mb8" style="justify-content:flex-end;margin-top:10px">
        <button class="btn primary sm" id="fb-submit">Submit feedback</button>
      </div>
      <div id="fb-status" class="muted" style="font-size:12px"></div>
    </div>`;

  openDrawer('About & Feedback', body(), (dr) => {
    const faceBtns = () => dr.querySelectorAll('.face-btn');
    dr.querySelector('.face-row').addEventListener('click', (e) => {
      const btn = e.target.closest('.face-btn'); if (!btn) return;
      selected = Number(btn.getAttribute('data-face'));
      faceBtns().forEach((b) => { const on = b === btn; b.classList.toggle('selected', on); b.setAttribute('aria-checked', String(on)); });
    });
    dr.querySelector('#fb-submit').addEventListener('click', () => {
      const comment = dr.querySelector('#fb-comment').value.trim();
      if (!selected && !comment) { dr.querySelector('#fb-status').textContent = 'Pick a reaction or add a comment before submitting.'; return; }
      saveFeedback({ rating: selected, comment, submittedAt: new Date().toISOString() });
      dr.querySelector('#fb-status').textContent = 'Thanks — your feedback was recorded. We review this regularly.';
      dr.querySelector('#fb-status').style.color = 'var(--positive)';
      selected = null;
      faceBtns().forEach((b) => { b.classList.remove('selected'); b.setAttribute('aria-checked', 'false'); });
      dr.querySelector('#fb-comment').value = '';
    });
  });
}
