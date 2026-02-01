/**
 * Smart Home - Login JavaScript
 * Firebase Authentication
 */

// DOM Elements
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('emailInput');
const passwordInput = document.getElementById('passwordInput');
const togglePassword = document.getElementById('togglePassword');
const loginBtn = document.getElementById('loginBtn');
const loginLoader = document.getElementById('loginLoader');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');

// Check if already logged in
document.addEventListener('DOMContentLoaded', () => {
  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      // Already logged in, redirect to main page
      window.location.href = 'index.html';
    }
  });
});

// Toggle Password Visibility
togglePassword.addEventListener('click', () => {
  const type = passwordInput.type === 'password' ? 'text' : 'password';
  passwordInput.type = type;
  
  const icon = togglePassword.querySelector('.material-symbols-outlined');
  icon.textContent = type === 'password' ? 'visibility' : 'visibility_off';
});

// Handle Login Form Submit
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  
  if (!email || !password) {
    showError('Vui lòng nhập đầy đủ email và mật khẩu');
    return;
  }
  
  // Show loading state
  setLoading(true);
  hideError();
  
  try {
    // Sign in with Firebase
    await firebase.auth().signInWithEmailAndPassword(email, password);
    
    // Success - redirect to main page
    window.location.href = 'index.html';
    
  } catch (error) {
    console.error('Login error:', error);
    
    // Show error message
    let message = 'Đã xảy ra lỗi. Vui lòng thử lại.';
    
    switch (error.code) {
      case 'auth/invalid-email':
        message = 'Email không hợp lệ';
        break;
      case 'auth/user-disabled':
        message = 'Tài khoản đã bị vô hiệu hóa';
        break;
      case 'auth/user-not-found':
        message = 'Không tìm thấy tài khoản với email này';
        break;
      case 'auth/wrong-password':
        message = 'Mật khẩu không đúng';
        break;
      case 'auth/too-many-requests':
        message = 'Quá nhiều lần thử. Vui lòng đợi một lát.';
        break;
      case 'auth/invalid-credential':
        message = 'Email hoặc mật khẩu không đúng';
        break;
    }
    
    showError(message);
    setLoading(false);
  }
});

// Show Error Message
function showError(message) {
  errorText.textContent = message;
  errorMessage.classList.remove('hidden');
  
  // Shake animation
  errorMessage.style.animation = 'none';
  errorMessage.offsetHeight; // Trigger reflow
  errorMessage.style.animation = 'shake 0.5s ease-out';
}

// Hide Error Message
function hideError() {
  errorMessage.classList.add('hidden');
}

// Set Loading State
function setLoading(loading) {
  if (loading) {
    loginBtn.disabled = true;
    loginBtn.querySelector('.btn-text').style.opacity = '0';
    loginBtn.querySelector('.btn-icon').style.opacity = '0';
    loginLoader.classList.remove('hidden');
  } else {
    loginBtn.disabled = false;
    loginBtn.querySelector('.btn-text').style.opacity = '1';
    loginBtn.querySelector('.btn-icon').style.opacity = '1';
    loginLoader.classList.add('hidden');
  }
}

// Clear error on input
emailInput.addEventListener('input', hideError);
passwordInput.addEventListener('input', hideError);
