/* Support Dashboard & Support-specific pages */
'use strict';

const SUPPORT_NAV = [
  { head: 'Support Desk' },
  { href: '/support', icon: '📊', label: 'Overview' },
  { href: '/inquiries', icon: '📩', label: 'Inquiries & Messages' },
  { head: 'Communication' },
  { href: '/notifications', icon: '🔔', label: 'Notifications' }
];

/* =================== SUPPORT DASHBOARD =================== */
Pages.support = async function (host) {
  if (!Auth.require(['SUPPORT'])) return;
  host.innerHTML = dashShell('Support Desk', 'Manage and respond to customer inquiries and messages.',
    SUPPORT_NAV, 'sup',
    '<button class="btn btn-primary" onclick="Router.go(\'/inquiries\')">📨 Open Inbox</button>');
  var el = document.getElementById('sup');

  async function loadSupport() {
    el.innerHTML = UI.skeletonCards(3);
    try {
      var stats = await API.get('/api/inquiries/stats');
      var msgs;
      try { msgs = await API.get('/api/messages'); } catch(_) { msgs = { unread: 0 }; }
      var inquiries = await API.get('/api/inquiries');

      // KPI cards with icons
      el.innerHTML =
        `<div style="display:flex;gap:18px;flex-wrap:wrap;margin-bottom:28px">
          <div style="flex:1;min-width:200px;padding:24px 28px;border-radius:12px;border:1px solid var(--gray-100);background:#fff;display:flex;align-items:center;gap:18px">
            <div style="width:48px;height:48px;border-radius:50%;background:var(--gray-50);display:flex;align-items:center;justify-content:center;font-size:22px">❓</div>
            <div><div style="font-size:30px;font-weight:700;color:var(--navy)">${stats.total}</div>
            <div style="font-size:13px;color:var(--gray-600)">Contact Inquiries</div></div>
          </div>
          <div style="flex:1;min-width:200px;padding:24px 28px;border-radius:12px;border:1px solid var(--gray-100);background:#fff;display:flex;align-items:center;gap:18px">
            <div style="width:48px;height:48px;border-radius:50%;background:var(--gray-50);display:flex;align-items:center;justify-content:center;font-size:22px">🕐</div>
            <div><div style="font-size:30px;font-weight:700;color:var(--navy)">${stats.pending_clarification + stats.open}</div>
            <div style="font-size:13px;color:var(--gray-600)">Pending Inquiries</div></div>
          </div>
          <div style="flex:1;min-width:200px;padding:24px 28px;border-radius:12px;border:1px solid var(--gray-100);background:#fff;display:flex;align-items:center;gap:18px">
            <div style="width:48px;height:48px;border-radius:50%;background:var(--gray-50);display:flex;align-items:center;justify-content:center;font-size:22px">✉️</div>
            <div><div style="font-size:30px;font-weight:700;color:var(--navy)">${msgs.unread || 0}</div>
            <div style="font-size:13px;color:var(--gray-600)">Unread Messages</div></div>
          </div>
        </div>

        <div class="panel">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
            <div style="display:flex;align-items:center;gap:10px">
              <span style="font-size:16px">📬</span>
              <b style="font-size:15px;color:var(--navy)">Customer Contact Inquiries</b>
            </div>
            <span class="pill p-gray">${inquiries.items.length} total</span>
          </div>
          ${inquiries.items.length ? `<div class="table-wrap"><table><thead><tr>
            <th>Customer</th><th>Subject & Message</th><th>Category</th><th>Status</th><th>Submitted</th><th>Action</th>
          </tr></thead><tbody>
          ${inquiries.items.map(function(inq) {
            var msgPreview = esc((inq.message || '').substring(0, 80));
            return `<tr>
              <td style="min-width:140px"><div>
                <b style="color:var(--navy)">${esc(inq.customer_name || 'Customer')}</b><br>
                <span style="font-size:12px;color:var(--emerald)">${esc(inq.customer_email || '')}</span><br>
                <span style="font-size:11.5px;color:var(--gray-600)">${esc(inq.customer_phone || '')}</span>
              </div></td>
              <td style="max-width:300px"><div>
                <b>${esc(inq.subject)}</b><br>
                <span style="font-size:12.5px;color:var(--gray-600)">${msgPreview}${(inq.message || '').length > 80 ? '…' : ''}</span>
                ${inq.last_response ? '<br><span style="font-size:12px;color:var(--emerald);background:rgba(5,150,105,.08);padding:2px 8px;border-radius:6px;display:inline-block;margin-top:4px"><b>Reply:</b> ' + esc(inq.last_response.substring(0, 60)) + '</span>' : ''}
              </div></td>
              <td>${UI.pill(inq.category)}</td>
              <td>${UI.pill(inq.status)}</td>
              <td style="font-size:12px;white-space:nowrap">${fmt.date(inq.created_at)}</td>
              <td><button class="btn btn-ghost btn-sm" data-inq-update="${inq.id}" style="white-space:nowrap">✏️ Update</button></td>
            </tr>`;
          }).join('')}
          </tbody></table></div>` : UI.empty('📩', 'No inquiries yet', 'Customer inquiries will appear here.')}
        </div>`;

      // Wire up Update buttons to open the slide panel
      document.querySelectorAll('[data-inq-update]').forEach(function(btn) {
        btn.onclick = function() { openInquiryPanel(btn.dataset.inqUpdate, loadSupport); };
      });
    } catch (e) { UI.err(e); }
  }

  loadSupport();
};

