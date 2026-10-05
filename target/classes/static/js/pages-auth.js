/* Login, Register, Forgot Password, Sell Land, Compare, Wishlist, Notifications */
'use strict';

Pages.login = function (host, params) {
  const next = new URLSearchParams(params).get('next') || '';
  host.innerHTML = `
  <div class="auth">
    <div class="auth-art"><div>
      <h2 style="color:#fff;font-size:31px">Welcome back to LandHub</h2>
      <p style="color:rgba(255,255,255,.82);margin-top:12px">Sign in to manage your listings, saved land, reservations and messages across Sri Lanka.</p>
      <div style="margin-top:26px;display:flex;flex-direction:column;gap:9px;font-size:13.5px;color:rgba(255,255,255,.75)">
        <span>✓ Verified property listings in all 25 districts</span>
        <span>✓ Secure in-platform messaging</span>
        <span>✓ Reservations, invoices and reviews</span>
      </div>
    </div></div>
    <div class="auth-form"><div class="inner">
      <h1 style="font-size:28px">Sign in</h1>
      <p style="color:var(--gray-600);margin:8px 0 24px">New to LandHub? <a href="#/register" style="color:var(--emerald);font-weight:700">Create an account</a></p>
      <form id="loginForm" style="display:flex;flex-direction:column;gap:14px">
        <div class="field"><label>Email address</label><input class="ctrl" name="email" type="email" required placeholder="you@example.lk"></div>
        <div class="field"><label>Password</label><input class="ctrl" name="password" type="password" required placeholder="••••••••"></div>
        <div style="display:flex;justify-content:space-between;align-items:center;font-size:13px">
          <label class="check" style="border:0;padding:0"><input type="checkbox"> Remember me</label>
          <a href="#/forgot" style="color:var(--emerald);font-weight:700">Forgot password?</a>
        </div>
        <button class="btn btn-primary btn-lg btn-block">Sign in</button>
      </form>
      <div class="panel" style="margin-top:22px;background:var(--gray-50)">
        <b style="font-size:13px">🎓 Demo accounts (password: <code>Landhub@2026</code>)</b>
        <div style="display:flex;flex-direction:column;gap:6px;margin-top:10px">
          ${[['admin@landhub.lk', 'Administrator'], ['sunil@landhub.lk', 'Seller'], ['dilani@landhub.lk', 'Buyer'], ['ayesha@landhub.lk', 'Agent']]
      .map(([e, r]) => `<button class="btn btn-ghost btn-sm" data-demo="${e}" style="justify-content:space-between">${e}<span class="pill p-navy">${r}</span></button>`).join('')}
        </div>
      </div>
    </div></div>
  </div>`;

  const doLogin = async (email, password, btn) => {
    if (btn) { btn.disabled = true; btn.textContent = 'Signing in…'; }
    try {
      const u = await Auth.login(email, password);
      UI.toast('Welcome back, ' + u.full_name.split(' ')[0] + '!', 'Signed in as ' + u.role.toLowerCase());
      Chrome.renderNav();
      Router.go(next || Auth.home());
    } catch (e) { UI.err(e); if (btn) { btn.disabled = false; btn.textContent = 'Sign in'; } }
  };
  document.getElementById('loginForm').onsubmit = e => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target).entries());
    doLogin(f.email, f.password, e.target.querySelector('button'));
  };
  document.querySelectorAll('[data-demo]').forEach(b => b.onclick = () => doLogin(b.dataset.demo, 'Landhub@2026'));
};

