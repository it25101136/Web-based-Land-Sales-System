/* Public pages: Home, Buy Land, Land Details, Locations, About, Contact, Help */
'use strict';

const Pages = {};

/* ---------- Shared: location selects ---------- */
function provinceOptions(sel) {
  return `<option value="">${t('all_provinces')}</option>` +
    State.meta.provinces.map(p => `<option ${sel === p.name ? 'selected' : ''}>${p.name}</option>`).join('');
}
function districtOptions(province, sel) {
  const list = province ? (State.meta.districts[province] || []) : Object.values(State.meta.districts).flat();
  return `<option value="">${t('all_districts')}</option>` + list.map(d => `<option ${sel === d ? 'selected' : ''}>${d}</option>`).join('');
}
function cityOptions(district, sel) {
  const list = district ? (State.meta.cities[district] || []) : [];
  return `<option value="">${t('all_cities')}</option>` + list.map(c => `<option ${sel === c ? 'selected' : ''}>${c}</option>`).join('');
}
function typeOptions(sel) {
  return `<option value="">${t('any')} ${t('type')}</option>` +
    State.meta.land_types.map(x => `<option value="${x}" ${sel === x ? 'selected' : ''}>${x} Land</option>`).join('');
}
function bindCascade(root) {
  const p = root.querySelector('[name=province]'), d = root.querySelector('[name=district]'), c = root.querySelector('[name=city]');
  if (p && d) p.onchange = () => { d.innerHTML = districtOptions(p.value); if (c) c.innerHTML = cityOptions(''); };
  if (d && c) d.onchange = () => { c.innerHTML = cityOptions(d.value); };
}

