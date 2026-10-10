<template>
  <div class="admin-login-wrapper">
    <div class="login-card glass-panel">
      <!-- Header Brand -->
      <div class="login-header">
        <div class="brand-badge-row">
          <img src="/images/logo-mint.png" class="login-brand-logo-img" alt="TaVivu" />
          <span class="brand-name">TaVivu</span>
          <span class="portal-badge">ADMIN PORTAL</span>
        </div>
        <h2 class="login-title">Đăng nhập Quản trị viên</h2>
        <p class="login-desc">Hệ thống quản lý nội bộ dành cho Ban Quản trị TaVivu</p>
      </div>

      <!-- Thông báo bảo mật nội bộ (Không có đăng ký) -->
      <div class="internal-notice-box">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" class="notice-icon">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
        <span>Cổng nội bộ: Quyền Admin do hệ thống cấp phép, không mở đăng ký tự do.</span>
      </div>

      <!-- Cảnh báo khóa Brute-force 15 phút -->
      <div v-if="isLocked" class="lockout-alert">
        <div class="lockout-head">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
          <strong>Tài khoản bị tạm khóa 15 phút!</strong>
        </div>
        <p>{{ errorMessage }}</p>
      </div>

      <!-- Cảnh báo lỗi thông thường -->
      <div v-else-if="errorMessage" class="error-alert">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <span>{{ errorMessage }}</span>
      </div>

      <!-- Thông báo thành công -->
      <div v-if="successMessage" class="success-alert">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
        <span>{{ successMessage }}</span>
      </div>

      <!-- Form đăng nhập Admin -->
      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label class="form-label">
            Số điện thoại hoặc Email Quản trị <span class="required-star">*</span>
          </label>
          <div class="input-with-icon">
            <svg class="input-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <input 
              v-model="form.account" 
              type="text" 
              required 
              placeholder="0987 654 321 hoặc manh.nguyen@webdulich.com" 
              class="form-input" 
              :disabled="loading"
            />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">
            Mật khẩu Admin <span class="required-star">*</span>
          </label>
          <div class="input-with-icon">
            <svg class="input-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            <input 
              v-model="form.password" 
              :type="showPassword ? 'text' : 'password'" 
              required 
              placeholder="Nhập mật khẩu quản trị viên" 
              class="form-input password-input" 
              :disabled="loading"
            />
            <button 
              type="button" 
              class="btn-toggle-eye" 
              @click="showPassword = !showPassword"
              :title="showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'"
            >
              <svg v-if="!showPassword" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="7" r="3"></circle>
              </svg>
              <svg v-else viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                <line x1="1" y1="1" x2="23" y2="23"></line>
              </svg>
            </button>
          </div>
        </div>

        <div class="form-options">
          <label class="remember-label">
            <input type="checkbox" v-model="rememberMe" />
            <span>Ghi nhớ phiên làm việc</span>
          </label>
        </div>

        <button type="submit" class="btn btn-primary btn-submit" :disabled="loading || isLocked">
          <span v-if="loading" class="spinner"></span>
          <svg v-else viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
            <polyline points="10 17 15 12 10 7"></polyline>
            <line x1="15" y1="12" x2="3" y2="12"></line>
          </svg>
          {{ loading ? 'Đang xác thực...' : 'Đăng nhập Hệ thống Quản trị' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import adminApi from '../services/api';

const emit = defineEmits(['login-success']);

const form = ref({
  account: '',
  password: ''
});

const showPassword = ref(false);
const rememberMe = ref(true);
const loading = ref(false);
const errorMessage = ref('');
const successMessage = ref('');
const isLocked = ref(false);

const handleLogin = async () => {
  if (!form.value.account || !form.value.password) {
    errorMessage.value = 'Vui lòng nhập tài khoản và mật khẩu.';
    return;
  }

  loading.value = true;
  errorMessage.value = '';
  successMessage.value = '';
  isLocked.value = false;

  try {
    const adminProfile = await adminApi.login(form.value.account, form.value.password);
    successMessage.value = `Đăng nhập thành công! Chào mừng Quản trị viên ${adminProfile.FullName || adminProfile.fullName || ''}`;
    
    setTimeout(() => {
      emit('login-success', adminProfile);
      window.dispatchEvent(new CustomEvent('admin-logged-in', { detail: adminProfile }));
    }, 600);
  } catch (err) {
    console.error('Đăng nhập admin thất bại:', err);
    if (err.isLocked) {
      isLocked.value = true;
      errorMessage.value = `Tài khoản đã bị tạm khóa 15 phút do nhập sai quá nhiều lần. Còn ${err.remainingMinutes || 15} phút trước khi mở khóa.`;
    } else {
      errorMessage.value = err.message || 'Số điện thoại/Email hoặc mật khẩu không chính xác.';
    }
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.admin-login-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 120px);
  padding: 30px 20px;
}

.login-card {
  width: 100%;
  max-width: 480px;
  padding: 36px 32px;
  background: rgba(15, 23, 42, 0.88);
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 20px 45px rgba(0, 0, 0, 0.45);
  border-radius: 20px;
  color: #f8fafc;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  animation: cardFadeUp 0.4s ease-out;
}

@keyframes cardFadeUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.login-header {
  text-align: center;
  margin-bottom: 24px;
}

.brand-badge-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 12px;
}

.login-brand-logo-img {
  width: 52px;
  height: 40px;
  object-fit: contain;
  filter: brightness(0.9) saturate(1.15);
}

.brand-name {
  font-size: 2rem;
  font-weight: 800;
  color: #00b99a;
  letter-spacing: -0.5px;
}

.portal-badge {
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  padding: 3px 9px;
  border-radius: 6px;
  background: #007d68;
  color: #ffffff;
}

.login-title {
  font-size: 1.35rem;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 6px;
}

.login-desc {
  font-size: 0.86rem;
  color: #94a3b8;
  line-height: 1.4;
}

.internal-notice-box {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: rgba(59, 130, 246, 0.12);
  border: 1px solid rgba(59, 130, 246, 0.28);
  border-radius: 10px;
  color: #93c5fd;
  font-size: 0.8rem;
  line-height: 1.35;
  margin-bottom: 20px;
}

.notice-icon {
  flex-shrink: 0;
  color: #60a5fa;
}

.lockout-alert {
  padding: 12px 14px;
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid #ef4444;
  border-radius: 10px;
  color: #fca5a5;
  margin-bottom: 18px;
  font-size: 0.85rem;
}

.lockout-head {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #ef4444;
  margin-bottom: 4px;
  font-size: 0.9rem;
}

.error-alert {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 14px;
  background: rgba(239, 68, 68, 0.14);
  border: 1px solid rgba(239, 68, 68, 0.4);
  border-radius: 10px;
  color: #fca5a5;
  font-size: 0.85rem;
  margin-bottom: 18px;
}

.success-alert {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 14px;
  background: rgba(16, 185, 129, 0.14);
  border: 1px solid rgba(16, 185, 129, 0.4);
  border-radius: 10px;
  color: #6ee7b7;
  font-size: 0.85rem;
  margin-bottom: 18px;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 0.82rem;
  font-weight: 600;
  color: #cbd5e1;
}

.required-star {
  color: #f87171;
}

.input-with-icon {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 12px;
  color: #64748b;
  pointer-events: none;
}

.form-input {
  width: 100%;
  padding: 11px 14px 11px 40px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(30, 41, 59, 0.7);
  color: #f8fafc;
  font-size: 0.9rem;
  font-family: inherit;
  outline: none;
  transition: all 0.2s ease;
}

.password-input {
  padding-right: 42px;
}

.form-input:focus {
  border-color: #00b99a;
  background: rgba(30, 41, 59, 0.95);
  box-shadow: 0 0 0 3px rgba(0, 185, 154, 0.25);
}

.btn-toggle-eye {
  position: absolute;
  right: 12px;
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.15s;
}

.btn-toggle-eye:hover {
  color: #f8fafc;
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.82rem;
  color: #94a3b8;
}

.remember-label {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  cursor: pointer;
}

.btn-submit {
  width: 100%;
  padding: 12px;
  font-size: 0.95rem;
  font-weight: 700;
  margin-top: 4px;
  background: linear-gradient(135deg, #00b99a 0%, #007d68 100%);
  box-shadow: 0 4px 14px rgba(0, 125, 104, 0.35);
}

.btn-submit:hover:not(:disabled) {
  background: linear-gradient(135deg, #00a88a 0%, #006050 100%);
  transform: translateY(-1px);
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #fff;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
