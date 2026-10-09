<template>
  <nav class="navbar glass-panel">
    <div class="nav-brand">
      <router-link to="/" class="logo-link"><span class="logo">TaVivu</span></router-link>
    </div>

    <div class="nav-links">
      <router-link to="/">Trang chủ</router-link>
      <router-link to="/tours">Tour</router-link>
      <router-link to="/destinations">Điểm đến</router-link>
      <a href="#promo-adventure-section" @click="scrollToPromo">Khuyến mãi</a>

      <router-link to="/about">Về chúng tôi</router-link>
    </div>

    <div class="nav-actions">
      <!-- Khi ĐÃ đăng nhập -->
      <div v-if="authStore.isAuthenticated && authStore.user" class="user-profile-menu" @click="menuOpen = !menuOpen">
        <img :src="authStore.userAvatar" class="avatar-thumbnail" alt="Avatar" />
        <span class="user-fullname">{{ authStore.userName }}</span>
        <span class="caret-down">▾</span>

        <div v-if="menuOpen" class="user-dropdown-pop" @click.stop>
          <div class="dropdown-user-info">
            <strong>{{ authStore.userName }}</strong>
            <small>{{ authStore.userIdentifier }}</small>
          </div>
          <router-link to="/profile" class="pop-link" @click="menuOpen = false">
            Hồ sơ cá nhân
          </router-link>
          <router-link to="/bookings" class="pop-link" @click="menuOpen = false">Lịch sử đặt tour</router-link>
          <div class="pop-divider"></div>
          <button class="pop-link pop-logout" @click="handleLogout">
            Đăng xuất
          </button>
        </div>
      </div>

      <!-- Khi CHƯA đăng nhập -->
      <template v-else>
        <button class="btn-login" @click="openAuthModal('login')">Đăng nhập</button>
        <button class="btn-register" @click="openAuthModal('register')">Đăng ký ngay</button>
      </template>
    </div>

    <!-- Modal Xác thực Module 1 -->
    <AuthModal 
      :is-open="isAuthOpen" 
      :initial-tab="authTab"
      @close="isAuthOpen = false" 
    />
  </nav>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useToastStore } from '../stores/toast';
import AuthModal from './AuthModal.vue';

const router = useRouter();
const authStore = useAuthStore();
const toastStore = useToastStore();

const isAuthOpen = ref(false);
const authTab = ref('login');
const menuOpen = ref(false);

const openAuthModal = (tab) => {
  authTab.value = tab;
  isAuthOpen.value = true;
};

const handleLogout = async () => {
  menuOpen.value = false;
  await authStore.logout();
  toastStore.info('Đã đăng xuất.');
  router.push('/');
};

const scrollToPromo = (e) => {
  e.preventDefault();
  const el = document.getElementById('promo-adventure-section') || document.querySelector('.promo-adventure-banner');
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' });
  } else {
    router.push('/');
  }
};

const closeMenuOutside = (e) => {
  if (!e.target.closest('.user-profile-menu')) {
    menuOpen.value = false;
  }
};

onMounted(() => {
  window.addEventListener('click', closeMenuOutside);
});

onUnmounted(() => {
  window.removeEventListener('click', closeMenuOutside);
});
</script>

<style scoped>
.navbar {
  position: fixed;
  top: 15px;
  left: 50%;
  transform: translateX(-50%);
  width: 90%;
  max-width: 1200px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  z-index: 1000;
  border-radius: 32px;
}
.logo-link {
  text-decoration: none;
}
.logo {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--primary-color);
  letter-spacing: -0.5px;
}
.nav-links {
  display: flex;
  gap: 18px;
}
.nav-links a {
  text-decoration: none;
  color: var(--text-main);
  font-weight: 500;
  transition: color 0.3s;
}
.nav-links a:hover,
.nav-links a.router-link-exact-active {
  color: var(--primary-color);
}
.nav-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}
.btn-login {
  padding: 10px 24px;
  background-color: transparent;
  color: var(--secondary-color);
  border: 1px solid var(--secondary-color);
  border-radius: 24px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}
.btn-login:hover {
  background-color: rgba(15, 23, 42, 0.05);
}
.btn-register {
  padding: 10px 24px;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 24px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  font-family: inherit;
}
.btn-register:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(37, 99, 235, 0.3);
}

/* Menu người dùng đã đăng nhập */
.user-profile-menu {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(226, 232, 240, 0.8);
  padding: 4px 14px 4px 5px;
  border-radius: 24px;
  cursor: pointer;
  user-select: none;
}
.avatar-thumbnail {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}
.user-fullname {
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--secondary-color);
  max-width: 120px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.caret-down {
  font-size: 0.75rem;
  color: var(--text-muted);
}
.user-dropdown-pop {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  width: 200px;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
  padding: 8px 0;
  z-index: 1000;
}
.dropdown-user-info {
  padding: 8px 16px 10px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  border-bottom: 1px solid #e2e8f0;
}
.dropdown-user-info strong {
  font-size: 0.88rem;
}
.dropdown-user-info small {
  color: #64748b;
  font-size: 0.75rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.pop-link {
  display: block;
  padding: 8px 16px;
  font-size: 0.85rem;
  color: var(--text-main);
  text-decoration: none;
  font-weight: 500;
  transition: background 0.15s;
  border: none;
  width: 100%;
  text-align: left;
  background: transparent;
  cursor: pointer;
  font-family: inherit;
}
.pop-link:hover {
  background: #f1f5f9;
  color: var(--primary-color);
}
.pop-divider {
  height: 1px;
  background: #e2e8f0;
  margin: 4px 0;
}
.pop-logout {
  color: #ef4444;
}
.pop-logout:hover {
  background: #fef2f2;
  color: #dc2626;
}
</style>

<style scoped>
@media (max-width: 1050px) { .navbar { width: 96%; padding: 0 16px; } .nav-links { gap: 12px; font-size: .85rem; } .nav-actions .btn-register { display:none; } }
@media (max-width: 720px) { .navbar { border-radius: 20px; height:auto; min-height:64px; flex-wrap:wrap; padding:10px 16px; gap:8px; } .nav-links { order:3; width:100%; overflow-x:auto; white-space:nowrap; padding-bottom:4px; } .btn-login { padding:6px 12px; } }
</style>