/* =================== HOME =================== */
Pages.home = async function (host) {
  host.innerHTML = `
  <div class="hero">
    <div class="hero-bg"></div>
    <div class="hero-inner">
      <span class="hero-badge">🇱🇰 Trusted across all 25 districts of Sri Lanka</span>
      <h1>${t('hero_title')}</h1>
      <p class="sub">${t('hero_sub')}</p>
      <div class="hero-stats">
        <div><b id="stLands">—</b><span>Active Listings</span></div>
        <div><b>25</b><span>Districts Covered</span></div>
        <div><b>9</b><span>Provinces</span></div>
        <div><b id="stVer">—</b><span>Verified Properties</span></div>
      </div>
      <div class="searchbox">
        <h3>🔍 ${t('where')}</h3>
        <form class="search-grid" id="heroSearch">
          <div class="field"><label>${t('province')}</label><select class="ctrl" name="province">${provinceOptions()}</select></div>
          <div class="field"><label>${t('district')}</label><select class="ctrl" name="district">${districtOptions()}</select></div>
          <div class="field"><label>${t('city')}</label><select class="ctrl" name="city">${cityOptions()}</select></div>
          <div class="field"><label>${t('price')} (Max)</label>
            <select class="ctrl" name="max_price">
              <option value="">${t('any')}</option><option value="2500000">Rs. 2.5M</option><option value="5000000">Rs. 5M</option>
              <option value="10000000">Rs. 10M</option><option value="20000000">Rs. 20M</option><option value="50000000">Rs. 50M</option>
            </select></div>
          <div class="field"><label>${t('size')} (Perches)</label>
            <select class="ctrl" name="min_perches">
              <option value="">${t('any')}</option><option value="10">10+ Perches</option><option value="15">15+ Perches</option>
              <option value="20">20+ Perches</option><option value="40">40+ Perches</option><option value="160">1+ Acre</option>
            </select></div>
          <div class="field"><label>${t('type')}</label><select class="ctrl" name="land_type">${typeOptions()}</select></div>
          <div class="field" style="grid-column:1/-1"><button class="btn btn-gold btn-lg btn-block">🔎 ${t('search')}</button></div>
        </form>
      </div>
    </div>
  </div>

  <section>
    <div class="wrap">
      <div class="section-head">
        <div><span class="eyebrow">Handpicked</span><h2>${t('featured')}</h2>
          <p>Verified land across Sri Lanka with clear deeds, survey plans and transparent per-perch pricing.</p></div>
        <a class="btn btn-ghost" href="#/buy">View all listings →</a>
      </div>
      <div id="featured">${UI.skeletonCards(6)}</div>
    </div>
  </section>

  <section class="bg-soft">
    <div class="wrap">
      <div class="section-head"><div><span class="eyebrow">Browse by location</span><h2>Popular Sri Lankan Districts</h2>
        <p>From Colombo's suburbs to the tea hills of Nuwara Eliya and the beaches of the south.</p></div>
        <a class="btn btn-ghost" href="#/locations">${t('explore')} →</a></div>
      <div class="grid-4" id="districts"></div>
    </div>
  </section>

  <section>
    <div class="wrap">
      <div class="section-head" style="justify-content:center;text-align:center;flex-direction:column;align-items:center">
        <div><span class="eyebrow">Why LandHub</span><h2>Built for the Sri Lankan land market</h2>
        <p style="margin:9px auto 0">Everything you need to buy or sell land with confidence — in Sinhala, Tamil or English.</p></div>
      </div>
      <div class="grid-3">
        ${[
      ['🛡️', 'Document Verification', 'Sellers upload the deed, survey plan and land registry extract. Our administrators review them before a listing earns the ✓ Verified badge.'],
      ['📐', 'Perches, Roods & Acres', 'Enter land size in any Sri Lankan unit. We convert and display everything in perches with a built-in converter.'],
      ['💰', 'Transparent LKR Pricing', 'Every listing shows total price and price per perch, so you can compare Kadawatha against Kandy fairly.'],
      ['🗺️', 'Maps & Nearby Places', 'See each property on the map with nearby schools, hospitals, banks, railway stations and expressway interchanges.'],
      ['🤝', 'Reserve & Pay Safely', 'Request a reservation, agree with the seller and settle through the sandbox payment module with a PDF invoice.'],
      ['🌐', 'Trilingual Platform', 'Use LandHub in English, සිංහල or தமிழ் — switch languages anytime from the navigation bar.']
    ].map(([i, h, p]) => `<div class="feature"><div class="ico">${i}</div><h3>${h}</h3><p>${p}</p></div>`).join('')}
      </div>
      <div class="notice" style="margin-top:26px">
        <b>Please note:</b> LandHub's verification is an administrative platform check of the documents a seller submits. It is not legal certification of title.
        Always engage a qualified lawyer for a title search and obtain independent legal advice before purchasing land.
      </div>
    </div>
  </section>

  <section class="bg-navy">
    <div class="wrap grid-2" style="align-items:center">
      <div>
        <span class="eyebrow" style="color:var(--gold-2)">Landowners</span>
        <h2 style="font-size:clamp(24px,3vw,34px)">Sell your land to thousands of Sri Lankan buyers</h2>
        <p style="color:rgba(255,255,255,.78);margin:14px 0 22px">List in minutes, upload your deed and survey plan for verification, and manage inquiries, reservations and payments from one dashboard.</p>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <a class="btn btn-gold btn-lg" href="#/sell">＋ ${t('post')}</a>
          <a class="btn btn-ghost btn-lg" href="#/register">Create seller account</a>
        </div>
      </div>
      <div class="grid-2" style="gap:14px">
        ${[['📸', 'Multiple photos', 'Up to 10 images per listing'], ['📄', 'Upload documents', 'Deed, survey plan, registry'],
      ['📊', 'Track performance', 'Views, inquiries, reservations'], ['⭐', 'Build reputation', 'Verified buyer reviews']]
      .map(([i, h, p]) => `<div class="glass" style="padding:18px"><div style="font-size:24px;margin-bottom:8px">${i}</div>
        <b style="color:#fff;display:block;font-size:14.5px">${h}</b><span style="font-size:12.8px;color:rgba(255,255,255,.68)">${p}</span></div>`).join('')}
      </div>
    </div>
  </section>`;

  bindCascade(host);
  document.getElementById('heroSearch').onsubmit = e => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target).entries());
    Router.go('/buy' + API.qs(f));
  };

  API.get('/api/lands/featured').then(r => {
    document.getElementById('featured').innerHTML = r.items.length
      ? `<div class="cards">${r.items.map(l => LandCard(l)).join('')}</div>`
      : UI.empty('🏝️', 'No listings yet', 'Be the first to post land.');
  }).catch(() => { });

  API.get('/api/locations/summary').then(r => {
    const all = r.provinces.flatMap(p => p.districts).sort((a, b) => b.count - a.count).slice(0, 8);
    document.getElementById('stLands').textContent = r.total;
    document.getElementById('districts').innerHTML = all.map((d, i) => `
      <a class="feature" href="#/buy?district=${encodeURIComponent(d.name)}" style="padding:20px">
        <div style="display:flex;justify-content:space-between;align-items:start">
          <div><b style="font-size:16.5px;color:var(--navy);display:block">${esc(d.name)}</b>
          <span class="si-text" style="font-size:12.5px;color:var(--gray-600)">${esc(d.name_si)}</span></div>
          <span class="pill p-green">${d.count}</span>
        </div>
        <div style="margin-top:12px;font-size:12.5px;color:var(--gray-600)">
          ${d.avg_price_per_perch ? 'Avg ' + fmt.short(d.avg_price_per_perch) + ' / perch' : 'No listings yet'}
        </div>
      </a>`).join('');
  }).catch(() => { });

  API.get('/api/lands?verified=true&limit=1').then(r => { document.getElementById('stVer').textContent = r.total; }).catch(() => { });
};

