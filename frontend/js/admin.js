// In-memory account lists for demo purposes
const adminAccounts = [
  { name: 'Admin_Main', password: 'admin123', createdAt: '12/10/2023' },
  { name: 'Super_Admin', password: 'super456', createdAt: '01/01/2024' },
];

const userAccounts = [
  { name: 'Guest_LivingRoom', password: 'guest123', createdAt: '14/11/2023' },
  { name: 'Kids_Tablet', password: 'kids789', createdAt: '20/12/2023' },
  { name: 'Door_Access_01', password: 'door2468', createdAt: '05/01/2024' },
];

let currentType = 'admin';
let editingIndex = null;

document.addEventListener('DOMContentLoaded', () => {
  renderTables();
});

function renderTables() {
  renderTable('admin', adminAccounts, 'adminTableBody', 'adminEmpty');
  renderTable('user', userAccounts, 'userTableBody', 'userEmpty');
}

function renderTable(type, data, bodyId, emptyId) {
  const tbody = document.getElementById(bodyId);
  const empty = document.getElementById(emptyId);
  if (!tbody || !empty) return;

  if (data.length === 0) {
    tbody.innerHTML = '';
    empty.style.display = 'flex';
    return;
  }

  empty.style.display = 'none';
  tbody.innerHTML = data
    .map(
      (item, idx) => `
        <tr>
          <td>
            <div class="table-cell-main">
              <div class="avatar ${type}">${(item.name || '?')[0].toUpperCase()}</div>
              <span class="table-cell-text">${item.name}</span>
            </div>
          </td>
          <td class="hide-sm">
            <div class="password-cell">
              <button class="btn-eye" title="Hiện/ẩn mật khẩu" onclick="togglePassword('${type}', ${idx})">
                <span class="material-symbols-outlined" id="${type}-eye-${idx}">visibility</span>
              </button>
              <span class="password-mask" id="${type}-pwd-${idx}" data-visible="false">${maskPassword(item.password)}</span>
            </div>
          </td>
          <td class="hide-md table-small-text">${item.createdAt || ''}</td>
          <td class="align-right actions-cell">
            <div class="action-buttons">
              <button class="btn-icon" title="Sửa" onclick="editAccount('${type}', ${idx})">
                <span class="material-symbols-outlined">edit</span>
              </button>
              <button class="btn-icon delete" title="Xóa" onclick="deleteAccount('${type}', ${idx})">
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

function togglePassword(type, index) {
  const target = type === 'admin' ? adminAccounts : userAccounts;
  const span = document.getElementById(`${type}-pwd-${index}`);
  const eye = document.getElementById(`${type}-eye-${index}`);
  if (!span || !eye) return;

  const isVisible = span.getAttribute('data-visible') === 'true';
  if (isVisible) {
    span.textContent = maskPassword(target[index].password);
    span.setAttribute('data-visible', 'false');
    eye.textContent = 'visibility';
  } else {
    span.textContent = target[index].password;
    span.setAttribute('data-visible', 'true');
    eye.textContent = 'visibility_off';
  }
}

function openModal(type, index = null) {
  currentType = type;
  editingIndex = index;
  const modal = document.getElementById('accountModal');
  const title = document.getElementById('modalTitle');
  const nameInput = document.getElementById('accountName');
  const passInput = document.getElementById('accountPassword');
  const saveBtn = document.getElementById('modalSave');

  if (!modal || !title || !nameInput || !passInput || !saveBtn) return;

  if (index !== null) {
    const data = type === 'admin' ? adminAccounts[index] : userAccounts[index];
    nameInput.value = data.name;
    passInput.value = data.password;
    title.textContent = `Sửa ${type === 'admin' ? 'admin' : 'user'}`;
  } else {
    nameInput.value = '';
    passInput.value = '';
    title.textContent = `Thêm ${type === 'admin' ? 'admin' : 'user'}`;
  }

  saveBtn.onclick = saveAccount;
  modal.classList.add('show');
}

function closeModal() {
  const modal = document.getElementById('accountModal');
  if (modal) modal.classList.remove('show');
  editingIndex = null;
}

function saveAccount() {
  const nameInput = document.getElementById('accountName');
  const passInput = document.getElementById('accountPassword');
  if (!nameInput || !passInput) return;

  const name = nameInput.value.trim();
  const password = passInput.value.trim();
  if (!name || !password) {
    alert('Vui lòng nhập đầy đủ tên và mật khẩu');
    return;
  }

  const now = new Date();
  const createdAt = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1)
    .toString()
    .padStart(2, '0')}/${now.getFullYear()}`;

  const target = currentType === 'admin' ? adminAccounts : userAccounts;
  if (editingIndex !== null) {
    target[editingIndex] = { name, password, createdAt: target[editingIndex].createdAt };
  } else {
    target.push({ name, password, createdAt });
  }

  renderTables();
  closeModal();
}

function editAccount(type, index) {
  openModal(type, index);
}

function deleteAccount(type, index) {
  const target = type === 'admin' ? adminAccounts : userAccounts;
  if (!confirm('Xóa tài khoản này?')) return;
  target.splice(index, 1);
  renderTables();
}

// Small helpers for header clock reuse (not coupled to Firebase)
document.addEventListener('DOMContentLoaded', () => {
  const clockTime = document.getElementById('clockTime');
  const clockDate = document.getElementById('clockDate');
  if (clockTime && clockDate) {
    updateClock(clockTime, clockDate);
    setInterval(() => updateClock(clockTime, clockDate), 1000);
  }
});

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
