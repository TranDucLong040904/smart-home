/**
 * Smart Door - Main App JavaScript
 * Control page functionality
 */

// ===== State Variables =====
let doorStatus = 'closed';
let isConnected = false;
let otpTimer = null;
let otpEndTime = null;
const AUTO_CLOSE_REMOTE_MS = 10000;
let autoCloseTimer = null;
let autoCloseEndTime = null;
let webOpenRequestedAt = null;


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
    initClock();
    initFirebaseListeners();
  });
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

      // Update WiFi status from ESP
      if (data.wifi) {
        updateWiFiStatus(data.wifi);
      }
    }
  });
  
  // Listen for connection state
  database.ref('.info/connected').on('value', (snapshot) => {
    updateConnectionStatus(snapshot.val());
  });
}

// ===== WiFi Status Update =====
function updateWiFiStatus(wifi) {
  const ssidEl = document.getElementById('currentSSID');
  const ipEl = document.getElementById('currentIP');
  
  if (ssidEl && wifi.ssid) {
    ssidEl.textContent = wifi.ssid;
  }
  
  if (ipEl && wifi.ip) {
    ipEl.textContent = wifi.ip;
  }
  
  // Store password for toggle (if available)
  if (wifi.ssid) {
    currentWiFiPassword = '********'; // ESP không gửi password thực
  }
}

// ===== Door Control =====
function openDoor() {
  console.log('Opening door...');
  // Mark that the next open state likely comes from this web action
  webOpenRequestedAt = Date.now();
  stopAutoCloseCountdown();
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
  stopAutoCloseCountdown();
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
  const wasOpen = doorStatus === 'open';
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

  // Start countdown only when the door opens right after a web request
  if (isOpen && !wasOpen && webOpenRequestedAt && (Date.now() - webOpenRequestedAt) < 5000) {
    startAutoCloseCountdown();
    webOpenRequestedAt = null;
  }

  if (!isOpen) {
    stopAutoCloseCountdown();
  }
}

