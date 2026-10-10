<template>
  <Teleport to="body"><div class="schedule-overlay" @click.self="!busy && $emit('close')"><section class="schedule-dialog" role="dialog" aria-modal="true" aria-labelledby="schedule-title"><header><h2 id="schedule-title">Lịch khởi hành · {{ tour.Title }}</h2><button :disabled="busy" @click="$emit('close')">Đóng</button></header><p>Thêm lịch mới cho mỗi đợt. Ngày chuyến đi đã có booking được giữ nguyên.</p><p v-if="error" class="error" role="alert">{{ error }}</p><form @submit.prevent="create"><h3>Tạo lịch mới</h3><div class="create-fields">
<label>Ngày khởi hành<input v-model="form.startDay" type="date" required :disabled="busy" /></label>
<label>Giờ khởi hành (Việt Nam)<input v-model="form.startTime" type="time" required :disabled="busy" /></label>
<label>Ngày kết thúc · {{ tour.Duration }}<input :value="endDay" type="date" readonly aria-describedby="duration-note" /></label>
<label>Giờ kết thúc (Việt Nam)<input v-model="form.endTime" type="time" required :disabled="busy" /></label>
<label>Số chỗ tối đa<input v-model.number="form.maxSlots" type="number" min="1" required :disabled="busy" /></label>
</div>
<p id="duration-note" class="hint">{{ durationDays ? `Ngày kết thúc tự tính theo ${durationDays} ngày, gồm cả ngày khởi hành.` : 'Thời lượng tour chưa hợp lệ. Hãy cập nhật duration theo dạng “3 Ngày 2 Đêm”.' }}</p>
<button :disabled="busy || !endDay" class="primary">{{ busy ? 'Đang xử lý…' : 'Thêm lịch khởi hành' }}</button></form><p v-if="loading">Đang tải lịch…</p><div v-else class="rows"><article v-for="d in departures" :key="d.DepartureID"><strong>{{ date(d.StartDate) }} → {{ date(d.EndDate) }}</strong><p>{{ d.AvailableSlots }}/{{ d.MaxSlots }} chỗ trống · {{ d.Status === 'OPEN' ? 'Mở bán' : 'Đóng bán' }}</p><div class="fields"><label>Sức chứa<input v-model.number="d.newMax" type="number" min="1" :disabled="busy" /></label><button :disabled="busy" @click="update(d,{maxSlots:d.newMax})">Lưu sức chứa</button><button :disabled="busy" @click="update(d,{status:d.Status === 'OPEN' ? 'CLOSED' : 'OPEN'})">{{ d.Status === 'OPEN' ? 'Đóng bán' : 'Mở bán' }}</button></div></article><p v-if="!departures.length">Chưa có lịch khởi hành.</p></div></section></div></Teleport>
</template>
<script setup>
import { ref, computed, onMounted } from 'vue';
import adminApi from '../services/api';
const props = defineProps({ tour:{type:Object,required:true} });const emit=defineEmits(['close','updated']);
const emptyForm = () => ({startDay:'',startTime:'08:00',endTime:'18:00',maxSlots:25});
const departures=ref([]),error=ref(''),busy=ref(false),loading=ref(true),form=ref(emptyForm());
const durationDays = computed(() => {
  const match = String(props.tour.Duration || '').match(/^(\d+)\s*(?:ngày|days?)(?:\s|$)/i);
  const days = match ? Number(match[1]) : 0;
  return Number.isInteger(days) && days > 0 ? days : 0;
});
const endDay = computed(() => {
  if (!form.value.startDay || !durationDays.value) return '';
  const day = new Date(`${form.value.startDay}T00:00:00Z`);
  if (!Number.isFinite(day.getTime())) return '';
  day.setUTCDate(day.getUTCDate() + durationDays.value - 1);
  return day.toISOString().slice(0,10);
});
const date=value=>value?new Date(value).toLocaleString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh'}):'Chưa xác định';
async function load(){loading.value=true;try{const data=await adminApi.getDepartures(props.tour.TourID);departures.value=data.data.map(d=>({...d,newMax:d.MaxSlots}));}catch(e){error.value=e.message;}finally{loading.value=false;}}
async function create(){busy.value=true;error.value='';try{if (!endDay.value) throw new Error('Vui lòng chọn ngày khởi hành và kiểm tra thời lượng tour.'); await adminApi.createDeparture(props.tour.TourID,{startDate:`${form.value.startDay}T${form.value.startTime}`,endDate:`${endDay.value}T${form.value.endTime}`,maxSlots:form.value.maxSlots});form.value=emptyForm();await load();emit('updated');}catch(e){error.value=e.message;}finally{busy.value=false;}}
async function update(d,payload){busy.value=true;error.value='';try{await adminApi.updateDeparture(props.tour.TourID,d.DepartureID,payload);await load();emit('updated');}catch(e){error.value=e.message;}finally{busy.value=false;}}
onMounted(load);
</script>
<style scoped>
.schedule-overlay{position:fixed;inset:0;background:#0f172a99;display:flex;align-items:center;justify-content:center;z-index:3000;padding:20px}.schedule-dialog{background:white;color:#1e293b;border-radius:24px;padding:28px;width:850px;max-width:100%;max-height:90vh;overflow:auto}header,.fields{display:flex;gap:16px;align-items:center;flex-wrap:wrap}header{justify-content:space-between}label{display:flex;flex-direction:column;gap:6px}input,button{padding:10px;border:1px solid #cbd5e1;border-radius:8px;font:inherit}button{cursor:pointer;background:white}button:disabled{opacity:.5}form,article{padding:20px 0;border-bottom:1px solid #e2e8f0}p{margin:12px 0}.primary{background:#2563eb;color:white;margin-top:16px}.error{color:#b91c1c}
.create-fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin-top:12px}.create-fields label{min-width:0}.create-fields input{width:100%;box-sizing:border-box;min-width:0}.create-fields input[readonly]{background:#f1f5f9;color:#475569}.hint{font-size:.9rem;color:#64748b}@media(max-width:600px){.create-fields{grid-template-columns:1fr}.schedule-dialog{padding:20px}}
</style>
