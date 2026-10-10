<template>
  <small v-if="credit" class="photo-credit">
    Ảnh: <a :href="credit.sourcePage" target="_blank" rel="noopener noreferrer">{{ credit.author || 'Wikimedia Commons' }}</a>
    <template v-if="credit.license"> · <a :href="credit.licenseUrl" target="_blank" rel="noopener noreferrer">{{ credit.license }}</a></template>
  </small>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
const props = defineProps({ image: String });
const credits = ref({});
const credit = computed(() => credits.value[props.image]);
onMounted(async () => {
  try {
    const response = await fetch('/images/catalog/credits.json');
    if (response.ok) credits.value = await response.json();
  } catch { /* Image credits are independent from tour availability. */ }
});
</script>

<style scoped>
.photo-credit { display: block; color: #64748b; font-size: .75rem; line-height: 1.6; padding: 10px 4px; }
.photo-credit a { color: inherit; text-decoration: underline; text-underline-offset: 2px; }
</style>