/* =================== BUY LAND =================== */
Pages.buy = async function (host, params) {
  const f = Object.fromEntries(new URLSearchParams(params).entries());
  host.innerHTML = `
  <div class="wrap">
    <div class="breadcrumb"><a href="#/">Home</a> › <b>Buy Land</b></div>
    <div class="section-head" style="margin-bottom:20px">
      <div><span class="eyebrow">Search</span><h2>Land for Sale in Sri Lanka</h2>
      <p id="resultCount">Searching…</p></div>
      <select class="ctrl" id="sortSel" style="max-width:230px">
        <option value="newest">Newest first</option><option value="price_asc">Price: low to high</option>
        <option value="price_desc">Price: high to low</option><option value="perch_asc">Cheapest per perch</option>
        <option value="size_desc">Largest first</option><option value="popular">Most viewed</option>
      </select>
    </div>
    <div style="display:grid;grid-template-columns:300px 1fr;gap:26px;align-items:start" id="buyGrid">
      <aside class="panel sticky" id="filters"></aside>
      <div id="results">${UI.skeletonCards(6)}</div>
    </div>
  </div>
  <div style="height:60px"></div>`;

  if (window.innerWidth < 1024) document.getElementById('buyGrid').style.gridTemplateColumns = '1fr';

  const feats = [['main_road', '🛣️ Main road access'], ['electricity', '⚡ Electricity available'], ['water', '💧 Water available'],
  ['clear_deed', '📜 Clear deed'], ['survey_plan', '📐 Survey plan available'], ['near_school', '🏫 Near school'],
  ['near_hospital', '🏥 Near hospital'], ['near_highway', '🚗 Near highway'], ['near_railway', '🚉 Near railway station']];

  document.getElementById('filters').innerHTML = `
    <div class="panel-title">Filters <button class="btn btn-ghost btn-sm" id="clearF">Clear</button></div>
    <form id="filterForm" style="display:flex;flex-direction:column;gap:13px">
      <div class="field"><label>Keyword</label><input class="ctrl" name="q" placeholder="e.g. Piliyandala, beach" value="${esc(f.q || '')}"></div>
      <div class="field"><label>${t('province')}</label><select class="ctrl" name="province">${provinceOptions(f.province)}</select></div>
      <div class="field"><label>${t('district')}</label><select class="ctrl" name="district">${districtOptions(f.province, f.district)}</select></div>
      <div class="field"><label>${t('city')} / Town</label><select class="ctrl" name="city">${cityOptions(f.district, f.city)}</select></div>
      <div class="field"><label>Area</label><input class="ctrl" name="area" placeholder="e.g. Pamunuwa" value="${esc(f.area || '')}"></div>
      <div class="field"><label>${t('type')}</label><select class="ctrl" name="land_type">${typeOptions(f.land_type)}</select></div>
      <div class="field"><label>Price range (LKR)</label>
        <div style="display:flex;gap:7px"><input class="ctrl" name="min_price" type="number" placeholder="Min" value="${esc(f.min_price || '')}">
        <input class="ctrl" name="max_price" type="number" placeholder="Max" value="${esc(f.max_price || '')}"></div></div>
      <div class="field"><label>Max price per perch</label><input class="ctrl" name="max_ppp" type="number" placeholder="e.g. 500000" value="${esc(f.max_ppp || '')}"></div>
      <div class="field"><label>Land size (perches)</label>
        <div style="display:flex;gap:7px"><input class="ctrl" name="min_perches" type="number" placeholder="Min" value="${esc(f.min_perches || '')}">
        <input class="ctrl" name="max_perches" type="number" placeholder="Max" value="${esc(f.max_perches || '')}"></div>
        <span class="hint">1 Acre = 160 perches · 1 Rood = 40 perches</span></div>
      <div class="field"><label>Near expressway</label>
        <select class="ctrl" name="highway"><option value="">Any</option>
        ${State.meta.expressways.map(h => `<option ${f.highway === h ? 'selected' : ''}>${h}</option>`).join('')}</select></div>
      <div class="field"><label>Features</label>
        <div style="display:flex;flex-direction:column;gap:7px">
          ${feats.map(([k, l]) => `<label class="check ${f[k] ? 'on' : ''}"><input type="checkbox" name="${k}" ${f[k] ? 'checked' : ''}> ${l}</label>`).join('')}
          <label class="check ${f.verified ? 'on' : ''}"><input type="checkbox" name="verified" ${f.verified ? 'checked' : ''}> ✓ Verified properties only</label>
          <label class="check ${f.negotiable ? 'on' : ''}"><input type="checkbox" name="negotiable" ${f.negotiable ? 'checked' : ''}> 💬 Negotiable price</label>
        </div></div>
      <button class="btn btn-primary btn-block">Apply filters</button>
    </form>`;

  bindCascade(document.getElementById('filters'));
  document.getElementById('sortSel').value = f.sort || 'newest';
  document.querySelectorAll('#filters .check input').forEach(i => i.onchange = () => i.closest('.check').classList.toggle('on', i.checked));

  const run = async (extra) => {
    const form = document.getElementById('filterForm');
    const data = {};
    new FormData(form).forEach((v, k) => { if (v === 'on') data[k] = true; else if (v) data[k] = v; });
    Object.assign(data, extra || {});
    data.sort = document.getElementById('sortSel').value;
    data.limit = 9;
    history.replaceState(null, '', '#/buy' + API.qs(data));
    document.getElementById('results').innerHTML = UI.skeletonCards(6);
    try {
      const r = await API.get('/api/lands' + API.qs(data));
      document.getElementById('resultCount').innerHTML = r.total
        ? `<b>${r.total}</b> ${r.total === 1 ? 'property' : 'properties'} found${data.district ? ' in ' + esc(data.district) + ' District' : ''}`
        : 'No properties matched your filters';
      document.getElementById('results').innerHTML = r.total
        ? `<div class="cards">${r.items.map(l => LandCard(l)).join('')}</div>` + pager(r)
        : UI.empty('🔍', 'No matching land found', 'Try widening your price range or choosing a neighbouring district.',
          `<button class="btn btn-primary" onclick="document.getElementById('clearF').click()">Reset filters</button>`);
      document.querySelectorAll('[data-page]').forEach(b => b.onclick = () => { run({ page: b.dataset.page }); window.scrollTo({ top: 200, behavior: 'smooth' }); });
    } catch (e) { UI.err(e); }
  };
  const pager = r => r.pages <= 1 ? '' : `<div class="pager">
    <button data-page="${Math.max(1, r.page - 1)}" ${r.page === 1 ? 'disabled' : ''}>‹</button>
    ${Array.from({ length: r.pages }).map((_, i) => `<button data-page="${i + 1}" class="${r.page === i + 1 ? 'active' : ''}">${i + 1}</button>`).join('')}
    <button data-page="${Math.min(r.pages, r.page + 1)}" ${r.page === r.pages ? 'disabled' : ''}>›</button></div>`;

  document.getElementById('filterForm').onsubmit = e => { e.preventDefault(); run({ page: 1 }); };
  document.getElementById('sortSel').onchange = () => run({ page: 1 });
  document.getElementById('clearF').onclick = () => { Router.go('/buy'); };
  run(f.page ? { page: f.page } : {});
};

