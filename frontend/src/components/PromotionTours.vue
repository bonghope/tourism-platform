<template>
  <section id="promo-adventure-section" class="promotion-section">
    <div class="promotion-content">
      <div class="promotion-heading"><span class="eyebrow">ƯU ĐÃI TAVIVU</span><h2>Tour đang giảm giá</h2><p>Chọn hành trình yêu thích với mức giá ưu đãi. Giá hiển thị đã giảm, áp dụng cho đơn đặt mới khi tour còn mở bán và còn chỗ.</p></div>
      <p v-if="loading" role="status">Đang tải tour khuyến mãi…</p>
      <div v-else-if="error" role="alert"><p>{{ error }}</p><button @click="fetchPromotions">Thử lại</button></div>
      <div v-else-if="tours.length" class="promotion-grid"><TourCard v-for="tour in tours" :key="tour.TourID" :tour="tour" /></div>
      <p v-else>Hiện chưa có tour khuyến mãi còn mở bán. Bạn có thể xem các chuyến đi khác tại mục Tour.</p>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted } from 'vue';
import TourCard from './TourCard.vue';
import { useAuthStore } from '../stores/auth';
const authStore = useAuthStore();
const tours = ref([]);
const loading = ref(true);
const error = ref('');
let pendingRequest;
const fetchPromotions = async () => {
  pendingRequest?.abort();
  const request = new AbortController();
  pendingRequest = request;
  loading.value = true;
  error.value = '';
  try {
    const base = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api').replace(/\/$/, '');
    const headers = authStore.token ? { Authorization: `Bearer ${authStore.token}` } : {};
    const response = await fetch(`${base}/tours?promotion=true&limit=4`, { headers, signal: request.signal });
    const json = await response.json();
    if (!response.ok || !json.success) throw new Error(json.message || 'Không thể tải tour khuyến mãi.');
    tours.value = json.data;
  } catch (err) {
    if (err.name !== 'AbortError') error.value = 'Không thể tải tour khuyến mãi. Vui lòng thử lại.';
  } finally {
    if (pendingRequest === request) loading.value = false;
  }
};
onMounted(fetchPromotions);
watch(() => authStore.token, fetchPromotions);
onUnmounted(() => pendingRequest?.abort());
</script>

<style scoped>
.promotion-section {
  padding: 64px 24px;
  background: var(--page-background);
  scroll-margin-top: 105px;
}
.promotion-content { max-width: 1200px; margin: 0 auto; }
.promotion-heading { max-width: 680px; margin-bottom: 28px; }
.eyebrow { color: #007d68; font-size: .8rem; font-weight: 800; letter-spacing: .12em; }
h2 { margin: 10px 0; color: #183d35; font-size: 2rem; }
.promotion-heading p { color: #62766e; line-height: 1.7; margin: 0; }
.promotion-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 28px; }
button { background: #007d68; color: white; padding: 10px 20px; border: 0; border-radius: 10px; cursor: pointer; }
.promotion-grid :deep(.tour-card) { aspect-ratio: 1.35; }
@media (max-width: 600px) { .promotion-grid { grid-template-columns: minmax(0, 1fr); } .promotion-section { padding: 40px 20px; } }
</style>
