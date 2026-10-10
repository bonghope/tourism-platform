<template>
  <div class="profile-page-wrapper">
    <div class="profile-container">
      <div class="profile-wrapper">
        <div class="profile-header">
          <h1>Hồ sơ tài khoản</h1>
          <p>Quản lý thông tin cá nhân và cài đặt bảo mật</p>
        </div>

        <div class="profile-grid">
          <!-- Cột trái: Tóm tắt thông tin & Avatar -->
          <div class="profile-side glass-panel">
            <!-- AVATAR VỚI KÉO THẢ FILE & TÙY CHỌN GÓC ẢNH -->
            <div 
              class="avatar-container"
              @dragover.prevent="isDraggingAvatar = true"
              @dragleave.prevent="isDraggingAvatar = false"
              @drop.prevent="handleAvatarDrop"
              @click="triggerAvatarFileSelect"
              :class="{ 'avatar-dropzone-active': isDraggingAvatar }"
              title="Kéo thả ảnh vào đây hoặc nhấp để tải ảnh lên"
            >
              <img 
                :src="profile.AvatarURL || defaultAvatar" 
                class="avatar-image" 
                alt="Avatar" 
              />
              <div class="avatar-hover-overlay">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                  <circle cx="12" cy="13" r="4"></circle>
                </svg>
                <span>Kéo thả / Chọn ảnh</span>
              </div>
              <input 
                type="file" 
                ref="avatarFileInput" 
                accept="image/*" 
                @change="handleAvatarFileChange" 
                hidden 
              />
            </div>

            <!-- Nút chỉnh góc / vị trí ảnh đại diện -->
            <button 
              type="button" 
              class="btn-adjust-avatar" 
              @click="openCropModalWithCurrent"
              title="Điều chỉnh góc và vị trí ảnh hiển thị"
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.778-7.778zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path>
              </svg>
              Chỉnh vị trí & góc ảnh
            </button>

            <h2 class="user-name">{{ profile.FullName || 'Chưa cập nhật tên' }}</h2>
            <p class="user-phone-tag">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
              {{ profile.Phone || 'Chưa thiết lập' }}
            </p>
            <p class="user-email">{{ profile.Email || 'Chưa liên kết email' }}</p>

            <div class="user-badge">
              <span class="badge-active">Đang hoạt động</span>
            </div>

            <div class="info-list">
              <div class="info-item">
                <span class="info-label">Mã khách hàng:</span>
                <span class="info-value font-mono">{{ profile.UserID }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Số điện thoại:</span>
                <span class="info-value font-mono highlight-phone">
                  {{ profile.Phone || 'Chưa thiết lập' }}
                </span>
              </div>
              <div class="info-item">
                <span class="info-label">Email liên kết:</span>
                <span class="info-value">{{ profile.Email || 'Chưa có (cập nhật sau)' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Ngày tham gia:</span>
                <span class="info-value">{{ formatDate(profile.CreatedAt) }}</span>
              </div>
            </div>
          </div>

          <!-- Cột phải: Form cập nhật thông tin & đổi mật khẩu -->
          <div class="profile-content">
            <!-- Card chỉnh sửa thông tin -->
            <div class="card glass-panel">
              <h3 class="card-heading">Thông tin cá nhân</h3>
              <form @submit.prevent="handleUpdateProfile">
                <div class="form-group">
                  <label>Họ và tên <span class="required-star">*</span></label>
                  <input v-model="editForm.fullName" type="text" required class="form-control" />
                </div>

                <!-- SỐ ĐIỆN THOẠI & NÚT THAY ĐỔI -->
                <div class="form-group">
                  <label>Số điện thoại</label>
                  <div class="phone-action-row">
                    <input 
                      :value="profile.Phone || 'Chưa thiết lập'" 
                      type="tel" 
                      readonly 
                      class="form-control phone-readonly" 
                    />
                    <button type="button" class="btn-change-phone-action" @click="openPhoneModal">
                      <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                      Thay đổi số điện thoại
                    </button>
                  </div>
                </div>

                <button type="submit" class="btn-primary" :disabled="loadingUpdate">
                  <span v-if="loadingUpdate" class="spinner-small"></span>
                  <span v-else>Lưu thông tin</span>
                </button>
              </form>
            </div>

            <!-- Card Xác thực Email -->
            <div class="card glass-panel" style="margin-top: 24px;">
              <div class="card-title-row">
                <div class="title-with-badge">
                  <h3 class="card-heading" style="margin-bottom: 0; padding-bottom: 0; border-bottom: none;">Liên kết & Cập nhật Email</h3>
                </div>
                <span v-if="profile.Email" class="badge-verified">✓ Đã liên kết</span>
                <span v-else class="badge-unverified">Chưa liên kết</span>
              </div>
              <p class="card-desc">
                {{ profile.Email ? `Email liên kết hiện tại của bạn: ${profile.Email}` : 'Bạn có thể cập nhật thêm Email tại đây bất cứ lúc nào để nhận vé tour điện tử.' }}
              </p>

              <form @submit.prevent="handleVerifyEmailOtp">
                <div class="form-group">
                  <label>{{ profile.Email ? 'Đổi sang Email mới' : 'Nhập địa chỉ Email' }} <span class="required-star">*</span></label>
                  <input 
                    v-model="emailForm.email" 
                    type="email" 
                    required 
                    placeholder="name@example.com" 
                    class="form-control" 
                  />
                </div>

                <!-- Ô NHẬP MÃ OTP XÁC THỰC EMAIL (GIỐNG Ô SĐT) -->
                <div class="form-group">
                  <div class="label-row">
                    <label>Mã xác thực OTP <span class="required-star">*</span></label>
                    <span v-if="emailOtpSent" class="otp-badge-sent">Đã gửi mã</span>
                  </div>
                  <div class="otp-input-group-row">
                    <input 
                      v-model="emailForm.otp" 
                      type="text" 
                      maxlength="6" 
                      placeholder="Nhập mã" 
                      class="form-control otp-input-box" 
                    />
                    <button 
                      type="button" 
                      class="btn-get-otp-action" 
                      @click="handleRequestEmailOtp" 
                      :disabled="loadingEmailOtp || emailCountdown > 0 || !emailForm.email || !emailForm.email.includes('@')"
                      :title="!emailForm.email ? 'Vui lòng nhập Email để lấy mã' : 'Lấy mã OTP'"
                    >
                      <span v-if="loadingEmailOtp" class="spinner-small"></span>
                      <span v-else-if="emailCountdown > 0">{{ emailCountdown }}s</span>
                      <span v-else>{{ emailOtpSent ? 'Gửi lại mã' : 'Lấy mã' }}</span>
                    </button>
                  </div>
                  <p v-if="emailOtpSent" class="otp-help-text otp-success-text">
                    Mã OTP đã gửi đến email <strong>{{ emailForm.email }}</strong>: <strong>{{ serverEmailOtp }}</strong>
                  </p>
                </div>

                <button 
                  type="submit" 
                  class="btn-primary" 
                  :disabled="loadingVerifyEmail || !emailOtpSent || !emailForm.otp || emailForm.otp.trim().length < 6"
                >
                  <span v-if="loadingVerifyEmail" class="spinner-small"></span>
                  <span v-else>Xác nhận & Cập nhật Email</span>
                </button>
              </form>
            </div>

            <!-- Card ĐỔI MẬT KHẨU (ẨN CẢ 3 Ô & CÓ MẮT XEM/ẨN MẬT KHẨU) -->
            <div class="card glass-panel" style="margin-top: 24px;">
              <h3 class="card-heading">Đổi mật khẩu</h3>
              <form @submit.prevent="handleChangePassword">
                <!-- 1. Mật khẩu hiện tại -->
                <div class="form-group">
                  <label>Mật khẩu hiện tại <span class="required-star">*</span></label>
                  <div class="input-password-wrapper">
                    <input 
                      v-model="passwordForm.oldPassword" 
                      :type="showOldPassword ? 'text' : 'password'" 
                      required 
                      class="form-control" 
                      placeholder="Nhập mật khẩu hiện tại" 
                    />
                    <button 
                      type="button" 
                      class="btn-toggle-eye" 
                      @click="showOldPassword = !showOldPassword"
                      :title="showOldPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'"
                    >
                      <svg v-if="!showOldPassword" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                      <svg v-else viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                      </svg>
                    </button>
                  </div>
                </div>

                <!-- 2. Mật khẩu mới -->
                <div class="form-group">
                  <label>Mật khẩu mới <span class="required-star">*</span></label>
                  <div class="input-password-wrapper">
                    <input 
                      v-model="passwordForm.newPassword" 
                      :type="showNewPassword ? 'text' : 'password'" 
                      required 
                      class="form-control" 
                      placeholder="Tối thiểu 6 ký tự" 
                    />
                    <button 
                      type="button" 
                      class="btn-toggle-eye" 
                      @click="showNewPassword = !showNewPassword"
                      :title="showNewPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'"
                    >
                      <svg v-if="!showNewPassword" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                      <svg v-else viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                      </svg>
                    </button>
                  </div>
                </div>

                <!-- 3. Xác nhận mật khẩu mới -->
                <div class="form-group">
                  <label>Xác nhận mật khẩu mới <span class="required-star">*</span></label>
                  <div class="input-password-wrapper">
                    <input 
                      v-model="passwordForm.confirmPassword" 
                      :type="showConfirmPassword ? 'text' : 'password'" 
                      required 
                      class="form-control" 
                      placeholder="Nhập lại mật khẩu mới" 
                    />
                    <button 
                      type="button" 
                      class="btn-toggle-eye" 
                      @click="showConfirmPassword = !showConfirmPassword"
                      :title="showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'"
                    >
                      <svg v-if="!showConfirmPassword" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                      <svg v-else viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                      </svg>
                    </button>
                  </div>
                </div>

                <button type="submit" class="btn-secondary" :disabled="loadingPassword">
                  <span v-if="loadingPassword" class="spinner-small"></span>
                  <span v-else>Cập nhật mật khẩu</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL THAY ĐỔI SỐ ĐIỆN THOẠI -->
    <div v-if="showPhoneModal" class="modal-overlay" @click.self="showPhoneModal = false">
      <div class="modal-card">
        <div class="modal-header">
          <h3>Thay đổi số điện thoại</h3>
          <button class="modal-close" @click="showPhoneModal = false">✕</button>
        </div>
        <form @submit.prevent="handleChangePhone">
          <div class="modal-body">
            <p class="modal-desc">
              Số điện thoại hiện tại: <strong>{{ profile.Phone || 'Chưa thiết lập' }}</strong>
            </p>
            <div class="form-group">
              <label>Số điện thoại mới <span class="required-star">*</span></label>
              <input 
                v-model="newPhoneInput" 
                type="tel" 
                required 
                placeholder="Ví dụ: 0912345678" 
                class="form-control" 
                autofocus
              />
              <p class="field-hint">Số điện thoại mới sẽ được dùng để đăng nhập và khôi phục tài khoản qua OTP.</p>
            </div>

            <!-- Ô NHẬP MÃ OTP XÁC THỰC SĐT -->
            <div class="form-group">
              <div class="label-row">
                <label>Mã xác thực OTP <span class="required-star">*</span></label>
                <span v-if="phoneOtpSent" class="otp-badge-sent">Đã gửi mã</span>
              </div>
              <div class="otp-input-group-row">
                <input 
                  v-model="phoneOtpInput" 
                  type="text" 
                  maxlength="6" 
                  placeholder="Nhập mã" 
                  class="form-control otp-input-box" 
                />
                <button 
                  type="button" 
                  class="btn-get-otp-action" 
                  @click="handleRequestPhoneOtp" 
                  :disabled="loadingPhoneOtp || phoneCountdown > 0 || !newPhoneInput"
                  :title="!newPhoneInput ? 'Vui lòng nhập số điện thoại để lấy mã' : 'Lấy mã OTP'"
                >
                  <span v-if="loadingPhoneOtp" class="spinner-small"></span>
                  <span v-else-if="phoneCountdown > 0">{{ phoneCountdown }}s</span>
                  <span v-else>{{ phoneOtpSent ? 'Gửi lại mã' : 'Lấy mã' }}</span>
                </button>
              </div>
              <p v-if="phoneOtpSent" class="otp-help-text otp-success-text">
                Mã OTP đã gửi đến SĐT <strong>{{ newPhoneInput }}</strong>: <strong>{{ serverPhoneOtp }}</strong>
              </p>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn-outline" @click="showPhoneModal = false">Hủy</button>
            <button 
              type="submit" 
              class="btn-primary" 
              :disabled="loadingChangePhone || !phoneOtpSent || !phoneOtpInput || phoneOtpInput.trim().length < 6"
            >
              <span v-if="loadingChangePhone" class="spinner-small"></span>
              <span v-else>Xác nhận đổi số</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL ĐIỀU CHỈNH VỊ TRÍ & GÓC ẢNH ĐẠI DIỆN -->
    <div v-if="showCropModal" class="modal-overlay" @click.self="showCropModal = false">
      <div class="modal-card crop-modal-card">
        <div class="modal-header">
          <div>
            <h3>Điều chỉnh vị trí & góc ảnh đại diện</h3>
            <p class="crop-modal-sub">Kéo chuột trên ảnh để chọn góc bạn muốn hiển thị</p>
          </div>
          <button class="modal-close" @click="showCropModal = false">✕</button>
        </div>

        <div class="crop-modal-body">
          <!-- KHUNG HÌNH TRÒN CROP INTERACTIVE -->
          <div 
            class="crop-viewport"
            ref="cropViewportRef"
            @mousedown="startPan"
            @mousemove="onPan"
            @mouseup="endPan"
            @mouseleave="endPan"
            @touchstart="startTouchPan"
            @touchmove="onTouchPan"
            @touchend="endPan"
            @wheel.prevent="onWheelZoom"
          >
            <img 
              :src="cropImageSrc" 
              ref="cropImgRef" 
              class="crop-image"
              :style="{
                width: `${imgBaseWidth}px`,
                height: `${imgBaseHeight}px`,
                transform: `translate(${panX}px, ${panY}px) scale(${zoomScale})`,
                transformOrigin: 'center center'
              }"
              draggable="false"
              @load="onCropImageLoaded"
            />
            <div class="crop-circle-mask"></div>
            <div class="crop-crosshair"></div>
          </div>

          <!-- NÚT GÓC NHANH (CORNER PRESETS) -->
          <div class="corner-presets-row">
            <span class="corner-preset-label">Chọn góc nhanh:</span>
            <button type="button" class="btn-corner" @click="setPresetCorner('top-left')">Góc trên trái</button>
            <button type="button" class="btn-corner" @click="setPresetCorner('top-right')">Góc trên phải</button>
            <button type="button" class="btn-corner" @click="setPresetCorner('center')">Chính giữa</button>
            <button type="button" class="btn-corner" @click="setPresetCorner('bottom-left')">Góc dưới trái</button>
            <button type="button" class="btn-corner" @click="setPresetCorner('bottom-right')">Góc dưới phải</button>
          </div>

          <!-- THANH TRƯỢT THU PHÓNG -->
          <div class="zoom-slider-row">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              <line x1="8" y1="11" x2="14" y2="11"></line>
            </svg>
            <input 
              v-model.number="zoomScale" 
              type="range" 
              min="1" 
              max="3" 
              step="0.05" 
              class="zoom-range" 
            />
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              <line x1="11" y1="8" x2="11" y2="14"></line>
              <line x1="8" y1="11" x2="14" y2="11"></line>
            </svg>
            <span class="zoom-value">{{ Math.round(zoomScale * 100) }}%</span>
          </div>

          <p class="crop-instructions">
            Nhấp giữ chuột và kéo ảnh để di chuyển đến góc mong muốn. Cuộn chuột để phóng to/thu nhỏ.
          </p>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn-outline" @click="showCropModal = false">Hủy</button>
          <button type="button" class="btn-primary" @click="applyCroppedAvatar" :disabled="loadingSaveAvatar">
            <span v-if="loadingSaveAvatar" class="spinner-small"></span>
            <span v-else>Áp dụng góc ảnh này</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useToastStore } from '../stores/toast';
import api from '../services/api';

const authStore = useAuthStore();
const toastStore = useToastStore();

const defaultAvatar = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150';

const profile = ref({
  UserID: '',
  FullName: '',
  Email: '',
  Phone: '',
  AvatarURL: '',
  CreatedAt: ''
});

const editForm = ref({ fullName: '', phone: '', avatarUrl: '' });
const passwordForm = ref({ oldPassword: '', newPassword: '', confirmPassword: '' });

// Ẩn/Hiện mật khẩu với con mắt
const showOldPassword = ref(false);
const showNewPassword = ref(false);
const showConfirmPassword = ref(false);

const loadingUpdate = ref(false);
const loadingPassword = ref(false);

// Thay đổi số điện thoại
const showPhoneModal = ref(false);
const newPhoneInput = ref('');
const phoneOtpInput = ref('');
const serverPhoneOtp = ref('');
const loadingPhoneOtp = ref(false);
const loadingChangePhone = ref(false);
const phoneOtpSent = ref(false);
const phoneCountdown = ref(0);
let phoneOtpTimer = null;

const openPhoneModal = () => {
  newPhoneInput.value = '';
  phoneOtpInput.value = '';
  serverPhoneOtp.value = '';
  phoneOtpSent.value = false;
  phoneCountdown.value = 0;
  if (phoneOtpTimer) clearInterval(phoneOtpTimer);
  showPhoneModal.value = true;
};

const handleRequestPhoneOtp = async () => {
  const cleanPhone = (newPhoneInput.value || '').trim().replace(/[\s.-]/g, '');
  if (!cleanPhone || cleanPhone.length < 9 || cleanPhone.length > 11 || !/^\d+$/.test(cleanPhone)) {
    toastStore.warning('Vui lòng nhập số điện thoại hợp lệ (9 đến 11 chữ số).');
    return;
  }
  if (cleanPhone === profile.value.Phone) {
    toastStore.warning('Số điện thoại mới trùng với số điện thoại hiện tại.');
    return;
  }
  loadingPhoneOtp.value = true;
  try {
    const res = await api.requestPhoneOtp(cleanPhone);
    if (res.success) {
      phoneOtpSent.value = true;
      if (res.otp) {
        serverPhoneOtp.value = res.otp;
        phoneOtpInput.value = res.otp;
      }
      toastStore.success(res.message);
      phoneCountdown.value = 60;
      if (phoneOtpTimer) clearInterval(phoneOtpTimer);
      phoneOtpTimer = setInterval(() => {
        if (phoneCountdown.value > 0) phoneCountdown.value--;
        else clearInterval(phoneOtpTimer);
      }, 1000);
    } else {
      toastStore.error(res.message);
    }
  } catch (e) {
    toastStore.error('Lỗi khi gửi mã xác thực số điện thoại.');
  } finally {
    loadingPhoneOtp.value = false;
  }
};

const handleChangePhone = async () => {
  const cleanPhone = (newPhoneInput.value || '').trim().replace(/[\s.-]/g, '');
  if (!cleanPhone || cleanPhone.length < 9 || cleanPhone.length > 11 || !/^\d+$/.test(cleanPhone)) {
    toastStore.warning('Vui lòng nhập số điện thoại hợp lệ (9 đến 11 chữ số).');
    return;
  }
  if (!phoneOtpInput.value || phoneOtpInput.value.trim().length < 6) {
    toastStore.warning('Vui lòng nhập đủ 6 chữ số mã OTP xác thực.');
    return;
  }
  loadingChangePhone.value = true;
  try {
    const res = await api.verifyPhoneOtp(cleanPhone, phoneOtpInput.value.trim());
    if (res.success) {
      const updatedPhone = res.phone || cleanPhone;
      profile.value.Phone = updatedPhone;
      editForm.value.phone = updatedPhone;
      if (authStore.user) {
        authStore.user.phone = updatedPhone;
      }
      toastStore.success('Thay đổi số điện thoại thành công!');
      showPhoneModal.value = false;
      phoneOtpSent.value = false;
      serverPhoneOtp.value = '';
      phoneOtpInput.value = '';
      if (phoneOtpTimer) clearInterval(phoneOtpTimer);
    } else {
      toastStore.error(res.message || 'Lỗi khi thay đổi số điện thoại.');
    }
  } catch (e) {
    toastStore.error('Lỗi khi thay đổi số điện thoại.');
  } finally {
    loadingChangePhone.value = false;
  }
};

// ============================================
// KÉO THẢ AVATAR & ĐIỀU CHỈNH GÓC/VỊ TRÍ ẢNH
// ============================================
const avatarFileInput = ref(null);
const isDraggingAvatar = ref(false);
const showCropModal = ref(false);
const cropImageSrc = ref('');
const cropImgRef = ref(null);
const cropViewportRef = ref(null);
const panX = ref(0);
const panY = ref(0);
const zoomScale = ref(1);
const loadingSaveAvatar = ref(false);

const isPanning = ref(false);
const startMouseX = ref(0);
const startMouseY = ref(0);
const initialPanX = ref(0);
const initialPanY = ref(0);

const triggerAvatarFileSelect = () => {
  if (avatarFileInput.value) {
    avatarFileInput.value.click();
  }
};

const handleAvatarFileChange = (e) => {
  const files = e.target.files;
  if (files && files[0]) {
    loadFileForCrop(files[0]);
  }
};

const handleAvatarDrop = (e) => {
  isDraggingAvatar.value = false;
  const files = e.dataTransfer?.files;
  if (files && files[0]) {
    loadFileForCrop(files[0]);
  }
};

const loadFileForCrop = (file) => {
  if (!file.type.startsWith('image/')) {
    toastStore.warning('Vui lòng chọn hoặc kéo thả file hình ảnh hợp lệ.');
    return;
  }
  const reader = new FileReader();
  reader.onload = (event) => {
    cropImageSrc.value = event.target.result;
    panX.value = 0;
    panY.value = 0;
    zoomScale.value = 1;
    showCropModal.value = true;
  };
  reader.readAsDataURL(file);
};

const imgBaseWidth = ref(250);
const imgBaseHeight = ref(250);

const openCropModalWithCurrent = () => {
  cropImageSrc.value = profile.value.AvatarURL || defaultAvatar;
  panX.value = 0;
  panY.value = 0;
  zoomScale.value = 1;
  showCropModal.value = true;
};

const onCropImageLoaded = (e) => {
  const img = e?.target || cropImgRef.value;
  if (!img) return;
  const nw = img.naturalWidth || 250;
  const nh = img.naturalHeight || 250;
  if (nw >= nh) {
    imgBaseHeight.value = 250;
    imgBaseWidth.value = Math.max(250, Math.round(250 * (nw / nh)));
  } else {
    imgBaseWidth.value = 250;
    imgBaseHeight.value = Math.max(250, Math.round(250 * (nh / nw)));
  }
  panX.value = 0;
  panY.value = 0;
  zoomScale.value = 1;
};

// Chuột kéo thả để định vị góc ảnh
const startPan = (e) => {
  isPanning.value = true;
  startMouseX.value = e.clientX;
  startMouseY.value = e.clientY;
  initialPanX.value = panX.value;
  initialPanY.value = panY.value;
};

const onPan = (e) => {
  if (!isPanning.value) return;
  panX.value = initialPanX.value + (e.clientX - startMouseX.value);
  panY.value = initialPanY.value + (e.clientY - startMouseY.value);
};

const endPan = () => {
  isPanning.value = false;
};

const startTouchPan = (e) => {
  if (e.touches && e.touches[0]) {
    isPanning.value = true;
    startMouseX.value = e.touches[0].clientX;
    startMouseY.value = e.touches[0].clientY;
    initialPanX.value = panX.value;
    initialPanY.value = panY.value;
  }
};

const onTouchPan = (e) => {
  if (!isPanning.value || !e.touches || !e.touches[0]) return;
  panX.value = initialPanX.value + (e.touches[0].clientX - startMouseX.value);
  panY.value = initialPanY.value + (e.touches[0].clientY - startMouseY.value);
};

const onWheelZoom = (e) => {
  const delta = e.deltaY < 0 ? 0.08 : -0.08;
  zoomScale.value = Math.min(3, Math.max(1, +(zoomScale.value + delta).toFixed(2)));
};

// Chọn góc nhanh
const setPresetCorner = (corner) => {
  zoomScale.value = Math.max(zoomScale.value, 1.25);
  const w = imgBaseWidth.value * zoomScale.value;
  const h = imgBaseHeight.value * zoomScale.value;
  const maxPanX = Math.max(40, (w - 250) / 2);
  const maxPanY = Math.max(40, (h - 250) / 2);

  if (corner === 'top-left') {
    panX.value = maxPanX;
    panY.value = maxPanY;
  } else if (corner === 'top-right') {
    panX.value = -maxPanX;
    panY.value = maxPanY;
  } else if (corner === 'center') {
    panX.value = 0;
    panY.value = 0;
    zoomScale.value = 1;
  } else if (corner === 'bottom-left') {
    panX.value = maxPanX;
    panY.value = -maxPanY;
  } else if (corner === 'bottom-right') {
    panX.value = -maxPanX;
    panY.value = -maxPanY;
  }
};

// Áp dụng góc ảnh đã cắt xuất ra Canvas chuẩn
const applyCroppedAvatar = async () => {
  if (!cropImgRef.value || !cropViewportRef.value) return;
  loadingSaveAvatar.value = true;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');

    // Cắt hình tròn
    ctx.beginPath();
    ctx.arc(200, 200, 200, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    const imgEl = cropImgRef.value;
    const imgRect = imgEl.getBoundingClientRect();
    const vpRect = cropViewportRef.value.getBoundingClientRect();

    const ratio = 400 / vpRect.width;
    const drawX = (imgRect.left - vpRect.left) * ratio;
    const drawY = (imgRect.top - vpRect.top) * ratio;
    const drawW = imgRect.width * ratio;
    const drawH = imgRect.height * ratio;

    ctx.drawImage(imgEl, drawX, drawY, drawW, drawH);
    const finalDataUrl = canvas.toDataURL('image/jpeg', 0.92);

    const res = await api.updateProfile({ avatarUrl: finalDataUrl });
    if (res.success) {
      profile.value.AvatarURL = finalDataUrl;
      editForm.value.avatarUrl = finalDataUrl;
      if (authStore.user) {
        authStore.user.avatarUrl = finalDataUrl;
      }
      toastStore.success('Đã cập nhật ảnh đại diện thành công!');
      showCropModal.value = false;
    } else {
      toastStore.error(res.message || 'Lỗi khi lưu ảnh đại diện.');
    }
  } catch (err) {
    console.error(err);
    toastStore.error('Lỗi khi xử lý ảnh đại diện.');
  } finally {
    loadingSaveAvatar.value = false;
  }
};

const loadProfile = async () => {
  try {
    const res = await api.getProfile();
    if (res.success && res.user) {
      profile.value = res.user;
      editForm.value.fullName = res.user.FullName || '';
      editForm.value.phone = res.user.Phone || '';
      editForm.value.avatarUrl = res.user.AvatarURL || '';
    }
  } catch (e) {
    toastStore.error('Lỗi khi tải thông tin tài khoản.');
  }
};

const handleUpdateProfile = async () => {
  loadingUpdate.value = true;
  try {
    const res = await api.updateProfile(editForm.value);
    if (res.success) {
      profile.value.FullName = editForm.value.fullName;
      profile.value.Phone = editForm.value.phone;
      profile.value.AvatarURL = editForm.value.avatarUrl;
      
      if (authStore.user) {
        authStore.user.fullName = editForm.value.fullName;
        authStore.user.avatarUrl = editForm.value.avatarUrl;
      }
      toastStore.success('Cập nhật hồ sơ thành công.');
    } else {
      toastStore.error(res.message);
    }
  } catch (e) {
    toastStore.error('Lỗi cập nhật.');
  } finally {
    loadingUpdate.value = false;
  }
};

const handleChangePassword = async () => {
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    toastStore.error('Xác nhận mật khẩu mới không khớp.');
    return;
  }
  loadingPassword.value = true;
  try {
    const res = await api.changePassword(passwordForm.value.oldPassword, passwordForm.value.newPassword);
    if (res.success) {
      toastStore.success('Đổi mật khẩu thành công.');
      passwordForm.value = { oldPassword: '', newPassword: '', confirmPassword: '' };
    } else {
      toastStore.error(res.message);
    }
  } catch (e) {
    toastStore.error('Lỗi đổi mật khẩu.');
  } finally {
    loadingPassword.value = false;
  }
};

