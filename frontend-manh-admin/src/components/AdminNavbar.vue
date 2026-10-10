<template>
  <header class="admin-header glass-panel">
    <div class="header-left">
      <div class="brand-title">
        <img src="/images/logo-mint.png" class="brand-logo-img" alt="TaVivu" />
        <span class="brand-logo-text">TaVivu</span>
        <span class="portal-tag">ADMIN PORTAL</span>
      </div>
    </div>

    <div class="header-right">
      <!-- BỘ CHỌN & CHUYỂN ĐỔI NHIỀU ADMIN -->
      <div class="admin-dropdown-wrap" ref="dropdownRef">
        <button class="admin-profile-btn" @click="isOpen = !isOpen" :title="'Đang đăng nhập: ' + currentAdminName">
          <img :src="currentAdminAvatar" class="admin-avatar" alt="Avatar" />
          <div class="admin-meta">
            <div class="admin-name-row">
              <span class="admin-name">{{ currentAdminName }}</span>
              <span class="admin-badge">ADMIN</span>
            </div>
            <span class="admin-role">Quản trị viên</span>
          </div>
          <svg class="dropdown-chevron" :class="{ 'rotate': isOpen }" width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>

        <!-- Menu dropdown chọn tài khoản Admin -->
        <transition name="fade-slide">
          <div v-if="isOpen" class="admin-dropdown-menu">
            <div class="dropdown-header">
              <div class="header-title-row">
                <span class="header-label">DANH SÁCH QUẢN TRỊ VIÊN</span>
                <span class="header-count">{{ adminList.length }} ADMIN</span>
              </div>
              <p class="header-sub">Danh sách tài khoản Quản trị viên trong hệ thống</p>
            </div>

            <div class="dropdown-list">
              <div 
                v-for="adm in adminList" 
                :key="adm.UserID"
                :class="['admin-item', adm.UserID === currentAdminId ? 'active' : '']"
              >
                <img :src="adm.AvatarURL || defaultAvatar" class="item-avatar" alt="Admin" />
                <div class="item-info">
                  <div class="item-name-wrap">
                    <span class="item-name">{{ adm.FullName }}</span>
                    <span v-if="adm.UserID === currentAdminId" class="current-tag">Đang đăng nhập</span>
                  </div>
                </div>
                <span v-if="adm.UserID === currentAdminId" class="check-icon">✓</span>
              </div>
            </div>

            <div class="dropdown-footer">
              <button class="btn-manage-users" @click="goToUsersTab">
                <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
                Phân quyền ADMIN
              </button>
              <button class="btn-logout-dropdown" @click="handleLogout">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                Đăng xuất tài khoản
              </button>
            </div>
          </div>
        </transition>
      </div>

      <!-- Nút Đăng xuất nhanh ngoài header -->
      <button class="btn-quick-logout" @click="handleLogout" title="Đăng xuất khỏi Cổng Quản trị">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
          <polyline points="16 17 21 12 16 7"></polyline>
          <line x1="21" y1="12" x2="9" y2="12"></line>
        </svg>
        <span>Đăng xuất</span>
      </button>
    </div>
  </header>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import adminApi from '../services/api';

const emit = defineEmits(['change-tab', 'admin-switched', 'logout']);

const defaultAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100';

const isOpen = ref(false);
const dropdownRef = ref(null);
const adminList = ref([]);
const currentAdmin = ref(null);

const currentAdminId = computed(() => {
  return currentAdmin.value?.userId || currentAdmin.value?.UserID || 'U02';
});

const currentAdminName = computed(() => {
  return currentAdmin.value?.fullName || currentAdmin.value?.FullName || 'Nguyễn Văn Mạnh';
});

const currentAdminEmail = computed(() => {
  return currentAdmin.value?.email || currentAdmin.value?.Email || 'manh.nguyen@webdulich.com';
});

const currentAdminAvatar = computed(() => {
  return currentAdmin.value?.avatarUrl || currentAdmin.value?.AvatarURL || defaultAvatar;
});

const fetchAdmins = async () => {
  try {
    const list = await adminApi.getAdmins();
    if (list && list.length > 0) {
      adminList.value = list;
    }
  } catch (e) {
    console.warn('Lỗi lấy danh sách admin:', e);
  }
};

const initCurrentAdmin = async () => {
  await adminApi.ensureToken();
  const profile = adminApi.getCurrentAdmin();
  if (profile) {
    currentAdmin.value = profile;
  } else if (adminList.value.length > 0) {
    currentAdmin.value = adminList.value[0];
  }
};

const goToUsersTab = () => {
  isOpen.value = false;
  emit('change-tab', 'users');
  window.dispatchEvent(new CustomEvent('navigate-tab', { detail: 'users' }));
};

const handleLogout = () => {
  isOpen.value = false;
  adminApi.logout();
  emit('logout');
  window.dispatchEvent(new CustomEvent('admin-logged-out'));
};

