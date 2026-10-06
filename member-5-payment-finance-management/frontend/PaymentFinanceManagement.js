/**
 * Member 5: Payment & Finance Management
 * Frontend Component handling Sandbox Payment Checkout, Invoice Generation,
 * PDF Download, and Financial Transaction History.
 */

export const PaymentFinanceManagement = {
  renderCheckoutModal(booking, land) {
    return `
      <div id="payment-modal" class="payment-modal-overlay">
        <div class="payment-modal-card">
          <div class="payment-header">
            <h3>Sandbox Payment Checkout</h3>
            <p>Demo Simulation — No real money or card data is charged.</p>
          </div>

          <div class="invoice-summary-box">
            <div class="summary-line">
              <span>Property:</span>
              <strong>${land.title}</strong>
            </div>
            <div class="summary-line">
              <span>Booking Reference:</span>
              <code>#BK-${booking.id}</code>
            </div>
            <div class="summary-line total-line">
              <span>Amount Due (LKR):</span>
              <strong class="total-amount">Rs. ${Number(booking.amount || land.price).toLocaleString()}</strong>
            </div>
          </div>

          <form id="payment-form" onsubmit="PaymentFinanceManagement.handlePayment(event, ${booking.id})">
            <div class="form-group">
              <label>Select Payment Method</label>
              <div class="payment-method-radios">
                <label class="radio-label">
                  <input type="radio" name="payMethod" value="BANK_TRANSFER" checked /> Bank Wire Transfer
                </label>
                <label class="radio-label">
                  <input type="radio" name="payMethod" value="CREDIT_CARD" /> Credit / Debit Card
                </label>
                <label class="radio-label">
                  <input type="radio" name="payMethod" value="ONLINE_GATEWAY" /> Online Gateway
                </label>
              </div>
            </div>

            <div id="card-fields" class="card-details-box">
              <div class="form-group">
                <label>Cardholder Name</label>
                <input type="text" placeholder="Dilani Perera" value="Dilani Perera" />
              </div>
              <div class="form-group">
                <label>Card Number (Sandbox)</label>
                <input type="text" placeholder="4242 •••• •••• 4242" value="4242 4242 4242 4242" />
              </div>
              <div class="form-row-2">
                <div class="form-group">
                  <label>Expiry</label>
                  <input type="text" placeholder="MM/YY" value="12/28" />
                </div>
                <div class="form-group">
                  <label>CVV</label>
                  <input type="password" placeholder="•••" value="123" />
                </div>
              </div>
            </div>

            <button type="submit" class="btn btn-primary btn-block">Authorize & Complete Payment</button>
            <button type="button" class="btn btn-text btn-block" onclick="PaymentFinanceManagement.closeModal()">Cancel</button>
          </form>
        </div>
      </div>
    `;
  },

  renderPaymentHistory(payments) {
    return `
      <div class="payments-container">
        <div class="section-title-row">
          <h3>Financial Transactions & Invoices</h3>
          <span class="count-badge">${payments.length} Transactions</span>
        </div>

        <table class="payments-table">
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Date</th>
              <th>Booking ID</th>
              <th>Method</th>
              <th>Amount (LKR)</th>
              <th>Status</th>
              <th>Receipt</th>
            </tr>
          </thead>
          <tbody>
            ${payments.map(p => `
              <tr>
                <td><strong>${p.invoiceNumber || 'INV-' + p.id}</strong></td>
                <td>${new Date(p.createdAt).toLocaleDateString()}</td>
                <td>#BK-${p.bookingId}</td>
                <td><span class="method-tag">${p.paymentMethod}</span></td>
                <td class="amount-cell">Rs. ${Number(p.amount).toLocaleString()}</td>
                <td><span class="status-pill status-${p.status.toLowerCase()}">${p.status}</span></td>
                <td>
                  <a href="/api/payments/${p.id}/invoice" target="_blank" class="btn btn-xs btn-outline">
                    📄 Download PDF
                  </a>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  closeModal() {
    document.getElementById('payment-modal')?.remove();
  },

  async handlePayment(e, bookingId) {
    e.preventDefault();
    const method = document.querySelector('input[name="payMethod"]:checked').value;

    const res = await fetch('/api/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + localStorage.getItem('landhub_token')
      },
      body: JSON.stringify({ bookingId, paymentMethod: method })
    });
    const data = await res.json();
    if (res.ok) {
      alert(`Payment Approved! Invoice #${data.invoiceNumber || data.id} generated.`);
      PaymentFinanceManagement.closeModal();
      window.location.hash = '#/dashboard/payments';
    } else {
      alert(data.message || 'Payment processing failed');
    }
  }
};
