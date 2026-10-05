/* ================================================================
   LandHub Sri Lanka — frontend core: API client, state, i18n, UI kit
   ================================================================ */
'use strict';

/* ---------------- API client ---------------- */
const API = {
  token: localStorage.getItem('lh_token') || null,
  setToken(t) { this.token = t; t ? localStorage.setItem('lh_token', t) : localStorage.removeItem('lh_token'); },
  async req(method, path, body) {
    const headers = { 'Content-Type': 'application/json' };
    if (this.token) headers.Authorization = 'Bearer ' + this.token;
    const res = await fetch(path, { method, headers, body: body ? JSON.stringify(body) : undefined });
    const ct = res.headers.get('content-type') || '';
    const data = ct.includes('json') ? await res.json() : await res.text();
    if (!res.ok) {
      const err = new Error((data && data.error) || 'Request failed');
      err.details = data && data.details; err.status = res.status;
      if (res.status === 401 && State.user) { Auth.logout(true); }
      throw err;
    }
    return data;
  },
  get(p) { return this.req('GET', p); },
  post(p, b) { return this.req('POST', p, b); },
  put(p, b) { return this.req('PUT', p, b); },
  del(p) { return this.req('DELETE', p); },
  qs(obj) {
    const p = new URLSearchParams();
    Object.entries(obj || {}).forEach(([k, v]) => { if (v !== '' && v !== null && v !== undefined && v !== false) p.set(k, v); });
    const s = p.toString(); return s ? '?' + s : '';
  }
};

/* ---------------- Global state ---------------- */
const State = {
  user: null,
  lang: localStorage.getItem('lh_lang') || 'en',
  meta: null,                                   // locations reference data
  wishlist: new Set(JSON.parse(localStorage.getItem('lh_wish') || '[]')),
  compare: JSON.parse(localStorage.getItem('lh_cmp') || '[]'),
  notif: 0,
  saveCompare() { localStorage.setItem('lh_cmp', JSON.stringify(this.compare)); },
  saveWish() { localStorage.setItem('lh_wish', JSON.stringify([...this.wishlist])); }
};

