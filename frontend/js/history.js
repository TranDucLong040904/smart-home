/**
 * Smart Door - History Page JavaScript
 * Activity log functionality - Vietnamese UI
 */

// ===== State Variables =====
let allLogs = [];
let filteredLogs = [];
let currentPage = 1;
const logsPerPage = 10;

// ===== Initialize on DOM Load =====
document.addEventListener('DOMContentLoaded', () => {
  initClock();
  initFirebaseListeners();
  populateDayFilter();
  setTodayAsDefault();
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

// ===== Set Today as Default =====
function setTodayAsDefault() {
  const now = new Date();
  
  const daySelect = document.getElementById('filterDay');
  const monthSelect = document.getElementById('filterMonth');
  const yearSelect = document.getElementById('filterYear');
  
  if (daySelect) {
    daySelect.value = now.getDate();
  }
  
  if (monthSelect) {
    monthSelect.value = now.getMonth() + 1;
  }
  
  if (yearSelect) {
    // Add current year if not exists
    const currentYear = now.getFullYear();
    let yearExists = false;
    for (let option of yearSelect.options) {
      if (option.value == currentYear) {
        yearExists = true;
        break;
      }
    }
    if (!yearExists) {
      const option = document.createElement('option');
      option.value = currentYear;
      option.textContent = currentYear;
      yearSelect.insertBefore(option, yearSelect.firstChild);
    }
    yearSelect.value = currentYear;
  }
}

// ===== Firebase Listeners =====
function initFirebaseListeners() {
  // Listen for connection state
  database.ref('.info/connected').on('value', (snapshot) => {
    const statusEl = document.getElementById('connectionStatus');
    if (statusEl) {
      statusEl.textContent = snapshot.val() ? 'Đã kết nối' : 'Mất kết nối';
    }
  });
  
  // Load logs
  loadLogs();
}

function loadLogs() {
  database.ref(DB_PATHS.logs).orderByChild('timestamp').limitToLast(100).on('value', (snapshot) => {
    allLogs = [];
    
    snapshot.forEach((child) => {
      const log = child.val();
      log.id = child.key;
      allLogs.unshift(log); // Newest first
    });
    
    // Apply today filter by default
    applyFilters();
  });
}

// ===== Populate Day Filter =====
function populateDayFilter() {
  const select = document.getElementById('filterDay');
  if (!select) return;
  
  for (let i = 1; i <= 31; i++) {
    const option = document.createElement('option');
    option.value = i;
    option.textContent = i;
    select.appendChild(option);
  }
}

// ===== Filter Today =====
function filterToday() {
  setTodayAsDefault();
  applyFilters();
}

// ===== Clear Filters =====
function clearFilters() {
  document.getElementById('filterDay').value = '';
  document.getElementById('filterMonth').value = '';
  document.getElementById('filterYear').value = '';
  document.getElementById('searchInput').value = '';
  
  filteredLogs = [...allLogs];
  currentPage = 1;
  renderLogs();
}

// ===== Render Logs =====
function renderLogs() {
  const container = document.getElementById('historyList');
  if (!container) return;
  
  if (filteredLogs.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <span class="material-symbols-outlined">inbox</span>
        <p>Không có dữ liệu</p>
      </div>
    `;
    updatePagination();
    return;
  }
  
  // Calculate pagination
  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);
  const startIndex = (currentPage - 1) * logsPerPage;
  const endIndex = startIndex + logsPerPage;
  const pageData = filteredLogs.slice(startIndex, endIndex);
  
  // Render items
  container.innerHTML = pageData.map(log => createLogItem(log)).join('');
  
  updatePagination();
}

function createLogItem(log) {
  const date = new Date(log.timestamp);
  const dateStr = date.toLocaleDateString('vi-VN');
  const timeStr = date.toLocaleTimeString('vi-VN');
  
  const iconClass = getEventIconClass(log.event);
  const iconSymbol = getEventIcon(log.event);
  const eventText = getEventText(log.event, log.message);
  const userInfo = getUserInfo(log.device || 'system');
  const statusClass = log.success !== false ? 'success' : 'error';
  const statusText = log.success !== false ? 'Thành công' : 'Thất bại';
  
  return `
    <div class="log-item" data-id="${log.id}">
      <div class="col-checkbox">
        <input type="checkbox" class="log-checkbox" value="${log.id}">
      </div>
      <div class="col-event">
        <div class="event-icon ${iconClass}">
          <span class="material-symbols-outlined">${iconSymbol}</span>
        </div>
        <span class="event-text">${eventText}</span>
      </div>
      <div class="col-time">${dateStr}, ${timeStr}</div>
      <div class="col-user">
        <div class="user-avatar ${userInfo.class}">${userInfo.initial}</div>
        <span class="user-name">${userInfo.name}</span>
      </div>
      <div class="col-status">
        <span class="status-badge-small ${statusClass}">
          <span class="dot"></span>
          ${statusText}
        </span>
      </div>
    </div>
  `;
}

function getEventIconClass(event) {
  const classes = {
    'door_opened': 'open',
    'door_closed': 'close',
    'voice_command': 'voice',
    'otp_generated': 'otp',
    'otp_used': 'otp',
    'pin_failed': 'error',
    'lockout': 'error',
    'system_init': 'system'
  };
  return classes[event] || 'system';
}

function getEventIcon(event) {
  const icons = {
    'door_opened': 'lock_open',
    'door_closed': 'lock',
    'voice_command': 'mic',
    'otp_generated': 'key',
    'otp_used': 'vpn_key',
    'pin_failed': 'pin_invoke',
    'lockout': 'block',
    'system_init': 'power_settings_new'
  };
  return icons[event] || 'info';
}

// ===== Vietnamese Event Text =====
function getEventText(event, message) {
  // Convert English messages to Vietnamese
  if (message) {
    const translations = {
      'Opened via cloud command': 'Mở cửa từ ứng dụng',
      'Closed via cloud command': 'Đóng cửa từ ứng dụng',
      'Opened via keypad': 'Mở cửa từ bàn phím',
      'Closed via keypad': 'Đóng cửa từ bàn phím',
      'Opened via web': 'Mở cửa từ web',
      'Closed via web': 'Đóng cửa từ web',
      'Opened via voice': 'Mở cửa bằng giọng nói',
      'Closed via voice': 'Đóng cửa bằng giọng nói',
      'Wrong password attempt': 'Nhập sai mật khẩu',
      'Device locked': 'Thiết bị bị khóa',
      'System started': 'Hệ thống khởi động',
      'OTP generated': 'Đã tạo mã OTP',
      'OTP used successfully': 'Sử dụng OTP thành công'
    };
    
    // Check for exact match
    if (translations[message]) {
      return translations[message];
    }
    
    // Check for partial match
    for (const [en, vi] of Object.entries(translations)) {
      if (message.toLowerCase().includes(en.toLowerCase())) {
        return vi;
      }
    }
    
    // If contains "cloud command", translate it
    if (message.includes('cloud command')) {
      if (message.toLowerCase().includes('open')) {
        return 'Mở cửa từ ứng dụng';
      } else if (message.toLowerCase().includes('close')) {
        return 'Đóng cửa từ ứng dụng';
      }
      return 'Lệnh từ ứng dụng';
    }
    
    return message;
  }
  
  // Default Vietnamese translations for events
  const texts = {
    'door_opened': 'Cửa đã mở',
    'door_closed': 'Cửa đã đóng',
    'voice_command': 'Lệnh giọng nói',
    'otp_generated': 'Tạo mã OTP',
    'otp_used': 'Sử dụng mã OTP',
    'pin_failed': 'Nhập sai mật khẩu',
    'lockout': 'Bị khóa tạm thời',
    'system_init': 'Khởi động hệ thống'
  };
  return texts[event] || event;
}

function getUserInfo(device) {
  if (device === 'esp8266_01' || device === 'system') {
    return { name: 'Hệ thống', initial: 'H', class: 'system' };
  } else if (device === 'admin' || device === 'cloud') {
    return { name: 'Ứng dụng', initial: 'A', class: 'admin' };
  } else if (device === 'guest') {
    return { name: 'Khách', initial: 'K', class: 'guest' };
  } else if (device === 'keypad') {
    return { name: 'Bàn phím', initial: 'B', class: 'system' };
  } else if (device === 'web') {
    return { name: 'Web', initial: 'W', class: 'admin' };
  }
  return { name: device, initial: device[0].toUpperCase(), class: 'system' };
}

// ===== Pagination =====
function updatePagination() {
  const totalPages = Math.ceil(filteredLogs.length / logsPerPage) || 1;
  const pageInfo = document.getElementById('pageInfo');
  const btnPrev = document.getElementById('btnPrev');
  const btnNext = document.getElementById('btnNext');
  
  if (pageInfo) {
    pageInfo.textContent = `Trang ${currentPage} / ${totalPages}`;
  }
  
  if (btnPrev) {
    btnPrev.disabled = currentPage <= 1;
  }
  
  if (btnNext) {
    btnNext.disabled = currentPage >= totalPages;
  }
}

function prevPage() {
  if (currentPage > 1) {
    currentPage--;
    renderLogs();
  }
}

function nextPage() {
  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);
  if (currentPage < totalPages) {
    currentPage++;
    renderLogs();
  }
}

// ===== Filters =====
function applyFilters() {
  const day = document.getElementById('filterDay').value;
  const month = document.getElementById('filterMonth').value;
  const year = document.getElementById('filterYear').value;
  const search = document.getElementById('searchInput').value.toLowerCase();
  
  filteredLogs = allLogs.filter(log => {
    const date = new Date(log.timestamp);
    
    if (day && date.getDate() !== parseInt(day)) return false;
    if (month && (date.getMonth() + 1) !== parseInt(month)) return false;
    if (year && date.getFullYear() !== parseInt(year)) return false;
    
    if (search) {
      const eventText = getEventText(log.event, log.message).toLowerCase();
      if (!eventText.includes(search)) return false;
    }
    
    return true;
  });
  
  currentPage = 1;
  renderLogs();
}

// ===== Search =====
document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', debounce(() => {
      applyFilters();
    }, 300));
  }
});

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// ===== Select All =====
function toggleSelectAll() {
  const selectAll = document.getElementById('selectAll');
  const checkboxes = document.querySelectorAll('.log-checkbox');
  
  checkboxes.forEach(cb => {
    cb.checked = selectAll.checked;
  });
}

// ===== Delete Functions =====
function deleteSelected() {
  const checkboxes = document.querySelectorAll('.log-checkbox:checked');
  
  if (checkboxes.length === 0) {
    alert('Vui lòng chọn ít nhất một mục để xóa!');
    return;
  }
  
  if (!confirm(`Bạn có chắc muốn xóa ${checkboxes.length} mục đã chọn?`)) {
    return;
  }
  
  checkboxes.forEach(cb => {
    database.ref(DB_PATHS.logs + '/' + cb.value).remove();
  });
}

function deleteAll() {
  if (!confirm('Bạn có chắc muốn xóa TẤT CẢ lịch sử hoạt động?')) {
    return;
  }
  
  database.ref(DB_PATHS.logs).remove().then(() => {
    alert('Đã xóa tất cả lịch sử!');
  });
}

function openCalendar() {
  alert('Tính năng lịch sẽ được cập nhật sau!');
}
