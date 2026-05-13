// Configuration
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

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

// Convert between score formats
function convertScore(score, fromMethod, toMethod) {
  if (fromMethod === toMethod) return score;

  // Normalize to 0-10
  let normalized;
  if (fromMethod === '1-10') normalized = parseFloat(score);
  else if (fromMethod === 'dice') normalized = (parseFloat(score) / 6) * 10;
  else if (fromMethod === 'scale') normalized = ((parseFloat(score) + 2) / 4) * 10;

  // Denormalize to target
  if (toMethod === '1-10') return Math.round(normalized);
  if (toMethod === 'dice') return Math.round((normalized / 10) * 6);
  if (toMethod === 'scale') return Math.round((normalized / 10) * 4 - 2);

  return 0;
}

// Get stored scoring method
function getStoredScoreMethod() {
  return localStorage.getItem('scoreMethod') || '1-10';
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
