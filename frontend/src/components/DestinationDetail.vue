<template>
  <div class="destination-detail-page">
    <div v-if="loadingDest" class="loading-state">
      <div class="spinner"></div>
      <p>Đang tải thông tin địa danh...</p>
    </div>
    <div v-else-if="errorDest" class="error-state glass-panel">
      <p>⚠️ {{ errorDest }}</p>
      <button @click="$router.push('/destinations')" class="btn-back">Quay lại danh sách</button>
    </div>
    <template v-else>
      <div class="banner-section glass-panel">
        <img 
          :src="destination.ImageURL || 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=1200&q=80'" 
          :alt="destination.Name" 
          class="banner-image" 
          @error="handleBannerError"
        />
        <div class="banner-overlay">
          <h1>{{ destination.Name }}</h1>
        </div>
      </div>
      
      <div class="description-section glass-panel">
        <h2>Giới thiệu về {{ destination.Name }}</h2>
        <PhotoCredit :image="destination.ImageURL" />
        <p class="desc-text">{{ destination.Description || 'Chưa có bài viết mô tả chi tiết cho địa danh này. Vui lòng quay lại sau.' }}</p>
      </div>

      <div class="tours-section">
        <h2>Các Tour du lịch liên quan</h2>
        <div v-if="loadingTours" class="loading-state">
          <div class="spinner"></div>
        </div>
        <div v-else-if="errorTours" class="error-state glass-panel">
          <p>⚠️ {{ errorTours }}</p>
        </div>
        <div v-else class="tours-grid">
          <TourCard v-for="tour in tours" :key="tour.TourID" :tour="tour" />
          <div v-if="tours.length === 0" class="empty-state glass-panel" style="grid-column: 1 / -1;">
            Hiện tại chưa có Tour nào mở bán cho địa danh này.
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import TourCard from './TourCard.vue';
import PhotoCredit from './PhotoCredit.vue';

const route = useRoute();
const destId = route.params.id;

const destination = ref({});
const loadingDest = ref(true);
const errorDest = ref(null);

const tours = ref([]);
const loadingTours = ref(true);
const errorTours = ref(null);

const handleBannerError = (e) => {
  e.target.src = 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=1200&q=80';
};

const fetchDestinationDetail = async () => {
  try {
    const res = await fetch(`http://localhost:3000/api/destinations/${destId}`);
    const json = await res.json();
    if (json.success) {
      destination.value = json.data;
    } else {
      errorDest.value = json.message;
    }
  } catch (err) {
    errorDest.value = 'Lỗi kết nối Máy chủ Backend.';
  } finally {
    loadingDest.value = false;
  }
};

const fetchRelatedTours = async () => {
  try {
    const res = await fetch(`http://localhost:3000/api/destinations/${destId}/tours`);
    const json = await res.json();
    if (json.success) {
      tours.value = json.data;
    } else {
      errorTours.value = json.message;
    }
  } catch (err) {
    errorTours.value = 'Lỗi lấy danh sách Tour.';
  } finally {
    loadingTours.value = false;
  }
};

onMounted(() => {
  fetchDestinationDetail();
  fetchRelatedTours();
});
</script>

<style scoped>
.destination-detail-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 100px 20px 60px;
  display: flex;
  flex-direction: column;
  gap: 40px;
}
.banner-section {
  position: relative;
  height: 400px;
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-lg);
}
.banner-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.banner-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 80px 40px 40px;
  background: linear-gradient(to top, rgba(15, 23, 42, 0.95), transparent);
  color: white;
}
.banner-overlay h1 {
  font-size: 3.5rem;
  font-weight: 800;
  margin: 0;
  text-shadow: 2px 4px 10px rgba(0,0,0,0.5);
}
.description-section {
  padding: 40px;
}
.description-section h2 {
  font-size: 2rem;
  color: var(--secondary-color);
  margin-bottom: 20px;
}
.desc-text {
  font-size: 1.15rem;
  line-height: 1.8;
  color: var(--text-main);
  white-space: pre-wrap;
}
.tours-section h2 {
  font-size: 2.2rem;
  color: var(--secondary-color);
  margin-bottom: 30px;
  text-align: center;
}
.tours-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 32px;
}
.loading-state, .error-state, .empty-state {
  text-align: center;
  padding: 50px 0;
}
.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(37, 99, 235, 0.2);
  border-left-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}
@keyframes spin { to { transform: rotate(360deg); } }
.btn-back {
  margin-top: 20px;
  padding: 10px 20px;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}
.btn-back:hover {
  background-color: var(--accent-color);
}
</style>