function updateConnectionStatus(online) {
  isConnected = online;
  const statusEl = document.getElementById('connectionStatus');
  
  if (statusEl) {
    statusEl.textContent = online ? 'Đã kết nối' : 'Mất kết nối';
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
    
    // Danh sách CỤM TỪ được chấp nhận (phải xuất hiện liền nhau)
    const OPEN_PHRASES = [
      // Tiếng Việt - cụm từ chính xác
      'mở cửa', 'mở khóa nhà','mở khóa cửa', 'mở giúp cửa', 'mở cho tôi cái cửa', 'mở ra',
      'cho vào', 'vào nhà',
      // Tiếng Anh
      'open door', 'open the door', 'unlock', 'let me in'
    ];
    
    const CLOSE_PHRASES = [
      // Tiếng Việt - cụm từ chính xác
      'đóng cửa', 'khóa cửa', 'khóa lại', 'đóng lại', 'đóng đi',
      'đóng giùm', 'đóng giúp',
      // Tiếng Anh
      'close door', 'close the door', 'lock', 'lock door', 'shut door'
    ];
    
    // Kiểm tra cụm từ có trong câu nói không
    const isOpenCommand = OPEN_PHRASES.some(phrase => command.includes(phrase));
    const isCloseCommand = CLOSE_PHRASES.some(phrase => command.includes(phrase));
    
    if (isOpenCommand && !isCloseCommand) {
      openDoor();
    } else if (isCloseCommand && !isOpenCommand) {
      closeDoor();
    } else if (isOpenCommand && isCloseCommand) {
      // Nếu có cả 2, ưu tiên cụm từ xuất hiện trước
      const openIndex = Math.min(...OPEN_PHRASES.map(p => command.indexOf(p)).filter(i => i !== -1));
      const closeIndex = Math.min(...CLOSE_PHRASES.map(p => command.indexOf(p)).filter(i => i !== -1));
      
      if (openIndex < closeIndex) openDoor();
      else closeDoor();
    } else {
      showNotification('Không nhận dạng! Hãy nói: "mở cửa" hoặc "đóng cửa"', 'warning');
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
  const hours = parseInt(document.getElementById('otpHours').value) || 0;
  const minutes = parseInt(document.getElementById('otpMinutes').value) || 0;
  const seconds = parseInt(document.getElementById('otpSeconds').value) || 0;
  
  const totalSeconds = (hours * 3600) + (minutes * 60) + seconds;
  
  if (totalSeconds < 10) {
    showNotification('Thời hạn OTP phải ít nhất 10 giây!', 'warning');
    return;
  }
  
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Display OTP
  const otpCodeEl = document.getElementById('otpCode');
  if (otpCodeEl) {
    otpCodeEl.textContent = code;
  }
  
  // Start timer
  otpEndTime = Date.now() + (totalSeconds * 1000);
  
  if (otpTimer) {
    clearInterval(otpTimer);
  }
  
  otpTimer = setInterval(updateOTPTimer, 1000);
  updateOTPTimer();
  
  // Save to Firebase
  database.ref(DB_PATHS.commands + '/otp').set({
    code: code,
    expires: otpEndTime,
    durationSeconds: totalSeconds
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
  
  const hours = Math.floor(remaining / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  
  if (hours > 0) {
    timerEl.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  } else {
    timerEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
}

function deleteOTP() {
  if (otpTimer) {
    clearInterval(otpTimer);
    otpTimer = null;
  }
  otpEndTime = null;
  
  const otpCodeEl = document.getElementById('otpCode');
  const timerEl = document.getElementById('otpTimer');
  
  if (otpCodeEl) otpCodeEl.textContent = '------';
  if (timerEl) timerEl.textContent = '--:--:--';
  
  // Remove from Firebase
  database.ref(DB_PATHS.commands + '/otp').remove().then(() => {
    showNotification('Đã xóa mã OTP!', 'success');
  }).catch((error) => {
    showNotification('Lỗi: ' + error.message, 'error');
  });
}

// ===== WiFi Functions =====
let currentWiFiPassword = '';  // Store current password for toggle

function changeWiFi() {
  const ssid = document.getElementById('selectedNetworkName').textContent;
  const password = document.getElementById('wifiPassword').value;
  
  if (!ssid || ssid === '---') {
    showNotification('Vui lòng chọn mạng WiFi!', 'warning');
    return;
  }
  
  // Send WiFi credentials to Firebase (ESP will read and apply)
  database.ref(DB_PATHS.commands + '/wifi').set({
    ssid: ssid,
    password: password,
    timestamp: firebase.database.ServerValue.TIMESTAMP
  }).then(() => {
    showNotification('Đã gửi thông tin WiFi! ESP sẽ kết nối lại...', 'success');
    cancelSelection();
  }).catch((error) => {
    showNotification('Lỗi: ' + error.message, 'error');
  });
}

function scanNetworks() {
  const btnScan = document.getElementById('btnScan');
  const networkList = document.getElementById('networkList');
  const scanTitle = document.getElementById('scanTitle');
  
  if (btnScan) {
    btnScan.disabled = true;
    btnScan.innerHTML = '<span class="material-symbols-outlined spinning">sync</span> Đang quét...';
  }
  if (scanTitle) scanTitle.textContent = 'Đang quét...';
  
  // Mock scan (simulate 2s delay - replace with real ESP API call later)
  setTimeout(() => {
    const networks = [
      { ssid: 'MyHome_WiFi', rssi: -50, secure: true },
      { ssid: 'Guest_Network', rssi: -65, secure: true },
      { ssid: 'IoT_Hub', rssi: -70, secure: true },
      { ssid: 'Neighbor_WiFi', rssi: -85, secure: true },
      { ssid: 'Free_WiFi', rssi: -90, secure: false }
    ];
    
    renderNetworkList(networks);
    
    if (btnScan) {
      btnScan.disabled = false;
      btnScan.innerHTML = '<span class="material-symbols-outlined">wifi_find</span> Quét lại';
    }
    if (scanTitle) scanTitle.textContent = `Tìm thấy ${networks.length} mạng`;
  }, 2000);
}

function renderNetworkList(networks) {
  const listEl = document.getElementById('networkList');
  if (!listEl) return;
  
  let html = '';
  networks.forEach(net => {
    const signalIcon = getSignalIcon(net.rssi);
    const lockIcon = net.secure ? 'lock' : 'lock_open';
    const lockClass = net.secure ? '' : 'open-network';
    
    html += `
      <div class="network-item" onclick="selectNetwork('${net.ssid}')">
        <div class="network-info">
          <span class="material-symbols-outlined signal-icon">${signalIcon}</span>
          <span class="network-ssid">${net.ssid}</span>
        </div>
        <span class="material-symbols-outlined lock-icon ${lockClass}">${lockIcon}</span>
      </div>
    `;
  });
  
  listEl.innerHTML = html;
}

function getSignalIcon(rssi) {
  if (rssi > -60) return 'signal_wifi_4_bar';
  if (rssi > -70) return 'network_wifi_3_bar';
  if (rssi > -80) return 'network_wifi_2_bar';
  return 'network_wifi_1_bar';
}

function selectNetwork(ssid) {
  const selectedName = document.getElementById('selectedNetworkName');
  const connectForm = document.getElementById('connectForm');
  const passwordInput = document.getElementById('wifiPassword');
  
  if (selectedName) selectedName.textContent = ssid;
  if (connectForm) {
    connectForm.style.display = 'block';
    connectForm.classList.add('fade-in');
  }
  if (passwordInput) {
    passwordInput.value = '';
    passwordInput.focus();
  }
}

function cancelSelection() {
  const selectedName = document.getElementById('selectedNetworkName');
  const connectForm = document.getElementById('connectForm');
  
  if (selectedName) selectedName.textContent = '---';
  if (connectForm) connectForm.style.display = 'none';
}

function toggleCurrentPassword() {
  const passwordEl = document.getElementById('currentPassword');
  const iconEl = document.getElementById('togglePasswordIcon');
  
  if (passwordEl.classList.contains('password-masked')) {
    passwordEl.classList.remove('password-masked');
    passwordEl.textContent = currentWiFiPassword || '(không có)';
    iconEl.textContent = 'visibility_off';
  } else {
    passwordEl.classList.add('password-masked');
    passwordEl.textContent = '••••••••';
    iconEl.textContent = 'visibility';
  }
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

// ===== Auto-Close Countdown =====
function startAutoCloseCountdown() {
  const badge = document.getElementById('autoCloseBadge');
  const countdownEl = document.getElementById('autoCloseCountdown');
  if (!badge || !countdownEl) return;

  autoCloseEndTime = Date.now() + AUTO_CLOSE_REMOTE_MS;
  badge.style.display = 'inline-flex';
  updateAutoCloseCountdown();

  if (autoCloseTimer) clearInterval(autoCloseTimer);
  autoCloseTimer = setInterval(() => {
    if (!updateAutoCloseCountdown()) {
      stopAutoCloseCountdown();
    }
  }, 250);
}

function stopAutoCloseCountdown() {
  const badge = document.getElementById('autoCloseBadge');
  if (autoCloseTimer) {
    clearInterval(autoCloseTimer);
    autoCloseTimer = null;
  }
  autoCloseEndTime = null;
  if (badge) {
    badge.style.display = 'none';
  }
}

function updateAutoCloseCountdown() {
  const countdownEl = document.getElementById('autoCloseCountdown');
  if (!countdownEl || !autoCloseEndTime) return false;

  const remainingMs = Math.max(0, autoCloseEndTime - Date.now());
  const remainingSeconds = Math.ceil(remainingMs / 1000);
  countdownEl.textContent = `${remainingSeconds}s`;

  return remainingMs > 0;
}
