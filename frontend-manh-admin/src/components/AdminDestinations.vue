<template>
  <div class="panel-container">
    <!-- TOAST NOTIFICATION -->
    <transition name="toast-fade">
      <div v-if="toastMsg" :class="['admin-toast', toastType === 'error' ? 'toast-error' : 'toast-success']">
        <svg v-if="toastType === 'error'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="16"></line>
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
        <h2>Quản lý Điểm đến</h2>
        <p>Quản lý danh sách các địa danh và danh lam thắng cảnh trong hệ thống</p>
      </div>
      <button class="btn btn-primary" @click="openCreateModal">
        + Thêm điểm đến mới
      </button>
    </div>

    <div v-if="loading" class="state-box">
      <div class="spinner"></div>
      <p style="margin-top: 12px; color: #64748b;">Đang tải danh sách điểm đến...</p>
    </div>

    <div v-else class="table-responsive">
      <table class="data-table">
        <thead>
          <tr>
            <th>Địa danh</th>
            <th>Đường dẫn (Slug)</th>
            <th>Mô tả</th>
            <th>Từ khóa</th>
            <th>Trạng thái</th>
            <th style="text-align: right;">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="d in destinations" :key="d.DestinationID">
            <td>
              <div class="dest-info-cell">
                <img :src="d.ImageURL || defaultDestImg" class="dest-thumb" alt="Thumb" />
                <div>
                  <div class="dest-name">{{ d.Name }}</div>
                  <div class="dest-id font-mono">{{ d.DestinationID }}</div>
                </div>
              </div>
            </td>
            <td>
              <code class="slug-tag">/destination/{{ d.Slug }}</code>
            </td>
            <td>
              <p class="desc-text">{{ d.Description }}</p>
            </td>
            <td>
              <span class="keywords-text">{{ d.Keywords || '—' }}</span>
            </td>
            <td>
              <span :class="['badge', d.Status === 'PUBLISHED' ? 'badge-success' : 'badge-draft']">
                {{ d.Status === 'PUBLISHED' ? 'Hiển thị' : 'Đã ẩn' }}
              </span>
            </td>
            <td style="text-align: right;">
              <div class="action-buttons">
                <button class="btn btn-outline btn-sm" @click="openEditModal(d)">
                  Sửa
                </button>
                <button 
                  :class="['btn btn-sm', d.Status === 'PUBLISHED' ? 'btn-danger-outline' : 'btn-success']"
                  @click="toggleStatus(d)"
                >
                  {{ d.Status === 'PUBLISHED' ? 'Ẩn' : 'Hiện' }}
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- MODAL THÊM / SỬA -->
    <div v-if="showModal" class="modal-overlay">
      <div class="modal-card">
        <div class="modal-header">
          <h3>{{ isEditing ? 'Cập nhật điểm đến' : 'Thêm điểm đến mới' }}</h3>
          <button class="modal-close" @click="showModal = false">✕</button>
        </div>
        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label class="form-label">Tên địa danh *</label>
            <input v-model="formData.name" @input="autoSlug" type="text" required class="form-control" placeholder="Vịnh Hạ Long" />
          </div>

          <div class="form-group">
            <label class="form-label">Đường dẫn Slug *</label>
            <input v-model="formData.slug" type="text" required class="form-control" placeholder="vinh-ha-long" />
          </div>

          <div class="form-group">
            <label class="form-label">Đường dẫn hình ảnh (URL)</label>
            <input v-model="formData.imageUrl" type="url" class="form-control" placeholder="https://..." />
          </div>

          <div class="form-group">
            <label class="form-label">Từ khóa tìm kiếm</label>
            <input v-model="formData.keywords" type="text" class="form-control" placeholder="ha-long, quang-ninh" />
          </div>

          <div class="form-group">
            <label class="form-label">Mô tả tóm tắt *</label>
            <textarea v-model="formData.description" required rows="3" class="form-textarea" placeholder="Giới thiệu nét đặc sắc..."></textarea>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-outline" @click="showModal = false">Hủy</button>
            <button type="submit" class="btn btn-primary" :disabled="submitLoading">
              {{ isEditing ? 'Lưu thay đổi' : 'Tạo mới' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import adminApi from '../services/api';

const defaultDestImg = 'https://images.unsplash.com/photo-1528127269322-539801943592?w=800';

const destinations = ref([]);
const loading = ref(false);
const submitLoading = ref(false);

const showModal = ref(false);
const isEditing = ref(false);
const currentId = ref(null);

const formData = ref({
  name: '',
  slug: '',
  imageUrl: '',
  keywords: '',
  description: ''
});

const fetchDestinations = async () => {
  loading.value = true;
  try {
    const res = await adminApi.getDestinations();
    if (res.success) {
      destinations.value = res.data || [];
    }
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

const autoSlug = () => {
  if (!isEditing.value) {
    formData.value.slug = formData.value.name
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
  formData.value = { name: '', slug: '', imageUrl: '', keywords: '', description: '' };
  showModal.value = true;
};

const openEditModal = (d) => {
  isEditing.value = true;
  currentId.value = d.DestinationID;
  formData.value = {
    name: d.Name,
    slug: d.Slug,
    imageUrl: d.ImageURL || '',
    keywords: d.Keywords || '',
    description: d.Description || ''
  };
  showModal.value = true;
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
    if (isEditing.value) {
      await adminApi.updateDestination(currentId.value, formData.value);
      showToast('Cập nhật thông tin điểm đến thành công!');
    } else {
      await adminApi.createDestination(formData.value);
      showToast('Tạo điểm đến mới thành công!');
    }
    showModal.value = false;
    fetchDestinations();
  } catch (e) {
    console.error(e);
    showToast('Lỗi khi lưu điểm đến', 'error');
  } finally {
    submitLoading.value = false;
  }
};

const toggleStatus = async (d) => {
  const newStatus = d.Status === 'PUBLISHED' ? 'HIDDEN' : 'PUBLISHED';
  try {
    const res = await adminApi.toggleDestinationStatus(d.DestinationID, newStatus);
    if (res.success) {
      d.Status = newStatus;
      showToast(`Đã chuyển trạng thái sang: ${newStatus === 'PUBLISHED' ? 'Hiển thị' : 'Tạm ẩn'}`);
    }
  } catch (e) {
    console.error(e);
    showToast('Lỗi khi đổi trạng thái điểm đến', 'error');
  }
};

onMounted(() => {
  fetchDestinations();
  window.addEventListener('admin-changed', fetchDestinations);
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

.dest-info-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.dest-thumb {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  object-fit: cover;
}

.dest-name {
  font-weight: 700;
  color: #0f172a;
}

.dest-id {
  font-size: 0.72rem;
  color: #64748b;
}

.slug-tag {
  font-size: 0.78rem;
  color: #2563eb;
  background: #eff6ff;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
}

.desc-text {
  max-width: 260px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 0.85rem;
}

.keywords-text {
  font-size: 0.8rem;
  color: #64748b;
}

.action-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
}

.font-mono {
  font-family: monospace;
}
</style>
