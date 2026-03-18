/**
 * Smart Door - Main App JavaScript
 * Control page functionality
 */

// ===== State Variables =====
let doorStatus = 'closed';
let isConnected = false;
const AUTO_CLOSE_REMOTE_MS = 10000;
let autoCloseTimer = null;
let autoCloseEndTime = null;
let webOpenRequestedAt = null;

// OTP TTL & countdown state (driven by Firebase config)
let otpTtlMs = null;
let otpCountdownTimer = null;
let otpCountdownEnd = null;

// Light state (Firebase-driven)
let lightState = {
  on: false,
  r: 255,
  g: 255,
  b: 255,
};

let lightSelectedColor = { r: 255, g: 255, b: 255 };
let isLightPaletteDragging = false;
let lightPaletteCanvas = null;
let lightPaletteCtx = null;
let lightPickerModal = null;
let isLightPickerOpen = false;
let hasPendingLightSelection = false;


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
    initLightPalette();
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

      // Update light status from ESP
      if (data.light) {
        updateLightUI(data.light);
      }
    }
  });

  // Listen for OTP TTL config
  database.ref(DB_PATHS.config + '/otpTtlMs').on('value', (snapshot) => {
    const val = snapshot.val();
    if (typeof val === 'number' && val > 0) {
      otpTtlMs = val;
    } else {
      otpTtlMs = null;
    }
    updateOtpTimerLabel();
  });

  // Listen for OTP status (used/expired) to clear UI when consumed/timeout
  database.ref(DB_PATHS.commands + '/otp').on('value', (snapshot) => {
    const otp = snapshot.val();
    if (!otp || !otp.code) {
      resetOtpUI();
      return;
    }

    // If backend marked used or expired, hide code
    if (otp.status === 'used' || otp.status === 'expired' || otp.used === true) {
      resetOtpUI();
      return;
    }

    // If a new code arrives, set it and start countdown based on current TTL
    const codeEl = document.getElementById('otpCode');
    if (codeEl) codeEl.textContent = otp.code;
    startOtpCountdown();
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

// ===== Light Control =====
function updateLightUI(light) {
  lightState.on = !!light.on;
  lightState.r = Number.isFinite(light.r) ? light.r : 255;
  lightState.g = Number.isFinite(light.g) ? light.g : 255;
  lightState.b = Number.isFinite(light.b) ? light.b : 255;

  const lightIcon = document.getElementById('lightIcon');
  const lightStatusText = document.getElementById('lightStatusText');
  const lightColorText = document.getElementById('lightColorText');
  const lightHexText = document.getElementById('lightHexText');

  if (lightIcon) {
    lightIcon.classList.remove('on', 'off');
    lightIcon.classList.add(lightState.on ? 'on' : 'off');
  }

  if (lightStatusText) {
    lightStatusText.textContent = lightState.on ? 'BẬT' : 'TẮT';
    lightStatusText.className = lightState.on ? 'status-open' : 'status-closed';
  }

  if (lightColorText) {
    lightColorText.textContent = `RGB: ${lightState.r}, ${lightState.g}, ${lightState.b}`;
  }

  if (lightHexText) {
    lightHexText.textContent = rgbToHex(lightState.r, lightState.g, lightState.b);
  }

  if (!isLightPaletteDragging) {
    // Keep user's manual pick stable while the color picker is open.
    if (isLightPickerOpen || hasPendingLightSelection) {
      return;
    }

    lightSelectedColor = {
      r: lightState.r,
      g: lightState.g,
      b: lightState.b,
    };
    updatePalettePickerFromRgb(lightState.r, lightState.g, lightState.b);
  }
}

function sendLightAction(action) {
  return database.ref(DB_PATHS.commands + '/light').update({
    action,
  });
}

function turnLightOn() {
  sendLightAction('on')
    .then(() => showNotification('Đã gửi lệnh bật đèn!', 'success'))
    .catch((error) => showNotification('Lỗi: ' + error.message, 'error'));
}

function turnLightOff() {
  sendLightAction('off')
    .then(() => showNotification('Đã gửi lệnh tắt đèn!', 'success'))
    .catch((error) => showNotification('Lỗi: ' + error.message, 'error'));
}

function toggleLight() {
  sendLightAction('toggle')
    .then(() => showNotification('Đã gửi lệnh đảo trạng thái đèn!', 'success'))
    .catch((error) => showNotification('Lỗi: ' + error.message, 'error'));
}

function applyLightColor() {
  const r = lightSelectedColor.r;
  const g = lightSelectedColor.g;
  const b = lightSelectedColor.b;

  // User confirmed this choice; allow sync from device again.
  hasPendingLightSelection = false;

  database.ref(DB_PATHS.commands + '/light').update({
    color: { r, g, b },
    action: 'set',
  }).then(() => {
    showNotification('Đã gửi lệnh đổi màu đèn!', 'success');
  }).catch((error) => {
    showNotification('Lỗi: ' + error.message, 'error');
  });
}

function previewLightColor() {
  // Kept for backward compatibility with old markup.
}

function initLightPalette() {
  lightPickerModal = document.getElementById('lightPickerModal');
  lightPaletteCanvas = document.getElementById('lightColorCanvas');
  if (!lightPaletteCanvas) return;

  lightPaletteCtx = lightPaletteCanvas.getContext('2d');
  if (!lightPaletteCtx) return;

  resizeLightPaletteCanvas();
  drawLightPalette();
  updatePalettePickerFromRgb(255, 255, 255);

  const onPointerDown = (event) => {
    isLightPaletteDragging = true;
    pickLightColorFromPointer(event);
  };

  const onPointerMove = (event) => {
    if (!isLightPaletteDragging) return;
    pickLightColorFromPointer(event);
  };

  const onPointerUp = () => {
    isLightPaletteDragging = false;
  };

  lightPaletteCanvas.addEventListener('mousedown', onPointerDown);
  lightPaletteCanvas.addEventListener('mousemove', onPointerMove);
  window.addEventListener('mouseup', onPointerUp);

  lightPaletteCanvas.addEventListener('touchstart', onPointerDown, { passive: true });
  lightPaletteCanvas.addEventListener('touchmove', onPointerMove, { passive: true });
  window.addEventListener('touchend', onPointerUp, { passive: true });
  window.addEventListener('resize', () => {
    resizeLightPaletteCanvas();
    drawLightPalette();
    updatePalettePickerFromRgb(lightSelectedColor.r, lightSelectedColor.g, lightSelectedColor.b);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeLightColorPicker();
    }
  });
}

function resizeLightPaletteCanvas() {
  if (!lightPaletteCanvas) return;
  const rect = lightPaletteCanvas.getBoundingClientRect();
  const width = Math.max(280, Math.floor(rect.width || 480));
  const height = Math.max(150, Math.floor(rect.height || 260));
  if (lightPaletteCanvas.width !== width || lightPaletteCanvas.height !== height) {
    lightPaletteCanvas.width = width;
    lightPaletteCanvas.height = height;
  }
}

function openLightColorPicker() {
  if (!lightPickerModal) return;
  isLightPickerOpen = true;
  hasPendingLightSelection = false;

  lightSelectedColor = {
    r: lightState.r,
    g: lightState.g,
    b: lightState.b,
  };

  lightPickerModal.classList.add('active');
  resizeLightPaletteCanvas();
  drawLightPalette();
  updatePalettePickerFromRgb(lightSelectedColor.r, lightSelectedColor.g, lightSelectedColor.b);
}

function closeLightColorPicker() {
  if (!lightPickerModal) return;
  lightPickerModal.classList.remove('active');
  isLightPaletteDragging = false;
  isLightPickerOpen = false;
  hasPendingLightSelection = false;
}

function handleLightPickerBackdrop(event) {
  if (event.target && event.target.id === 'lightPickerModal') {
    closeLightColorPicker();
  }
}

function drawLightPalette() {
  if (!lightPaletteCanvas || !lightPaletteCtx) return;

  const width = lightPaletteCanvas.width;
  const height = lightPaletteCanvas.height;
  const image = lightPaletteCtx.createImageData(width, height);
  const data = image.data;

  let idx = 0;
  for (let y = 0; y < height; y++) {
    const v = 1 - y / (height - 1);
    for (let x = 0; x < width; x++) {
      const h = (x / (width - 1)) * 360;
      const rgb = hsvToRgb(h, 1, v);
      data[idx++] = rgb.r;
      data[idx++] = rgb.g;
      data[idx++] = rgb.b;
      data[idx++] = 255;
    }
  }

  lightPaletteCtx.putImageData(image, 0, 0);
}

function pickLightColorFromPointer(event) {
  if (!lightPaletteCanvas) return;

  const rect = lightPaletteCanvas.getBoundingClientRect();
  const point = getPointerClientPos(event);
  let x = point.x - rect.left;
  let y = point.y - rect.top;

  x = Math.max(0, Math.min(rect.width - 1, x));
  y = Math.max(0, Math.min(rect.height - 1, y));

  const h = (x / (rect.width - 1)) * 360;
  const v = 1 - y / (rect.height - 1);
  const rgb = hsvToRgb(h, 1, v);

  lightSelectedColor = rgb;
  hasPendingLightSelection = true;
  updateLightColorMeta(rgb.r, rgb.g, rgb.b);
  updateLightPickerPoint(x, y, rect.width, rect.height);
}

function updatePalettePickerFromRgb(r, g, b) {
  if (!lightPaletteCanvas) return;

  const hsv = rgbToHsv(r, g, b);
  const rect = lightPaletteCanvas.getBoundingClientRect();
  const width = rect.width || lightPaletteCanvas.width;
  const height = rect.height || lightPaletteCanvas.height;

  const x = (hsv.h / 360) * (width - 1);
  const y = (1 - hsv.v) * (height - 1);
  updateLightPickerPoint(x, y, width, height);
  updateLightColorMeta(r, g, b);
}

function updateLightColorMeta(r, g, b) {
  const lightColorText = document.getElementById('lightColorText');
  const lightHexText = document.getElementById('lightHexText');
  const lightModalHexText = document.getElementById('lightModalHexText');
  const lightColorChip = document.getElementById('lightColorChip');
  const colorHex = rgbToHex(r, g, b);

  if (lightColorText) {
    lightColorText.textContent = `RGB: ${r}, ${g}, ${b}`;
  }

  if (lightHexText) {
    lightHexText.textContent = colorHex;
  }

  if (lightModalHexText) {
    lightModalHexText.textContent = colorHex;
  }

  if (lightColorChip) {
    lightColorChip.style.background = `rgb(${r}, ${g}, ${b})`;
  }
}

function updateLightPickerPoint(x, y, width, height) {
  const point = document.getElementById('lightPickerPoint');
  if (!point) return;

  const safeX = Math.max(0, Math.min(width - 1, x));
  const safeY = Math.max(0, Math.min(height - 1, y));
  point.style.left = `${safeX}px`;
  point.style.top = `${safeY}px`;
}

function getPointerClientPos(event) {
  if (event.touches && event.touches.length > 0) {
    return {
      x: event.touches[0].clientX,
      y: event.touches[0].clientY,
    };
  }

  return {
    x: event.clientX,
    y: event.clientY,
  };
}

function hsvToRgb(h, s, v) {
  const c = v * s;
  const hh = h / 60;
  const x = c * (1 - Math.abs((hh % 2) - 1));
  let r1 = 0;
  let g1 = 0;
  let b1 = 0;

  if (hh >= 0 && hh < 1) {
    r1 = c;
    g1 = x;
  } else if (hh >= 1 && hh < 2) {
    r1 = x;
    g1 = c;
  } else if (hh >= 2 && hh < 3) {
    g1 = c;
    b1 = x;
  } else if (hh >= 3 && hh < 4) {
    g1 = x;
    b1 = c;
  } else if (hh >= 4 && hh < 5) {
    r1 = x;
    b1 = c;
  } else {
    r1 = c;
    b1 = x;
  }

  const m = v - c;
  return {
    r: Math.round((r1 + m) * 255),
    g: Math.round((g1 + m) * 255),
    b: Math.round((b1 + m) * 255),
  };
}

function rgbToHsv(r, g, b) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;

  let h = 0;
  if (d !== 0) {
    if (max === rn) {
      h = 60 * (((gn - bn) / d + 6) % 6);
    } else if (max === gn) {
      h = 60 * ((bn - rn) / d + 2);
    } else {
      h = 60 * ((rn - gn) / d + 4);
    }
  }

  const s = max === 0 ? 0 : d / max;
  const v = max;
  return { h, s, v };
}