const emailForm = ref({ email: '', otp: '' });
const serverEmailOtp = ref('');
const loadingEmailOtp = ref(false);
const loadingVerifyEmail = ref(false);
const emailOtpSent = ref(false);
const emailCountdown = ref(0);
let emailOtpTimer = null;

const handleRequestEmailOtp = async () => {
  const email = (emailForm.value.email || '').trim().toLowerCase();
  if (!email || !email.includes('@')) {
    toastStore.warning('Vui lòng nhập địa chỉ email hợp lệ.');
    return;
  }
  loadingEmailOtp.value = true;
  try {
    const res = await api.requestEmailOtp(email);
    if (res.success) {
      emailOtpSent.value = true;
      if (res.otp) {
        serverEmailOtp.value = res.otp;
        emailForm.value.otp = res.otp;
      }
      toastStore.success(res.message);
      emailCountdown.value = 60;
      if (emailOtpTimer) clearInterval(emailOtpTimer);
      emailOtpTimer = setInterval(() => {
        if (emailCountdown.value > 0) emailCountdown.value--;
        else clearInterval(emailOtpTimer);
      }, 1000);
    } else {
      toastStore.error(res.message);
    }
  } catch (e) {
    toastStore.error('Lỗi khi gửi mã xác thực email.');
  } finally {
    loadingEmailOtp.value = false;
  }
};

