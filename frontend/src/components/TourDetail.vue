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
            <span class="badge highlight">⭐ {{ tour.AverageRating || '5.0' }} ({{ tour.ReviewCount || 0 }} Đánh giá)</span>
          </div>
          <h1 class="title">{{ tour.Title }}</h1>
          
          <div class="booking-card">
            <div class="price-section">
              <span class="price-label">Giá trọn gói:</span>
              <div v-if="tour.DiscountPercent > 0 || (tour.OriginalPrice && Number(tour.OriginalPrice) > Number(tour.Price))" class="detail-price-stack">
                <div class="detail-old-row">
                  <span class="detail-old-price">{{ formatPrice(tour.OriginalPrice || tour.Price) }}</span>
                  <span class="detail-discount-badge">-{{ tour.DiscountPercent || Math.round((1 - tour.Price / tour.OriginalPrice) * 100) }}%</span>
                </div>
                <span class="price-value">{{ formatPrice(tour.Price) }}</span>
              </div>
              <span v-else class="price-value">{{ formatPrice(tour.Price) }}</span>
            </div>
            <div class="slots-info">
              <span>Khởi hành: <strong>{{ formatDate(tour.StartDate) }}</strong></span>
              <span>Số chỗ còn nhận: <strong>{{ tour.AvailableSlots }}</strong> / {{ tour.MaxSlots }}</span>
            </div>
            <button class="btn-book-large">Tiến hành Đặt Tour</button>
          </div>
        </div>

        <!-- Lịch trình -->
        <div class="itinerary-section">
          <h2>Lịch trình chi tiết</h2>
          <div v-if="tour.Itinerary" class="itinerary-content">
            <pre>{{ JSON.stringify(tour.Itinerary, null, 2) }}</pre>
          </div>
          <div v-else class="empty-itinerary">
            <p>Đang cập nhật lịch trình cho chuyến đi này...</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';

const defaultTourCover = 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=1200&q=80';

const route = useRoute();
const tour = ref(null);
const loading = ref(true);
const error = ref(null);
const activeImgIndex = ref(0);

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
  try {
    // Gọi API Module 2: Lấy chi tiết 1 Tour bằng ID
    const res = await fetch(`http://localhost:3000/api/tours/${route.params.id}`);
    const json = await res.json();
    if (json.success) {
      tour.value = json.data;
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
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN');
};

onMounted(() => {
  fetchTourDetail();
});
</script>

<style scoped>
.tour-detail-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
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
.itinerary-content pre {
  background: #f8fafc;
  padding: 20px;
  border-radius: var(--radius-lg);
  font-family: inherit;
  white-space: pre-wrap;
  color: var(--text-muted);
  line-height: 1.8;
}
.empty-itinerary {
  padding: 40px;
  text-align: center;
  background: #f8fafc;
  border-radius: var(--radius-lg);
  color: var(--text-muted);
  border: 1px dashed #cbd5e1;
}
</style>
