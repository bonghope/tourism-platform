<template>
  <div class="booking-page">
    <div class="header-section text-center">
      <h1>Xác nhận Đặt Tour</h1>
      <p>Vui lòng điền thông tin để hoàn tất giữ chỗ</p>
    </div>

    <div v-if="loadingTour" class="loading-state">
      <div class="spinner"></div>
      <p>Đang tải thông tin chuyến đi...</p>
    </div>

    <div v-else-if="!tour" class="alert error-alert" role="alert">{{ errorMsg || 'Không tìm thấy tour.' }} <button type="button" @click="fetchTour">Thử lại</button></div>
    <div v-else-if="tour" class="booking-container">
      <!-- Cột Trái: Form điền thông tin -->
      <div class="form-section glass-panel">
        <h2>Thông tin liên hệ</h2>
        <form @submit.prevent="submitBooking" class="booking-form">
          <div class="form-group">
            <label>Họ và tên người đặt (*)</label>
            <input type="text" v-model="form.contactName" required placeholder="VD: Nguyễn Văn A" />
          </div>
          
          <div class="form-group">
            <label>Số điện thoại (*)</label>
            <input type="tel" v-model="form.contactPhone" required placeholder="VD: 0912345678" />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Số lượng khách (*)</label>
              <input type="number" v-model="form.passengerCount" min="1" :max="Math.min(10, tour.AvailableSlots)" required />
            </div>
            <div class="form-group">
              <label>Phương thức thanh toán</label>
              <select v-model="form.paymentMethod">
                <option value="VNPAY">Thẻ nội địa / VNPAY</option>
                <option value="MOMO">Ví MoMo</option>
                <option value="CHUYENKHOAN">Chuyển khoản ngân hàng</option>
              </select>
            </div>
          </div>

          <!-- Thông báo lỗi hoặc thành công -->
          <div v-if="errorMsg" class="alert error-alert">⚠️ {{ errorMsg }}</div>
          <div v-if="successMsg" class="alert success-alert">✅ {{ successMsg }}</div>

          <button type="submit" class="btn-book-submit" :disabled="isSubmitting">
            <span v-if="isSubmitting" class="spinner-small"></span>
            <span v-else>Giữ chỗ & Tiếp tục thanh toán</span>
          </button>
        </form>
      </div>

      <!-- Cột Phải: Tóm tắt Tour -->
      <div class="summary-section glass-panel">
        <img :src="tour.ImageURL || defaultImage" alt="Tour Cover" class="summary-img" />
        <div class="summary-content">
          <h3>{{ tour.Title }}</h3>
          <ul class="summary-details">
            <li><strong>Mã Tour:</strong> {{ tour.TourID }}</li>
            <li><strong>Khởi hành:</strong> {{ formatDate(tour.StartDate) }}</li>
            <li><strong>Còn trống:</strong> {{ tour.AvailableSlots }} chỗ</li>
          </ul>
          <div class="divider"></div>
          <div class="price-calc">
            <span>Đơn giá (1 khách):</span>
            <span>{{ formatPrice(tour.Price) }}</span>
          </div>
          <p v-if="Number(tour.OriginalPrice) > Number(tour.Price)" class="discount-note">Đã giảm từ <del>{{ formatPrice(tour.OriginalPrice) }}</del> · Tiết kiệm {{ formatPrice(tour.OriginalPrice - tour.Price) }} / khách</p>
          <div class="price-total">
            <span>Tổng tiền:</span>
            <span class="total-value">{{ formatPrice(tour.Price * form.passengerCount) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { request, userId } from '../services/bookings';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const defaultImage = 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=800&q=80';

const tour = ref(null);
const loadingTour = ref(true);
const isSubmitting = ref(false);
const errorMsg = ref('');
const successMsg = ref('');

const form = ref({
  contactName: '',
  contactPhone: '',
  passengerCount: 1,
  paymentMethod: 'VNPAY'
});

// Lấy thông tin Tour để hiển thị bên cột phải
const fetchTour = async () => {
  loadingTour.value = true;
  errorMsg.value = '';
  try {
    tour.value = (await request(`/tours/${encodeURIComponent(route.params.id)}`)).data;
  } catch (err) {
    errorMsg.value = err.message;
  } finally {
    loadingTour.value = false;
  }
};

// M3: Xử lý gọi API Đặt Tour (Có Row-level lock ở Backend)
const submitBooking = async () => {
  isSubmitting.value = true;
  errorMsg.value = '';
  successMsg.value = '';

  try {
    const count = Number(form.value.passengerCount);
    if (!Number.isInteger(count) || count < 1 || count > Math.min(10, tour.value.AvailableSlots)) throw new Error('Số khách không hợp lệ (tối đa 10 người và không vượt số chỗ trống).');
    const json = await request('/bookings', { method: 'POST', body: JSON.stringify({ tourId: tour.value.TourID, userId: userId(), ...form.value, passengerCount: count }) });
    await router.push({ path: `/payment/${encodeURIComponent(json.bookingId)}`, query: { method: form.value.paymentMethod } });
  } catch (err) {
    errorMsg.value = err.message;
  } finally {
    isSubmitting.value = false;
  }
};

const formatPrice = (price) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
const formatDate = (dateString) => new Date(dateString).toLocaleDateString('vi-VN');

onMounted(() => {
  fetchTour();
});
</script>

<style scoped>
.discount-note { color: #007d68; font-size: .9rem; line-height: 1.6; }
.booking-page { max-width: 1100px; margin: 0 auto; padding: 100px 20px 60px; }
.header-section { margin-bottom: 40px; }
.header-section h1 { font-size: 2.5rem; color: var(--secondary-color); margin-bottom: 10px; }
.header-section p { color: var(--text-muted); font-size: 1.1rem; }

.booking-container { display: grid; grid-template-columns: 3fr 2fr; gap: 30px; align-items: start; }

/* Form Section */
.form-section { padding: 40px; border-radius: var(--radius-xl); }
.form-section h2 { font-size: 1.5rem; color: var(--secondary-color); margin-bottom: 24px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
.booking-form { display: flex; flex-direction: column; gap: 20px; }
.form-group { display: flex; flex-direction: column; gap: 8px; flex: 1; }
.form-row { display: flex; gap: 20px; }
.form-group label { font-size: 0.95rem; font-weight: 600; color: var(--text-main); }
.form-group input, .form-group select { padding: 12px 16px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 1rem; outline: none; transition: border-color 0.2s; font-family: inherit; }
.form-group input:focus, .form-group select:focus { border-color: var(--primary-mint, #00b99a); box-shadow: 0 0 0 3px rgba(0, 185, 154, 0.18); }

/* Alerts */
.alert { padding: 12px 16px; border-radius: 8px; font-weight: 600; font-size: 0.95rem; }
.error-alert { background: #fee2e2; color: #dc2626; border: 1px solid #f87171; }
.success-alert { background: #dcfce3; color: #16a34a; border: 1px solid #4ade80; }

.btn-book-submit { padding: 16px; background: var(--primary-gradient, var(--primary-color)); color: white; border: none; border-radius: 8px; font-size: 1.1rem; font-weight: 700; cursor: pointer; transition: 0.2s; display: flex; justify-content: center; box-shadow: 0 4px 14px rgba(0, 125, 104, 0.25); }
.btn-book-submit:hover:not(:disabled) { opacity: 0.95; transform: translateY(-1px); box-shadow: 0 6px 18px rgba(0, 125, 104, 0.35); }
.btn-book-submit:disabled { opacity: 0.7; cursor: not-allowed; }

/* Summary Section */
.summary-section { padding: 24px; border-radius: var(--radius-xl); background: white; }
.summary-img { width: 100%; height: 200px; object-fit: cover; border-radius: var(--radius-lg); margin-bottom: 20px; }
.summary-content h3 { font-size: 1.3rem; color: var(--secondary-color); margin-bottom: 16px; line-height: 1.4; }
.summary-details { list-style: none; padding: 0; margin-bottom: 20px; color: var(--text-muted); font-size: 0.95rem; line-height: 1.8; }
.divider { height: 1px; background: #e2e8f0; margin: 20px 0; }
.price-calc, .price-total { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.price-total { margin-top: 16px; font-size: 1.2rem; font-weight: 700; color: var(--secondary-color); }
.total-value { font-size: 1.8rem; color: var(--primary-color); }

.spinner-small { width: 20px; height: 20px; border: 3px solid rgba(255,255,255,0.3); border-left-color: white; border-radius: 50%; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
@media (max-width: 768px) { .booking-page { padding-top:140px; } .booking-container, .form-row { grid-template-columns: 1fr; flex-direction: column; } }
</style>
