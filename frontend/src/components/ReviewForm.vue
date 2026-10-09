<template>
  <dialog ref="dialog" class="review-dialog" aria-labelledby="review-title" @cancel="onCancel" @click="onBackdrop">
    <div class="dialog-header"><div><h2 id="review-title">Đánh giá trải nghiệm chuyến đi</h2><p>{{ tourTitle || 'Chia sẻ cảm nhận và hình ảnh của bạn.' }}</p></div><button type="button" class="close" :disabled="busy" aria-label="Đóng đánh giá" @click="close">×</button></div>
    <form @submit.prevent="submit">
      <fieldset :disabled="busy"><legend>Mức độ hài lòng</legend><div class="stars"><button v-for="star in 5" :key="star" type="button" :aria-label="`${star} sao`" :aria-pressed="rating === star" :class="{ active: star <= rating }" @click="rating = star">★</button></div>
      <label for="review-content">Chia sẻ trải nghiệm</label><textarea id="review-content" v-model="content" rows="5" maxlength="5000" required placeholder="Chuyến đi của bạn như thế nào?" /><small>{{ content.length }}/5000 ký tự</small>
      <label for="review-images">Ảnh chuyến đi (không bắt buộc)</label><input id="review-images" type="file" accept="image/jpeg,image/png,image/webp" multiple :disabled="processing || images.length >= 5" @change="selectImages" /><small>Tối đa 5 ảnh JPG, PNG hoặc WebP, mỗi ảnh gốc tối đa 10 MB. Ảnh được thu nhỏ trước khi gửi.</small>
      <div class="previews"><figure v-for="(photo, index) in images" :key="photo.id"><img :src="photo.data" :alt="photo.name" /><button type="button" :aria-label="`Xóa ảnh ${photo.name}`" @click="images.splice(index, 1)">×</button></figure></div></fieldset>
      <p v-if="processing" role="status">Đang xử lý ảnh…</p><p v-if="error" class="error" role="alert">{{ error }}</p>
      <div class="buttons"><button type="button" :disabled="busy" @click="close">Để sau</button><button class="primary" :disabled="busy || processing" type="submit">{{ busy ? 'Đang gửi…' : 'Gửi đánh giá' }}</button></div>
    </form>
  </dialog>
</template>
<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { request } from '../services/bookings';
const props = defineProps({ bookingId:{type:String,required:true}, tourId:{type:String,required:true}, tourTitle:String });
const emit = defineEmits(['close','submitted']);
const dialog = ref(null), rating = ref(5), content = ref(''), images = ref([]), busy = ref(false), processing = ref(false), error = ref('');
let alive = true;
onMounted(() => dialog.value.showModal());
onUnmounted(() => { alive = false; });
function close() { if (!busy.value) { dialog.value.close(); emit('close'); } }
function onCancel(event) { event.preventDefault(); close(); }
function onBackdrop(event) { if (event.target === dialog.value) { const rect = dialog.value.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close(); } }
async function shrink(file) {
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, 1200 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(bitmap.width * scale)); canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext('2d'); context.fillStyle = '#fff'; context.fillRect(0,0,canvas.width,canvas.height); context.drawImage(bitmap,0,0,canvas.width,canvas.height);
    const data = canvas.toDataURL('image/jpeg', .75);
    if (data.length > 680000) throw new Error(`Ảnh ${file.name} quá lớn sau khi xử lý. Vui lòng chọn ảnh nhỏ hơn.`);
    return data;
  } finally { bitmap.close(); }
}
async function selectImages(event) {
  const files = Array.from(event.target.files || []); event.target.value = ''; error.value = '';
  if (images.value.length + files.length > 5) { error.value = 'Chỉ được chọn tối đa 5 ảnh.'; return; }
  processing.value = true;
  try {
    const selected = [];
    for (const file of files) {
      if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024) throw new Error('Chọn ảnh JPG, PNG hoặc WebP không quá 10 MB.');
      selected.push({ id:crypto.randomUUID(), name:file.name, data:await shrink(file) });
    }
    if (alive) images.value.push(...selected);
  } catch(e) { error.value = e.message || 'Không đọc được ảnh. Vui lòng chọn ảnh khác.'; }
  finally { processing.value = false; }
}
async function submit() {
  if (busy.value || processing.value) return;
  if (!content.value.trim()) { error.value = 'Vui lòng nhập nội dung đánh giá.'; return; }
  busy.value = true; error.value = '';
  try { await request('/reviews', {method:'POST', body:JSON.stringify({bookingId:props.bookingId,tourId:props.tourId,rating:rating.value,content:content.value,images:images.value.map(photo=>photo.data)})}); dialog.value.close(); emit('submitted'); }
  catch(e) { error.value = e.message; }
  finally { busy.value = false; }
}
</script>
<style scoped>
.review-dialog { margin:auto; width:min(620px,calc(100% - 32px)); max-height:90vh; overflow:auto; padding:28px; border:0; border-radius:24px; color:var(--text-main); box-shadow:0 24px 80px #0f172a40; font-family:inherit; }
.review-dialog::backdrop { background:#0f172a99; backdrop-filter:blur(4px); } .dialog-header { display:flex; gap:16px; justify-content:space-between; margin-bottom:20px; } h2 { font-size:1.4rem; } p,small { color:var(--text-muted); } .close { font-size:1.6rem; align-self:start; } fieldset { border:0; min-width:0; } legend,label { font-weight:600; } label { display:block; margin:18px 0 8px; } .stars { display:flex; gap:6px; } .stars button { font-size:2rem; color:#cbd5e1; border:0; padding:0 4px; } .stars .active { color:#f59e0b; } textarea { width:100%; padding:12px; border:1px solid #cbd5e1; border-radius:12px; font:inherit; resize:vertical; } small { display:block; font-size:.8rem; } button { font:inherit; border:1px solid #cbd5e1; background:white; padding:10px 16px; border-radius:12px; cursor:pointer; } button:disabled { opacity:.5; cursor:not-allowed; } .buttons { display:flex; gap:12px; justify-content:flex-end; margin-top:24px; } .primary { background:var(--primary-color); color:white; border-color:var(--primary-color); } .error { margin-top:12px; color:#b91c1c; } .previews { display:flex; gap:12px; flex-wrap:wrap; margin-top:16px; } figure { position:relative; } figure img { width:96px; height:96px; object-fit:cover; border-radius:12px; } figure button { position:absolute; right:0; top:0; padding:0 6px; } input { max-width:100%; } @media(max-width:600px) { .review-dialog { padding:20px; } }
</style>
