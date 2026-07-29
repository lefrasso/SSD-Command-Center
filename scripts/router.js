// Hash-based router for the single-page shell.
export function parseHash() {
  const h = location.hash.slice(1) || '/home';
  const [path, qs] = h.split('?');
  return { path: path || '/home', id: (path || '/home').replace(/^\//, '') || 'home', params: new URLSearchParams(qs || '') };
}
export function navigate(path) { location.hash = path; }
export function onRoute(fn) { window.addEventListener('hashchange', fn); }
