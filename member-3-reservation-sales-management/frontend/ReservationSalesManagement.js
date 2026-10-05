/**
 * Member 3: Reservation & Sales Management
 * Frontend Component managing Land Reservations, Wishlists,
 * Side-by-side Property Comparison, and Reservation Status Updates.
 */

export const ReservationSalesManagement = {
  wishlistIds: new Set(),
  compareList: [],

  renderReservationModal(land) {
    return `
      <div id="reservation-modal" class="modal-overlay">
        <div class="modal-card">
          <div class="modal-header">
            <h3>Reserve Property</h3>
            <button class="close-btn" onclick="ReservationSalesManagement.closeModal()">✕</button>
          </div>
          <div class="modal-body">
            <div class="property-summary">
              <h4>${land.title}</h4>
              <p>📍 ${land.city}, ${land.district} • <strong>${land.perches} Perches</strong></p>
              <div class="price-highlight">LKR ${Number(land.price).toLocaleString()}</div>
            </div>

            <form id="reservation-form" onsubmit="ReservationSalesManagement.submitBooking(event, ${land.id})">
              <div class="form-group">
                <label>Preferred Inspection / Signing Date</label>
                <input type="date" id="reserve-date" required min="${new Date().toISOString().split('T')[0]}" />
              </div>
              <div class="form-group">
                <label>Note to Landowner</label>
                <textarea id="reserve-notes" rows="3" placeholder="I would like to schedule a site visit on this date..."></textarea>
              </div>
              <p class="terms-note">
                ℹ️ Submitting a reservation places an exclusive hold on this listing pending seller approval.
              </p>
              <button type="submit" class="btn btn-primary btn-block">Confirm Reservation Request</button>
            </form>
          </div>
        </div>
      </div>
    `;
  },

  renderBookingsTable(bookings, isSeller = false) {
    return `
      <div class="bookings-table-container">
        <div class="section-title-row">
          <h3>${isSeller ? 'Client Reservation Requests' : 'My Land Reservations'}</h3>
          <span class="count-badge">${bookings.length} Total</span>
        </div>

        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Property</th>
              <th>${isSeller ? 'Buyer' : 'Seller'}</th>
              <th>Date Requested</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${bookings.map(b => `
              <tr>
                <td>#BK-${b.id}</td>
                <td><strong>${b.landTitle || 'Land Listing #' + b.landId}</strong></td>
                <td>${isSeller ? (b.buyerName || 'Buyer') : (b.sellerName || 'Seller')}</td>
                <td>${b.preferredDate || new Date(b.createdAt).toLocaleDateString()}</td>
                <td><span class="status-pill status-${b.status.toLowerCase()}">${b.status}</span></td>
                <td>
                  ${isSeller && b.status === 'PENDING' ? `
                    <button class="btn btn-xs btn-success" onclick="ReservationSalesManagement.updateStatus(${b.id}, 'APPROVED')">Accept</button>
                    <button class="btn btn-xs btn-danger" onclick="ReservationSalesManagement.updateStatus(${b.id}, 'REJECTED')">Decline</button>
                  ` : ''}
                  ${!isSeller && b.status === 'APPROVED' ? `
                    <button class="btn btn-xs btn-primary" onclick="window.location.hash='#/pay/${b.id}'">Proceed to Pay</button>
                  ` : ''}
                  ${b.status === 'PENDING' && !isSeller ? `
                    <button class="btn btn-xs btn-outline" onclick="ReservationSalesManagement.updateStatus(${b.id}, 'CANCELLED')">Cancel</button>
                  ` : ''}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  renderComparisonMatrix(properties) {
    return `
      <div class="comparison-container">
        <h2>Property Comparison Matrix (${properties.length}/4)</h2>
        <div class="comparison-grid cols-${properties.length}">
          <div class="comparison-feature-names">
            <div class="cell header-cell">Property</div>
            <div class="cell">Location</div>
            <div class="cell">Land Type</div>
            <div class="cell">Extent (Perches)</div>
            <div class="cell">Price per Perch</div>
            <div class="cell">Total Price</div>
            <div class="cell">Action</div>
          </div>
          ${properties.map(p => `
            <div class="comparison-col">
              <div class="cell header-cell">
                <img src="${p.coverImageUrl || '/img/land1.jpg'}" alt="" class="thumb" />
                <h4>${p.title}</h4>
              </div>
              <div class="cell">${p.city}, ${p.district}</div>
              <div class="cell">${p.landType}</div>
              <div class="cell"><strong>${p.perches}</strong> perches</div>
              <div class="cell">Rs. ${Number(p.pricePerPerch).toLocaleString()}</div>
              <div class="cell price-cell">Rs. ${Number(p.price).toLocaleString()}</div>
              <div class="cell">
                <button class="btn btn-sm btn-primary" onclick="ReservationSalesManagement.reserveModal(${p.id})">Reserve</button>
                <button class="btn btn-sm btn-text" onclick="ReservationSalesManagement.removeFromCompare(${p.id})">Remove</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  closeModal() {
    document.getElementById('reservation-modal')?.remove();
  },

  async submitBooking(e, landId) {
    e.preventDefault();
    const date = document.getElementById('reserve-date').value;
    const notes = document.getElementById('reserve-notes').value;

    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + localStorage.getItem('landhub_token')
      },
      body: JSON.stringify({ landId, preferredDate: date, notes })
    });
    if (res.ok) {
      alert('Reservation submitted successfully! The landowner will review your request.');
      ReservationSalesManagement.closeModal();
      window.location.hash = '#/dashboard/bookings';
    } else {
      const err = await res.json();
      alert(err.message || 'Failed to submit reservation');
    }
  },

  async updateStatus(bookingId, status) {
    const res = await fetch(`/api/bookings/${bookingId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + localStorage.getItem('landhub_token')
      },
      body: JSON.stringify({ status })
    });
    if (res.ok) {
      window.location.reload();
    }
  }
};
