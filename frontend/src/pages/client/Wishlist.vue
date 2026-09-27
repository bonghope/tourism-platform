<template>
  <div class="wishlist-page">
    <div class="header-section">
      <h1>Danh sách Yêu thích ❤️</h1>
      <p>Lưu giữ những chuyến đi và điểm đến mơ ước của bạn</p>
    </div>

    <div class="tabs glass-panel">
      <button 
        :class="['tab-btn', activeTab === 'tours' ? 'active' : '']" 
        @click="activeTab = 'tours'"
      >
        Tours đã lưu
      </button>
      <button 
        :class="['tab-btn', activeTab === 'destinations' ? 'active' : '']" 
        @click="activeTab = 'destinations'"
      >
        Địa danh đã lưu
      </button>
    </div>

    <!-- Nội dung Tab Tour -->
    <div v-if="activeTab === 'tours'" class="tab-content">
      <div v-if="loadingTours" class="loading-state">
        <div class="spinner"></div>
        <p>Đang tải danh sách Tour...</p>
      </div>
      <div v-else-if="errorTours" class="error-state glass-panel">
        <p>⚠️ {{ errorTours }}</p>
      </div>
      <div v-else class="tours-grid">
        <TourCard v-for="tour in tours" :key="tour.TourID" :tour="tour" :isInitialFavorite="true" />
        <div v-if="tours.length === 0" class="empty-state glass-panel" style="grid-column: 1 / -1;">
          Bạn chưa lưu Tour nào vào danh sách yêu thích.
        </div>
      </div>
    </div>

    <!-- Nội dung Tab Địa danh -->
    <div v-if="activeTab === 'destinations'" class="tab-content">
      <div v-if="loadingDests" class="loading-state">
        <div class="spinner"></div>
        <p>Đang tải danh sách Địa danh...</p>
      </div>
      <div v-else-if="errorDests" class="error-state glass-panel">
        <p>⚠️ {{ errorDests }}</p>
      </div>
      <div v-else class="dest-grid">
        <DestinationCard 
          v-for="dest in destinations" 
          :key="dest.DestinationID" 
          :destination="dest" 
          :isInitialFavorite="true"
        >
          <template #footer>
            <small class="saved-time">Lưu lúc: {{ formatDate(dest.SavedAt) }}</small>
          </template>
        </DestinationCard>
        <div v-if="destinations.length === 0" class="empty-state glass-panel" style="grid-column: 1 / -1;">
          Bạn chưa lưu Địa danh nào vào danh sách yêu thích.
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import TourCard from '../../components/client/TourCard.vue';
import DestinationCard from '../../components/client/DestinationCard.vue';

const activeTab = ref('tours'); // 'tours' hoặc 'destinations'

const tours = ref([]);
const loadingTours = ref(false);
const errorTours = ref(null);

const destinations = ref([]);
const loadingDests = ref(false);
const errorDests = ref(null);

// Lấy danh sách Tour yêu thích
const fetchWishlistTours = async () => {
  loadingTours.value = true;
  try {
    const res = await fetch(`http://localhost:3000/api/tours/wishlist`);
    const json = await res.json();
    if (json.success) {
      tours.value = json.data;
    } else {
      errorTours.value = json.message;
    }
  } catch (err) {
    errorTours.value = 'Lỗi kết nối Máy chủ Backend.';
  } finally {
    loadingTours.value = false;
  }
};

// Lấy danh sách Địa danh yêu thích
const fetchWishlistDests = async () => {
  loadingDests.value = true;
  try {
    const res = await fetch(`http://localhost:3000/api/destinations/wishlist`);
    const json = await res.json();
    if (json.success) {
      destinations.value = json.data;
    } else {
      errorDests.value = json.message;
    }
  } catch (err) {
    errorDests.value = 'Lỗi kết nối Máy chủ Backend.';
  } finally {
    loadingDests.value = false;
  }
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('vi-VN');
};

watch(activeTab, (newVal) => {
  if (newVal === 'tours' && tours.value.length === 0) fetchWishlistTours();
  if (newVal === 'destinations' && destinations.value.length === 0) fetchWishlistDests();
});

onMounted(() => {
  fetchWishlistTours(); // Mặc định tải tab Tours trước
});
</script>

<style scoped>
.wishlist-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 100px 20px 60px;
}
.header-section {
  text-align: center;
  margin-bottom: 40px;
}
.header-section h1 {
  font-size: 3.5rem;
  color: var(--secondary-color);
  margin-bottom: 10px;
}
.header-section p {
  font-size: 1.2rem;
  color: var(--text-muted);
}
.tabs {
  display: flex;
  justify-content: center;
  gap: 20px;
  padding: 12px;
  margin-bottom: 40px;
  border-radius: 50px;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
}
.tab-btn {
  flex: 1;
  padding: 12px 24px;
  border: none;
  background: transparent;
  color: var(--text-main);
  font-size: 1.1rem;
  font-weight: 600;
  border-radius: 30px;
  cursor: pointer;
  transition: all 0.3s;
}
.tab-btn.active {
  background: var(--primary-color);
  color: white;
  box-shadow: 0 4px 6px rgba(37, 99, 235, 0.2);
}
.tab-content {
  animation: fadeIn 0.5s ease-out;
}
.tours-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 32px;
}
.dest-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 32px;
}
.saved-time {
  display: block;
  margin-top: 10px;
  color: #cbd5e1;
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
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
</style>