/* =================== INQUIRY SLIDE PANEL =================== */
function openInquiryPanel(inquiryId, onDone) {
  // Slide-in overlay panel
  var overlay = document.createElement('div');
  overlay.id = 'inqPanel';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;justify-content:flex-end;background:rgba(15,23,42,.35);backdrop-filter:blur(3px);animation:fadeIn .2s ease';

  var panel = document.createElement('div');
  panel.style.cssText = 'width:min(620px,100vw);height:100vh;background:#fff;display:flex;flex-direction:column;box-shadow:-8px 0 40px rgba(0,0,0,.18);animation:slideInRight .25s cubic-bezier(.4,0,.2,1)';

  panel.innerHTML = `<div style="padding:20px 24px;border-bottom:1px solid var(--gray-100);display:flex;justify-content:space-between;align-items:center;flex-shrink:0">
      <div><h2 style="margin:0;font-size:18px;color:var(--navy)">📩 Inquiry #${inquiryId}</h2>
      <p style="margin:2px 0 0;font-size:13px;color:var(--gray-600)">Customer support conversation</p></div>
      <button id="inqPanelClose" style="background:none;border:none;font-size:22px;cursor:pointer;color:var(--gray-600);padding:4px 8px">✕</button>
    </div>
    <div id="inqPanelBody" style="flex:1;overflow-y:auto;padding:20px 24px">${UI.skeletonCards(2)}</div>
    <div id="inqPanelFooter" style="border-top:1px solid var(--gray-100);padding:16px 24px;flex-shrink:0;background:#fafafa"></div>`;

  overlay.appendChild(panel);
  document.body.appendChild(overlay);

  // Inject keyframe styles if not present
  if (!document.getElementById('inqPanelStyle')) {
    var s = document.createElement('style');
    s.id = 'inqPanelStyle';
    s.textContent = '@keyframes slideInRight{from{transform:translateX(100%)}to{transform:translateX(0)}}@keyframes fadeIn{from{opacity:0}to{opacity:1}}';
    document.head.appendChild(s);
  }

  function closePanel() {
    overlay.remove();
  }

  document.getElementById('inqPanelClose').onclick = closePanel;
  overlay.onclick = function(e) { if (e.target === overlay) closePanel(); };

  // Load inquiry data
  (async function() {
    try {
      var r = await API.get('/api/inquiries/' + inquiryId);
      var inq = r.inquiry;
      var responses = r.responses;

      // Status badge colors
      var statusColor = { OPEN: '#16a34a', PENDING_CLARIFICATION: '#d97706', RESOLVED: '#2563eb' };
      var sColor = statusColor[inq.status] || '#64748b';

      // Build conversation thread
      var threadHtml = `<div style="margin-bottom:16px;padding:14px 16px;border-radius:10px;background:var(--gray-50);border-left:4px solid var(--navy)">
          <div style="display:flex;justify-content:space-between;margin-bottom:6px">
            <span style="font-weight:600;color:var(--navy);font-size:13.5px">👤 ${esc(inq.customer_name)} <span style="font-weight:400;color:var(--gray-500)">(Customer)</span></span>
            <span style="font-size:11.5px;color:var(--gray-400)">${fmt.dateTime(inq.created_at)}</span>
          </div>
          <div style="font-size:13.5px;color:var(--gray-700);white-space:pre-wrap;line-height:1.6">${esc(inq.message)}</div>
        </div>`;

      responses.forEach(function(resp) {
        var isStaff = resp.sender_role === 'ADMIN' || resp.sender_role === 'SUPPORT';
        var isClarReq = resp.message_type === 'CLARIFICATION_REQUEST';
        var bColor = isClarReq ? '#f59e0b' : (isStaff ? 'var(--emerald)' : 'var(--navy)');
        var bg = isClarReq ? '#fffbeb' : (isStaff ? '#f0fdf4' : 'var(--gray-50)');
        var label = isClarReq ? '⚠️ Clarification Requested' : (isStaff ? '✅ Staff Reply' : '↩️ Customer Reply');
        threadHtml += `<div style="padding:14px 16px;border-radius:10px;background:${bg};border-left:4px solid ${bColor};margin-bottom:12px">
          <div style="display:flex;justify-content:space-between;margin-bottom:6px">
            <span style="font-weight:600;font-size:13.5px;color:${bColor}">${esc(resp.sender_name)} <span style="font-weight:400;font-size:12px;background:${bColor}22;padding:1px 7px;border-radius:20px;color:${bColor}">${label}</span></span>
            <span style="font-size:11.5px;color:var(--gray-400)">${fmt.dateTime(resp.created_at)}</span>
          </div>
          <div style="font-size:13.5px;color:var(--gray-700);white-space:pre-wrap;line-height:1.6">${esc(resp.message)}</div>
        </div>`;
      });

      document.getElementById('inqPanelBody').innerHTML = `
        <div style="display:flex;gap:10px;align-items:center;margin-bottom:16px;flex-wrap:wrap">
          <span style="font-size:14px;font-weight:700;color:var(--navy)">${esc(inq.subject)}</span>
          <span style="padding:3px 12px;border-radius:20px;font-size:12px;font-weight:700;background:${sColor}1a;color:${sColor}">${inq.status.replace(/_/g, ' ')}</span>
          ${UI.pill(inq.category)}
        </div>
        <div style="display:flex;gap:12px;align-items:center;padding:12px 16px;background:var(--gray-50);border-radius:10px;margin-bottom:18px">
          <div class="avatar" style="width:40px;height:40px;font-size:15px;flex-shrink:0">${fmt.initials(inq.customer_name)}</div>
          <div style="font-size:13px">
            <div style="font-weight:700;color:var(--navy)">${esc(inq.customer_name)}</div>
            <div style="color:var(--emerald)">${esc(inq.customer_email || '')}</div>
            ${inq.customer_phone ? '<div style="color:var(--gray-600)">📞 ' + esc(inq.customer_phone) + '</div>' : ''}
          </div>
        </div>
        <div style="font-size:13px;font-weight:600;color:var(--gray-500);margin-bottom:10px;text-transform:uppercase;letter-spacing:.06em">💬 Conversation Thread</div>
        <div>${threadHtml}</div>`;

      // Footer action area
      var footerEl = document.getElementById('inqPanelFooter');
      if (inq.status !== 'RESOLVED') {
        footerEl.innerHTML = `
          <div style="margin-bottom:12px">
            <div style="display:flex;gap:8px;margin-bottom:10px">
              <button id="tabRespond" class="btn btn-primary btn-sm" style="flex:1">✅ Respond & Resolve</button>
              <button id="tabClarify" class="btn btn-ghost btn-sm" style="flex:1">⚠️ Request Clarification</button>
            </div>
            <div id="respondPanel">
              <textarea id="respondMsg" class="ctrl" placeholder="Type your resolution message to the customer…" style="min-height:90px;margin-bottom:8px;resize:vertical;font-size:13.5px"></textarea>
              <button id="btnSendRespond" class="btn btn-primary" style="width:100%">📨 Send Response & Resolve Inquiry</button>
            </div>
            <div id="clarifyPanel" style="display:none">
              <textarea id="clarifyMsg" class="ctrl" placeholder="What additional information do you need from the customer?" style="min-height:90px;margin-bottom:8px;resize:vertical;font-size:13.5px"></textarea>
              <button id="btnSendClarify" class="btn btn-gold" style="width:100%;background:#f59e0b;border-color:#f59e0b;color:#fff">⚠️ Request Clarification from Customer</button>
            </div>
          </div>`;

        // Tab switching
        document.getElementById('tabRespond').onclick = function() {
          document.getElementById('respondPanel').style.display = '';
          document.getElementById('clarifyPanel').style.display = 'none';
          this.classList.add('btn-primary'); this.classList.remove('btn-ghost');
          var t2 = document.getElementById('tabClarify');
          t2.classList.remove('btn-primary'); t2.classList.add('btn-ghost');
        };
        document.getElementById('tabClarify').onclick = function() {
          document.getElementById('clarifyPanel').style.display = '';
          document.getElementById('respondPanel').style.display = 'none';
          this.style.background = '#f59e0b'; this.style.borderColor = '#f59e0b'; this.style.color = '#fff';
          var t1 = document.getElementById('tabRespond');
          t1.classList.remove('btn-primary'); t1.classList.add('btn-ghost'); t1.style = '';
        };

        // Send Response
        document.getElementById('btnSendRespond').onclick = async function() {
          var msg = document.getElementById('respondMsg').value.trim();
          if (!msg) { UI.toast('Please enter a response message', '', 'warn'); return; }
          this.disabled = true; this.textContent = 'Sending…';
          try {
            await API.post('/api/inquiries/' + inquiryId + '/respond', { message: msg });
            UI.toast('✅ Response sent & inquiry resolved', 'Customer has been notified.');
            closePanel();
            if (onDone) onDone();
          } catch (e) { UI.err(e); this.disabled = false; this.textContent = '📨 Send Response & Resolve Inquiry'; }
        };

        // Send Clarification Request
        document.getElementById('btnSendClarify').onclick = async function() {
          var msg = document.getElementById('clarifyMsg').value.trim();
          if (!msg) { UI.toast('Please enter clarification details', '', 'warn'); return; }
          this.disabled = true; this.textContent = 'Sending…';
          try {
            await API.post('/api/inquiries/' + inquiryId + '/clarify', { message: msg });
            UI.toast('⚠️ Clarification requested', 'Customer has been asked for more info.');
            closePanel();
            if (onDone) onDone();
          } catch (e) { UI.err(e); this.disabled = false; this.textContent = '⚠️ Request Clarification from Customer'; }
        };
      } else {
        footerEl.innerHTML = `<div style="text-align:center;padding:10px;color:var(--emerald);font-weight:600;font-size:14px">
          ✅ This inquiry has been resolved. No further action needed.</div>`;
      }

    } catch (e) {
      document.getElementById('inqPanelBody').innerHTML = UI.empty('⚠️', 'Failed to load inquiry', e.message);
    }
  })();
}
