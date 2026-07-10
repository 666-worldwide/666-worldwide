/* 666 WORLDWIDE — single-page application controller */

const TOKEN_KEY = '666_worldwide_token';

const Auth = {
  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },
  setToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
  },
  clearToken() {
    localStorage.removeItem(TOKEN_KEY);
  },
  isAuthenticated() {
    return Boolean(this.getToken());
  }
};

async function apiRequest(path, { method = 'GET', body, isFormData = false } = {}) {
  const headers = {};
  const token = Auth.getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (!isFormData && body) headers['Content-Type'] = 'application/json';

  const response = await fetch(`/api${path}`, {
    method,
    headers,
    body: isFormData ? body : body ? JSON.stringify(body) : undefined
  });

  let data = null;
  try {
    data = await response.json();
  } catch (err) {
    data = null;
  }

  if (!response.ok) {
    const message = (data && data.error) || 'Something went wrong. Please try again.';
    throw new Error(message);
  }

  return data;
}

/* ============================================================
   ROUTER — swaps which .view is visible without changing the URL
   ============================================================ */

const PUBLIC_VIEWS = ['home', 'about', 'mission', 'join', 'contact', 'register', 'login'];
const PROTECTED_VIEWS = ['dashboard'];
const ALL_VIEWS = [...PUBLIC_VIEWS, ...PROTECTED_VIEWS];

function navigate(viewName) {
  if (!ALL_VIEWS.includes(viewName)) viewName = 'home';

  // Guard the dashboard behind authentication
  if (PROTECTED_VIEWS.includes(viewName) && !Auth.isAuthenticated()) {
    viewName = 'login';
  }

  // Authenticated users shouldn't see register/login again
  if ((viewName === 'login' || viewName === 'register') && Auth.isAuthenticated()) {
    viewName = 'dashboard';
  }

  document.querySelectorAll('.view').forEach((el) => el.classList.remove('active'));
  const target = document.getElementById(`view-${viewName}`);
  if (target) target.classList.add('active');

  document.querySelectorAll('[data-nav]').forEach((link) => {
    link.classList.toggle('active', link.dataset.nav === viewName);
  });

  window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });

  const links = document.querySelector('.nav-links');
  if (links) links.classList.remove('open');

  onViewShown(viewName);
}

function onViewShown(viewName) {
  if (viewName === 'home') loadAgentsInto('agent-preview');
  if (viewName === 'join') loadAgentsInto('agent-list');
  if (viewName === 'contact') loadAgentsInto('agent-contact');
  if (viewName === 'dashboard') loadDashboard();
}

function initRouterLinks() {
  document.body.addEventListener('click', (e) => {
    const link = e.target.closest('[data-nav]');
    if (!link) return;
    e.preventDefault();
    navigate(link.dataset.nav);
  });
}

function updateAuthVisibility() {
  const authed = Auth.isAuthenticated();
  document.querySelectorAll('[data-guest-only]').forEach((el) => {
    el.style.display = authed ? 'none' : '';
  });
  document.querySelectorAll('[data-member-only]').forEach((el) => {
    el.style.display = authed ? '' : 'none';
  });
}

function initNavToggle() {
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (!toggle || !links) return;
  toggle.addEventListener('click', () => links.classList.toggle('open'));
}

/* ============================================================
   AGENTS — shared loader used by home / join / contact views
   ============================================================ */

function buildAgentCard(agent) {
  const card = document.createElement('div');
  card.className = 'card agent-card';

  const isRecruiting = /recruiting/i.test(agent.status);
  const revealHTML = isRecruiting
    ? `<span class="agent-status">${agent.status}</span><span class="agent-phone">${agent.phone}</span>`
    : `<span class="agent-status agent-status-closed">${agent.status}</span>`;

  card.innerHTML = `
    <h3>${agent.name}</h3>
    <div class="agent-reveal-wrap">
      <button type="button" class="btn agent-reveal-btn">Click</button>
      <div class="agent-reveal-content" hidden>${revealHTML}</div>
    </div>
  `;

  const btn = card.querySelector('.agent-reveal-btn');
  const content = card.querySelector('.agent-reveal-content');

  btn.addEventListener('click', () => {
    btn.disabled = true;
    btn.textContent = 'Loading…';
    setTimeout(() => {
      btn.hidden = true;
      content.hidden = false;
      setTimeout(() => {
        content.hidden = true;
        btn.hidden = false;
        btn.disabled = false;
        btn.textContent = 'Click';
      }, 5000);
    }, 2000);
  });

  return card;
}

async function loadAgentsInto(elementId, limit) {
  const wrap = document.getElementById(elementId);
  if (!wrap) return;
  try {
    const { agents } = await apiRequest('/agents');
    const list = limit ? agents.slice(0, limit) : agents;
    wrap.innerHTML = '';
    list.forEach((agent) => {
      wrap.appendChild(buildAgentCard(agent));
    });
  } catch (err) {
    wrap.innerHTML = '<p style="color: var(--bone-dim);">Agent registry temporarily unavailable.</p>';
  }
}

/* ============================================================
   REGISTER
   ============================================================ */

