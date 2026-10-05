<template>
  <div class="destinations-page">
    <div class="header-section">
      <h1>Khám phá các Điểm đến</h1>
      <p>Chọn một địa danh để xem các Tour gợi ý</p>
      
      <div class="search-bar glass-panel" style="margin-top: 30px;">
        <input type="text" v-model="searchQuery" placeholder="Nhập tên địa danh bạn muốn đến (VD: Đà Lạt)..." class="search-input" @keyup.enter="fetchDestinations" />
        <button class="btn-search" @click="fetchDestinations">Tìm kiếm</button>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Đang tải danh sách địa danh...</p>
    </div>
    
    <div v-else-if="error" class="error-state glass-panel">
      <p>⚠️ {{ error }}</p>
    </div>

    <div v-else class="dest-grid">
      <DestinationCard 
        v-for="dest in destinations" 
        :key="dest.DestinationID" 
        :destination="dest" 
      />
      
      <div v-if="destinations.length === 0" class="empty-state glass-panel" style="grid-column: 1 / -1;">
        Chưa có địa danh nào được đăng tải.
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import DestinationCard from './DestinationCard.vue';

const destinations = ref([]);
const loading = ref(true);
const error = ref(null);
const searchQuery = ref('');

const fetchDestinations = async () => {
  loading.value = true;
  error.value = null;
  try {
    const url = searchQuery.value 
      ? `http://localhost:3000/api/destinations/search?keyword=${encodeURIComponent(searchQuery.value)}`
      : `http://localhost:3000/api/destinations/search`;
    const res = await fetch(url);
    const json = await res.json();
    if (json.success) {
      destinations.value = json.data;
    } else {
      error.value = json.message;
    }
  } catch (err) {
    error.value = 'Lỗi kết nối Máy chủ Backend.';
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchDestinations();
});
</script>

<style scoped>
.destinations-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 100px 20px 60px;
}
.header-section {
  text-align: center;
  margin-bottom: 50px;
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
.search-bar {
  display: flex;
  width: 100%;
  max-width: 650px;
  margin: 0 auto;
  padding: 10px;
  border-radius: 50px;
}
.search-input {
  flex: 1;
  border: none;
  background: transparent;
  padding: 0 24px;
  font-size: 1.1rem;
  font-family: inherit;
  outline: none;
  color: var(--text-main);
}
.btn-search {
  padding: 14px 40px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 40px;
  font-size: 1.05rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}
.btn-search:hover {
  transform: scale(1.05);
  box-shadow: 0 10px 20px rgba(37, 99, 235, 0.3);
}
.dest-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 32px;
}
.loading-state, .error-state {
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
.empty-state {
  text-align: center;
  padding: 40px;
  color: var(--text-muted);
}
</style>
