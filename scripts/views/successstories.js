// Success Stories — official VSAT intake, review, publication and export workflow.
import {
  store, addSuccessStory, updateSuccessStory, deleteSuccessStory, transitionSuccessStory,
  setSuccessStoryLtApproval, addAction,
} from '../store.js';
import { can, PERSONAS } from '../roles.js';
import {
  pageHeader, kpiCard, badge, statusPill, sourceBadge, esc, emptyState, openDrawer, closeDrawer, COLORS,
} from '../components.js';
import { icon } from '../icons.js';
import { SUCCESS_STORY_INDUSTRIES, SUCCESS_STORY_SEGMENTS } from '../../data/generate.js';
import { exportSuccessStoryPowerPoint } from '../pptx.js';

const STATUS_OPTIONS = [
  ['all', 'All statuses'],
  ['draft', 'Draft'],
  ['sdm-review', 'SDM review'],
  ['pod-review', 'POD Lead review'],
  ['leadership-review', 'Leadership review'],
  ['approved', 'Approved'],
  ['published', 'Published'],
  ['archived', 'Archived'],
];
const REVIEW_STATUSES = new Set(['sdm-review', 'pod-review', 'leadership-review']);
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

let host = null;
let query = '';
let statusFilter = 'all';
let activeTab = 'stories';

export function renderSuccessStories(container, initialQuery) {
  host = container;
  if (initialQuery != null) query = initialQuery;
  renderContent();
}

function linkedStoriesForVsat(vsat) {
  return store.data.successStories.filter((story) => story.cpeId === vsat.id || story.engagementIds.includes(vsat.engagementId));
}

function renderContent() {
  const d = store.data;
  const vsats = d.cpe.filter((item) => item.class === 'VSAT');
  const coveredVsats = vsats.filter((vsat) => linkedStoriesForVsat(vsat).length).length;
  const published = d.successStories.filter((story) => story.status === 'published').length;
  const inReview = d.successStories.filter((story) => REVIEW_STATUSES.has(story.status)).length;
  const coverage = vsats.length ? Math.round((coveredVsats / vsats.length) * 100) : 0;
  const canCreate = can(store.role, 'edit:successStories');

  host.innerHTML = `
    ${pageHeader({
      title: 'Success Stories',
      description: 'Manage the official VSAT-to-story process, review customer outcomes, publish to SharePoint, and export the approved PowerPoint format.',
      actions: canCreate ? `<button class="btn primary" id="new-story">${icon('star', 16)} New success story</button>` : '',
    })}
    <div class="kpi-grid">
      ${kpiCard({ label: 'Total stories', value: d.successStories.length, iconName: 'report' })}
      ${kpiCard({ label: 'Published', value: published, iconName: 'check', tone: COLORS.positive })}
      ${kpiCard({ label: 'In official review', value: inReview, iconName: 'clock', tone: COLORS.warning })}
      ${kpiCard({ label: 'VSAT coverage', value: `${coverage}%`, hint: `${coveredVsats} of ${vsats.length} VSAT engagements`, iconName: 'star' })}
    </div>
    <div class="tabs" role="tablist">
      <button class="tab ${activeTab === 'stories' ? 'active' : ''}" data-tab="stories">Story list</button>
      <button class="tab ${activeTab === 'vsat' ? 'active' : ''}" data-tab="vsat">VSAT opportunities ${badge(String(vsats.length - coveredVsats), 'tint-warn')}</button>
      <button class="tab ${activeTab === 'process' ? 'active' : ''}" data-tab="process">Official process</button>
    </div>
    <div id="story-tab-content">${activeTab === 'stories' ? renderStoryList() : activeTab === 'vsat' ? renderVsatList(vsats) : renderProcess()}</div>`;
  wireContent();
}

