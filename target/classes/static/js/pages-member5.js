/* Member 5 — Customer Management & Inquiry Handling :: Frontend Pages */
'use strict';

/* =================== CUSTOMER MANAGEMENT =================== */
Pages.customers = async function (host) {
  if (!Auth.require(['ADMIN'])) return;
  host.innerHTML = dashShell('Customer Management', 'View and manage registered customers.', ADMIN_NAV, 'cm');
  const el = document.getElementById('cm');
  const load = async (status, q) => {
    el.innerHTML = `<div class="panel" style="margin-bottom:18px;display:flex;gap:10px;flex-wrap:wrap">
        <input class="ctrl" id="cq" placeholder="Search name or email…" value="${esc(q || '')}" style="max-width:280px">
        <select class="ctrl" id="cs" style="max-width:200px">
          <option value="">All statuses</option>${['ACTIVE', 'SUSPENDED'].map(s => `<option ${status === s ? 'selected' : ''}>${s}</option>`).join('')}</select>
      </div><div id="ct">${UI.skeletonCards(1)}</div>`;
    document.getElementById('cs').onchange = e => load(e.target.value, document.getElementById('cq').value);
    document.getElementById('cq').onkeydown = e => { if (e.key === 'Enter') load(document.getElementById('cs').value, e.target.value); };
    try {
      const r = await API.get('/api/customers' + API.qs({ status, q }));
      document.getElementById('ct').innerHTML = r.items.length ? `<div class="table-wrap"><table><thead><tr>
        <th>Customer</th><th>Contact</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead><tbody>
        ${r.items.map(u => `<tr>
          <td><div style="display:flex;gap:9px;align-items:center"><div class="avatar">${fmt.initials(u.full_name)}</div>
            <div><b>${esc(u.full_name)}</b><br><span style="font-size:12px;color:var(--gray-600)">${esc(u.email)}</span></div></div></td>
          <td style="font-size:12.5px">${esc(u.phone || '—')}</td>
          <td><span class="pill p-navy">${esc(u.role)}</span></td>
          <td>${UI.pill(u.status)}</td><td>${fmt.date(u.created_at)}</td>
          <td style="white-space:nowrap">
            <a class="btn btn-primary btn-sm" href="#/customers/${u.id}">View</a>
            <button class="btn btn-ghost btn-sm" data-cst="${u.id}" data-to="${u.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'}">${u.status === 'ACTIVE' ? 'Suspend' : 'Activate'}</button></td></tr>`).join('')}
        </tbody></table></div>
        <div style="margin-top:12px;font-size:13px;color:var(--gray-600)">Showing ${r.items.length} of ${r.total} customers</div>`
        : UI.empty('👤', 'No customers found', 'Try changing your search or filter.');
      document.querySelectorAll('[data-cst]').forEach(b => b.onclick = async () => {
        if (b.dataset.to === 'SUSPENDED' && !confirm('Suspend this customer? They will not be able to log in.')) return;
        try { await API.put('/api/customers/' + b.dataset.cst + '/status', { status: b.dataset.to }); UI.toast('Customer ' + b.dataset.to.toLowerCase()); load(status, q); } catch (e) { UI.err(e); }
      });
    } catch (e) { UI.err(e); }
  };
  load('', '').catch(e => UI.err(e));
};