/* ---------------- i18n ---------------- */
const I18N = {
  en: {
    home: 'Home', buy: 'Buy Land', sell: 'Sell Land', locations: 'Locations', about: 'About Us',
    contact: 'Contact', help: 'Help', login: 'Login', register: 'Register', post: 'Post Your Land',
    hero_title: 'Find Your Perfect Land in <em>Sri Lanka</em>',
    hero_sub: 'Discover residential, commercial and investment properties across Sri Lanka — with verified documents, transparent per-perch pricing and trusted sellers.',
    where: 'Where do you want to buy land?', search: 'Search Lands',
    province: 'Province', district: 'District', city: 'City', price: 'Price', size: 'Land Size', type: 'Land Type',
    featured: 'Featured Land Listings', view: 'View Details', contact_seller: 'Contact Seller',
    verified: 'Verified Property', perches: 'Perches', per_perch: 'per Perch', dashboard: 'Dashboard',
    logout: 'Logout', wishlist: 'Wishlist', compare: 'Compare', reserve: 'Reserve Land',
    all_provinces: 'All Provinces', all_districts: 'All Districts', all_cities: 'All Cities', any: 'Any',
    explore: 'Explore Sri Lanka', negotiable: 'Negotiable'
  },
  si: {
    home: 'මුල් පිටුව', buy: 'ඉඩම් මිලදී ගන්න', sell: 'ඉඩම විකුණන්න', locations: 'ස්ථාන', about: 'අප ගැන',
    contact: 'සම්බන්ධ වන්න', help: 'උදව්', login: 'ඇතුල් වන්න', register: 'ලියාපදිංචි වන්න', post: 'ඔබේ ඉඩම දාන්න',
    hero_title: 'ඔබට ගැලපෙන ඉඩම <em>ශ්‍රී ලංකාවෙන්</em> සොයාගන්න',
    hero_sub: 'ශ්‍රී ලංකාව පුරා නේවාසික, වාණිජ සහ ආයෝජන ඉඩම් සොයාගන්න — සත්‍යාපිත ලේඛන සහ පර්චස් අනුව පැහැදිලි මිල ගණන් සමඟ.',
    where: 'ඔබට ඉඩම මිලදී ගැනීමට අවශ්‍ය කොහෙද?', search: 'ඉඩම් සොයන්න',
    province: 'පළාත', district: 'දිස්ත්‍රික්කය', city: 'නගරය', price: 'මිල', size: 'ඉඩම් ප්‍රමාණය', type: 'ඉඩම් වර්ගය',
    featured: 'විශේෂිත ඉඩම් දැන්වීම්', view: 'විස්තර බලන්න', contact_seller: 'විකුණන්නා අමතන්න',
    verified: 'සත්‍යාපිත ඉඩම', perches: 'පර්චස්', per_perch: 'පර්චසයකට', dashboard: 'උපකරණ පුවරුව',
    logout: 'ඉවත් වන්න', wishlist: 'ප්‍රියතම', compare: 'සංසන්දනය', reserve: 'ඉඩම වෙන් කරන්න',
    all_provinces: 'සියලු පළාත්', all_districts: 'සියලු දිස්ත්‍රික්ක', all_cities: 'සියලු නගර', any: 'ඕනෑම',
    explore: 'ශ්‍රී ලංකාව ගවේෂණය', negotiable: 'කතා කළ හැක'
  },
  ta: {
    home: 'முகப்பு', buy: 'நிலம் வாங்க', sell: 'நிலம் விற்க', locations: 'இடங்கள்', about: 'எங்களைப் பற்றி',
    contact: 'தொடர்பு', help: 'உதவி', login: 'உள்நுழை', register: 'பதிவு', post: 'உங்கள் நிலத்தை இடுங்கள்',
    hero_title: '<em>இலங்கையில்</em> உங்கள் சிறந்த நிலத்தைக் கண்டறியுங்கள்',
    hero_sub: 'இலங்கை முழுவதும் குடியிருப்பு, வணிக மற்றும் முதலீட்டு நிலங்களைக் கண்டறியுங்கள் — சரிபார்க்கப்பட்ட ஆவணங்கள் மற்றும் தெளிவான விலையுடன்.',
    where: 'நீங்கள் எங்கே நிலம் வாங்க விரும்புகிறீர்கள்?', search: 'நிலங்களைத் தேடு',
    province: 'மாகாணம்', district: 'மாவட்டம்', city: 'நகரம்', price: 'விலை', size: 'நில அளவு', type: 'நில வகை',
    featured: 'சிறப்பு நில பட்டியல்கள்', view: 'விவரங்கள்', contact_seller: 'விற்பனையாளரைத் தொடர்பு கொள்',
    verified: 'சரிபார்க்கப்பட்ட நிலம்', perches: 'பர்ச்', per_perch: 'ஒரு பர்ச்சுக்கு', dashboard: 'கட்டுப்பாட்டு பலகை',
    logout: 'வெளியேறு', wishlist: 'விருப்பப்பட்டியல்', compare: 'ஒப்பிடு', reserve: 'நிலத்தை முன்பதிவு செய்',
    all_provinces: 'அனைத்து மாகாணங்கள்', all_districts: 'அனைத்து மாவட்டங்கள்', all_cities: 'அனைத்து நகரங்கள்', any: 'ஏதேனும்',
    explore: 'இலங்கையை ஆராயுங்கள்', negotiable: 'பேச்சுவார்த்தை'
  }
};
const t = k => (I18N[State.lang] && I18N[State.lang][k]) || I18N.en[k] || k;