function renderStoryList() {
  const normalizedQuery = query.trim().toLowerCase();
  const stories = [...store.data.successStories]
    .filter((story) => statusFilter === 'all' || story.status === statusFilter)
    .filter((story) => {
      const engagement = store.data.engagements.find((item) => item.id === story.engagementId);
      return !normalizedQuery || [
        story.id, story.cpeId, story.title, story.family, story.ownerName, story.partnerName, story.country,
        story.industry, story.segment, story.feedbackSource, engagement?.customer, ...story.tags,
      ].some((value) => String(value || '').toLowerCase().includes(normalizedQuery));
    })
    .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));

  return `
    <div class="card pad mb16">
      <div class="row wrap" style="gap:10px">
        <div class="input-wrap flex1" style="max-width:520px">
          <span class="in-ico">${icon('search', 18)}</span>
          <input class="input" id="story-search" value="${esc(query)}" placeholder="Search stories, customers, events, partners or metadata" style="width:100%"/>
        </div>
        <select class="select" id="story-status" aria-label="Filter by status">
          ${STATUS_OPTIONS.map(([value, label]) => `<option value="${value}" ${statusFilter === value ? 'selected' : ''}>${label}</option>`).join('')}
        </select>
        ${sourceBadge('SSD IQ')}
      </div>
    </div>
    ${stories.length ? `<div class="table-wrap">
      <table class="grid story-list">
        <thead><tr><th>Story</th><th>Customer / event</th><th>Source</th><th>Owner</th><th>Status</th><th>LT approved</th><th>Updated</th></tr></thead>
        <tbody>${stories.map((story) => {
    const engagement = store.data.engagements.find((item) => item.id === story.engagementId);
    return `<tr class="clickable" data-story-id="${story.id}">
            <td><strong>${esc(story.title)}</strong><div class="muted">${esc(story.id)} · ${esc(story.fiscalYear)} ${esc(story.month)}</div></td>
            <td>${esc(engagement?.customer || story.engagementId)}<div class="muted">${esc(story.eventNames.join(', '))}</div></td>
            <td>${story.cpeId ? badge('VSAT', 'tint-info') : badge(story.feedbackSource, 'outline')}</td>
            <td>${esc(story.ownerName)}</td><td>${statusPill(story.status)}</td>
            <td>${story.ltApproved ? badge('Yes', 'tint-info') : '<span class="muted">No</span>'}</td><td>${esc(story.updatedAt)}</td>
          </tr>`;
  }).join('')}</tbody>
      </table>
    </div>` : emptyState({ title: 'No success stories match', description: 'Adjust the filters or create a story from a VSAT opportunity.' })}`;
}

function renderVsatList(vsats) {
  const canAssign = can(store.role, 'assign:successStoryActions');
  const canCreate = can(store.role, 'edit:successStories');
  return `
    <div class="card pad mb16 vsat-guidance">
      <strong>Official starting point</strong>
      <span>A 5-star survey is the preferred trigger. Customer/CSAM written feedback or an impactful delivery can also initiate a story. Copilot-generated customer quotes are prohibited.</span>
    </div>
    <div class="table-wrap">
      <table class="grid">
        <thead><tr><th>VSAT engagement</th><th>Feedback</th><th>Date</th><th>Story</th><th>SDM follow-up</th><th></th></tr></thead>
        <tbody>${vsats.map((vsat) => {
    const engagement = store.data.engagements.find((item) => item.id === vsat.engagementId);
    const stories = linkedStoriesForVsat(vsat);
    const action = store.data.actions.find((item) => item.cpeId === vsat.id && item.status !== 'done');
    return `<tr>
            <td><strong>${esc(engagement?.customer || vsat.engagementId)}</strong><div class="muted">${esc(engagement?.program || vsat.track)} · ${esc(vsat.id)}</div></td>
            <td style="white-space:normal;min-width:260px">“${esc(vsat.verbatim)}”</td><td>${esc(vsat.date)}</td>
            <td>${stories.length ? stories.map((story) => `<button class="linkish" data-story-id="${story.id}">${esc(story.id)} ${statusPill(story.status)}</button>`).join('<br/>') : badge('Missing', 'tint-warn')}</td>
            <td>${action ? `${esc(action.ownerName)} · due ${esc(action.due)} ${statusPill(action.status)}` : '<span class="muted">None</span>'}</td>
            <td><div class="row wrap">${!stories.length && canCreate ? `<button class="btn sm" data-create-vsat="${vsat.id}">${icon('star', 14)} Create</button>` : ''}${!stories.length && canAssign && !action ? `<button class="btn sm" data-assign-vsat="${vsat.id}">${icon('flag', 14)} Assign SDM</button>` : ''}</div></td>
          </tr>`;
  }).join('')}</tbody>
      </table>
    </div>`;
}

