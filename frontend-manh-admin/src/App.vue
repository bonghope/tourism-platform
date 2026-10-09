<template>
  <div class="admin-app">
    <!-- NỀN CHUYỂN ĐỘNG LIÊN TỤC GIỐNG PHẦN USER / NHÓM -->
    <div class="scenic-bg-container">
      <transition-group name="fade-bg">
        <div 
          v-for="(bg, idx) in backgroundImages" 
          :key="bg" 
          v-show="currentBgIndex === idx"
          class="scenic-bg-layer" 
          :style="{ backgroundImage: `url('${bg}')` }"
        ></div>
      </transition-group>
      <div class="scenic-overlay"></div>
    </div>

    <div class="admin-content-wrap">
      <!-- Header Admin -->
      <AdminNavbar @change-tab="currentTab = $event" @admin-switched="reloadStats" />

      <main class="admin-main">
        <div class="admin-container">
          <!-- Navigation Tabs -->
          <nav class="admin-nav-tabs glass-panel">
            <button 
              :class="['nav-tab-item', currentTab === 'overview' ? 'active' : '']" 
              @click="currentTab = 'overview'"
            >
              Tổng quan
            </button>
            <button 
              :class="['nav-tab-item', currentTab === 'users' ? 'active' : '']" 
              @click="currentTab = 'users'"
            >
              Người dùng
            </button>
            <button 
              :class="['nav-tab-item', currentTab === 'destinations' ? 'active' : '']" 
              @click="currentTab = 'destinations'"
            >
              Điểm đến
            </button>
            <button 
              :class="['nav-tab-item', currentTab === 'tours' ? 'active' : '']" 
              @click="currentTab = 'tours'"
            >
              Tour du lịch
            </button>
            <button 
              :class="['nav-tab-item', currentTab === 'bookings' ? 'active' : '']" 
              @click="currentTab = 'bookings'"
            >
              Đơn đặt chỗ
            </button>
            <button 
              :class="['nav-tab-item', currentTab === 'reviews' ? 'active' : '']" 
              @click="currentTab = 'reviews'"
            >
              Đánh giá
            </button>
          </nav>

          <!-- Viewport -->
          <div class="admin-viewport glass-panel">
            <!-- TAB TỔNG QUAN -->
            <div v-if="currentTab === 'overview'" class="overview-section">
              <div class="overview-header">
                <h2>Trung tâm Quản trị TaVivu</h2>
                <p>Tóm tắt các chỉ số vận hành và tình trạng hệ thống kết nối trực tiếp Cơ sở dữ liệu Cloud</p>
              </div>

              <div class="metrics-grid">
                <div class="metric-card" @click="currentTab = 'users'">
                  <span class="metric-label">Tổng người dùng</span>
                  <span class="metric-val">{{ counts.users }}</span>
                  <span class="metric-desc">Bấm để quản lý tài khoản</span>
                </div>
                <div class="metric-card" @click="currentTab = 'destinations'">
                  <span class="metric-label">Điểm đến</span>
                  <span class="metric-val">{{ counts.destinations }}</span>
                  <span class="metric-desc">Bấm để xem danh thắng</span>
                </div>
                <div class="metric-card" @click="currentTab = 'tours'">
                  <span class="metric-label">Tour đang bán</span>
                  <span class="metric-val">{{ counts.tours }}</span>
                  <span class="metric-desc">Bấm để cấu hình lộ trình</span>
                </div>
                <div class="metric-card" @click="currentTab = 'bookings'">
                  <span class="metric-label">Đơn đặt chỗ</span>
                  <span class="metric-val">{{ counts.bookings }}</span>
                  <span class="metric-desc">Bấm để kiểm tra thanh toán</span>
                </div>
                <div class="metric-card" @click="currentTab = 'reviews'">
                  <span class="metric-label">Đánh giá khách hàng</span>
                  <span class="metric-val">{{ counts.reviews }}</span>
                  <span class="metric-desc">Bấm để kiểm duyệt phản hồi</span>
                </div>
              </div>
            </div>

            <!-- CÁC TAB CHỨC NĂNG CỤ THỂ -->
            <AdminUsers v-else-if="currentTab === 'users'" />
            <AdminDestinations v-else-if="currentTab === 'destinations'" />
            <AdminTours v-else-if="currentTab === 'tours'" />
            <AdminBookings v-else-if="currentTab === 'bookings'" />
            <AdminReviews v-else-if="currentTab === 'reviews'" />
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import AdminNavbar from './components/AdminNavbar.vue';
import AdminUsers from './components/AdminUsers.vue';
import AdminDestinations from './components/AdminDestinations.vue';
import AdminTours from './components/AdminTours.vue';
import AdminBookings from './components/AdminBookings.vue';
import AdminReviews from './components/AdminReviews.vue';
import adminApi from './services/api';

