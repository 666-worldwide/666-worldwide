/* 666 WORLDWIDE — shared client utilities */

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

function initNavToggle() {
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (!toggle || !links) return;
  toggle.addEventListener('click', () => links.classList.toggle('open'));
}

function markActiveNavLink() {
  const current = window.location.pathname.replace(/\/$/, '') || '/index.html';
  document.querySelectorAll('.nav-links a').forEach((link) => {
    const href = link.getAttribute('href');
    if (href === current || (current === '/index.html' && href === '/')) {
      link.classList.add('active');
    }
  });
}

function updateAuthNav() {
  const authSlot = document.querySelector('[data-auth-slot]');
  if (!authSlot) return;
  if (Auth.isAuthenticated()) {
    authSlot.innerHTML = '<a href="/dashboard.html">Dashboard</a>';
  }
}

/* Terminal-style boot loader overlay used on entry pages */
function runBootSequence(lines, onComplete) {
  const overlay = document.getElementById('boot-overlay');
  if (!overlay) {
    if (onComplete) onComplete();
    return;
  }

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    overlay.classList.add('hidden');
    if (onComplete) onComplete();
    return;
  }

  let i = 0;
  function typeLine() {
    if (i >= lines.length) {
      setTimeout(() => {
        overlay.classList.add('hidden');
        if (onComplete) onComplete();
      }, 350);
      return;
    }
    const div = document.createElement('div');
    div.className = 'boot-line';
    div.textContent = lines[i];
    overlay.appendChild(div);
    overlay.scrollTop = overlay.scrollHeight;
    i += 1;
    setTimeout(typeLine, 90 + Math.random() * 90);
  }
  typeLine();
}

document.addEventListener('DOMContentLoaded', () => {
  initNavToggle();
  markActiveNavLink();
  updateAuthNav();
});