function renderProcess() {
  const steps = [
    ['1', 'Positive signal', 'Partner CSA receives a 5-star VSAT, written customer/CSAM feedback, or identifies an impactful delivery.'],
    ['2', 'Author with CSAM', 'Partner CSA captures mandatory metadata, evidence, quotes, outcomes, insights, and impact in SSD IQ.'],
    ['3', 'SDM review', 'SDM reviews evidence and either requests details or advances the story to the POD Lead.'],
    ['4', 'POD Lead review', 'POD Lead checks delivery quality and requests changes or submits to SSD Leadership.'],
    ['5', 'Leadership approval', 'SSD Leadership approves the story for use in demonstrating Success Program value.'],
    ['6', 'Publish and promote', 'POD Lead uploads to SharePoint; SSD Leadership may mark LT Approved for automatic SPS Internal Hub promotion.'],
  ];
  return `
    <div class="process-rail">${steps.map(([number, title, description]) => `<div class="process-step"><span>${number}</span><div><strong>${title}</strong><p>${description}</p></div></div>`).join('')}</div>
    <div class="card pad mt8">
      <strong>Operating metric</strong>
      <p class="muted">At least one success story per delivery-partner organization per time zone.</p>
      <div class="story-rule-grid">
        ${store.data.partners.slice(0, 6).map((partner) => {
    const stories = store.data.successStories.filter((story) => story.partnerName === partner.name);
    return `<div><strong>${esc(partner.name)}</strong><span>${stories.length} stor${stories.length === 1 ? 'y' : 'ies'} · ${new Set(stories.map((story) => story.timeZone)).size} TZ</span></div>`;
  }).join('')}
      </div>
    </div>`;
}

function wireContent() {
  host.querySelectorAll('[data-tab]').forEach((button) => button.addEventListener('click', () => {
    activeTab = button.getAttribute('data-tab');
    renderContent();
  }));
  host.querySelector('#new-story')?.addEventListener('click', () => openStoryForm());
  const search = host.querySelector('#story-search');
  search?.addEventListener('input', (event) => {
    query = event.target.value;
    renderContent();
    const next = host.querySelector('#story-search');
    next.focus();
    next.setSelectionRange(query.length, query.length);
  });
  host.querySelector('#story-status')?.addEventListener('change', (event) => {
    statusFilter = event.target.value;
    renderContent();
  });
  host.querySelectorAll('[data-story-id]').forEach((row) => row.addEventListener('click', () => openStory(row.getAttribute('data-story-id'))));
  host.querySelectorAll('[data-create-vsat]').forEach((button) => button.addEventListener('click', () => {
    const vsat = store.data.cpe.find((item) => item.id === button.getAttribute('data-create-vsat'));
    openStoryForm(null, { engagementId: vsat.engagementId, cpeId: vsat.id });
  }));
  host.querySelectorAll('[data-assign-vsat]').forEach((button) => button.addEventListener('click', () => openAssignSdm(button.getAttribute('data-assign-vsat'))));
}

