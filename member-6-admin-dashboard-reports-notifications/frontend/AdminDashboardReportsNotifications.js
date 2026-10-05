/**
 * Member 6: Admin Dashboard, Reports & Notifications
 * Frontend Component handling Admin KPI Cards, SVG Analytics Charts,
 * Legal Document Verification Queue, Seller Review Moderation, and Notifications Center.
 */

export const AdminDashboardReportsNotifications = {
  renderAdminOverview(stats) {
    return `
      <div class="admin-dashboard-wrap">
        <div class="admin-topbar">
          <h2>Administrative Control Center</h2>
          <div class="admin-topbar-actions">
            <button class="btn btn-outline" onclick="AdminDashboardReportsNotifications.exportReport('pdf')">Export PDF Report</button>
            <button class="btn btn-primary" onclick="AdminDashboardReportsNotifications.exportReport('csv')">Export CSV</button>
          </div>
        </div>

        <!-- KPI Summary Cards -->
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-icon">📋</div>
            <div class="kpi-info">
              <span class="kpi-title">Active Listings</span>
              <strong class="kpi-value">${stats.activeListings || 142}</strong>
              <small class="kpi-trend positive">↑ 12% this month</small>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon">💰</div>
            <div class="kpi-info">
              <span class="kpi-title">Platform Sales Volume</span>
              <strong class="kpi-value">Rs. ${(stats.volumeLkr || 248500000).toLocaleString()}</strong>
              <small class="kpi-trend positive">↑ 8.4% vs last month</small>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon">⚖️</div>
            <div class="kpi-info">
              <span class="kpi-title">Pending Document Reviews</span>
              <strong class="kpi-value">${stats.pendingDocs || 18}</strong>
              <small class="kpi-trend warning">Requires lawyer/staff audit</small>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon">👥</div>
            <div class="kpi-info">
              <span class="kpi-title">Registered Users</span>
              <strong class="kpi-value">${stats.userCount || 1084}</strong>
              <small class="kpi-trend">Buyers & Sellers</small>
            </div>
          </div>
        </div>

        <!-- SVG Analytics Charts Section -->
        <div class="charts-row">
          <div class="chart-card">
            <h3>Monthly Property Listings</h3>
            <div class="chart-svg-wrap" id="chart-monthly-listings">
              <svg viewBox="0 0 500 200" class="svg-bar-chart">
                <rect x="30" y="80" width="35" height="100" fill="#0E8F63" rx="4"></rect>
                <rect x="90" y="50" width="35" height="130" fill="#0E8F63" rx="4"></rect>
                <rect x="150" y="40" width="35" height="140" fill="#0E8F63" rx="4"></rect>
                <rect x="210" y="20" width="35" height="160" fill="#0E8F63" rx="4"></rect>
                <rect x="270" y="60" width="35" height="120" fill="#0E8F63" rx="4"></rect>
                <rect x="330" y="30" width="35" height="150" fill="#0E8F63" rx="4"></rect>
                <rect x="390" y="10" width="35" height="170" fill="#0E8F63" rx="4"></rect>
              </svg>
            </div>
          </div>

          <div class="chart-card">
            <h3>Districts by Demand (Western & Southern)</h3>
            <div class="chart-svg-wrap" id="chart-district-split">
              <svg viewBox="0 0 500 200" class="svg-hbar-chart">
                <rect x="100" y="20" width="320" height="22" fill="#0B2545" rx="4"></rect>
                <text x="10" y="36" font-size="12" fill="#334155">Colombo</text>
                <rect x="100" y="60" width="260" height="22" fill="#132F55" rx="4"></rect>
                <text x="10" y="76" font-size="12" fill="#334155">Gampaha</text>
                <rect x="100" y="100" width="190" height="22" fill="#1B3A69" rx="4"></rect>
                <text x="10" y="116" font-size="12" fill="#334155">Kalutara</text>
                <rect x="100" y="140" width="220" height="22" fill="#0E8F63" rx="4"></rect>
                <text x="10" y="156" font-size="12" fill="#334155">Galle</text>
              </svg>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  renderDocumentVerificationQueue(documents) {
    return `
      <div class="doc-queue-container">
        <h3>⚖️ Document Verification Queue</h3>
        <p>A listing receives the <strong>✓ Verified Property</strong> badge only when both a Deed/Title Certificate AND a Survey Plan are approved.</p>

        <table class="doc-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Property</th>
              <th>Document Type</th>
              <th>Uploaded By</th>
              <th>Document File</th>
              <th>Current Status</th>
              <th>Verification Decision</th>
            </tr>
          </thead>
          <tbody>
            ${documents.map(d => `
              <tr>
                <td>#DOC-${d.id}</td>
                <td><strong>${d.landTitle || 'Land #' + d.landId}</strong></td>
                <td><span class="doc-type-badge">${d.docType}</span></td>
                <td>${d.uploadedByName || 'Seller'}</td>
                <td><a href="${d.fileUrl}" target="_blank" class="link-download">📄 View PDF</a></td>
                <td><span class="status-pill status-${d.status.toLowerCase()}">${d.status}</span></td>
                <td>
                  ${d.status === 'PENDING' ? `
                    <button class="btn btn-xs btn-success" onclick="AdminDashboardReportsNotifications.verifyDoc(${d.id}, 'VERIFIED')">Approve</button>
                    <button class="btn btn-xs btn-danger" onclick="AdminDashboardReportsNotifications.verifyDoc(${d.id}, 'REJECTED')">Reject</button>
                  ` : 'Processed'}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  renderNotificationBell(notifications) {
    const unread = notifications.filter(n => !n.isRead).length;
    return `
      <div class="notification-dropdown-wrapper">
        <button class="bell-btn" onclick="AdminDashboardReportsNotifications.toggleNotifMenu()">
          🔔 ${unread > 0 ? `<span class="badge-count">${unread}</span>` : ''}
        </button>
        <div id="notif-menu" class="notif-menu hidden">
          <div class="notif-header">
            <h4>Notifications (${unread} new)</h4>
            <button class="btn btn-xs btn-text" onclick="AdminDashboardReportsNotifications.markAllRead()">Mark all as read</button>
          </div>
          <div class="notif-list">
            ${notifications.map(n => `
              <div class="notif-item ${n.isRead ? 'read' : 'unread'}">
                <div class="notif-title">${n.title}</div>
                <div class="notif-body">${n.message}</div>
                <div class="notif-time">${new Date(n.createdAt).toLocaleTimeString()}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  },

  async verifyDoc(docId, decision) {
    const remarks = prompt(`Enter optional remarks for ${decision}:`) || '';
    const res = await fetch(`/api/documents/${docId}/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + localStorage.getItem('landhub_token')
      },
      body: JSON.stringify({ status: decision, remarks })
    });
    if (res.ok) {
      alert(`Document marked as ${decision}`);
      window.location.reload();
    }
  },

  exportReport(format) {
    window.open(`/api/admin/reports/export?format=${format}`, '_blank');
  }
};
