// Sentiment — D365-inspired seven-level intensity, live monitoring, drivers and alerts.
import { store, sentimentBreakdown, acknowledgeSentimentAlert } from '../store.js';
import {
  pageHeader, kpiCard, aiChip, esc, badge, COLORS, clearCharts, donut, bar, line, openDrawer, closeDrawer, emptyState,
} from '../components.js';
import { icon } from '../icons.js';
import { earlyWarnings } from '../ai.js';
import { openAssignActionDrawer } from '../actions.js';
import { navigate } from '../router.js';

const LEVELS = [
  ['very-positive', 'Very positive', '#0b6a0b'],
  ['positive', 'Positive', '#107c41'],
  ['slightly-positive', 'Slightly positive', '#5a9e2f'],
  ['neutral', 'Neutral', '#616161'],
  ['slightly-negative', 'Slightly negative', '#d18b00'],
  ['negative', 'Negative', '#d83b01'],
  ['very-negative', 'Very negative', '#a80000'],
];
const TABS = [['overview', 'Overview'], ['monitor', 'Live monitor'], ['topics', 'Topics & drivers'], ['alerts', 'Alerts']];

let tab = 'overview';
let fChannel = 'All';
let fLevel = 'All';
let fTz = 'All';
let fPartner = 'All';

const levelMeta = (level) => LEVELS.find(([key]) => key === level) || ['neutral', level, COLORS.neutral];
const signed = (value) => `${value > 0 ? '+' : ''}${value}`;

function engagementMeta(engagementId) {
  const d = store.data;
  const engagement = d.engagements.find((item) => item.id === engagementId);
  const csa = engagement?.assignedTo ? d.csas.find((item) => item.id === engagement.assignedTo) : null;
  const pod = csa ? d.pods.find((item) => item.id === csa.podId) : null;
  const partner = csa ? d.partners.find((item) => item.id === csa.partnerId) : null;
  return { engagement, csa, pod, partner };
}

function filteredSignals() {
  return store.data.sentimentSignals.filter((signal) => {
    const meta = engagementMeta(signal.engagementId);
    return (fChannel === 'All' || signal.channel === fChannel)
      && (fLevel === 'All' || signal.level === fLevel)
      && (fTz === 'All' || meta.pod?.tz === fTz)
      && (fPartner === 'All' || signal.partnerId === fPartner);
  });
}

function intensityPill(level) {
  const [, label, color] = levelMeta(level);
  return `<span class="sentiment-intensity" style="color:${color};border-color:${color};background:color-mix(in srgb, ${color} 12%, var(--bg-1))"><span class="sentiment-wave">${icon(level.includes('positive') ? 'thumbUp' : level.includes('negative') ? 'thumbDown' : 'minus', 13)}</span>${esc(label)}</span>`;
}

function trendForEngagement(engagementId) {
  const signals = store.data.sentimentSignals.filter((item) => item.engagementId === engagementId).sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  if (signals.length < 2) return { direction: 'flat', delta: 0 };
  const delta = Math.round((signals[0].score - signals[1].score) * 100);
  return { direction: delta > 8 ? 'up' : delta < -8 ? 'down' : 'flat', delta };
}

function trendHtml(engagementId) {
  const trend = trendForEngagement(engagementId);
  const color = trend.direction === 'up' ? COLORS.positive : trend.direction === 'down' ? COLORS.negative : COLORS.neutral;
  const glyph = trend.direction === 'up' ? '▲' : trend.direction === 'down' ? '▼' : '—';
  return `<span style="color:${color};font-weight:700" title="${signed(trend.delta)} points from prior signal">${glyph} ${signed(trend.delta)}</span>`;
}

