/**
 * Member 1: User Authentication & Profile Management
 * Frontend Controller & UI Components for Login, Registration, Password Management & Profile
 */

export const UserAuthProfile = {
  currentUser: null,

  // Render Login & Register Modal / Card
  renderAuthModal() {
    return `
      <div id="auth-modal" class="auth-modal-overlay">
        <div class="auth-card">
          <div class="auth-header">
            <h2 id="auth-title">Welcome to LandHub</h2>
            <p id="auth-subtitle">Sign in to explore verified properties across Sri Lanka</p>
            <div class="auth-tabs">
              <button id="tab-login" class="tab-btn active" onclick="UserAuthProfile.switchTab('login')">Sign In</button>
              <button id="tab-register" class="tab-btn" onclick="UserAuthProfile.switchTab('register')">Create Account</button>
            </div>
          </div>

          <!-- Sign In Form -->
          <form id="login-form" class="auth-form" onsubmit="UserAuthProfile.handleLogin(event)">
            <div class="form-group">
              <label for="login-email">Email Address</label>
              <input type="email" id="login-email" required placeholder="you@domain.lk" />
            </div>
            <div class="form-group">
              <div class="label-row">
                <label for="login-password">Password</label>
                <a href="javascript:void(0)" class="link-small" onclick="UserAuthProfile.switchTab('forgot')">Forgot?</a>
              </div>
              <input type="password" id="login-password" required placeholder="••••••••" />
            </div>
            <button type="submit" class="btn btn-primary btn-block">Sign In to LandHub</button>
            
            <div class="demo-login-chips">
              <span class="chip-label">Quick Demo Access:</span>
              <button type="button" class="chip" onclick="UserAuthProfile.fillDemo('admin@landhub.lk')">Admin</button>
              <button type="button" class="chip" onclick="UserAuthProfile.fillDemo('sunil@landhub.lk')">Seller</button>
              <button type="button" class="chip" onclick="UserAuthProfile.fillDemo('dilani@landhub.lk')">Buyer</button>
            </div>
          </form>

          <!-- Register Form -->
          <form id="register-form" class="auth-form hidden" onsubmit="UserAuthProfile.handleRegister(event)">
            <div class="form-group">
              <label for="reg-name">Full Name</label>
              <input type="text" id="reg-name" required placeholder="Dilani Perera" />
            </div>
            <div class="form-group">
              <label for="reg-email">Email Address</label>
              <input type="email" id="reg-email" required placeholder="dilani@landhub.lk" />
            </div>
            <div class="form-group">
              <label for="reg-phone">Sri Lankan Mobile Number</label>
              <input type="tel" id="reg-phone" required placeholder="077 123 4567" pattern="07[0-9]{8}" />
            </div>
            <div class="form-group">
              <label for="reg-role">Account Type</label>
              <select id="reg-role" required>
                <option value="BUYER">Buyer (Explore & Reserve Land)</option>
                <option value="SELLER">Seller / Land Owner (Post Listings)</option>
                <option value="AGENT">Real Estate Agent</option>
              </select>
            </div>
            <div class="form-group">
              <label for="reg-password">Password (min 8 chars, letter & number)</label>
              <input type="password" id="reg-password" required minlength="8" placeholder="••••••••" />
            </div>
            <button type="submit" class="btn btn-primary btn-block">Create My Account</button>
          </form>
        </div>
      </div>
    `;
  },

  // Render User Profile & Security Settings
  renderProfileView(user) {
    return `
      <div class="profile-container">
        <div class="profile-header-card">
          <div class="avatar-large">${(user.fullName || 'U').charAt(0).toUpperCase()}</div>
          <div class="profile-info">
            <h2>${user.fullName}</h2>
            <div class="profile-badges">
              <span class="badge badge-role">${user.role}</span>
              <span class="badge badge-status ${user.status === 'ACTIVE' ? 'active' : ''}">${user.status}</span>
              <span class="badge badge-lang">${user.preferredLanguage || 'English'}</span>
            </div>
            <p class="profile-meta">Registered: ${new Date(user.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        <div class="profile-grid">
          <!-- Profile Information Form -->
          <div class="card profile-edit-card">
            <h3>Personal Information</h3>
            <form id="profile-edit-form" onsubmit="UserAuthProfile.handleProfileUpdate(event)">
              <div class="form-group">
                <label>Full Name</label>
                <input type="text" id="prof-name" value="${user.fullName}" required />
              </div>
              <div class="form-group">
                <label>Email Address</label>
                <input type="email" id="prof-email" value="${user.email}" disabled class="input-disabled" />
              </div>
              <div class="form-group">
                <label>Phone Number</label>
                <input type="tel" id="prof-phone" value="${user.phone || ''}" required />
              </div>
              <div class="form-group">
                <label>Preferred Language</label>
                <select id="prof-lang">
                  <option value="EN" ${user.preferredLanguage === 'EN' ? 'selected' : ''}>English</option>
                  <option value="SI" ${user.preferredLanguage === 'SI' ? 'selected' : ''}>සිංහල (Sinhala)</option>
                  <option value="TA" ${user.preferredLanguage === 'TA' ? 'selected' : ''}>தமிழ் (Tamil)</option>
                </select>
              </div>
              <button type="submit" class="btn btn-primary">Save Changes</button>
            </form>
          </div>

          <!-- Password & Security Card -->
          <div class="card security-card">
            <h3>Password & Security</h3>
            <form id="password-change-form" onsubmit="UserAuthProfile.handlePasswordChange(event)">
              <div class="form-group">
                <label>Current Password</label>
                <input type="password" id="current-pass" required placeholder="••••••••" />
              </div>
              <div class="form-group">
                <label>New Password</label>
                <input type="password" id="new-pass" required minlength="8" placeholder="••••••••" />
              </div>
              <div class="form-group">
                <label>Confirm New Password</label>
                <input type="password" id="confirm-pass" required minlength="8" placeholder="••••••••" />
              </div>
              <button type="submit" class="btn btn-secondary">Update Password</button>
            </form>
          </div>
        </div>
      </div>
    `;
  },

  switchTab(tab) {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const tabLogin = document.getElementById('tab-login');
    const tabReg = document.getElementById('tab-register');
    const title = document.getElementById('auth-title');

    if (tab === 'login') {
      loginForm?.classList.remove('hidden');
      registerForm?.classList.add('hidden');
      tabLogin?.classList.add('active');
      tabReg?.classList.remove('active');
      if (title) title.innerText = 'Welcome Back to LandHub';
    } else {
      loginForm?.classList.add('hidden');
      registerForm?.classList.remove('hidden');
      tabLogin?.classList.remove('active');
      tabReg?.classList.add('active');
      if (title) title.innerText = 'Create an Account';
    }
  },

  fillDemo(email) {
    const emailInput = document.getElementById('login-email');
    const passInput = document.getElementById('login-password');
    if (emailInput && passInput) {
      emailInput.value = email;
      passInput.value = 'Landhub@2026';
    }
  },

  async handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (data.token) {
      localStorage.setItem('landhub_token', data.token);
      window.location.reload();
    } else {
      alert(data.message || 'Login failed');
    }
  },

  async handleRegister(e) {
    e.preventDefault();
    const payload = {
      fullName: document.getElementById('reg-name').value,
      email: document.getElementById('reg-email').value,
      phone: document.getElementById('reg-phone').value,
      role: document.getElementById('reg-role').value,
      password: document.getElementById('reg-password').value
    };

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (res.ok) {
      alert('Registration successful! Please sign in.');
      UserAuthProfile.switchTab('login');
    } else {
      alert(data.message || 'Registration failed');
    }
  }
};
