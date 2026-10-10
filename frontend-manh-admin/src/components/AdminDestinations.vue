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
        <div class="title-with-badge">
          <h2>Quản lý Điểm đến</h2>
          <span class="count-pill">{{ filteredDestinations.length }} địa danh</span>
        </div>
        <p>Quản lý danh sách các địa danh và danh lam thắng cảnh trong hệ thống TaVivu</p>
      </div>
      <div class="toolbar-actions">
        <div class="search-box">
          <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input 
            v-model="searchKeyword" 
            type="text" 
            placeholder="Tìm theo tên, slug, từ khóa..." 
            class="search-input"
          />
          <button v-if="searchKeyword" class="search-clear-btn" type="button" @click="searchKeyword = ''">✕</button>
        </div>
        <button class="btn btn-primary" @click="openCreateModal">
          + Thêm điểm đến mới
        </button>
      </div>
    </div>

    <div v-if="loading" class="state-box">
      <div class="spinner"></div>
      <p style="margin-top: 12px; color: #64748b;">Đang tải danh sách điểm đến...</p>
    </div>

    <div v-else-if="filteredDestinations.length === 0" class="state-box">
      <p style="font-weight: 600; color: #475569;">Không tìm thấy điểm đến nào phù hợp với "{{ searchKeyword }}"</p>
      <button class="btn btn-outline btn-sm" style="margin-top: 10px;" @click="searchKeyword = ''">Đặt lại bộ lọc</button>
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
          <tr v-for="d in filteredDestinations" :key="d.DestinationID">
            <td>
              <div class="dest-info-cell">
                <img 
                  :src="d.ImageURL || defaultDestImg" 
                  class="dest-thumb" 
                  alt="Thumb" 
                  @error="onImgError($event)"
                />
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
    <Teleport to="body">
      <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
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
              <input v-model="formData.imageUrl" type="url" class="form-control" placeholder="https://images.unsplash.com/..." />
              <div v-if="formData.imageUrl" class="img-preview-box">
                <img :src="formData.imageUrl" @error="$event.target.style.display='none'" class="preview-img" alt="Preview" />
              </div>
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
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import adminApi from '../services/api';

const defaultDestImg = 'https://images.unsplash.com/photo-1528127269322-539801943592?w=800';

const onImgError = (e) => {
  if (e && e.target) {
    e.target.src = defaultDestImg;
  }
};

const destinations = ref([]);
const searchKeyword = ref('');
const loading = ref(false);
const submitLoading = ref(false);

const filteredDestinations = computed(() => {
  if (!searchKeyword.value.trim()) return destinations.value;
  const q = searchKeyword.value.toLowerCase().trim();
  return destinations.value.filter(d => {
    const name = (d.Name || '').toLowerCase();
    const slug = (d.Slug || '').toLowerCase();
    const keywords = (d.Keywords || '').toLowerCase();
    const desc = (d.Description || '').toLowerCase();
    return name.includes(q) || slug.includes(q) || keywords.includes(q) || desc.includes(q);
  });
});

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

.title-with-badge {
  display: flex;
  align-items: center;
  gap: 12px;
}

.count-pill {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--primary-color, #007d68);
  background: var(--primary-light, #e6f7f2);
  border: 1px solid rgba(0, 185, 154, 0.25);
  padding: 3px 10px;
  border-radius: 999px;
}

.toolbar-title p {
  font-size: 0.85rem;
  color: #64748b;
  margin-top: 2px;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 12px;
  color: #94a3b8;
  pointer-events: none;
}

.search-input {
  padding: 8px 32px 8px 36px;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  font-size: 0.85rem;
  color: #0f172a;
  background: #ffffff;
  outline: none;
  min-width: 260px;
  transition: all 0.2s ease;
}

.search-input:focus {
  border-color: var(--primary-mint, #00b99a);
  box-shadow: 0 0 0 3px rgba(0, 185, 154, 0.15);
}

.search-clear-btn {
  position: absolute;
  right: 10px;
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  font-size: 0.8rem;
  padding: 2px;
}

.search-clear-btn:hover {
  color: #ef4444;
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
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
}

.img-preview-box {
  margin-top: 8px;
}

.preview-img {
  width: 100%;
  max-height: 140px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
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
  color: var(--primary-color, #007d68);
  background: var(--primary-light, #e6f7f2);
  border: 1px solid rgba(0, 185, 154, 0.25);
  padding: 2px 8px;
  border-radius: 6px;
  font-family: monospace;
  font-weight: 600;
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