export function renderSentiment(container, initialTab) {
  if (TABS.some(([key]) => key === initialTab)) tab = initialTab;
  clearCharts();
  const signals = filteredSignals();
  const channels = [...new Set(store.data.sentimentSignals.map((item) => item.channel))].sort();
  const timeZones = [...new Set(store.data.pods.map((item) => item.tz))].sort();
  const options = (values, selected, allLabel) => `<option value="All">${allLabel}</option>${values.map((item) => {
    const [value, label] = Array.isArray(item) ? item : [item, item];
    return `<option value="${esc(value)}" ${value === selected ? 'selected' : ''}>${esc(label)}</option>`;
  }).join('')}`;
  const bd = sentimentBreakdown({ ...store.data, sentimentSignals: signals });
  const average = signals.length ? Math.round((signals.reduce((sum, item) => sum + item.score, 0) / signals.length) * 100) : 0;
  const openAlerts = signals.filter((item) => item.alertStatus === 'open').length;
  const averageConfidence = signals.length ? Math.round((signals.reduce((sum, item) => sum + item.confidence, 0) / signals.length) * 100) : 0;
  const negativeEngagements = new Set(signals.filter((item) => item.score <= -0.15).map((item) => item.engagementId)).size;

  container.innerHTML = `
    ${pageHeader({
      title: 'Sentiment',
      description: 'D365-inspired interaction sentiment across CPE, Teams and escalations — seven intensity levels, trends, topics, multilingual scoring and supervisor alerts.',
      actions: `${aiChip('NLP')} ${badge('7-level intensity', 'tint-info')}`,
    })}
    <div class="card pad mb16 sentiment-policy">
      <div><strong>Analysis policy</strong><span>CPE Survey, Teams and Escalation channels enabled · non-English text is translated before scoring · unsupported languages remain unscored · profanity forces negative intensity.</span></div>
      <div class="row wrap">
        <select class="select" id="sent-channel">${options(channels, fChannel, 'All channels')}</select>
        <select class="select" id="sent-level">${options(LEVELS.map(([key, label]) => [key, label]), fLevel, 'All intensities')}</select>
        <select class="select" id="sent-tz">${options(timeZones, fTz, 'All time zones')}</select>
        <select class="select" id="sent-partner">${options(store.data.partners.map((partner) => [partner.id, partner.name]), fPartner, 'All partners')}</select>
        <button class="btn sm" id="sent-reset">Reset</button>
      </div>
    </div>
    <div class="kpi-grid">
      ${kpiCard({ label: 'Sentiment index', value: signed(average), iconName: 'emoji', tone: average >= 0 ? COLORS.positive : COLORS.negative, hint: '-100 to +100' })}
      ${kpiCard({ label: 'Negative engagements', value: negativeEngagements, iconName: 'warning', tone: negativeEngagements ? COLORS.warning : COLORS.positive })}
      ${kpiCard({ label: 'Open alerts', value: openAlerts, iconName: 'bell', tone: openAlerts ? COLORS.negative : COLORS.positive })}
      ${kpiCard({ label: 'Scored interactions', value: signals.length, iconName: 'chat', hint: `${bd.positive} positive · ${bd.neutral} neutral · ${bd.negative} negative` })}
      ${kpiCard({ label: 'Avg confidence', value: `${averageConfidence}%`, iconName: 'check', hint: `${signals.filter((item) => item.translated).length} translated` })}
    </div>
    <div class="tabs">${TABS.map(([key, label]) => `<button class="tab ${tab === key ? 'active' : ''}" data-sent-tab="${key}">${label}${key === 'alerts' && openAlerts ? ` ${badge(String(openAlerts), 'tint-danger')}` : ''}</button>`).join('')}</div>
    <div id="sent-content"></div>`;

  const content = container.querySelector('#sent-content');
  if (tab === 'overview') renderOverview(content, signals);
  else if (tab === 'monitor') renderMonitor(content, signals);
  else if (tab === 'topics') renderTopics(content, signals);
  else renderAlerts(content, signals);

  container.querySelectorAll('[data-sent-tab]').forEach((button) => button.addEventListener('click', () => {
    tab = button.getAttribute('data-sent-tab');
    renderSentiment(container);
  }));
  const bindFilter = (id, setter) => container.querySelector(id).addEventListener('change', (event) => { setter(event.target.value); renderSentiment(container); });
  bindFilter('#sent-channel', (value) => { fChannel = value; });
  bindFilter('#sent-level', (value) => { fLevel = value; });
  bindFilter('#sent-tz', (value) => { fTz = value; });
  bindFilter('#sent-partner', (value) => { fPartner = value; });
  container.querySelector('#sent-reset').addEventListener('click', () => {
    fChannel = 'All'; fLevel = 'All'; fTz = 'All'; fPartner = 'All'; renderSentiment(container);
  });
  container.querySelectorAll('[data-signal]').forEach((row) => row.addEventListener('click', () => openSignal(row.getAttribute('data-signal'))));
}

