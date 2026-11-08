<template>
  <section class="account-page">
    <router-link class="no-print" to="/bookings">← Lịch sử đặt tour</router-link><h1>Chi tiết hóa đơn</h1>
    <div v-if="error" class="message error" role="alert">{{ error }}</div>
    <div v-if="loading" class="panel empty" role="status">Đang tải hóa đơn…</div>
    <template v-else-if="booking">
      <p class="muted"><span v-if="authStore.isAdmin">Mã đơn: {{ booking.BookingID }} · </span>Ngày lập {{ date(booking.CreatedAt) }}</p>
      <div v-if="message" class="message" role="status">{{ message }}</div>
      <div class="columns"><div class="panel"><h2>{{ booking.Title }}</h2><span class="badge" :class="booking.Status">{{ statusLabel(booking.Status) }}</span><div class="detail-row"><span>Người liên hệ</span><strong>{{ booking.ContactName }}</strong></div><div class="detail-row"><span>Số điện thoại</span><strong>{{ booking.ContactPhone }}</strong></div><div v-if="authStore.isAdmin" class="detail-row"><span>Mã tour</span><router-link :to="`/tour/${booking.TourID}`">{{ booking.TourID }}</router-link></div><div v-if="booking.StartDate" class="detail-row"><span>Khởi hành</span><strong>{{ date(booking.StartDate) }}</strong></div><div class="detail-row"><span>Số khách</span><strong>{{ booking.PassengerCount }} người</strong></div><div class="detail-row"><span>Phương thức thanh toán</span><strong>{{ booking.PaymentMethod || 'Chưa thanh toán' }}</strong></div><div v-if="authStore.isAdmin" class="detail-row"><span>Mã giao dịch</span><strong>{{ booking.TransactionID || '—' }}</strong></div></div>
      <aside class="panel"><h2>Chi tiết thanh toán</h2><div class="detail-row"><span>Đơn giá / khách</span><strong>{{ money(booking.BasePrice) }}</strong></div><div class="detail-row"><span>Số lượng</span><strong>{{ booking.PassengerCount }}</strong></div><div class="detail-row"><span>Tổng tiền</span><strong class="total">{{ money(booking.TotalPrice) }}</strong></div><p v-if="booking.Status === 'PENDING'" class="muted">Giữ chỗ đến {{ date(booking.HoldExpiresAt) }}</p><div class="actions no-print"><router-link v-if="booking.Status === 'PENDING'" class="button primary" :to="`/payment/${booking.BookingID}`">Tiếp tục thanh toán</router-link><button class="button" @click="printInvoice">In hóa đơn</button><button v-if="canCancel" class="button danger" :disabled="busy" @click="confirming = true">Hủy đặt tour</button></div><p v-if="booking.Status === 'PAID'" class="muted no-print">Đơn đã thanh toán chỉ được hủy trước giờ khởi hành ít nhất 72 giờ.</p></aside></div>
      <div v-if="confirming" class="panel no-print" role="alertdialog" aria-label="Xác nhận hủy tour" style="margin-top:24px"><h2>Xác nhận hủy đặt tour?</h2><p>{{ booking.Status === 'PAID' ? 'Đơn sẽ chuyển sang chờ hoàn tiền nếu đủ điều kiện hủy.' : 'Chỗ đã giữ sẽ được trả lại sau khi hủy.' }}</p><div class="actions"><button class="button" :disabled="busy" @click="confirming = false">Giữ đơn</button><button class="button danger" :disabled="busy" @click="cancel">{{ busy ? 'Đang hủy…' : 'Xác nhận hủy' }}</button></div></div>
      <div v-if="canReview" class="panel no-print" style="margin-top:24px"><h2>Chia sẻ trải nghiệm chuyến đi</h2><p class="muted">Đánh giá của bạn giúp các khách hàng khác lựa chọn tour.</p><div class="actions"><button class="button primary" @click="reviewOpen = true">Viết đánh giá</button></div></div>
      <ReviewForm v-if="reviewOpen && canReview" :booking-id="booking.BookingID" :tour-id="booking.TourID" :tour-title="booking.Title" @close="reviewOpen = false" @submitted="reviewSubmitted" />
      <p v-if="booking.HasReview" class="message">Bạn đã đánh giá đơn này.</p>
      <router-link v-if="booking.Review" class="panel own-review" :to="{ name: 'TourDetail', params: { id: booking.TourID }, hash: '#reviews' }" aria-label="Xem đánh giá trên trang tour">
        <div class="own-review-heading"><strong>Đánh giá của bạn</strong><span class="own-review-stars" :aria-label="booking.Review.Rating + ' trên 5 sao'">{{ '★'.repeat(Math.max(0, Math.min(5, Number(booking.Review.Rating)))) }}{{ '☆'.repeat(5 - Math.max(0, Math.min(5, Number(booking.Review.Rating)))) }}</span></div>
        <p class="muted">{{ date(booking.Review.CreatedAt) }}</p>
        <p class="own-review-content">{{ booking.Review.Content }}</p>
        <p v-if="booking.Review.OwnerReply" class="muted"><strong>TaVivu phản hồi:</strong> {{ booking.Review.OwnerReply }}</p>
        <p v-if="booking.Review.Status === 'HIDDEN'" class="muted">Đánh giá này hiện không hiển thị công khai.</p>
        <span class="own-review-link">Xem đánh giá</span>
      </router-link>
      <p v-else-if="reviewExpired" class="message">Ngoài thời gian đánh giá</p>
    </template>
    <button v-if="error && !booking" class="button" @click="load">Thử lại</button>
  </section>