/* ---------------- Formatting helpers ---------------- */
const fmt = {
  lkr(n) { return 'Rs. ' + Number(n || 0).toLocaleString('en-LK', { maximumFractionDigits: 0 }); },
  short(n) {
    n = Number(n || 0);
    if (n >= 1e9) return 'Rs. ' + (n / 1e9).toFixed(2).replace(/\.00$/, '') + 'B';
    if (n >= 1e6) return 'Rs. ' + (n / 1e6).toFixed(2).replace(/\.00$/, '') + 'M';
    if (n >= 1e3) return 'Rs. ' + Math.round(n / 1e3) + 'K';
    return fmt.lkr(n);
  },
  perches(p) {
    p = Number(p);
    if (p >= 160) {
      const a = Math.floor(p / 160), rem = p - a * 160, r = Math.floor(rem / 40), rp = +(rem - r * 40).toFixed(2);
      return `${a} Acre${a > 1 ? 's' : ''}${r ? ' ' + r + ' Rood' + (r > 1 ? 's' : '') : ''}${rp ? ' ' + rp + 'P' : ''}`;
    }
    return `${+p.toFixed(2)} ${t('perches')}`;
  },
  date(s) { return s ? new Date(s.replace(' ', 'T')).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'; },
  dateTime(s) { return s ? new Date(s.replace(' ', 'T')).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'; },
  initials(n) { return (n || '?').split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase(); }
};
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ---------------- UI kit ---------------- */
const UI = {
  toast(title, msg, kind) {
    let box = document.querySelector('.toasts');
    if (!box) { box = document.createElement('div'); box.className = 'toasts'; document.body.appendChild(box); }
    const el = document.createElement('div');
    el.className = 'toast ' + (kind || '');
    el.innerHTML = `<b>${esc(title)}</b>${msg ? `<span>${esc(msg)}</span>` : ''}`;
    box.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateX(30px)'; el.style.transition = '.3s'; setTimeout(() => el.remove(), 320); }, 3800);
  },
  err(e) { UI.toast(e.status === 403 ? 'Not allowed' : 'Something went wrong', e.details ? Object.values(e.details)[0] : e.message, 'err'); },
  modal(title, html, onMount) {
    UI.closeModal();
    const bg = document.createElement('div');
    bg.className = 'modal-bg';
    bg.innerHTML = `<div class="modal"><div class="modal-head"><h3>${title}</h3><button class="x" data-close>✕</button></div><div class="modal-body">${html}</div></div>`;
    bg.addEventListener('click', e => { if (e.target === bg || e.target.hasAttribute('data-close')) UI.closeModal(); });
    document.body.appendChild(bg);
    document.body.style.overflow = 'hidden';
    if (onMount) onMount(bg);
    return bg;
  },
  closeModal() { document.querySelectorAll('.modal-bg').forEach(m => m.remove()); document.body.style.overflow = ''; },
  skeletonCards(n = 6) {
    return `<div class="cards">${Array.from({ length: n }).map(() => `
      <div class="sk-card"><div class="sk sk-img"></div><div class="sk-body">
        <div class="sk" style="height:14px;width:65%"></div><div class="sk" style="height:20px;width:45%"></div>
        <div class="sk" style="height:12px;width:85%"></div><div class="sk" style="height:34px;width:100%"></div>
      </div></div>`).join('')}</div>`;
  },
  empty(icon, title, sub, action) {
    return `<div class="empty"><div class="ico">${icon}</div><h3>${esc(title)}</h3><p>${esc(sub || '')}</p>${action || ''}</div>`;
  },
  stars(n) { const r = Math.round(Number(n) || 0); return '★'.repeat(r) + '☆'.repeat(5 - r); },
  pill(status) {
    const map = {
      ACTIVE: 'p-green', VERIFIED: 'p-green', APPROVED: 'p-green', SUCCESSFUL: 'p-green', COMPLETED: 'p-green', OPEN: 'p-green', RESOLVED: 'p-green',
      PENDING: 'p-gold', RESERVED: 'p-navy', SOLD: 'p-navy', PENDING_CLARIFICATION: 'p-gold', IN_PROGRESS: 'p-gold', SUPPORT: 'p-gold',
      REJECTED: 'p-red', FAILED: 'p-red', CANCELLED: 'p-red', REMOVED: 'p-red', SUSPENDED: 'p-red',
      REFUNDED: 'p-gray'
    };
    return `<span class="pill ${map[status] || 'p-gray'}">${esc(String(status || '').replace(/_/g, ' '))}</span>`;
  }
};

/* ---------------- Auth ---------------- */
const Auth = {
  async boot() {
    if (!API.token) return;
    try { State.user = await API.get('/api/auth/me'); await Auth.syncBadges(); }
    catch (_) { API.setToken(null); State.user = null; }
  },
  async syncBadges() {
    if (!State.user) return;
    try {
      const [n, w] = await Promise.all([API.get('/api/notifications?unread=true'), API.get('/api/wishlist')]);
      State.notif = n.unread;
      State.wishlist = new Set(w.items.map(i => i.id));
      State.saveWish();
    } catch (_) { }
  },
  async login(email, password) {
    const r = await API.post('/api/auth/login', { email, password });
    API.setToken(r.token); State.user = r.user; await Auth.syncBadges();
    return r.user;
  },
  logout(silent) {
    API.setToken(null); State.user = null; State.wishlist = new Set(); State.saveWish();
    if (!silent) { UI.toast('Signed out', 'See you soon!'); Router.go('/'); } else Router.render();
  },
  home() {
    if (!State.user) return '/login';
    return { ADMIN: '/admin', SELLER: '/seller', AGENT: '/seller', BUYER: '/buyer', SUPPORT: '/support' }[State.user.role] || '/buyer';
  },
  require(roles) {
    if (!State.user) { UI.toast('Please sign in', 'You need an account to continue.', 'warn'); Router.go('/login?next=' + encodeURIComponent(location.hash.slice(1) || '/')); return false; }
    if (roles && !roles.includes(State.user.role)) { UI.toast('Access denied', 'This area is for ' + roles.join('/') + ' accounts.', 'err'); return false; }
    return true;
  }
};

/* ---------------- Property card component (reusable) ---------------- */
function LandCard(l, opts) {
  opts = opts || {};
  const fav = State.wishlist.has(l.id);
  const inCmp = State.compare.includes(l.id);
  return `
  <article class="card" data-land="${l.id}">
    <div class="card-media">
      <img src="${esc(l.cover || '/img/land1.jpg')}" alt="${esc(l.title)}" loading="lazy">
      <div class="card-badges">
        ${l.is_verified ? `<span class="badge badge-verified">✓ ${t('verified')}</span>` : ''}
        <span class="badge badge-type">${esc(l.land_type)}</span>
        ${l.negotiable ? `<span class="badge badge-neg">${t('negotiable')}</span>` : ''}
        ${l.status === 'RESERVED' ? '<span class="badge badge-gold">Reserved</span>' : ''}
        ${l.status === 'SOLD' ? '<span class="badge badge-gold">Sold</span>' : ''}
      </div>
      <button class="fav ${fav ? 'on' : ''}" data-fav="${l.id}" title="Add to wishlist">${fav ? '♥' : '♡'}</button>
      <div class="card-price-tag">
        <b>${esc(l.price_display || fmt.lkr(l.price))}</b>
        <span>${esc(l.ppp_display || fmt.lkr(l.price_per_perch) + ' / Perch')}</span>
      </div>
    </div>
    <div class="card-body">
      <h3>${esc(l.title)}</h3>
      <div class="card-loc">📍 ${esc(l.location_display || `${l.city}, ${l.district} District`)}</div>
      <div class="card-meta">
        <span class="chip chip-em">📐 ${esc((l.size && l.size.display) || fmt.perches(l.perches))}</span>
        ${l.main_road ? '<span class="chip">🛣️ Main Road</span>' : ''}
        ${l.electricity ? '<span class="chip">⚡ Electricity</span>' : ''}
        ${l.water ? '<span class="chip">💧 Water</span>' : ''}
        ${l.near_highway ? '<span class="chip">🚗 Near Highway</span>' : ''}
      </div>
      <div class="card-actions">
        <a class="btn btn-primary btn-sm" href="#/land/${l.id}">${t('view')}</a>
        <button class="btn btn-ghost btn-sm" data-cmp="${l.id}">${inCmp ? '✓ Added' : '⇄ ' + t('compare')}</button>
      </div>
    </div>
  </article>`;
}

/* Delegated card interactions */
document.addEventListener('click', async (e) => {
  const fav = e.target.closest('[data-fav]');
  if (fav) {
    e.preventDefault();
    const id = Number(fav.dataset.fav);
    if (!State.user) { UI.toast('Sign in required', 'Create a free account to save properties.', 'warn'); Router.go('/login'); return; }
    try {
      if (State.wishlist.has(id)) { await API.del('/api/wishlist/' + id); State.wishlist.delete(id); fav.classList.remove('on'); fav.textContent = '♡'; UI.toast('Removed from wishlist'); }
      else { await API.post('/api/wishlist/' + id); State.wishlist.add(id); fav.classList.add('on'); fav.textContent = '♥'; UI.toast('Saved to wishlist', 'View it in your dashboard.'); }
      State.saveWish();
    } catch (err) { UI.err(err); }
    return;
  }
  const cmp = e.target.closest('[data-cmp]');
  if (cmp) {
    e.preventDefault();
    const id = Number(cmp.dataset.cmp);
    const i = State.compare.indexOf(id);
    if (i >= 0) { State.compare.splice(i, 1); cmp.textContent = '⇄ ' + t('compare'); UI.toast('Removed from comparison'); }
    else {
      if (State.compare.length >= 4) { UI.toast('Comparison full', 'You can compare up to 4 properties.', 'warn'); return; }
      State.compare.push(id); cmp.textContent = '✓ Added';
      UI.toast('Added to comparison', `${State.compare.length} selected — open the Compare page.`);
    }
    State.saveCompare(); Chrome.renderNav();
  }
});