/* =================== LAND DETAILS =================== */
Pages.land = async function (host, params, id) {
  host.innerHTML = `<div class="wrap" style="padding:40px 24px">${UI.skeletonCards(1)}</div>`;
  let l;
  try { l = await API.get('/api/lands/' + id); }
  catch (e) { host.innerHTML = `<div class="wrap">${UI.empty('🚫', 'Listing not found', 'It may have been removed or sold.', '<a class="btn btn-primary" href="#/buy">Browse land</a>')}</div>`; return; }

  const imgs = (Array.isArray(l.images) && l.images.length) ? l.images : ['/img/land1.jpg'];
  const docs = Array.isArray(l.documents) ? l.documents : [];
  const reviews = Array.isArray(l.reviews) ? l.reviews : [];
  const nearby = Array.isArray(l.nearby) ? l.nearby : [];
  const similar = Array.isArray(l.similar) ? l.similar : [];
  const size = l.size || { display: (l.perches || 0) + ' perches', perches: l.perches || 0, roods: 0, acres: 0, sqft: 0, sqm: 0 };

  const facil = [['main_road', '🛣️', 'Main Road Access'], ['electricity', '⚡', 'Electricity'], ['water', '💧', 'Water Supply'],
  ['internet', '🌐', 'Internet'], ['telephone', '☎️', 'Telephone Line'], ['drainage', '🚿', 'Drainage'],
  ['clear_deed', '📜', 'Clear Deed'], ['survey_plan', '📐', 'Survey Plan'], ['near_school', '🏫', 'Near School'],
  ['near_hospital', '🏥', 'Near Hospital'], ['near_highway', '🚗', 'Near Highway'], ['near_railway', '🚉', 'Near Railway']];
  const fav = State.wishlist.has(l.id);
  const lat = l.lat || 7.8731;
  const lng = l.lng || 80.7718;
  const mapSrc = `https://www.google.com/maps?q=${lat},${lng}&hl=en&z=14&output=embed`;

  host.innerHTML = `
  <div class="wrap">
    <div class="breadcrumb"><a href="#/">Home</a> › <a href="#/buy">Buy Land</a> ›
      <a href="#/buy?district=${encodeURIComponent(l.district || '')}">${esc(l.district || '')}</a> › <b>${esc(l.city || '')}</b></div>

    <div class="gallery">
      <div class="g-main"><img src="${esc(imgs[0])}" alt="${esc(l.title)}" id="gMain"></div>
      <div class="g-side">
        <img src="${esc(imgs[1] || imgs[0])}" data-img="${esc(imgs[1] || imgs[0])}" alt="">
        <div style="position:relative;overflow:hidden;border-radius:0">
          <img src="${esc(imgs[2] || imgs[0])}" data-img="${esc(imgs[2] || imgs[0])}" alt="">
          ${imgs.length > 3 ? `<div style="position:absolute;inset:0;background:rgba(11,37,69,.62);display:grid;place-items:center;color:#fff;font-weight:800;font-size:19px">+${imgs.length - 3} photos</div>` : ''}
        </div>
      </div>
    </div>

    <div class="detail-grid" style="margin-top:30px">
      <div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">
          ${l.is_verified ? '<span class="badge badge-verified" style="font-size:12px">✓ Verified Property</span>' : '<span class="badge badge-gold" style="font-size:12px">⏳ Verification Pending</span>'}
          <span class="badge badge-type" style="border:1px solid var(--gray-200);font-size:12px">${esc(l.land_type || 'Land')} Land</span>
          ${l.negotiable ? '<span class="badge badge-neg" style="font-size:12px">💬 Negotiable</span>' : ''}
          <span class="badge" style="background:var(--gray-100);color:var(--gray-600);font-size:12px">👁️ ${l.views || 0} views</span>
        </div>
        <h1 style="font-size:clamp(22px,3vw,31px)">${esc(l.title || 'Land Details')}</h1>
        <p style="color:var(--gray-600);margin:9px 0 0;font-size:15px">📍 ${esc(l.address || l.location_display || '')} · ${esc(l.province || '')}</p>

        <div class="spec" style="margin:24px 0">
          <div class="item"><span>Total Price</span><b style="color:var(--emerald)">${esc(l.price_display || '—')}</b></div>
          <div class="item"><span>Price Per Perch</span><b>${esc(l.ppp_display || '—')}</b></div>
          <div class="item"><span>Land Size</span><b>${esc(size.display || '—')}</b></div>
          <div class="item"><span>District</span><b>${esc(l.district || '—')}</b></div>
          <div class="item"><span>Land Type</span><b>${esc(l.land_type || '—')}</b></div>
          <div class="item"><span>Listed</span><b>${fmt.date(l.created_at)}</b></div>
        </div>

        <div class="panel" style="margin-bottom:20px">
          <div class="panel-title">📏 Size in other Sri Lankan units</div>
          <div class="spec">
            <div class="item"><span>Perches</span><b>${size.perches ?? '—'}</b></div>
            <div class="item"><span>Roods</span><b>${size.roods ?? '—'}</b></div>
            <div class="item"><span>Acres</span><b>${size.acres ?? '—'}</b></div>
            <div class="item"><span>Square Feet</span><b>${(size.sqft || 0).toLocaleString()}</b></div>
            <div class="item"><span>Square Meters</span><b>${(size.sqm || 0).toLocaleString()}</b></div>
          </div>
        </div>

        <div class="panel" style="margin-bottom:20px">
          <div class="panel-title">📝 Description</div>
          <p style="color:var(--gray-600);white-space:pre-line;margin:0">${esc(l.description || 'No description provided.')}</p>
        </div>

        <div class="panel" style="margin-bottom:20px">
          <div class="panel-title">✅ Facilities & Features</div>
          <div class="checks">
            ${facil.map(([k, i, lab]) => `<div class="check ${l[k] ? 'on' : ''}" style="cursor:default">
              <span>${l[k] ? '✓' : '✕'}</span> ${i} ${lab}</div>`).join('')}
          </div>
          ${l.nearest_highway ? `<p style="margin:14px 0 0;font-size:13.5px;color:var(--gray-600)">🚗 Nearest expressway: <b style="color:var(--navy)">${esc(l.nearest_highway)}</b></p>` : ''}
          ${nearby.length ? `<div style="margin-top:12px;display:flex;gap:7px;flex-wrap:wrap">
            ${nearby.map(n => `<span class="chip">📍 ${esc(n)}</span>`).join('')}</div>` : ''}
        </div>

        <div class="panel" style="margin-bottom:20px">
          <div class="panel-title">🗺️ Location & Nearby Places
            <a class="btn btn-ghost btn-sm" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${lat},${lng}">Open in Google Maps ↗</a></div>
          <iframe class="map" src="${mapSrc}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="Map"></iframe>
          <p style="font-size:12.5px;color:var(--gray-400);margin:10px 0 0">GPS coordinates: ${lat}, ${lng} — approximate location shown for privacy.</p>
        </div>

        <div class="panel" style="margin-bottom:20px">
          <div class="panel-title">🛡️ Document Verification</div>
          ${docs.length ? `<div class="table-wrap"><table><thead><tr><th>Document</th><th>Status</th><th>Submitted</th></tr></thead><tbody>
            ${docs.map(d => `<tr><td><b>${esc((d.doc_type || '').replace(/_/g, ' '))}</b></td><td>${UI.pill(d.status)}</td><td>${fmt.date(d.created_at)}</td></tr>`).join('')}
          </tbody></table></div>` : '<p style="color:var(--gray-600)">No documents have been submitted for this listing yet.</p>'}
          <div class="notice" style="margin-top:14px">Verification on LandHub is an <b>administrative platform check</b> of the documents submitted by the seller — it is not legal certification of ownership. Please obtain independent legal advice and a lawyer's title search before purchasing.</div>
        </div>

        ${reviews.length ? `<div class="panel" style="margin-bottom:20px">
          <div class="panel-title">⭐ Seller Reviews</div>
          ${reviews.map(r => `<div style="padding:12px 0;border-bottom:1px solid var(--gray-100)">
            <div style="display:flex;gap:10px;align-items:center"><div class="avatar">${fmt.initials(r.buyer_name || 'B')}</div>
            <div><b>${esc(r.buyer_name || 'Buyer')}</b><br><span class="stars">${UI.stars(r.rating || 5)}</span>
            <span style="font-size:12px;color:var(--gray-400)"> · ${fmt.date(r.created_at)}</span></div></div>
            <p style="margin:9px 0 0;color:var(--gray-600);font-size:14px">${esc(r.comment || '')}</p></div>`).join('')}
        </div>` : ''}
      </div>

      <aside>
        <div class="panel sticky">
          <div style="text-align:center;padding-bottom:16px;border-bottom:1px solid var(--gray-200)">
            <div style="font-size:29px;font-family:'Plus Jakarta Sans';font-weight:800;color:var(--emerald)">${esc(l.price_display || '—')}</div>
            <div style="color:var(--gray-600);font-size:13.5px">${esc(l.ppp_display || '—')} · ${esc(size.display || '—')}</div>
            ${l.negotiable ? '<div style="margin-top:6px" class="pill p-gold">Price negotiable</div>' : ''}
          </div>
          <div style="display:flex;gap:11px;align-items:center;padding:16px 0;border-bottom:1px solid var(--gray-200)">
            <div class="avatar" style="width:46px;height:46px">${fmt.initials(l.seller_name || 'S')}</div>
            <div style="min-width:0">
              <b style="display:block">${esc(l.seller_name || 'Seller')}</b>
              <span style="font-size:12.5px;color:var(--gray-600)">${esc(l.seller_company || 'Private Seller')}</span><br>
              <span class="stars">${UI.stars(l.seller_rating || 0)}</span>
              <span style="font-size:12px;color:var(--gray-400)">${l.seller_rating || 0} (${l.seller_reviews || 0} reviews)</span>
            </div>
          </div>
          <div style="display:flex;flex-direction:column;gap:9px;padding-top:16px">
            <button class="btn btn-primary btn-block" id="btnContact">💬 ${t('contact_seller')}</button>
            <button class="btn btn-gold btn-block" id="btnReserve">🔑 ${t('reserve')}</button>
            <div style="display:flex;gap:9px">
              <button class="btn btn-ghost" style="flex:1" data-fav="${l.id}">${fav ? '♥ Saved' : '♡ Wishlist'}</button>
              <button class="btn btn-ghost" style="flex:1" data-cmp="${l.id}">⇄ ${t('compare')}</button>
            </div>
            <button class="btn btn-ghost btn-block" id="btnShare">🔗 Share this property</button>
          </div>
          <p style="font-size:11.8px;color:var(--gray-400);margin:14px 0 0;text-align:center">Seller contact details are shared through secure in-platform messaging only.</p>
        </div>
      </aside>
    </div>

    ${similar.length ? `<section style="padding:50px 0 0">
      <div class="section-head"><div><span class="eyebrow">You may also like</span><h2>Similar land nearby</h2></div></div>
      <div class="cards">${similar.map(s => LandCard(s)).join('')}</div>
    </section>` : ''}
  </div>
  <div style="height:60px"></div>`;

  host.querySelectorAll('[data-img]').forEach(im => im.onclick = () => {
    const main = document.getElementById('gMain'); const tmp = main.src;
    main.src = im.dataset.img; im.src = tmp;
  });
  document.getElementById('btnShare').onclick = async () => {
    const url = location.origin + '/#/land/' + l.id;
    try { await navigator.clipboard.writeText(url); UI.toast('Link copied', url); }
    catch (_) { UI.modal('Share this property', `<input class="ctrl" value="${esc(url)}" onclick="this.select()">`); }
  };
  document.getElementById('btnContact').onclick = () => Forms.contactSeller(l);
  document.getElementById('btnReserve').onclick = () => Forms.reserve(l);
};

