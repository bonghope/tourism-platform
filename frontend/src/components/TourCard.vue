<template>
  <div class="tour-card" @click="$router.push({ path: `/tour/${tour.TourID}`, query: $route.query })">
    <div class="card-image-wrapper">
      <span v-if="discountPercent > 0" class="discount-badge">Giảm {{ discountPercent }}%</span>
      <img 
        :src="displayImage" 
        :alt="tour.Title" 
        loading="lazy"
        @error="handleImageError"
      />
      <div class="card-overlay">
        <div class="card-info">
          <h3 class="title">{{ tour.Title }}</h3>
          <p class="departure-info">{{ tour.Duration }}<template v-if="tour.StartDate"> · {{ departureDate }}</template></p>
          <div class="meta">
            <span class="rating">{{ Number(tour.ReviewCount) > 0 ? '⭐ ' + Number(tour.AverageRating).toFixed(1) + ' (' + tour.ReviewCount + ' đánh giá)' : 'Chưa có đánh giá' }}</span>
            <span class="price-group"><del v-if="discountPercent > 0" class="original-price">{{ formatPrice(tour.OriginalPrice) }}</del><span class="price">{{ formatPrice(tour.Price) }}</span></span>
          </div>
        </div>
      </div>
      <button class="btn-favorite" @click.stop="toggleFavorite">
        <svg xmlns="http://www.w3.org/2000/svg" :fill="isFavorite ? '#ef4444' : 'none'" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="icon-heart">
          <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useToastStore } from '../stores/toast';

const authStore = useAuthStore();
const toastStore = useToastStore();

const defaultTourImage = 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=800&q=80';

const props = defineProps({
  tour: {
    type: Object,
    required: true
  },
  isInitialFavorite: {
    type: Boolean,
    default: false
  }
});
const departureDate = computed(() => {
  const date = new Date(props.tour.StartDate);
  return Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric' }).format(date) : '';
});
const discountPercent = computed(() => Number(props.tour.OriginalPrice) > Number(props.tour.Price)
  ? Math.round((1 - Number(props.tour.Price) / Number(props.tour.OriginalPrice)) * 100) : 0);

const isFavorite = ref(props.tour.isFavorite !== undefined ? !!props.tour.isFavorite : props.isInitialFavorite);

watch(() => props.tour.isFavorite, (newVal) => {
  if (newVal !== undefined) {
    isFavorite.value = !!newVal;
  }
});

const displayImage = computed(() => {
  if (props.tour.images && props.tour.images.length > 0 && !props.tour.images[0].includes('example.com')) {
    return props.tour.images[0];
  }
  if (props.tour.ImageURL && !props.tour.ImageURL.includes('example.com')) {
    return props.tour.ImageURL;
  }
  if (props.tour.image && !props.tour.image.includes('example.com')) {
    return props.tour.image;
  }
  return defaultTourImage;
});

const handleImageError = (e) => {
  e.target.src = defaultTourImage;
};

const toggleFavorite = async (e) => {
  e.stopPropagation(); 
  
  if (!authStore.token) {
    toastStore.warning("Vui lòng đăng nhập để lưu Tour này vào danh sách yêu thích!");
    authStore.openModal('login');
    return;
  }

  try {
    const res = await fetch(`http://localhost:3000/api/tours/${props.tour.TourID}/favorite`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authStore.token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (res.status === 401 || res.status === 403) {
      toastStore.warning("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!");
      authStore.openModal('login');
      return;
    }

    const json = await res.json();
    if (json.success) {
      isFavorite.value = json.action === 'added';
      if (isFavorite.value) {
        toastStore.success('Đã lưu tour vào danh sách yêu thích ❤️');
      } else {
        toastStore.info('Đã bỏ yêu thích tour');
      }
    } else {
      toastStore.error(json.message || 'Lỗi khi cập nhật yêu thích');
    }
  } catch (err) {
    console.error('Lỗi lưu Wishlist', err);
    toastStore.error('Có lỗi xảy ra khi cập nhật danh sách yêu thích.');
  }
};

const formatPrice = (price) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};
</script>

<style scoped>
.discount-badge { position: absolute; top: 16px; left: 16px; z-index: 2; padding: 7px 12px; background: #007d68; border-radius: 20px; color: white; font-size: .85rem; font-weight: 800; }
.price-group { display: flex; flex-direction: column; align-items: end; flex-shrink: 0; gap: 4px; }
.original-price { font-size: .8rem; color: #e2e8f0; font-weight: 400; }
.departure-info { margin: 0 0 8px; color: #e3f5ef; font-size: .82rem; line-height: 1.5; }
.tour-card {
  width: 100%;
  aspect-ratio: 1; /* Cắt thành hình vuông hoàn hảo */
  border-radius: 20px;
  overflow: hidden;
  position: relative;
  cursor: pointer;
  box-shadow: 0 10px 20px rgba(0,0,0,0.1);
  transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.4s ease;
}
.tour-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 40px rgba(0,0,0,0.2);
}
.card-image-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
}
.card-image-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.8s ease;
}
.tour-card:hover .card-image-wrapper img {
  transform: scale(1.1);
}
.card-overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 40%, rgba(0,0,0,0) 100%);
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 24px;
}
.card-info {
  color: white;
}
.title {
  font-size: 1.4rem;
  font-weight: 800;
  margin-bottom: 8px;
  line-height: 1.2;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.95rem;
  font-weight: 600;
}
.rating {
  display: flex;
  align-items: center;
  gap: 4px;
}
.price-stack {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}
.old-price {
  font-size: 0.8rem;
  font-weight: 500;
  text-decoration: line-through;
  color: rgba(255, 255, 255, 0.7);
}
.price {
  font-size: 1.1rem;
  font-weight: 800;
  color: #fbbf24; /* Vàng kim */
}
.card-discount-badge {
  position: absolute;
  top: 16px;
  left: 16px;
  background: #ef4444;
  color: #ffffff;
  font-size: 0.75rem;
  font-weight: 800;
  padding: 4px 8px;
  border-radius: 6px;
  box-shadow: 0 4px 10px rgba(239, 68, 68, 0.4);
  letter-spacing: -0.02em;
  z-index: 10;
}
.btn-favorite {
  position: absolute;
  top: 16px;
  right: 16px;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.5);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  backdrop-filter: blur(8px);
  transition: transform 0.2s, background 0.2s;
  z-index: 10;
}
.btn-favorite:hover {
  transform: scale(1.1);
  background: rgba(255, 255, 255, 0.9);
}
.icon-heart {
  width: 22px;
  height: 22px;
  color: white;
}
.btn-favorite:hover .icon-heart {
  color: #ef4444; /* Đỏ khi hover nếu chưa lưu, hoặc nếu đang lưu */
}
</style>
