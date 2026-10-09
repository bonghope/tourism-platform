<template>
  <div class="panel-container">
    <!-- THÔNG BÁO TOAST KHI THAO TÁC THÀNH CÔNG -->
    <transition name="toast-fade">
      <div v-if="toastMsg" :class="['admin-toast', toastType === 'error' ? 'toast-error' : 'toast-success']">
        <svg v-if="toastType === 'error'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
        <span>{{ toastMsg }}</span>
      </div>
    </transition>

    <!-- Header & Search -->
    <div class="panel-toolbar">
      <div class="toolbar-title">
        <h2>Quản lý Tài khoản & Phân quyền Admin</h2>
        <p>Danh sách thành viên CSDL MySQL - Quản lý nhiều tài khoản Admin và trạng thái hoạt động</p>
      </div>

      <div class="toolbar-actions">
        <!-- Bộ lọc phân loại -->
        <div class="filter-tabs">
          <button 
            :class="['filter-btn', roleFilter === 'ALL' ? 'active' : '']" 
            @click="roleFilter = 'ALL'"
          >
            Tất cả ({{ users.length }})
          </button>
          <button 
            :class="['filter-btn', roleFilter === 'ADMIN' ? 'active' : '']" 
            @click="roleFilter = 'ADMIN'"
          >
            Quản trị viên ({{ countAdmins }})
          </button>
          <button 
            :class="['filter-btn', roleFilter === 'USER' ? 'active' : '']" 
            @click="roleFilter = 'USER'"
          >
            Khách hàng ({{ countUsers }})
          </button>
          <button 
            :class="['filter-btn', roleFilter === 'BANNED' ? 'active' : '']" 
            @click="roleFilter = 'BANNED'"
          >
            Bị khóa ({{ countBanned }})
          </button>
        </div>

        <div class="search-wrap">
          <input 
            v-model="keyword" 
            @input="onSearchInput" 
            type="text" 
            placeholder="Tìm theo tên, email, SĐT..." 
            class="form-control search-input" 
          />
          <button v-if="keyword" class="btn-clear" @click="clearSearch">✕</button>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div v-if="loading" class="state-box">
      <div class="spinner"></div>
      <p style="margin-top: 12px; color: #64748b;">Đang tải dữ liệu từ CSDL MySQL...</p>
    </div>

    <div v-else-if="filteredUsers.length === 0" class="state-box">
      <p style="color: #64748b;">Không tìm thấy tài khoản nào phù hợp với bộ lọc.</p>
    </div>

    <div v-else class="table-responsive">
      <table class="data-table">
        <thead>
          <tr>
            <th>Người dùng</th>
            <th>Email</th>
            <th>Số điện thoại</th>
            <th>Vai trò hệ thống</th>
            <th>Trạng thái</th>
            <th>Ngày tạo</th>
            <th style="text-align: right; min-width: 220px;">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in filteredUsers" :key="u.UserID" :class="{ 'row-admin': u.Role === 'ADMIN' }">
            <td>
              <div class="user-info-cell">
                <img :src="u.AvatarURL || defaultAvatar" class="user-thumb" alt="Avatar" />
                <div>
                  <div class="user-name">
                    {{ u.FullName || 'Chưa cập nhật' }}
                  </div>
                  <div class="user-id font-mono">{{ u.UserID }}</div>
                </div>
              </div>
            </td>
            <td>{{ u.Email }}</td>
            <td>{{ u.Phone || '—' }}</td>
            <td>
              <span :class="['badge', u.Role === 'ADMIN' ? 'badge-info' : 'badge-draft']">
                {{ u.Role === 'ADMIN' ? 'Quản trị viên (ADMIN)' : 'Khách hàng (USER)' }}
              </span>
            </td>
            <td>
              <span :class="['badge', getStatusBadge(u.Status)]">
                {{ formatStatus(u.Status) }}
              </span>
            </td>
            <td>{{ formatDate(u.CreatedAt) }}</td>
            <td style="text-align: right;">
              <div class="action-cell-btns">
                <!-- NÚT PHÂN QUYỀN ADMIN / USER -->
                <button 
                  v-if="u.Role !== 'ADMIN'"
                  class="btn btn-role-promote btn-sm"
                  @click="changeRole(u, 'ADMIN')"
                  :disabled="actionLoading"
                  title="Cấp toàn quyền Quản trị viên"
                >
                  Thăng Admin
                </button>
                <button 
                  v-else
                  class="btn btn-outline btn-sm"
                  @click="changeRole(u, 'USER')"
                  :disabled="actionLoading"
                  title="Hạ quyền xuống Khách hàng"
                >
                  Giáng User
                </button>

                <!-- NÚT KHÓA / MỞ KHÓA -->
                <button 
                  v-if="u.Status !== 'BANNED'" 
                  class="btn btn-danger-outline btn-sm" 
                  @click="openBanModal(u)"
                  :disabled="actionLoading"
                >
                  Khóa
                </button>
                <button 
                  v-else 
                  class="btn btn-success btn-sm" 
                  @click="handleUnban(u)"
                  :disabled="actionLoading"
                >
                  Mở khóa
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- MODAL KHÓA TÀI KHOẢN -->
    <div v-if="userToBan" class="modal-overlay">
      <div class="modal-card">
        <div class="modal-header">
          <h3>Xác nhận khóa tài khoản</h3>
          <button class="modal-close" @click="userToBan = null">✕</button>
        </div>
        <div class="modal-body">
          <p>
            Bạn có chắc chắn muốn khóa tài khoản của <strong>{{ userToBan.FullName }}</strong> ({{ userToBan.Email }})?
          </p>
          <div class="warning-box">
            Lưu ý: Sau khi khóa, toàn bộ phiên đăng nhập (Refresh Tokens) của tài khoản này sẽ bị thu hồi và không thể đăng nhập vào hệ thống.
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" @click="userToBan = null">Hủy</button>
          <button class="btn btn-danger" @click="confirmBan" :disabled="actionLoading">
            {{ actionLoading ? 'Đang xử lý...' : 'Đồng ý khóa' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import adminApi from '../services/api';

const defaultAvatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100';

const users = ref([]);
const loading = ref(false);
const actionLoading = ref(false);
const keyword = ref('');
const roleFilter = ref('ALL');
const userToBan = ref(null);
const toastMsg = ref('');
const toastType = ref('success');
let searchTimeout = null;
let toastTimeout = null;

const showToast = (msg, type = 'success') => {
  toastMsg.value = msg;
  toastType.value = type;
  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toastMsg.value = '';
  }, 4000);
};