function rgbToHex(r, g, b) {
  const toHex = (v) => v.toString(16).padStart(2, '0').toUpperCase();
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
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

    const LIGHT_ON_PHRASES = [
      'bật đèn', 'mở đèn', 'bật đèn phòng', 'bật đèn chính',
      'turn on light', 'turn on the light', 'light on'
    ];

    const LIGHT_OFF_PHRASES = [
      'tắt đèn', 'đóng đèn', 'tắt đèn phòng', 'tắt đèn chính',
      'turn off light', 'turn off the light', 'light off'
    ];
    
    // Kiểm tra cụm từ có trong câu nói không
    const isOpenCommand = OPEN_PHRASES.some(phrase => command.includes(phrase));
    const isCloseCommand = CLOSE_PHRASES.some(phrase => command.includes(phrase));
    const isLightOnCommand = LIGHT_ON_PHRASES.some(phrase => command.includes(phrase));
    const isLightOffCommand = LIGHT_OFF_PHRASES.some(phrase => command.includes(phrase));

    function firstMatchIndex(phrases, text) {
      const matches = phrases.map((p) => text.indexOf(p)).filter((idx) => idx !== -1);
      return matches.length ? Math.min(...matches) : Number.MAX_SAFE_INTEGER;
    }

    const openIdx = firstMatchIndex(OPEN_PHRASES, command);
    const closeIdx = firstMatchIndex(CLOSE_PHRASES, command);
    const lightOnIdx = firstMatchIndex(LIGHT_ON_PHRASES, command);
    const lightOffIdx = firstMatchIndex(LIGHT_OFF_PHRASES, command);

    const candidates = [];
    if (isOpenCommand) candidates.push({ type: 'door_open', idx: openIdx });
    if (isCloseCommand) candidates.push({ type: 'door_close', idx: closeIdx });
    if (isLightOnCommand) candidates.push({ type: 'light_on', idx: lightOnIdx });
    if (isLightOffCommand) candidates.push({ type: 'light_off', idx: lightOffIdx });

    candidates.sort((a, b) => a.idx - b.idx);

    if (candidates.length > 0) {
      const selected = candidates[0].type;
      if (selected === 'door_open') {
        openDoor();
      } else if (selected === 'door_close') {
        closeDoor();
      } else if (selected === 'light_on') {
        turnLightOn();
      } else if (selected === 'light_off') {
        turnLightOff();
      }
    } else {
      showNotification('Không nhận dạng! Hãy nói: "mở cửa", "đóng cửa" hoặc "bật đèn"', 'warning');
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
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Display OTP
  const otpCodeEl = document.getElementById('otpCode');
  if (otpCodeEl) {
    otpCodeEl.textContent = code;
  }
  startOtpCountdown();

  // Save to Firebase
  database.ref(DB_PATHS.commands + '/otp').set({
    code: code,
    used: false,
    status: 'active'
  }).then(() => {
    showNotification(`Đã tạo mã OTP: ${code}`, 'success');
  });
}

function deleteOTP() {
  const otpCodeEl = document.getElementById('otpCode');
  const timerEl = document.getElementById('otpTimer');
  
  if (otpCodeEl) otpCodeEl.textContent = '------';
  if (timerEl) timerEl.textContent = 'Theo cấu hình thiết bị';
  stopOtpCountdown();
  
  // Remove from Firebase
  database.ref(DB_PATHS.commands + '/otp').remove().then(() => {
    showNotification('Đã xóa mã OTP!', 'success');
  }).catch((error) => {
    showNotification('Lỗi: ' + error.message, 'error');
  });
}

// ===== OTP Countdown Helpers =====
function updateOtpTimerLabel() {
  const timerEl = document.getElementById('otpTimer');
  if (!timerEl) return;
  if (otpTtlMs && otpTtlMs >= 1000) {
    timerEl.textContent = formatMs(otpTtlMs);
  } else {
    timerEl.textContent = '';
  }
}

function formatMs(ms) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  if (m > 0) return `${m}m${s.toString().padStart(2, '0')}s`;
  return `${s}s`;
}