/* =================== CUSTOMER DETAIL =================== */
Pages.customerDetail = async function (host, _query, id) {
  if (!Auth.require(['ADMIN'])) return;
  host.innerHTML = dashShell('Customer Details', 'View customer profile, reservations, payments and inquiries.', ADMIN_NAV, 'cd');
  const el = document.getElementById('cd');
  el.innerHTML = UI.skeletonCards(2);
  try {
    const c = await API.get('/api/customers/' + id);
    el.innerHTML = `
      <div class="grid-2" style="margin-bottom:22px">
        <div class="panel">
          <div class="panel-title">👤 Profile
            <button class="btn btn-ghost btn-sm" id="editCust">✏️ Edit</button></div>
          <div style="display:flex;gap:16px;align-items:center;margin-bottom:18px">
            <div class="avatar" style="width:56px;height:56px;font-size:20px">${fmt.initials(c.full_name)}</div>
            <div><b style="font-size:18px">${esc(c.full_name)}</b><br>
              <span style="color:var(--gray-600)">${esc(c.email)}</span></div>
          </div>
          <div style="display:flex;flex-direction:column;gap:9px;font-size:13.5px;color:var(--gray-600)">
            <div>📞 Phone: <b>${esc(c.phone || '—')}</b></div>
            <div>🪪 NIC: <b>${esc(c.nic || '—')}</b></div>
            <div>🌐 Language: <b>${esc(c.language === 'si' ? 'Sinhala' : c.language === 'ta' ? 'Tamil' : 'English')}</b></div>
            <div>Role: <span class="pill p-navy">${esc(c.role)}</span></div>
            <div>Status: ${UI.pill(c.status)}</div>
            <div>Member since: <b>${fmt.date(c.created_at)}</b></div>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:18px">
          <div class="panel">
            <div class="panel-title">📊 Summary</div>
            <div class="grid-2" style="gap:12px">
              <div class="stat"><b>${c.reservations.length}</b><span>Reservations</span></div>
              <div class="stat"><b>${c.payments.length}</b><span>Payments</span></div>
              <div class="stat"><b>${c.inquiries.length}</b><span>Inquiries</span></div>
              <div class="stat ${c.status === 'ACTIVE' ? '' : 'red'}"><b>${c.status}</b><span>Account Status</span></div>
            </div>
          </div>
          <div class="panel">
            <div class="panel-title">⚡ Quick Actions</div>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              <button class="btn ${c.status === 'ACTIVE' ? 'btn-ghost' : 'btn-primary'} btn-sm" id="toggleStatus">${c.status === 'ACTIVE' ? '🚫 Suspend' : '✓ Activate'}</button>
            </div>
          </div>
        </div>
      </div>

      <div class="panel" style="margin-bottom:18px">
        <div class="panel-title">🔑 Reservation History</div>
        ${c.reservations.length ? '<div class="table-wrap"><table><thead><tr><th>Property</th><th>District</th><th>Preferred Date</th><th>Status</th><th>Date</th></tr></thead><tbody>' +
          c.reservations.map(b => '<tr><td><b>' + esc(b.land_title) + '</b></td><td>' + esc(b.district) + '</td><td>' + (b.preferred_date || '—') + '</td><td>' + UI.pill(b.status) + '</td><td>' + fmt.date(b.created_at) + '</td></tr>').join('') +
          '</tbody></table></div>' : '<p style="color:var(--gray-600);margin:0">No reservations.</p>'}
      </div>

      <div class="panel" style="margin-bottom:18px">
        <div class="panel-title">💳 Payment History</div>
        ${c.payments.length ? '<div class="table-wrap"><table><thead><tr><th>Invoice</th><th>Property</th><th>Amount</th><th>Method</th><th>Status</th><th>Date</th></tr></thead><tbody>' +
          c.payments.map(p => '<tr><td><b>' + esc(p.invoice_no) + '</b></td><td>' + esc(p.land_title) + '</td><td><b>' + fmt.lkr(p.amount) + '</b></td><td>' + esc(p.method.replace('_',' ')) + '</td><td>' + UI.pill(p.status) + '</td><td>' + fmt.date(p.created_at) + '</td></tr>').join('') +
          '</tbody></table></div>' : '<p style="color:var(--gray-600);margin:0">No payments.</p>'}
      </div>

      <div class="panel">
        <div class="panel-title">📩 Inquiry History <a class="btn btn-ghost btn-sm" href="#/inquiries">View all</a></div>
        ${c.inquiries.length ? '<div class="table-wrap"><table><thead><tr><th>Subject</th><th>Category</th><th>Status</th><th>Created</th><th>Updated</th><th>Actions</th></tr></thead><tbody>' +
          c.inquiries.map(q => '<tr><td><b>' + esc(q.subject) + '</b></td><td>' + esc(q.category.replace('_',' ')) + '</td><td>' + UI.pill(q.status) + '</td><td>' + fmt.date(q.created_at) + '</td><td>' + fmt.date(q.updated_at) + '</td><td><a class="btn btn-ghost btn-sm" href="#/inquiries/' + q.id + '">View</a></td></tr>').join('') +
          '</tbody></table></div>' : '<p style="color:var(--gray-600);margin:0">No inquiries.</p>'}
      </div>`;

    document.getElementById('editCust').onclick = () => {
      UI.modal('✏️ Edit Customer', '<form id="editCustForm" style="display:flex;flex-direction:column;gap:14px">' +
        '<div class="field"><label>Full name</label><input class="ctrl" name="full_name" value="' + esc(c.full_name) + '" required></div>' +
        '<div class="field"><label>Phone</label><input class="ctrl" name="phone" value="' + esc(c.phone || '') + '"></div>' +
        '<div class="field"><label>NIC</label><input class="ctrl" name="nic" value="' + esc(c.nic || '') + '"></div>' +
        '<div class="field"><label>Language</label><select class="ctrl" name="language">' +
          [['en','English'],['si','සිංහල'],['ta','தமிழ்']].map(function(x) { return '<option value="' + x[0] + '"' + (c.language === x[0] ? ' selected' : '') + '>' + x[1] + '</option>'; }).join('') +
        '</select></div>' +
        '<button class="btn btn-primary btn-block">Save changes</button></form>', function(bg) {
        bg.querySelector('#editCustForm').onsubmit = async function(e) {
          e.preventDefault();
          try {
            await API.put('/api/customers/' + id, Object.fromEntries(new FormData(e.target).entries()));
            UI.closeModal(); UI.toast('Customer updated ✓'); Router.render();
          } catch (err) { UI.err(err); }
        };
      });
    };

    document.getElementById('toggleStatus').onclick = async () => {
      const newStatus = c.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
      if (newStatus === 'SUSPENDED' && !confirm('Suspend this customer? They will not be able to log in.')) return;
      try { await API.put('/api/customers/' + id + '/status', { status: newStatus }); UI.toast('Customer ' + newStatus.toLowerCase()); Router.render(); }
      catch (e) { UI.err(e); }
    };
  } catch (e) { UI.err(e); }
};

