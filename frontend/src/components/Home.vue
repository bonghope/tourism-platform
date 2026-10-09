<template>
  <div class="home-page">
    <!-- KHU VỰC HERO SLIDER (Điểm đến nổi bật) -->
    <header v-if="allSliderDests.length > 0" class="hero-slider">
      <!-- LỚP HÌNH NỀN VỚI HIỆU ỨNG CHUYỂN CẢNH BLUR CINEMATIC -->
      <transition name="hero-bg-blur">
        <div 
          :key="currentHeroBg" 
          class="hero-bg-layer" 
          :style="{ backgroundImage: `url('${currentHeroBg}')` }"
        ></div>
      </transition>

      <div class="hero-overlay"></div>

      <!-- THANH TÌM KIẾM MỚI -->
      <div class="search-container-slider">
        <input 
          type="text" 
          v-model="searchKeyword" 
          placeholder="Tìm kiếm tour, điểm đến..." 
          @keyup.enter="handleSearchAndScroll" 
        />
      </div>

      <!-- NỘI DUNG CHÍNH (Bên trái) VỚI HIỆU ỨNG BLUR CHUYỂN CẢNH -->
      <div class="hero-content-slider" v-if="currentHeroDest">
        <transition name="hero-text-blur" mode="out-in">
          <div :key="currentHeroDest.DestinationID" class="hero-text-inner">
            <div class="hero-location">📍 <span>{{ currentHeroDest.Name }}</span></div>
            <h1 class="hero-title-slider">{{ currentHeroDest.Name }}</h1>
            <p class="hero-desc-slider">
              {{ currentHeroDest.Description || 'Khám phá vẻ đẹp tuyệt vời và những trải nghiệm khó quên tại điểm đến này cùng TaVivu.' }}
            </p>
            <button class="btn-explore-slider" @click="$router.push('/destination/' + currentHeroDest.DestinationID)">Khám phá ngay</button>
          </div>
        </transition>
      </div>

      <!-- KHU VỰC 3-CARD CAROUSEL (Góc phải dưới: Ô giữa sáng, 2 ô cạnh mờ, xoay vòng) -->
      <div 
        class="carousel-wrapper"
        @mouseenter="pauseTimer" 
        @mouseleave="resumeTimer"
      >
        <div class="carousel-cards">
          <!-- Card Trái (Mờ - Nhấn để lùi) -->
          <div 
            v-if="prevDest"
            class="carousel-card side left-card" 
            :style="{ backgroundImage: `url('${prevDest.ImageURL || fallbackHeroBg}')` }"
            @click="goPrev"
            title="Điểm đến trước đó (Nhấn để chuyển)"
          >
            <div class="thumb-info">
              <p>Trước</p>
              <h4>{{ prevDest.Name }}</h4>
            </div>
          </div>

          <!-- Card Giữa (SÁNG NỔI BẬT - Điểm đến đang chọn) -->
          <div 
            v-if="currentHeroDest"
            class="carousel-card center-card" 
            :style="{ backgroundImage: `url('${currentHeroDest.ImageURL || fallbackHeroBg}')` }"
            @click="$router.push('/destination/' + currentHeroDest.DestinationID)"
            title="Điểm đến đang chọn (Nhấn để xem chi tiết)"
          >
            <div class="thumb-info">
              <p class="highlight-tag">Đang chọn</p>
              <h4>{{ currentHeroDest.Name }}</h4>
            </div>
          </div>

          <!-- Card Phải (Mờ - Nhấn để tiến) -->
          <div 
            v-if="nextDest"
            class="carousel-card side right-card" 
            :style="{ backgroundImage: `url('${nextDest.ImageURL || fallbackHeroBg}')` }"
            @click="goNext"
            title="Điểm đến kế tiếp (Nhấn để chuyển)"
          >
            <div class="thumb-info">
              <p>Kế tiếp</p>
              <h4>{{ nextDest.Name }}</h4>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- TRẠNG THÁI LOADING CHO HERO -->
    <header v-else class="hero-slider" style="background-color: #222; display: flex; align-items: center; justify-content: center;">
       <div class="loading-state" style="color: white;">
         <div class="spinner"></div>
         Đang tải điểm đến...
       </div>
    </header>

    <!-- SECTION: GỢI Ý RIÊNG -->
    <section v-if="recommendedTours.length > 0" class="tours-section">
      <div class="section-header">
        <h2 class="section-title">Gợi Ý Dành Riêng Cho Bạn</h2>
        <p class="section-desc">Dựa trên các địa danh bạn đã yêu thích</p>
      </div>
      <div class="tours-grid">
        <TourCard v-for="tour in recommendedTours" :key="tour.TourID" :tour="tour" />
      </div>
    </section>

    <!-- SECTION: TOUR NỔI BẬT -->
    <div class="tours-section-wrapper">
      <div class="brush-decor-tour brush-tour-left"></div>
      <div class="brush-decor-tour brush-tour-right"></div>
      <section id="tours-section" class="tours-section">
        <div class="section-header">
          <h2 class="section-title">Tour Nổi Bật</h2>
          <p class="section-desc">Những chuyến đi được lựa chọn nhiều nhất trong tháng</p>
        </div>

        <!-- Bộ lọc giá, tên & ngày -->
        <div class="filters-bar glass-panel">
          <div class="filter-group filter-group-name">
            <label>Tên tour:</label>
            <input type="text" v-model="searchKeyword" placeholder="VD: Sa Pa, Hà Giang, Hạ Long..." @keyup.enter="handleSearch" />
          </div>
          <div class="filter-group">
            <label>Giá từ (VNĐ):</label>
            <input type="number" v-model="filterMinPrice" placeholder="VD: 1000000" @keyup.enter="handleSearch" />
          </div>
          <div class="filter-group">
            <label>Đến (VNĐ):</label>
            <input type="number" v-model="filterMaxPrice" placeholder="VD: 5000000" @keyup.enter="handleSearch" />
          </div>
          <div class="filter-group">
            <label>Ngày đi:</label>
            <input type="date" v-model="filterStartDate" @change="handleSearch" />
          </div>
          <button class="btn-filter" @click="handleSearch">Lọc kết quả</button>
        </div>

        <div v-if="loading" class="loading-state">
          <div class="spinner"></div>
          <p>Đang tải dữ liệu từ Máy chủ Backend...</p>
        </div>
        
        <div v-else-if="error" class="error-state glass-panel">
          <p>⚠️ {{ error }}</p>
          <button @click="fetchTours" class="btn-retry">Thử lại</button>
        </div>

        <div v-else class="tours-grid">
          <TourCard v-for="tour in tours" :key="tour.TourID" :tour="tour" />
          <div v-if="tours.length === 0" class="empty-state glass-panel">
            Rất tiếc, hiện tại không có tour nào khớp với yêu cầu của bạn.
          </div>
        </div>

        <!-- Nút xem tất cả các tour -->
        <div class="view-all-tours-wrapper" v-if="tours.length > 0">
          <button class="btn-view-all-tours" @click="$router.push('/tours')">
            <span>Xem Tất Cả Các Tour</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/></svg>
          </button>
        </div>
      </section>
    </div>

    <!-- BANNER QUẢNG CÁO & TRUYỀN CẢM HỨNG (DƯỚI TOUR NỔI BẬT) -->
    <PromoAdventureBanner />

    <!-- SECTION: VỀ CHÚNG TÔI -->
    <section class="about-summary glass-panel">
      <div class="about-content">
        <h2>Về Chúng Tôi – TaVivu</h2>
        <p>Thương hiệu lữ hành mũi nhọn thuộc hệ sinh thái Tai Group, chuyên kiến tạo những hành trình trọn vẹn, đẳng cấp và cá nhân hóa. Với mạng lưới đối tác toàn cầu, chúng tôi tự hào mang đến cho bạn những trải nghiệm du lịch tuyệt vời nhất.</p>
        <button class="btn-outline" @click="$router.push('/about')">Đọc thêm</button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import TourCard from './TourCard.vue';