function openStory(id) {
  const d = store.data;
  const story = d.successStories.find((item) => item.id === id);
  if (!story) return;
  const engagement = d.engagements.find((item) => item.id === story.engagementId);
  const vsat = story.cpeId ? d.cpe.find((item) => item.id === story.cpeId) : null;
  const persona = PERSONAS[store.role];
  const canEditDraft = story.status === 'draft' && can(store.role, 'edit:successStories');
  const actions = workflowActions(story);

  const body = `
    <div class="row wrap mb16" style="justify-content:space-between"><div class="row wrap">${statusPill(story.status)}${story.cpeId ? badge('VSAT linked', 'tint-info') : ''}${story.ltApproved ? badge('LT Approved', 'tint-info') : ''}</div>${sourceBadge(story.sourceOfTruth)}</div>
    <div class="story-detail-head"><h2>${esc(story.title)}</h2><p>${esc(story.headline)}</p></div>
    <div class="story-section"><strong>Engagement overview</strong><p>${esc(story.summary)}</p>
      <div class="story-meta-grid">
        <span><b>Customer</b>${esc(engagement?.customer || story.engagementId)}</span><span><b>Family</b>${esc(story.family)}</span>
        <span><b>Events</b>${esc(story.eventNames.join(', '))}</span><span><b>TZ / Area</b>${esc(story.timeZone)} / ${esc(story.area)}</span>
        <span><b>Country</b>${esc(story.country)}</span><span><b>Industry / Segment</b>${esc(story.industry)} / ${esc(story.segment)}</span>
        <span><b>Period</b>${esc(story.fiscalYear)} · ${esc(story.month)}</span><span><b>Feedback source</b>${esc(story.feedbackSource)}</span>
      </div>
    </div>
    <div class="story-section"><strong>Delivery team</strong><div class="story-meta-grid"><span><b>CSAM</b>${esc(story.csamName)}</span><span><b>POD Lead</b>${esc(story.podLeadName)}</span><span><b>Partner CSA</b>${esc(story.partnerCsaName)}</span><span><b>Delivery Partner</b>${esc(story.partnerName)}</span></div></div>
    ${renderNarrative('Key outcomes', story.keyOutcomes)}${renderNarrative('Insights', story.insights)}${renderNarrative('Impact', story.impact)}
    <div class="story-quote-grid"><blockquote>“${esc(story.customerQuote)}”<cite>— ${esc(story.customerQuoteAttribution)}</cite></blockquote><blockquote>“${esc(story.csamQuote)}”<cite>— ${esc(story.csamName)}, CSAM</cite></blockquote></div>
    <div class="story-section"><strong>Evidence and relationships</strong>
      <div class="field"><span class="field-key">Engagements</span><span class="field-val">${story.engagementIds.map((engagementId) => esc(engagementId)).join(', ')}</span></div>
      <div class="field"><span class="field-key">VSAT</span><span class="field-val">${vsat ? `${esc(vsat.id)} · 5/5 · “${esc(vsat.verbatim)}”` : 'Not linked'}</span></div>
      <div class="field"><span class="field-key">SharePoint</span><span class="field-val">${story.sharePointStatus === 'uploaded' ? `Uploaded ${story.publishDate ? `on ${esc(story.publishDate)}` : ''}` : 'Not uploaded'}</span></div>
      <div class="field"><span class="field-key">PowerPoint name</span><span class="field-val">${esc(officialFilename(story, engagement?.customer))}</span></div>
    </div>
    <div class="story-section"><strong>Review history</strong>${story.reviewHistory.length ? story.reviewHistory.map((review) => `<div class="review-item"><span>${badge(review.decision, review.decision === 'changes-requested' ? 'tint-warn' : 'tint-info')}</span><div><b>${esc(review.stage)}</b> · ${esc(review.by)} · ${esc(review.at)}${review.comment ? `<p>${esc(review.comment)}</p>` : ''}</div></div>`).join('') : '<p class="muted">No review decisions yet.</p>'}</div>
    <div class="story-section"><strong>Actions</strong><div class="row wrap" style="gap:6px">
      ${canEditDraft ? `<button class="btn" id="edit-story">${icon('report', 15)} Edit</button>` : ''}
      ${actions}
      ${canEditDraft ? `<button class="btn subtle" id="delete-story" style="color:var(--negative)">${icon('x', 15)} Delete draft</button>` : ''}
      <button class="btn" id="export-story">${icon('report', 15)} Export official PowerPoint</button>
    </div><div id="story-action-output" class="muted mt8"></div></div>`;

  openDrawer(`Success story · ${esc(story.id)}`, body, (drawer) => {
    drawer.querySelector('#edit-story')?.addEventListener('click', () => openStoryForm(story.id));
    drawer.querySelectorAll('[data-transition]').forEach((button) => button.addEventListener('click', () => openTransition(story.id, button.getAttribute('data-transition'), button.textContent.trim())));
    drawer.querySelector('#lt-approval')?.addEventListener('click', () => {
      setSuccessStoryLtApproval(story.id, !story.ltApproved, persona.name);
      closeDrawer();
    });
    drawer.querySelector('#delete-story')?.addEventListener('click', () => {
      if (window.confirm(`Delete draft “${story.title}”?`)) { deleteSuccessStory(story.id); closeDrawer(); }
    });
    drawer.querySelector('#export-story').addEventListener('click', async (event) => {
      const button = event.currentTarget;
      const output = drawer.querySelector('#story-action-output');
      button.disabled = true;
      output.textContent = 'Preparing the official PowerPoint template…';
      try {
        const filename = await exportSuccessStoryPowerPoint(story, d);
        output.textContent = `Downloaded ${filename}`;
      } catch (error) {
        output.textContent = `PowerPoint export failed: ${error.message}`;
      } finally {
        button.disabled = false;
      }
    });
  });
}

