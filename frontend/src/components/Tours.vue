<template>
  <div class="tours-page">
    <div class="page-header hero-banner">
      <div class="hero-overlay"></div>
      <h1 class="page-title">Tất Cả Các Chuyến Đi</h1>
      <p class="page-subtitle">Hành trình khám phá thế giới của bạn bắt đầu từ đây</p>
    </div>

    <div class="tours-body-wrapper">      <div class="tours-content">
        <TourFilters :model-value="filters" @update:model-value="Object.assign(filters, $event)" :error="filterError" @apply="applyFilters" @reset="resetFilters" />
        <p v-if="!loading && !error" class="result-count" role="status">Tìm thấy {{ totalItems }} tour phù hợp</p>
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
            Không có tour phù hợp. Hãy thử mở rộng khoảng giá hoặc ngày khởi hành.
            <button class="btn-reset" @click="resetFilters">Xóa bộ lọc</button>
          </div>
        </div>
        <nav v-if="!loading && !error && totalPages > 1" class="pagination" aria-label="Phân trang tour">
          <button :disabled="page === 1" @click="changePage(page - 1)">Trang trước</button>
          <span>Trang {{ page }} / {{ totalPages }}</span>
          <button :disabled="page === totalPages" @click="changePage(page + 1)">Trang sau</button>
        </nav>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import TourCard from './TourCard.vue';
import TourFilters from './TourFilters.vue';
import { useAuthStore } from '../stores/auth';

const route = useRoute();
const router = useRouter();
const tours = ref([]);
const loading = ref(true);
const error = ref(null);
const authStore = useAuthStore();
const emptyFilters = () => ({ keyword: '', minPrice: '', maxPrice: '', startDate: '', endDate: '' });
const filters = reactive(emptyFilters());
const appliedFilters = ref(emptyFilters());
const filterError = ref('');
const page = ref(1);
const totalItems = ref(0);
const totalPages = ref(0);
let pendingRequest;

const syncUrlQuery = () => {
  const query = {};
  if (appliedFilters.value.keyword) query.keyword = appliedFilters.value.keyword;
  if (appliedFilters.value.minPrice) query.minPrice = appliedFilters.value.minPrice;
  if (appliedFilters.value.maxPrice) query.maxPrice = appliedFilters.value.maxPrice;
  if (appliedFilters.value.startDate) query.startDate = appliedFilters.value.startDate;
  if (appliedFilters.value.endDate) query.endDate = appliedFilters.value.endDate;
  if (page.value > 1) query.page = String(page.value);

  try {
    sessionStorage.setItem('saved_tour_filters', JSON.stringify({ ...appliedFilters.value, page: page.value }));
  } catch (e) {}

  router.replace({ query }).catch(() => {});
};

const loadSavedFilters = () => {
  const q = route.query;
  const hasQuery = q.keyword || q.minPrice || q.maxPrice || q.startDate || q.endDate || q.page;
  if (hasQuery) {
    if (q.keyword) filters.keyword = String(q.keyword);
    if (q.minPrice) filters.minPrice = String(q.minPrice);
    if (q.maxPrice) filters.maxPrice = String(q.maxPrice);
    if (q.startDate) filters.startDate = String(q.startDate);
    if (q.endDate) filters.endDate = String(q.endDate);
    if (q.page && Number(q.page) >= 1) page.value = Number(q.page);
    appliedFilters.value = { ...filters };
    return;
  }

  try {
    const saved = sessionStorage.getItem('saved_tour_filters');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed) {
        if (parsed.keyword) filters.keyword = String(parsed.keyword);
        if (parsed.minPrice) filters.minPrice = String(parsed.minPrice);
        if (parsed.maxPrice) filters.maxPrice = String(parsed.maxPrice);
        if (parsed.startDate) filters.startDate = String(parsed.startDate);
        if (parsed.endDate) filters.endDate = String(parsed.endDate);
        if (parsed.page && Number(parsed.page) >= 1) page.value = Number(parsed.page);
        appliedFilters.value = { ...filters };
        syncUrlQuery();
      }
    }
  } catch (e) {}
};

const applyFilters = () => {
  filterError.value = '';
  const hasValue = v => v !== '';
  if ([filters.minPrice, filters.maxPrice].some(v => hasValue(v) && (!Number.isFinite(Number(v)) || Number(v) < 0))
    || (hasValue(filters.minPrice) && hasValue(filters.maxPrice) && Number(filters.minPrice) > Number(filters.maxPrice))) {
    filterError.value = 'Khoảng giá không hợp lệ. Giá đến phải lớn hơn hoặc bằng giá từ.';
    return;
  }
  if (filters.startDate && filters.endDate && filters.startDate > filters.endDate) {
    filterError.value = 'Ngày kết thúc phải bằng hoặc sau ngày bắt đầu.';
    return;
  }
  appliedFilters.value = { ...filters, keyword: filters.keyword.trim() };
  page.value = 1;
  syncUrlQuery();
  fetchTours();
};

const resetFilters = () => {
  Object.assign(filters, emptyFilters());
  appliedFilters.value = emptyFilters();
  page.value = 1;
  try {
    sessionStorage.removeItem('saved_tour_filters');
  } catch (e) {}
  router.replace({ query: {} }).catch(() => {});
  fetchTours();
};

const changePage = value => {
  page.value = value;
  syncUrlQuery();
  fetchTours();
};

const fetchTours = async () => {
  pendingRequest?.abort();
  const request = new AbortController();
  pendingRequest = request;
  loading.value = true;
  error.value = null;
  try {
    const apiBase = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api').replace(/\/$/, '');
    const params = new URLSearchParams({ page: String(page.value), limit: '9' });
    Object.entries(appliedFilters.value).forEach(([key, value]) => { if (value !== '') params.set(key, value); });
    const headers = authStore.token ? { Authorization: `Bearer ${authStore.token}` } : {};
    const res = await fetch(`${apiBase}/tours?${params}`, { headers, signal: request.signal });
    const json = await res.json();
    if (json.success) {
      tours.value = json.data;
      totalItems.value = json.totalItems;
      totalPages.value = json.totalPages;
    } else {
      error.value = json.message;
    }
  } catch (err) {
    if (err.name === 'AbortError') return;
    error.value = 'Không thể kết nối đến Máy chủ Backend.';
  } finally {
    if (pendingRequest === request) loading.value = false;
  }
};

onMounted(() => {
  loadSavedFilters();
  window.scrollTo(0, 0);
  fetchTours();
});
watch(() => authStore.token, fetchTours);
onUnmounted(() => pendingRequest?.abort());
</script>

<style scoped>
.btn-reset, .pagination button { padding: 12px 20px; border-radius: 10px; font: inherit; font-weight: 600; cursor: pointer; }
.btn-reset, .pagination button { border: 1px solid #cadfd5; background: white; color: #295c4c; }
.result-count { margin-bottom: 20px; color: #3e6658; }
.empty-state { grid-column: 1 / -1; padding: 35px; text-align: center; }
.empty-state button { display: block; margin: 18px auto 0; }
.pagination { display: flex; justify-content: center; align-items: center; gap: 16px; margin-top: 32px; }
.pagination button:disabled { opacity: .45; cursor: default; }
@media (max-width: 480px) { .tours-grid { grid-template-columns: minmax(0, 1fr) !important; } .pagination { gap: 8px; font-size: .8rem; } .pagination button { padding: 10px; } }
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
  background: var(--page-background);
  overflow: hidden;
  padding: 60px 0 100px;
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