import PromoAdventureBanner from './PromoAdventureBanner.vue';

const authStore = useAuthStore();

const fallbackHeroBg = 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=1920&q=80';

const route = useRoute();
const tours = ref([]);
const recommendedTours = ref([]);
const destinations = ref([]);
const loading = ref(true);
const error = ref(null);

// State cho 3-Card Carousel Slider
const currentIndex = ref(0);
let sliderTimer = null;

// State cho Search/Filter
const searchKeyword = ref('');
const filterMinPrice = ref('');
const filterMaxPrice = ref('');
const filterStartDate = ref('');

let currentDestId = null;

// Lấy danh sách điểm đến hợp lệ và loại bỏ trùng lặp thành phố/vùng
const allSliderDests = computed(() => {
  const list = destinations.value.filter(d => d.ImageURL && !d.ImageURL.includes('example.com'));
  const unique = [];
  const seen = new Set();
  for (const d of list) {
    const key = d.Name.trim().toLowerCase().split(' - ')[0].replace('thủ đô ', '').replace('sapa', 'sa pa');
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(d);
    }
  }
  return unique.length > 0 ? unique : destinations.value;
});

// Ô BÊN TRÁI (Điểm đến trước đó, mờ)
const prevDest = computed(() => {
  const total = allSliderDests.value.length;
  if (total === 0) return null;
  const idx = (currentIndex.value - 1 + total) % total;
  return allSliderDests.value[idx];
});

