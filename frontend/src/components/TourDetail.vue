<template>
  <div class="tour-detail-page">
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Đang tải thông tin chuyến đi...</p>
    </div>
    
    <div v-else-if="error" class="error-state glass-panel">
      <p>⚠️ {{ error }}</p>
      <button @click="$router.push('/')" class="btn-primary">Quay lại Trang chủ</button>
    </div>

    <div v-else-if="tour" class="detail-container">
      <!-- Nút quay lại danh sách tour (giữ nguyên bộ lọc) -->
      <div class="top-back-bar">
        <button class="btn-back-to-tours" @click="handleBackToTours">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Quay lại danh sách chuyến đi
        </button>
      </div>

      <!-- Khung Hình ảnh -->
      <div class="gallery">
        <img 
          :src="coverImage" 
          :alt="tour.Title" 
          class="cover-image" 
          @error="handleCoverError" 
        />
        <div v-if="tour.images && tour.images.length > 1" class="gallery-thumbs-overlay">
          <img 
            v-for="(img, idx) in tour.images" 
            :key="idx" 
            :src="img" 
            class="thumb-item" 
            :class="{ active: activeImgIndex === idx }"
            @click="activeImgIndex = idx"
            @error="handleThumbError"
          />
        </div>
      </div>

      <!-- Nội dung chính -->
      <div class="content-wrapper glass-panel">
        <div class="main-info">
          <div class="badges">
            <span class="badge">{{ tour.Duration }}</span>
            <span class="badge highlight">{{ Number(tour.ReviewCount) > 0 ? '⭐ ' + Number(tour.AverageRating).toFixed(1) + ' (' + tour.ReviewCount + ' đánh giá)' : 'Chưa có đánh giá' }}</span>
          </div>
          <h1 class="title">{{ tour.Title }}</h1>
          <PhotoCredit :image="coverImage" />
          <p v-if="itineraryOverview" class="tour-overview">{{ itineraryOverview }}</p>
          
          <div class="booking-card">
            <label for="tour-departure">Chọn lịch khởi hành</label><select id="tour-departure" v-model="departureId" style="width:100%;padding:12px;border-radius:12px;margin:12px 0"><option v-for="d in tour.departures" :key="d.DepartureID" :value="d.DepartureID">{{ formatDate(d.StartDate) }} – {{ formatDate(d.EndDate) }} · {{ d.AvailableSlots }} chỗ</option></select><p v-if="!tour.departures?.length">Chưa có lịch khởi hành đang mở bán.</p>
            <div class="price-section">
              <span class="price-label">Giá / khách:</span>
              <del v-if="Number(tour.OriginalPrice) > Number(tour.Price)" class="original-price">{{ formatPrice(tour.OriginalPrice) }}</del>
              <span class="price-value">{{ formatPrice(tour.Price) }}</span>
              <span v-if="Number(tour.OriginalPrice) > Number(tour.Price)" class="discount-note">Tiết kiệm {{ formatPrice(tour.OriginalPrice - tour.Price) }} / khách</span>
            </div>
            <div class="slots-info">
              <span>Khởi hành: <strong>{{ formatDate(selectedDeparture?.StartDate) }}</strong></span>
              <span v-if="tour.EndDate">Kết thúc: <strong>{{ formatDate(tour.EndDate) }}</strong></span>
              <span>Số chỗ còn nhận: <strong>{{ (selectedDeparture?.AvailableSlots || 0) }}</strong> / {{ (selectedDeparture?.MaxSlots || 0) }}</span>
            </div>
            <button class="btn-book-large" :disabled="!canBook || !selectedDeparture" @click="$router.push({ path: '/booking/' + tour.TourID, query: { departure: departureId } })">
              {{ canBook ? 'Đặt chuyến đi này' : 'Chuyến đi đã đóng đăng ký' }}
            </button>
          </div>
        </div>

        <!-- Lịch trình -->
        <div class="itinerary-section">
          <h2>Lịch trình chi tiết</h2>
          <p class="itinerary-intro">Lịch trình theo từng ngày, có thời gian nghỉ và di chuyển. Thứ tự tham quan có thể điều chỉnh theo thời tiết và điều kiện thực tế.</p>
          <div v-if="itineraryDays.length" class="itinerary-content">
            <article v-for="(day, index) in itineraryDays" :key="index" class="day-card">
              <div class="day-number">{{ String(index + 1).padStart(2, '0') }}</div>
              <div class="day-body">
                <span class="day-label">Ngày {{ day.day || index + 1 }}</span>
                <h3>{{ day.title }}</h3>
                <p v-if="day.detail" class="day-detail">{{ day.detail }}</p>
                <ul v-if="day.activities?.length" class="day-activities">
                  <li v-for="(activity, activityIndex) in day.activities" :key="activityIndex">
                    <span class="activity-time">{{ activity.time }}</span>
                    <div><strong>{{ activity.title }}</strong><p>{{ activity.description }}</p></div>
                  </li>
                </ul>
                <div v-if="day.meals || day.stay" class="day-practical">
                  <span v-if="day.meals">Bữa ăn: {{ day.meals }}</span>
                  <span v-if="day.stay">Lưu trú: {{ day.stay }}</span>
                </div>
              </div>
            </article>
          </div>
          <div v-if="tripNotes.length" class="trip-notes">
            <h3>Chuẩn bị trước chuyến đi</h3>
            <ul><li v-for="note in tripNotes" :key="note">{{ note }}</li></ul>
          </div>
          <div v-if="!itineraryDays.length" class="empty-itinerary">
            <p>Đang cập nhật lịch trình cho chuyến đi này...</p>
          </div>
        </div>
      </div>
      <TourReviews :tour-id="tour.TourID" />
    </div>
  </div>