/* =================== LOCATIONS =================== */
Pages.locations = async function (host) {
  host.innerHTML = `<div class="wrap"><div class="breadcrumb"><a href="#/">Home</a> › <b>Locations</b></div>
    <div class="section-head"><div><span class="eyebrow">${t('explore')}</span><h2>Land across all 9 provinces & 25 districts</h2>
    <p>Click any district to see the land currently available there.</p></div></div>
    <div id="locGrid" class="grid-3">${UI.skeletonCards(3)}</div><div style="height:60px"></div></div>`;
  try {
    const r = await API.get('/api/locations/summary');
    document.getElementById('locGrid').innerHTML = r.provinces.map(p => `
      <div class="prov-card">
        <div class="prov-head">
          <div><b>${esc(p.name)}</b><br><span class="si-text" style="font-size:11.5px;opacity:.75;background:none;padding:0;color:rgba(255,255,255,.7)">${esc(p.si)}</span></div>
          <span>${p.count} lands</span>
        </div>
        <div class="dist-list">
          ${p.districts.map(d => `<a class="dist" href="#/buy?district=${encodeURIComponent(d.name)}">
            <span class="n">${esc(d.name)} <span class="ta-text" style="color:var(--gray-400);font-size:12px">${esc(d.name_ta)}</span></span>
            <span class="c">${d.count ? d.count + ' listings' : '—'}</span></a>`).join('')}
        </div>
      </div>`).join('');
  } catch (e) { UI.err(e); }
};