const handleVerifyEmailOtp = async () => {
  if (!emailForm.value.otp || emailForm.value.otp.trim().length < 6) {
    toastStore.warning('Vui lòng nhập đủ 6 chữ số mã OTP xác thực.');
    return;
  }
  loadingVerifyEmail.value = true;
  try {
    const res = await api.verifyEmailOtp(emailForm.value.otp.trim());
    if (res.success) {
      toastStore.success(res.message);
      profile.value.Email = res.email || emailForm.value.email.trim();
      if (authStore.user) {
        authStore.user.email = profile.value.Email;
      }
      emailOtpSent.value = false;
      serverEmailOtp.value = '';
      emailForm.value = { email: '', otp: '' };
      if (emailOtpTimer) clearInterval(emailOtpTimer);
    } else {
      toastStore.error(res.message);
    }
  } catch (e) {
    toastStore.error('Lỗi xác thực email.');
  } finally {
    loadingVerifyEmail.value = false;
  }
};

const formatDate = (dateStr) => {
  if (!dateStr) return 'Mới tham gia';
  return new Date(dateStr).toLocaleDateString('vi-VN');
};

onMounted(() => {
  loadProfile();
});

onUnmounted(() => {
  if (emailOtpTimer) clearInterval(emailOtpTimer);
  if (phoneOtpTimer) clearInterval(phoneOtpTimer);
});
</script>

