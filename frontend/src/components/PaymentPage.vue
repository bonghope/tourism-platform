<template>
<section class="account-page"><router-link to="/bookings">← Lịch sử đặt tour</router-link><h1>Thanh toán chuyến đi</h1><p class="muted">Hoàn tất thanh toán để xác nhận chỗ cho chuyến đi.</p><div v-if="error" class="message error" role="alert">{{ error }}</div><div v-if="message" class="message" role="status">{{ message }}</div><div v-if="loading" class="panel empty">Đang tải thông tin thanh toán…</div><template v-else-if="booking"><div v-if="booking.Status !== 'PENDING'" class="message">{{ statusLabel(booking.Status) }}. <router-link :to="`/bookings/${booking.BookingID}`">Xem hóa đơn</router-link></div><div class="columns"><div class="panel"><h2>Phương thức thanh toán</h2><label v-for="option in methods" :key="option.value" class="payment-choice" :class="{ selected: method === option.value }"><input v-model="method" type="radio" name="payment" :value="option.value" :disabled="!payable || busy" /><strong>{{ option.label }}</strong></label><div v-if="booking.Status === 'PENDING'" class="message"><template v-if="remaining === null">Chưa xác định được thời gian giữ chỗ. Hãy khởi động lại backend và kiểm tra trạng thái.</template><template v-else-if="remaining > 0"><p>Thời gian giữ chỗ còn lại</p><p class="countdown">{{ countdown }}</p><p>Thanh toán trước {{ date(booking.HoldExpiresAt) }}.</p></template><template v-else>Đã hết thời gian giữ chỗ. Vui lòng kiểm tra trạng thái hoặc đặt tour lại.</template></div><p class="muted">{{ demoPayment ? 'Chế độ thử nghiệm: mô phỏng thanh toán, không thu tiền thật.' : 'Thanh toán trực tuyến chưa được mở. Vui lòng liên hệ bộ phận hỗ trợ để được hướng dẫn thanh toán.' }}</p><div class="actions"><button v-if="demoPayment" class="button primary" :disabled="!payable || busy" @click="pay">{{ busy ? 'Đang xử lý…' : 'Thanh toán thử ' + money(booking.TotalPrice) }}</button><button class="button" :disabled="busy || checking" @click="refresh(true)">{{ checking ? 'Đang kiểm tra…' : 'Kiểm tra trạng thái' }}</button></div></div><aside class="panel"><h2>Tóm tắt đặt tour</h2><h2>{{ booking.Title }}</h2><p class="muted">{{ booking.BookingID }}</p><div class="detail-row"><span>Người đặt</span><strong>{{ booking.ContactName }}</strong></div><div class="detail-row"><span>Số khách</span><strong>{{ booking.PassengerCount }}</strong></div><div class="detail-row"><span>Đơn giá</span><strong>{{ money(booking.BasePrice) }}</strong></div><div class="detail-row"><span>Tổng thanh toán</span><strong class="total">{{ money(booking.TotalPrice) }}</strong></div><div class="actions"><router-link class="button" :to="`/bookings/${booking.BookingID}`">Chi tiết hóa đơn</router-link></div></aside></div></template><button v-if="error && !booking" class="button" @click="load">Thử lại</button></section>
</template>
<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getBooking, request, money, date, statusLabel, demoPayment } from '../services/bookings';
import '../styles/bookings.css';
import { holdSeconds, remainingSeconds } from '../services/holdClock';
const route = useRoute(), router = useRouter(), booking = ref(null), loading = ref(true), busy = ref(false), error = ref(''), now = ref(Date.now()), method = ref('VNPAY'), checking = ref(false), message = ref(''), duration = ref(null), receivedAt = ref(0);
const methods = [{ value:'VNPAY', label:'Thẻ nội địa / VNPAY' }, { value:'MOMO', label:'Ví MoMo' }, { value:'CHUYENKHOAN', label:'Chuyển khoản ngân hàng' }];
const remaining = computed(() => remainingSeconds(duration.value, receivedAt.value, now.value));
const countdown = computed(() => `${String(Math.floor(remaining.value / 60)).padStart(2, '0')}:${String(remaining.value % 60).padStart(2, '0')}`);
const payable = computed(() => booking.value?.Status === 'PENDING' && remaining.value > 0);
async function refresh(showMessage = false) {
  if (checking.value) return;
  checking.value = true; error.value = ''; message.value = '';
  try {
    booking.value = await getBooking(route.params.bookingId);
    duration.value = holdSeconds(booking.value);
    receivedAt.value = Date.now(); now.value = receivedAt.value;
    if (showMessage === true) message.value = `Đã kiểm tra: ${statusLabel(booking.value.Status)}${remaining.value === null ? '. Chưa xác định được hạn giữ chỗ.' : booking.value.Status === 'PENDING' ? ` · Còn ${countdown.value} giữ chỗ.` : '.'}`;
  } catch(e) { error.value = e.message; }
  finally { checking.value = false; }
}
async function load() { if (methods.some(option => option.value === route.query.method)) method.value = route.query.method; loading.value = true; booking.value = null; await refresh(); loading.value = false; }
async function pay() { if (!demoPayment || !payable.value || busy.value) return; busy.value = true; error.value = ''; try { await request('/bookings/webhook/payment', { method:'POST', body:JSON.stringify({ bookingId:booking.value.BookingID, transactionId:`DEMO-${crypto.randomUUID()}`, paymentMethod:method.value, signature:'MOCK_VALID_SIGNATURE' }) }); await router.push(`/bookings/${booking.value.BookingID}`); } catch(e) { await refresh(); error.value = e.message; } finally { busy.value = false; } }
let timer;
onMounted(() => { timer = setInterval(() => { now.value = Date.now(); }, 1000); });
onUnmounted(() => clearInterval(timer));
watch(() => route.params.bookingId, load, { immediate:true });
</script>
