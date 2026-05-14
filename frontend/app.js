// Configuration - auto-detect API URL
const API_URL = (() => {
  // If on Railway or deployed: use same origin
  // If on localhost: use localhost:3001
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:3001/api';
  }
  // Production: use same origin as frontend
  return `${window.location.origin}/api`;
})();

// Get session from localStorage
function getSession() {
  return {
    name: localStorage.getItem('userName'),
    sessionId: localStorage.getItem('sessionId')
  };
}

// Set session in localStorage
function setSession(name, sessionId) {
  localStorage.setItem('userName', name);
  localStorage.setItem('sessionId', sessionId);
}

// Clear session
function clearSession() {
  localStorage.removeItem('userName');
  localStorage.removeItem('sessionId');
}

// Check if logged in
function isLoggedIn() {
  return !!getSession().sessionId;
}

// API calls
async function apiCall(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };

  if (body) options.body = JSON.stringify(body);

  const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;
  const response = await fetch(url, options);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `API error: ${response.status}`);
  }

  return response.json();
}

// Normalize score to 0-10 (backend stores as 0-10)
function normalizeScore(score, method) {
  if (!score) return 0;
  const val = parseFloat(score);
  if (method === '1-10') return val;
  if (method === 'dice') return (val / 6) * 10;
  if (method === 'scale') return ((val + 2) / 4) * 10;
  return 0;
}

// Convert between score formats
function convertScore(score, fromMethod, toMethod) {
  if (fromMethod === toMethod) return score;
  if (fromMethod === 'normalized') {
    // From 0-10 to target format
    const val = parseFloat(score);
    if (toMethod === '1-10') return Math.round(val);
    if (toMethod === 'dice') return Math.round((val / 10) * 6);
    if (toMethod === 'scale') return Math.round((val / 10) * 4 - 2);
  } else {
    // Between non-normalized formats
    let normalized = normalizeScore(score, fromMethod);
    if (toMethod === '1-10') return Math.round(normalized);
    if (toMethod === 'dice') return Math.round((normalized / 10) * 6);
    if (toMethod === 'scale') return Math.round((normalized / 10) * 4 - 2);
  }
  return 0;
}

// Get stored scoring method
function getStoredScoreMethod() {
  return localStorage.getItem('scoreMethod') || 'dice';
}

// Save scoring method
function saveScoreMethod(method) {
  localStorage.setItem('scoreMethod', method);
}

// Format scale value (-2 to 2)
function formatScaleValue(val) {
  const values = { '-2': '- -', '-1': '-', '0': '0', '1': '+', '2': '+ +' };
  return values[val] || val;
}

// Get points array (12, 10, 8, 7, 6, 5, 4, 3, 2, 1 for top 10)
const POINTS_ARRAY = [12, 10, 8, 7, 6, 5, 4, 3, 2, 1];

// Show message
function showMessage(message, type = 'info') {
  const msg = document.createElement('div');
  msg.className = `message ${type}`;
  msg.textContent = message;
  document.body.insertBefore(msg, document.body.firstChild);
  setTimeout(() => msg.remove(), 5000);
}

// Route navigation
function navigateTo(page) {
  if (!isLoggedIn() && page !== 'index') {
    window.location.href = 'index.html';
    return;
  }
  window.location.href = `${page}.html`;
}

// Drag and drop setup for ranking
function setupDragDrop(listSelector) {
  let draggedElement = null;

  document.addEventListener('dragstart', (e) => {
    if (e.target.classList.contains('ranking-item')) {
      draggedElement = e.target;
      e.target.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    }
  });

  document.addEventListener('dragend', (e) => {
    if (e.target.classList.contains('ranking-item')) {
      e.target.classList.remove('dragging');
    }
  });

  document.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    const afterElement = getDragAfterElement(listSelector, e.clientY);
    const list = document.querySelector(listSelector);

    if (afterElement == null) {
      list.appendChild(draggedElement);
    } else {
      list.insertBefore(draggedElement, afterElement);
    }
  });
}

function getDragAfterElement(container, y) {
  const items = [...document.querySelectorAll(`${container} .ranking-item:not(.dragging)`)];

  return items.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;

    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// Menu functions
function toggleMenu() {
  const menu = document.getElementById('dropdownMenu');
  const backdrop = document.getElementById('menuBackdrop');
  const button = document.getElementById('menuBtn');

  if (menu && backdrop && button) {
    menu.classList.toggle('active');
    backdrop.classList.toggle('active');
    button.classList.toggle('active');

    if (menu.classList.contains('active')) {
      positionMenu();
    }
  }
}

function closeMenu() {
  const menu = document.getElementById('dropdownMenu');
  const backdrop = document.getElementById('menuBackdrop');
  const button = document.getElementById('menuBtn');

  if (menu && backdrop && button) {
    menu.classList.remove('active');
    backdrop.classList.remove('active');
    button.classList.remove('active');
  }
}

function positionMenu() {
  const button = document.getElementById('menuBtn');
  const menu = document.getElementById('dropdownMenu');
  if (button && menu) {
    const rect = button.getBoundingClientRect();
    menu.style.top = (rect.bottom + 8) + 'px';
    menu.style.left = rect.left + 'px';
  }
}

// Load menu and initialize
function loadMenu() {
  fetch('menu.html')
    .then(r => r.text())
    .then(html => {
      const container = document.getElementById('menuContainer');
      if (container) {
        container.innerHTML = html;
        initializeMenu();
      }
    });
}

function initializeMenu() {
  // Close menu on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeMenu();
    }
  });

  // Reposition on scroll/resize
  window.addEventListener('scroll', positionMenu);
  window.addEventListener('resize', positionMenu);

  // Set active menu item
  const currentPage = window.location.pathname.split('/').pop() || 'songs.html';
  const pageMap = {
    'songs.html': 'menuSangene',
    'myPoints.html': 'menuMinePoeng',
    'results.html': 'menuResultat',
    'admin.html': 'menuAdmin'
  };

  const activeId = pageMap[currentPage];
  if (activeId && document.getElementById(activeId)) {
    document.getElementById(activeId).classList.add('active');
  }

  // Show admin link for Inge
  const session = getSession();
  if (session && session.name === 'Inge') {
    const adminLink = document.getElementById('menuAdmin');
    if (adminLink) adminLink.style.display = 'block';
  }
}

// Change score method from menu
function changeScoreMethod(method) {
  saveScoreMethod(method);

  // Update buttons
  document.querySelectorAll('.score-method-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  const activeBtn = document.querySelector(`.score-method-btn[data-method="${method}"]`);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }

  // Emit custom event for songs page to re-render
  window.dispatchEvent(new CustomEvent('scoreMethodChanged', { detail: { method } }));
}

// Update score method buttons in menu
function updateScoreMethodButtons() {
  const currentMethod = getStoredScoreMethod();
  document.querySelectorAll('.score-method-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.method === currentMethod) {
      btn.classList.add('active');
    }
  });
}

// Load menu when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadMenu);
} else {
  loadMenu();
}

// Update score method buttons after menu loads
setTimeout(updateScoreMethodButtons, 100);