function renderNarrative(title, value) {
  return `<div class="story-section"><strong>${title}</strong><ul>${value.split(/\r?\n/).filter(Boolean).map((line) => `<li>${esc(line)}</li>`).join('')}</ul></div>`;
}

function workflowActions(story) {
  const buttons = [];
  if (story.status === 'draft' && can(store.role, 'edit:successStories')) buttons.push(actionButton('sdm-review', 'Submit to SDM', 'primary'));
  if (story.status === 'sdm-review' && can(store.role, 'review:successStories')) {
    buttons.push(actionButton('pod-review', 'Send to POD Lead', 'primary'), actionButton('draft', 'Request changes'));
  }
  if (story.status === 'pod-review' && can(store.role, 'approve:podSuccessStories')) {
    buttons.push(actionButton('leadership-review', 'Send to SSD Leadership', 'primary'), actionButton('draft', 'Request changes'));
  }
  if (story.status === 'leadership-review' && can(store.role, 'approve:leadershipSuccessStories')) {
    buttons.push(actionButton('approved', 'Approve story', 'primary'), actionButton('draft', 'Request changes'));
  }
  if (story.status === 'approved' && can(store.role, 'publish:successStories')) buttons.push(actionButton('published', 'Upload to SharePoint', 'primary'));
  if (story.status === 'published' && can(store.role, 'publish:successStories')) buttons.push(actionButton('archived', 'Archive'));
  if (story.status === 'archived' && can(store.role, 'publish:successStories')) buttons.push(actionButton('draft', 'Restore as draft'));
  if (story.status === 'published' && can(store.role, 'approve:ltSuccessStories')) {
    buttons.push(`<button class="btn" id="lt-approval">${icon(story.ltApproved ? 'x' : 'check', 15)} ${story.ltApproved ? 'Remove LT approval' : 'Mark LT Approved'}</button>`);
  }
  return buttons.join('');
}

function actionButton(status, label, variant = '') {
  return `<button class="btn ${variant}" data-transition="${status}">${status === 'draft' ? icon('warning', 15) : icon('check', 15)} ${label}</button>`;
}

function openTransition(storyId, nextStatus, label) {
  const requiresComment = nextStatus === 'draft';
  const body = `<div class="section-title">${esc(label)}</div><p class="muted">The decision and comment are retained in the governed review history.</p>
    <label class="form-field"><span>Review comment ${requiresComment ? '' : '(optional)'}</span><textarea class="story-textarea" id="review-comment" ${requiresComment ? 'required' : ''} placeholder="${requiresComment ? 'Explain what additional detail is needed.' : 'Add evidence, context or approval notes.'}"></textarea></label>
    <div class="row mt8"><button class="btn primary" id="confirm-transition">${esc(label)}</button><button class="btn" id="cancel-transition">Cancel</button></div>`;
  openDrawer(label, body, (drawer) => {
    drawer.querySelector('#cancel-transition').addEventListener('click', closeDrawer);
    drawer.querySelector('#confirm-transition').addEventListener('click', () => {
      const comment = drawer.querySelector('#review-comment').value.trim();
      if (requiresComment && !comment) { drawer.querySelector('#review-comment').reportValidity(); return; }
      transitionSuccessStory(storyId, nextStatus, { actorName: PERSONAS[store.role].name, comment });
      closeDrawer();
    });
  });
}

