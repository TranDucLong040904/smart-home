const ACCOUNTS_PATH = `${DB_PATHS.config}/accounts`;
const MAX_USERS = 10;

let adminAccount = {
  id: 'admin_local',
  name: 'Admin',
  password: '002525',
  createdAt: 0,
  updatedAt: 0,
};
let userAccounts = [];

let currentType = 'admin';
let editingUserId = null;

document.addEventListener('DOMContentLoaded', () => {
  firebase.auth().onAuthStateChanged((user) => {
    if (!user) {
      window.location.href = 'login.html';
      return;
    }

    bindAccountsRealtime();
    initClock();
  });
});

function bindAccountsRealtime() {
  database.ref(ACCOUNTS_PATH).on('value', (snapshot) => {
    const accounts = snapshot.val() || {};

    const admin = accounts.admin || {};
    adminAccount = {
      id: admin.id || 'admin_local',
      name: admin.name || 'Admin',
      password: admin.password || '',
      createdAt: admin.createdAt || admin.updatedAt || 0,
      updatedAt: admin.updatedAt || 0,
    };

    const usersObj = accounts.users || {};

    if (!admin.createdAt) {
      database.ref(`${ACCOUNTS_PATH}/admin/createdAt`).set(
        admin.updatedAt || firebase.database.ServerValue.TIMESTAMP
      );
    }

    Object.keys(usersObj)
      .filter((key) => key !== '_placeholder')
      .forEach((key) => {
        const user = usersObj[key] || {};
        if (!user.createdAt) {
          database.ref(`${ACCOUNTS_PATH}/users/${key}/createdAt`).set(
            user.updatedAt || firebase.database.ServerValue.TIMESTAMP
          );
        }
      });

    userAccounts = Object.keys(usersObj)
      .filter((key) => key !== '_placeholder')
      .map((key) => {
        const value = usersObj[key] || {};
        return {
          id: value.id || key,
          name: value.name || '',
          password: value.password || '',
          createdAt: value.createdAt || value.updatedAt || 0,
          updatedAt: value.updatedAt || 0,
        };
      })
      .filter((item) => item.name && item.password);

    renderTables();
  });
}

function renderTables() {
  renderAdminTable();
  renderUserTable();
}

function renderAdminTable() {
  const tbody = document.getElementById('adminTableBody');
  const empty = document.getElementById('adminEmpty');
  if (!tbody || !empty) return;

  empty.style.display = 'none';

  tbody.innerHTML = `
    <tr>
      <td>
        <div class="table-cell-main">
          <div class="avatar admin">${(adminAccount.name || '?')[0].toUpperCase()}</div>
          <span class="table-cell-text">${adminAccount.name}</span>
        </div>
      </td>
      <td class="hide-sm">
        <div class="password-cell">
          <button class="btn-eye" title="Hiện/ẩn mật khẩu" onclick="togglePassword('admin', 'admin_local')">
            <span class="material-symbols-outlined" id="admin-eye-admin_local">visibility</span>
          </button>
          <span class="password-mask" id="admin-pwd-admin_local" data-visible="false">${maskPassword(adminAccount.password)}</span>
        </div>
      </td>
      <td class="hide-md table-small-text">${formatCreatedAt(adminAccount.createdAt)}</td>
      <td class="align-right actions-cell">
        <div class="action-buttons">
          <button class="btn-icon" title="Sửa" onclick="openModal('admin')">
            <span class="material-symbols-outlined">edit</span>
          </button>
        </div>
      </td>
    </tr>
  `;
}

