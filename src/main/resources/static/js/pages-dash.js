/* Dashboards: Buyer, Seller, Admin + Bookings, Payments, Messages, Documents, Reviews, Profile, Reports */
'use strict';

/* ---------- Shell ---------- */
function dashShell(title, subtitle, nav, bodyId, actions) {
  const path = (location.hash.slice(1) || '/').split('?')[0];
  return `<div class="dash">
    <aside class="side">
      <div class="user-pill"><div class="avatar">${fmt.initials(State.user.full_name)}</div>
        <div style="min-width:0"><b style="color:#fff;font-size:13.5px;display:block;overflow:hidden;text-overflow:ellipsis">${esc(State.user.full_name)}</b>
        <span style="font-size:11.5px;color:rgba(255,255,255,.6)">${esc(State.user.role)}</span></div></div>
      ${nav.map(g => g.head ? `<h4>${g.head}</h4>` :
    `<a href="#${g.href}" class="${path === g.href ? 'active' : ''}">${g.icon} ${g.label}${g.count ? `<span class="count">${g.count}</span>` : ''}</a>`).join('')}
      <h4>Account</h4>
      <a href="#/profile" class="${path === '/profile' ? 'active' : ''}">👤 Profile</a>
      <a href="#/" >← Back to site</a>
    </aside>
    <main class="dash-main">
      <div class="dash-head"><div><h1>${title}</h1><p>${subtitle}</p></div>${actions || ''}</div>
      <div id="${bodyId}"></div>
    </main></div>`;
}

const BUYER_NAV = [
  { head: 'Buying' },
  { href: '/buyer', icon: '📊', label: 'Dashboard' },
  { href: '/wishlist', icon: '♥', label: 'Saved Lands' },
  { href: '/compare', icon: '⇄', label: 'Compare' },
  { href: '/bookings', icon: '🔑', label: 'Reservations' },
  { href: '/payments', icon: '💳', label: 'Payments' },
  { head: 'Communication' },
  { href: '/messages', icon: '💬', label: 'Messages' },
  { href: '/notifications', icon: '🔔', label: 'Notifications' },
  { href: '/reviews', icon: '⭐', label: 'My Reviews' },
  { head: 'Support' },
  { href: '/inquiries', icon: '📩', label: 'My Inquiries' }
];
const SELLER_NAV = [
  { head: 'Selling' },
  { href: '/seller', icon: '📊', label: 'Dashboard' },
  { href: '/sell', icon: '＋', label: 'Add Land' },
  { href: '/bookings', icon: '🔑', label: 'Reservations' },
  { href: '/documents', icon: '📄', label: 'Documents' },
  { href: '/payments', icon: '💳', label: 'Payments' },
  { head: 'Communication' },
  { href: '/messages', icon: '💬', label: 'Inquiries' },
  { href: '/notifications', icon: '🔔', label: 'Notifications' },
  { href: '/reviews', icon: '⭐', label: 'Reviews' }
];
const ADMIN_NAV = [
  { head: 'Administration' },
  { href: '/admin', icon: '📊', label: 'Overview' },
  { href: '/admin/users', icon: '👥', label: 'Users' },
  { href: '/admin/lands', icon: '🏝️', label: 'Properties' },
  { href: '/documents', icon: '📄', label: 'Verification' },
  { href: '/bookings', icon: '🔑', label: 'Bookings' },
  { href: '/payments', icon: '💳', label: 'Payments' },
  { href: '/reviews', icon: '⭐', label: 'Reviews' },
  { href: '/reports', icon: '📈', label: 'Reports' },
  { head: 'Customer Relations' },
  { href: '/customers', icon: '👤', label: 'Customers' },
  { href: '/inquiries', icon: '📩', label: 'Inquiries' },
  { head: 'Communication' },
  { href: '/messages', icon: '💬', label: 'Messages' },
  { href: '/notifications', icon: '🔔', label: 'Notifications' }
];
const navFor = () => State.user.role === 'ADMIN' ? ADMIN_NAV : (State.user.role === 'SUPPORT' ? SUPPORT_NAV : (['SELLER', 'AGENT'].includes(State.user.role) ? SELLER_NAV : BUYER_NAV));

/* =================== BUYER DASHBOARD =================== */
Pages.buyer = async function (host) {
  if (!Auth.require()) return;
  host.innerHTML = dashShell('Buyer Dashboard', 'Ayubowan, ' + esc(State.user.full_name.split(' ')[0]) + ' — here is your property activity.',
    BUYER_NAV, 'bd', '<a class="btn btn-primary" href="#/buy">🔎 Find land</a>');
  const el = document.getElementById('bd');
  el.innerHTML = UI.skeletonCards(4);
  try {
    const [s, wl, rv, bk] = await Promise.all([
      API.get('/api/users/me/dashboard'), API.get('/api/wishlist'),
      API.get('/api/wishlist/recently-viewed'), API.get('/api/bookings')
    ]);
    const savedCount = s.saved ?? s.wishlist ?? 0;
    const activeResCount = s.active_reservations ?? s.bookings ?? 0;
    const completedPurchases = s.completed_purchases ?? s.payments ?? 0;
    const unreadMsgs = s.unread_messages ?? 0;
    el.innerHTML = `
      <div class="grid-4" style="margin-bottom:24px">
        <div class="stat"><div class="ico">♥</div><b>${savedCount}</b><span>Saved Properties</span></div>
        <div class="stat gold"><div class="ico">🔑</div><b>${activeResCount}</b><span>Active Reservations</span></div>
        <div class="stat navy"><div class="ico">✓</div><b>${completedPurchases}</b><span>Completed Purchases</span></div>
        <div class="stat red"><div class="ico">💬</div><b>${unreadMsgs}</b><span>Unread Messages</span></div>
      </div>
      <div class="panel" style="margin-bottom:22px">
        <div class="panel-title">🔑 My Reservations <a class="btn btn-ghost btn-sm" href="#/bookings">View all</a></div>
        ${bk.items.length ? `<div class="table-wrap"><table><thead><tr><th>Property</th><th>District</th><th>Preferred date</th><th>Status</th></tr></thead>
          <tbody>${bk.items.slice(0, 5).map(b => `<tr><td><b>${esc(b.land_title || 'Listing #' + b.land_id)}</b></td><td>${esc(b.district || '—')}</td>
            <td>${b.preferred_date || '—'}</td><td>${UI.pill(b.status)}</td></tr>`).join('')}</tbody></table></div>`
        : '<p style="color:var(--gray-600);margin:0">No reservations yet. Find land you like and click “Reserve Land”.</p>'}
      </div>
      <div class="panel" style="margin-bottom:22px">
        <div class="panel-title">♥ Saved Lands <a class="btn btn-ghost btn-sm" href="#/wishlist">View all</a></div>
        ${wl.items.length ? `<div class="cards">${wl.items.slice(0, 3).map(l => LandCard(l)).join('')}</div>`
        : '<p style="color:var(--gray-600);margin:0">Tap the ♡ on any listing to save it here.</p>'}
      </div>
      <div class="panel">
        <div class="panel-title">👁️ Recently Viewed</div>
        ${rv.items.length ? `<div class="cards">${rv.items.slice(0, 3).map(l => LandCard(l)).join('')}</div>`
        : '<p style="color:var(--gray-600);margin:0">Properties you view will appear here.</p>'}
      </div>`;
  } catch (e) { UI.err(e); }
};