function renderOverview(host, signals) {
  const warn = earlyWarnings({ ...store.data, sentimentSignals: signals });
  const periods = [...new Set(signals.map((item) => item.timestamp.slice(0, 7)))].sort();
  const trend = periods.map((period) => {
    const items = signals.filter((item) => item.timestamp.startsWith(period));
    return items.length ? Math.round((items.reduce((sum, item) => sum + item.score, 0) / items.length) * 100) : 0;
  });
  const levelCounts = LEVELS.map(([level]) => signals.filter((item) => item.level === level).length);
  const channels = [...new Set(signals.map((item) => item.channel))];
  const byChannel = channels.map((channel) => {
    const items = signals.filter((item) => item.channel === channel);
    return Math.round((items.reduce((sum, item) => sum + item.score, 0) / Math.max(1, items.length)) * 100);
  });
  const latest = latestByEngagement(signals).slice(0, 8);

  host.innerHTML = `
    <div class="card pad mb16" style="border-left:4px solid ${COLORS.warning}"><div class="row mb8">${icon('sparkle', 16)}<strong>Supervisor early warning</strong>${aiChip()}</div><div>${esc(warn.text)}</div></div>
    <div class="two-col">
      <div class="card chart-card"><div class="chart-head"><strong>Seven-level sentiment intensity</strong></div><div class="chart-holder" style="height:250px"><canvas id="sent-mix"></canvas></div></div>
      <div class="card chart-card"><div class="chart-head"><strong>Sentiment index trend</strong></div><div class="chart-holder" style="height:250px"><canvas id="sent-trend"></canvas></div></div>
    </div>
    <div class="two-col">
      <div class="card chart-card"><div class="chart-head"><strong>Index by channel</strong></div><div class="chart-holder" style="height:230px"><canvas id="sent-channel-chart"></canvas></div></div>
      <div class="card pad"><strong>Conversations needing attention</strong><div class="mt8">${latest.filter((item) => item.score < 0).map(signalRowCompact).join('') || '<div class="muted">No negative conversations in scope.</div>'}</div></div>
    </div>`;
  donut(host.querySelector('#sent-mix'), { labels: LEVELS.map(([, label]) => label), values: levelCounts, colors: LEVELS.map(([, , color]) => color) });
  line(host.querySelector('#sent-trend'), { labels: periods, datasets: [{ label: 'Sentiment index', values: trend, color: COLORS.brand }] });
  bar(host.querySelector('#sent-channel-chart'), { labels: channels, values: byChannel, color: '#6b69d6', label: 'Index' });
}

function latestByEngagement(signals) {
  const latest = new Map();
  [...signals].sort((a, b) => b.timestamp.localeCompare(a.timestamp)).forEach((signal) => {
    if (!latest.has(signal.engagementId)) latest.set(signal.engagementId, signal);
  });
  return [...latest.values()].sort((a, b) => a.score - b.score || b.timestamp.localeCompare(a.timestamp));
}

function signalRowCompact(signal) {
  return `<button class="sentiment-compact" data-signal="${signal.id}"><span>${intensityPill(signal.level)}</span><span><strong>${esc(signal.customer)}</strong><small>${esc(signal.channel)} · ${esc(signal.themes.join(', '))}</small></span>${trendHtml(signal.engagementId)}</button>`;
}

function renderMonitor(host, signals) {
  const latest = latestByEngagement(signals);
  host.innerHTML = `
    <div class="row wrap mb8" style="justify-content:space-between"><div><strong class="mbr-section-title">Live sentiment monitor</strong><div class="muted">Latest scored interaction per engagement, sorted from most negative.</div></div>${badge(`${latest.length} conversations`, 'tint-info')}</div>
    <div class="table-wrap"><table class="grid sentiment-table"><thead><tr><th>Customer / engagement</th><th>Intensity</th><th>Trend</th><th>Channel</th><th>Partner</th><th>Language</th><th>Confidence</th><th>Topics</th><th>Updated</th><th>Alert</th></tr></thead><tbody>
      ${latest.slice(0, 100).map((signal) => { const meta = engagementMeta(signal.engagementId); return `<tr class="clickable" data-signal="${signal.id}"><td><strong>${esc(signal.customer)}</strong><div class="muted">${esc(signal.engagementId)} · ${esc(meta.engagement?.program || '')}</div></td><td>${intensityPill(signal.level)}</td><td>${trendHtml(signal.engagementId)}</td><td>${esc(signal.channel)}</td><td>${esc(meta.partner?.name || '—')}</td><td>${esc(signal.language)}${signal.translated ? `<div>${badge('Translated', 'outline')}</div>` : ''}</td><td>${Math.round(signal.confidence * 100)}%</td><td>${signal.themes.map((theme) => badge(theme, 'outline')).join(' ')}</td><td>${esc(signal.timestamp.slice(0, 16).replace('T', ' '))}</td><td>${signal.alertStatus === 'open' ? badge('Open', 'tint-danger') : signal.alertStatus === 'acknowledged' ? badge('Acknowledged', 'tint-info') : '—'}</td></tr>`; }).join('')}
    </tbody></table></div>`;
}

