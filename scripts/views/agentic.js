// Agentic Delivery — AI delivery agents, Deliverables Generation, and the IP library.
import { store, ipFeedbackForEngagement, addIpFeedback } from '../store.js';
import { pageHeader, kpiCard, aiChip, esc, badge, COLORS, openDrawer, closeDrawer } from '../components.js';
import { icon } from '../icons.js';
import { generateDeliverable } from '../ai.js';
import { IP_ASSETS, IP_TAGS } from '../../data/generate.js';

let generated = 0;

function agentStatus(e) {
  const done = e.milestones.filter((m) => m.done).length;
  if (e.status === 'complete') return { label: 'Complete', color: COLORS.positive };
  if (done >= Math.ceil(e.milestones.length / 2)) return { label: 'Drafting deliverable', color: COLORS.info };
  if (e.status === 'in-delivery') return { label: 'In delivery', color: COLORS.warning };
  return { label: 'Queued', color: COLORS.neutral };
}

export function renderAgentic(container) {
  const d = store.data;
  const active = d.engagements.filter((e) => e.assignedTo && (e.status === 'in-delivery' || e.status === 'assigned'));
  const automation = d.engagements.filter((e) => e.status !== 'new').length;
  const coverage = d.engagements.length ? Math.round((automation / d.engagements.length) * 100) : 0;

  container.innerHTML = `
    ${pageHeader({ title: 'Agentic Delivery', description: 'AI delivery agents draft from SSD IQ-backed engagement records and reusable IP, while the human CSA remains accountable for review and publication.', actions: aiChip('Agentic') })}

    <div class="kpi-grid">
      ${kpiCard({ label: 'Active delivery agents', value: active.length, iconName: 'sparkle', tone: COLORS.brand })}
      ${kpiCard({ label: 'Deliverables generated', value: generated, iconName: 'report', hint: 'this session' })}
      ${kpiCard({ label: 'IP Kit feedback', value: d.ipFeedback.length, iconName: 'star', hint: 'across all engagements' })}
      ${kpiCard({ label: 'Automation coverage', value: coverage + '%', iconName: 'check', tone: COLORS.positive, hint: 'engagements with an agent' })}
    </div>

    <div class="section-title">Delivery agents</div>
    <div class="muted mb8" style="font-size:12px">Each engagement has its own IP Kit — the collateral bundle used for that delivery's Program. Rate it after use to feed the IP Lead's refresh backlog.</div>
    <div class="table-wrap mb16"><table class="grid"><thead><tr><th>Customer</th><th>CSA</th><th>Family</th><th>Program</th><th>Agent status</th><th>IP Kit feedback</th><th></th></tr></thead><tbody>
      ${active.slice(0, 40).map((e) => {
        const c = d.csas.find((x) => x.id === e.assignedTo);
        const st = agentStatus(e);
        const fb = ipFeedbackForEngagement(e.id, d);
        const avg = fb.length ? Math.round((fb.reduce((s, f) => s + f.rating, 0) / fb.length) * 10) / 10 : null;
        return `<tr>
        <td><strong>${esc(e.customer)}</strong></td>
        <td>${esc(c ? c.name : '—')}</td>
        <td>${esc(e.track)}</td>
        <td>${esc(e.program)}</td>
        <td><span class="pill" style="color:${st.color}"><span class="pill-label">${esc(st.label)}</span></span></td>
        <td>${avg != null ? badge(`★ ${avg.toFixed(1)} · ${fb.length}`, 'outline') : badge('No feedback yet', 'outline')}</td>
        <td class="row" style="gap:6px">
          <button class="btn sm" data-gen="${e.id}">${icon('sparkle', 14)} Generate deliverable</button>
          <button class="btn sm subtle" data-ip-feedback="${e.id}">Rate IP Kit</button>
        </td>
      </tr>`; }).join('') || '<tr><td colspan="7" class="muted" style="padding:16px">No active engagements.</td></tr>'}
    </tbody></table></div>

    <div class="section-title">IP library</div>
    <div class="muted mb8" style="font-size:12px">Reference templates behind each engagement's Kit — informational only; feedback is captured per engagement above.</div>
    <div class="catalog">
      ${IP_ASSETS.map((a) => `<div class="card tile" style="cursor:default">
        <span class="tile-ico">${icon('star', 20)}</span>
        <div><strong>${esc(a.name)}</strong><div class="muted" style="font-size:12px">${esc(a.type)} · ${esc(a.track)}</div><div class="mt8">${badge('Reusable IP', 'tint-info')}</div></div>
      </div>`).join('')}
    </div>`;

  container.querySelectorAll('[data-gen]').forEach((b) => b.addEventListener('click', () => {
    const e = d.engagements.find((x) => x.id === b.getAttribute('data-gen'));
    const r = generateDeliverable(e, d);
    generated += 1;
    openDrawer(`Deliverable · ${esc(e.customer)}`, `<div class="row mb8" style="gap:8px">${aiChip()}<span class="muted" style="font-size:12px">Draft — review before sending</span></div><pre style="white-space:pre-wrap;font-family:inherit;font-size:13px;margin:0">${esc(r.text)}</pre>`);
    // refresh the KPI counter
    const doc = container.querySelector('.kpi-grid'); if (doc) renderAgentic(container);
  }));

  container.querySelectorAll('[data-ip-feedback]').forEach((b) => b.addEventListener('click', () => openIpFeedback(b.getAttribute('data-ip-feedback'), container)));
}