/* =================== INQUIRY MANAGEMENT =================== */
Pages.inquiries = async function (host) {
  if (!Auth.require()) return;
  const isAdmin = State.user.role === 'ADMIN';
  host.innerHTML = dashShell(
    isAdmin ? 'Inquiry Management' : 'My Inquiries',
    isAdmin ? 'Review and respond to customer inquiries and complaints.' : 'Track your inquiries and view responses.',
    navFor(), 'inq',
    isAdmin ? '' : '<a class="btn btn-primary" href="#/inquiries/new">📩 Submit Inquiry</a>');
  const el = document.getElementById('inq');

  if (isAdmin) {
    const load = async (status, q) => {
      el.innerHTML = '<div class="panel" style="margin-bottom:18px;display:flex;gap:10px;flex-wrap:wrap">' +
          '<input class="ctrl" id="iq" placeholder="Search subject or customer…" value="' + esc(q || '') + '" style="max-width:280px">' +
          '<select class="ctrl" id="is" style="max-width:220px">' +
            '<option value="">All statuses</option>' + ['OPEN', 'PENDING_CLARIFICATION', 'RESOLVED'].map(function(s) { return '<option' + (status === s ? ' selected' : '') + '>' + s + '</option>'; }).join('') + '</select>' +
        '</div><div id="it">' + UI.skeletonCards(1) + '</div>';
      document.getElementById('is').onchange = function(e) { load(e.target.value, document.getElementById('iq').value); };
      document.getElementById('iq').onkeydown = function(e) { if (e.key === 'Enter') load(document.getElementById('is').value, e.target.value); };
      try {
        const r = await API.get('/api/inquiries' + API.qs({ status, q }));
        document.getElementById('it').innerHTML = r.items.length ? '<div class="table-wrap"><table><thead><tr>' +
          '<th>#</th><th>Customer</th><th>Subject</th><th>Category</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead><tbody>' +
          r.items.map(function(i) {
            return '<tr style="' + (i.status === 'OPEN' ? 'background:var(--emerald-soft)' : '') + '">' +
              '<td><b>#' + i.id + '</b></td>' +
              '<td style="font-size:12.5px"><b>' + esc(i.customer_name) + '</b><br>' + esc(i.customer_email) + '</td>' +
              '<td><b>' + esc(i.subject) + '</b>' + (i.land_title ? '<br><span style="font-size:11.5px;color:var(--emerald)">🏝️ ' + esc(i.land_title) + '</span>' : '') + '</td>' +
              '<td><span class="chip">' + esc(i.category.replace(/_/g, ' ')) + '</span></td>' +
              '<td>' + UI.pill(i.status) + '</td>' +
              '<td>' + fmt.date(i.created_at) + '</td>' +
              '<td><a class="btn btn-primary btn-sm" href="#/inquiries/' + i.id + '">Review</a></td></tr>';
          }).join('') + '</tbody></table></div>'
          : UI.empty('📩', 'No inquiries found', 'Customer inquiries will appear here.');
      } catch (e) { UI.err(e); }
    };
    load('', '').catch(function(e) { UI.err(e); });
  } else {
    try {
      const r = await API.get('/api/inquiries/mine');
      el.innerHTML = r.items.length ? '<div class="table-wrap"><table><thead><tr>' +
        '<th>#</th><th>Subject</th><th>Category</th><th>Status</th><th>Created</th><th>Updated</th><th>Actions</th></tr></thead><tbody>' +
        r.items.map(function(i) {
          return '<tr style="' + (i.status === 'PENDING_CLARIFICATION' ? 'background:#FEF3CD' : '') + '">' +
            '<td><b>#' + i.id + '</b></td>' +
            '<td><b>' + esc(i.subject) + '</b>' + (i.land_title ? '<br><span style="font-size:11.5px;color:var(--emerald)">🏝️ ' + esc(i.land_title) + '</span>' : '') + '</td>' +
            '<td><span class="chip">' + esc(i.category.replace(/_/g, ' ')) + '</span></td>' +
            '<td>' + UI.pill(i.status) + '</td>' +
            '<td>' + fmt.date(i.created_at) + '</td><td>' + fmt.date(i.updated_at) + '</td>' +
            '<td><a class="btn btn-ghost btn-sm" href="#/inquiries/' + i.id + '">View</a></td></tr>';
        }).join('') + '</tbody></table></div>'
        : UI.empty('📩', 'No inquiries yet', 'Have a question or issue? Submit an inquiry and our team will respond.',
          '<a class="btn btn-primary" href="#/inquiries/new">Submit an inquiry</a>');
    } catch (e) { UI.err(e); }
  }
};

