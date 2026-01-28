/**
 * Smart Door - Main App JavaScript
 * Control page functionality
 */

// ===== State Variables =====
let doorStatus = 'closed';
let isConnected = false;
let otpTimer = null;
let otpEndTime = null;

// ===== Initialize on DOM Load =====
document.addEventListener('DOMContentLoaded', () => {
  initClock();
  initFirebaseListeners();
});

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
      updateDoorUI(data.door === 'open');
      updateConnectionStatus(data.online);
      updateLastUpdate(data.lastUpdate);
    }
  });
  
  // Listen for connection state
  database.ref('.info/connected').on('value', (snapshot) => {
    updateConnectionStatus(snapshot.val());
  });
}

// ===== Door Control =====
function openDoor() {
  console.log('Opening door...');
  database.ref(DB_PATHS.commands).update({
    action: 'open',
    timestamp: firebase.database.ServerValue.TIMESTAMP
  }).then(() => {
    showNotification('Đã gửi lệnh mở cửa!', 'success');
  }).catch((error) => {
    showNotification('Lỗi: ' + error.message, 'error');
  });
}

function closeDoor() {
  console.log('Closing door...');
  database.ref(DB_PATHS.commands).update({
    action: 'close',
    timestamp: firebase.database.ServerValue.TIMESTAMP
  }).then(() => {
    showNotification('Đã gửi lệnh đóng cửa!', 'success');
  }).catch((error) => {
    showNotification('Lỗi: ' + error.message, 'error');
  });
}

// ===== UI Updates =====
function updateDoorUI(isOpen) {
  doorStatus = isOpen ? 'open' : 'closed';
  
  const doorIcon = document.getElementById('doorIcon');
  const doorIconSymbol = document.getElementById('doorIconSymbol');
  const doorStatusText = document.getElementById('doorStatusText');
  
  if (doorIcon) {
    doorIcon.classList.remove('open', 'closed');
    doorIcon.classList.add(doorStatus);
  }
  
  if (doorIconSymbol) {
    doorIconSymbol.textContent = isOpen ? 'lock_open' : 'lock';
  }
  
  if (doorStatusText) {
    doorStatusText.textContent = isOpen ? 'MỞ' : 'ĐÓNG';
    doorStatusText.className = isOpen ? 'status-open' : 'status-closed';
  }
}

function updateConnectionStatus(online) {
  isConnected = online;
  const statusEl = document.getElementById('connectionStatus');
  
  if (statusEl) {
    statusEl.textContent = online ? 'Đã kết nối' : 'Mất kết nối';
  }
}

function updateLastUpdate(timestamp) {
  const el = document.getElementById('lastUpdate');
  if (el && timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    
    let text = 'Cập nhật lần cuối: ';
    if (diff < 5) {
      text += 'Vừa xong';
    } else if (diff < 60) {
      text += `${diff} giây trước`;
    } else if (diff < 3600) {
      text += `${Math.floor(diff / 60)} phút trước`;
    } else {
      text += date.toLocaleTimeString('vi-VN');
    }
    
    el.textContent = text;
  }
}

// ===== Voice Control =====
function startVoiceControl() {
  const voiceStatus = document.getElementById('voiceStatus');
  
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    showNotification('Trình duyệt không hỗ trợ giọng nói!', 'error');
    return;
  }
  
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  
  recognition.lang = 'vi-VN';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  
  if (voiceStatus) {
    voiceStatus.textContent = 'Đang nghe...';
  }
  
  recognition.start();
  
  recognition.onresult = (event) => {
    const command = event.results[0][0].transcript.toLowerCase();
    console.log('Voice command:', command);
    
    if (voiceStatus) {
      voiceStatus.textContent = `"${command}"`;
    }
    
    if (command.includes('mở') || command.includes('open')) {
      openDoor();
    } else if (command.includes('đóng') || command.includes('close')) {
      closeDoor();
    } else {
      showNotification('Không nhận dạng được lệnh!', 'warning');
    }
    
    setTimeout(() => {
      if (voiceStatus) {
        voiceStatus.textContent = 'Nhấn để nói...';
      }
    }, 2000);
  };
  
  recognition.onerror = (event) => {
    console.error('Voice error:', event.error);
    if (voiceStatus) {
      voiceStatus.textContent = 'Lỗi: ' + event.error;
    }
    setTimeout(() => {
      if (voiceStatus) {
        voiceStatus.textContent = 'Nhấn để nói...';
      }
    }, 2000);
  };
  
  recognition.onend = () => {
    console.log('Voice recognition ended');
  };
}

