/**
 * Smart Home - Settings Page JavaScript
 */

// ===== Initialize on DOM Load =====
document.addEventListener('DOMContentLoaded', () => {
  // Check authentication first
  firebase.auth().onAuthStateChanged((user) => {
    if (!user) {
      // Not logged in, redirect to login page
      window.location.href = 'login.html';
      return;
    }
    
    // User is authenticated, initialize app
    displayUserInfo(user);
    initClock();
    initFirebaseListeners();
  });
});

// ===== Display User Info =====
function displayUserInfo(user) {
  const userEmailEl = document.getElementById('userEmail');
  if (userEmailEl && user.email) {
    userEmailEl.textContent = user.email;
  }
}

// ===== Logout Handler =====
function handleLogout() {
  if (confirm('Bạn có chắc muốn đăng xuất?')) {
    firebase.auth().signOut()
      .then(() => {
        window.location.href = 'login.html';
      })
      .catch((error) => {
        console.error('Logout error:', error);
        showNotification('Lỗi khi đăng xuất!', 'error');
      });
  }
}

// ===== Change Password Functions =====
function toggleChangePassword() {
  const form = document.getElementById('changePasswordForm');
  const btn = document.getElementById('btnShowChangePassword');
  
  if (form.style.display === 'none') {
    form.style.display = 'block';
    btn.classList.add('active');
  } else {
    form.style.display = 'none';
    btn.classList.remove('active');
    clearPasswordForm();
  }
}

function cancelChangePassword() {
  const form = document.getElementById('changePasswordForm');
  const btn = document.getElementById('btnShowChangePassword');
  
  form.style.display = 'none';
  btn.classList.remove('active');
  clearPasswordForm();
}

function clearPasswordForm() {
  document.getElementById('currentPassword').value = '';
  document.getElementById('newPassword').value = '';
  document.getElementById('confirmPassword').value = '';
}

function togglePasswordVisibility(inputId, button) {
  const input = document.getElementById(inputId);
  const icon = button.querySelector('.material-symbols-outlined');
  
  if (input.type === 'password') {
    input.type = 'text';
    icon.textContent = 'visibility_off';
  } else {
    input.type = 'password';
    icon.textContent = 'visibility';
  }
}

async function handleChangePassword() {
  const currentPassword = document.getElementById('currentPassword').value;
  const newPassword = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  
  // Validate inputs
  if (!currentPassword) {
    showNotification('Vui lòng nhập mật khẩu hiện tại!', 'warning');
    return;
  }
  
  if (!newPassword) {
    showNotification('Vui lòng nhập mật khẩu mới!', 'warning');
    return;
  }
  
  if (newPassword.length < 6) {
    showNotification('Mật khẩu mới phải có ít nhất 6 ký tự!', 'warning');
    return;
  }
  
  if (newPassword !== confirmPassword) {
    showNotification('Mật khẩu xác nhận không khớp!', 'warning');
    return;
  }
  
  if (currentPassword === newPassword) {
    showNotification('Mật khẩu mới phải khác mật khẩu cũ!', 'warning');
    return;
  }
  
  try {
    const user = firebase.auth().currentUser;
    
    if (!user) {
      showNotification('Phiên đăng nhập hết hạn! Vui lòng đăng nhập lại.', 'error');
      window.location.href = 'login.html';
      return;
    }
    
    // Re-authenticate user first
    const credential = firebase.auth.EmailAuthProvider.credential(
      user.email,
      currentPassword
    );
    
    await user.reauthenticateWithCredential(credential);
    
    // Update password
    await user.updatePassword(newPassword);
    
    showNotification('Đổi mật khẩu thành công!', 'success');
    cancelChangePassword();
    
  } catch (error) {
    console.error('Change password error:', error);
    
    if (error.code === 'auth/wrong-password') {
      showNotification('Mật khẩu hiện tại không đúng!', 'error');
    } else if (error.code === 'auth/weak-password') {
      showNotification('Mật khẩu mới quá yếu!', 'error');
    } else if (error.code === 'auth/requires-recent-login') {
      showNotification('Phiên đăng nhập hết hạn! Vui lòng đăng nhập lại.', 'error');
      setTimeout(() => {
        firebase.auth().signOut();
        window.location.href = 'login.html';
      }, 2000);
    } else {
      showNotification('Lỗi khi đổi mật khẩu: ' + error.message, 'error');
    }
  }
}

// ===== Clock Functions =====
function initClock() {
  updateClock();
  setInterval(updateClock, 1000);
}

function updateClock() {
  const now = new Date();
  const timeEl = document.getElementById('clockTime');
  const dateEl = document.getElementById('clockDate');
  
  if (timeEl) {
    timeEl.textContent = now.toLocaleTimeString('vi-VN');
  }
  
  if (dateEl) {
    const options = { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' };
    dateEl.textContent = now.toLocaleDateString('vi-VN', options);
  }
}

// ===== Firebase Listeners =====
function initFirebaseListeners() {
  // Listen for device status changes
  database.ref(DB_PATHS.devices).on('value', (snapshot) => {
    const data = snapshot.val();
    if (data) {
      updateConnectionStatus(data.online);
      
      // Update WiFi status from ESP
      if (data.wifi) {
        updateWiFiDisplay(data.wifi);
      }
    }
  });
}

// ===== Update Connection Status =====
function updateConnectionStatus(online) {
  const statusEl = document.getElementById('connectionStatus');
  const statusDot = document.querySelector('.status-dot');
  
  if (statusEl && statusDot) {
    if (online) {
      statusEl.textContent = 'Đã kết nối';
      statusDot.style.background = 'var(--success)';
      statusDot.style.boxShadow = '0 0 10px var(--success)';
    } else {
      statusEl.textContent = 'Mất kết nối';
      statusDot.style.background = 'var(--danger)';
      statusDot.style.boxShadow = '0 0 10px var(--danger)';
    }
  }
}

// ===== Update WiFi Display =====
function updateWiFiDisplay(wifi) {
  const ssidEl = document.getElementById('currentSSID');
  const ipEl = document.getElementById('currentIP');
  
  if (ssidEl) {
    ssidEl.textContent = wifi.ssid || '---';
  }
  
  if (ipEl) {
    ipEl.textContent = wifi.ip || '---';
  }
}

// ===== Show Notification =====
function showNotification(message, type = 'info') {
  // Check if notification container exists
  let container = document.getElementById('notificationContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'notificationContainer';
    container.style.cssText = 'position: fixed; bottom: 100px; right: 20px; z-index: 1000;';
    document.body.appendChild(container);
  }
  
  const icons = {
    success: 'check_circle',
    error: 'error',
    warning: 'warning',
    info: 'info'
  };
  
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.style.cssText = `
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 20px;
    margin-bottom: 10px;
    background: rgba(0, 0, 0, 0.8);
    border-radius: 12px;
    color: white;
    font-size: 14px;
    animation: slideIn 0.3s ease;
    border-left: 4px solid ${type === 'success' ? '#22c55e' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#3b82f6'};
  `;
  
  notification.innerHTML = `
    <span class="material-symbols-outlined" style="color: ${type === 'success' ? '#22c55e' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#3b82f6'}">${icons[type]}</span>
    <span>${message}</span>
  `;
  
  container.appendChild(notification);
  
  // Auto remove after 3 seconds
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
`;
document.head.appendChild(style);
