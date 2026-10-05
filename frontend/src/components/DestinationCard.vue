<template>
  <div class="dest-card glass-panel" @click="goToSearch">
    <img 
      :src="destination.ImageURL || defaultDestImage" 
      :alt="destination.Name" 
      class="dest-image" 
      loading="lazy"
      @error="handleImgError" 
    />
    
    <button class="btn-favorite" @click.stop="toggleFavorite">
      <svg xmlns="http://www.w3.org/2000/svg" :fill="isFavorite ? '#ef4444' : 'none'" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="icon-heart">
        <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
      </svg>
    </button>

    <div class="dest-overlay">
      <h3>{{ destination.Name }}</h3>
      <p v-if="destination.Description">{{ destination.Description.substring(0, 50) }}...</p>
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const defaultDestImage = 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=800&q=80';

const props = defineProps({
  destination: {
    type: Object,
    required: true
  },
  isInitialFavorite: {
    type: Boolean,
    default: false
  }
});

const router = useRouter();
const isFavorite = ref(props.isInitialFavorite);

const handleImgError = (e) => {
  e.target.src = defaultDestImage;
};

const toggleFavorite = async () => {
  try {
    const res = await fetch(`http://localhost:3000/api/destinations/${props.destination.DestinationID}/favorite`, {
      method: 'POST'
    });
    const json = await res.json();
    if (json.success) {
      isFavorite.value = json.action === 'added';
    }
  } catch (err) {
    console.error('Lỗi lưu Wishlist', err);
  }
};

const goToSearch = () => {
  router.push(`/destination/${props.destination.DestinationID}`);
};
</script>

<style scoped>
.dest-card {
  position: relative;
  height: 350px;
  border-radius: var(--radius-lg);
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.4s;
}
.dest-card:hover {
  transform: translateY(-8px);
  box-shadow: var(--shadow-lg);
}
.dest-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s;
}
.dest-card:hover .dest-image {
  transform: scale(1.05);
}
.btn-favorite {
  position: absolute;
  top: 12px;
  right: 12px;
  background: rgba(255, 255, 255, 0.8);
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  backdrop-filter: blur(4px);
  transition: transform 0.2s;
  z-index: 10;
}
.btn-favorite:hover {
  transform: scale(1.1);
}
.icon-heart {
  width: 20px;
  height: 20px;
  color: #ef4444;
}
.dest-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 40px 20px 20px;
  background: linear-gradient(to top, rgba(15, 23, 42, 0.9), transparent);
  color: white;
  z-index: 5;
}
.dest-overlay h3 {
  font-size: 1.6rem;
  margin-bottom: 8px;
  font-weight: 800;
}
</style>
