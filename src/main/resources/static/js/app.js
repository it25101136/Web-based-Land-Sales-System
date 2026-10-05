/* Hash router + bootstrap */
'use strict';

const ROUTES = [
  [/^\/$/, 'home'],
  [/^\/buy$/, 'buy'],
  [/^\/land\/(\d+)$/, 'land'],
  [/^\/sell$/, 'sell'],
  [/^\/locations$/, 'locations'],
  [/^\/about$/, 'about'],
  [/^\/contact$/, 'contact'],
  [/^\/help$/, 'help'],
  [/^\/login$/, 'login'],
  [/^\/register$/, 'register'],
  [/^\/forgot$/, 'forgot'],
  [/^\/buyer$/, 'buyer'],
  [/^\/seller$/, 'seller'],
  [/^\/admin$/, 'admin'],
  [/^\/admin\/users$/, 'adminUsers'],
  [/^\/admin\/lands$/, 'adminLands'],
  [/^\/support$/, 'support'],
  [/^\/wishlist$/, 'wishlist'],
  [/^\/compare$/, 'compare'],
  [/^\/bookings$/, 'bookings'],
  [/^\/payments$/, 'payments'],
  [/^\/messages$/, 'messages'],
  [/^\/notifications$/, 'notifications'],
  [/^\/documents$/, 'documents'],
  [/^\/reviews$/, 'reviews'],
  [/^\/reports$/, 'reports'],
  [/^\/profile$/, 'profile'],
  [/^\/customers$/, 'customers'],
  [/^\/customers\/(\d+)$/, 'customerDetail'],
  [/^\/inquiries$/, 'inquiries'],
  [/^\/inquiries\/(\d+)$/, 'inquiryDetail'],
  [/^\/inquiries\/new$/, 'inquiryNew'],
  [/^\/dashboard$/, 'redirectHome']
];

const Router = {
  go(path) { location.hash = '#' + path; },
  async render() {
    const raw = location.hash.slice(1) || '/';
    const [path, query] = raw.split('?');
    const host = document.getElementById('app');
    for (const [re, name] of ROUTES) {
      const m = path.match(re);
      if (!m) continue;
      if (name === 'redirectHome') { Router.go(Auth.home()); return; }
      Chrome.renderNav();
      window.scrollTo(0, 0);
      try { await Pages[name](host, query || '', m[1]); }
      catch (e) { console.error(e); host.innerHTML = `<div class="wrap"><section>${UI.empty('⚠️', 'Something went wrong', e.message)}</section></div>`; }
      Chrome.renderNav();
      return;
    }
    host.innerHTML = `<div class="wrap"><section>${UI.empty('🧭', 'Page not found',
      'The page "' + esc(path) + '" does not exist.', '<a class="btn btn-primary" href="#/">Back to home</a>')}</section></div>`;
  }
};

(async function boot() {
  document.documentElement.lang = State.lang;
  try { State.meta = await API.get('/api/locations'); }
  catch (_) { State.meta = { provinces: [], districts: {}, cities: {}, land_types: [], expressways: [], nearby_places: [] }; }
  await Auth.boot();
  Chrome.renderNav();
  Chrome.renderFooter();
  Chrome.renderBot();
  window.addEventListener('hashchange', () => Router.render());
  await Router.render();
  document.getElementById('boot').remove();
})();