const fetchUsers = async (searchVal = '') => {
  loading.value = true;
  try {
    const res = await adminApi.getUsers(searchVal);
    if (res.success) {
      users.value = res.data || [];
    }
  } catch (e) {
    console.error('Lỗi lấy danh sách user:', e);
    showToast('Không thể kết nối đến API backend!', 'error');
  } finally {
    loading.value = false;
  }
};

const countAdmins = computed(() => {
  return users.value.filter(u => u.Role === 'ADMIN').length;
});

const countUsers = computed(() => {
  return users.value.filter(u => u.Role !== 'ADMIN').length;
});

const countBanned = computed(() => {
  return users.value.filter(u => u.Status === 'BANNED').length;
});

const filteredUsers = computed(() => {
  let list = users.value;
  if (roleFilter.value === 'ADMIN') {
    list = list.filter(u => u.Role === 'ADMIN');
  } else if (roleFilter.value === 'USER') {
    list = list.filter(u => u.Role !== 'ADMIN');
  } else if (roleFilter.value === 'BANNED') {
    list = list.filter(u => u.Status === 'BANNED');
  }
  return list;
});

const onSearchInput = () => {
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    fetchUsers(keyword.value);
  }, 300);
};

const clearSearch = () => {
  keyword.value = '';
  fetchUsers('');
};

const openBanModal = (user) => {
  userToBan.value = user;
};

const confirmBan = async () => {
  if (!userToBan.value) return;
  actionLoading.value = true;
  const target = userToBan.value;
  try {
    const res = await adminApi.banUser(target.UserID);
    if (res.success) {
      target.Status = 'BANNED';
      showToast(`Đã khóa tài khoản "${target.FullName}" thành công!`);
      userToBan.value = null;
    } else {
      showToast(res.message || 'Lỗi khi khóa tài khoản', 'error');
    }
  } catch (e) {
    console.error(e);
    showToast('Lỗi khi gọi API khóa tài khoản', 'error');
  } finally {
    actionLoading.value = false;
  }
};

