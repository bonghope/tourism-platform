<template>
  <div class="home-page">
    <header class="hero">
      <div class="hero-content">
        <h1 class="hero-title">Khám phá thế giới <br/><span class="highlight">cùng TaiTravel</span></h1>
        <p class="hero-subtitle">Tìm kiếm những điểm đến tuyệt vời và tạo nên những kỉ niệm khó quên.</p>
        
        <div class="booking-search-box glass-panel">
          <div class="search-form">
            <!-- Keyword -->
            <div class="form-group dest-group">
              <label>ĐIỂM ĐẾN</label>
              <div class="input-wrapper">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="icon"><path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
                <input type="text" v-model="searchKeyword" placeholder="VD: Đà Nẵng, Sapa..." @keyup.enter="handleSearch" />
              </div>
            </div>
            
            <div class="divider"></div>

            <!-- Price -->
            <div class="form-group price-group">
              <label>GIÁ TỪ (VNĐ)</label>
              <input type="number" v-model="filterMinPrice" placeholder="VD: 1000000" @keyup.enter="handleSearch" />
            </div>
            
            <div class="divider"></div>

            <div class="form-group price-group">
              <label>ĐẾN (VNĐ)</label>
              <input type="number" v-model="filterMaxPrice" placeholder="VD: 5000000" @keyup.enter="handleSearch" />
            </div>
            
            <div class="divider"></div>

            <!-- Date -->
            <div class="form-group date-group">
              <label>KHỞI HÀNH TỪ</label>
              <input type="date" v-model="filterStartDate" @change="handleSearch" />
            </div>

            <!-- Button -->
            <button class="btn-search-main" @click="handleSearch">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="icon-search"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
              <span>Tìm kiếm</span>
            </button>
          </div>
        </div>
      </div>
    </header>


    <!-- Section: Điểm đến nổi bật (Featured Destinations - Hình tròn theo mẫu) -->
    <section v-if="destinations.length > 0" class="tours-section">
      <div class="section-header">
        <h2 class="section-title">Điểm Đến Nổi Bật</h2>
        <p class="section-desc">Những vùng đất tuyệt vời nhất đang chờ bạn khám phá</p>
      </div>
      <div class="destinations-grid">
        <div class="dest-circle" v-for="dest in destinations" :key="dest.DestinationID" @click="$router.push(`/destination/${dest.DestinationID}`)">
          <img :src="dest.Images || 'https://images.unsplash.com/photo-1528181304800-259b08848526?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'" :alt="dest.Name" />
          <div class="dest-overlay">
            <h3>{{ dest.Name }}</h3>
          </div>
        </div>
      </div>
    </section>

    <!-- Section: Gợi ý riêng -->
    <section v-if="recommendedTours.length > 0" class="tours-section" style="padding-top: 0;">
      <div class="section-header">
        <h2 class="section-title">Gợi Ý Dành Riêng Cho Bạn</h2>
        <p class="section-desc">Dựa trên các địa danh bạn đã yêu thích</p>
      </div>
      <div class="tours-grid">
        <TourCard v-for="tour in recommendedTours" :key="tour.TourID" :tour="tour" />
      </div>
    </section>

    <section class="tours-section" :style="recommendedTours.length > 0 ? 'padding-top: 0;' : ''">
      <div class="section-header">
        <h2 class="section-title">Tour Nổi Bật</h2>
        <p class="section-desc">Những chuyến đi được lựa chọn nhiều nhất trong tháng</p>
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
    </section>

    <!-- Section: Về chúng tôi ngắn gọn (Đã chuyển xuống dưới) -->
    <section class="about-summary glass-panel">
      <div class="about-content">
        <h2>Về Chúng Tôi – TaiTravel</h2>
        <p>Thương hiệu lữ hành mũi nhọn thuộc hệ sinh thái Tai Group, chuyên kiến tạo những hành trình trọn vẹn, đẳng cấp và cá nhân hóa. Với mạng lưới đối tác toàn cầu, chúng tôi tự hào mang đến cho bạn những trải nghiệm du lịch tuyệt vời nhất.</p>
        <button class="btn-outline" @click="$router.push('/about')">Đọc thêm</button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import TourCard from '../../components/client/TourCard.vue';

const route = useRoute();
const tours = ref([]);
const recommendedTours = ref([]);
const destinations = ref([]);
const loading = ref(true);
const error = ref(null);
const searchKeyword = ref('');
const filterMinPrice = ref('');
const filterMaxPrice = ref('');
const filterStartDate = ref('');

let currentDestId = null;

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
    url.searchParams.append('limit', '12');
    
    if (currentDestId) {
      url.searchParams.append('destinationId', currentDestId);
    } else if (searchKeyword.value.trim()) {
      url.searchParams.append('keyword', searchKeyword.value.trim());
    }

    if (filterMinPrice.value) url.searchParams.append('minPrice', filterMinPrice.value);
    if (filterMaxPrice.value) url.searchParams.append('maxPrice', filterMaxPrice.value);
    if (filterStartDate.value) url.searchParams.append('startDate', filterStartDate.value);

    const res = await fetch(url.toString());
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
    const res = await fetch('http://localhost:3000/api/destinations/recommendations');
    const json = await res.json();
    if (json.success && json.data.length > 0) {
      recommendedTours.value = json.data;
    }
  } catch (err) {
    console.error('Không thể lấy danh sách gợi ý', err);
  }
};