// ===== OTP Functions =====
function generateOTP() {
  const duration = parseInt(document.getElementById('otpDuration').value);
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Display OTP
  const otpCodeEl = document.getElementById('otpCode');
  if (otpCodeEl) {
    otpCodeEl.textContent = code;
  }
  
  // Start timer
  otpEndTime = Date.now() + (duration * 60 * 1000);
  
  if (otpTimer) {
    clearInterval(otpTimer);
  }
  
  otpTimer = setInterval(updateOTPTimer, 1000);
  updateOTPTimer();
  
  // Save to Firebase
  database.ref(DB_PATHS.commands + '/otp').set({
    code: code,
    expires: otpEndTime,
    duration: duration
  }).then(() => {
    showNotification(`Đã tạo mã OTP: ${code}`, 'success');
  });
}

function updateOTPTimer() {
  const timerEl = document.getElementById('otpTimer');
  if (!timerEl || !otpEndTime) return;
  
  const remaining = Math.max(0, otpEndTime - Date.now());
  
  if (remaining === 0) {
    clearInterval(otpTimer);
    timerEl.textContent = 'Hết hạn';
    document.getElementById('otpCode').textContent = '------';
    return;
  }
  
  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  timerEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// ===== WiFi Functions =====
function changeWiFi() {
  const ssid = document.getElementById('wifiSSID').value;
  const password = document.getElementById('wifiPassword').value;
  
  if (!ssid) {
    showNotification('Vui lòng nhập tên mạng WiFi!', 'warning');
    return;
  }
  
  // Send WiFi credentials to Firebase (ESP will read and apply)
  database.ref(DB_PATHS.commands + '/wifi').set({
    ssid: ssid,
    password: password,
    timestamp: firebase.database.ServerValue.TIMESTAMP
  }).then(() => {
    showNotification('Đã gửi thông tin WiFi! ESP sẽ kết nối lại...', 'success');
  }).catch((error) => {
    showNotification('Lỗi: ' + error.message, 'error');
  });
}

function togglePassword() {
  const input = document.getElementById('wifiPassword');
  const btn = document.querySelector('.toggle-password .material-symbols-outlined');
  
  if (input.type === 'password') {
    input.type = 'text';
    btn.textContent = 'visibility_off';
  } else {
    input.type = 'password';
    btn.textContent = 'visibility';
  }
}

// ===== Notification =====
function showNotification(message, type = 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <span class="material-symbols-outlined">${getNotificationIcon(type)}</span>
    <span>${message}</span>
  `;
  
  // Add styles
  notification.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    padding: 12px 20px;
    background: ${getNotificationColor(type)};
    color: white;
    border-radius: 8px;
    display: flex;
    align-items: center;
    gap: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    z-index: 1000;
    animation: slideIn 0.3s ease;
  `;
  
  document.body.appendChild(notification);
  
  // Remove after 3 seconds
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

function getNotificationIcon(type) {
  const icons = {
    success: 'check_circle',
    error: 'error',
    warning: 'warning',
    info: 'info'
  };
  return icons[type] || 'info';
}

function getNotificationColor(type) {
  const colors = {
    success: '#22c55e',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6'
  };
  return colors[type] || '#3b82f6';
}

// Add notification animation styles
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