/* =================== INQUIRY DETAIL =================== */
Pages.inquiryDetail = async function (host, _query, id) {
  if (!Auth.require()) return;
  const isStaff = State.user.role === 'ADMIN' || State.user.role === 'SUPPORT';
  const isAdmin = State.user.role === 'ADMIN';
  host.innerHTML = dashShell('Inquiry Details', 'View inquiry conversation and status.', navFor(), 'iq');
  const el = document.getElementById('iq');
  el.innerHTML = UI.skeletonCards(2);
  try {
    const r = await API.get('/api/inquiries/' + id);
    const inq = r.inquiry;
    const responses = r.responses;
    const isMyInquiry = inq.customer_id === State.user.id;

    // Build conversation HTML
    var convHtml = '<div style="background:var(--gray-50);padding:14px;border-radius:12px;border-left:4px solid var(--navy)">' +
      '<div style="display:flex;justify-content:space-between;margin-bottom:8px">' +
      '<b style="color:var(--navy)">' + esc(inq.customer_name) + ' (Customer)</b>' +
      '<span style="font-size:11.5px;color:var(--gray-400)">' + fmt.dateTime(inq.created_at) + '</span></div>' +
      '<div style="white-space:pre-wrap;color:var(--gray-700)">' + esc(inq.message) + '</div></div>';

    responses.forEach(function(resp) {
      var isStaffReply = resp.sender_role === 'ADMIN' || resp.sender_role === 'SUPPORT';
      var isClarReq = resp.message_type === 'CLARIFICATION_REQUEST';
      var isClarReply = resp.message_type === 'CLARIFICATION_REPLY';
      var borderColor = isClarReq ? 'var(--gold)' : (isStaffReply ? 'var(--emerald)' : 'var(--navy)');
      var bgColor = isClarReq ? '#FEF3CD' : (isStaffReply ? 'var(--emerald-soft)' : 'var(--gray-50)');
      var typeLabel = isClarReq ? '⚠️ Clarification Requested' : (isClarReply ? '↩️ Clarification Reply' : '✅ Staff Response');
      convHtml += '<div style="background:' + bgColor + ';padding:14px;border-radius:12px;border-left:4px solid ' + borderColor + '">' +
        '<div style="display:flex;justify-content:space-between;margin-bottom:8px">' +
        '<b style="color:' + (isStaffReply ? 'var(--emerald)' : 'var(--navy)') + '">' + esc(resp.sender_name) + ' (' + (isStaffReply ? 'Staff' : 'Customer') + ')</b>' +
        '<div style="display:flex;gap:8px;align-items:center">' +
        '<span class="chip" style="font-size:11px">' + typeLabel + '</span>' +
        '<span style="font-size:11.5px;color:var(--gray-400)">' + fmt.dateTime(resp.created_at) + '</span></div></div>' +
        '<div style="white-space:pre-wrap;color:var(--gray-700)">' + esc(resp.message) + '</div></div>';
    });

    el.innerHTML = '<a class="btn btn-ghost btn-sm" href="#/inquiries" style="margin-bottom:16px;display:inline-block">← Back to inquiries</a>' +
      '<div class="grid-2" style="margin-bottom:22px">' +
        '<div class="panel"><div class="panel-title">📩 Inquiry #' + inq.id +
          '<span style="margin-left:auto">' + UI.pill(inq.status) + '</span></div>' +
          '<div style="display:flex;flex-direction:column;gap:9px;font-size:13.5px;color:var(--gray-600)">' +
            '<div><b style="color:var(--navy);font-size:16px">' + esc(inq.subject) + '</b></div>' +
            '<div>Category: <span class="chip">' + esc(inq.category.replace(/_/g, ' ')) + '</span></div>' +
            (inq.land_title ? '<div>Related property: <a href="#/land/' + inq.land_id + '" style="color:var(--emerald);font-weight:700">🏝️ ' + esc(inq.land_title) + '</a> — ' + esc(inq.land_district || '') + '</div>' : '') +
            '<div>Created: <b>' + fmt.dateTime(inq.created_at) + '</b></div>' +
            '<div>Last updated: <b>' + fmt.dateTime(inq.updated_at) + '</b></div>' +
            (inq.staff_name ? '<div>Assigned to: <b>' + esc(inq.staff_name) + '</b></div>' : '') +
          '</div></div>' +
        '<div class="panel"><div class="panel-title">👤 Customer Information</div>' +
          '<div style="display:flex;gap:12px;align-items:center;margin-bottom:12px">' +
          '<div class="avatar">' + fmt.initials(inq.customer_name) + '</div>' +
          '<div><b>' + esc(inq.customer_name) + '</b><br>' +
            '<span style="font-size:12.5px;color:var(--gray-600)">' + esc(inq.customer_email) + '</span>' +
            (inq.customer_phone ? '<br><span style="font-size:12.5px;color:var(--gray-600)">📞 ' + esc(inq.customer_phone) + '</span>' : '') + '</div></div>' +
          (isAdmin ? '<a class="btn btn-ghost btn-sm" href="#/customers/' + inq.customer_id + '">View full profile</a>' : '') +
        '</div></div>' +
      '<div class="panel" style="margin-bottom:22px"><div class="panel-title">💬 Conversation</div>' +
        '<div style="display:flex;flex-direction:column;gap:14px;padding:8px 0">' + convHtml + '</div></div>' +
      '<div id="inqActions"></div>';

    var actionsEl = document.getElementById('inqActions');

    if (isStaff && inq.status !== 'RESOLVED') {
      actionsEl.innerHTML = '<div class="grid-2">' +
        '<div class="panel"><div class="panel-title">✅ Respond & Resolve</div>' +
          '<form id="respondForm" style="display:flex;flex-direction:column;gap:12px">' +
            '<div class="field"><label>Your response *</label>' +
              '<textarea class="ctrl" name="message" required placeholder="Enter your response to resolve this inquiry…" style="min-height:100px"></textarea></div>' +
            '<button class="btn btn-primary btn-block">Send Response & Resolve</button></form></div>' +
        '<div class="panel"><div class="panel-title">⚠️ Request Clarification</div>' +
          '<form id="clarifyForm" style="display:flex;flex-direction:column;gap:12px">' +
            '<div class="field"><label>What information do you need? *</label>' +
              '<textarea class="ctrl" name="message" required placeholder="Explain what additional information is needed…" style="min-height:100px"></textarea></div>' +
            '<button class="btn btn-gold btn-block">Request Clarification</button></form></div></div>';

      document.getElementById('respondForm').onsubmit = async function(e) {
        e.preventDefault();
        try {
          await API.post('/api/inquiries/' + id + '/respond', { message: e.target.message.value });
          UI.toast('Response sent ✓', 'Inquiry has been resolved.'); Router.render();
        } catch (err) { UI.err(err); }
      };
      document.getElementById('clarifyForm').onsubmit = async function(e) {
        e.preventDefault();
        try {
          await API.post('/api/inquiries/' + id + '/clarify', { message: e.target.message.value });
          UI.toast('Clarification requested ✓', 'Customer will be notified.'); Router.render();
        } catch (err) { UI.err(err); }
      };
    } else if (isMyInquiry && inq.status === 'PENDING_CLARIFICATION') {
      actionsEl.innerHTML = '<div class="panel">' +
        '<div class="panel-title">↩️ Provide Clarification</div>' +
        '<div class="notice" style="margin-bottom:14px">The support team has requested additional information. Please provide the details below.</div>' +
        '<form id="replyForm" style="display:flex;flex-direction:column;gap:12px">' +
          '<div class="field"><label>Your reply *</label>' +
            '<textarea class="ctrl" name="message" required placeholder="Provide the requested additional information…" style="min-height:100px"></textarea></div>' +
          '<button class="btn btn-primary btn-block">Submit Clarification</button></form></div>';

      document.getElementById('replyForm').onsubmit = async function(e) {
        e.preventDefault();
        try {
          await API.post('/api/inquiries/' + id + '/reply', { message: e.target.message.value });
          UI.toast('Clarification submitted ✓', 'The team will review your response.'); Router.render();
        } catch (err) { UI.err(err); }
      };
    } else if (inq.status === 'RESOLVED') {
      actionsEl.innerHTML = '<div class="notice" style="background:var(--emerald-soft);border-color:var(--emerald)"><b>✅ This inquiry has been resolved.</b> If you have further questions, please submit a new inquiry.</div>';
    }
  } catch (e) { UI.err(e); }
};

