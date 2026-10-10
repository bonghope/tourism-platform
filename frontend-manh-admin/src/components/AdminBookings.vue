<template>
  <div class="panel-container">
    <!-- TOAST NOTIFICATION -->
    <transition name="toast-fade">
      <div v-if="toastMsg" :class="['admin-toast', toastType === 'error' ? 'toast-error' : 'toast-success']">
        <svg v-if="toastType === 'error'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
        <span>{{ toastMsg }}</span>
      </div>
    </transition>

    <div class="panel-toolbar">
      <div class="toolbar-title">
        <h2>Quản lý Đơn đặt chỗ (Bookings)</h2>
        <p>Theo dõi hóa đơn thanh toán và xử lý hủy đơn khẩn cấp</p>
      </div>

      <!-- Bộ lọc trạng thái -->
      <div class="filter-tabs">
        <button 
          v-for="st in filterOptions" 
          :key="st.key" 
          :class="['filter-btn', currentFilter === st.key ? 'active' : '']"
          @click="selectFilter(st.key)"
        >
          {{ st.label }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="state-box">
      <div class="spinner"></div>
      <p style="margin-top: 12px; color: #64748b;">Đang tải danh sách đơn đặt chỗ...</p>
    </div>

    <div v-else-if="bookings.length === 0" class="state-box">
      <p style="color: #64748b;">Không có đơn đặt chỗ nào trong trạng thái này.</p>
    </div>

    <div v-else class="table-responsive">
      <table class="data-table">
        <thead>
          <tr>
            <th>Mã đơn</th>
            <th>Khách hàng</th>
            <th>Tour đặt</th>
            <th>Số khách</th>
            <th>Tổng tiền & Cổng</th>
            <th>Trạng thái</th>
            <th style="text-align: right;">Hành động</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="b in bookings" :key="b.BookingID">
            <td>
              <div class="booking-code font-mono">{{ b.BookingID }}</div>
              <small class="text-muted">{{ formatDate(b.CreatedAt) }}</small>
            </td>
            <td>
              <div class="customer-info">
                <strong>{{ b.CustomerName || b.ContactName }}</strong>
                <small class="text-muted">{{ b.Email }}</small>
                <small class="text-muted">{{ b.ContactPhone }}</small>
              </div>
            </td>
            <td>
              <div class="tour-info">
                <strong>{{ b.TourTitle }}</strong>
                <small class="text-muted">Khởi hành: {{ formatDate(b.StartDate) }}</small>
              </div>
            </td>
            <td>
              <span class="seat-badge">{{ b.PassengerCount }} người</span>
            </td>
            <td>
              <div class="price-stack">
                <span class="price-val">{{ formatMoney(b.TotalPrice) }}</span>
                <span class="payment-method">{{ b.PaymentMethod || 'VNPAY' }}</span>
              </div>
            </td>
            <td>
              <span :class="['badge', getStatusBadge(b.Status)]">
                {{ formatStatus(b.Status) }}
              </span>
            </td>
            <td style="text-align: right;">
              <button 
                v-if="!['CANCELLED', 'REFUNDED', 'REFUNDING'].includes(b.Status)"
                class="btn btn-danger-outline btn-sm"
                @click="bookingToCancel = b"
              >
                Hủy đơn khẩn
              </button>
              <span v-else class="text-muted font-small">Đã hủy/hoàn tiền</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- MODAL HỦY ĐƠN KHẨN CẤP -->
    <Teleport to="body">
      <div v-if="bookingToCancel" class="modal-overlay" @click.self="bookingToCancel = null">
        <div class="modal-card">
          <div class="modal-header">
            <h3>Hủy đơn hàng khẩn cấp</h3>
            <button class="modal-close" @click="bookingToCancel = null">✕</button>
          </div>
          <div class="modal-body">
            <p>
              Bạn có chắc chắn muốn hủy đơn hàng <strong>#{{ bookingToCancel.BookingID }}</strong> của khách hàng <strong>{{ bookingToCancel.CustomerName }}</strong>?
            </p>
            <div class="detail-summary">
              <div>Chuyến đi: <strong>{{ bookingToCancel.TourTitle }}</strong></div>
              <div>Số chỗ hoàn trả vào Tour: <strong style="color: #10b981;">+{{ bookingToCancel.PassengerCount }} chỗ</strong></div>
              <div>Số tiền hoàn lại: <strong style="color: #2563eb;">{{ formatMoney(bookingToCancel.TotalPrice) }}</strong></div>
            </div>
            <div class="warning-box">
              Cơ chế bảo đảm an toàn giao dịch: Backend sẽ khóa dòng dữ liệu (Row-level lock), cập nhật trạng thái đơn sang REFUNDING và tự động hoàn trả số lượng vé trống (AvailableSlots) cho Tour.
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline" @click="bookingToCancel = null">Đóng</button>
            <button class="btn btn-danger" @click="confirmCancelBooking">Xác nhận hủy đơn</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import adminApi from '../services/api';

const bookings = ref([]);
const loading = ref(false);
const currentFilter = ref('');
const bookingToCancel = ref(null);

const filterOptions = [
  { key: '', label: 'Tất cả' },
  { key: 'PAID', label: 'Đã thanh toán' },
  { key: 'PENDING', label: 'Chờ thanh toán' },
  { key: 'REFUNDING', label: 'Đang hoàn tiền' },
  { key: 'CANCELLED', label: 'Đã hủy' }
];

const fetchBookings = async (st = '') => {
  loading.value = true;
  try {
    const res = await adminApi.getBookings(st);
    if (res.success) bookings.value = res.data || [];
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

const toastMsg = ref('');
const toastType = ref('success');
let toastTimeout = null;

const showToast = (msg, type = 'success') => {
  toastMsg.value = msg;
  toastType.value = type;
  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toastMsg.value = '';
  }, 4000);
};

const selectFilter = (key) => {
  currentFilter.value = key;
  fetchBookings(key);
};

const confirmCancelBooking = async () => {
  if (!bookingToCancel.value) return;
  const targetId = bookingToCancel.value.BookingID;
  try {
    const res = await adminApi.forceCancelBooking(targetId);
    if (res.success) {
      showToast(`Đã hủy khẩn cấp đơn "${targetId}" và hoàn trả chỗ trống thành công!`);
      bookingToCancel.value = null;
      fetchBookings(currentFilter.value);
    } else {
      showToast(res.message || 'Lỗi khi hủy đơn', 'error');
    }
  } catch (e) {
    console.error(e);
    showToast('Lỗi khi gọi API hủy đơn', 'error');
  }
};

const getStatusBadge = (st) => {
  if (st === 'PAID') return 'badge-success';
  if (st === 'PENDING') return 'badge-warning';
  if (st === 'REFUNDING') return 'badge-info';
  if (st === 'CANCELLED') return 'badge-danger';
  return 'badge-draft';
};

const formatStatus = (st) => {
  if (st === 'PAID') return 'Đã thanh toán';
  if (st === 'PENDING') return 'Chờ xử lý';
  if (st === 'REFUNDING') return 'Đang hoàn tiền';
  if (st === 'CANCELLED') return 'Đã hủy';
  return st;
};

const formatMoney = (val) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('vi-VN');
};