/* =================== ABOUT =================== */
Pages.about = function (host) {
  host.innerHTML = `
  <div class="hero" style="min-height:340px">
    <div class="hero-bg" style="background-image:url('/img/land7.jpg')"></div>
    <div class="hero-inner"><span class="hero-badge">About LandHub</span>
      <h1 style="font-size:clamp(28px,4vw,44px)">Making land in Sri Lanka easier to find, list and trust</h1></div>
  </div>
  <section><div class="wrap">
    <div class="grid-2">
      <div class="panel"><div class="ico" style="font-size:30px">🎯</div><h2 style="font-size:23px;margin:10px 0">Our Mission</h2>
        <p style="color:var(--gray-600)">To give every Sri Lankan — from Jaffna to Matara — a transparent, trustworthy place to advertise and discover land. We standardise pricing in rupees per perch, present accurate district and city information, and require sellers to submit ownership documents for administrative review before a listing is marked verified.</p></div>
      <div class="panel"><div class="ico" style="font-size:30px">🔭</div><h2 style="font-size:23px;margin:10px 0">Our Vision</h2>
        <p style="color:var(--gray-600)">To become the most trusted digital land marketplace in Sri Lanka, where a buyer in Colombo can confidently evaluate a coconut estate in Kurunegala or a beachfront block in Trincomalee, in their own language, without guesswork.</p></div>
    </div>
    <div class="section-head" style="margin-top:52px"><div><span class="eyebrow">Why choose us</span><h2>What makes LandHub different</h2></div></div>
    <div class="grid-3">
      ${[['✓', 'Verified Listings', 'Deeds, survey plans and land registry extracts are reviewed by our administrators before the ✓ Verified badge appears.'],
    ['🔎', 'Easy Search', 'Filter by province, district, city, area, price, price per perch, size in perches or acres, land type and 9 practical features.'],
    ['🔒', 'Secure Platform', 'JWT authentication, BCrypt password hashing, role-based access control, input validation and protected admin routes.'],
    ['🇱🇰', 'Sri Lankan Locations', 'All 9 provinces, 25 districts and 150+ cities and towns, with expressway proximity filters for E01, E03 and E04.'],
    ['🤝', 'Buyer & Seller Support', 'In-platform messaging, reservations, sandbox payments with PDF invoices, reviews and notifications at every step.'],
    ['🌐', 'Three Languages', 'English, සිංහල and தமிழ் — because land is a national conversation, not an English-only one.']]
      .map(([i, h, p]) => `<div class="feature"><div class="ico">${i}</div><h3>${h}</h3><p>${p}</p></div>`).join('')}
    </div>
    <div class="notice" style="margin-top:30px"><b>Academic project notice:</b> LandHub Sri Lanka is a university Software Engineering group project. All sellers, listings, documents and payments shown are fictional demonstration data. The platform does not provide legal or financial advice.</div>
  </div></section>`;
};