// Ô Ở GIỮA (Điểm đến đang chọn, sáng nổi bật)
const currentHeroDest = computed(() => {
  const total = allSliderDests.value.length;
  if (total === 0) return null;
  return allSliderDests.value[currentIndex.value] || allSliderDests.value[0];
});

// Ô BÊN PHẢI (Điểm đến kế tiếp, mờ)
const nextDest = computed(() => {
  const total = allSliderDests.value.length;
  if (total === 0) return null;
  const idx = (currentIndex.value + 1) % total;
  return allSliderDests.value[idx];
});

// Ảnh nền chính ăn theo ô đang chọn ở giữa
const currentHeroBg = computed(() => {
  return currentHeroDest.value?.ImageURL || fallbackHeroBg;
});

// Chuyển sang điểm đến trước (Sang trái)
const goPrev = () => {
  const total = allSliderDests.value.length;
  if (total > 0) {
    currentIndex.value = (currentIndex.value - 1 + total) % total;
  }
};

// Chuyển sang điểm đến kế tiếp (Sang phải)
const goNext = () => {
  const total = allSliderDests.value.length;
  if (total > 0) {
    currentIndex.value = (currentIndex.value + 1) % total;
  }
};

// Tự động xoay vòng mỗi 5.5 giây
const startSliderTimer = () => {
  if (sliderTimer) clearInterval(sliderTimer);
  sliderTimer = setInterval(() => {
    goNext();
  }, 5500);
};

const pauseTimer = () => {
  if (sliderTimer) {
    clearInterval(sliderTimer);
    sliderTimer = null;
  }
};

const resumeTimer = () => {
  startSliderTimer();
};

const handleSearchAndScroll = () => {
  handleSearch();
  const el = document.getElementById('tours-section');
  if (el) el.scrollIntoView({ behavior: 'smooth' });
};

const handleSearch = async () => {
  if (searchKeyword.value.trim()) {
    try {
      const destRes = await fetch(`http://localhost:3000/api/destinations/search?keyword=${encodeURIComponent(searchKeyword.value)}`);
      const destJson = await destRes.json();
      if (destJson.success && destJson.data.length > 0) {
        currentDestId = destJson.data[0].DestinationID;
      } else {
        currentDestId = null; // Không tìm thấy địa danh, sẽ fallback tìm theo tên tour
      }
    } catch (e) {
      console.error(e);
    }
  } else {
    currentDestId = null;
  }
  
  fetchTours();
};

const fetchTours = async () => {
  loading.value = true;
  error.value = null;
  try {
    const url = new URL('http://localhost:3000/api/tours');
    url.searchParams.append('limit', '6');
    
    if (currentDestId) {
      url.searchParams.append('destinationId', currentDestId);
    } else if (searchKeyword.value.trim()) {
      url.searchParams.append('keyword', searchKeyword.value.trim());
    }

    if (filterMinPrice.value) url.searchParams.append('minPrice', filterMinPrice.value);
    if (filterMaxPrice.value) url.searchParams.append('maxPrice', filterMaxPrice.value);
    if (filterStartDate.value) url.searchParams.append('startDate', filterStartDate.value);

    const headers = {};
    if (authStore.token) {
      headers['Authorization'] = `Bearer ${authStore.token}`;
    }

    const res = await fetch(url.toString(), { headers });
    const json = await res.json();
    if (json.success) {
      tours.value = json.data;
    } else {
      error.value = json.message;
    }
  } catch (err) {
    error.value = 'Không thể kết nối đến Máy chủ Backend. Hãy chắc chắn Server Backend đang chạy ở cổng 3000.';
  } finally {
    loading.value = false;
  }
};