function renderUserTable() {
  const tbody = document.getElementById('userTableBody');
  const empty = document.getElementById('userEmpty');
  if (!tbody || !empty) return;

  if (userAccounts.length === 0) {
    tbody.innerHTML = '';
    empty.style.display = 'flex';
    return;
  }

  empty.style.display = 'none';
  tbody.innerHTML = userAccounts
    .map(
      (item) => `
      <tr>
        <td>
          <div class="table-cell-main">
            <div class="avatar user">${(item.name || '?')[0].toUpperCase()}</div>
            <span class="table-cell-text">${item.name}</span>
          </div>
        </td>
        <td class="hide-sm">
          <div class="password-cell">
            <button class="btn-eye" title="Hiện/ẩn mật khẩu" onclick="togglePassword('user', '${item.id}')">
              <span class="material-symbols-outlined" id="user-eye-${item.id}">visibility</span>
            </button>
            <span class="password-mask" id="user-pwd-${item.id}" data-visible="false">${maskPassword(item.password)}</span>
          </div>
        </td>
        <td class="hide-md table-small-text">${formatCreatedAt(item.createdAt)}</td>
        <td class="align-right actions-cell">
          <div class="action-buttons">
            <button class="btn-icon" title="Sửa" onclick="openModal('user', '${item.id}')">
              <span class="material-symbols-outlined">edit</span>
            </button>
            <button class="btn-icon delete" title="Xóa" onclick="deleteAccount('user', '${item.id}')">
              <span class="material-symbols-outlined">delete</span>
            </button>
          </div>
        </td>
      </tr>
    `
    )
    .join('');
}

function maskPassword(pwd) {
  if (!pwd) return '';
  return '•'.repeat(Math.min(8, pwd.length));
}

