/**
 * Member 4: Customer Management & Inquiry Handling
 * Frontend Component handling Customer CRM Tables, Inquiry Threads,
 * Direct Messaging inbox, and the Floating AI Chatbot assistant.
 */

export const CustomerInquiryManagement = {
  activeInquiry: null,

  renderCustomerTable(customers) {
    return `
      <div class="customer-crm-container">
        <div class="table-header-bar">
          <h3>Customer Relationship Management (CRM)</h3>
          <input type="text" id="crm-search" placeholder="Search customers by name, phone or email..." onkeyup="CustomerInquiryManagement.filterCustomers()" />
        </div>

        <table class="crm-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Customer Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Type</th>
              <th>Total Inquiries</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${customers.map(c => `
              <tr>
                <td>#CUST-${c.id}</td>
                <td><strong>${c.fullName}</strong></td>
                <td>${c.email}</td>
                <td>${c.phone || 'N/A'}</td>
                <td><span class="badge badge-role">${c.role}</span></td>
                <td>${c.inquiryCount || 0}</td>
                <td><span class="badge badge-status ${c.status === 'ACTIVE' ? 'active' : ''}">${c.status}</span></td>
                <td>
                  <button class="btn btn-xs btn-outline" onclick="CustomerInquiryManagement.viewCustomerDetails(${c.id})">Profile</button>
                  <button class="btn btn-xs btn-primary" onclick="CustomerInquiryManagement.openMessageThread(${c.id})">Message</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  renderInquiryThread(inquiry, responses = []) {
    return `
      <div class="inquiry-thread-card">
        <div class="inquiry-header">
          <span class="inquiry-badge ${inquiry.status.toLowerCase()}">${inquiry.status}</span>
          <h3>${inquiry.subject}</h3>
          <p class="inquiry-meta">From: ${inquiry.customerName} (${inquiry.customerEmail}) • ${new Date(inquiry.createdAt).toLocaleString()}</p>
        </div>

        <div class="inquiry-content-box">
          <p>${inquiry.message}</p>
        </div>

        <div class="thread-replies">
          <h4>Clarifications & Responses</h4>
          ${responses.length === 0 ? '<p class="empty-state">No responses yet. Respond below.</p>' : ''}
          ${responses.map(r => `
            <div class="reply-bubble ${r.isStaff ? 'staff' : 'customer'}">
              <div class="reply-meta">
                <strong>${r.responderName}</strong> <span>${new Date(r.createdAt).toLocaleTimeString()}</span>
              </div>
              <div class="reply-text">${r.message}</div>
            </div>
          `).join('')}
        </div>

        <form id="inquiry-reply-form" class="reply-form" onsubmit="CustomerInquiryManagement.sendReply(event, ${inquiry.id})">
          <textarea id="reply-text" rows="3" required placeholder="Type your response or request clarification..."></textarea>
          <div class="reply-actions">
            <button type="submit" class="btn btn-primary">Send Response</button>
          </div>
        </form>
      </div>
    `;
  },

  renderFloatingChatbot() {
    return `
      <div id="ai-chatbot-widget" class="chatbot-widget">
        <button id="chatbot-toggle-btn" class="chatbot-trigger" onclick="CustomerInquiryManagement.toggleChatbot()">
          💬 <span>LandHub AI Assistant</span>
        </button>

        <div id="chatbot-box" class="chatbot-box hidden">
          <div class="chatbot-header">
            <h4>🤖 AI Property Assistant</h4>
            <button class="close-btn" onclick="CustomerInquiryManagement.toggleChatbot()">✕</button>
          </div>
          <div id="chat-messages" class="chat-messages">
            <div class="bot-msg">
              Ayubowan! 🙏 I can help you find land in Sri Lanka, calculate perch prices, or explain legal verification. What are you looking for?
            </div>
          </div>
          <form class="chat-input-bar" onsubmit="CustomerInquiryManagement.sendChatbotQuery(event)">
            <input type="text" id="chat-input" placeholder="e.g. Land in Kandy under 10 million..." required />
            <button type="submit" class="btn-send">➤</button>
          </form>
        </div>
      </div>
    `;
  },

  toggleChatbot() {
    const box = document.getElementById('chatbot-box');
    box?.classList.toggle('hidden');
  },

  async sendChatbotQuery(e) {
    e.preventDefault();
    const input = document.getElementById('chat-input');
    const msg = input.value.trim();
    if (!msg) return;

    const msgsBox = document.getElementById('chat-messages');
    msgsBox.innerHTML += `<div class="user-msg">${msg}</div>`;
    input.value = '';

    const res = await fetch('/api/chatbot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: msg })
    });
    const data = await res.json();
    msgsBox.innerHTML += `<div class="bot-msg">${data.answer || 'Thank you for your question. A real estate representative will assist you.'}</div>`;
    msgsBox.scrollTop = msgsBox.scrollHeight;
  }
};