/* =================== CONTACT =================== */
Pages.contact = function (host) {
  host.innerHTML = `
  <div class="wrap"><div class="breadcrumb"><a href="#/">Home</a> › <b>Contact</b></div>
  <div class="section-head"><div><span class="eyebrow">Get in touch</span><h2>Contact LandHub Sri Lanka</h2>
  <p>Questions about a listing, verification or your account? Our Colombo team responds within one working day.</p></div></div>
  <div style="display:grid;grid-template-columns:1fr 380px;gap:26px;align-items:start" class="contact-grid">
    <form class="panel" id="contactForm">
      <div class="form-grid">
        <div class="field"><label>Name *</label><input class="ctrl" name="name" required placeholder="Your full name"></div>
        <div class="field"><label>Email *</label><input class="ctrl" name="email" type="email" required placeholder="you@example.lk"></div>
        <div class="field"><label>Phone</label><input class="ctrl" name="phone" placeholder="+94 77 123 4567"><span class="hint">Format: +94 XX XXX XXXX</span></div>
        <div class="field"><label>Subject *</label><select class="ctrl" name="subject" required>
          <option>General inquiry</option><option>Listing a property</option><option>Document verification</option>
          <option>Reservation or payment</option><option>Report a listing</option><option>Technical support</option></select></div>
        <div class="field col-2"><label>Message *</label><textarea class="ctrl" name="message" required placeholder="How can we help you?"></textarea></div>
      </div>
      <button class="btn btn-primary btn-lg" style="margin-top:16px">Send message</button>
    </form>
    <div style="display:flex;flex-direction:column;gap:16px">
      <div class="panel"><div class="panel-title">📍 Head Office</div>
        <p style="color:var(--gray-600);margin:0">LandHub Sri Lanka (Pvt) Ltd<br>No. 128, Galle Road<br>Colombo 03<br>Western Province, Sri Lanka</p></div>
      <div class="panel"><div class="panel-title">📞 Call us</div>
        <p style="margin:0;color:var(--gray-600)">Office: <b style="color:var(--navy)">+94 11 234 5678</b><br>
        Sales: <b style="color:var(--navy)">+94 77 123 4567</b><br>
        Support: <b style="color:var(--navy)">+94 71 987 6543</b></p></div>
      <div class="panel"><div class="panel-title">✉️ Email</div>
        <p style="margin:0;color:var(--gray-600)">hello@landhub.lk<br>support@landhub.lk<br>verification@landhub.lk</p></div>
      <div class="panel"><div class="panel-title">🕐 Opening hours</div>
        <p style="margin:0;color:var(--gray-600)">Monday – Friday: 8:30 – 17:30<br>Saturday: 9:00 – 13:00<br>Sunday & Poya days: Closed</p></div>
      <div class="notice">Contact details shown are sample demonstration information for this university project.</div>
    </div>
  </div><div style="height:60px"></div></div>`;
  if (window.innerWidth < 900) document.querySelector('.contact-grid').style.gridTemplateColumns = '1fr';
  document.getElementById('contactForm').onsubmit = e => {
    e.preventDefault();
    UI.toast('Message sent ✓', 'Thank you — our team will reply within one working day.');
    e.target.reset();
  };
};

