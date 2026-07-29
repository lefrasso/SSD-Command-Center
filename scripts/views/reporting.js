// Reporting & AI — MBR generator + ask-your-data + portfolio trends.
import { store } from '../store.js';
import { pageHeader, aiChip, esc, badge, clearCharts, bar, COLORS } from '../components.js';
import { icon } from '../icons.js';
import { mbrNarrative, askData } from '../ai.js';

const PERIODS = ['2026-04', '2026-05', '2026-06', '2026-07'];
let selPartner = null;
let selPeriod = '2026-07';
let mbrOut = '';
let askOut = '';

export function renderReporting(container) {
  const d = store.data;
  if (!selPartner) selPartner = d.partners[0] && d.partners[0].id;

  const partnerOpts = d.partners.map((p) => `<option value="${p.id}" ${p.id === selPartner ? 'selected' : ''}>${esc(p.name)}</option>`).join('');
  const periodOpts = PERIODS.map((p) => `<option value="${p}" ${p === selPeriod ? 'selected' : ''}>${p}</option>`).join('');

  const deliveriesByPartner = d.partners.map((p) => { const ids = d.csas.filter((c) => c.partnerId === p.id).map((c) => c.id); return d.deliveries.filter((dl) => { const e = d.engagements.find((x) => x.id === dl.engagementId); return e && ids.includes(e.assignedTo); }).length; });

  container.innerHTML = `
    ${pageHeader({ title: 'Reporting & AI', description: 'AI-assisted reporting centred on the Delivery Partner Monthly Business Review, plus ask-your-data over SSD IQ.' })}

    <div class="two-col">
      <div class="card pad">
        <div class="row mb8" style="gap:8px;flex-wrap:wrap"><strong>Delivery Partner MBR</strong>
          <select class="select" id="mbr-partner">${partnerOpts}</select>
          <select class="select" id="mbr-period">${periodOpts}</select>
          <button class="btn primary sm" id="mbr-gen">${icon('sparkle', 14)} Generate</button>
        </div>
        <div id="mbr-out">${mbrOut || '<div class="muted">Select a partner and period, then generate a draft MBR narrative.</div>'}</div>
      </div>

      <div class="card pad">
        <strong>Ask your data</strong>
        <div class="input-wrap mt8" style="width:100%"><span class="in-ico">${icon('search', 18)}</span><input class="input" id="ask-in" style="width:100%" placeholder="e.g. CPE trend for Avanade"/></div>
        <div class="row wrap mt8" style="gap:6px">
          ${['CPE trend for Avanade', 'open escalations', 'utilization', 'on-time delivery'].map((q) => `<button class="btn sm" data-q="${esc(q)}">${esc(q)}</button>`).join('')}
        </div>
        <div id="ask-out" class="mt8">${askOut}</div>
      </div>
    </div>

    <div class="card chart-card"><div class="chart-head"><strong>Deliveries by partner</strong>${aiChip('outliers')}</div><div class="chart-holder" style="height:240px"><canvas id="c-deliv"></canvas></div></div>`;

  clearCharts();
  bar(container.querySelector('#c-deliv'), { labels: d.partners.map((p) => p.name), values: deliveriesByPartner, color: COLORS.brand, label: 'Deliveries' });

  const runMbr = () => { const p = d.partners.find((x) => x.id === selPartner); const r = mbrNarrative(p, selPeriod, d); mbrOut = `<div class="card pad" style="background:var(--bg-2)"><div class="row mb8">${aiChip()}<button class="btn sm" id="mbr-copy">Copy</button></div><pre style="white-space:pre-wrap;font-family:inherit;font-size:13px;margin:0">${esc(r.text)}</pre></div>`; renderReporting(container); };
  const runAsk = (q) => { askOut = `<div class="card pad" style="background:var(--bg-2)"><div class="row mb8">${aiChip()}</div><div>${esc(askData(q, d).text)}</div></div>`; renderReporting(container); };

  container.querySelector('#mbr-partner').addEventListener('change', (e) => { selPartner = e.target.value; });
  container.querySelector('#mbr-period').addEventListener('change', (e) => { selPeriod = e.target.value; });
  container.querySelector('#mbr-gen').addEventListener('click', runMbr);
  const copyBtn = container.querySelector('#mbr-copy'); if (copyBtn) copyBtn.addEventListener('click', () => { const txt = container.querySelector('#mbr-out pre'); if (txt && navigator.clipboard) navigator.clipboard.writeText(txt.textContent); });
  const askIn = container.querySelector('#ask-in');
  askIn.addEventListener('keydown', (e) => { if (e.key === 'Enter' && askIn.value.trim()) runAsk(askIn.value.trim()); });
  container.querySelectorAll('[data-q]').forEach((b) => b.addEventListener('click', () => runAsk(b.getAttribute('data-q'))));
}