</template>

<script setup>
import TourReviews from './TourReviews.vue';
import PhotoCredit from './PhotoCredit.vue';
import { ref, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const defaultTourCover = 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=1200&q=80';

const route = useRoute();
const router = useRouter();

const handleBackToTours = () => {
  if (route.query && Object.keys(route.query).length > 0) {
    router.push({ path: '/tours', query: route.query });
  } else {
    router.push('/tours');
  }
};
const tour = ref(null);
const departureId = ref('');
const selectedDeparture = computed(() => tour.value?.departures?.find(d => d.DepartureID === departureId.value));
const loading = ref(true);
const error = ref(null);
const activeImgIndex = ref(0);
const itineraryDays = computed(() => {
  let value = tour.value?.Itinerary;
  if (typeof value === 'string') {
    try { value = JSON.parse(value); } catch { value = [value]; }
  }
  const days = Array.isArray(value) ? value : value?.days || [];
  return days.flatMap((day, index) => typeof day === 'string'
    ? day.split(/\n+/).filter(Boolean).map(line => ({ title: line.replace(/^Ngày\s*\d+\s*:\s*/i, '') }))
    : [{ ...day, title: day.title || `Khám phá ngày ${index + 1}` }]);
});
const itineraryOverview = computed(() => itineraryDays.value[0]?.overview || '');
const tripNotes = computed(() => itineraryDays.value[0]?.notes || []);
const canBook = computed(() => Number(selectedDeparture.value?.AvailableSlots) > 0 && new Date(selectedDeparture.value?.StartDate).getTime() > Date.now());

const coverImage = computed(() => {
  if (tour.value?.images && tour.value.images.length > 0) {
    const selected = tour.value.images[activeImgIndex.value] || tour.value.images[0];
    if (selected && !selected.includes('example.com')) return selected;
  }
  return defaultTourCover;
});

const handleCoverError = (e) => {
  e.target.src = defaultTourCover;
};

const handleThumbError = (e) => {
  e.target.src = defaultTourCover;
};

const fetchTourDetail = async () => {
  loading.value = true;
  error.value = null;
  activeImgIndex.value = 0;
  try {
    // Gọi API Module 2: Lấy chi tiết 1 Tour bằng ID
    const base = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api').replace(/\/$/, '');
    const res = await fetch(`${base}/tours/${encodeURIComponent(route.params.id)}`);
    const json = await res.json();
    if (json.success) {
      tour.value = json.data;
      departureId.value = tour.value.departures?.[0]?.DepartureID || '';
    } else {
      error.value = json.message;
    }
  } catch (err) {
    error.value = 'Lỗi kết nối Máy chủ Backend.';
  } finally {
    loading.value = false;
  }
};

const formatPrice = (price) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

const formatDate = (dateString) => {
  if (!dateString) return 'Chưa có lịch';
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN');
};

watch(() => route.params.id, fetchTourDetail, { immediate: true });
</script>

<style scoped>
.original-price { display: block; color: #64748b; font-size: 1rem; }
.discount-note { display: block; color: #007d68; font-size: .9rem; font-weight: 600; }
.tour-detail-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 100px 20px 60px;
}
.loading-state, .error-state {
  text-align: center;
  padding: 100px 0;
}
.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(37, 99, 235, 0.2);
  border-left-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}
@keyframes spin { to { transform: rotate(360deg); } }
.btn-primary {
  padding: 12px 24px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  margin-top: 20px;
}
.gallery {
  width: 100%;
  height: 450px;
  border-radius: var(--radius-xl);
  overflow: hidden;
  margin-bottom: -80px; /* Đè lên content */
  position: relative;
  z-index: 1;
}
.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: opacity 0.3s ease;
}
.gallery-thumbs-overlay {
  position: absolute;
  bottom: 95px;
  right: 20px;
  display: flex;
  gap: 10px;
  z-index: 3;
}
.thumb-item {
  width: 65px;
  height: 45px;
  object-fit: cover;
  border-radius: 8px;
  cursor: pointer;
  border: 2px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 4px 10px rgba(0,0,0,0.3);
  transition: transform 0.2s, border-color 0.2s;
}
.thumb-item:hover, .thumb-item.active {
  transform: scale(1.1);
  border-color: #fbbf24;
}
.content-wrapper {
  position: relative;
  z-index: 2;
  margin: 0 40px;
  padding: 40px;
  background: rgba(255, 255, 255, 0.95);
}
.badges {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}
.badge {
  padding: 6px 16px;
  background: #e2e8f0;
  border-radius: 20px;
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--secondary-color);
}
.badge.highlight {
  background: #fef3c7;
  color: #d97706;
}
.title {
  font-size: 2.5rem;
  font-weight: 800;
  color: var(--secondary-color);
  margin-bottom: 30px;
  line-height: 1.3;
}
.tour-overview { color: #52636b; font-size: 1.05rem; line-height: 1.8; margin: 8px 0 28px; }
.booking-card {
  background: var(--bg-color);
  padding: 24px;
  border-radius: var(--radius-lg);
  border: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 50px;
}
.price-label {
  display: block;
  font-size: 0.9rem;
  color: var(--text-muted);
}
.detail-price-stack {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.detail-old-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.detail-old-price {
  font-size: 1.15rem;
  font-weight: 500;
  text-decoration: line-through;
  color: var(--text-muted);
}
.detail-discount-badge {
  background: #fee2e2;
  color: #ef4444;
  font-size: 0.8rem;
  font-weight: 800;
  padding: 2px 8px;
  border-radius: 6px;
}
.price-value {
  font-size: 2.2rem;
  font-weight: 800;
  color: var(--primary-color);
}
.slots-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: var(--text-main);
}
.btn-book-large {
  padding: 16px 40px;
  background: var(--secondary-color);
  color: white;
  border: none;
  border-radius: 30px;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}
.btn-book-large:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.2);
}
.itinerary-section h2 {
  font-size: 1.8rem;
  color: var(--secondary-color);
  margin-bottom: 20px;
  border-bottom: 2px solid #e2e8f0;
  padding-bottom: 12px;
}
.itinerary-intro { color: #64748b; line-height: 1.7; margin-bottom: 24px; }
.itinerary-content { display: grid; gap: 20px; }
.day-card { display: flex; gap: 20px; padding: 24px; border: 1px solid #dcebe7; border-radius: 20px; background: #fcfefd; }
.day-number { flex-shrink: 0; width: 44px; height: 44px; display: grid; place-items: center; border-radius: 14px; background: #dff9f0; color: #007d68; font-size: 1.1rem; font-weight: 800; }
.day-body { min-width: 0; flex: 1; }
.day-label { color: #007d68; font-size: .8rem; font-weight: 700; }
.day-body h3 { margin: 6px 0 12px; color: #243b40; font-size: 1.22rem; line-height: 1.4; }
.day-detail { white-space: pre-line; line-height: 1.8; color: #52636b; }
.day-activities { list-style: none; padding: 0; margin: 18px 0; display: grid; gap: 18px; }
.day-activities li { display: grid; grid-template-columns: 70px 1fr; gap: 14px; }
.activity-time { font-size: .85rem; font-weight: 700; color: #007d68; }
.day-activities strong { color: #243b40; font-size: .98rem; }
.day-activities p { margin: 5px 0 0; color: #64748b; line-height: 1.75; }
.day-practical { display: flex; flex-wrap: wrap; gap: 10px 22px; border-top: 1px solid #e2eee9; padding-top: 14px; font-size: .88rem; color: #52636b; }
.trip-notes { margin-top: 24px; padding: 22px 26px; border-radius: 16px; background: #f1f8f5; color: #435951; }
.trip-notes h3 { margin-top: 0; color: #243b40; }
.trip-notes li { line-height: 1.8; margin-bottom: 6px; }
.btn-book-large:disabled { opacity: .55; cursor: not-allowed; transform: none; box-shadow: none; }
@media (max-width: 768px) {
  .tour-detail-page { padding: 90px 12px 32px; }
  .gallery { height: 300px; margin-bottom: -30px; }
  .gallery-thumbs-overlay { bottom: 45px; }
  .content-wrapper { margin: 0 8px; padding: 24px 16px; }
  .title { font-size: 1.8rem; }
  .badges { flex-wrap: wrap; }
  .booking-card { flex-direction: column; align-items: stretch; gap: 20px; margin-bottom: 28px; }
  .day-card { padding: 18px 14px; gap: 12px; }
  .day-number { width: 32px; height: 36px; font-size: .9rem; }
  .day-activities li { grid-template-columns: 1fr; gap: 4px; }
}
.empty-itinerary {
  padding: 40px;
  text-align: center;
  background: #f8fafc;
  border-radius: var(--radius-lg);
  color: var(--text-muted);
  border: 1px dashed #cbd5e1;
}

.top-back-bar {
  margin-bottom: 20px;
}

.btn-back-to-tours {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: #ffffff;
  border: 1.5px solid #cce5dc;
  border-radius: 12px;
  color: #007d68;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(0, 125, 104, 0.08);
  transition: all 0.2s ease;
  font-family: inherit;
}

.btn-back-to-tours:hover {
  background: #eef8f4;
  border-color: #007d68;
  transform: translateX(-4px);
  box-shadow: 0 6px 18px rgba(0, 125, 104, 0.15);
}
</style>
