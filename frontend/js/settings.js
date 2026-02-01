/**
 * Smart Home - Settings Page JavaScript
 */

// ===== State Variables =====
let selectedNetwork = null;

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

// ===== Toggle Password Visibility =====
function togglePassword() {
  const passwordInput = document.getElementById('wifiPassword');
  const toggleBtn = document.querySelector('.toggle-password .material-symbols-outlined');
  
  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
    toggleBtn.textContent = 'visibility_off';
  } else {
    passwordInput.type = 'password';
    toggleBtn.textContent = 'visibility';
  }
}

// ===== Scan Networks =====
function scanNetworks() {
  const btn = document.getElementById('btnScan');
  const networkList = document.getElementById('networkList');
  
  // Add loading state
  btn.disabled = true;
  btn.innerHTML = '<span class="material-symbols-outlined rotating">sync</span> Đang quét...';
  
  // Send scan command to Firebase
  database.ref(DB_PATHS.commands).set({
    action: 'scan_wifi',
    timestamp: firebase.database.ServerValue.TIMESTAMP
  });
  
  networkList.innerHTML = '<p class="network-hint">Đang quét mạng...</p>';
  
  // Listen for scan results
  database.ref(DB_PATHS.devices + '/networks').once('value', (snapshot) => {
    const networks = snapshot.val();
    
    btn.disabled = false;
    btn.innerHTML = '<span class="material-symbols-outlined">wifi_find</span> Quét mạng có sẵn';
    
    if (networks && Array.isArray(networks)) {
      displayNetworks(networks);
    } else {
      networkList.innerHTML = '<p class="network-hint">Không tìm thấy mạng nào</p>';
    }
  });
  
  // Timeout after 10 seconds
  setTimeout(() => {
    if (btn.disabled) {
      btn.disabled = false;
      btn.innerHTML = '<span class="material-symbols-outlined">wifi_find</span> Quét mạng có sẵn';
    }
  }, 10000);
}

// ===== Display Networks =====
function displayNetworks(networks) {
  const networkList = document.getElementById('networkList');
  
  if (!networks || networks.length === 0) {
    networkList.innerHTML = '<p class="network-hint">Không tìm thấy mạng nào</p>';
    return;
  }
  
  networkList.innerHTML = networks.map(network => `
    <div class="network-item" onclick="selectNetwork('${network.ssid}')">
      <div class="network-info">
        <span class="material-symbols-outlined">wifi</span>
        <span class="network-name">${network.ssid}</span>
      </div>
      <div class="network-signal">
        ${network.rssi > -50 ? '●●●●' : network.rssi > -70 ? '●●●○' : '●●○○'}
      </div>
    </div>
  `).join('');
}

// ===== Select Network =====
function selectNetwork(ssid) {
  selectedNetwork = ssid;
  document.getElementById('selectedNetworkName').textContent = ssid;
  document.getElementById('connectForm').style.display = 'block';
  document.getElementById('wifiPassword').value = '';
  document.getElementById('wifiPassword').focus();
}

// ===== Cancel Selection =====
function cancelSelection() {
  selectedNetwork = null;
  document.getElementById('connectForm').style.display = 'none';
}

// ===== Change WiFi =====
function changeWiFi() {
  const password = document.getElementById('wifiPassword').value;
  
  if (!selectedNetwork) {
    showNotification('Vui lòng chọn mạng WiFi!', 'warning');
    return;
  }
  
  // Send WiFi credentials to Firebase
  database.ref(DB_PATHS.commands).set({
    action: 'change_wifi',
    ssid: selectedNetwork,
    password: password,
    timestamp: firebase.database.ServerValue.TIMESTAMP
  });
  
  showNotification(`Đang kết nối đến ${selectedNetwork}...`, 'info');
  cancelSelection();
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
  .rotating {
    animation: rotate 1s linear infinite;
  }
  @keyframes rotate {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);