function openAssignSdm(cpeId) {
  const d = store.data;
  const vsat = d.cpe.find((item) => item.id === cpeId);
  const engagement = d.engagements.find((item) => item.id === vsat.engagementId);
  const sdms = [...new Set([PERSONAS.sdm.name, ...d.escalations.map((item) => item.sdmName).filter(Boolean)])].sort();
  const due = new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10);
  const body = `<div class="section-title">Assign VSAT follow-up to an SDM</div>
    <div class="field"><span class="field-key">Engagement</span><span class="field-val">${esc(engagement.customer)} · ${esc(engagement.program)}</span></div>
    <div class="field"><span class="field-key">VSAT</span><span class="field-val">${esc(vsat.id)} · 5/5</span></div>
    <label class="form-field"><span>SDM owner</span><select class="select" id="vsat-sdm">${sdms.map((name) => `<option>${esc(name)}</option>`).join('')}</select></label>
    <label class="form-field"><span>Action</span><textarea class="story-textarea" id="vsat-action">Partner with the Partner CSA and CSAM to create a success story from ${vsat.id}.</textarea></label>
    <label class="form-field"><span>Due date</span><input class="input" type="date" id="vsat-due" value="${due}" min="${new Date().toISOString().slice(0, 10)}"/></label>
    <button class="btn primary mt8" id="assign-vsat-action">${icon('flag', 15)} Assign action</button>`;
  openDrawer('VSAT success-story action', body, (drawer) => {
    drawer.querySelector('#assign-vsat-action').addEventListener('click', () => {
      addAction({
        engagementId: engagement.id, cpeId: vsat.id, source: 'success-story',
        title: drawer.querySelector('#vsat-action').value.trim(),
        ownerName: drawer.querySelector('#vsat-sdm').value,
        due: drawer.querySelector('#vsat-due').value, status: 'open',
      });
      closeDrawer();
    });
  });
}

function fiscalYear(dateValue) {
  const date = new Date(`${dateValue}T00:00:00Z`);
  return `FY${String(date.getUTCFullYear() + (date.getUTCMonth() >= 6 ? 1 : 0)).slice(-2)}`;
}

function defaultStory(engagementId, cpeId) {
  const d = store.data;
  const engagement = d.engagements.find((item) => item.id === engagementId) || d.engagements.find((item) => ['complete', 'in-delivery'].includes(item.status));
  const csa = d.csas.find((item) => item.id === engagement.assignedTo);
  const pod = csa ? d.pods.find((item) => item.id === csa.podId) : null;
  const partner = csa ? d.partners.find((item) => item.id === csa.partnerId) : null;
  const vsat = cpeId ? d.cpe.find((item) => item.id === cpeId) : null;
  const date = new Date(`${engagement.dueDate}T00:00:00Z`);
  return {
    engagementId: engagement.id, engagementIds: [engagement.id], cpeId: vsat?.id || null,
    feedbackSource: vsat ? 'VSAT survey' : 'CSAM / account team feedback',
    title: `${engagement.customer}: ${engagement.program} success`,
    headline: 'Partner-led delivery driving executive trust and actionable outcomes',
    summary: '', keyOutcomes: '', insights: '', impact: '',
    customerQuote: vsat?.verbatim || '', customerQuoteAttribution: `${engagement.customer} stakeholder`, csamQuote: '',
    tags: [engagement.track, engagement.program], family: engagement.track, eventNames: [engagement.program],
    timeZone: pod?.tz || 'Global', area: pod?.region || 'Global', country: '', industry: SUCCESS_STORY_INDUSTRIES[0],
    segment: SUCCESS_STORY_SEGMENTS[0], fiscalYear: fiscalYear(engagement.dueDate), month: MONTHS[date.getUTCMonth()],
    csamName: engagement.csamName, podLeadName: pod?.leadName || 'Unassigned', partnerName: partner?.name || csa?.vendor || 'Unassigned',
    partnerCsaName: csa?.name || PERSONAS[store.role].name, ownerName: PERSONAS[store.role].name,
    status: 'draft', customerLogoDataUrl: null, customerLogoName: null,
  };
}

