// Inline SVG icons (stroke-based, currentColor). No external icon font needed.
const PATHS = {
  home: '<path d="M3 9.5 12 3l9 6.5"/><path d="M5 9.5V21h14V9.5"/><path d="M9.5 21v-6h5v6"/>',
  people: '<circle cx="9" cy="8" r="3.2"/><path d="M3.5 20a5.5 5.5 0 0 1 11 0"/><path d="M16 5.2a3.2 3.2 0 0 1 0 6.1"/><path d="M17 14.2A5.5 5.5 0 0 1 20.5 20"/>',
  personAdd: '<circle cx="9" cy="8" r="3.2"/><path d="M3.5 20a5.5 5.5 0 0 1 11 0"/><path d="M19 8v6"/><path d="M22 11h-6"/>',
  send: '<path d="M21 3 10.5 13.5"/><path d="M21 3 14.5 21 10.5 13.5 3 9.5z"/>',
  chat: '<path d="M21 15a2 2 0 0 1-2 2H8l-4 4V6a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2z"/>',
  star: '<path d="M12 3.5 14.7 9l6 .9-4.3 4.2 1 6-5.4-2.8L6.6 20.1l1-6L3.3 9.9l6-.9z"/>',
  warning: '<path d="M10.3 3.9 2 18a2 2 0 0 0 1.7 3h16.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4.5"/><path d="M12 17h.01"/>',
  trending: '<path d="M22 7 13.5 15.5 9 11 2 18"/><path d="M16 7h6v6"/>',
  report: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/><path d="M9 13h6"/><path d="M9 17h6"/>',
  emoji: '<circle cx="12" cy="12" r="9"/><path d="M8.5 14.5s1.3 2 3.5 2 3.5-2 3.5-2"/><path d="M9 9.5h.01"/><path d="M15 9.5h.01"/>',
  database: '<ellipse cx="12" cy="5.5" rx="8" ry="3"/><path d="M4 5.5v13c0 1.7 3.6 3 8 3s8-1.3 8-3v-13"/><path d="M20 12c0 1.7-3.6 3-8 3s-8-1.3-8-3"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
  bell: '<path d="M18 8.5a6 6 0 0 0-12 0c0 6.5-2.5 8.5-2.5 8.5h17S18 15 18 8.5"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>',
  chevronDown: '<path d="M6 9l6 6 6-6"/>',
  chevronRight: '<path d="M9 6l6 6-6 6"/>',
  x: '<path d="M18 6 6 18"/><path d="M6 6l12 12"/>',
  menu: '<path d="M3 6h18"/><path d="M3 12h18"/><path d="M3 18h18"/>',
  flag: '<path d="M5 21V4"/><path d="M5 4s1.2-1 4-1 4.8 2 7 2 4-1 4-1v9s-1.8 1-4 1-4.2-2-7-2-4 1-4 1"/>',
  building: '<path d="M4 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16"/><path d="M14 9h4a2 2 0 0 1 2 2v10"/><path d="M4 21h18"/><path d="M8 7h2"/><path d="M8 11h2"/><path d="M8 15h2"/>',
  check: '<circle cx="12" cy="12" r="9"/><path d="M8.5 12.5 11 15l4.5-5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
  lock: '<rect x="4" y="10.5" width="16" height="10" rx="2"/><path d="M7.5 10.5V7a4.5 4.5 0 0 1 9 0v3.5"/>',
  filter: '<path d="M3 4h18l-7 8.5V20l-4 1v-8.5z"/>',
  wrench: '<path d="M15 4a5 5 0 0 0-6 6L3 16a2.5 2.5 0 0 0 3.5 3.5L12 14a5 5 0 0 0 6-6l-3 3-2.5-2.5z"/>',
  docSearch: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6"/><path d="M14 3v6h6"/><circle cx="16" cy="16" r="3"/><path d="M21 21l-2-2"/>',
  thumbUp: '<path d="M7 10v10"/><path d="M7 10 11 3a2 2 0 0 1 2 2v4h5.5a2 2 0 0 1 2 2.4l-1.4 7A2 2 0 0 1 17 20H7"/>',
  thumbDown: '<path d="M17 14V4"/><path d="M17 14 13 21a2 2 0 0 1-2-2v-4H5.5a2 2 0 0 1-2-2.4l1.4-7A2 2 0 0 1 7 4h10"/>',
  minus: '<path d="M5 12h14"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  moon: '<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.8 6.8 0 0 0 10.5 10.5z"/>',
  sun: '<circle cx="12" cy="12" r="4.2"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.5 1.5M17.6 17.6l1.5 1.5M17.6 6.4l1.5-1.5M4.9 19.1l1.5-1.5"/>',
};

const FILLED = {
  sparkle: '<path d="M12 2c.4 3.4 1.6 4.6 5 5-3.4.4-4.6 1.6-5 5-.4-3.4-1.6-4.6-5-5 3.4-.4 4.6-1.6 5-5z" fill="currentColor" stroke="none"/><path d="M18.5 13c.2 1.7.8 2.3 2.5 2.5-1.7.2-2.3.8-2.5 2.5-.2-1.7-.8-2.3-2.5-2.5 1.7-.2 2.3-.8 2.5-2.5z" fill="currentColor" stroke="none"/>',
};

export function icon(name, size = 20) {
  if (FILLED[name]) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true">${FILLED[name]}</svg>`;
  }
  const p = PATHS[name] || PATHS.database;
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
}
