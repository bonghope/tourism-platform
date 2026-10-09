<template>
  <div class="review-form-wrapper glass-panel">
    <h3>Đánh giá trải nghiệm chuyến đi</h3>
    <p class="subtitle">Ý kiến của bạn giúp TaVivu ngày một hoàn thiện hơn.</p>

    <div v-if="successMsg" class="alert success-alert">
      ✅ {{ successMsg }}
    </div>

    <form v-else @submit.prevent="submitReview">
      <!-- Bộ chọn Sao (Star Rating) -->
      <div class="rating-selector">
        <label>Mức độ hài lòng:</label>
        <div class="stars">
          <span 
            v-for="star in 5" 
            :key="star" 
            class="star-icon"
            :class="{ active: star <= form.rating }"
            @click="form.rating = star"
          >
            ★
          </span>
        </div>
      </div>

      <div class="form-group">
        <label>Chia sẻ trải nghiệm của bạn:</label>
        <textarea 
          v-model="form.comment" 
          rows="4" 
          placeholder="Bạn cảm thấy hướng dẫn viên, dịch vụ khách sạn thế nào?..." 
          required
        ></textarea>
      </div>

      <!-- M4: Lỗi hiển thị chặn quá hạn 30 ngày hoặc trạng thái sai -->
      <div v-if="errorMsg" class="alert error-alert">
        ⚠️ {{ errorMsg }}
      </div>

      <button type="submit" class="btn-submit-review" :disabled="isSubmitting">
        <span v-if="isSubmitting" class="spinner-small"></span>
        <span v-else>Gửi Đánh Giá</span>
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { request } from '../services/bookings';
const emit = defineEmits(['submitted']);

const props = defineProps({
  bookingId: { type: String, required: true },
  tourId: { type: String, required: true }
});

const isSubmitting = ref(false);
const errorMsg = ref('');
const successMsg = ref('');

const form = ref({
  rating: 5,
  comment: ''
});

// M4: API Gửi Review (Kiểm tra COMPLETED và 30 ngày)
const submitReview = async () => {
  isSubmitting.value = true;
  errorMsg.value = '';

  try {
    const json = await request('/reviews', { method:'POST', body:JSON.stringify({ bookingId:props.bookingId, tourId:props.tourId, rating:form.value.rating, content:form.value.comment }) });
    if (json.success) {
      successMsg.value = 'Cảm ơn bạn đã gửi đánh giá!';
      emit('submitted');
    } else {
      // Backend M4 sẽ trả về lỗi nếu: Đơn chưa hoàn thành, Đã quá 30 ngày, hoặc Đã đánh giá rồi
      errorMsg.value = json.message;
    }
  } catch (err) {
    errorMsg.value = err.message;
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<style scoped>
.review-form-wrapper { padding: 30px; border-radius: var(--radius-xl); background: #ffffff; max-width: 600px; margin: 20px auto; }
.review-form-wrapper h3 { font-size: 1.4rem; color: var(--secondary-color); margin-bottom: 6px; }
.subtitle { color: var(--text-muted); font-size: 0.95rem; margin-bottom: 24px; }

.rating-selector { display: flex; align-items: center; gap: 16px; margin-bottom: 20px; }
.rating-selector label { font-weight: 700; color: var(--text-main); }
.stars { display: flex; gap: 6px; }
.star-icon { font-size: 2rem; color: #cbd5e1; cursor: pointer; transition: color 0.2s; user-select: none; }
.star-icon:hover, .star-icon.active { color: #fbbf24; /* Màu vàng kim */ }

.form-group { display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; }
.form-group label { font-weight: 700; color: var(--text-main); }
.form-group textarea { padding: 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-family: inherit; font-size: 1rem; resize: vertical; outline: none; transition: 0.2s; }
.form-group textarea:focus { border-color: var(--primary-color); box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1); }

.alert { padding: 12px 16px; border-radius: 8px; font-weight: 600; font-size: 0.95rem; margin-bottom: 20px; }
.error-alert { background: #fee2e2; color: #dc2626; border: 1px solid #f87171; }
.success-alert { background: #dcfce3; color: #16a34a; border: 1px solid #4ade80; text-align: center; }

.btn-submit-review { width: 100%; padding: 14px; background: var(--secondary-color); color: white; border: none; border-radius: 8px; font-size: 1.05rem; font-weight: 700; cursor: pointer; transition: 0.2s; display: flex; justify-content: center; }
.btn-submit-review:hover:not(:disabled) { background: #0f172a; transform: translateY(-2px); }
.btn-submit-review:disabled { opacity: 0.7; cursor: not-allowed; transform: none; }

.spinner-small { width: 20px; height: 20px; border: 3px solid rgba(255,255,255,0.3); border-left-color: white; border-radius: 50%; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>