Pages.register = function (host) {
  host.innerHTML = `
  <div class="auth">
    <div class="auth-art" style="background-image:url('/img/land3.jpg')"><div>
      <h2 style="color:#fff;font-size:31px">Join Sri Lanka's land marketplace</h2>
      <p style="color:rgba(255,255,255,.82);margin-top:12px">Whether you are buying your first 10 perches or selling a coconut estate, LandHub gives you the tools.</p>
    </div></div>
    <div class="auth-form"><div class="inner">
      <h1 style="font-size:28px">Create your account</h1>
      <p style="color:var(--gray-600);margin:8px 0 22px">Already registered? <a href="#/login" style="color:var(--emerald);font-weight:700">Sign in</a></p>
      <form id="regForm" style="display:flex;flex-direction:column;gap:14px">
        <div class="field"><label>I want to…</label>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">
            <label class="check on" style="justify-content:center"><input type="radio" name="role" value="BUYER" checked hidden>🔍 Buy</label>
            <label class="check" style="justify-content:center"><input type="radio" name="role" value="SELLER" hidden>🏷️ Sell</label>
            <label class="check" style="justify-content:center"><input type="radio" name="role" value="AGENT" hidden>🤝 Agent</label>
          </div></div>
        <div class="field"><label>Full name *</label><input class="ctrl" name="full_name" required placeholder="e.g. Nimali Perera"></div>
        <div class="field"><label>Email address *</label><input class="ctrl" name="email" type="email" required placeholder="you@example.lk"></div>
        <div class="field"><label>Mobile number *</label><input class="ctrl" name="phone" required placeholder="+94 77 123 4567"><span class="hint">Sri Lankan format: +94 XX XXX XXXX or 0XXXXXXXXX</span></div>
        <div class="field"><label>NIC number</label><input class="ctrl" name="nic" placeholder="200012345678 (optional)"></div>
        <div class="field"><label>Password *</label><input class="ctrl" name="password" type="password" required placeholder="Minimum 8 characters"><span class="hint">At least 8 characters, including a letter and a number</span></div>
        <div class="field"><label>Preferred language</label><select class="ctrl" name="language">
          <option value="en">English</option><option value="si">සිංහල</option><option value="ta">தமிழ்</option></select></div>
        <label class="check"><input type="checkbox" required> I agree to the platform terms and understand that document verification is an administrative check, not legal certification.</label>
        <button class="btn btn-primary btn-lg btn-block">Create account</button>
      </form>
    </div></div>
  </div>`;
  host.querySelectorAll('input[name=role]').forEach(r => r.onchange = () => {
    host.querySelectorAll('input[name=role]').forEach(x => x.closest('.check').classList.toggle('on', x.checked));
  });
  document.getElementById('regForm').onsubmit = async e => {
    e.preventDefault();
    const btn = e.target.querySelector('button[class*=primary]');
    const f = Object.fromEntries(new FormData(e.target).entries());
    btn.disabled = true; btn.textContent = 'Creating account…';
    try {
      const r = await API.post('/api/auth/register', f);
      API.setToken(r.token); State.user = r.user;
      UI.toast('Account created 🎉', 'Ayubowan, ' + r.user.full_name.split(' ')[0] + '!');
      Chrome.renderNav(); Router.go(Auth.home());
    } catch (err) { UI.err(err); btn.disabled = false; btn.textContent = 'Create account'; }
  };
};

Pages.forgot = function (host) {
  host.innerHTML = `<div class="auth"><div class="auth-art" style="background-image:url('/img/land6.jpg')"><div>
    <h2 style="color:#fff;font-size:29px">Reset your password</h2>
    <p style="color:rgba(255,255,255,.82);margin-top:10px">We'll send reset instructions to your registered email address.</p></div></div>
    <div class="auth-form"><div class="inner">
      <h1 style="font-size:27px">Forgot password</h1>
      <p style="color:var(--gray-600);margin:8px 0 22px">Enter the email you registered with.</p>
      <form id="fgForm" style="display:flex;flex-direction:column;gap:14px">
        <div class="field"><label>Email address</label><input class="ctrl" name="email" type="email" required placeholder="you@example.lk"></div>
        <button class="btn btn-primary btn-lg btn-block">Send reset instructions</button>
        <a class="btn btn-ghost btn-block" href="#/login">Back to sign in</a>
      </form>
      <div class="notice" style="margin-top:20px">In this demonstration build no email is actually sent — a notification is created in the account instead.</div>
    </div></div></div>`;
  document.getElementById('fgForm').onsubmit = async e => {
    e.preventDefault();
    try { const r = await API.post('/api/auth/forgot-password', { email: e.target.email.value }); UI.toast('Request received', r.message); }
    catch (err) { UI.err(err); }
  };
};

