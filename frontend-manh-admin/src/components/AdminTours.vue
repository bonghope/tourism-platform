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
        <h2>Quản lý Tour Du lịch</h2>
        <p>Quản lý danh sách các chuyến đi, cấu hình lộ trình ngày và trạng thái bán vé</p>
      </div>
      <button class="btn btn-primary" @click="openCreateModal">
        + Tạo Tour mới (Nháp)
      </button>
    </div>

    <div v-if="loading" class="state-box">
      <div class="spinner"></div>
      <p style="margin-top: 12px; color: #64748b;">Đang tải danh sách Tour...</p>
    </div>

    <div v-else class="table-responsive">
      <table class="data-table">
        <thead>
          <tr>
            <th>Tên Tour</th>
            <th>Thời lượng & Khởi hành</th>
            <th>Giá niêm yết</th>
            <th>Chỗ trống</th>
            <th>Trạng thái</th>
            <th style="text-align: right;">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="t in tours" :key="t.TourID" :class="{ 'row-deleted': t.Status === 'DELETED' }">
            <td>
              <div class="tour-name">{{ t.Title }}</div>
              <div class="tour-slug font-mono">/tour/{{ t.Slug }}</div>
            </td>
            <td>
              <div class="meta-stack">
                <span>{{ t.Duration }}</span>
                <small class="text-muted">{{ formatDate(t.StartDate) }}</small>
              </div>
            </td>
            <td>
              <span class="price-highlight">{{ formatMoney(t.Price) }}</span>
            </td>
            <td>
              <span>{{ t.AvailableSlots }} / {{ t.MaxSlots }}</span>
            </td>
            <td>
              <select 
                :value="t.Status" 
                @change="handleStatusChange(t, $event.target.value)"
                class="status-dropdown"
                :disabled="t.Status === 'DELETED'"
              >
                <option value="DRAFT">Nháp (DRAFT)</option>
                <option value="PUBLISHED">Mở bán (PUBLISHED)</option>
                <option value="HIDDEN">Tạm ẩn (HIDDEN)</option>
                <option value="DELETED" disabled>Đã xóa (DELETED)</option>
              </select>
            </td>
            <td style="text-align: right;">
              <div class="action-buttons" v-if="t.Status !== 'DELETED'">
                <button class="btn btn-outline btn-sm" @click="openEditModal(t)">Sửa</button>
                <button class="btn btn-danger-outline btn-sm" @click="tourToDelete = t">Xóa mềm</button>
              </div>
              <span v-else class="text-muted font-small">Đã xóa mềm</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- MODAL TẠO & SỬA TOUR -->
    <div v-if="showModal" class="modal-overlay">
      <div class="modal-card wide-card">
        <div class="modal-header">
          <h3>{{ isEditing ? 'Cập nhật Tour & Lộ trình' : 'Tạo Tour Mới' }}</h3>
          <button class="modal-close" @click="showModal = false">✕</button>
        </div>
        <form @submit.prevent="handleSubmit">
          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">Tiêu đề Tour *</label>
              <input v-model="formData.title" @input="autoSlug" type="text" required class="form-control" />
            </div>
            <div class="form-group">
              <label class="form-label">Đường dẫn Slug *</label>
              <input v-model="formData.slug" type="text" required class="form-control" />
            </div>
          </div>

          <div class="grid-3">
            <div class="form-group">
              <label class="form-label">Giá tiền (VNĐ) *</label>
              <input v-model="formData.price" type="number" min="1000" required class="form-control" />
            </div>
            <div class="form-group">
              <label class="form-label">Thời lượng *</label>
              <input v-model="formData.duration" type="text" required class="form-control" placeholder="3 Ngày 2 Đêm" />
            </div>
            <div class="form-group">
              <label class="form-label">Số chỗ tối đa *</label>
              <input v-model="formData.maxSlots" type="number" min="1" required class="form-control" />
            </div>
          </div>

          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">Ngày khởi hành *</label>
              <input v-model="formData.startDate" type="date" required class="form-control" />
            </div>
            <div class="form-group">
              <label class="form-label">Địa danh</label>
              <select v-model="formData.destinationId" class="form-select">
                <option value="">-- Chọn địa danh liên kết --</option>
                <option v-for="d in destinations" :key="d.DestinationID" :value="d.DestinationID">
                  {{ d.Name }}
                </option>
              </select>
            </div>
          </div>

          <!-- Trình soạn thảo lộ trình từng ngày (Itinerary) -->
          <div class="itinerary-box">
            <div class="itinerary-top">
              <strong>Lộ trình chi tiết từng ngày</strong>
              <button type="button" class="btn btn-outline btn-sm" @click="addDay">+ Thêm ngày</button>
            </div>

            <div v-for="(day, idx) in itineraryList" :key="idx" class="itinerary-item">
              <div class="item-head">
                <span class="day-num">Ngày {{ idx + 1 }}</span>
                <button type="button" class="btn-remove" @click="removeDay(idx)" v-if="itineraryList.length > 1">Xóa</button>
              </div>
              <input v-model="day.title" type="text" placeholder="Tiêu đề ngày (VD: Tham quan danh lam và ăn trưa)" class="form-control" required style="margin-bottom: 6px;" />
              <textarea v-model="day.detail" placeholder="Mô tả chi tiết hoạt động trong ngày..." rows="2" class="form-textarea"></textarea>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-outline" @click="showModal = false">Hủy</button>
            <button type="submit" class="btn btn-primary" :disabled="submitLoading">
              {{ isEditing ? 'Lưu thay đổi' : 'Tạo Tour' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL XÓA MỀM -->
    <div v-if="tourToDelete" class="modal-overlay">
      <div class="modal-card">
        <div class="modal-header">
          <h3>Xác nhận xóa mềm Tour</h3>
          <button class="modal-close" @click="tourToDelete = null">✕</button>
        </div>
        <div class="modal-body">
          <p>
            Bạn có chắc chắn muốn xóa tour <strong>{{ tourToDelete.Title }}</strong>?
          </p>
          <div class="warning-box">
            Nguyên tắc bảo toàn dữ liệu: Tour sẽ được gắn cờ DELETED, không còn hiển thị cho khách hàng nhưng vẫn lưu giữ nguyên vẹn trong hệ thống để bảo đảm tính chính xác của các đơn đặt chỗ trước đó.
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" @click="tourToDelete = null">Hủy</button>
          <button class="btn btn-danger" @click="confirmDelete">Xác nhận xóa mềm</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import adminApi from '../services/api';

const tours = ref([]);
const destinations = ref([]);
const loading = ref(false);
const submitLoading = ref(false);

const showModal = ref(false);
const isEditing = ref(false);
const currentId = ref(null);
const tourToDelete = ref(null);

const formData = ref({
  title: '',
  slug: '',
  price: '',
  startDate: '',
  duration: '2 Ngày 1 Đêm',
  maxSlots: 30,
  destinationId: ''
});

const itineraryList = ref([
  { day: 1, title: 'Đón khách và làm thủ tục', detail: 'Tập trung tại điểm hẹn và bắt đầu lịch trình.' }
]);

const fetchTours = async () => {
  loading.value = true;
  try {
    const res = await adminApi.getTours();
    if (res.success) tours.value = res.data || [];
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

const fetchDestinations = async () => {
  try {
    const res = await adminApi.getDestinations();
    if (res.success) destinations.value = res.data || [];
  } catch (e) {
    console.error(e);
  }
};

const autoSlug = () => {
  if (!isEditing.value) {
    formData.value.slug = formData.value.title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
  }
};

const openCreateModal = () => {
  isEditing.value = false;
  currentId.value = null;
  formData.value = {
    title: '',
    slug: '',
    price: '',
    startDate: new Date().toISOString().split('T')[0],
    duration: '2 Ngày 1 Đêm',
    maxSlots: 25,
    destinationId: destinations.value[0]?.DestinationID || ''
  };
  itineraryList.value = [
    { day: 1, title: 'Ngày 1: Đón khách và tham quan', detail: 'Bắt đầu lịch trình chuyến đi.' }
  ];
  showModal.value = true;
};

const openEditModal = (t) => {
  isEditing.value = true;
  currentId.value = t.TourID;
  formData.value = {
    title: t.Title,
    slug: t.Slug,
    price: t.Price,
    startDate: t.StartDate ? t.StartDate.split('T')[0] : '',
    duration: t.Duration,
    maxSlots: t.MaxSlots,
    destinationId: t.DestinationID || ''
  };
  try {
    itineraryList.value = typeof t.Itinerary === 'string' ? JSON.parse(t.Itinerary) : (t.Itinerary || []);
  } catch (e) {
    itineraryList.value = [{ day: 1, title: 'Lộ trình', detail: '' }];
  }
  showModal.value = true;
};

const addDay = () => {
  itineraryList.value.push({ day: itineraryList.value.length + 1, title: '', detail: '' });
};

const removeDay = (idx) => {
  itineraryList.value.splice(idx, 1);
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

const handleSubmit = async () => {
  submitLoading.value = true;
  try {
    const payload = { ...formData.value, itinerary: itineraryList.value };
    if (isEditing.value) {
      await adminApi.updateTour(currentId.value, payload);
      showToast('Cập nhật Tour và lộ trình thành công!');
    } else {
      await adminApi.createTour(payload);
      showToast('Tạo Tour mới thành công!');
    }
    showModal.value = false;
    fetchTours();
  } catch (e) {
    console.error(e);
    showToast('Lỗi khi lưu Tour', 'error');
  } finally {
    submitLoading.value = false;
  }
};

const handleStatusChange = async (tour, status) => {
  try {
    const res = await adminApi.updateTourStatus(tour.TourID, status);
    if (res.success) {
      tour.Status = status;
      const statusMap = { DRAFT: 'Bản nháp', PUBLISHED: 'Đang mở bán', HIDDEN: 'Tạm ẩn' };
      showToast(`Đã chuyển trạng thái Tour sang: ${statusMap[status] || status}`);
    }
  } catch (e) {
    console.error(e);
    showToast('Lỗi khi đổi trạng thái Tour', 'error');
  }
};

const confirmDelete = async () => {
  if (!tourToDelete.value) return;
  try {
    const res = await adminApi.softDeleteTour(tourToDelete.value.TourID);
    if (res.success) {
      tourToDelete.value.Status = 'DELETED';
      showToast(`Đã xóa mềm Tour: "${tourToDelete.value.Title}"`);
      tourToDelete.value = null;
    }
  } catch (e) {
    console.error(e);
    showToast('Lỗi khi xóa Tour', 'error');
  }
};

const formatMoney = (val) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('vi-VN');
};

const onAdminChanged = () => {
  fetchTours();
};

onMounted(() => {
  fetchTours();
  fetchDestinations();
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

.tour-name {
  font-weight: 700;
  color: #0f172a;
}

.tour-slug {
  font-size: 0.72rem;
  color: #64748b;
}

.meta-stack {
  display: flex;
  flex-direction: column;
  font-size: 0.85rem;
}

.price-highlight {
  font-weight: 700;
  color: #2563eb;
}

.status-dropdown {
  padding: 5px 10px;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  font-size: 0.8rem;
  font-weight: 600;
  background: #ffffff;
  outline: none;
}

.action-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
}

.row-deleted {
  opacity: 0.55;
  background: #f8fafc;
}

.wide-card {
  max-width: 720px;
}

.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.grid-3 {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 14px;
}

.itinerary-box {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  padding: 14px;
  border-radius: 10px;
  margin: 16px 0;
}

.itinerary-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-size: 0.9rem;
}

.itinerary-item {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 10px;
}

.item-head {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
}

.day-num {
  font-size: 0.75rem;
  font-weight: 700;
  background: #eff6ff;
  color: #2563eb;
  padding: 2px 8px;
  border-radius: 4px;
}

.btn-remove {
  background: transparent;
  border: none;
  color: #ef4444;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
}

.warning-box {
  background: #fffbeb;
  border: 1px solid rgba(245, 158, 11, 0.3);
  color: #92400e;
  padding: 12px 14px;
  border-radius: 8px;
  margin-top: 14px;
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