<style scoped>
.profile-page-wrapper {
  position: relative;
  min-height: 100vh;
}

.profile-container {
  position: relative;
  z-index: 1;
  padding: 110px 20px 80px;
  max-width: 1100px;
  margin: 0 auto;
}

.profile-header {
  margin-bottom: 32px;
  text-align: center;
}

.profile-header h1 {
  font-size: 2.2rem;
  font-weight: 800;
  color: var(--text-main);
}

.profile-header p {
  color: var(--text-muted);
  font-size: 1rem;
  margin-top: 6px;
}

.profile-grid {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 28px;
}

@media (max-width: 800px) {
  .profile-grid {
    grid-template-columns: 1fr;
  }
}

.profile-side {
  padding: 28px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 24px;
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.15);
}

/* AVATAR DRAG & DROP & ADJUST */
.avatar-container {
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  cursor: pointer;
  overflow: hidden;
  margin: 0 auto 10px;
  border: 4px solid #ffffff;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
}

.avatar-container:hover {
  transform: scale(1.03);
  box-shadow: 0 12px 28px rgba(0, 125, 104, 0.25);
  border-color: var(--primary-mint, #00b99a);
}

.avatar-dropzone-active {
  border-color: var(--primary-color, #007d68) !important;
  transform: scale(1.08) !important;
  box-shadow: 0 0 0 6px rgba(0, 185, 154, 0.3) !important;
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.avatar-hover-overlay {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.65);
  color: #ffffff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  opacity: 0;
  transition: opacity 0.2s;
  backdrop-filter: blur(2px);
}

.avatar-container:hover .avatar-hover-overlay,
.avatar-dropzone-active .avatar-hover-overlay {
  opacity: 1;
}

.btn-adjust-avatar {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #f1f5f9;
  color: #334155;
  border: 1px solid #cbd5e1;
  border-radius: 20px;
  padding: 6px 14px;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  margin-bottom: 16px;
  transition: all 0.2s;
  font-family: inherit;
}

.btn-adjust-avatar:hover {
  background: #e2e8f0;
  color: #0f172a;
  border-color: #94a3b8;
  transform: translateY(-1px);
}

.user-name {
  font-size: 1.25rem;
  font-weight: 700;
  color: #0f172a;
}

.user-phone-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.88rem;
  color: var(--primary-color, #007d68);
  font-weight: 600;
  margin-top: 6px;
}

.user-email {
  font-size: 0.82rem;
  color: #64748b;
  margin-top: 2px;
}

.user-badge {
  margin: 12px 0 16px;
}

.badge-active {
  background: #ecfdf5;
  color: #065f46;
  border: 1px solid rgba(16, 185, 129, 0.3);
  padding: 3px 12px;
  border-radius: 14px;
  font-size: 0.78rem;
  font-weight: 600;
}

.info-list {
  width: 100%;
  border-top: 1px solid #e2e8f0;
  padding-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  text-align: left;
}

.info-item {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
}

.info-label {
  color: #64748b;
}

.info-value {
  font-weight: 600;
  color: #1e293b;
}

.highlight-phone {
  color: var(--primary-color, #007d68);
  font-weight: 700;
}

.font-mono {
  font-family: monospace;
  font-size: 0.8rem;
}

.card {
  padding: 28px;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 24px;
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.15);
}

.card-heading {
  font-size: 1.15rem;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f1f5f9;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-size: 0.88rem;
  font-weight: 600;
  color: #334155;
  margin-bottom: 6px;
}

.required-star {
  color: #ef4444;
}

.form-control {
  width: 100%;
  padding: 11px 14px;
  border: 1.5px solid #cbd5e1;
  border-radius: 12px;
  font-size: 0.95rem;
  font-family: inherit;
  outline: none;
  background: #ffffff;
  color: #1e293b;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
}

.form-control:focus {
  border-color: var(--primary-mint, #00b99a);
  box-shadow: 0 0 0 3px rgba(0, 185, 154, 0.18);
}

/* SỐ ĐIỆN THOẠI & NÚT THAY ĐỔI */
.phone-action-row {
  display: flex;
  gap: 10px;
  align-items: center;
}

.phone-readonly {
  background: #f8fafc;
  cursor: default;
  color: #0f172a;
  font-weight: 600;
  flex: 1;
}

.btn-change-phone-action {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--primary-light, #e6f7f2);
  color: var(--primary-color, #007d68);
  border: 1px solid rgba(0, 185, 154, 0.3);
  border-radius: 12px;
  padding: 10px 16px;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
  font-family: inherit;
}

.btn-change-phone-action:hover {
  background: var(--primary-color, #007d68);
  color: #ffffff;
  border-color: var(--primary-color, #007d68);
  transform: translateY(-1px);
}

/* PASSWORD EYE WRAPPER */
.input-password-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}

.input-password-wrapper .form-control {
  padding-right: 44px;
}

.btn-toggle-eye {
  position: absolute;
  right: 12px;
  background: transparent;
  border: none;
  cursor: pointer;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  line-height: 1;
  transition: color 0.2s, transform 0.1s;
}

.btn-toggle-eye:hover {
  color: #1e293b;
  transform: scale(1.08);
}

.btn-primary {
  padding: 11px 24px;
  background: var(--primary-gradient, linear-gradient(135deg, #00b99a 0%, #007d68 100%));
  color: #ffffff;
  border: none;
  border-radius: 20px;
  font-weight: 700;
  font-size: 0.92rem;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
  box-shadow: 0 4px 14px rgba(0, 125, 104, 0.25);
}

.btn-primary:hover:not(:disabled) {
  opacity: 0.95;
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(0, 125, 104, 0.35);
}

.btn-secondary {
  padding: 11px 24px;
  background: #0f172a;
  color: #ffffff;
  border: none;
  border-radius: 20px;
  font-weight: 700;
  font-size: 0.92rem;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}

.btn-secondary:hover:not(:disabled) {
  background: #1e293b;
  transform: translateY(-1px);
}

.btn-outline {
  padding: 10px 20px;
  background: transparent;
  color: #64748b;
  border: 1.5px solid #cbd5e1;
  border-radius: 20px;
  font-weight: 700;
  font-size: 0.88rem;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}

.btn-outline:hover {
  background: #f1f5f9;
  color: #1e293b;
}

.field-hint {
  font-size: 0.78rem;
  color: #64748b;
  margin-top: 4px;
}

.text-success {
  color: #16a34a;
}

.card-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.title-with-badge {
  display: flex;
  align-items: center;
  gap: 10px;
}

.badge-optional {
  background: #f1f5f9;
  color: #64748b;
  font-size: 0.75rem;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 600;
}

.badge-verified {
  color: #16a34a;
  font-size: 0.82rem;
  font-weight: 700;
}

.badge-unverified {
  color: #d97706;
  font-size: 0.82rem;
  font-weight: 600;
}

.card-desc {
  font-size: 0.85rem;
  color: #64748b;
  margin-bottom: 16px;
  line-height: 1.5;
}

.label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.otp-badge-sent {
  font-size: 0.75rem;
  color: #16a34a;
  background: #dcfce7;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 600;
}

.otp-input-group-row {
  display: flex;
  gap: 8px;
  align-items: stretch;
  width: 100%;
}

.otp-input-box {
  flex: 1;
  height: 48px;
  font-size: 0.95rem;
  letter-spacing: normal;
  font-weight: 400;
  font-family: inherit;
  box-sizing: border-box;
}

.btn-get-otp-action {
  height: 48px;
  min-width: 95px;
  padding: 0 18px;
  background: var(--primary-color, #007d68);
  color: #ffffff;
  border: 1.5px solid var(--primary-color, #007d68);
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: 400;
  letter-spacing: normal;
  cursor: pointer;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  box-sizing: border-box;
  font-family: inherit;
}

.btn-get-otp-action:hover:not(:disabled) {
  background: var(--primary-hover, #006050);
  border-color: var(--primary-hover, #006050);
  transform: translateY(-1px);
}

.btn-get-otp-action:disabled {
  background: #f1f5f9;
  border-color: #cbd5e1;
  color: #94a3b8;
  cursor: not-allowed;
  transform: none;
}

.otp-help-text {
  font-size: 0.78rem;
  color: #64748b;
  margin-top: 4px;
  line-height: 1.4;
}

.otp-success-text {
  color: #059669;
}

.spinner-small {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-radius: 50%;
  border-top-color: #ffffff;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* MODAL STYLES */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.65);
  backdrop-filter: blur(4px);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.modal-card {
  background: #ffffff;
  border-radius: 20px;
  width: 100%;
  max-width: 480px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25);
  overflow: hidden;
  animation: modalPop 0.25s ease-out;
}

@keyframes modalPop {
  0% { transform: scale(0.95); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

.modal-header {
  padding: 20px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #f1f5f9;
}

.modal-header h3 {
  font-size: 1.15rem;
  font-weight: 700;
  color: #0f172a;
}

.modal-close {
  background: transparent;
  border: none;
  font-size: 1.2rem;
  color: #94a3b8;
  cursor: pointer;
  line-height: 1;
}

.modal-close:hover {
  color: #1e293b;
}

.modal-body {
  padding: 20px 24px;
}

.modal-desc {
  font-size: 0.88rem;
  color: #64748b;
  margin-bottom: 16px;
}

.modal-footer {
  padding: 16px 24px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  background: #f8fafc;
  border-top: 1px solid #f1f5f9;
}

/* CROP MODAL STYLES */
.crop-modal-card {
  max-width: 520px;
  width: 95%;
}

.crop-modal-sub {
  font-size: 0.82rem;
  color: #64748b;
  margin-top: 2px;
}

.crop-modal-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 24px;
}

.crop-viewport {
  width: 250px;
  height: 250px;
  border-radius: 50%;
  position: relative;
  overflow: hidden;
  background: #0f172a;
  cursor: grab;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25), inset 0 0 0 2px rgba(255, 255, 255, 0.3);
  user-select: none;
  touch-action: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

.crop-viewport:active {
  cursor: grabbing;
}

.crop-image {
  max-width: none;
  max-height: none;
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
  user-select: none;
}

.crop-crosshair {
  position: absolute;
  inset: 0;
  border: 1.5px dashed rgba(255, 255, 255, 0.45);
  border-radius: 50%;
  pointer-events: none;
}

.corner-presets-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 18px;
  width: 100%;
}

.corner-preset-label {
  font-size: 0.78rem;
  color: #64748b;
  font-weight: 600;
  margin-right: 2px;
}

.btn-corner {
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  color: #334155;
  border-radius: 14px;
  padding: 4px 10px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
}

.btn-corner:hover {
  background: var(--primary-color, #007d68);
  color: #ffffff;
  border-color: var(--primary-color, #007d68);
}

.zoom-slider-row {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 80%;
  margin-top: 16px;
  color: #64748b;
}

.zoom-range {
  flex: 1;
  accent-color: var(--primary-color, #007d68);
  cursor: pointer;
}

.zoom-value {
  font-size: 0.8rem;
  font-weight: 700;
  color: #1e293b;
  min-width: 42px;
}

.crop-instructions {
  font-size: 0.78rem;
  color: #64748b;
  text-align: center;
  margin-top: 14px;
  background: #f8fafc;
  padding: 8px 14px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
}
</style>