/* =================== SUBMIT INQUIRY =================== */
Pages.inquiryNew = async function (host) {
  if (!Auth.require()) return;
  host.innerHTML = dashShell('Submit Inquiry', 'Have a question or concern? We are here to help.', navFor(), 'ni',
    '<a class="btn btn-ghost" href="#/inquiries">← My Inquiries</a>');
  var el = document.getElementById('ni');
  el.innerHTML = '<div class="grid-2">' +
    '<div class="panel"><div class="panel-title">📩 New Inquiry</div>' +
      '<form id="inqForm" style="display:flex;flex-direction:column;gap:14px">' +
        '<div class="field"><label>Category *</label>' +
          '<select class="ctrl" name="category">' +
            '<option value="GENERAL">General Question</option>' +
            '<option value="LAND_INQUIRY">Land Inquiry</option>' +
            '<option value="RESERVATION">Reservation Issue</option>' +
            '<option value="PAYMENT">Payment Question</option>' +
            '<option value="COMPLAINT">Complaint</option>' +
            '<option value="OTHER">Other</option></select></div>' +
        '<div class="field"><label>Subject *</label>' +
          '<input class="ctrl" name="subject" required placeholder="Brief summary of your inquiry" minlength="3" maxlength="200"></div>' +
        '<div class="field" id="landField" style="display:none"><label>Related property (optional)</label>' +
          '<select class="ctrl" name="land_id"><option value="">Not related to a specific property</option></select></div>' +
        '<div class="field"><label>Message *</label>' +
          '<textarea class="ctrl" name="message" required placeholder="Describe your question or issue in detail…" style="min-height:140px" minlength="10" maxlength="5000"></textarea>' +
          '<span class="hint">Minimum 10 characters</span></div>' +
        '<button class="btn btn-primary btn-lg btn-block">Submit Inquiry</button></form></div>' +
    '<div>' +
      '<div class="panel" style="margin-bottom:18px"><div class="panel-title">ℹ️ What to expect</div>' +
        '<div style="display:flex;flex-direction:column;gap:11px;font-size:13.5px;color:var(--gray-600)">' +
          '<div>1️⃣ Your inquiry is recorded and assigned status <b>Open</b>.</div>' +
          '<div>2️⃣ Our Customer Relations team reviews your inquiry.</div>' +
          '<div>3️⃣ If we need more information, we will request clarification.</div>' +
          '<div>4️⃣ Once resolved, you will receive a notification.</div>' +
          '<div>5️⃣ All communication is saved in the inquiry history.</div></div></div>' +
      '<div class="panel"><div class="panel-title">📞 Alternative Contact</div>' +
        '<div style="font-size:13.5px;color:var(--gray-600)">' +
          '<p>If your issue is urgent, you can also contact us:</p>' +
          '<p>📞 +94 11 234 5678<br>📱 +94 77 123 4567<br>✉️ hello@landhub.lk</p>' +
          '<p style="font-size:12px;color:var(--gray-400)">Mon–Fri 8:30–17:30 · Sat 9:00–13:00</p></div></div>' +
    '</div></div>';

  var catSel = el.querySelector('[name=category]');
  var landField = document.getElementById('landField');
  catSel.onchange = async function() {
    if (['LAND_INQUIRY', 'RESERVATION'].indexOf(catSel.value) >= 0) {
      landField.style.display = '';
      try {
        var wl = await API.get('/api/wishlist');
        var landSel = landField.querySelector('select');
        landSel.innerHTML = '<option value="">Not related to a specific property</option>' +
          wl.items.map(function(l) { return '<option value="' + l.id + '">' + esc(l.title) + ' — ' + esc(l.district) + '</option>'; }).join('');
      } catch (_) { }
    } else {
      landField.style.display = 'none';
    }
  };

  document.getElementById('inqForm').onsubmit = async function(e) {
    e.preventDefault();
    var f = Object.fromEntries(new FormData(e.target).entries());
    if (!f.land_id) delete f.land_id;
    var btn = e.target.querySelector('button[class*=primary]');
    btn.disabled = true; btn.textContent = 'Submitting…';
    try {
      var inq = await API.post('/api/inquiries', f);
      UI.toast('Inquiry submitted ✓', 'Our team will respond shortly.');
      Router.go('/inquiries/' + inq.id);
    } catch (err) {
      UI.err(err);
      btn.disabled = false; btn.textContent = 'Submit Inquiry';
    }
  };
};