/* =================== SELL LAND =================== */
Pages.sell = function (host) {
  if (!State.user) {
    host.innerHTML = `<div class="wrap"><section>${UI.empty('🏷️', 'Sign in to post your land',
      'Create a free seller account to advertise your property to buyers across Sri Lanka.',
      '<div style="display:flex;gap:10px;justify-content:center;margin-top:16px"><a class="btn btn-primary" href="#/register">Create seller account</a><a class="btn btn-ghost" href="#/login">Sign in</a></div>')}</section></div>`;
    return;
  }
  if (!['SELLER', 'AGENT', 'ADMIN'].includes(State.user.role)) {
    host.innerHTML = `<div class="wrap"><section>${UI.empty('🔒', 'Seller account required',
      'Your account is registered as a buyer. Register a seller or agent account to post land.')}</section></div>`;
    return;
  }

  const feats = [['electricity', '⚡ Electricity'], ['water', '💧 Water supply'], ['main_road', '🛣️ Main road access'],
  ['internet', '🌐 Internet'], ['telephone', '☎️ Telephone'], ['drainage', '🚿 Drainage'],
  ['clear_deed', '📜 Clear deed'], ['survey_plan', '📐 Survey plan available'], ['near_school', '🏫 Near school'],
  ['near_hospital', '🏥 Near hospital'], ['near_highway', '🚗 Near highway'], ['near_railway', '🚉 Near railway station']];
  const stock = ['/img/land1.jpg', '/img/land2.jpg', '/img/land3.jpg', '/img/land4.jpg', '/img/land5.jpg', '/img/land6.jpg', '/img/land7.jpg', '/img/land8.jpg'];

  host.innerHTML = `
  <div class="wrap"><div class="breadcrumb"><a href="#/">Home</a> › <b>Sell Land</b></div>
  <div class="section-head"><div><span class="eyebrow">For landowners</span><h2>Sell Your Land</h2>
    <p>Complete the details below. Your listing goes live once an administrator approves it.</p></div></div>
  <form id="sellForm" style="display:grid;grid-template-columns:1fr 330px;gap:26px;align-items:start" class="sell-grid">
    <div style="display:flex;flex-direction:column;gap:20px">
      <div class="panel"><div class="panel-title">1️⃣ Basic Information</div>
        <div class="form-grid">
          <div class="field col-2"><label>Property title *</label><input class="ctrl" name="title" required placeholder="e.g. 20 Perch Residential Land for Sale in Piliyandala"></div>
          <div class="field col-2"><label>Description *</label><textarea class="ctrl" name="description" required placeholder="Describe the land, road access, boundaries, soil, surroundings and why it is attractive…"></textarea><span class="hint">Minimum 20 characters</span></div>
          <div class="field"><label>Land type *</label><select class="ctrl" name="land_type" required>${State.meta.land_types.map(x => `<option>${x}</option>`).join('')}</select></div>
          <div class="field"><label>Province *</label><select class="ctrl" name="province" required>${State.meta.provinces.map(p => `<option>${p.name}</option>`).join('')}</select></div>
          <div class="field"><label>District *</label><select class="ctrl" name="district" required></select></div>
          <div class="field"><label>City / Town *</label><select class="ctrl" name="city" required></select></div>
          <div class="field"><label>Area / Village</label><input class="ctrl" name="area" placeholder="e.g. Pamunuwa"></div>
          <div class="field"><label>Address</label><input class="ctrl" name="address" placeholder="Street / lane"></div>
        </div></div>

      <div class="panel"><div class="panel-title">2️⃣ Land Size & Price</div>
        <div class="form-grid">
          <div class="field"><label>Land size *</label><input class="ctrl" name="size_value" type="number" step="0.01" required placeholder="e.g. 20"></div>
          <div class="field"><label>Unit *</label><select class="ctrl" name="unit">
            <option value="perch">Perches</option><option value="rood">Roods</option><option value="acre">Acres</option>
            <option value="sqft">Square Feet</option><option value="sqm">Square Meters</option></select></div>
          <div class="field col-2"><div class="notice" id="convBox">Enter a size to see the conversion in perches, roods, acres and square feet.</div></div>
          <div class="field"><label>Total price (LKR) *</label><input class="ctrl" name="price" type="number" required placeholder="e.g. 9500000"></div>
          <div class="field"><label>Price per perch (auto)</label><input class="ctrl" id="pppOut" readonly placeholder="—" style="background:var(--gray-50)"></div>
          <div class="field col-2"><label class="check"><input type="checkbox" name="negotiable"> 💬 Price is negotiable</label></div>
        </div></div>

      <div class="panel"><div class="panel-title">3️⃣ Facilities & Features</div>
        <div class="checks">${feats.map(([k, l]) => `<label class="check"><input type="checkbox" name="${k}"> ${l}</label>`).join('')}</div>
        <div class="field" style="margin-top:14px"><label>Nearest expressway</label>
          <select class="ctrl" name="nearest_highway"><option value="">None / not applicable</option>
          ${State.meta.expressways.map(h => `<option>${h}</option>`).join('')}</select></div>
        <div class="field" style="margin-top:12px"><label>Nearby places</label>
          <div class="checks">${State.meta.nearby_places.map(n => `<label class="check"><input type="checkbox" name="nearby" value="${n}"> ${n}</label>`).join('')}</div></div>
      </div>

      <div class="panel"><div class="panel-title">4️⃣ Map Location</div>
        <div class="form-grid">
          <div class="field"><label>Latitude</label><input class="ctrl" name="lat" type="number" step="0.000001" placeholder="6.927100"></div>
          <div class="field"><label>Longitude</label><input class="ctrl" name="lng" type="number" step="0.000001" placeholder="79.861200"></div>
          <div class="field col-2"><span class="hint">Leave blank to use the district centre. Tip: open Google Maps, right-click your land and copy the coordinates.</span></div>
        </div>
        <iframe class="map" id="sellMap" style="height:260px;margin-top:12px" src="https://www.google.com/maps?q=7.8731,80.7718&z=7&output=embed" loading="lazy" title="Map"></iframe>
      </div>

      <div class="panel"><div class="panel-title">5️⃣ Property Images</div>
        <p style="color:var(--gray-600);font-size:13.5px;margin:0 0 12px">Select representative photos of your land (demo gallery — in production this would be a file upload).</p>
        <div class="grid-4" id="imgPick">${stock.map(s => `<label style="cursor:pointer;position:relative">
          <input type="checkbox" name="images" value="${s}" hidden>
          <img src="${s}" style="border-radius:12px;aspect-ratio:4/3;object-fit:cover;border:3px solid transparent;transition:.2s">
          </label>`).join('')}</div>
      </div>
    </div>

    <aside class="panel sticky">
      <div class="panel-title">Listing summary</div>
      <div id="sumBox" style="display:flex;flex-direction:column;gap:9px;font-size:13.5px;color:var(--gray-600)">
        <div>Fill the form to see a live preview of your listing.</div>
      </div>
      <button class="btn btn-primary btn-lg btn-block" style="margin-top:16px">📤 Submit listing for review</button>
      <div class="notice" style="margin-top:14px;font-size:12.4px">After submission you can upload your <b>deed, survey plan and land registry extract</b> from the Document Verification page. Listings display the ✓ Verified badge only after an administrator reviews those documents.</div>
    </aside>
  </form><div style="height:60px"></div></div>`;

  if (window.innerWidth < 1024) document.querySelector('.sell-grid').style.gridTemplateColumns = '1fr';

  const form = document.getElementById('sellForm');
  const P = form.querySelector('[name=province]'), D = form.querySelector('[name=district]'), C = form.querySelector('[name=city]');
  const fillD = () => { D.innerHTML = State.meta.districts[P.value].map(d => `<option>${d}</option>`).join(''); fillC(); };
  const fillC = () => { C.innerHTML = (State.meta.cities[D.value] || []).map(c => `<option>${c}</option>`).join(''); };
  P.onchange = fillD; D.onchange = () => { fillC(); updateSummary(); }; fillD();

  form.querySelectorAll('.check input').forEach(i => i.onchange = () => i.closest('.check').classList.toggle('on', i.checked));
  form.querySelectorAll('#imgPick input').forEach(i => i.onchange = () => {
    i.nextElementSibling.style.borderColor = i.checked ? 'var(--emerald)' : 'transparent';
    i.nextElementSibling.style.transform = i.checked ? 'scale(.96)' : 'none';
  });

  const PERCH = { perch: 1, rood: 40, acre: 160, sqft: 1 / 272.25, sqm: 1 / 25.29285264 };
  function updateSummary() {
    const f = Object.fromEntries(new FormData(form).entries());
    const perches = (Number(f.size_value) || 0) * (PERCH[f.unit] || 1);
    const ppp = perches && f.price ? Math.round(Number(f.price) / perches) : 0;
    document.getElementById('pppOut').value = ppp ? fmt.lkr(ppp) : '';
    document.getElementById('convBox').innerHTML = perches
      ? `<b>${fmt.perches(perches)}</b> · ${(perches / 40).toFixed(2)} roods · ${(perches / 160).toFixed(3)} acres · ${Math.round(perches * 272.25).toLocaleString()} sq.ft · ${Math.round(perches * 25.2929).toLocaleString()} sq.m`
      : 'Enter a size to see the conversion in perches, roods, acres and square feet.';
    document.getElementById('sumBox').innerHTML = `
      <div><b style="color:var(--navy)">${esc(f.title || 'Untitled listing')}</b></div>
      <div>📍 ${esc([f.area, f.city, f.district].filter(Boolean).join(', ') || '—')}</div>
      <div>🏷️ ${esc(f.land_type || '—')} Land</div>
      <div>📐 ${perches ? fmt.perches(perches) : '—'}</div>
      <div style="font-size:19px;color:var(--emerald);font-weight:800">${f.price ? fmt.lkr(f.price) : '—'}</div>
      <div>${ppp ? fmt.lkr(ppp) + ' / perch' : ''}</div>`;
    if (f.lat && f.lng) document.getElementById('sellMap').src = `https://www.google.com/maps?q=${f.lat},${f.lng}&z=15&output=embed`;
  }
  form.oninput = updateSummary;

  form.onsubmit = async e => {
    e.preventDefault();
    const btn = form.querySelector('button[class*=primary]');
    const fd = new FormData(form);
    const body = {};
    fd.forEach((v, k) => { if (k === 'images' || k === 'nearby') { (body[k] = body[k] || []).push(v); } else body[k] = v === 'on' ? true : v; });
    body.images = body.images || []; body.nearby = body.nearby || [];
    btn.disabled = true; btn.textContent = 'Submitting…';
    try {
      const land = await API.post('/api/lands', body);
      UI.toast('Listing submitted ✓', 'An administrator will review it shortly.');
      Router.go('/seller');
    } catch (err) { UI.err(err); btn.disabled = false; btn.textContent = '📤 Submit listing for review'; }
  };
};