function startOtpCountdown() {
  stopOtpCountdown();

  if (!otpTtlMs || otpTtlMs < 1000) {
    updateOtpTimerLabel();
    return;
  }

  otpCountdownEnd = Date.now() + otpTtlMs;
  const timerEl = document.getElementById('otpTimer');
  updateOtpCountdown();

  otpCountdownTimer = setInterval(() => {
    updateOtpCountdown();
  }, 1000);

  function updateOtpCountdown() {
    if (!timerEl) return;
    const remaining = otpCountdownEnd - Date.now();
    if (remaining <= 0) {
      timerEl.textContent = 'Hết hạn';
      stopOtpCountdown();
      resetOtpUI();
      return;
    }
    timerEl.textContent = formatMs(remaining);
  }
}

function stopOtpCountdown() {
  if (otpCountdownTimer) {
    clearInterval(otpCountdownTimer);
    otpCountdownTimer = null;
  }
  otpCountdownEnd = null;
}

function resetOtpUI() {
  stopOtpCountdown();
  const otpCodeEl = document.getElementById('otpCode');
  const timerEl = document.getElementById('otpTimer');
  if (otpCodeEl) otpCodeEl.textContent = '------';
  if (timerEl) timerEl.textContent = 'Theo cấu hình thiết bị';
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
