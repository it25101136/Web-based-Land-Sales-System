/* Navbar, footer, chatbot — persistent chrome. */
'use strict';

const Chrome = {
  renderNav() {
    const path = (location.hash.slice(1) || '/').split('?')[0];
    const link = (href, key) => `<a href="#${href}" class="${path === href ? 'active' : ''}">${t(key)}</a>`;
    const u = State.user;
    document.getElementById('nav').innerHTML = `
      <div class="nav-inner">
        <a href="#/" class="logo">
          <span class="logo-mark">🏝️</span>
          <span class="full">LandHub<small>Sri Lanka</small></span>
        </a>
        <nav class="nav-links" id="navLinks">
          ${link('/', 'home')}${link('/buy', 'buy')}${link('/sell', 'sell')}${link('/locations', 'locations')}
          ${link('/about', 'about')}${link('/contact', 'contact')}${link('/help', 'help')}
        </nav>
        <div class="nav-right">
          <div class="lang">
            <button data-lang="en" class="${State.lang === 'en' ? 'active' : ''}">EN</button>
            <button data-lang="si" class="${State.lang === 'si' ? 'active' : ''}" lang="si">සිං</button>
            <button data-lang="ta" class="${State.lang === 'ta' ? 'active' : ''}" lang="ta">தமிழ்</button>
          </div>
          ${State.compare.length ? `<a class="btn btn-ghost btn-sm" href="#/compare">⇄ ${State.compare.length}</a>` : ''}
          ${u ? `
            <a class="btn btn-ghost btn-sm" href="#/messages">💬${State.msgs ? ` <b style="color:#E23D50">${State.msgs}</b>` : ''}</a>
            <a class="btn btn-ghost btn-sm" href="#/notifications">🔔${State.notif ? ` <b style="color:#E23D50">${State.notif}</b>` : ''}</a>
            <a class="btn btn-ghost btn-sm" href="#${Auth.home()}">${u.role.charAt(0) + u.role.slice(1).toLowerCase()}</a>
            <button class="btn btn-navy btn-sm" id="btnLogout">${t('logout')}</button>
          ` : `
            <a class="btn btn-ghost btn-sm" href="#/login">${t('login')}</a>
            <a class="btn btn-navy btn-sm" href="#/register">${t('register')}</a>
          `}
          <a class="btn btn-gold btn-sm" href="#/sell">＋ ${t('post')}</a>
          <button class="burger" id="burger">☰</button>
        </div>
      </div>`;

    document.querySelectorAll('[data-lang]').forEach(b => b.onclick = () => {
      State.lang = b.dataset.lang; localStorage.setItem('lh_lang', State.lang);
      document.documentElement.lang = State.lang; Chrome.renderNav(); Router.render(); Chrome.renderFooter();
    });
    const lo = document.getElementById('btnLogout'); if (lo) lo.onclick = () => Auth.logout();
    const bg = document.getElementById('burger');
    if (bg) bg.onclick = () => document.getElementById('navLinks').classList.toggle('open');
  },

  renderFooter() {
    document.getElementById('footer').innerHTML = `
      <div class="wrap">
        <div class="foot-grid">
          <div>
            <a href="#/" class="logo" style="color:#fff;margin-bottom:14px"><span class="logo-mark">🏝️</span><span>LandHub<small>Sri Lanka</small></span></a>
            <p style="max-width:38ch">Sri Lanka's modern land marketplace — connecting landowners and buyers across all 9 provinces and 25 districts with verified listings and transparent per-perch pricing.</p>
            <p style="margin-top:12px;font-size:12.5px;color:rgba(255,255,255,.5)">A university Software Engineering group project. Demonstration data only.</p>
          </div>
          <div>
            <h4>Explore</h4>
            <a href="#/buy">Buy Land</a><a href="#/sell">Sell Land</a><a href="#/locations">Locations</a>
            <a href="#/compare">Compare</a><a href="#/wishlist">Wishlist</a>
          </div>
          <div>
            <h4>Company</h4>
            <a href="#/about">About Us</a><a href="#/contact">Contact</a><a href="#/help">Help & FAQ</a>
            <a href="#/documents">Document Verification</a><a href="#/login">Sign In</a>
          </div>
          <div>
            <h4>Contact</h4>
            <p>No. 128, Galle Road,<br>Colombo 03, Sri Lanka</p>
            <p style="margin-top:8px">📞 +94 11 234 5678<br>📱 +94 77 123 4567<br>✉️ hello@landhub.lk</p>
            <p style="margin-top:8px;font-size:12px;color:rgba(255,255,255,.5)">Mon–Fri 8:30–17:30 · Sat 9:00–13:00</p>
          </div>
        </div>
        <div class="foot-bottom">
          <span>© ${new Date().getFullYear()} LandHub Sri Lanka. Demo platform — sample data.</span>
          <span>LandHub verification is an administrative platform check, not legal certification. Obtain independent legal advice before purchasing land.</span>
        </div>
      </div>`;
  },

  /* chatbot removed */
  bot: { open: false, history: [] },
  renderBot() { const h = document.getElementById('bot'); if (h) h.innerHTML = ''; }
};

window.addEventListener('scroll', () => {
  document.getElementById('nav').classList.toggle('scrolled', window.scrollY > 12);
});