const currentTab = ref('overview');

// Danh sách hình nền danh thắng Việt Nam chạy liên tục giống phần User / Nhóm
const backgroundImages = [
  'https://images.unsplash.com/photo-1528127269322-539801943592?w=1600&q=80', // Vịnh Hạ Long
  'https://images.unsplash.com/photo-1570789210967-2cac24afeb00?w=1600&q=80', // Sa Pa ruộng bậc thang
  'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=1600&q=80', // Phố Cổ Hội An
  'https://images.unsplash.com/photo-1669819894338-53ab7afc6958?w=1600&q=80', // Tràng An Ninh Bình
  'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1600&q=80', // Cầu Vàng Đà Nẵng
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&q=80'  // Biển đảo Phú Quốc
];

const currentBgIndex = ref(0);
let bgTimer = null;

const counts = ref({
  users: 4,
  destinations: 3,
  tours: 3,
  bookings: 3,
  reviews: 2
});

onMounted(async () => {
  // Chạy nền liên tục xoay vòng mỗi 6 giây giống trang user
  bgTimer = setInterval(() => {
    currentBgIndex.value = (currentBgIndex.value + 1) % backgroundImages.length;
  }, 6000);

  window.addEventListener('navigate-tab', (e) => {
    if (e.detail) currentTab.value = e.detail;
  });

  await reloadStats();
});

const reloadStats = async () => {
  try {
    const [u, d, t, b, r] = await Promise.all([
      adminApi.getUsers(),
      adminApi.getDestinations(),
      adminApi.getTours(),
      adminApi.getBookings(),
      adminApi.getReviews()
    ]);
    if (u?.data) counts.value.users = u.data.length;
    if (d?.data) counts.value.destinations = d.data.length;
    if (t?.data) counts.value.tours = t.data.length;
    if (b?.data) counts.value.bookings = b.data.length;
    if (r?.data) counts.value.reviews = r.data.length;
  } catch (e) {
    // Keep defaults
  }
};

onUnmounted(() => {
  if (bgTimer) clearInterval(bgTimer);
});
</script>

<style>
@import './assets/admin.css';

.admin-app {
  min-height: 100vh;
  position: relative;
  background-color: #0f172a;
}

/* KHU VỰC HÌNH NỀN CHẠY LIÊN TỤC GIỐNG NHÓM */
.scenic-bg-container {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
}

.scenic-bg-layer {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  transform: scale(1.04);
  animation: bgZoom 16s ease-in-out infinite alternate;
}

.scenic-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.78) 0%, rgba(15, 23, 42, 0.65) 50%, rgba(30, 41, 59, 0.82) 100%);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
}

.fade-bg-enter-active,
.fade-bg-leave-active {
  transition: opacity 1.5s ease-in-out;
}

.fade-bg-enter-from,
.fade-bg-leave-to {
  opacity: 0;
}

@keyframes bgZoom {
  0% { transform: scale(1); }
  100% { transform: scale(1.08); }
}

.admin-content-wrap {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.admin-main {
  flex: 1;
  padding: 24px;
}

.admin-container {
  max-width: 1300px;
  margin: 0 auto;
}

.admin-nav-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  overflow-x: auto;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  padding: 8px 12px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 8px 24px -4px rgba(0, 0, 0, 0.15);
}

.nav-tab-item {
  padding: 9px 20px;
  border-radius: 14px;
  border: 1px solid transparent;
  background: transparent;
  color: #475569;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
  white-space: nowrap;
}

.nav-tab-item:hover {
  background: rgba(255, 255, 255, 0.9);
  color: #0f172a;
}

.nav-tab-item.active {
  background: var(--primary-color);
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35);
}

.admin-viewport {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.6);
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.overview-section {
  padding: 32px 28px;
}

.overview-header {
  margin-bottom: 28px;
}

.overview-header h2 {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--secondary-color);
}

.overview-header p {
  color: var(--text-muted);
  font-size: 0.9rem;
  margin-top: 4px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 18px;
}

.metric-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  cursor: pointer;
  transition: all 0.25s ease;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
}

.metric-card:hover {
  transform: translateY(-4px);
  border-color: var(--primary-color);
  box-shadow: 0 12px 24px -4px rgba(37, 99, 235, 0.18);
}

.metric-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-muted);
}

.metric-val {
  font-size: 2.2rem;
  font-weight: 800;
  color: var(--primary-color);
  margin: 8px 0 4px;
}

.metric-desc {
  font-size: 0.78rem;
  color: #94a3b8;
}
</style>