const onAdminChanged = () => {
  fetchBookings(currentFilter.value);
};

onMounted(() => {
  fetchBookings();
  window.addEventListener('admin-changed', onAdminChanged);
});
</script>

<style scoped>
.admin-toast {
  position: fixed;
  top: 80px;
  right: 28px;
  z-index: 999;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  border-radius: 12px;
  font-size: 0.88rem;
  font-weight: 700;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.18);
  backdrop-filter: blur(12px);
}

.toast-success {
  background: rgba(16, 185, 129, 0.95);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.toast-error {
  background: rgba(239, 68, 68, 0.95);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: all 0.25s ease;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translateY(-12px);
}

.panel-container {
  padding: 24px;
}

.panel-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.toolbar-title h2 {
  font-size: 1.35rem;
  font-weight: 800;
  color: #0f172a;
}

.toolbar-title p {
  font-size: 0.85rem;
  color: #64748b;
  margin-top: 2px;
}

.filter-tabs {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.filter-btn {
  padding: 6px 14px;
  border-radius: 20px;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  color: #64748b;
  font-family: inherit;
  transition: all 0.2s;
}

.filter-btn.active {
  background: #0f172a;
  color: #ffffff;
  border-color: #0f172a;
}

.booking-code {
  font-weight: 700;
  color: #2563eb;
}

.customer-info, .tour-info, .price-stack {
  display: flex;
  flex-direction: column;
}

.customer-info strong, .tour-info strong {
  font-size: 0.88rem;
  color: #0f172a;
}

.seat-badge {
  font-weight: 700;
  background: #f1f5f9;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.8rem;
}

.price-val {
  font-weight: 700;
  color: #0f172a;
}

.payment-method {
  font-size: 0.72rem;
  font-weight: 700;
  color: #2563eb;
}

.detail-summary {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  padding: 12px 14px;
  border-radius: 8px;
  margin: 14px 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.88rem;
}

.warning-box {
  background: #fffbeb;
  border: 1px solid rgba(245, 158, 11, 0.3);
  color: #92400e;
  padding: 12px 14px;
  border-radius: 8px;
  font-size: 0.85rem;
  line-height: 1.5;
}

.font-mono {
  font-family: monospace;
}

.font-small {
  font-size: 0.8rem;
}
</style>