const handleClickOutside = (e) => {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target)) {
    isOpen.value = false;
  }
};

const onAdminRoleUpdated = () => {
  fetchAdmins();
};

onMounted(async () => {
  document.addEventListener('click', handleClickOutside);
  window.addEventListener('admin-role-updated', onAdminRoleUpdated);
  await fetchAdmins();
  await initCurrentAdmin();
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  window.removeEventListener('admin-role-updated', onAdminRoleUpdated);
});
</script>

<style scoped>
.admin-header {
  height: 68px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 28px;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(226, 232, 240, 0.8);
  border-radius: 0;
  box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.08);
  position: sticky;
  top: 0;
  z-index: 100;
}

.brand-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.brand-logo-img {
  width: 48px;
  height: 36px;
  object-fit: contain;
  filter: brightness(0.85) saturate(1.1);
}

.brand-logo-text {
  font-size: 1.55rem;
  font-weight: 800;
  color: var(--primary-mint, #00b99a);
  letter-spacing: -0.5px;
}

.portal-tag {
  font-size: 0.72rem;
  font-weight: 800;
  background: var(--primary-color, #007d68);
  color: #ffffff;
  padding: 3px 8px;
  border-radius: 6px;
  letter-spacing: 0.8px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

/* ADMIN DROPDOWN WRAPPER */
.admin-dropdown-wrap {
  position: relative;
}

.admin-profile-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 14px 6px 8px;
  border-radius: 30px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  cursor: pointer;
  transition: all 0.2s ease;
  outline: none;
}

.admin-profile-btn:hover {
  background: #ffffff;
  border-color: #cbd5e1;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.admin-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--primary-color, #007d68);
}

.admin-meta {
  display: flex;
  flex-direction: column;
  text-align: left;
}

.admin-name-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.admin-name {
  font-size: 0.88rem;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.2;
}

.admin-badge {
  font-size: 0.65rem;
  font-weight: 800;
  background: var(--primary-light, #e6f7f2);
  color: var(--primary-color, #007d68);
  border: 1px solid rgba(0, 185, 154, 0.25);
  padding: 1px 6px;
  border-radius: 10px;
  letter-spacing: 0.4px;
}

.admin-role {
  font-size: 0.72rem;
  color: #64748b;
  max-width: 170px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dropdown-chevron {
  color: #64748b;
  transition: transform 0.2s ease;
  margin-left: 2px;
}

.dropdown-chevron.rotate {
  transform: rotate(180deg);
}

/* DROPDOWN MENU */
.admin-dropdown-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 320px;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.15);
  padding: 12px;
  z-index: 200;
}

.dropdown-header {
  padding: 6px 8px 10px 8px;
  border-bottom: 1px solid #f1f5f9;
}

.header-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-label {
  font-size: 0.75rem;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: 0.5px;
}

.header-count {
  font-size: 0.7rem;
  font-weight: 700;
  background: var(--primary-light, #e6f7f2);
  color: var(--primary-color, #007d68);
  padding: 2px 7px;
  border-radius: 10px;
}

.header-sub {
  font-size: 0.72rem;
  color: #64748b;
  margin-top: 4px;
}

.dropdown-list {
  max-height: 240px;
  overflow-y: auto;
  padding: 6px 0;
}

.admin-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 10px;
  cursor: default;
  transition: background 0.15s ease;
}

.admin-item.active {
  background: var(--primary-light, #e6f7f2);
  border: 1px solid rgba(0, 185, 154, 0.25);
}

.item-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  object-fit: cover;
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-name-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
}

.item-name {
  font-size: 0.84rem;
  font-weight: 700;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.current-tag {
  font-size: 0.62rem;
  font-weight: 700;
  background: #10b981;
  color: #ffffff;
  padding: 1px 5px;
  border-radius: 6px;
}

.item-email {
  font-size: 0.72rem;
  color: #64748b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}

.check-icon {
  font-size: 0.9rem;
  font-weight: 800;
  color: var(--primary-color, #007d68);
}

.dropdown-footer {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #f1f5f9;
}

.btn-manage-users {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: #f1f5f9;
  border: none;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 0.78rem;
  font-weight: 600;
  color: #334155;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-manage-users:hover {
  background: #e2e8f0;
  color: #0f172a;
}

.btn-logout-dropdown {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: #fef2f2;
  border: 1px solid #fee2e2;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 0.78rem;
  font-weight: 600;
  color: #ef4444;
  cursor: pointer;
  margin-top: 6px;
  transition: all 0.2s;
}

.btn-logout-dropdown:hover {
  background: #fee2e2;
  color: #dc2626;
}

.btn-quick-logout {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.25);
  color: #ef4444;
  padding: 8px 14px;
  border-radius: 10px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-quick-logout:hover {
  background: rgba(239, 68, 68, 0.2);
  border-color: #ef4444;
  color: #dc2626;
  transform: translateY(-1px);
}

/* ANIMATION */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.2s ease-out;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