function renderTopics(host, signals) {
  const topicMap = new Map();
  signals.forEach((signal) => signal.themes.forEach((theme) => {
    const current = topicMap.get(theme) || { theme, signals: [], engagements: new Set() };
    current.signals.push(signal);
    current.engagements.add(signal.engagementId);
    topicMap.set(theme, current);
  }));
  const topics = [...topicMap.values()].map((item) => ({
    ...item,
    score: Math.round((item.signals.reduce((sum, signal) => sum + signal.score, 0) / item.signals.length) * 100),
    negativeShare: Math.round((item.signals.filter((signal) => signal.score <= -0.15).length / item.signals.length) * 100),
  })).sort((a, b) => b.signals.length - a.signals.length);
  const partnerRows = store.data.partners.map((partner) => {
    const items = signals.filter((signal) => signal.partnerId === partner.id);
    return { label: partner.name, count: items.length, score: items.length ? Math.round((items.reduce((sum, signal) => sum + signal.score, 0) / items.length) * 100) : 0 };
  }).filter((item) => item.count);

  host.innerHTML = `
    <div><strong class="mbr-section-title">Topics & drivers</strong><div class="muted mb16">Theme volume, sentiment intensity, negative share, and impacted engagements.</div></div>
    <div class="two-col">
      <div class="card chart-card"><div class="chart-head"><strong>Top topic volume</strong></div><div class="chart-holder" style="height:260px"><canvas id="sent-topics"></canvas></div></div>
      <div class="card chart-card"><div class="chart-head"><strong>Sentiment index by partner</strong></div><div class="chart-holder" style="height:260px"><canvas id="sent-partners"></canvas></div></div>
    </div>
    <div class="card pad"><strong>Driver analysis</strong><div class="table-wrap mt8"><table class="grid"><thead><tr><th>Topic</th><th>Signals</th><th>Engagements</th><th>Sentiment index</th><th>Negative share</th><th>Driver status</th></tr></thead><tbody>
      ${topics.map((topic) => `<tr><td><strong>${esc(topic.theme)}</strong></td><td>${topic.signals.length}</td><td>${topic.engagements.size}</td><td style="color:${topic.score >= 0 ? COLORS.positive : COLORS.negative}">${signed(topic.score)}</td><td>${topic.negativeShare}%</td><td>${topic.negativeShare >= 35 ? badge('Negative driver', 'tint-danger') : topic.score >= 20 ? badge('Strength', 'tint-info') : badge('Monitor', 'tint-warn')}</td></tr>`).join('')}
    </tbody></table></div></div>`;
  bar(host.querySelector('#sent-topics'), { labels: topics.slice(0, 10).map((item) => item.theme), values: topics.slice(0, 10).map((item) => item.signals.length), color: COLORS.brand, label: 'Signals' });
  bar(host.querySelector('#sent-partners'), { labels: partnerRows.map((item) => item.label), values: partnerRows.map((item) => item.score), color: '#2aa0a4', label: 'Index' });
}

function renderAlerts(host, signals) {
  const alerts = signals.filter((signal) => signal.alertStatus !== 'none').sort((a, b) => {
    if (a.alertStatus !== b.alertStatus) return a.alertStatus === 'open' ? -1 : 1;
    return a.score - b.score || b.timestamp.localeCompare(a.timestamp);
  });
  const open = alerts.filter((item) => item.alertStatus === 'open');
  host.innerHTML = `
    <div class="kpi-grid">
      ${kpiCard({ label: 'Open alerts', value: open.length, iconName: 'bell', tone: open.length ? COLORS.negative : COLORS.positive })}
      ${kpiCard({ label: 'Critical', value: open.filter((item) => item.score <= -0.75).length, iconName: 'warning', tone: COLORS.sev1, hint: 'Very negative' })}
      ${kpiCard({ label: 'Acknowledged', value: alerts.filter((item) => item.alertStatus === 'acknowledged').length, iconName: 'check', tone: COLORS.positive })}
      ${kpiCard({ label: 'Rapid declines', value: open.filter((item) => trendForEngagement(item.engagementId).direction === 'down').length, iconName: 'trending', tone: COLORS.warning })}
    </div>
    ${alerts.length ? `<div class="table-wrap"><table class="grid sentiment-table"><thead><tr><th>Severity</th><th>Customer / engagement</th><th>Signal</th><th>Trend</th><th>Channel</th><th>Confidence</th><th>Topics</th><th>Status</th></tr></thead><tbody>
      ${alerts.map((signal) => `<tr class="clickable" data-signal="${signal.id}"><td>${signal.score <= -0.75 ? badge('Critical', 'tint-danger') : badge('Warning', 'tint-warn')}</td><td><strong>${esc(signal.customer)}</strong><div class="muted">${esc(signal.engagementId)}</div></td><td>${intensityPill(signal.level)}<div class="muted mt8" style="white-space:normal;max-width:320px">“${esc(signal.text)}”</div></td><td>${trendHtml(signal.engagementId)}</td><td>${esc(signal.channel)}</td><td>${Math.round(signal.confidence * 100)}%</td><td>${signal.themes.map((theme) => badge(theme, 'outline')).join(' ')}</td><td>${signal.alertStatus === 'open' ? badge('Open', 'tint-danger') : badge('Acknowledged', 'tint-info')}</td></tr>`).join('')}
    </tbody></table></div>` : emptyState({ title: 'No sentiment alerts', description: 'No interactions in scope meet the negative-intensity threshold.' })}`;
}