/* =================== HELP / FAQ =================== */
Pages.help = function (host) {
  const faqs = [
    ['How can I list my land?', 'Create a free seller account, then open <b>Sell Land</b> from the navigation bar. Enter the property title, description, land type, province, district, city and area, the size (in perches, roods, acres, square feet or square meters), your asking price, available facilities and up to 10 photos. Submit the listing and our administrators review it — usually within one working day.'],
    ['How can I search for land?', 'Use the hero search box on the home page or the full filter panel on the <b>Buy Land</b> page. You can filter by province, district, city, area, price range, price per perch, minimum and maximum perches, land type, and features such as main road access, electricity, water, clear deed and proximity to schools, hospitals, railway stations and expressways.'],
    ['What is a perch?', 'A perch is the standard Sri Lankan unit for land. <b>1 perch = 272.25 square feet = 25.29 square meters</b>. 40 perches make 1 rood and 160 perches make 1 acre. A typical suburban house block is between 8 and 20 perches.'],
    ['How is the land price calculated?', 'Total price = land size in perches × price per perch. Every LandHub listing displays both figures, e.g. <b>20 perches × Rs. 475,000 = Rs. 9,500,000</b>. The per-perch rate depends on district, road frontage, access width, title clarity and distance to towns or expressway interchanges.'],
    ['Can I search by district?', 'Yes. All 25 districts are supported. Use the district filter on the Buy Land page, or open the <b>Locations</b> page to browse every province and district with live property counts and average per-perch prices.'],
    ['How does reservation work?', 'Open a listing and click <b>Reserve Land</b>. Submit your name, contact number, email, preferred visit date and a message. The seller is notified and can approve or reject the request. Statuses move Pending → Approved → Completed, and either party can cancel before completion.'],
    ['How are documents verified?', 'Sellers upload the title deed, survey plan, land registry extract and other ownership documents. A LandHub administrator reviews each one and marks it Verified or Rejected. A listing shows the <b>✓ Verified Property</b> badge only when a deed or title certificate <i>and</i> a survey plan have both been verified. This is an administrative platform check, not legal certification — always consult a qualified lawyer before purchasing.'],
    ['How do I contact a seller?', 'Click <b>Contact Seller</b> on any listing to open a secure in-platform conversation. Personal phone numbers and emails are not published publicly; messages stay inside LandHub with read/unread tracking and a reference to the property.'],
    ['Can I compare properties?', 'Yes. Click <b>Compare</b> on up to four listings, then open the Compare page to see location, size, price, price per perch, land type, road access, utilities and verification status side by side.'],
    ['Is online payment available?', 'This project includes a <b>sandbox/demo payment module</b> supporting bank transfer, card, online and gateway options in LKR. No real funds are processed. Each transaction produces a downloadable PDF invoice with Pending, Successful, Failed or Refunded status.'],
    ['Is LandHub free to use?', 'Browsing, searching, saving to wishlist and messaging sellers are free for buyers. Sellers can post listings free of charge in this demonstration build.'],
    ['What should I check before buying land in Sri Lanka?', 'Ask for the title deed and the previous 30 years of deeds, a survey plan by a licensed surveyor, an extract from the Land Registry, the street line and non-vesting certificates from the local authority, prior approval for sub-divided blocks, and up-to-date rates receipts. Always have a lawyer verify these documents.']
  ];
  host.innerHTML = `<div class="wrap"><div class="breadcrumb"><a href="#/">Home</a> › <b>Help</b></div>
    <div class="section-head"><div><span class="eyebrow">Help centre</span><h2>Frequently Asked Questions</h2>
    <p>Everything you need to know about buying and selling land on LandHub Sri Lanka.</p></div></div>
    <div style="max-width:900px">
      ${faqs.map((f, i) => `<details class="accordion" ${i === 0 ? 'open' : ''}><summary>${f[0]}</summary><div class="content">${f[1]}</div></details>`).join('')}
      <div class="panel" style="margin-top:26px;text-align:center">
        <h3>Still need help?</h3><p style="color:var(--gray-600)">Our support team in Colombo is happy to assist.</p>
        <a class="btn btn-primary" href="#/contact">Contact support</a>
      </div>
    </div><div style="height:60px"></div></div>`;
};
