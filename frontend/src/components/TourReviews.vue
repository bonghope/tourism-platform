<template>
  <section class="reviews glass-panel">
    <h2>Đánh giá khách hàng</h2><p v-if="loading" role="status">Đang tải đánh giá…</p>
    <div v-else-if="error" role="alert">{{ error }} <button @click="load">Thử lại</button></div>
    <template v-else><p v-if="!reviews.length">Tour chưa có đánh giá.</p><article v-for="review in reviews" :key="review.ReviewID"><strong>{{ review.FullName }}</strong><span class="stars"> {{ '★'.repeat(Math.max(0, Math.min(5, Number(review.Rating)))) }}</span><p class="muted">{{ date(review.CreatedAt) }}</p><p>{{ review.Content }}</p><p v-if="review.OwnerReply" class="reply"><strong>TaVivu phản hồi:</strong> {{ review.OwnerReply }}</p></article><div v-if="pages > 1" class="pagination"><button :disabled="page <= 1" @click="page--">Trang trước</button><span>{{ page }} / {{ pages }}</span><button :disabled="page >= pages" @click="page++">Trang sau</button></div></template>
  </section>
</template>
<script setup>
import { ref, watch } from 'vue';
import { request, date } from '../services/bookings';
const props = defineProps({ tourId:{ type:String, required:true } });
const reviews = ref([]), loading = ref(false), error = ref(''), page = ref(1), pages = ref(0);
async function load() { loading.value = true; error.value = ''; try { const result = await request(`/reviews/tour/${encodeURIComponent(props.tourId)}?page=${page.value}&limit=10`); reviews.value = result.data; pages.value = result.pagination.totalPages; } catch(e) { error.value = e.message; } finally { loading.value = false; } }
watch(() => props.tourId, () => { if (page.value !== 1) page.value = 1; else load(); }, { immediate:true });
watch(page, load);
</script>
<style scoped>
.reviews { margin-top:24px; padding:28px; background:white; } h2 { margin-bottom:20px; } article { padding:20px 0; border-bottom:1px solid #e2e8f0; } .stars { color:#d97706; } .muted { color:var(--text-muted); font-size:.85rem; } .reply { padding:12px; margin-top:12px; background:#eff6ff; border-radius:12px; } .pagination { display:flex; gap:16px; align-items:center; margin-top:20px; } button { padding:8px 16px; cursor:pointer; }
</style>