const fetchRecommendations = async () => {
  try {
    const headers = {};
    if (authStore.token) {
      headers['Authorization'] = `Bearer ${authStore.token}`;
    }
    const res = await fetch('http://localhost:3000/api/destinations/recommendations', { headers });
    const json = await res.json();
    if (json.success && json.data.length > 0) {
      recommendedTours.value = json.data;
    }
  } catch (err) {
    console.error('Không thể lấy danh sách gợi ý', err);
  }
};

watch(() => authStore.token, () => {
  fetchTours();
  fetchRecommendations();
});

const fetchDestinations = async () => {
  try {
    const res = await fetch('http://localhost:3000/api/destinations/search');
    const json = await res.json();
    if (json.success) {
      destinations.value = json.data;
    }
  } catch (err) {
    console.error('Không thể lấy danh sách điểm đến', err);
  }
};

const handleKeyDown = (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  if (e.key === 'ArrowLeft') goPrev();
  if (e.key === 'ArrowRight') goNext();
};

onMounted(() => {
  if (route.query.search) {
    searchKeyword.value = route.query.search;
    handleSearchAndScroll();
  } else {
    fetchTours();
  }
  fetchRecommendations();
  fetchDestinations();
  startSliderTimer();
  window.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  if (sliderTimer) clearInterval(sliderTimer);
  window.removeEventListener('keydown', handleKeyDown);
});
</script>

<style scoped>
.home-page {
  width: 100%;
}

/* =========================================
   HERO SLIDER (Dựa trên fe_test)
   ========================================= */
.hero-slider {
  width: 100%;
  height: 90vh; /* Thu nhỏ một chút so với 100vh để hở phần dưới */
  position: relative;
  color: white;
  margin-bottom: 40px;
  overflow: hidden; /* Cố định hiệu ứng blur không tràn viền */
}

/* LỚP ẢNH NỀN HERO ĐỘC LẬP */
.hero-bg-layer {
  position: absolute;
  top: -20px;
  left: -20px;
  right: -20px;
  bottom: -20px;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  z-index: 0;
  will-change: transform, filter, opacity;
}

/* HIỆU ỨNG CHUYỂN CẢNH BLUR CHO NỀN (CINEMATIC BLUR TRANSITION) */
.hero-bg-blur-enter-active,
.hero-bg-blur-leave-active {
  transition: opacity 0.85s ease, filter 0.85s ease, transform 0.85s cubic-bezier(0.25, 1, 0.5, 1);
}

.hero-bg-blur-enter-from {
  opacity: 0;
  filter: blur(25px) brightness(1.2);
  transform: scale(1.08);
}
.hero-bg-blur-enter-to {
  opacity: 1;
  filter: blur(0px) brightness(1);
  transform: scale(1);
}

.hero-bg-blur-leave-from {
  opacity: 1;
  filter: blur(0px) brightness(1);
  transform: scale(1);
}
.hero-bg-blur-leave-to {
  opacity: 0;
  filter: blur(25px) brightness(0.7);
  transform: scale(1.04);
}

.hero-overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(to right, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 100%);
  z-index: 1;
}

/* SEARCH BAR TRONG SLIDER */
.search-container-slider {
  position: absolute;
  top: 100px;
  width: 100%;
  z-index: 10;
  display: flex;
  justify-content: center;
}
.search-container-slider input {
  width: 40%;
  min-width: 300px;
  padding: 15px 25px;
  border-radius: 30px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  color: white;
  font-size: 16px;
  outline: none;
  transition: all 0.3s;
}
.search-container-slider input::placeholder {
  color: rgba(255, 255, 255, 0.8);
}
.search-container-slider input:focus {
  background: rgba(255, 255, 255, 0.3);
  border-color: white;
}

