<template>
  <div class="tours-page">
    <div class="page-header hero-banner">
      <div class="hero-overlay"></div>
      <h1 class="page-title">Tất Cả Các Chuyến Đi</h1>
      <p class="page-subtitle">Hành trình khám phá thế giới của bạn bắt đầu từ đây</p>
    </div>

    <div class="tours-body-wrapper">
      <div class="brush-decor-tours brush-tours-left"></div>
      <div class="brush-decor-tours brush-tours-right"></div>
      <div class="tours-content">
        <div v-if="loading" class="loading-state">
          <div class="spinner"></div>
          <p>Đang tải danh sách Tour...</p>
        </div>
        
        <div v-else-if="error" class="error-state glass-panel">
          <p>⚠️ {{ error }}</p>
          <button @click="fetchTours" class="btn-retry">Thử lại</button>
        </div>

        <div v-else class="tours-grid">
          <TourCard v-for="tour in tours" :key="tour.TourID" :tour="tour" />
          <div v-if="tours.length === 0" class="empty-state glass-panel">
            Hiện tại chưa có tour nào khả dụng.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import TourCard from './TourCard.vue';

const tours = ref([]);
const loading = ref(true);
const error = ref(null);

const fetchTours = async () => {
  loading.value = true;
  error.value = null;
  try {
    // Không truyền limit để lấy tất cả, hoặc truyền limit lớn (ví dụ: 50)
    const res = await fetch('http://localhost:3000/api/tours?limit=50');
    const json = await res.json();
    if (json.success) {
      tours.value = json.data;
    } else {
      error.value = json.message;
    }
  } catch (err) {
    error.value = 'Không thể kết nối đến Máy chủ Backend.';
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  window.scrollTo(0, 0);
  fetchTours();
});
</script>

<style scoped>
.tours-page {
  padding-bottom: 80px;
}
.page-header {
  height: 40vh;
  min-height: 300px;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  background: url('https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80') center/cover;
}
.hero-overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(15, 23, 42, 0.6);
}
.page-title {
  position: relative;
  z-index: 1;
  font-size: 3rem;
  font-weight: 800;
  color: white;
  margin-bottom: 12px;
}
.page-subtitle {
  position: relative;
  z-index: 1;
  font-size: 1.2rem;
  color: #e2e8f0;
}
.tours-body-wrapper {
  position: relative;
  width: 100%;
  background: linear-gradient(135deg, #f0fdfa 0%, #ffffff 42%, #fffbeb 100%);
  overflow: hidden;
  padding: 60px 0 100px;
}

.brush-decor-tours {
  position: absolute;
  pointer-events: none;
  z-index: 0;
  opacity: 0.45;
  filter: blur(50px);
}
.brush-tours-left {
  top: -5%;
  left: -5%;
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(45, 212, 191, 0.35) 0%, rgba(255, 255, 255, 0) 70%);
}
.brush-tours-right {
  bottom: -5%;
  right: -5%;
  width: 520px;
  height: 520px;
  background: radial-gradient(circle, rgba(251, 146, 60, 0.3) 0%, rgba(255, 255, 255, 0) 70%);
}

.tours-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  position: relative;
  z-index: 1;
}
.tours-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 32px;
}
.loading-state {
  text-align: center;
  padding: 60px 0;
  color: var(--text-muted);
}
.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid rgba(37, 99, 235, 0.2);
  border-left-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
