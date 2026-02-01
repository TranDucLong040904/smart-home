/**
 * Smart Home - Theme Manager
 * Handles dark/light mode switching with localStorage persistence
 */

// ===== Theme Constants =====
const THEME_KEY = 'smart-home-theme';
const THEME_DARK = 'dark';
const THEME_LIGHT = 'light';

// ===== Initialize Theme =====
function initTheme() {
  // Get saved theme or default to dark
  const savedTheme = localStorage.getItem(THEME_KEY) || THEME_DARK;
  applyTheme(savedTheme);
  
  // Update toggle switch if exists
  const darkModeToggle = document.getElementById('darkModeToggle');
  const lightModeItem = document.getElementById('lightModeItem');
  
  if (darkModeToggle) {
    darkModeToggle.checked = savedTheme === THEME_DARK;
    darkModeToggle.disabled = false;
    darkModeToggle.addEventListener('change', handleDarkModeToggle);
  }
  
  if (lightModeItem) {
    lightModeItem.addEventListener('click', () => setTheme(THEME_LIGHT));
  }
}

// ===== Apply Theme =====
function applyTheme(theme) {
  if (theme === THEME_LIGHT) {
    document.documentElement.setAttribute('data-theme', 'light');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
}

// ===== Set Theme =====
function setTheme(theme) {
  localStorage.setItem(THEME_KEY, theme);
  applyTheme(theme);
  
  // Update toggle switches
  const darkModeToggle = document.getElementById('darkModeToggle');
  if (darkModeToggle) {
    darkModeToggle.checked = theme === THEME_DARK;
  }
  
  // Show notification
  if (typeof showNotification === 'function') {
    const themeName = theme === THEME_LIGHT ? 'Sáng' : 'Tối';
    showNotification(`Đã chuyển sang giao diện ${themeName}!`, 'success');
  }
}

// ===== Toggle Theme =====
function toggleTheme() {
  const currentTheme = localStorage.getItem(THEME_KEY) || THEME_DARK;
  const newTheme = currentTheme === THEME_DARK ? THEME_LIGHT : THEME_DARK;
  setTheme(newTheme);
}

// ===== Handle Dark Mode Toggle =====
function handleDarkModeToggle(e) {
  const isDarkMode = e.target.checked;
  setTheme(isDarkMode ? THEME_DARK : THEME_LIGHT);
}

// ===== Get Current Theme =====
function getCurrentTheme() {
  return localStorage.getItem(THEME_KEY) || THEME_DARK;
}

// ===== Auto-initialize on DOM load =====
document.addEventListener('DOMContentLoaded', initTheme);

// Also apply immediately to prevent flash
(function() {
  const savedTheme = localStorage.getItem(THEME_KEY) || THEME_DARK;
  if (savedTheme === THEME_LIGHT) {
    document.documentElement.setAttribute('data-theme', 'light');
  }
})();