function formatCreatedAt(ts) {
  if (typeof ts !== 'number' || ts <= 0) return '--';
  return new Date(ts).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function togglePassword(type, id) {
  const target =
    type === 'admin' ? adminAccount : userAccounts.find((item) => item.id === id);
  const span = document.getElementById(`${type}-pwd-${id}`);
  const eye = document.getElementById(`${type}-eye-${id}`);
  if (!target || !span || !eye) return;

  const isVisible = span.getAttribute('data-visible') === 'true';
  if (isVisible) {
    span.textContent = maskPassword(target.password);
    span.setAttribute('data-visible', 'false');
    eye.textContent = 'visibility';
  } else {
    span.textContent = target.password;
    span.setAttribute('data-visible', 'true');
    eye.textContent = 'visibility_off';
  }
}

function openModal(type, userId = null) {
  currentType = type;
  editingUserId = userId;

  const modal = document.getElementById('accountModal');
  const title = document.getElementById('modalTitle');
  const nameInput = document.getElementById('accountName');
  const passInput = document.getElementById('accountPassword');
  const saveBtn = document.getElementById('modalSave');
  if (!modal || !title || !nameInput || !passInput || !saveBtn) return;

  if (type === 'admin') {
    title.textContent = 'Sửa admin';
    nameInput.value = adminAccount.name;
    passInput.value = adminAccount.password;
  } else if (userId) {
    const user = userAccounts.find((item) => item.id === userId);
    title.textContent = 'Sửa user';
    nameInput.value = user?.name || '';
    passInput.value = user?.password || '';
  } else {
    title.textContent = 'Thêm user';
    nameInput.value = '';
    passInput.value = '';
  }

  saveBtn.onclick = saveAccount;
  modal.classList.add('show');
}

function closeModal() {
  const modal = document.getElementById('accountModal');
  if (modal) modal.classList.remove('show');
  editingUserId = null;
}

function isBirthdayPattern(value) {
  if (!(value.length === 6 || value.length === 8)) return false;
  const day = parseInt(value.slice(0, 2), 10);
  const month = parseInt(value.slice(2, 4), 10);
  return day >= 1 && day <= 31 && month >= 1 && month <= 12;
}

function isRepeatingPattern(value) {
  if (value.length < 4) return false;
  return value.split('').every((char) => char === value[0]);
}

function isSequentialPattern(value) {
  if (value.length < 4) return false;

  let increasing = true;
  let decreasing = true;

  for (let i = 1; i < value.length; i++) {
    const diff = parseInt(value[i], 10) - parseInt(value[i - 1], 10);
    if (diff !== 1) increasing = false;
    if (diff !== -1) decreasing = false;
    if (!increasing && !decreasing) return false;
  }

  return increasing || decreasing;
}

function validatePasswordRules(value) {
  if (!/^\d{6,16}$/.test(value)) {
    return { ok: false, message: 'Mật khẩu phải là số, độ dài từ 6 đến 16 ký tự' };
  }
  if (isBirthdayPattern(value)) {
    return { ok: false, message: 'Mật khẩu không được có mẫu ngày sinh (ddMM, ddMMyy, ddMMyyyy)' };
  }
  if (isRepeatingPattern(value)) {
    return { ok: false, message: 'Mật khẩu không được là chuỗi lặp (ví dụ 111111)' };
  }
  if (isSequentialPattern(value)) {
    return { ok: false, message: 'Mật khẩu không được là chuỗi liên tiếp (ví dụ 123456 hoặc 654321)' };
  }

  return { ok: true, message: '' };
}

async function saveAccount() {
  const nameInput = document.getElementById('accountName');
  const passInput = document.getElementById('accountPassword');
  if (!nameInput || !passInput) return;

  const name = nameInput.value.trim();
  const password = passInput.value.trim();

  if (!name || !password) {
    alert('Vui lòng nhập đầy đủ tên và mật khẩu');
    return;
  }

  try {
    if (currentType === 'admin') {
      const adminPasswordChanged = password !== adminAccount.password;
      if (adminPasswordChanged) {
        const validation = validatePasswordRules(password);
        if (!validation.ok) {
          alert(validation.message);
          return;
        }
      }

      await database.ref(`${ACCOUNTS_PATH}/admin`).set({
        id: 'admin_local',
        name,
        password,
        createdAt: adminAccount.createdAt || firebase.database.ServerValue.TIMESTAMP,
        updatedAt: firebase.database.ServerValue.TIMESTAMP,
        updatedBy: 'web',
      });
    } else {
      if (!editingUserId && userAccounts.length >= MAX_USERS) {
        alert('Tối đa 10 user');
        return;
      }

      const userId = editingUserId || `user_${Date.now()}`;
      const existingUser = userAccounts.find((item) => item.id === userId);
      const userPasswordChanged = !editingUserId || password !== (existingUser?.password || '');

      if (userPasswordChanged) {
        const validation = validatePasswordRules(password);
        if (!validation.ok) {
          alert(validation.message);
          return;
        }
      }

      if (!editingUserId) {
        await database.ref(`${ACCOUNTS_PATH}/users/_placeholder`).remove();
      }

      await database.ref(`${ACCOUNTS_PATH}/users/${userId}`).set({
        id: userId,
        name,
        password,
        createdAt: existingUser?.createdAt || firebase.database.ServerValue.TIMESTAMP,
        updatedAt: firebase.database.ServerValue.TIMESTAMP,
        updatedBy: 'web',
      });
    }

    closeModal();
  } catch (error) {
    alert(`Lưu thất bại: ${error.message}`);
  }
}

async function deleteAccount(type, userId) {
  if (type !== 'user') return;
  if (!confirm('Xóa tài khoản này?')) return;

  try {
    await database.ref(`${ACCOUNTS_PATH}/users/${userId}`).remove();

    const remaining = userAccounts.filter((item) => item.id !== userId);
    if (remaining.length === 0) {
      await database.ref(`${ACCOUNTS_PATH}/users/_placeholder`).set({
        id: '_placeholder',
        name: 'Placeholder',
        password: '000000',
        createdAt: firebase.database.ServerValue.TIMESTAMP,
        updatedAt: firebase.database.ServerValue.TIMESTAMP,
        updatedBy: 'system',
      });
    }
  } catch (error) {
    alert(`Xóa thất bại: ${error.message}`);
  }
}

function initClock() {
  const clockTime = document.getElementById('clockTime');
  const clockDate = document.getElementById('clockDate');
  if (!clockTime || !clockDate) return;
  updateClock(clockTime, clockDate);
  setInterval(() => updateClock(clockTime, clockDate), 1000);
}

function updateClock(clockTime, clockDate) {
  const now = new Date();
  if (clockTime) clockTime.textContent = now.toLocaleTimeString('vi-VN');
  if (clockDate)
    clockDate.textContent = now.toLocaleDateString('vi-VN', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
}