function initRegisterForm() {
  const form = document.getElementById('register-form');
  const alertBox = document.getElementById('register-alert');
  const submitBtn = document.getElementById('register-submit');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    alertBox.classList.remove('visible');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Registering…';

    const fullName = document.getElementById('register-fullName').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;

    try {
      const data = await apiRequest('/auth/register', {
        method: 'POST',
        body: { fullName, email, password }
      });
      Auth.setToken(data.token);
      updateAuthVisibility();
      form.reset();
      navigate('dashboard');
    } catch (err) {
      alertBox.textContent = err.message;
      alertBox.classList.add('visible');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Register';
    }
  });
}

/* ============================================================
   LOGIN
   ============================================================ */

function initLoginForm() {
  const form = document.getElementById('login-form');
  const alertBox = document.getElementById('login-alert');
  const submitBtn = document.getElementById('login-submit');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    alertBox.classList.remove('visible');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Logging in…';

    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    try {
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: { email, password }
      });
      Auth.setToken(data.token);
      updateAuthVisibility();
      form.reset();
      navigate('dashboard');
    } catch (err) {
      alertBox.textContent = err.message;
      alertBox.classList.add('visible');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Login';
    }
  });
}

/* ============================================================
   LOGOUT
   ============================================================ */

function initLogout() {
  const link = document.getElementById('logout-link');
  if (!link) return;
  link.addEventListener('click', (e) => {
    e.preventDefault();
    Auth.clearToken();
    updateAuthVisibility();
    navigate('home');
  });
}

/* ============================================================
   DASHBOARD
   ============================================================ */

function renderUser(user) {
  document.getElementById('display-name').textContent = user.fullName;
  document.getElementById('display-member-number').textContent = user.memberNumber;
  document.getElementById('stat-email').textContent = user.email;
  document.getElementById('stat-member-number').textContent = user.memberNumber;
  document.getElementById('stat-created').textContent = new Date(user.createdAt).toLocaleDateString(undefined, {
    year: 'numeric', month: 'long', day: 'numeric'
  });
  document.getElementById('dash-fullName').value = user.fullName;
  document.getElementById('dash-bio').value = user.bio || '';

  const avatarWrap = document.getElementById('avatar-wrap');
  if (user.photoFilename) {
    avatarWrap.innerHTML = `<img class="avatar" src="/uploads/${user.photoFilename}" alt="Passport photo of ${user.fullName}" />`;
  } else {
    const initial = user.fullName ? user.fullName.charAt(0).toUpperCase() : '?';
    avatarWrap.innerHTML = `<div class="avatar-placeholder">${initial}</div>`;
  }
}

async function loadDashboard() {
  const errorBox = document.getElementById('dashboard-alert');
  const successBox = document.getElementById('dashboard-alert-success');
  if (errorBox) errorBox.classList.remove('visible');
  if (successBox) successBox.classList.remove('visible');

  try {
    const data = await apiRequest('/users/me');
    renderUser(data.user);
  } catch (err) {
    Auth.clearToken();
    updateAuthVisibility();
    navigate('login');
  }
}

function initDashboardForms() {
  const errorBox = document.getElementById('dashboard-alert');
  const successBox = document.getElementById('dashboard-alert-success');

  function showError(message) {
    errorBox.textContent = message;
    errorBox.classList.add('visible');
    successBox.classList.remove('visible');
  }

  function showSuccess(message) {
    successBox.textContent = message;
    successBox.classList.add('visible');
    errorBox.classList.remove('visible');
  }

  const profileForm = document.getElementById('profile-form');
  if (profileForm) {
    profileForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('profile-submit');
      btn.disabled = true;
      btn.textContent = 'Saving…';
      try {
        const fullName = document.getElementById('dash-fullName').value.trim();
        const bio = document.getElementById('dash-bio').value.trim();
        const data = await apiRequest('/users/me', { method: 'PUT', body: { fullName, bio } });
        renderUser(data.user);
        showSuccess('Profile updated.');
      } catch (err) {
        showError(err.message);
      } finally {
        btn.disabled = false;
        btn.textContent = 'Save Changes';
      }
    });
  }

  const photoForm = document.getElementById('photo-form');
  if (photoForm) {
    photoForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fileInput = document.getElementById('photo');
      if (!fileInput.files.length) return;
      const btn = document.getElementById('photo-submit');
      btn.disabled = true;
      btn.textContent = 'Uploading…';
      try {
        const formData = new FormData();
        formData.append('photo', fileInput.files[0]);
        const data = await apiRequest('/users/photo', { method: 'POST', body: formData, isFormData: true });
        renderUser(data.user);
        showSuccess('Photo uploaded.');
        fileInput.value = '';
      } catch (err) {
        showError(err.message);
      } finally {
        btn.disabled = false;
        btn.textContent = 'Upload Photo';
      }
    });
  }
}

/* ============================================================
   INIT
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('year').textContent = new Date().getFullYear();

  initRouterLinks();
  initNavToggle();
  initRegisterForm();
  initLoginForm();
  initLogout();
  initDashboardForms();
  updateAuthVisibility();

  // Land on dashboard if already signed in, otherwise home
  navigate(Auth.isAuthenticated() ? 'dashboard' : 'home');
});