/* NỘI DUNG CHÍNH (BÊN TRÁI) */
.hero-content-slider {
  position: absolute;
  top: 50%;
  left: 5%;
  transform: translateY(-50%);
  z-index: 10;
  max-width: 600px;
}

/* HIỆU ỨNG CHUYỂN CẢNH BLUR CHO NỘI DUNG CHỮ */
.hero-text-blur-enter-active,
.hero-text-blur-leave-active {
  transition: opacity 0.5s ease, filter 0.5s ease, transform 0.5s cubic-bezier(0.25, 1, 0.5, 1);
}

.hero-text-blur-enter-from {
  opacity: 0;
  filter: blur(12px);
  transform: translateY(20px);
}
.hero-text-blur-enter-to {
  opacity: 1;
  filter: blur(0px);
  transform: translateY(0);
}

.hero-text-blur-leave-from {
  opacity: 1;
  filter: blur(0px);
  transform: translateY(0);
}
.hero-text-blur-leave-to {
  opacity: 0;
  filter: blur(12px);
  transform: translateY(-20px);
}

.hero-location {
  font-size: 18px;
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  font-weight: 600;
  letter-spacing: 1px;
}
.hero-title-slider {
  font-size: 70px;
  font-weight: 800;
  line-height: 1.1;
  margin-bottom: 20px;
  text-transform: uppercase;
}
.hero-desc-slider {
  font-size: 16px;
  margin-bottom: 30px;
  line-height: 1.6;
  opacity: 0.9;
}
.btn-explore-slider {
  padding: 12px 35px;
  font-size: 16px;
  font-weight: 700;
  color: #333;
  background: white;
  border: none;
  border-radius: 30px;
  cursor: pointer;
  transition: 0.3s;
  text-transform: uppercase;
  letter-spacing: 1px;
}
.btn-explore-slider:hover {
  transform: scale(1.05);
  box-shadow: 0 10px 20px rgba(0,0,0,0.3);
}

/* THUMBNAILS (BÊN PHẢI) */
/* =========================================
   3-CARD CAROUSEL (Ô giữa sáng, 2 ô cạnh mờ, xoay vòng)
   ========================================= */
.carousel-wrapper {
  position: absolute;
  bottom: 40px;
  right: 5%;
  z-index: 10;
  display: flex;
  align-items: center;
}

.carousel-cards {
  display: flex;
  align-items: center;
  gap: 16px;
}

.carousel-card {
  border-radius: 18px;
  background-size: cover;
  background-position: center;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  box-shadow: 0 10px 25px rgba(0,0,0,0.4);
  transition: all 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);
  user-select: none;
}

/* 2 Ô CẠNH: RÕ HƠN NHƯNG VẪN MỜ & THU NHỎ SO VỚI Ô GIỮA */
.carousel-card.side {
  width: 130px;
  height: 190px;
  opacity: 0.8;
  filter: brightness(0.75) contrast(0.95);
  transform: scale(0.88);
  border: 1.5px solid rgba(255, 255, 255, 0.4);
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.5);
}
.carousel-card.side:hover {
  opacity: 0.95;
  filter: brightness(0.92) contrast(1);
  transform: scale(0.94) translateY(-4px);
  border-color: rgba(255, 255, 255, 0.8);
}

/* Ô Ở GIỮA: SIÊU NÉT, SÁNG RỰC RỠ, NỔI BẬT, PHÓNG TO */
.carousel-card.center-card {
  width: 160px;
  height: 225px;
  opacity: 1;
  filter: brightness(1.1) saturate(1.2);
  transform: scale(1.08) translateY(-8px);
  border: 2.5px solid #ffffff;
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.6), 0 0 25px rgba(255, 255, 255, 0.5);
  z-index: 2;
}