/* =================== COMPARE =================== */
Pages.compare = async function (host) {
  if (!State.compare.length) {
    host.innerHTML = `<div class="wrap"><section>${UI.empty('⇄', 'Nothing to compare yet',
      'Click "Compare" on any property card to add up to four properties here.',
      '<a class="btn btn-primary" href="#/buy">Browse land</a>')}</section></div>`;
    return;
  }
  host.innerHTML = `<div class="wrap"><div class="breadcrumb"><a href="#/">Home</a> › <b>Compare</b></div>
    <div class="section-head"><div><span class="eyebrow">Side by side</span><h2>Compare Properties</h2>
    <p>Comparing ${State.compare.length} properties.</p></div>
    <button class="btn btn-ghost" id="clearCmp">Clear all</button></div>
    <div id="cmpBox">${UI.skeletonCards(2)}</div><div style="height:60px"></div></div>`;
  document.getElementById('clearCmp').onclick = () => { State.compare = []; State.saveCompare(); Chrome.renderNav(); Router.render(); };

  const items = [];
  for (const id of State.compare) { try { items.push(await API.get('/api/lands/' + id)); } catch (_) { } }
  const rows = [
    ['Photo', l => `<img src="${esc(l.cover || l.images[0] || '/img/land1.jpg')}" style="width:100%;max-width:200px;border-radius:10px;aspect-ratio:4/3;object-fit:cover">`],
    ['Title', l => `<a href="#/land/${l.id}" style="color:var(--emerald);font-weight:700">${esc(l.title)}</a>`],
    ['Location', l => esc(l.city + ', ' + l.district)],
    ['Province', l => esc(l.province)],
    ['Land Size', l => `<b>${esc(l.size.display)}</b>`],
    ['Price', l => `<b style="color:var(--emerald);font-size:15px">${esc(l.price_display)}</b>`],
    ['Price / Perch', l => esc(fmt.lkr(l.price_per_perch))],
    ['Land Type', l => esc(l.land_type)],
    ['Negotiable', l => l.negotiable ? '✅ Yes' : '❌ No'],
    ['Road Access', l => l.main_road ? '✅ Yes' : '❌ No'],
    ['Electricity', l => l.electricity ? '✅ Yes' : '❌ No'],
    ['Water', l => l.water ? '✅ Yes' : '❌ No'],
    ['Clear Deed', l => l.clear_deed ? '✅ Yes' : '❌ No'],
    ['Survey Plan', l => l.survey_plan ? '✅ Yes' : '❌ No'],
    ['Near Highway', l => l.near_highway ? '✅ ' + esc(l.nearest_highway || 'Yes') : '❌ No'],
    ['Near School', l => l.near_school ? '✅ Yes' : '❌ No'],
    ['Near Hospital', l => l.near_hospital ? '✅ Yes' : '❌ No'],
    ['Verification', l => UI.pill(l.verification)],
    ['Seller', l => esc(l.seller_name) + ' <span class="stars">' + UI.stars(l.seller_rating) + '</span>'],
    ['', l => `<a class="btn btn-primary btn-sm" href="#/land/${l.id}">View</a> <button class="btn btn-ghost btn-sm" data-rm="${l.id}">Remove</button>`]
  ];
  document.getElementById('cmpBox').innerHTML = `<div class="table-wrap"><table><thead><tr><th>Feature</th>
    ${items.map((l, i) => `<th>Land ${String.fromCharCode(65 + i)}</th>`).join('')}</tr></thead><tbody>
    ${rows.map(([label, fn]) => `<tr><td><b>${label}</b></td>${items.map(l => `<td>${fn(l)}</td>`).join('')}</tr>`).join('')}
    </tbody></table></div>`;
  document.querySelectorAll('[data-rm]').forEach(b => b.onclick = () => {
    State.compare = State.compare.filter(x => x !== Number(b.dataset.rm)); State.saveCompare(); Chrome.renderNav(); Router.render();
  });
};