</template>
<script setup>
import ReviewForm from './ReviewForm.vue';
import { ref, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { getBooking, cancelBooking, money, date, statusLabel } from '../services/bookings';
import '../styles/bookings.css';
const authStore = useAuthStore();
const route = useRoute(), booking = ref(null), loading = ref(true), error = ref(''), busy = ref(false), confirming = ref(false), message = ref(''), reviewOpen = ref(false);
const canCancel = computed(() => booking.value?.Status === 'PENDING' || (booking.value?.Status === 'PAID' && (!booking.value.StartDate || new Date(booking.value.StartDate).getTime() - Date.now() >= 72 * 3600000)));
const canReview = computed(() => { const b = booking.value; if (!b || b.HasReview || b.Status !== 'COMPLETED' || !b.EndDate) return false; const elapsed = Date.now() - new Date(b.EndDate).getTime(); return elapsed >= 0 && elapsed <= 30 * 86400000; });
const reviewExpired = computed(() => { const b = booking.value; return b && !b.HasReview && b.Status === 'COMPLETED' && b.EndDate && Date.now() - new Date(b.EndDate).getTime() > 30 * 86400000; });
async function reviewSubmitted() { reviewOpen.value = false; message.value = 'Cảm ơn bạn đã gửi đánh giá!'; await load(); }
async function load() { loading.value = true; error.value = ''; booking.value = null; confirming.value = false; reviewOpen.value = false; try { booking.value = await getBooking(route.params.bookingId); } catch(e) { error.value = e.message; } finally { loading.value = false; } }
async function cancel() { busy.value = true; error.value = ''; try { const result = await cancelBooking(booking.value.BookingID); message.value = result.message; await load(); } catch(e) { error.value = e.message; } finally { busy.value = false; confirming.value = false; } }
const printInvoice = () => window.print();
watch(() => route.params.bookingId, load, { immediate:true });
</script>
<style scoped>
.own-review { display:block; margin-top:16px; color:inherit; text-decoration:none; transition:box-shadow .2s, border-color .2s; }
.own-review:hover,.own-review:focus-visible { border-color:#0d9488; box-shadow:0 6px 24px #0d948820; }
.own-review-heading { display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; }
.own-review-stars { color:#d97706; font-size:1.25rem; letter-spacing:2px; }
.own-review-content { white-space:pre-wrap; overflow-wrap:anywhere; margin:12px 0; }
.own-review-link { display:inline-block; margin-top:12px; color:#0d9488; font-weight:600; }
</style>