const handleUnban = async (user) => {
  actionLoading.value = true;
  try {
    const res = await adminApi.unbanUser(user.UserID);
    if (res.success) {
      user.Status = 'ACTIVE';
      showToast(`Đã mở khóa tài khoản "${user.FullName}" thành công!`);
    } else {
      showToast(res.message || 'Lỗi khi mở khóa', 'error');
    }
  } catch (e) {
    console.error(e);
    showToast('Lỗi khi gọi API mở khóa', 'error');
  } finally {
    actionLoading.value = false;
  }
};

const changeRole = async (user, newRole) => {
  actionLoading.value = true;
  try {
    const res = await adminApi.updateUserRole(user.UserID, newRole);
    if (res.success) {
      user.Role = newRole;
      const roleText = newRole === 'ADMIN' ? 'Quản trị viên (ADMIN)' : 'Khách hàng (USER)';
      showToast(`Đã cập nhật vai trò của "${user.FullName}" thành ${roleText}!`);
      // Báo Navbar tải lại danh sách Admin
      window.dispatchEvent(new CustomEvent('admin-role-updated'));
    } else {
      showToast(res.message || 'Lỗi cập nhật vai trò', 'error');
    }
  } catch (e) {
    console.error(e);
    showToast('Lỗi khi gọi API cập nhật vai trò', 'error');
  } finally {
    actionLoading.value = false;
  }
};

const getStatusBadge = (st) => {
  if (st === 'ACTIVE') return 'badge-success';
  if (st === 'BANNED') return 'badge-danger';
  if (st === 'LOCKED') return 'badge-warning';
  return 'badge-draft';
};

const formatStatus = (st) => {
  if (st === 'ACTIVE') return 'Hoạt động';
  if (st === 'BANNED') return 'Đã khóa';
  if (st === 'LOCKED') return 'Tạm khóa 15p';
  return st;
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('vi-VN');
};

const onAdminChanged = () => {
  fetchUsers(keyword.value);
};

onMounted(() => {
  fetchUsers();
  window.addEventListener('admin-changed', onAdminChanged);
});

onUnmounted(() => {
  window.removeEventListener('admin-changed', onAdminChanged);
});
</script>

<style scoped>
.panel-container {
  padding: 24px;
  position: relative;
}

/* TOAST NOTIFICATION */
.admin-toast {
  position: fixed;
  top: 80px;
  right: 28px;
  z-index: 999;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  border-radius: 12px;
  font-size: 0.88rem;
  font-weight: 700;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.18);
  backdrop-filter: blur(12px);
}

.toast-success {
  background: rgba(16, 185, 129, 0.95);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.toast-error {
  background: rgba(239, 68, 68, 0.95);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: all 0.25s ease;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translateY(-12px);
}

.panel-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.toolbar-title h2 {
  font-size: 1.35rem;
  font-weight: 800;
  color: #0f172a;
}

.toolbar-title p {
  font-size: 0.85rem;
  color: #64748b;
  margin-top: 2px;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

/* FILTER TABS */
.filter-tabs {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.filter-btn {
  padding: 6px 14px;
  border-radius: 20px;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  color: #64748b;
  font-family: inherit;
  transition: all 0.2s;
}

.filter-btn:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.filter-btn.active {
  background: #0f172a;
  color: #ffffff;
  border-color: #0f172a;
}

.search-wrap {
  position: relative;
  width: 280px;
}

.search-input {
  padding-right: 32px;
}

.btn-clear {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
}

.user-info-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-thumb {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  object-fit: cover;
}

.user-name {
  font-weight: 700;
  color: #0f172a;
  display: flex;
  align-items: center;
  gap: 4px;
}

.user-id {
  font-size: 0.72rem;
  color: #64748b;
}

.font-mono {
  font-family: monospace;
}

.row-admin {
  background: rgba(37, 99, 235, 0.03);
}

.action-cell-btns {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

.btn-role-promote {
  background: #eff6ff;
  color: #2563eb;
  border: 1px solid rgba(37, 99, 235, 0.3);
  font-size: 0.76rem;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-role-promote:hover {
  background: #2563eb;
  color: #ffffff;
}

.warning-box {
  background: #fef2f2;
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: #991b1b;
  padding: 12px 14px;
  border-radius: 8px;
  margin-top: 14px;
  font-size: 0.85rem;
  line-height: 1.5;
}
</style>
