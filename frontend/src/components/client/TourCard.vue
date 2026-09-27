<template>
  <div class="tour-card" @click="$router.push(`/tour/${tour.TourID}`)">
    <div class="card-image-wrapper">
      <img :src="tour.images && tour.images.length > 0 && !tour.images[0].includes('example.com') ? tour.images[0] : 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'" alt="Tour Image" />
      <div class="card-overlay">
        <div class="card-info">
          <h3 class="title">{{ tour.Title }}</h3>
          <div class="meta">
            <span class="rating">⭐ {{ tour.AverageRating || '5.0' }} Tuyệt vời</span>
            <span class="price">{{ formatPrice(tour.Price) }}</span>
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
import { ref } from 'vue';

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

const isFavorite = ref(props.tour.isFavorite !== undefined ? props.tour.isFavorite : props.isInitialFavorite);

const toggleFavorite = async (e) => {
  e.stopPropagation(); 
  try {
    const res = await fetch(`http://localhost:3000/api/tours/${props.tour.TourID}/favorite`, {
      method: 'POST'
    });
    
    if (res.status === 401 || res.status === 403) {
      alert("Vui lòng đăng nhập để lưu Tour này vào danh sách yêu thích!");
      return;
    }

    const json = await res.json();
    if (json.success) {
      isFavorite.value = json.action === 'added';
    }
  } catch (err) {
    console.error('Lỗi lưu Wishlist', err);
  }
};

const formatPrice = (price) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};
</script>

<style scoped>
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
.price {
  font-size: 1.1rem;
  font-weight: 800;
  color: #fbbf24; /* Vàng kim */
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