.thumb-info {
  position: absolute;
  bottom: 0;
  width: 100%;
  padding: 16px 12px 10px;
  background: linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.4) 60%, transparent 100%);
  color: white;
}
.thumb-info h4 {
  font-size: 13px;
  font-weight: 700;
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.carousel-card.center-card .thumb-info h4 {
  font-size: 14px;
  font-weight: 800;
  color: #fbbf24; /* Vàng kim sang trọng */
}
.thumb-info p {
  font-size: 10px;
  opacity: 0.85;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.thumb-info p.highlight-tag {
  color: #38bdf8;
  font-weight: 700;
  opacity: 1;
}

@media (max-width: 900px) {
  .carousel-wrapper {
    position: static;
    margin: 20px auto;
  }
  .carousel-card.side {
    display: none;
  }
}


/* =========================================
   CÁC SECTION KHÁC (TOUR, ABOUT)
   ========================================= */
.tours-section-wrapper {
  position: relative;
  width: 100%;
  background: linear-gradient(135deg, #f0fdfa 0%, #ffffff 42%, #fffbeb 100%);
  overflow: hidden;
  border-top: 1px solid rgba(229, 231, 235, 0.6);
  border-bottom: 1px solid rgba(229, 231, 235, 0.6);
  padding: 80px 0;
}

.brush-decor-tour {
  position: absolute;
  pointer-events: none;
  z-index: 0;
  opacity: 0.45;
  filter: blur(50px);
}
.brush-tour-left {
  top: -5%;
  left: -5%;
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(45, 212, 191, 0.35) 0%, rgba(255, 255, 255, 0) 70%);
}
.brush-tour-right {
  bottom: -5%;
  right: -5%;
  width: 520px;
  height: 520px;
  background: radial-gradient(circle, rgba(251, 146, 60, 0.3) 0%, rgba(255, 255, 255, 0) 70%);
}

.tours-section {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  position: relative;
  z-index: 1;
}
.section-header {
  text-align: center;
  margin-bottom: 40px;
}
.section-title {
  font-size: 2.5rem;
  font-weight: 800;
  color: var(--secondary-color);
  margin-bottom: 12px;
}
.section-desc {
  color: var(--text-muted);
  font-size: 1.1rem;
}

/* Thanh lọc kết quả mới */
.filters-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 20px;
  margin-bottom: 40px;
  padding: 20px;
  border-radius: 15px;
  justify-content: center;
}
.filter-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.filter-group label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--secondary-color);
}
.filter-group input {
  padding: 10px 15px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  outline: none;
  font-family: inherit;
  font-size: 0.95rem;
  background: #ffffff;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.filter-group input:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
}
.filter-group-name input {
  min-width: 230px;
}
.btn-filter {
  padding: 10px 25px;
  height: 42px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.2s;
}
.btn-filter:hover {
  background: var(--secondary-color);
}

.tours-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 32px;
}

/* NÚT XEM TẤT CẢ TOUR */
.view-all-tours-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 45px;
}
.btn-view-all-tours {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 14px 38px;
  font-size: 1.05rem;
  font-weight: 700;
  color: white;
  background: linear-gradient(135deg, var(--primary-color) 0%, #1d4ed8 100%);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 40px;
  cursor: pointer;
  box-shadow: 0 10px 25px rgba(37, 99, 235, 0.35);
  transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
}
.btn-view-all-tours:hover {
  transform: translateY(-3px) scale(1.03);
  box-shadow: 0 16px 35px rgba(37, 99, 235, 0.45);
  background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
}
.btn-view-all-tours svg {
  transition: transform 0.3s ease;
}
.btn-view-all-tours:hover svg {
  transform: translateX(5px);
}

/* About summary */
.about-summary {
  max-width: 900px;
  margin: 20px auto 60px;
  text-align: center;
  padding: 50px;
  border-radius: 20px;
}
.about-content h2 {
  font-size: 2rem;
  color: var(--secondary-color);
  margin-bottom: 20px;
}
.about-content p {
  color: var(--text-muted);
  font-size: 1.1rem;
  line-height: 1.8;
  margin-bottom: 30px;
}
.btn-outline {
  padding: 12px 30px;
  border: 2px solid var(--primary-color);
  background: transparent;
  color: var(--primary-color);
  border-radius: 30px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s;
}
.btn-outline:hover {
  background: var(--primary-color);
  color: white;
}

/* Loading & Error */
.loading-state {
  text-align: center;
  padding: 60px 0;
  color: var(--text-muted);
}
.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(37, 99, 235, 0.2);
  border-left-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 15px;
}
.error-state, .empty-state {
  text-align: center;
  padding: 40px;
  max-width: 600px;
  margin: 0 auto;
}
.btn-retry {
  margin-top: 16px;
  padding: 8px 24px;
  background: var(--secondary-color);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