/* =================== SELLER DASHBOARD =================== */
Pages.seller = async function (host) {
  if (!Auth.require(['SELLER', 'AGENT', 'ADMIN'])) return;
  host.innerHTML = dashShell('Seller Dashboard', 'Manage your listings, inquiries and reservations.',
    SELLER_NAV, 'sd', '<a class="btn btn-gold" href="#/sell">＋ Add new land</a>');
  const el = document.getElementById('sd');
  el.innerHTML = UI.skeletonCards(4);
  try {
    const [st, all, bk] = await Promise.all([
      API.get(`/api/lands/seller/${State.user.id}/stats`),
      API.get('/api/lands' + API.qs({ seller_id: State.user.id, limit: 60 })),
      API.get('/api/bookings')
    ]);
    const mine = all.items;
    el.innerHTML = `
      <div class="grid-4" style="margin-bottom:18px">
        <div class="stat navy"><div class="ico">🏝️</div><b>${st.total}</b><span>Total Listings</span></div>
        <div class="stat"><div class="ico">✓</div><b>${st.active}</b><span>Active Listings</span></div>
        <div class="stat gold"><div class="ico">⏳</div><b>${st.pending}</b><span>Pending Approval</span></div>
        <div class="stat red"><div class="ico">✕</div><b>${st.rejected}</b><span>Rejected</span></div>
      </div>
      <div class="grid-4" style="margin-bottom:24px">
        <div class="stat navy"><div class="ico">👁️</div><b>${st.views}</b><span>Total Views</span></div>
        <div class="stat"><div class="ico">💬</div><b>${st.inquiries}</b><span>Inquiries</span></div>
        <div class="stat gold"><div class="ico">🔑</div><b>${st.reservations}</b><span>Reservations</span></div>
        <div class="stat"><div class="ico">⭐</div><b>${st.reviews}</b><span>Reviews</span></div>
      </div>
      <div class="panel" style="margin-bottom:22px">
        <div class="panel-title">🔑 Reservation Requests</div>
        ${bk.items.length ? `<div class="table-wrap"><table><thead><tr><th>Property</th><th>Buyer</th><th>Contact</th><th>Date</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>${bk.items.map(b => `<tr><td><b>${esc(b.land_title)}</b></td><td>${esc(b.buyer_name)}</td>
            <td style="font-size:12.5px">${esc(b.contact_no)}<br>${esc(b.email)}</td><td>${b.preferred_date || '—'}</td><td>${UI.pill(b.status)}</td>
            <td>${b.status === 'PENDING' && b.seller_id === State.user.id ? `
              <button class="btn btn-primary btn-sm" data-bk="${b.id}" data-st="APPROVED">Approve</button>
              <button class="btn btn-ghost btn-sm" data-bk="${b.id}" data-st="REJECTED">Reject</button>` :
          (b.status === 'APPROVED' ? `<button class="btn btn-gold btn-sm" data-bk="${b.id}" data-st="COMPLETED">Mark completed</button>` : '—')}</td></tr>`).join('')}
          </tbody></table></div>` : '<p style="color:var(--gray-600);margin:0">No reservation requests yet.</p>'}
      </div>
      <div class="panel">
        <div class="panel-title">🏝️ My Listings
          <div style="display:flex;gap:8px"><button class="btn btn-ghost btn-sm" id="upDoc">📄 Upload document</button>
          <a class="btn btn-primary btn-sm" href="#/sell">＋ Add land</a></div></div>
        ${mine.length ? `<div class="table-wrap"><table><thead><tr><th>Property</th><th>Size</th><th>Price</th><th>Views</th><th>Status</th><th>Verification</th><th>Actions</th></tr></thead>
          <tbody>${mine.map(l => `<tr>
            <td><div style="display:flex;gap:9px;align-items:center"><img src="${esc(l.cover || '/img/land1.jpg')}" style="width:48px;height:38px;border-radius:7px;object-fit:cover">
              <div><b>${esc(l.title.slice(0, 46))}</b><br><span style="font-size:12px;color:var(--gray-600)">${esc(l.city)}, ${esc(l.district)}</span></div></div></td>
            <td>${esc(l.size.display)}</td><td><b>${esc(l.price_display)}</b><br><span style="font-size:11.5px;color:var(--gray-600)">${esc(l.ppp_display)}</span></td>
            <td>${l.views}</td><td>${UI.pill(l.status)}</td><td>${UI.pill(l.verification)}</td>
            <td style="white-space:nowrap"><a class="btn btn-ghost btn-sm" href="#/land/${l.id}">View</a>
              <button class="btn btn-ghost btn-sm" data-ed="${l.id}">Edit</button>
              <button class="btn btn-ghost btn-sm" data-del="${l.id}">🗑️</button></td></tr>`).join('')}
          </tbody></table></div>` : UI.empty('🏷️', 'No listings yet', 'Post your first land to reach buyers across Sri Lanka.', '<a class="btn btn-primary" href="#/sell">Post your land</a>')}
      </div>`;

    el.querySelectorAll('[data-bk]').forEach(b => b.onclick = async () => {
      try { await API.put(`/api/bookings/${b.dataset.bk}/status`, { status: b.dataset.st }); UI.toast('Reservation ' + b.dataset.st.toLowerCase()); Router.render(); }
      catch (e) { UI.err(e); }
    });
    el.querySelectorAll('[data-ed]').forEach(b => b.onclick = async () => Forms.editLand(await API.get('/api/lands/' + b.dataset.ed)));
    el.querySelectorAll('[data-del]').forEach(b => b.onclick = async () => {
      if (!confirm('Delete this listing permanently?')) return;
      try { await API.del('/api/lands/' + b.dataset.del); UI.toast('Listing deleted'); Router.render(); } catch (e) { UI.err(e); }
    });
    const ud = document.getElementById('upDoc');
    if (ud) ud.onclick = () => mine.length ? Forms.uploadDoc(mine) : UI.toast('Add a listing first', null, 'warn');
  } catch (e) { UI.err(e); }
};