function openIpFeedback(engagementId, container) {
  const d = store.data;
  const e = d.engagements.find((x) => x.id === engagementId);
  if (!e) return;
  const c = d.csas.find((x) => x.id === e.assignedTo);
  const body = `
    <div class="field"><span class="field-key">IP Kit</span><span class="field-val">${esc(e.program)} IP Kit</span></div>
    <div class="field"><span class="field-key">Engagement</span><span class="field-val">${esc(e.customer)} · ${esc(e.track)}</span></div>
    <div class="field"><span class="field-key">Delivered by</span><span class="field-val">${esc(c ? c.name : 'Unassigned')}</span></div>
    <label class="muted" style="font-size:12px;display:block;margin-top:10px">Rating</label>
    <select class="select" id="ipf-rating" style="width:100%;margin-bottom:10px">
      <option value="5">5 — Excellent, used as-is</option>
      <option value="4">4 — Good</option>
      <option value="3" selected>3 — Usable, minor gaps</option>
      <option value="2">2 — Weak, needed rework</option>
      <option value="1">1 — Poor</option>
    </select>
    <label class="muted" style="font-size:12px">Status</label>
    <select class="select" id="ipf-tag" style="width:100%;margin-bottom:10px">${IP_TAGS.map((t) => `<option value="${esc(t)}">${esc(t)}</option>`).join('')}</select>
    <label class="muted" style="font-size:12px">Comment</label>
    <textarea id="ipf-comment" style="width:100%;min-height:80px;border:1px solid var(--stroke-1);border-radius:4px;padding:8px;font-family:inherit;margin:6px 0 10px" placeholder="What worked, what didn't?"></textarea>
    <button class="btn primary" id="ipf-submit">Submit feedback</button>
    <div id="ipf-error"></div>`;

  openDrawer(`Rate IP Kit · ${esc(e.customer)}`, body, (dr) => {
    dr.querySelector('#ipf-submit').addEventListener('click', () => {
      try {
        addIpFeedback({
          engagementId: e.id,
          rating: dr.querySelector('#ipf-rating').value,
          tag: dr.querySelector('#ipf-tag').value,
          comment: dr.querySelector('#ipf-comment').value,
        });
        closeDrawer();
        renderAgentic(container);
      } catch (err) {
        dr.querySelector('#ipf-error').innerHTML = `<div class="muted" style="color:${COLORS.negative};font-size:12px;margin-top:6px">${esc(err.message)}</div>`;
      }
    });
  });
}