const fetchDestinations = async () => {
  try {
    const res = await fetch('http://localhost:3000/api/destinations');
    const json = await res.json();
    if (json.success) {
      // Lấy 8 điểm đến nổi bật thay vì 4
      destinations.value = json.data.slice(0, 8);
    }
  } catch (err) {
    console.error('Không thể lấy danh sách điểm đến', err);
  }
};

onMounted(() => {
  // Bắt tham số '?search=' nếu được đẩy sang từ trang Địa danh
  if (route.query.search) {
    searchKeyword.value = route.query.search;
    handleSearch();
  } else {
    fetchTours();
  }
  
  // Tải danh sách gợi ý cá nhân hóa và điểm đến
  fetchRecommendations();
  fetchDestinations();
});
</script>

<style scoped>
.home-page {
  width: 100%;
}
.hero {
  height: 65vh;
  min-height: 500px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(248, 250, 252, 0.9) 0%, rgba(226, 232, 240, 0.4) 100%), url('https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80') center/cover;
  background-attachment: fixed;
  position: relative;
  text-align: center;
  padding: 0 20px;
}
.hero-title {
  font-size: 4rem;
  font-weight: 800;
  line-height: 1.1;
  color: var(--secondary-color);
  margin-bottom: 24px;
  animation: slideUp 0.8s ease-out;
}
.highlight {
  color: var(--primary-color);
}
.hero-subtitle {
  font-size: 1.2rem;
  color: var(--text-muted);
  margin-bottom: 40px;
  animation: slideUp 1s ease-out;
}
.booking-search-box {
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
  border-radius: 50px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  box-shadow: 0 20px 40px rgba(0,0,0,0.1);
  padding: 8px 8px 8px 32px;
  animation: slideUp 1.2s ease-out;
}
.search-form {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}
.form-group {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  flex: 1;
  padding: 8px 16px;
}
.dest-group {
  flex: 1.5;
}
.form-group label {
  font-size: 0.8rem;
  font-weight: 800;
  color: var(--secondary-color);
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.input-wrapper {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 8px;
}
.input-wrapper .icon {
  width: 20px;
  height: 20px;
  color: var(--primary-color);
}
.form-group input {
  width: 100%;
  border: none;
  background: transparent;
  font-size: 1.05rem;
  font-family: inherit;
  color: var(--text-main);
  outline: none;
  font-weight: 500;
}
.form-group input::placeholder {
  color: var(--text-muted);
  font-weight: 400;
}
.divider {
  width: 1px;
  height: 40px;
  background: rgba(0,0,0,0.1);
  margin: 0 8px;
}
.btn-search-main {
  background: var(--primary-color);
  color: white;
  border: none;
  height: 56px;
  padding: 0 32px;
  border-radius: 40px;
  font-size: 1.05rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: transform 0.2s, box-shadow 0.2s;
  flex-shrink: 0;
}
.btn-search-main:hover {
  transform: scale(1.05);
  box-shadow: 0 10px 20px rgba(37, 99, 235, 0.3);
}
.icon-search {
  width: 20px;
  height: 20px;
}

/* About summary */
.about-summary {
  max-width: 900px;
  margin: -40px auto 40px;
  position: relative;
  z-index: 10;
  text-align: center;
  padding: 40px;
}
.about-content h2 {
  font-size: 1.8rem;
  color: var(--secondary-color);
  margin-bottom: 16px;
}
.about-content p {
  color: var(--text-muted);
  font-size: 1.1rem;
  margin-bottom: 24px;
}
.btn-outline {
  padding: 10px 24px;
  border: 2px solid var(--primary-color);
  background: transparent;
  color: var(--primary-color);
  border-radius: 20px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s;
}
.btn-outline:hover {
  background: var(--primary-color);
  color: white;
}

/* Destinations Grid */
.destinations-grid {
  display: flex;
  justify-content: center;
  gap: 40px;
  flex-wrap: wrap;
}
.dest-circle {
  width: 220px;
  height: 220px;
  border-radius: 50%;
  overflow: hidden;
  position: relative;
  cursor: pointer;
  box-shadow: 0 10px 20px rgba(0,0,0,0.1);
}
.dest-circle img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.6s ease;
}
.dest-circle:hover img {
  transform: scale(1.1);
}
.dest-overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.3s;
}
.dest-circle:hover .dest-overlay {
  background: rgba(0,0,0,0.5);
}
.dest-overlay h3 {
  color: white;
  font-size: 1.8rem;
  font-style: italic;
  font-weight: 700;
  letter-spacing: 1px;
}

.tours-section {
  max-width: 1200px;
  margin: 0 auto;
  padding: 80px 24px;
}
.section-header {
  text-align: center;
  margin-bottom: 60px;
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

.tours-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 32px;
}

/* Loading state */
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
.error-state {
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
@keyframes slideUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