/* =================== ADMIN DASHBOARD =================== */
Pages.admin = async function (host) {
  if (!Auth.require(['ADMIN'])) return;
  host.innerHTML = dashShell('Admin Overview', 'Platform-wide statistics and analytics for LandHub Sri Lanka.',
    ADMIN_NAV, 'ad', '<button class="btn btn-ghost" id="refresh">↻ Refresh</button>');
  const el = document.getElementById('ad');
  el.innerHTML = UI.skeletonCards(4);
  document.getElementById('refresh').onclick = () => Router.render();
  try {
    const [o, a] = await Promise.all([API.get('/api/admin/overview'), API.get('/api/admin/analytics')]);
    const T = (o && o.totals) || {};
    const mon = m => {
      if (!m) return '';
      const parts = m.split('-');
      const mm = Number(parts[1] || 1);
      const y = parts[0] || '';
      return (['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][mm - 1] || '') + ' ' + (y ? y.slice(2) : '');
    };
    const monthlyListings = ((a && a.monthly_listings) || []);
    const monthlyRevenue = ((a && a.monthly_revenue) || []);
    const popularDistricts = ((a && a.popular_districts) || []);
    const popularTypes = ((a && a.popular_types) || []);
    const provinceSplit = ((a && a.province_split) || []);
    const priceBands = ((a && a.price_bands) || []);
    const verificationCounts = ((a && a.verification) || []);
    const bookingsByStatus = ((a && a.bookings_by_status) || []);
    const paymentMethods = ((a && a.payments && a.payments.byMethod) || []);

    el.innerHTML = `
      <div class="grid-4" style="margin-bottom:18px">
        <div class="stat navy"><div class="ico">🏝️</div><b>${T.properties || 0}</b><span>Total Properties</span></div>
        <div class="stat"><div class="ico">👥</div><b>${T.users || 0}</b><span>Total Users</span></div>
        <div class="stat gold"><div class="ico">🏷️</div><b>${T.sellers || 0}</b><span>Sellers</span></div>
        <div class="stat"><div class="ico">🔍</div><b>${T.buyers || 0}</b><span>Buyers</span></div>
      </div>
      <div class="grid-4" style="margin-bottom:24px">
        <div class="stat gold"><div class="ico">🔑</div><b>${T.reservations || 0}</b><span>Total Reservations</span></div>
        <div class="stat"><div class="ico">💰</div><b>${fmt.short(T.revenue || 0)}</b><span>Total Revenue (sandbox)</span></div>
        <div class="stat red"><div class="ico">📄</div><b>${T.pending_documents || 0}</b><span>Documents Pending</span></div>
        <div class="stat red"><div class="ico">⏳</div><b>${T.pending || 0}</b><span>Listings Pending Approval</span></div>
      </div>
      <div class="grid-4" style="margin-bottom:24px">
        <div class="stat navy"><div class="ico">📩</div><b>${T.total_inquiries || 0}</b><span>Total Inquiries</span></div>
        <div class="stat red"><div class="ico">🔴</div><b>${T.open_inquiries || 0}</b><span>Open Inquiries</span></div>
        <div class="stat gold"><div class="ico">⏳</div><b>${T.pending_inquiries || 0}</b><span>Pending Clarification</span></div>
        <div class="stat"><div class="ico">✅</div><b>${T.resolved_inquiries || 0}</b><span>Resolved Inquiries</span></div>
      </div>

      <div class="grid-2" style="margin-bottom:20px">
        <div class="chart-box"><h3>📈 Monthly Listings</h3>
          ${Charts.line(monthlyListings.map(x => ({ k: mon(x.m), v: x.c })))}</div>
        <div class="chart-box"><h3>💰 Monthly Revenue (LKR, sandbox)</h3>
          ${Charts.bar(monthlyRevenue.map(x => ({ k: mon(x.m), v: x.s })), { fmtV: fmt.short, color: '#D4A72C' })}</div>
      </div>

      <div class="grid-2" style="margin-bottom:20px">
        <div class="chart-box"><h3>📍 Most Popular Districts</h3>
          ${Charts.hbar(popularDistricts.map(x => ({ k: x.district, v: x.c })), { fmtV: v => v + ' listings' })}</div>
        <div class="chart-box"><h3>🏷️ Popular Land Types</h3>
          ${Charts.donut(popularTypes.slice(0, 7).map(x => ({ k: x.land_type, v: x.c })))}</div>
      </div>

      <div class="grid-3" style="margin-bottom:20px">
        <div class="chart-box"><h3>🗺️ Listings by Province</h3>
          ${Charts.hbar(provinceSplit.map(x => ({ k: (x.province || '').replace(' Province', ''), v: x.c })))}</div>
        <div class="chart-box"><h3>💵 Price Bands</h3>
          ${Charts.donut(priceBands.map(x => ({ k: x.band, v: x.c })), { size: 160 })}</div>
        <div class="chart-box"><h3>🛡️ Verification Status</h3>
          ${Charts.donut(verificationCounts.map(x => ({ k: x.verification, v: x.c })), { size: 160 })}</div>
      </div>

      <div class="grid-2">
        <div class="chart-box"><h3>🔑 Reservations by Status</h3>
          ${Charts.bar(bookingsByStatus.map(x => ({ k: x.status, v: x.c })), { color: '#0B2545' })}</div>
        <div class="chart-box"><h3>💳 Payments by Method</h3>
          ${Charts.donut(paymentMethods.map(x => ({ k: (x.method || '').replace('_', ' '), v: x.c })), { size: 160 })}</div>
      </div>`;
  } catch (e) { UI.err(e); }
};

/* =================== ADMIN: USERS =================== */
Pages.adminUsers = async function (host) {
  if (!Auth.require(['ADMIN'])) return;
  host.innerHTML = dashShell('User Management', 'Manage buyers, sellers, agents, support and administrators.', ADMIN_NAV, 'au',
    '<button class="btn btn-primary" id="addAccBtn">✚ Add Account</button>');
  const el = document.getElementById('au');
  const ROLES = ['ADMIN', 'SELLER', 'BUYER', 'AGENT', 'SUPPORT'];
  const load = async (role, q) => {
    el.innerHTML = `<div class="panel" style="margin-bottom:18px;display:flex;gap:10px;flex-wrap:wrap">
        <input class="ctrl" id="uq" placeholder="Search name or email…" value="${esc(q || '')}" style="max-width:280px">
        <select class="ctrl" id="ur" style="max-width:200px">
          <option value="">All roles</option>${ROLES.map(r => `<option ${role === r ? 'selected' : ''}>${r}</option>`).join('')}</select>
      </div><div id="ut">${UI.skeletonCards(1)}</div>`;
    document.getElementById('ur').onchange = e => load(e.target.value, document.getElementById('uq').value);
    document.getElementById('uq').onkeydown = e => { if (e.key === 'Enter') load(document.getElementById('ur').value, e.target.value); };
    const r = await API.get('/api/admin/users' + API.qs({ role, q }));
    document.getElementById('ut').innerHTML = `<div class="table-wrap"><table><thead><tr>
      <th>User</th><th>Contact</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead><tbody>
      ${r.items.map(u => `<tr>
        <td><div style="display:flex;gap:9px;align-items:center"><div class="avatar">${fmt.initials(u.full_name)}</div>
          <div><b>${esc(u.full_name)}</b><br><span style="font-size:12px;color:var(--gray-600)">${esc(u.email)}</span></div></div></td>
        <td style="font-size:12.5px">${esc(u.phone || '—')}</td>
        <td><select class="ctrl" data-role="${u.id}" style="padding:6px 9px;font-size:12.5px">
          ${ROLES.map(x => `<option ${u.role === x ? 'selected' : ''}>${x}</option>`).join('')}</select></td>
        <td>${UI.pill(u.status)}</td><td>${fmt.date(u.created_at)}</td>
        <td style="white-space:nowrap">
          <button class="btn btn-ghost btn-sm" data-sus="${u.id}" data-to="${u.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'}">${u.status === 'ACTIVE' ? 'Suspend' : 'Activate'}</button>
          <button class="btn btn-ghost btn-sm" data-du="${u.id}">🗑️</button></td></tr>`).join('')}
      </tbody></table></div>`;
    document.querySelectorAll('[data-role]').forEach(s => s.onchange = async () => {
      try { await API.put('/api/admin/users/' + s.dataset.role, { role: s.value }); UI.toast('Role updated'); } catch (e) { UI.err(e); }
    });
    document.querySelectorAll('[data-sus]').forEach(b => b.onclick = async () => {
      try { await API.put('/api/admin/users/' + b.dataset.sus, { status: b.dataset.to }); UI.toast('User ' + b.dataset.to.toLowerCase()); load(role, q); } catch (e) { UI.err(e); }
    });
    document.querySelectorAll('[data-du]').forEach(b => b.onclick = async () => {
      if (!confirm('Delete this user and all their data?')) return;
      try { await API.del('/api/admin/users/' + b.dataset.du); UI.toast('User deleted'); load(role, q); } catch (e) { UI.err(e); }
    });
  };
  // Add New Account button
  var ROLE_LABELS = {ADMIN:'Administrator', SELLER:'Seller', BUYER:'Buyer', AGENT:'Agent', SUPPORT:'Support Agent'};
  var ROLE_DESCS = {SUPPORT:'Support accounts can reply to customer inquiries.', ADMIN:'Full system access and management.', SELLER:'Can list and manage land properties.', BUYER:'Can browse, reserve and purchase land.', AGENT:'Can list properties on behalf of sellers.'};
  document.getElementById('addAccBtn').onclick = () => {
    UI.modal('👤 Add New Account',
      `<form id="newAccForm" style="display:flex;flex-direction:column;gap:16px">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
          <div class="field"><label>Role <span style="color:#C2293B">*</span></label>
            <select class="ctrl" name="role" id="accRole">
              ${ROLES.map(r => '<option value="' + r + '"' + (r === 'SUPPORT' ? ' selected' : '') + '>' + ROLE_LABELS[r] + '</option>').join('')}
            </select>
            <div id="roleDesc" style="font-size:12px;color:var(--gray-600);margin-top:4px">${ROLE_DESCS.SUPPORT}</div>
          </div>
          <div class="field"><label>Full Name <span style="color:#C2293B">*</span></label>
            <input class="ctrl" name="full_name" required placeholder="e.g. Kasun Perera"></div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
          <div class="field"><label>Email address <span style="color:#C2293B">*</span></label>
            <input class="ctrl" name="email" type="email" required placeholder="kasun@landhub.lk"></div>
          <div class="field"><label>Phone</label>
            <input class="ctrl" name="phone" placeholder="+94 77 123 4567"></div>
        </div>
        <div class="field"><label>Password <span style="color:#C2293B">*</span></label>
          <input class="ctrl" name="password" type="password" required placeholder="Min 8 chars, letter+number">
          <div style="font-size:12px;color:var(--gray-600);margin-top:4px">Must be 8+ characters and contain both a letter and a number.</div>
        </div>
        <button type="submit" class="btn btn-primary" style="width:100%;padding:13px;font-size:15px;border-radius:10px">👤 Create Account</button>
      </form>`,
      function(bg) {
        bg.querySelector('#accRole').onchange = function() {
          bg.querySelector('#roleDesc').textContent = ROLE_DESCS[this.value] || '';
        };
        bg.querySelector('#newAccForm').onsubmit = async function(e) {
          e.preventDefault();
          var f = e.target;
          var submitBtn = f.querySelector('[type="submit"]');
          submitBtn.disabled = true; submitBtn.textContent = 'Creating…';
          try {
            await API.post('/api/admin/accounts', {
              full_name: f.full_name.value.trim(),
              email: f.email.value.trim(),
              phone: f.phone.value.trim() || undefined,
              password: f.password.value,
              role: f.role.value,
              status: 'ACTIVE'
            });
            UI.closeModal();
            UI.toast('Account created successfully ✓', ROLE_LABELS[f.role.value] + ' account for ' + f.full_name.value);
            load('', '');
          } catch (err) { UI.err(err); submitBtn.disabled = false; submitBtn.textContent = '👤 Create Account'; }
        };
      });
  };
  load('', '').catch(e => UI.err(e));
};

/* =================== ADMIN: LANDS =================== */
Pages.adminLands = async function (host) {
  if (!Auth.require(['ADMIN'])) return;
  host.innerHTML = dashShell('Property Management', 'Approve, reject, verify and remove land listings.', ADMIN_NAV, 'al');
  const el = document.getElementById('al');
  const load = async (status) => {
    el.innerHTML = `<div class="tabs">${['PENDING', 'ACTIVE', 'REJECTED', 'RESERVED', 'SOLD', ''].map(s =>
      `<button class="${status === s ? 'active' : ''}" data-st="${s}">${s || 'All'}</button>`).join('')}</div><div id="alt">${UI.skeletonCards(1)}</div>`;
    document.querySelectorAll('[data-st]').forEach(b => b.onclick = () => load(b.dataset.st));
    const r = await API.get('/api/admin/lands' + API.qs({ status }));
    document.getElementById('alt').innerHTML = r.items.length ? `<div class="table-wrap"><table><thead><tr>
      <th>Property</th><th>Seller</th><th>Size / Price</th><th>Status</th><th>Verification</th><th>Actions</th></tr></thead><tbody>
      ${r.items.map(l => `<tr>
        <td><div style="display:flex;gap:9px;align-items:center"><img src="${esc(l.cover || '/img/land1.jpg')}" style="width:52px;height:40px;border-radius:7px;object-fit:cover">
          <div><b>${esc((l.title || 'Listing #' + l.id).slice(0, 44))}</b><br><span style="font-size:12px;color:var(--gray-600)">${esc(l.city || '—')}, ${esc(l.district || '—')} · ${esc(l.land_type || '')}</span></div></div></td>
        <td style="font-size:12.5px">${esc(l.seller_name || (l.seller && l.seller.full_name) || 'Seller')}</td>
        <td style="font-size:12.5px">${esc((l.size && l.size.display) || (l.perches ? l.perches + ' Perches' : '—'))}<br><b>${esc(l.price_display || fmt.lkr(l.price || 0))}</b></td>
        <td>${UI.pill(l.status)}</td><td>${UI.pill(l.verification)}</td>
        <td style="white-space:nowrap">
          <a class="btn btn-ghost btn-sm" href="#/land/${l.id}">View</a>
          ${l.status !== 'ACTIVE' ? `<button class="btn btn-primary btn-sm" data-ls="${l.id}" data-v="ACTIVE">Approve</button>` : ''}
          ${l.status !== 'REJECTED' ? `<button class="btn btn-ghost btn-sm" data-ls="${l.id}" data-v="REJECTED">Reject</button>` : ''}
          <button class="btn btn-ghost btn-sm" data-lv="${l.id}" data-v="${l.verification === 'VERIFIED' ? 'PENDING' : 'VERIFIED'}">${l.verification === 'VERIFIED' ? 'Unverify' : '✓ Verify'}</button>
        </td></tr>`).join('')}</tbody></table></div>` : UI.empty('🏝️', 'No listings in this state', '');
    document.querySelectorAll('[data-ls]').forEach(b => b.onclick = async () => {
      try { await API.put(`/api/admin/lands/${b.dataset.ls}/status`, { status: b.dataset.v }); UI.toast('Listing ' + b.dataset.v.toLowerCase()); load(status); } catch (e) { UI.err(e); }
    });
    document.querySelectorAll('[data-lv]').forEach(b => b.onclick = async () => {
      try { await API.put(`/api/admin/lands/${b.dataset.lv}/verify`, { verification: b.dataset.v }); UI.toast('Verification updated'); load(status); } catch (e) { UI.err(e); }
    });
  };
  load('PENDING').catch(e => UI.err(e));
};

/* =================== BOOKINGS =================== */
Pages.bookings = async function (host) {
  if (!Auth.require()) return;
  host.innerHTML = dashShell('Reservations', 'Track land reservations and their statuses.', navFor(), 'bkg');
  const el = document.getElementById('bkg');
  try {
    const r = await API.get('/api/bookings');
    el.innerHTML = r.items.length ? `<div class="table-wrap"><table><thead><tr>
      <th>#</th><th>Property</th><th>Buyer</th><th>Seller</th><th>Preferred date</th><th>Status</th><th>Actions</th></tr></thead><tbody>
      ${r.items.map(b => `<tr>
        <td><b>#${b.id}</b></td>
        <td><a href="#/land/${b.land_id}" style="color:var(--emerald);font-weight:700">${esc((b.land_title || 'Listing #' + b.land_id).slice(0, 40))}</a><br>
          <span style="font-size:12px;color:var(--gray-600)">${esc(b.city || '—')}, ${esc(b.district || '—')}${b.price ? ' · ' + fmt.lkr(b.price) : ''}</span></td>
        <td style="font-size:12.5px">${esc(b.buyer_name || 'Buyer')}<br>${esc(b.contact_no || '')}</td>
        <td style="font-size:12.5px">${esc(b.seller_full_name || b.seller_name || 'Seller')}</td>
        <td>${b.preferred_date || '—'}</td><td>${UI.pill(b.status)}</td>
        <td style="white-space:nowrap">
          ${b.status === 'PENDING' && (b.seller_id === State.user.id || State.user.role === 'ADMIN') ?
        `<button class="btn btn-primary btn-sm" data-b="${b.id}" data-s="APPROVED">Approve</button>
             <button class="btn btn-ghost btn-sm" data-b="${b.id}" data-s="REJECTED">Reject</button>` : ''}
          ${b.status === 'APPROVED' && b.buyer_id === State.user.id ? `<button class="btn btn-gold btn-sm" data-pay="${b.id}">💳 Pay deposit</button>` : ''}
          ${['PENDING', 'APPROVED'].includes(b.status) && b.buyer_id === State.user.id ? `<button class="btn btn-ghost btn-sm" data-b="${b.id}" data-s="CANCELLED">Cancel</button>` : ''}
          ${b.status === 'COMPLETED' && b.buyer_id === State.user.id ? `<button class="btn btn-ghost btn-sm" data-rev="${b.seller_id}" data-name="${esc(b.seller_full_name || b.seller_name || 'Seller')}" data-land="${b.land_id}">⭐ Review</button>` : ''}
        </td></tr>`).join('')}</tbody></table></div>`
      : UI.empty('🔑', 'No reservations yet', 'Reservations you make or receive will appear here.', '<a class="btn btn-primary" href="#/buy">Browse land</a>');
    el.querySelectorAll('[data-b]').forEach(x => x.onclick = async () => {
      try { await API.put(`/api/bookings/${x.dataset.b}/status`, { status: x.dataset.s }); UI.toast('Reservation ' + x.dataset.s.toLowerCase()); Router.render(); } catch (e) { UI.err(e); }
    });
    el.querySelectorAll('[data-pay]').forEach(x => x.onclick = () => Forms.pay(r.items.find(b => b.id === Number(x.dataset.pay))));
    el.querySelectorAll('[data-rev]').forEach(x => x.onclick = () => Forms.review(Number(x.dataset.rev), x.dataset.name, Number(x.dataset.land)));
  } catch (e) { UI.err(e); }
};

/* =================== PAYMENTS =================== */
Pages.payments = async function (host) {
  if (!Auth.require()) return;
  host.innerHTML = dashShell('Payments', 'Sandbox payment history and downloadable LKR invoices.', navFor(), 'pay');
  const el = document.getElementById('pay');
  try {
    const r = await API.get('/api/payments');
    const total = r.items.filter(p => p.status === 'SUCCESSFUL').reduce((s, p) => s + p.amount, 0);
    el.innerHTML = `
      <div class="notice" style="margin-bottom:18px"><b>Sandbox module:</b> all transactions below are simulated for this university project. No real funds are processed and no real card data is stored.</div>
      <div class="grid-4" style="margin-bottom:22px">
        <div class="stat"><b>${fmt.short(total)}</b><span>Total Successful (LKR)</span></div>
        <div class="stat gold"><b>${r.items.filter(p => p.status === 'PENDING').length}</b><span>Pending</span></div>
        <div class="stat red"><b>${r.items.filter(p => p.status === 'FAILED').length}</b><span>Failed</span></div>
        <div class="stat navy"><b>${r.items.length}</b><span>Total Transactions</span></div>
      </div>
      ${r.items.length ? `<div class="table-wrap"><table><thead><tr>
        <th>Invoice</th><th>Property</th><th>Method</th><th>Amount</th><th>Status</th><th>Date</th><th>Invoice PDF</th>
        ${State.user.role === 'ADMIN' ? '<th>Admin</th>' : ''}</tr></thead><tbody>
        ${r.items.map(p => `<tr>
          <td><b>${esc(p.invoice_no)}</b><br><span style="font-size:11.5px;color:var(--gray-400)">${esc(p.reference)}</span></td>
          <td style="font-size:12.5px">${esc((p.land_title || 'Reservation #' + p.booking_id).slice(0, 38))}<br><span style="color:var(--gray-600)">${esc(p.district || '—')}</span></td>
          <td><span class="chip">${esc((p.method || '').replace('_', ' '))}</span></td>
          <td><b>${fmt.lkr(p.amount)}</b></td><td>${UI.pill(p.status)}</td><td>${fmt.date(p.created_at)}</td>
          <td><a class="btn btn-ghost btn-sm" href="/api/payments/${p.id}/invoice?token=${encodeURIComponent(API.token)}" target="_blank">⬇ PDF</a></td>
          ${State.user.role === 'ADMIN' ? `<td><select class="ctrl" data-ps="${p.id}" style="padding:6px;font-size:12px">
                      ${['PENDING', 'SUCCESSFUL', 'FAILED', 'REFUNDED'].map(s => `<option ${p.status === s ? 'selected' : ''}>${s}</option>`).join('')}</select>
          ${p.status !== 'SUCCESSFUL' ? `<button class="btn btn-ghost btn-sm" data-pdel="${p.id}" style="margin-left:6px;color:#c0392b">🗑 Delete</button>` : ''}</td>` : ''}
        </tr>`).join('')}</tbody></table></div>`
    : UI.empty('💳', 'No payments yet', 'Approved reservations can be settled through the sandbox payment module.')}`;
    el.querySelectorAll('[data-ps]').forEach(s => s.onchange = async () => {
      try { await API.put(`/api/payments/${s.dataset.ps}/status`, { status: s.value }); UI.toast('Payment status updated');  Pages.payments(host); } catch (e) { UI.err(e); }
    });

    el.querySelectorAll('[data-pdel]').forEach(b => b.onclick = async () => {
      if (!confirm('Delete this payment permanently? This cannot be undone.')) return;
      try {
        const res = await fetch('/api/payments/' + b.dataset.pdel, {
          method: 'DELETE',
          headers: { 'Authorization': 'Bearer ' + API.token }
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.message || body.error || 'Delete failed');
        }
        UI.toast('Payment deleted');
        Pages.payments(host);
      } catch (e) { UI.err(e); }
    });

  } catch (e) { UI.err(e); }
};

/* =================== MESSAGES =================== */
Pages.messages = async function (host) {
  if (!Auth.require()) return;
  // Full-screen chat layout — override the dash-main padding so the chat fills the page
  host.innerHTML = dashShell('Messages', 'Secure conversations between buyers and sellers.', navFor(), 'msg');
  const el = document.getElementById('msg');
  el.style.cssText = 'margin:-28px;height:calc(100vh - 120px);display:flex;flex-direction:column;';
  el.innerHTML = '<div style="display:flex;height:100%;overflow:hidden;border-radius:12px;border:1px solid var(--gray-200);background:#fff" id="chatRoot"></div>';
  const root = document.getElementById('chatRoot');

  let allConvs = [];

  async function loadConvs() {
    try {
      const r = await API.get('/api/messages');
      allConvs = r.items;
      if (!allConvs.length) {
        root.innerHTML = `<div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;color:var(--gray-400)">
          <div style="font-size:48px">💬</div>
          <b style="font-size:17px;color:var(--gray-600)">No conversations yet</b>
          <p style="font-size:13.5px;text-align:center;max-width:280px">Start a conversation by contacting a seller from any land listing.</p>
          <a class="btn btn-primary" href="#/buy">Browse Land</a></div>`;
        return;
      }
      renderSidebar(allConvs, 0);
      openThread(allConvs[0]);
    } catch(e) { UI.err(e); }
  }

  function renderSidebar(convs, activeIdx) {
    const sideEl = document.getElementById('chatSide');
    const list = convs.map((c, i) => {
      const name = c.other ? c.other.full_name : 'User';
      const initials = name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
      const isActive = i === activeIdx;
      return `<div class="chat-conv-item" data-conv="${i}" style="display:flex;gap:12px;align-items:center;padding:12px 16px;cursor:pointer;border-bottom:1px solid var(--gray-100);transition:background .15s;${isActive ? 'background:var(--emerald-soft);' : ''}">
        <div style="width:44px;height:44px;border-radius:50%;background:var(--navy);display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;font-weight:700;flex-shrink:0">${initials}</div>
        <div style="min-width:0;flex:1">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <b style="font-size:13.5px;color:var(--navy);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:130px">${esc(name)}</b>
            ${c.unread ? `<span style="background:var(--emerald);color:#fff;border-radius:50%;width:20px;height:20px;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0">${c.unread}</span>` : ''}
          </div>
          <div style="font-size:12px;color:var(--gray-500);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:2px">${esc((c.last_body || '').slice(0, 42))}</div>
          ${c.land ? `<div style="font-size:11px;color:var(--emerald);margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">🏝️ ${esc(c.land.title.slice(0, 30))}</div>` : ''}
        </div>
      </div>`;
    }).join('');
    if (sideEl) sideEl.innerHTML = list;
    else {
      root.innerHTML = `
        <div id="chatSide" style="width:280px;flex-shrink:0;border-right:1px solid var(--gray-200);overflow-y:auto;display:flex;flex-direction:column">
          <div style="padding:14px 16px;border-bottom:1px solid var(--gray-200);background:var(--gray-50)">
            <b style="font-size:14px;color:var(--navy)">💬 Conversations</b>
          </div>
          ${list}
        </div>
        <div id="chatMain" style="flex:1;display:flex;flex-direction:column;overflow:hidden"></div>`;
    }
    // Re-bind click handlers
    document.querySelectorAll('.chat-conv-item').forEach(div => {
      div.onclick = () => {
        document.querySelectorAll('.chat-conv-item').forEach(x => x.style.background = '');
        div.style.background = 'var(--emerald-soft)';
        openThread(allConvs[Number(div.dataset.conv)]);
      };
    });
  }

  async function openThread(c) {
    const main = document.getElementById('chatMain');
    if (!main) return;
    main.innerHTML = `<div style="display:flex;align-items:center;gap:12px;padding:12px 18px;border-bottom:1px solid var(--gray-200);background:#fff;flex-shrink:0">
        <div style="width:40px;height:40px;border-radius:50%;background:var(--navy);color:#fff;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;flex-shrink:0">
          ${(c.other ? c.other.full_name : 'U').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}
        </div>
        <div>
          <b style="font-size:14px;color:var(--navy)">${esc(c.other ? c.other.full_name : 'User')}</b>
          <div style="font-size:12px;color:var(--gray-500)">${esc(c.other ? c.other.role : '')}</div>
        </div>
        ${c.land ? `<a class="btn btn-ghost btn-sm" style="margin-left:auto" href="#/land/${c.land.id}">View property</a>` : ''}
      </div>
      <div id="thBody" style="flex:1;overflow-y:auto;padding:18px 20px;display:flex;flex-direction:column;gap:10px;background:#f5f6fa"></div>
      <div style="padding:12px 16px;border-top:1px solid var(--gray-200);background:#fff;flex-shrink:0">
        <form id="thForm" style="display:flex;gap:8px;align-items:center">
          <input class="ctrl" name="body" placeholder="Type your message…" required autocomplete="off" style="flex:1;border-radius:24px;padding:10px 18px">
          <button class="btn btn-primary" style="border-radius:50%;width:44px;height:44px;padding:0;font-size:18px;flex-shrink:0">➤</button>
        </form>
      </div>`;

    try {
      const d = await API.get(`/api/messages/thread?with=${c.other.id}&land_id=${c.land ? c.land.id : 0}`);
      const bodyEl = document.getElementById('thBody');
      if (!bodyEl) return;

      bodyEl.innerHTML = d.items.length ? d.items.map(function(m) {
        var isMine = m.sender_id === State.user.id;
        var isDeleted = m.deleted === 1;
        var isEdited = m.edited === 1;
        var align = isMine ? 'flex-end' : 'flex-start';
        var bubbleStyle = isMine
          ? 'background:var(--navy);color:#fff;border-radius:18px 18px 4px 18px;'
          : 'background:#fff;color:var(--navy);border-radius:18px 18px 18px 4px;border:1px solid var(--gray-200);';
        var content = isDeleted
          ? '<span style="font-style:italic;opacity:.6">This message was deleted.</span>'
          : esc(m.body);
        var editedTag = (!isDeleted && isEdited) ? '<span style="font-size:10px;opacity:.5;font-style:italic"> · edited</span>' : '';

        // ⋮ menu for own messages
        var menuHtml = '';
        if (isMine && !isDeleted) {
          menuHtml = `<div style="position:relative;align-self:flex-end;margin-bottom:4px">
            <button class="msg-menu-btn" data-msgmenu="${m.id}" style="background:none;border:none;cursor:pointer;font-size:16px;padding:2px 5px;border-radius:6px;opacity:0;transition:opacity .15s;color:var(--gray-500)">⋮</button>
            <div class="msg-dropdown" id="dd-${m.id}" style="display:none;position:absolute;right:0;bottom:100%;z-index:30;background:#fff;border:1px solid var(--gray-200);border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,.12);min-width:160px;overflow:hidden">
              <button class="msg-dd-item" data-edit="${m.id}" style="display:flex;gap:8px;align-items:center;width:100%;padding:10px 14px;border:none;background:none;cursor:pointer;font-size:13px;color:var(--gray-700)">✏️ Edit Message</button>
              <button class="msg-dd-item" data-del="${m.id}" style="display:flex;gap:8px;align-items:center;width:100%;padding:10px 14px;border:none;background:none;cursor:pointer;font-size:13px;color:#C2293B;border-top:1px solid var(--gray-100)">🗑️ Delete Message</button>
            </div>
          </div>`;
        }

        return `<div class="msg-wrap" data-msgwrap="${m.id}" style="display:flex;align-items:flex-end;gap:4px;align-self:${align};max-width:72%">
          ${isMine ? menuHtml : ''}
          <div style="padding:10px 14px;max-width:100%;${bubbleStyle}word-break:break-word;">
            <div style="font-size:14px;line-height:1.5">${content}</div>
            <div style="font-size:10.5px;opacity:.55;margin-top:4px;text-align:${isMine ? 'right' : 'left'}">${fmt.dateTime(m.created_at)}${editedTag}</div>
          </div>
        </div>`;
      }).join('') : `<div style="text-align:center;color:var(--gray-400);font-size:13.5px;margin:auto">No messages yet. Say hello! 👋</div>`;

      bodyEl.scrollTop = bodyEl.scrollHeight;

      // Hover show ⋮
      document.querySelectorAll('.msg-wrap').forEach(function(wrap) {
        var btn = wrap.querySelector('.msg-menu-btn');
        if (!btn) return;
        wrap.addEventListener('mouseenter', () => btn.style.opacity = '1');
        wrap.addEventListener('mouseleave', () => {
          var dd = wrap.querySelector('.msg-dropdown');
          if (dd && dd.style.display === 'none') btn.style.opacity = '0';
        });
      });

      // Toggle dropdown
      document.querySelectorAll('[data-msgmenu]').forEach(function(btn) {
        btn.onclick = function(e) {
          e.stopPropagation();
          var dd = document.getElementById('dd-' + btn.dataset.msgmenu);
          document.querySelectorAll('.msg-dropdown').forEach(d => { if (d !== dd) d.style.display = 'none'; });
          dd.style.display = dd.style.display === 'none' ? 'block' : 'none';
        };
      });
      document.addEventListener('click', function closeDD() {
        document.querySelectorAll('.msg-dropdown').forEach(d => d.style.display = 'none');
        document.removeEventListener('click', closeDD);
      });

      // Edit inline
      document.querySelectorAll('[data-edit]').forEach(function(btn) {
        btn.onclick = function(e) {
          e.stopPropagation();
          var mid = btn.dataset.edit;
          var dd = document.getElementById('dd-' + mid);
          if (dd) dd.style.display = 'none';
          var wrap = document.querySelector('[data-msgwrap="' + mid + '"]');
          var bubble = wrap ? wrap.querySelector('div[style*="padding:10px"]') : null;
          if (!bubble) return;
          var bodyDiv = bubble.querySelector('div[style*="font-size:14px"]');
          var orig = bodyDiv ? bodyDiv.textContent : '';
          var origHTML = bubble.innerHTML;
          bubble.innerHTML = `<textarea class="ctrl" style="min-height:60px;font-size:13.5px;resize:vertical;background:rgba(255,255,255,.15);color:inherit;border-color:rgba(255,255,255,.3);width:100%">${esc(orig)}</textarea>
            <div style="display:flex;gap:6px;margin-top:6px;justify-content:flex-end">
              <button class="btn btn-ghost btn-sm" id="cedit-cancel-${mid}" style="color:inherit;border-color:rgba(255,255,255,.3)">Cancel</button>
              <button class="btn btn-primary btn-sm" id="cedit-save-${mid}">Save</button>
            </div>`;
          var ta = bubble.querySelector('textarea');
          ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length);
          document.getElementById('cedit-cancel-' + mid).onclick = () => { bubble.innerHTML = origHTML; };
          document.getElementById('cedit-save-' + mid).onclick = async function() {
            var newBody = ta.value.trim();
            if (!newBody) { UI.toast('Message cannot be empty', '', 'err'); return; }
            this.disabled = true; this.textContent = 'Saving…';
            try { await API.put('/api/messages/' + mid, { body: newBody }); UI.toast('Updated ✓'); openThread(c); }
            catch(err) { UI.err(err); this.disabled = false; this.textContent = 'Save'; }
          };
        };
      });

      // Delete
      document.querySelectorAll('[data-del]').forEach(function(btn) {
        btn.onclick = function(e) {
          e.stopPropagation();
          var mid = btn.dataset.del;
          var dd = document.getElementById('dd-' + mid);
          if (dd) dd.style.display = 'none';
          if (!confirm('Delete this message? This cannot be undone.')) return;
          API.del('/api/messages/' + mid).then(() => { UI.toast('Message deleted'); openThread(c); }).catch(UI.err);
        };
      });

      // Send
      document.getElementById('thForm').onsubmit = async function(e) {
        e.preventDefault();
        var input = e.target.body;
        var body = input.value.trim();
        if (!body) return;
        input.value = '';
        try {
          await API.post('/api/messages', { receiver_id: c.other.id, land_id: c.land ? c.land.id : null, body });
          openThread(c);
        } catch(err) { UI.err(err); }
      };

    } catch(e) { UI.err(e); }
  }

  loadConvs();
};

/* =================== DOCUMENTS =================== */
Pages.documents = async function (host) {
  if (!Auth.require()) return;
  const isAdmin = State.user.role === 'ADMIN';
  host.innerHTML = dashShell('Document Verification',
    isAdmin ? 'Review deeds, survey plans and registry extracts submitted by sellers.' : 'Upload and track verification of your land documents.',
    navFor(), 'doc', isAdmin ? '' : '<button class="btn btn-primary" id="newDoc">📄 Upload document</button>');
  const el = document.getElementById('doc');
  try {
    const r = await API.get(isAdmin ? '/api/documents' : '/api/documents/mine');
    el.innerHTML = `
      <div class="notice" style="margin-bottom:18px"><b>Important:</b> LandHub verification is an administrative platform check that expected documents were supplied and appear consistent. It is <b>not</b> legal certification of ownership or title. Buyers should always obtain independent legal advice and a lawyer's title search before purchasing land.</div>
      ${r.items.length ? `<div class="table-wrap"><table><thead><tr>
        <th>Document</th><th>Property</th><th>${isAdmin ? 'Uploaded by' : 'District'}</th><th>Status</th><th>Submitted</th>${isAdmin ? '<th>Review</th>' : '<th>Remarks</th>'}</tr></thead><tbody>
        ${r.items.map(d => `<tr>
          <td><b>${esc((d.doc_type || '').replace(/_/g, ' '))}</b><br><span style="font-size:11.5px;color:var(--gray-400)">${esc(d.file_name || '')}</span></td>
          <td><a href="#/land/${d.land_id}" style="color:var(--emerald);font-weight:700">${esc((d.land_title || 'Listing #' + d.land_id).slice(0, 36))}</a></td>
          <td style="font-size:12.5px">${esc(isAdmin ? (d.uploader_name || '—') : (d.district || '—'))}</td>
          <td>${UI.pill(d.status)}</td><td>${fmt.date(d.created_at)}</td>
          <td>${isAdmin ? `<button class="btn btn-primary btn-sm" data-dv="${d.id}" data-s="VERIFIED">✓ Verify</button>
             <button class="btn btn-ghost btn-sm" data-dv="${d.id}" data-s="REJECTED">✕ Reject</button>`
        : esc(d.remarks || '—')}</td></tr>`).join('')}
        </tbody></table></div>`
        : UI.empty('📄', isAdmin ? 'No documents submitted' : 'No documents uploaded yet',
          isAdmin ? 'Documents uploaded by sellers will appear here.' : 'Upload your deed and survey plan to earn the ✓ Verified badge.')}`;
    el.querySelectorAll('[data-dv]').forEach(b => b.onclick = async () => {
      const remarks = b.dataset.s === 'REJECTED' ? prompt('Reason for rejection (shared with the seller):') : '';
      if (b.dataset.s === 'REJECTED' && remarks === null) return;
      try {
        const res = await API.put(`/api/documents/${b.dataset.dv}/review`, { status: b.dataset.s, remarks });
        UI.toast('Document ' + b.dataset.s.toLowerCase(), 'Listing verification: ' + res.land_verification);
        Router.render();
      } catch (e) { UI.err(e); }
    });
    const nd = document.getElementById('newDoc');
    if (nd) nd.onclick = async () => {
      const mine = await API.get('/api/lands' + API.qs({ seller_id: State.user.id, limit: 60 }));
      mine.items.length ? Forms.uploadDoc(mine.items) : UI.toast('Post a listing first', 'Documents attach to a property.', 'warn');
    };
  } catch (e) { UI.err(e); }
};

/* =================== REVIEWS =================== */
Pages.reviews = async function (host) {
  if (!Auth.require()) return;
  const isAdmin = State.user.role === 'ADMIN';
  host.innerHTML = dashShell('Reviews & Ratings', isAdmin ? 'Moderate buyer reviews before they appear publicly.' : 'Reviews you have written or received.', navFor(), 'rev');
  const el = document.getElementById('rev');
  try {
    const r = await API.get('/api/reviews');
    el.innerHTML = r.items.length ? `<div class="table-wrap"><table><thead><tr>
      <th>Buyer</th><th>Seller</th><th>Property</th><th>Rating</th><th>Review</th><th>Status</th>${isAdmin ? '<th>Moderate</th>' : ''}</tr></thead><tbody>
      ${r.items.map(v => `<tr>
        <td><b>${esc(v.buyer_name)}</b><br><span style="font-size:11.5px;color:var(--gray-400)">${fmt.date(v.created_at)}</span></td>
        <td style="font-size:12.5px">${esc(v.seller_name)}</td>
        <td style="font-size:12.5px">${esc(v.land_title ? v.land_title.slice(0, 34) : '—')}</td>
        <td><span class="stars">${UI.stars(v.rating)}</span></td>
        <td style="max-width:280px;font-size:13px;color:var(--gray-600)">${esc(v.comment || '—')}</td>
        <td>${UI.pill(v.status)}</td>
        ${isAdmin ? `<td style="white-space:nowrap">
          <button class="btn btn-primary btn-sm" data-rv="${v.id}" data-s="APPROVED">Approve</button>
          <button class="btn btn-ghost btn-sm" data-rv="${v.id}" data-s="REJECTED">Reject</button>
          <button class="btn btn-ghost btn-sm" data-rd="${v.id}">🗑️</button></td>` : ''}</tr>`).join('')}
      </tbody></table></div>` : UI.empty('⭐', 'No reviews yet', 'Reviews can be written after an approved or completed reservation.');
    el.querySelectorAll('[data-rv]').forEach(b => b.onclick = async () => {
      try { await API.put(`/api/reviews/${b.dataset.rv}/moderate`, { status: b.dataset.s }); UI.toast('Review ' + b.dataset.s.toLowerCase()); Router.render(); } catch (e) { UI.err(e); }
    });
    el.querySelectorAll('[data-rd]').forEach(b => b.onclick = async () => {
      if (!confirm('Delete this review?')) return;
      try { await API.del('/api/reviews/' + b.dataset.rd); UI.toast('Review deleted'); Router.render(); } catch (e) { UI.err(e); }
    });
  } catch (e) { UI.err(e); }
};

/* =================== REPORTS =================== */
Pages.reports = async function (host) {
  if (!Auth.require(['ADMIN'])) return;
  host.innerHTML = dashShell('Reports', 'Generate and archive platform analytics reports.', ADMIN_NAV, 'rep',
    `<div style="display:flex;gap:8px;align-items:center">
      <select class="ctrl" id="repType" style="max-width:200px">
        <option value="SUMMARY">Platform Summary</option>
        <option value="SALES">Sales by District</option>
        <option value="LISTINGS">Listings Breakdown</option>
        <option value="USERS">User Roles</option>
        <option value="INQUIRIES">Inquiries / Messages</option>
      </select>
      <button class="btn btn-primary" id="genRep">📊 Generate</button></div>`);
  const el = document.getElementById('rep');

  function renderCard(val, label) {
    return `<div style="flex:1;min-width:160px;padding:18px 20px;border-radius:10px;border:1px solid var(--gray-100);border-left:4px solid var(--emerald);background:#fff">
      <div style="font-size:26px;font-weight:700;color:var(--navy)">${val}</div>
      <div style="font-size:13px;color:var(--gray-600);margin-top:3px">${label}</div></div>`;
  }

  function renderPayload(type, raw) {
    try {
      if (!raw) return '<p style="color:var(--gray-600)">No report data.</p>';
      const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (!data) return '<p style="color:var(--gray-600)">No report data.</p>';
      if (type === 'SUMMARY') {
        return `<div style="display:flex;flex-wrap:wrap;gap:14px">
          ${renderCard(data.properties || 0, 'Total Properties')}
          ${renderCard(data.users || 0, 'Total Users')}
          ${renderCard(data.reservations || 0, 'Total Reservations')}
          ${renderCard(data.payments || 0, 'Total Payments')}
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:14px;margin-top:14px">
          ${renderCard(data.revenue != null ? fmt.lkr(data.revenue) : 'Rs. 0', 'Total Revenue')}
          ${renderCard(data.pending_approval || 0, 'Pending Approval')}
          ${renderCard(data.pending_documents || 0, 'Pending Documents')}
        </div>`;
      }
      if (type === 'USERS' && Array.isArray(data)) {
        return `<div style="display:flex;flex-wrap:wrap;gap:14px">${data.map(r =>
          renderCard(r.c, r.role)).join('')}</div>`;
      }
      if (type === 'SALES' && Array.isArray(data)) {
        return data.length ? `<div class="table-wrap"><table><thead><tr>
          <th>District</th><th>Sales</th><th>Revenue</th></tr></thead><tbody>
          ${data.map(r => `<tr><td>${esc(r.district)}</td><td>${r.c}</td><td><b>${fmt.lkr(r.revenue)}</b></td></tr>`).join('')}
          </tbody></table></div>` : '<p style="color:var(--gray-600)">No sales data yet.</p>';
      }
      if (type === 'LISTINGS' && Array.isArray(data)) {
        return data.length ? `<div class="table-wrap"><table><thead><tr>
          <th>District</th><th>Land Type</th><th>Count</th></tr></thead><tbody>
          ${data.map(r => `<tr><td>${esc(r.district)}</td><td>${esc(r.land_type)}</td><td><b>${r.c}</b></td></tr>`).join('')}
          </tbody></table></div>` : '<p style="color:var(--gray-600)">No listings data yet.</p>';
      }
      if (type === 'INQUIRIES') {
        return `<div style="display:flex;flex-wrap:wrap;gap:14px">
          ${renderCard(data.total_inquiries || 0, 'Total Inquiries')}
          ${renderCard(data.open || 0, 'Open')}
          ${renderCard(data.pending || 0, 'Pending Clarification')}
          ${renderCard(data.resolved || 0, 'Resolved')}
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:14px;margin-top:14px">
          ${renderCard(data.total_messages || 0, 'Total Messages')}
          ${renderCard(data.conversations || 0, 'Conversations')}
        </div>`;
      }
      // Fallback: formatted JSON
      return `<pre style="background:var(--gray-50);padding:14px;border-radius:10px;overflow:auto;font-size:12.5px;margin:0">${esc(JSON.stringify(data, null, 2))}</pre>`;
    } catch (_) {
      return `<pre style="background:var(--gray-50);padding:14px;border-radius:10px;overflow:auto;font-size:12.5px;margin:0">${esc(String(raw))}</pre>`;
    }
  }

  const load = async () => {
    el.innerHTML = UI.skeletonCards(1);
    try {
      const r = await API.get('/api/admin/reports');
      el.innerHTML = r.items.length ? r.items.map(x => `<div class="panel" style="margin-bottom:18px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <div class="panel-title" style="margin:0">📄 ${esc(x.report_type)} Report <span class="pill p-gray">${fmt.dateTime(x.created_at)}</span></div>
          <button class="btn btn-ghost btn-sm" data-delrep="${x.id}">🗑️ Delete</button>
        </div>
        ${renderPayload(x.report_type, x.payload)}
      </div>`).join('') : UI.empty('📈', 'No reports generated yet', 'Choose a report type above and click Generate.');
      document.querySelectorAll('[data-delrep]').forEach(b => b.onclick = async () => {
        if (!confirm('Delete this report?')) return;
        try { await API.del('/api/admin/reports/' + b.dataset.delrep); UI.toast('Report deleted'); load(); } catch (e) { UI.err(e); }
      });
    } catch (e) {
      el.innerHTML = UI.empty('⚠️', 'Unable to load report data', e.message + '. Please try again.');
    }
  };

  document.getElementById('genRep').onclick = async () => {
    try { await API.post('/api/admin/reports', { report_type: document.getElementById('repType').value }); UI.toast('Report generated ✓'); load(); }
    catch (e) { UI.err(e); }
  };
  load();
};

/* =================== PROFILE =================== */
Pages.profile = async function (host) {
  if (!Auth.require()) return;
  host.innerHTML = dashShell('My Profile', 'Update your personal details and password.', navFor(), 'prof');
  const el = document.getElementById('prof');
  const me = await API.get('/api/users/me');
  el.innerHTML = `<div class="grid-2">
    <form class="panel" id="pf">
      <div class="panel-title">👤 Personal details</div>
      <div style="display:flex;flex-direction:column;gap:13px">
        <div class="field"><label>Full name</label><input class="ctrl" name="full_name" value="${esc(me.full_name)}"></div>
        <div class="field"><label>Email (read-only)</label><input class="ctrl" value="${esc(me.email)}" disabled style="background:var(--gray-50)"></div>
        <div class="field"><label>Phone</label><input class="ctrl" name="phone" value="${esc(me.phone || '')}" placeholder="+94 77 123 4567"></div>
        <div class="field"><label>NIC</label><input class="ctrl" name="nic" value="${esc(me.nic || '')}"></div>
        <div class="field"><label>Preferred language</label><select class="ctrl" name="language">
          ${[['en', 'English'], ['si', 'සිංහල'], ['ta', 'தமிழ்']].map(([v, l]) => `<option value="${v}" ${me.language === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
        <button class="btn btn-primary">Save changes</button>
      </div></form>
    <div style="display:flex;flex-direction:column;gap:18px">
      <form class="panel" id="pw"><div class="panel-title">🔒 Change password</div>
        <div style="display:flex;flex-direction:column;gap:13px">
          <div class="field"><label>Current password</label><input class="ctrl" name="current_password" type="password" required></div>
          <div class="field"><label>New password</label><input class="ctrl" name="new_password" type="password" required><span class="hint">8+ characters with a letter and a number</span></div>
          <button class="btn btn-navy">Update password</button>
        </div></form>
      <div class="panel"><div class="panel-title">🪪 Account</div>
        <div style="display:flex;flex-direction:column;gap:9px;font-size:13.5px;color:var(--gray-600)">
          <div>Role: <b style="color:var(--navy)">${esc(me.role)}</b></div>
          <div>Status: ${UI.pill(me.status)}</div>
          <div>Member since: <b style="color:var(--navy)">${fmt.date(me.created_at)}</b></div>
          ${me.seller ? `<div>Seller rating: <span class="stars">${UI.stars(me.seller.rating_avg)}</span> ${me.seller.rating_avg} (${me.seller.rating_count})</div>` : ''}
        </div></div>
    </div></div>`;
  document.getElementById('pf').onsubmit = async e => {
    e.preventDefault();
    try {
      const u = await API.put('/api/users/me', Object.fromEntries(new FormData(e.target).entries()));
      State.user = { ...State.user, ...u }; UI.toast('Profile updated ✓'); Chrome.renderNav();
    } catch (err) { UI.err(err); }
  };
  document.getElementById('pw').onsubmit = async e => {
    e.preventDefault();
    try { const r = await API.post('/api/auth/change-password', Object.fromEntries(new FormData(e.target).entries())); UI.toast('Password updated ✓', r.message); e.target.reset(); }
    catch (err) { UI.err(err); }
  };
};