function openStoryForm(id = null, prefill = {}) {
  const d = store.data;
  const existing = id ? d.successStories.find((item) => item.id === id) : null;
  if (id && !existing) return;
  const story = existing || defaultStory(prefill.engagementId, prefill.cpeId);
  const engagements = d.engagements.filter((item) => ['complete', 'in-delivery'].includes(item.status) || story.engagementIds.includes(item.id)).sort((a, b) => a.customer.localeCompare(b.customer));
  const allVsats = d.cpe.filter((item) => item.class === 'VSAT');
  const vsats = allVsats.filter((item) => story.engagementIds.includes(item.engagementId));

  const body = `<form id="story-form" class="story-form">
    <div class="form-section-title">Source and relationships</div>
    ${formSelect('Primary engagement', 'sf-engagement', engagements.map((item) => [item.id, `${item.customer} · ${item.program} (${item.status})`]), story.engagementId)}
    <label class="form-field"><span>Additional engagements / events</span><select class="select multi-select" id="sf-related" multiple>${engagements.filter((item) => item.id !== story.engagementId).map((item) => `<option value="${item.id}" ${story.engagementIds.includes(item.id) ? 'selected' : ''}>${esc(item.customer)} · ${esc(item.program)}</option>`).join('')}</select></label>
    ${formSelect('Linked VSAT', 'sf-vsat', [['', 'No VSAT linked'], ...vsats.map((item) => { const eng = d.engagements.find((candidate) => candidate.id === item.engagementId); return [item.id, `${item.id} · ${eng?.customer || item.engagementId} · 5/5`]; })], story.cpeId || '')}
    ${formSelect('Starting point', 'sf-source', [['VSAT survey', '5-star VSAT survey'], ['Customer written feedback', 'Customer written feedback'], ['CSAM / account team feedback', 'CSAM / account team feedback'], ['Impactful delivery', 'Impactful delivery']], story.feedbackSource)}
    <div class="form-section-title">Story content</div>
    ${formInput('Story title', 'sf-title', story.title, true)}
    ${formInput('PowerPoint headline', 'sf-headline', story.headline, true)}
    ${formTextarea('Engagement summary', 'sf-summary', story.summary, true)}
    ${formTextarea('Key outcomes (one per line)', 'sf-outcomes', story.keyOutcomes, true)}
    ${formTextarea('Insights (one per line)', 'sf-insights', story.insights, true)}
    ${formTextarea('Impact (one per line)', 'sf-impact', story.impact, true)}
    <div class="form-section-title">Approved written feedback</div>
    ${formTextarea('Customer quote', 'sf-customer-quote', story.customerQuote)}
    ${formInput('Customer name and role', 'sf-customer-attribution', story.customerQuoteAttribution)}
    ${formTextarea('CSAM quote', 'sf-csam-quote', story.csamQuote)}
    <div class="form-section-title">Mandatory SharePoint metadata</div>
    <div class="story-form-grid">
      ${formInput('Family', 'sf-family', story.family, true)}
      ${formInput('Events (comma-separated)', 'sf-events', story.eventNames.join(', '), true)}
      ${formInput('Time zone', 'sf-timezone', story.timeZone, true)}
      ${formInput('Area', 'sf-area', story.area, true)}
      ${formInput('Country / US OU', 'sf-country', story.country, true)}
      ${formSelect('Industry', 'sf-industry', SUCCESS_STORY_INDUSTRIES.map((item) => [item, item]), story.industry)}
      ${formSelect('Segment', 'sf-segment', SUCCESS_STORY_SEGMENTS.map((item) => [item, item]), story.segment)}
      ${formInput('Fiscal year', 'sf-fy', story.fiscalYear, true)}
      ${formSelect('Month', 'sf-month', MONTHS.map((item) => [item, item]), story.month)}
      ${formInput('Delivery Partner', 'sf-partner', story.partnerName, true)}
    </div>
    <div class="form-section-title">Delivery team</div>
    <div class="story-form-grid">
      ${formInput('CSAM', 'sf-csam', story.csamName, true)}
      ${formInput('POD Lead', 'sf-pod-lead', story.podLeadName, true)}
      ${formInput('Partner CSA', 'sf-partner-csa', story.partnerCsaName, true)}
      ${formInput('Story owner', 'sf-owner', story.ownerName, true)}
    </div>
    ${formInput('Tags (comma-separated)', 'sf-tags', story.tags.join(', '))}
    <label class="form-field"><span>Customer logo (PNG or JPEG)</span><input class="input file-input" id="sf-logo" type="file" accept="image/png,image/jpeg"/><small class="muted">${story.customerLogoName ? `Current: ${esc(story.customerLogoName)}` : 'Optional; exported into the official PowerPoint slide.'}</small></label>
    <div class="row wrap mt8"><button class="btn primary" type="submit">${existing ? 'Save draft' : 'Create draft'}</button><button class="btn" type="button" id="sf-cancel">Cancel</button></div>
  </form>`;

  openDrawer(existing ? `Edit success story · ${esc(existing.id)}` : 'New success story', body, (drawer) => {
    const form = drawer.querySelector('#story-form');
    const engagementSelect = drawer.querySelector('#sf-engagement');
    const relatedSelect = drawer.querySelector('#sf-related');
    const vsatSelect = drawer.querySelector('#sf-vsat');
    const refreshVsats = () => {
      const engagementIds = new Set([engagementSelect.value, ...[...relatedSelect.selectedOptions].map((option) => option.value)]);
      const selected = vsatSelect.value;
      const matches = allVsats.filter((item) => engagementIds.has(item.engagementId));
      vsatSelect.innerHTML = `<option value="">No VSAT linked</option>${matches.map((item) => {
        const engagement = d.engagements.find((candidate) => candidate.id === item.engagementId);
        return `<option value="${item.id}">${esc(item.id)} · ${esc(engagement?.customer || item.engagementId)} · 5/5</option>`;
      }).join('')}`;
      if (matches.some((item) => item.id === selected)) vsatSelect.value = selected;
    };
    engagementSelect.addEventListener('change', refreshVsats);
    relatedSelect.addEventListener('change', refreshVsats);
    drawer.querySelector('#sf-cancel').addEventListener('click', closeDrawer);
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const primaryId = drawer.querySelector('#sf-engagement').value;
      const additionalIds = [...drawer.querySelector('#sf-related').selectedOptions].map((option) => option.value).filter((engagementId) => engagementId !== primaryId);
      const logoFile = drawer.querySelector('#sf-logo').files[0];
      const logoData = logoFile ? await readFileDataUrl(logoFile) : story.customerLogoDataUrl;
      const values = {
        engagementId: primaryId, engagementIds: [primaryId, ...additionalIds], cpeId: drawer.querySelector('#sf-vsat').value || null,
        feedbackSource: drawer.querySelector('#sf-source').value, title: drawer.querySelector('#sf-title').value,
        headline: drawer.querySelector('#sf-headline').value, summary: drawer.querySelector('#sf-summary').value,
        keyOutcomes: drawer.querySelector('#sf-outcomes').value, insights: drawer.querySelector('#sf-insights').value,
        impact: drawer.querySelector('#sf-impact').value, customerQuote: drawer.querySelector('#sf-customer-quote').value,
        customerQuoteAttribution: drawer.querySelector('#sf-customer-attribution').value, csamQuote: drawer.querySelector('#sf-csam-quote').value,
        family: drawer.querySelector('#sf-family').value, eventNames: drawer.querySelector('#sf-events').value.split(','),
        timeZone: drawer.querySelector('#sf-timezone').value, area: drawer.querySelector('#sf-area').value,
        country: drawer.querySelector('#sf-country').value, industry: drawer.querySelector('#sf-industry').value,
        segment: drawer.querySelector('#sf-segment').value, fiscalYear: drawer.querySelector('#sf-fy').value,
        month: drawer.querySelector('#sf-month').value, partnerName: drawer.querySelector('#sf-partner').value,
        csamName: drawer.querySelector('#sf-csam').value, podLeadName: drawer.querySelector('#sf-pod-lead').value,
        partnerCsaName: drawer.querySelector('#sf-partner-csa').value, ownerName: drawer.querySelector('#sf-owner').value,
        tags: drawer.querySelector('#sf-tags').value.split(','), customerLogoDataUrl: logoData,
        customerLogoName: logoFile?.name || story.customerLogoName, status: story.status,
      };
      if (existing) updateSuccessStory(existing.id, values); else addSuccessStory(values);
      closeDrawer();
    });
  });
}

function formInput(label, id, value, required = false) {
  return `<label class="form-field"><span>${label}</span><input class="input" id="${id}" value="${esc(value || '')}" ${required ? 'required' : ''}/></label>`;
}
function formTextarea(label, id, value, required = false) {
  return `<label class="form-field"><span>${label}</span><textarea class="story-textarea" id="${id}" ${required ? 'required' : ''}>${esc(value || '')}</textarea></label>`;
}
function formSelect(label, id, options, selected) {
  return `<label class="form-field"><span>${label}</span><select class="select" id="${id}">${options.map(([value, text]) => `<option value="${esc(value)}" ${value === selected ? 'selected' : ''}>${esc(text)}</option>`).join('')}</select></label>`;
}
function readFileDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error(`Could not read ${file.name}.`));
    reader.readAsDataURL(file);
  });
}
function officialFilename(story, customer) {
  return `${story.fiscalYear}-${story.month}-${customer || 'Customer'}-${story.timeZone}.pptx`.replace(/[<>:"/\\|?*]+/g, '');
}
