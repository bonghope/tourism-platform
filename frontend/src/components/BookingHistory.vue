<template>
  <section class="account-page">
    <p class="muted">CHUYẾN ĐI CỦA BẠN</p><h1>Lịch sử đặt tour</h1>
    <p class="muted">Theo dõi chuyến đi, thanh toán và xem hóa đơn tại một nơi.</p>
    <div class="toolbar"><input v-model="search" aria-label="Tìm kiếm đơn đặt tour" placeholder="Tìm mã đặt tour hoặc tên chuyến đi…" /><select v-model="status" aria-label="Lọc trạng thái"><option value="">Tất cả trạng thái</option><option v-for="s in statuses" :key="s" :value="s">{{ statusLabel(s) }}</option></select><button class="button" :disabled="loading" @click="load">Làm mới</button></div>
    <div v-if="error" class="message error" role="alert">{{ error }}</div>
    <div v-if="loading" class="panel empty" role="status">Đang tải lịch sử đặt tour…</div>
    <template v-else-if="!error">
      <p class="muted">{{ filtered.length }} đơn đặt tour</p>
      <article v-for="b in filtered" :key="b.BookingID" class="panel booking-card">
        <div><span class="badge" :class="b.Status">{{ statusLabel(b.Status) }}</span><h2>{{ b.Title }}</h2><p class="muted">{{ b.BookingID }} · {{ b.PassengerCount }} khách</p><p class="muted">Đặt ngày {{ date(b.CreatedAt) }}</p><p v-if="b.StartDate" class="muted">Khởi hành {{ date(b.StartDate) }}</p></div>
        <div><p class="total">{{ money(b.TotalPrice) }}</p><div class="actions"><router-link class="button" :to="`/bookings/${b.BookingID}`">Chi tiết hóa đơn</router-link><router-link v-if="b.Status === 'PENDING'" class="button primary" :to="`/payment/${b.BookingID}`">Thanh toán</router-link></div></div>
      </article>
      <div v-if="!filtered.length" class="panel empty"><h2>{{ bookings.length ? 'Không tìm thấy đơn phù hợp' : 'Bạn chưa có đơn đặt tour' }}</h2><p class="muted">{{ bookings.length ? 'Thử từ khóa hoặc trạng thái khác.' : 'Khám phá điểm đến và lên kế hoạch cho chuyến đi tiếp theo.' }}</p><div class="actions" style="justify-content:center"><router-link class="button primary" to="/tours">Khám phá tour</router-link></div></div>
    </template>
  </section>
</template>
<script setup>
import { ref, computed, onMounted } from 'vue';
import { getBookings, money, date, statusLabel } from '../services/bookings';
import '../styles/bookings.css';
const bookings = ref([]), loading = ref(true), error = ref(''), search = ref(''), status = ref('');
const statuses = ['PENDING', 'PAID', 'CANCELLED', 'REFUNDING', 'REFUNDED'];
const filtered = computed(() => bookings.value.filter(b => (!status.value || b.Status === status.value) && `${b.BookingID} ${b.Title}`.toLocaleLowerCase('vi').includes(search.value.trim().toLocaleLowerCase('vi'))));
async function load() { loading.value = true; error.value = ''; try { bookings.value = await getBookings(); } catch(e) { error.value = e.message; } finally { loading.value = false; } }
onMounted(load);
</script>