function openSignal(id) {
  const signal = store.data.sentimentSignals.find((item) => item.id === id);
  if (!signal) return;
  const meta = engagementMeta(signal.engagementId);
  const timeline = store.data.sentimentSignals.filter((item) => item.engagementId === signal.engagementId).sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 10);
  const body = `
    <div class="row wrap mb16">${intensityPill(signal.level)}${signal.alertStatus === 'open' ? badge('Open alert', 'tint-danger') : signal.alertStatus === 'acknowledged' ? badge('Acknowledged', 'tint-info') : ''}${signal.translated ? badge(`Translated from ${signal.language}`, 'outline') : badge(signal.language, 'outline')}</div>
    <div class="field"><span class="field-key">Customer</span><span class="field-val">${esc(signal.customer)}</span></div>
    <div class="field"><span class="field-key">Engagement</span><span class="field-val">${esc(signal.engagementId)} · ${esc(meta.engagement?.program || '')}</span></div>
    <div class="field"><span class="field-key">Partner / CSA</span><span class="field-val">${esc(meta.partner?.name || '—')} · ${esc(meta.csa?.name || '—')}</span></div>
    <div class="field"><span class="field-key">Channel / source</span><span class="field-val">${esc(signal.channel)} · ${esc(signal.sourceId)}</span></div>
    <div class="field"><span class="field-key">Score / confidence</span><span class="field-val">${signed(Math.round(signal.score * 100))} · ${Math.round(signal.confidence * 100)}%</span></div>
    <div class="story-quote">“${esc(signal.text)}”</div>
    <div class="section-title">Topics</div><div class="row wrap">${signal.themes.map((theme) => badge(theme, 'outline')).join('')}</div>
    <div class="section-title">Interaction trend</div><div class="timeline">${timeline.map((item) => `<div class="tl-item"><div class="row" style="justify-content:space-between">${intensityPill(item.level)}<span class="tl-date">${esc(item.timestamp.slice(0, 16).replace('T', ' '))}</span></div><div class="muted mt8">${esc(item.channel)} · “${esc(item.text)}”</div></div>`).join('')}</div>
    <div class="section-title">Supervisor actions</div><div class="row wrap">
      ${signal.alertStatus === 'open' ? `<button class="btn primary" id="sent-ack">${icon('check', 15)} Acknowledge</button>` : ''}
      <button class="btn" id="sent-action">${icon('flag', 15)} Assign action</button>
      <button class="btn" id="sent-engagement">${icon('send', 15)} Open engagement</button>
    </div>`;
  openDrawer(`Sentiment signal · ${esc(signal.id)}`, body, (drawer) => {
    drawer.querySelector('#sent-ack')?.addEventListener('click', () => { acknowledgeSentimentAlert(signal.id); closeDrawer(); });
    drawer.querySelector('#sent-action').addEventListener('click', () => openAssignActionDrawer({
      engagementId: signal.engagementId,
      sentimentSignalId: signal.id,
      source: 'sentiment',
      prefillTitle: `Follow up on ${levelMeta(signal.level)[1].toLowerCase()} ${signal.channel} sentiment: ${signal.text}`,
    }));
    drawer.querySelector('#sent-engagement').addEventListener('click', () => { closeDrawer(); navigate('/engagements'); });
  });
}
