<template>
  <div class="panel-container">
    <!-- TOAST NOTIFICATION -->
    <transition name="toast-fade">
      <div v-if="toastMsg" :class="['admin-toast', toastType === 'error' ? 'toast-error' : 'toast-success']">
        <svg v-if="toastType === 'error'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
        <span>{{ toastMsg }}</span>
      </div>
    </transition>

    <div class="panel-toolbar">
      <div class="toolbar-title">
        <h2>Kiểm duyệt Đánh giá</h2>
        <p>Kiểm duyệt nội dung phản hồi từ khách hàng, ẩn đánh giá vi phạm và phản hồi chính thức</p>
      </div>

      <div class="filter-tabs">
        <button 
          :class="['filter-btn', filterStatus === '' ? 'active' : '']" 
          @click="changeFilter('')"
        >
          Tất cả ({{ reviews.length }})
        </button>
        <button 
          :class="['filter-btn', filterStatus === 'PUBLISHED' ? 'active' : '']" 
          @click="changeFilter('PUBLISHED')"
        >
          Đang hiển thị
        </button>
        <button 
          :class="['filter-btn', filterStatus === 'HIDDEN' ? 'active' : '']" 
          @click="changeFilter('HIDDEN')"
        >
          Đã ẩn vi phạm
        </button>
      </div>
    </div>

    <div v-if="loading" class="state-box">
      <div class="spinner"></div>
      <p style="margin-top: 12px; color: #64748b;">Đang tải danh sách đánh giá...</p>
    </div>

    <div v-else-if="reviews.length === 0" class="state-box">
      <p style="color: #64748b;">Không có đánh giá nào phù hợp với bộ lọc.</p>
    </div>

    <div v-else class="reviews-stack">
      <div v-for="r in reviews" :key="r.ReviewID" class="review-box glass-panel">
        <div class="review-header">
          <div class="author-info">
            <img :src="r.AvatarURL || defaultAvatar" class="author-avatar" alt="Avatar" />
            <div>
              <div class="author-name">{{ r.ReviewerName }}</div>
              <small class="tour-name">Tour: <strong>{{ r.TourTitle }}</strong></small>
            </div>
          </div>
          <div class="status-wrap">
            <span :class="['badge', r.Status === 'PUBLISHED' ? 'badge-success' : 'badge-danger']">
              {{ r.Status === 'PUBLISHED' ? 'Hiển thị' : 'Đã ẩn' }}
            </span>
            <small class="text-muted">{{ formatDate(r.CreatedAt) }}</small>
          </div>
        </div>

        <!-- Rating điểm sao -->
        <div class="rating-row">
          <span class="rating-score">{{ r.Rating }}.0 / 5.0</span>
          <span class="rating-stars">
            <span v-for="i in 5" :key="i" :class="i <= r.Rating ? 'star-filled' : 'star-empty'">★</span>
          </span>
        </div>

        <p class="review-content-text">{{ r.Content }}</p>

        <!-- Khung phản hồi của ban quản trị nếu có -->
        <div v-if="r.OwnerReply" class="reply-container">
          <div class="reply-title">Phản hồi từ TaVivu:</div>
          <p class="reply-body">{{ r.OwnerReply }}</p>
        </div>

        <div class="action-footer">
          <button 
            v-if="r.Status === 'PUBLISHED'" 
            class="btn btn-danger-outline btn-sm"
            @click="handleHide(r)"
          >
            Ẩn đánh giá
          </button>
          <span v-else class="badge badge-draft">Đã ẩn vi phạm</span>

          <button class="btn btn-outline btn-sm" @click="openReplyModal(r)">
            {{ r.OwnerReply ? 'Chỉnh sửa phản hồi' : 'Gửi phản hồi' }}
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL TRẢ LỜI ĐÁNH GIÁ -->
    <div v-if="reviewToReply" class="modal-overlay">
      <div class="modal-card">
        <div class="modal-header">
          <h3>Phản hồi đánh giá</h3>
          <button class="modal-close" @click="reviewToReply = null">✕</button>
        </div>
        <div class="modal-body">
          <div class="quote-text">
            <strong>{{ reviewToReply.ReviewerName }}:</strong> "{{ reviewToReply.Content }}"
          </div>

          <div class="form-group" style="margin-top: 14px;">
            <label class="form-label">Nội dung phản hồi chính thức của Quản trị viên</label>
            <textarea v-model="replyText" rows="4" class="form-textarea" placeholder="Nhập câu trả lời..."></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" @click="reviewToReply = null">Hủy</button>
          <button class="btn btn-primary" @click="submitReply" :disabled="replyLoading || !replyText">
            Gửi phản hồi
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import adminApi from '../services/api';

const defaultAvatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100';

const reviews = ref([]);
const loading = ref(false);
const filterStatus = ref('');

const reviewToReply = ref(null);
const replyText = ref('');
const replyLoading = ref(false);

const fetchReviews = async (st = '') => {
  loading.value = true;
  try {
    const res = await adminApi.getReviews(st);
    if (res.success) reviews.value = res.data || [];
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

const changeFilter = (st) => {
  filterStatus.value = st;
  fetchReviews(st);
};

const toastMsg = ref('');
const toastType = ref('success');
let toastTimeout = null;

const showToast = (msg, type = 'success') => {
  toastMsg.value = msg;
  toastType.value = type;
  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toastMsg.value = '';
  }, 4000);
};

const handleHide = async (r) => {
  try {
    const res = await adminApi.hideReview(r.ReviewID);
    if (res.success) {
      r.Status = 'HIDDEN';
      showToast('Đã ẩn đánh giá vi phạm thành công!');
    } else {
      showToast(res.message || 'Lỗi khi ẩn đánh giá', 'error');
    }
  } catch (e) {
    console.error(e);
    showToast('Lỗi khi gọi API ẩn đánh giá', 'error');
  }
};

const openReplyModal = (r) => {
  reviewToReply.value = r;
  replyText.value = r.OwnerReply || '';
};

const submitReply = async () => {
  if (!reviewToReply.value) return;
  replyLoading.value = true;
  try {
    const res = await adminApi.replyReview(reviewToReply.value.ReviewID, replyText.value);
    if (res.success) {
      reviewToReply.value.OwnerReply = replyText.value;
      showToast('Đã lưu phản hồi của Quản trị viên lên hệ thống!');
      reviewToReply.value = null;
    } else {
      showToast(res.message || 'Lỗi khi gửi phản hồi', 'error');
    }
  } catch (e) {
    console.error(e);
    showToast('Lỗi khi gọi API gửi phản hồi', 'error');
  } finally {
    replyLoading.value = false;
  }
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('vi-VN');
};

const onAdminChanged = () => {
  fetchReviews(filterStatus.value);
};

onMounted(() => {
  fetchReviews();
  window.addEventListener('admin-changed', onAdminChanged);
});
</script>

<style scoped>
.admin-toast {
  position: fixed;
  top: 80px;
  right: 28px;
  z-index: 999;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  border-radius: 12px;
  font-size: 0.88rem;
  font-weight: 700;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.18);
  backdrop-filter: blur(12px);
}

.toast-success {
  background: rgba(16, 185, 129, 0.95);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.toast-error {
  background: rgba(239, 68, 68, 0.95);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: all 0.25s ease;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translateY(-12px);
}

.panel-container {
  padding: 24px;
}

.panel-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.toolbar-title h2 {
  font-size: 1.35rem;
  font-weight: 800;
  color: #0f172a;
}

.toolbar-title p {
  font-size: 0.85rem;
  color: #64748b;
  margin-top: 2px;
}

.filter-tabs {
  display: flex;
  gap: 6px;
}

.filter-btn {
  padding: 6px 14px;
  border-radius: 20px;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  color: #64748b;
  font-family: inherit;
  transition: all 0.2s;
}

.filter-btn.active {
  background: #0f172a;
  color: #ffffff;
  border-color: #0f172a;
}

.reviews-stack {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.review-box {
  padding: 20px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.author-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.author-name {
  font-weight: 700;
  color: #0f172a;
}

.tour-name {
  color: #64748b;
}

.status-wrap {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.rating-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.rating-score {
  font-size: 0.85rem;
  font-weight: 700;
  color: #b45309;
}

.rating-stars {
  font-size: 1rem;
}

.star-filled { color: #f59e0b; }
.star-empty { color: #cbd5e1; }

.review-content-text {
  font-size: 0.9rem;
  line-height: 1.6;
  color: #1e293b;
  margin-bottom: 14px;
}

.reply-container {
  background: #f0f9ff;
  border-left: 3px solid #0284c7;
  padding: 10px 14px;
  border-radius: 6px;
  margin-bottom: 14px;
}

.reply-title {
  font-size: 0.78rem;
  font-weight: 700;
  color: #0369a1;
}

.reply-body {
  font-size: 0.88rem;
  color: #0c4a6e;
  margin-top: 4px;
}

.action-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid #f1f5f9;
}

.quote-text {
  background: #f8fafc;
  padding: 10px 14px;
  border-radius: 6px;
  font-size: 0.88rem;
  color: #475569;
  border-left: 3px solid #cbd5e1;
}
</style>
