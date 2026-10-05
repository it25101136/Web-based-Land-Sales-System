/* Modal forms: contact seller, reserve, payment, review, document upload */
'use strict';

const Forms = {
  contactSeller(land) {
    if (!Auth.require()) return;
    if (land.seller_id === State.user.id) { UI.toast('This is your own listing', null, 'warn'); return; }
    UI.modal('💬 Contact Seller', `
      <div style="display:flex;gap:11px;align-items:center;background:var(--gray-50);padding:12px;border-radius:12px;margin-bottom:16px">
        <img src="${esc(land.cover || land.images[0] || '/img/land1.jpg')}" style="width:64px;height:52px;border-radius:9px;object-fit:cover">
        <div><b style="font-size:13.5px">${esc(land.title)}</b><br>
        <span style="font-size:12.5px;color:var(--gray-600)">${esc(land.location_display)} · ${esc(land.price_display)}</span></div>
      </div>
      <form id="msgForm" style="display:flex;flex-direction:column;gap:13px">
        <div class="field"><label>Message to ${esc(land.seller_name)}</label>
          <textarea class="ctrl" name="body" required>Hello, I am interested in this ${land.size.display} ${land.land_type.toLowerCase()} land in ${land.city}. Is it still available, and can I arrange a site visit?</textarea></div>
        <button class="btn btn-primary btn-block">Send secure message</button>
        <p style="font-size:11.8px;color:var(--gray-400);text-align:center;margin:0">Messages stay inside LandHub. Your phone number is not shared unless you choose to share it.</p>
      </form>`, (bg) => {
      bg.querySelector('#msgForm').onsubmit = async e => {
        e.preventDefault();
        try {
          await API.post('/api/messages', { receiver_id: land.seller_id, land_id: land.id, body: e.target.body.value });
          UI.closeModal(); UI.toast('Message sent ✓', 'The seller will be notified.');
        } catch (err) { UI.err(err); }
      };
    });
  },

  reserve(land) {
    if (!Auth.require()) return;
    if (land.seller_id === State.user.id) { UI.toast('You cannot reserve your own listing', null, 'warn'); return; }
    UI.modal('🔑 Reserve This Land', `
      <div class="notice" style="margin-bottom:16px">Reserving expresses serious interest. The seller reviews your request and can approve or reject it. No payment is taken at this stage.</div>
      <form id="resForm" class="form-grid">
        <div class="field"><label>Your name *</label><input class="ctrl" name="buyer_name" required value="${esc(State.user.full_name)}"></div>
        <div class="field"><label>Contact number *</label><input class="ctrl" name="contact_no" required value="${esc(State.user.phone || '')}" placeholder="+94 77 123 4567"></div>
        <div class="field"><label>Email *</label><input class="ctrl" name="email" type="email" required value="${esc(State.user.email)}"></div>
        <div class="field"><label>Preferred visit date</label><input class="ctrl" name="preferred_date" type="date"></div>
        <div class="field col-2"><label>Message to seller</label><textarea class="ctrl" name="message" placeholder="Any questions or conditions…"></textarea></div>
        <div class="col-2"><button class="btn btn-gold btn-lg btn-block">Submit reservation request</button></div>
      </form>`, (bg) => {
      bg.querySelector('#resForm').onsubmit = async e => {
        e.preventDefault();
        const f = Object.fromEntries(new FormData(e.target).entries());
        f.land_id = land.id;
        try {
          await API.post('/api/bookings', f);
          UI.closeModal(); UI.toast('Reservation requested ✓', 'You will be notified when the seller responds.');
          Router.go('/bookings');
        } catch (err) { UI.err(err); }
      };
    });
  },

  pay(booking) {
    UI.modal('💳 Sandbox Payment (LKR)', `
      <div class="notice" style="margin-bottom:16px"><b>Demo mode:</b> this is a sandbox payment module for a university project. No real money is transferred and no real card details should be entered.</div>
      <div style="background:var(--gray-50);padding:13px;border-radius:12px;margin-bottom:16px;font-size:13.5px">
        <b>${esc(booking.land_title)}</b><br><span style="color:var(--gray-600)">${esc(booking.city)}, ${esc(booking.district)} · Listed at ${fmt.lkr(booking.price)}</span>
      </div>
      <form id="payForm" class="form-grid">
        <div class="field"><label>Payment method *</label><select class="ctrl" name="method">
          <option value="ONLINE">Online Payment</option><option value="CARD">Card Payment</option>
          <option value="BANK_TRANSFER">Bank Transfer</option><option value="GATEWAY">Payment Gateway</option></select></div>
        <div class="field"><label>Amount (LKR) *</label><input class="ctrl" name="amount" type="number" required value="${Math.round(booking.price * 0.1)}">
          <span class="hint">Suggested 10% booking deposit</span></div>
        <div class="field col-2 hidden" id="cardBox"><label>Demo card number</label>
          <input class="ctrl" name="card_number" placeholder="4242 4242 4242 4242">
          <span class="hint">Demo rule: a card ending in an even digit succeeds, odd digit fails.</span></div>
        <div class="col-2"><button class="btn btn-primary btn-lg btn-block">Pay ${'&'}nbsp;now (sandbox)</button></div>
      </form>`, (bg) => {
      const sel = bg.querySelector('[name=method]');
      sel.onchange = () => bg.querySelector('#cardBox').classList.toggle('hidden', sel.value !== 'CARD');
      bg.querySelector('#payForm').onsubmit = async e => {
        e.preventDefault();
        const f = Object.fromEntries(new FormData(e.target).entries());
        f.booking_id = booking.id;
        try {
          const p = await API.post('/api/payments', f);
          UI.closeModal();
          if (p.status === 'SUCCESSFUL') UI.toast('Payment successful ✓', 'Invoice ' + p.invoice_no + ' is ready to download.');
          else if (p.status === 'PENDING') UI.toast('Bank transfer recorded', 'Awaiting administrator confirmation.', 'warn');
          else UI.toast('Payment failed', 'The demo card was declined. Try a card ending in an even digit.', 'err');
          Router.go('/payments');
        } catch (err) { UI.err(err); }
      };
    });
  },

  review(sellerId, sellerName, landId) {
    if (!Auth.require(['BUYER', 'ADMIN'])) return;
    UI.modal('⭐ Write a Review', `
      <form id="revForm" style="display:flex;flex-direction:column;gap:14px">
        <p style="margin:0;color:var(--gray-600);font-size:14px">How was your experience with <b>${esc(sellerName)}</b>?</p>
        <div class="field"><label>Rating *</label>
          <div id="starPick" style="font-size:31px;color:var(--gold);cursor:pointer;letter-spacing:5px">
            ${[1, 2, 3, 4, 5].map(i => `<span data-s="${i}">☆</span>`).join('')}</div>
          <input type="hidden" name="rating" value="5"></div>
        <div class="field"><label>Your review</label><textarea class="ctrl" name="comment" placeholder="Was the seller transparent? Were the documents in order?"></textarea></div>
        <button class="btn btn-primary btn-block">Submit review</button>
        <p style="font-size:11.8px;color:var(--gray-400);text-align:center;margin:0">Reviews are moderated by administrators before they appear publicly.</p>
      </form>`, (bg) => {
      const pick = bg.querySelector('#starPick'), hidden = bg.querySelector('[name=rating]');
      const paint = n => pick.querySelectorAll('span').forEach((s, i) => s.textContent = i < n ? '★' : '☆');
      paint(5);
      pick.querySelectorAll('span').forEach(s => {
        s.onmouseenter = () => paint(Number(s.dataset.s));
        s.onclick = () => { hidden.value = s.dataset.s; paint(Number(s.dataset.s)); };
      });
      pick.onmouseleave = () => paint(Number(hidden.value));
      bg.querySelector('#revForm').onsubmit = async e => {
        e.preventDefault();
        const f = Object.fromEntries(new FormData(e.target).entries());
        f.seller_id = sellerId; if (landId) f.land_id = landId;
        try { await API.post('/api/reviews', f); UI.closeModal(); UI.toast('Review submitted ✓', 'It will appear once approved.'); Router.render(); }
        catch (err) { UI.err(err); }
      };
    });
  },

  uploadDoc(lands) {
    UI.modal('📄 Upload Land Document', `
      <div class="notice" style="margin-bottom:16px">Upload the deed, survey plan and land registry extract. Administrators review each document; a listing earns the ✓ Verified badge only when a deed (or title certificate) <b>and</b> a survey plan are verified. This is an administrative check, not legal certification.</div>
      <form id="docForm" style="display:flex;flex-direction:column;gap:14px">
        <div class="field"><label>Property *</label><select class="ctrl" name="land_id" required>
          ${lands.map(l => `<option value="${l.id}">${esc(l.title)}</option>`).join('')}</select></div>
        <div class="field"><label>Document type *</label><select class="ctrl" name="doc_type" required>
          <option value="DEED">Title Deed (ඔප්පුව)</option><option value="TITLE_CERTIFICATE">Title Certificate</option>
          <option value="SURVEY_PLAN">Survey Plan</option><option value="LAND_REGISTRY">Land Registry Extract</option>
          <option value="OWNERSHIP">Ownership Document</option><option value="OTHER_LEGAL">Other Legal Document</option></select></div>
        <div class="field"><label>Document file *</label><input class="ctrl" type="file" id="docFile" accept=".pdf,.jpg,.png">
          <span class="hint">Demo build: the file name is recorded, the file itself is not stored.</span></div>
        <input type="hidden" name="file_name">
        <button class="btn btn-primary btn-block">Submit for verification</button>
      </form>`, (bg) => {
      const file = bg.querySelector('#docFile'), hidden = bg.querySelector('[name=file_name]');
      file.onchange = () => { hidden.value = file.files[0] ? file.files[0].name : ''; };
      bg.querySelector('#docForm').onsubmit = async e => {
        e.preventDefault();
        const f = Object.fromEntries(new FormData(e.target).entries());
        if (!f.file_name) f.file_name = f.doc_type.toLowerCase() + '_' + Date.now() + '.pdf';
        try { await API.post('/api/documents', f); UI.closeModal(); UI.toast('Document submitted ✓', 'Pending administrator verification.'); Router.render(); }
        catch (err) { UI.err(err); }
      };
    });
  },

  editLand(land) {
    UI.modal('✏️ Edit Listing', `
      <form id="edForm" class="form-grid">
        <div class="field col-2"><label>Title</label><input class="ctrl" name="title" value="${esc(land.title)}"></div>
        <div class="field col-2"><label>Description</label><textarea class="ctrl" name="description">${esc(land.description)}</textarea></div>
        <div class="field"><label>Price (LKR)</label><input class="ctrl" name="price" type="number" value="${land.price}"></div>
        <div class="field"><label>Size (perches)</label><input class="ctrl" name="perches" type="number" step="0.01" value="${land.perches}"></div>
        <div class="field col-2"><label class="check ${land.negotiable ? 'on' : ''}"><input type="checkbox" name="negotiable" ${land.negotiable ? 'checked' : ''}> Price negotiable</label></div>
        <div class="col-2"><button class="btn btn-primary btn-block">Save changes</button></div>
      </form>`, (bg) => {
      bg.querySelector('#edForm').onsubmit = async e => {
        e.preventDefault();
        const f = Object.fromEntries(new FormData(e.target).entries());
        f.negotiable = f.negotiable ? 1 : 0;
        try { await API.put('/api/lands/' + land.id, f); UI.closeModal(); UI.toast('Listing updated ✓'); Router.render(); }
        catch (err) { UI.err(err); }
      };
    });
  }
};