/* =================== WISHLIST =================== */
Pages.wishlist = async function (host) {
  if (!Auth.require()) return;
  host.innerHTML = `<div class="wrap"><div class="breadcrumb"><a href="#/">Home</a> › <b>Wishlist</b></div>
    <div class="section-head"><div><span class="eyebrow">Saved</span><h2>My Wishlist</h2></div></div>
    <div id="wl">${UI.skeletonCards(3)}</div><div style="height:60px"></div></div>`;
  try {
    const r = await API.get('/api/wishlist');
    document.getElementById('wl').innerHTML = r.items.length
      ? `<div class="cards">${r.items.map(l => LandCard(l)).join('')}</div>`
      : UI.empty('♡', 'Your wishlist is empty', 'Tap the heart on any listing to save it here.', '<a class="btn btn-primary" href="#/buy">Browse land</a>');
  } catch (e) { UI.err(e); }
};

/* =================== NOTIFICATIONS =================== */
Pages.notifications = async function (host) {
  if (!Auth.require()) return;
  host.innerHTML = `<div class="wrap"><div class="breadcrumb"><a href="#/">Home</a> › <b>Notifications</b></div>
    <div class="section-head"><div><span class="eyebrow">Activity</span><h2>Notifications</h2></div>
    <button class="btn btn-ghost" id="allRead">Mark all as read</button></div>
    <div id="nl" class="panel"></div><div style="height:60px"></div></div>`;
  const load = async () => {
    const r = await API.get('/api/notifications');
    State.notif = r.unread; Chrome.renderNav();
    document.getElementById('nl').innerHTML = r.items.length ? r.items.map(n => `
      <div style="display:flex;gap:13px;padding:14px 0;border-bottom:1px solid var(--gray-100);${n.is_read ? '' : 'background:var(--emerald-soft);margin:0 -22px;padding-left:22px;padding-right:22px'}">
        <div class="avatar" style="background:${n.is_read ? 'var(--gray-200)' : 'linear-gradient(135deg,var(--emerald),var(--navy))'};font-size:16px">🔔</div>
        <div style="flex:1;min-width:0"><b>${esc(n.title)}</b>
          <div style="color:var(--gray-600);font-size:13.5px">${esc(n.body || '')}</div>
          <div style="font-size:11.5px;color:var(--gray-400);margin-top:3px">${fmt.dateTime(n.created_at)} · ${esc(n.type.replace(/_/g, ' '))}</div></div>
        ${n.link ? `<a class="btn btn-ghost btn-sm" href="#${n.link}">Open</a>` : ''}
        <button class="btn btn-ghost btn-sm" data-del="${n.id}">✕</button>
      </div>`).join('') : UI.empty('🔔', 'No notifications yet', 'Activity on your listings and reservations will appear here.');
    document.querySelectorAll('[data-del]').forEach(b => b.onclick = async () => { await API.del('/api/notifications/' + b.dataset.del); load(); });
  };
  document.getElementById('allRead').onclick = async () => { await API.put('/api/notifications/read-all'); UI.toast('All marked as read'); load(); };
  load().catch(e => UI.err(e));
};
