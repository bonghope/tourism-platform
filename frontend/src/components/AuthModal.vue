<template>
  <Teleport to="body">
    <div v-if="isOpen" class="modal-overlay" @click.self="close">
      <div class="auth-card">
        <button class="btn-close" @click="close" aria-label="Đóng">✕</button>

        <div class="auth-header">
          <h2 class="auth-title">Chào mừng đến với TaVivu</h2>
          <p class="auth-desc">
            <template v-if="currentTab === 'register'">Đăng ký tài khoản bằng Số điện thoại</template>
            <template v-else-if="currentTab === 'google'">Đăng nhập nhanh bằng tài khoản Google (Gmail + Mật khẩu + OTP)</template>
            <template v-else-if="currentTab === 'otp'">Nhập mã xác thực OTP gửi về số điện thoại</template>
            <template v-else-if="currentTab === 'forgot'">Khôi phục mật khẩu qua Số điện thoại</template>
            <template v-else>Đăng nhập bằng Số điện thoại của bạn</template>
          </p>
        </div>

        <!-- Navigation Tabs (Chỉ 2 tab song song: Đăng nhập & Đăng ký) -->
        <div v-if="currentTab === 'login' || currentTab === 'register'" class="tab-header">
          <button 
            type="button"
            :class="['tab-btn', currentTab === 'login' ? 'active' : '']" 
            @click="switchTab('login')"
          >
            Đăng nhập
          </button>
          <button 
            type="button"
            :class="['tab-btn', currentTab === 'register' ? 'active' : '']" 
            @click="switchTab('register')"
          >
            Đăng ký
          </button>
        </div>

        <!-- FORM ĐĂNG NHẬP -->
        <form v-if="currentTab === 'login'" @submit.prevent="handleLogin" class="auth-form">
          <div class="form-group">
            <label>Số điện thoại <span class="required-star">*</span></label>
            <input 
              v-model="loginForm.phone" 
              type="tel" 
              required 
              placeholder="0912 345 678" 
              class="form-control" 
            />
          </div>

          <div class="form-group">
            <label>Mật khẩu <span class="required-star">*</span></label>
            <div class="input-password-wrapper">
              <input 
                v-model="loginForm.password" 
                :type="showLoginPassword ? 'text' : 'password'" 
                required 
                placeholder="Nhập mật khẩu" 
                class="form-control" 
              />
              <button 
                type="button" 
                class="btn-toggle-eye" 
                @click="showLoginPassword = !showLoginPassword"
                :title="showLoginPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'"
                aria-label="Toggle password visibility"
              >
                <!-- SVG Mắt mở (khi đang ẩn) / SVG Mắt gạch (khi đang hiện) -->
                <svg v-if="!showLoginPassword" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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

          <div class="form-sub-row">
            <a href="#" @click.prevent="openForgot" class="link-small">Quên mật khẩu?</a>
          </div>

          <button type="submit" class="btn-submit" :disabled="loading">
            <span v-if="loading" class="spinner-small"></span>
            <span v-else>Đăng nhập</span>
          </button>

          <!-- CẢNH BÁO TÀI KHOẢN BỊ TẠM KHÓA 15 PHÚT (CHỈ HIỆN KHI NHẬP SAI 5 LẦN LIÊN TIẾP) -->
          <div v-if="isAccountLocked" class="lockout-alert-box">
            <div class="lockout-head">
              <strong>Tài khoản bị tạm khóa 15 phút!</strong>
            </div>
            <p class="lockout-desc">{{ errorMessage }}</p>
            <button type="button" class="btn-lockout-recover" @click="openForgotFromLock">
              Khôi phục mật khẩu ngay bằng OTP
            </button>
          </div>

          <!-- CẢNH BÁO NHẬP SAI (CÒN LẦN THỬ TRƯỚC KHI BỊ KHÓA) DƯỚI NÚT ĐĂNG NHẬP -->
          <div v-else-if="errorMessage" class="login-warning-box">
            <p class="login-warning-text">{{ errorMessage }}</p>
            <button 
              v-if="errorMessage.includes('lần thử') || errorMessage.includes('không chính xác')" 
              type="button" 
              class="btn-lockout-recover" 
              @click="openForgotFromLock"
            >
              Khôi phục mật khẩu ngay bằng OTP
            </button>
          </div>

          <div class="divider">
            <span>hoặc</span>
          </div>

          <!-- Google SSO (Màn nhỏ riêng biệt) -->
          <button type="button" class="btn-google" @click="openGooglePopup">
            <svg viewBox="0 0 24 24" width="18" height="18" class="google-svg">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            Đăng nhập bằng Google
          </button>
        </form>

        <!-- FORM ĐĂNG KÝ (NHẬP SĐT LẤY OTP NGAY, Ô LẤY MÃ BẰNG Ô OTP Ở GÓC PHẢI) -->
        <form v-else-if="currentTab === 'register'" @submit.prevent="handleRegisterWithOtp" class="auth-form">
          <div v-if="errorMessage" class="alert-danger">
            {{ errorMessage }}
          </div>

          <div class="form-group">
            <label>Họ và tên <span class="required-star">*</span></label>
            <input v-model="regForm.fullName" type="text" required placeholder="Nguyễn Văn A" class="form-control" />
          </div>

          <div class="form-group">
            <label>Số điện thoại <span class="required-star">*</span></label>
            <input 
              v-model="regForm.phone" 
              type="tel" 
              required 
              placeholder="0912 345 678" 
              class="form-control" 
            />
          </div>

          <!-- MÃ XÁC THỰC OTP NGAY DƯỚI SỐ ĐIỆN THOẠI (NÚT LẤY MÃ BẰNG CHIỀU CAO Ô OTP, Ở GÓC PHẢI, TRONG Ô GHI "Nhập mã") -->
          <div class="form-group">
            <div class="label-row">
              <label>Mã xác thực OTP <span class="required-star">*</span></label>
              <span v-if="otpSent" class="otp-badge-sent">Đã gửi mã</span>
            </div>
            <div class="otp-input-group-row">
              <input 
                v-model="regForm.otp" 
                type="text" 
                maxlength="6" 
                placeholder="Nhập mã" 
                class="form-control otp-input-box" 
              />
              <button 
                type="button" 
                class="btn-get-otp-action" 
                @click="requestRegisterOtp" 
                :disabled="sendingOtp || otpCountdown > 0 || !regForm.phone || regForm.phone.trim().length < 9"
                :title="!regForm.phone ? 'Vui lòng nhập SĐT để lấy mã' : 'Lấy mã OTP'"
              >
                <span v-if="sendingOtp" class="spinner-small"></span>
                <span v-else-if="otpCountdown > 0">{{ otpCountdown }}s</span>
                <span v-else>{{ otpSent ? 'Gửi lại mã' : 'Lấy mã' }}</span>
              </button>
            </div>
            <p v-if="otpSent" class="otp-help-text otp-success-text">
              Mã OTP đã gửi đến SĐT <strong>{{ regForm.phone }}</strong>: <strong>{{ regForm.otp }}</strong>
            </p>
          </div>

          <div class="form-group">
            <label>Email <span class="optional-tag">(Không bắt buộc)</span></label>
            <input v-model="regForm.email" type="email" placeholder="email@example.com" class="form-control" />
          </div>

          <div class="form-group">
            <label>Mật khẩu <span class="required-star">*</span></label>
            <div class="input-password-wrapper">
              <input 
                v-model="regForm.password" 
                :type="showRegPassword ? 'text' : 'password'" 
                required 
                placeholder="Tối thiểu 6 ký tự" 
                class="form-control" 
              />
              <button 
                type="button" 
                class="btn-toggle-eye" 
                @click="showRegPassword = !showRegPassword"
                :title="showRegPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'"
                aria-label="Toggle password visibility"
              >
                <svg v-if="!showRegPassword" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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

          <!-- NÚT ĐĂNG KÝ TÀI KHOẢN (BẮT BUỘC ĐIỀN OTP MỚI ẤN ĐƯỢC) -->
          <button 
            type="submit" 
            class="btn-submit" 
            :disabled="loading || !regForm.otp || regForm.otp.trim().length < 6"
            :class="{ 'btn-disabled': !regForm.otp || regForm.otp.trim().length < 6 }"
            :title="!regForm.otp || regForm.otp.trim().length < 6 ? 'Vui lòng nhập mã OTP để kích hoạt nút đăng ký' : 'Đăng ký tài khoản'"
          >
            <span v-if="loading" class="spinner-small"></span>
            <span v-else>Đăng ký tài khoản</span>
          </button>
        </form>

        <!-- QUÊN MẬT KHẨU (KHÔI PHỤC BẰNG SỐ ĐIỆN THOẠI) -->
        <div v-else-if="currentTab === 'forgot'" class="auth-form">
          <div class="otp-header">
            <h3>Khôi phục mật khẩu</h3>
            <p>Nhập số điện thoại đã đăng ký để nhận mã OTP thiết lập mật khẩu mới</p>
          </div>

          <div v-if="errorMessage" class="alert-danger">
            {{ errorMessage }}
          </div>

          <div v-if="!forgotSent">
            <div class="form-group">
              <label>Số điện thoại tài khoản <span class="required-star">*</span></label>
              <input 
                v-model="forgotPhone" 
                type="tel" 
                required 
                placeholder="0912 345 678" 
                class="form-control" 
                @keyup.enter="handleForgotSend"
              />
            </div>
            <button 
              type="button" 
              class="btn-submit" 
              @click="handleForgotSend" 
              :disabled="loading || sendingForgotOtp || !forgotPhone || forgotPhone.trim().length < 9"
            >
              <span v-if="loading || sendingForgotOtp" class="spinner-small"></span>
              <span v-else>Gửi mã khôi phục qua SĐT</span>
            </button>
          </div>

          <form v-else @submit.prevent="handleForgotReset">
            <!-- Mã xác thực OTP gửi về SĐT -->
            <div class="form-group">
              <div class="label-row">
                <label>Mã xác thực OTP <span class="required-star">*</span></label>
                <span class="otp-badge-sent">Đã gửi tới {{ forgotPhone }}</span>
              </div>
              <div class="otp-input-group-row">
                <input 
                  v-model="forgotOtp" 
                  type="text" 
                  maxlength="6" 
                  required 
                  placeholder="Nhập mã" 
                  class="form-control otp-input-box" 
                />
                <button 
                  type="button" 
                  class="btn-get-otp-action" 
                  @click="handleForgotSend" 
                  :disabled="sendingForgotOtp || forgotCountdown > 0"
                >
                  <span v-if="sendingForgotOtp" class="spinner-small"></span>
                  <span v-else-if="forgotCountdown > 0">{{ forgotCountdown }}s</span>
                  <span v-else>Gửi lại mã</span>
                </button>
              </div>
              <p class="otp-help-text otp-success-text">
                Mã OTP khôi phục đã gửi đến SĐT <strong>{{ forgotPhone }}</strong>: <strong>{{ forgotOtp }}</strong>
              </p>
            </div>

            <!-- Mật khẩu mới -->
            <div class="form-group">
              <label>Mật khẩu mới <span class="required-star">*</span></label>
              <div class="input-password-wrapper">
                <input 
                  v-model="forgotNewPassword" 
                  :type="showForgotNewPassword ? 'text' : 'password'" 
                  required 
                  placeholder="Tối thiểu 6 ký tự" 
                  class="form-control" 
                />
                <button 
                  type="button" 
                  class="btn-toggle-eye" 
                  @click="showForgotNewPassword = !showForgotNewPassword"
                  :title="showForgotNewPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'"
                >
                  <svg v-if="!showForgotNewPassword" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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

            <!-- Xác nhận mật khẩu mới -->
            <div class="form-group">
              <label>Xác nhận mật khẩu mới <span class="required-star">*</span></label>
              <div class="input-password-wrapper">
                <input 
                  v-model="forgotConfirmPassword" 
                  :type="showForgotConfirmPassword ? 'text' : 'password'" 
                  required 
                  placeholder="Nhập lại mật khẩu mới" 
                  class="form-control" 
                />
                <button 
                  type="button" 
                  class="btn-toggle-eye" 
                  @click="showForgotConfirmPassword = !showForgotConfirmPassword"
                  :title="showForgotConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'"
                >
                  <svg v-if="!showForgotConfirmPassword" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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

            <button 
              type="submit" 
              class="btn-submit" 
              :disabled="loading || !forgotOtp || forgotOtp.trim().length < 6 || !forgotNewPassword"
            >
              <span v-if="loading" class="spinner-small"></span>
              <span v-else>Xác nhận đổi mật khẩu</span>
            </button>
          </form>

          <button type="button" class="btn-secondary-link" @click="switchTab('login')">
            ← Quay lại Đăng nhập
          </button>
        </div>
      </div>
    </div>

    <!-- MÀN NHỎ ĐĂNG NHẬP GOOGLE RIÊNG BIỆT (POPUP DIALOG CHUẨN GOOGLE NỔI TRÊN MÀN HÌNH) -->
    <div v-if="showGooglePopup" class="google-dialog-backdrop" @click.self="closeGooglePopup">
      <div class="google-dialog-card">
        <!-- Nút đóng X ở góc trên phải -->
        <button type="button" class="google-dialog-close" @click="closeGooglePopup" title="Đóng">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <!-- Header Google -->
        <div class="google-dialog-header">
          <div class="google-icon-circle">
            <svg viewBox="0 0 24 24" width="28" height="28">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
          </div>
          <h3 class="google-dialog-title">Đăng nhập với Google</h3>
          <p class="google-dialog-subtitle">Tiếp tục với TaVivu</p>
        </div>

        <div v-if="googleErrorMessage" class="alert-danger" style="margin-bottom: 16px;">
          {{ googleErrorMessage }}
        </div>

        <!-- Form Gmail + Mật khẩu + OTP -->
        <form @submit.prevent="handleGoogleLoginWithOtp" class="google-dialog-form">
          <!-- 1. Tài khoản Gmail -->
          <div class="form-group">
            <label>Tài khoản Gmail <span class="required-star">*</span></label>
            <input 
              v-model="googleForm.email" 
              type="email" 
              required 
              placeholder="example@gmail.com" 
              class="form-control" 
            />
          </div>

          <!-- 2. Mật khẩu Gmail (có mắt ẩn/hiện) -->
          <div class="form-group">
            <label>Mật khẩu Gmail <span class="required-star">*</span></label>
            <div class="input-password-wrapper">
              <input 
                v-model="googleForm.password" 
                :type="showGooglePassword ? 'text' : 'password'" 
                required 
                placeholder="Nhập mật khẩu Gmail" 
                class="form-control" 
              />
              <button 
                type="button" 
                class="btn-toggle-eye" 
                @click="showGooglePassword = !showGooglePassword"
                :title="showGooglePassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'"
                aria-label="Toggle password visibility"
              >
                <svg v-if="!showGooglePassword" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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

          <!-- 3. Mã OTP xác thực Gmail -->
          <div class="form-group">
            <div class="label-row">
              <label>Mã xác thực OTP <span class="required-star">*</span></label>
              <span v-if="googleOtpSent" class="otp-badge-sent">Đã gửi mã</span>
            </div>
            <div class="otp-input-group-row">
              <input 
                v-model="googleForm.otp" 
                type="text" 
                maxlength="6" 
                placeholder="Nhập mã" 
                class="form-control otp-input-box" 
              />
              <button 
                type="button" 
                class="btn-get-otp-action" 
                @click="requestGoogleLoginOtp" 
                :disabled="sendingGoogleOtp || googleOtpCountdown > 0 || !googleForm.email || !googleForm.email.includes('@')"
                :title="!googleForm.email ? 'Vui lòng nhập Gmail để lấy mã' : 'Lấy mã OTP'"
              >
                <span v-if="sendingGoogleOtp" class="spinner-small"></span>
                <span v-else-if="googleOtpCountdown > 0">{{ googleOtpCountdown }}s</span>
                <span v-else>{{ googleOtpSent ? 'Gửi lại mã' : 'Lấy mã' }}</span>
              </button>
            </div>
            <p v-if="googleOtpSent" class="otp-help-text otp-success-text">
              Mã OTP đã gửi đến Gmail <strong>{{ googleForm.email }}</strong>: <strong>{{ googleForm.otp }}</strong>
            </p>
          </div>

          <!-- Nút hành động -->
          <div class="google-dialog-actions">
            <button type="button" class="btn-google-cancel" @click="closeGooglePopup">
              Hủy bỏ
            </button>
            <button 
              type="submit" 
              class="btn-google-submit" 
              :disabled="loading || !googleForm.otp || googleForm.otp.trim().length < 6 || !googleForm.password"
              :class="{ 'btn-disabled': !googleForm.otp || googleForm.otp.trim().length < 6 || !googleForm.password }"
            >
              <span v-if="loading" class="spinner-small"></span>
              <span v-else>Đăng nhập Google</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch, onUnmounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useToastStore } from '../stores/toast';
import api from '../services/api';

const props = defineProps({
  isOpen: Boolean,
  initialTab: { type: String, default: 'login' }
});

const emit = defineEmits(['close', 'login-success']);

const authStore = useAuthStore();
const toastStore = useToastStore();

const currentTab = ref(props.initialTab || 'login');
const loading = ref(false);
const errorMessage = ref('');
const isAccountLocked = ref(false);

const openForgotFromLock = () => {
  openForgot();
  if (forgotPhone.value && forgotPhone.value.trim().length >= 9) {
    handleForgotSend();
  }
};

watch(() => props.initialTab, (newTab) => {
  if (newTab) {
    currentTab.value = newTab;
    errorMessage.value = '';
    isAccountLocked.value = false;
  }
});

watch(() => props.isOpen, (open) => {
  if (open) {
    currentTab.value = props.initialTab || 'login';
    errorMessage.value = '';
    isAccountLocked.value = false;
  }
});

const switchTab = (tab) => {
  if (tab === 'google') {
    openGooglePopup();
    return;
  }
  currentTab.value = tab;
  errorMessage.value = '';
  isAccountLocked.value = false;
};

const showLoginPassword = ref(false);
const showRegPassword = ref(false);

const loginForm = ref({ phone: '', password: '' });
const regForm = ref({ fullName: '', phone: '', email: '', password: '', otp: '' });

const sendingOtp = ref(false);
const otpSent = ref(false);
const otpCountdown = ref(0);
let otpTimer = null;

const forgotPhone = ref('');
const forgotSent = ref(false);
const forgotOtp = ref('');
const forgotNewPassword = ref('');
const forgotConfirmPassword = ref('');
const showForgotNewPassword = ref(false);
const showForgotConfirmPassword = ref(false);
const sendingForgotOtp = ref(false);
const forgotCountdown = ref(0);
let forgotTimer = null;

const close = () => {
  showGooglePopup.value = false;
  isAccountLocked.value = false;
  emit('close');
};

const handleLogin = async () => {
  const phone = (loginForm.value.phone || '').trim();
  if (!phone || phone.length < 9) {
    errorMessage.value = 'Vui lòng nhập Số điện thoại hợp lệ (tối thiểu 9 số).';
    toastStore.warning('Vui lòng nhập Số điện thoại.');
    return;
  }
  if (!loginForm.value.password) {
    errorMessage.value = 'Vui lòng nhập Mật khẩu.';
    toastStore.warning('Vui lòng nhập Mật khẩu.');
    return;
  }
  loading.value = true;
  errorMessage.value = '';
  try {
    const res = await api.login(phone, loginForm.value.password);
    if (res.success) {
      isAccountLocked.value = false;
      authStore.setUserSession(res.user, res.accessToken);
      toastStore.success(`Xin chào, ${res.user.fullName}!`);
      emit('login-success', res.user);
      close();
    } else {
      errorMessage.value = res.message;
      const isReallyLocked = Boolean(res.isLocked || (res.message && (res.message.includes('đã tạm khóa') || res.message.includes('tạm thời bị khóa'))));
      if (isReallyLocked) {
        isAccountLocked.value = true;
        toastStore.error(res.message);
      } else {
        isAccountLocked.value = false;
        toastStore.warning(res.message);
      }
    }
  } catch (e) {
    errorMessage.value = 'Lỗi kết nối máy chủ.';
    toastStore.error('Lỗi kết nối máy chủ.');
  } finally {
    loading.value = false;
  }
};

// --- MÀN NHỎ ĐĂNG NHẬP GOOGLE RIÊNG BIỆT (POPUP DIALOG) ---
const showGooglePopup = ref(false);
const googleErrorMessage = ref('');
const googleForm = ref({ email: '', password: '', otp: '' });
const showGooglePassword = ref(false);
const sendingGoogleOtp = ref(false);
const googleOtpSent = ref(false);
const googleOtpCountdown = ref(0);
let googleOtpTimer = null;

const openGooglePopup = () => {
  showGooglePopup.value = true;
  googleErrorMessage.value = '';
};

const closeGooglePopup = () => {
  showGooglePopup.value = false;
  googleErrorMessage.value = '';
};

const requestGoogleLoginOtp = async () => {
  googleErrorMessage.value = '';
  const email = (googleForm.value.email || '').trim().toLowerCase();
  if (!email || !email.includes('@')) {
    googleErrorMessage.value = 'Vui lòng nhập địa chỉ Gmail hợp lệ.';
    toastStore.warning('Vui lòng nhập địa chỉ Gmail để nhận mã OTP.');
    return;
  }

  sendingGoogleOtp.value = true;
  try {
    const res = await api.requestGoogleOtp(email);
    if (res.success) {
      googleOtpSent.value = true;
      toastStore.success(res.message || 'Mã OTP đã được gửi đến Gmail của bạn!');
      if (res.otp) {
        googleForm.value.otp = res.otp; // Tự động điền luôn mã OTP vào ô "Nhập mã"
        toastStore.info(`Mã OTP Gmail của bạn: ${res.otp}`);
      }

      // Đếm ngược 60s
      googleOtpCountdown.value = 60;
      if (googleOtpTimer) clearInterval(googleOtpTimer);
      googleOtpTimer = setInterval(() => {
        if (googleOtpCountdown.value > 0) {
          googleOtpCountdown.value--;
        } else {
          clearInterval(googleOtpTimer);
        }
      }, 1000);
    } else {
      googleErrorMessage.value = res.message;
      toastStore.error(res.message);
    }
  } catch (e) {
    googleErrorMessage.value = 'Lỗi hệ thống khi gửi mã OTP Gmail.';
    toastStore.error('Lỗi khi gửi mã OTP Gmail.');
  } finally {
    sendingGoogleOtp.value = false;
  }
};

const handleGoogleLoginWithOtp = async () => {
  googleErrorMessage.value = '';
  const email = (googleForm.value.email || '').trim().toLowerCase();
  if (!email || !email.includes('@')) {
    googleErrorMessage.value = 'Vui lòng nhập địa chỉ Gmail hợp lệ.';
    toastStore.warning('Vui lòng nhập địa chỉ Gmail.');
    return;
  }

  if (!googleForm.value.password) {
    googleErrorMessage.value = 'Vui lòng nhập mật khẩu Gmail.';
    toastStore.warning('Vui lòng nhập mật khẩu Gmail.');
    return;
  }

  if (!googleForm.value.otp || googleForm.value.otp.trim().length < 6) {
    googleErrorMessage.value = 'Vui lòng nhập đủ 6 chữ số mã OTP xác thực.';
    toastStore.warning('Vui lòng nhập mã OTP để đăng nhập Google.');
    return;
  }

  loading.value = true;
  try {
    const res = await api.googleLogin({
      email: email,
      password: googleForm.value.password,
      otp: googleForm.value.otp.trim(),
      fullName: email.split('@')[0]
    });

    if (res.success) {
      showGooglePopup.value = false;
      authStore.setUserSession(res.user, res.accessToken);
      toastStore.success(`Đăng nhập Google thành công! Xin chào ${res.user.fullName}.`);
      emit('login-success', res.user);
      close();
    } else {
      googleErrorMessage.value = res.message;
      toastStore.error(res.message);
    }
  } catch (e) {
    googleErrorMessage.value = 'Lỗi kết nối máy chủ khi đăng nhập Google.';
    toastStore.error('Lỗi khi đăng nhập Google.');
  } finally {
    loading.value = false;
  }
};

// --- GỬI MÃ OTP VỀ SĐT KHI BẤM "LẤY MÃ" ---
// CHỈ CẦN NHẬP SĐT (KHÔNG BẮT BUỘC MẬT KHẨU HAY HỌ TÊN TRƯỚC)
const requestRegisterOtp = async () => {
  errorMessage.value = '';
  const phone = (regForm.value.phone || '').trim();
  if (!phone || phone.length < 9) {
    errorMessage.value = 'Vui lòng nhập số điện thoại hợp lệ (tối thiểu 9 số) để nhận mã OTP.';
    toastStore.warning('Vui lòng nhập số điện thoại để lấy mã OTP.');
    return;
  }

  sendingOtp.value = true;
  try {
    const res = await api.register({
      phone: phone,
      email: regForm.value.email ? regForm.value.email.trim() : '',
      fullName: regForm.value.fullName ? regForm.value.fullName.trim() : '',
      password: regForm.value.password || ''
    });

    if (res.success) {
      otpSent.value = true;
      toastStore.success(res.message || 'Mã OTP đã được gửi đến Số điện thoại của bạn!');
      if (res.otp) {
        regForm.value.otp = res.otp; // Tự động điền luôn mã OTP vào ô "Nhập mã"
        toastStore.info(`Mã OTP xác thực của bạn: ${res.otp}`);
      }
      
      // Đếm ngược 60s
      otpCountdown.value = 60;
      if (otpTimer) clearInterval(otpTimer);
      otpTimer = setInterval(() => {
        if (otpCountdown.value > 0) {
          otpCountdown.value--;
        } else {
          clearInterval(otpTimer);
        }
      }, 1000);
    } else {
      errorMessage.value = res.message;
      toastStore.error(res.message);
    }
  } catch (e) {
    errorMessage.value = 'Lỗi hệ thống khi gửi mã OTP.';
    toastStore.error('Lỗi hệ thống khi gửi mã OTP.');
  } finally {
    sendingOtp.value = false;
  }
};

// --- ĐĂNG KÝ TÀI KHOẢN SAU KHI ĐÃ CÓ OTP VÀ ĐIỀN MẬT KHẨU ---
const handleRegisterWithOtp = async () => {
  if (!regForm.value.fullName || !regForm.value.fullName.trim()) {
    errorMessage.value = 'Vui lòng nhập Họ và tên.';
    toastStore.warning('Vui lòng nhập Họ và tên.');
    return;
  }

  const phone = (regForm.value.phone || '').trim();
  if (!phone) {
    errorMessage.value = 'Vui lòng nhập số điện thoại.';
    return;
  }

  if (!regForm.value.otp || regForm.value.otp.trim().length < 6) {
    errorMessage.value = 'Vui lòng nhập đủ 6 chữ số mã OTP xác thực.';
    toastStore.warning('Vui lòng nhập mã OTP để đăng ký.');
    return;
  }

  if (!regForm.value.password || regForm.value.password.length < 6) {
    errorMessage.value = 'Vui lòng nhập mật khẩu tối thiểu 6 ký tự.';
    toastStore.warning('Vui lòng nhập mật khẩu tối thiểu 6 ký tự.');
    return;
  }

  loading.value = true;
  errorMessage.value = '';
  try {
    const res = await api.verifyRegisterOtp({
      phone: phone,
      otp: regForm.value.otp.trim(),
      password: regForm.value.password,
      fullName: regForm.value.fullName ? regForm.value.fullName.trim() : ('Khách hàng ' + phone.slice(-4)),
      email: regForm.value.email ? regForm.value.email.trim() : null
    });

    if (res.success) {
      toastStore.success('Đăng ký tài khoản thành công! Vui lòng đăng nhập.');
      // Tự động quay về màn hình Đăng nhập theo đúng yêu cầu
      currentTab.value = 'login';
      loginForm.value.phone = phone;
      loginForm.value.password = '';
      
      // Reset form đăng ký
      regForm.value = { fullName: '', phone: '', email: '', password: '', otp: '' };
      otpSent.value = false;
      otpCountdown.value = 0;
      if (otpTimer) clearInterval(otpTimer);
    } else {
      errorMessage.value = res.message;
      toastStore.error(res.message);
    }
  } catch (e) {
    errorMessage.value = 'Lỗi xác thực đăng ký tài khoản.';
    toastStore.error('Lỗi xác thực đăng ký.');
  } finally {
    loading.value = false;
  }
};

const openForgot = () => {
  forgotPhone.value = loginForm.value.phone || '';
  forgotSent.value = false;
  forgotOtp.value = '';
  forgotNewPassword.value = '';
  forgotConfirmPassword.value = '';
  errorMessage.value = '';
  currentTab.value = 'forgot';
};

const handleForgotSend = async () => {
  errorMessage.value = '';
  const phone = (forgotPhone.value || '').trim();
  if (!phone || phone.length < 9) {
    errorMessage.value = 'Vui lòng nhập Số điện thoại hợp lệ (tối thiểu 9 số) để nhận mã OTP.';
    toastStore.warning('Vui lòng nhập Số điện thoại tài khoản.');
    return;
  }

  sendingForgotOtp.value = true;
  try {
    const res = await api.forgotPassword(phone);
    if (res.success) {
      forgotSent.value = true;
      toastStore.success(res.message || 'Mã OTP khôi phục đã được gửi tới số điện thoại của bạn!');
      if (res.otp) {
        forgotOtp.value = res.otp;
        toastStore.info(`Mã OTP khôi phục của bạn: ${res.otp}`);
      }

      // Đếm ngược 60 giây
      forgotCountdown.value = 60;
      if (forgotTimer) clearInterval(forgotTimer);
      forgotTimer = setInterval(() => {
        if (forgotCountdown.value > 0) {
          forgotCountdown.value--;
        } else {
          clearInterval(forgotTimer);
        }
      }, 1000);
    } else {
      errorMessage.value = res.message;
      toastStore.error(res.message);
    }
  } catch (e) {
    errorMessage.value = 'Lỗi hệ thống khi gửi mã OTP khôi phục.';
    toastStore.error('Lỗi khi gửi mã OTP khôi phục.');
  } finally {
    sendingForgotOtp.value = false;
  }
};

const handleForgotReset = async () => {
  errorMessage.value = '';
  const phone = (forgotPhone.value || '').trim();
  if (!phone) {
    errorMessage.value = 'Vui lòng nhập Số điện thoại.';
    return;
  }

  if (!forgotOtp.value || forgotOtp.value.trim().length < 6) {
    errorMessage.value = 'Vui lòng nhập đủ 6 chữ số mã OTP xác thực.';
    toastStore.warning('Vui lòng nhập mã OTP.');
    return;
  }

  if (!forgotNewPassword.value || forgotNewPassword.value.length < 6) {
    errorMessage.value = 'Mật khẩu mới phải có tối thiểu 6 ký tự.';
    toastStore.warning('Mật khẩu mới phải có tối thiểu 6 ký tự.');
    return;
  }

  if (forgotNewPassword.value !== forgotConfirmPassword.value) {
    errorMessage.value = 'Xác nhận mật khẩu mới không khớp.';
    toastStore.warning('Xác nhận mật khẩu mới không khớp.');
    return;
  }

  loading.value = true;
  try {
    const res = await api.resetPassword(phone, forgotOtp.value.trim(), forgotNewPassword.value);
    if (res.success) {
      toastStore.success('Đặt lại mật khẩu thành công! Vui lòng đăng nhập bằng mật khẩu mới.');
      currentTab.value = 'login';
      loginForm.value.phone = phone;
      loginForm.value.password = forgotNewPassword.value;
      
      // Reset form
      forgotSent.value = false;
      forgotOtp.value = '';
      forgotNewPassword.value = '';
      forgotConfirmPassword.value = '';
      if (forgotTimer) clearInterval(forgotTimer);
    } else {
      errorMessage.value = res.message;
      toastStore.error(res.message);
    }
  } catch (e) {
    errorMessage.value = 'Lỗi hệ thống khi đặt lại mật khẩu.';
    toastStore.error('Lỗi khi đặt lại mật khẩu.');
  } finally {
    loading.value = false;
  }
};

onUnmounted(() => {
  if (otpTimer) clearInterval(otpTimer);
  if (googleOtpTimer) clearInterval(googleOtpTimer);
  if (forgotTimer) clearInterval(forgotTimer);
});
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(15, 23, 42, 0.65);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  z-index: 99999;
  overflow-y: auto;
  box-sizing: border-box;
  animation: fadeIn 0.2s ease-out;
}

.auth-card {
  position: relative;
  width: 100%;
  max-width: 440px;
  background: #ffffff;
  padding: 28px 24px;
  border-radius: 20px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(226, 232, 240, 0.8);
  margin: auto;
  max-height: calc(100vh - 48px);
  overflow-y: auto;
}

.btn-close {
  position: absolute;
  top: 18px;
  right: 18px;
  background: transparent;
  border: none;
  font-size: 1.2rem;
  color: #94a3b8;
  cursor: pointer;
  padding: 4px;
  line-height: 1;
}

.btn-close:hover {
  color: #1e293b;
}

.auth-header {
  text-align: center;
  margin-bottom: 16px;
}

.auth-title {
  font-size: 1.4rem;
  font-weight: 800;
  color: #0f172a;
}

.auth-desc {
  font-size: 0.85rem;
  color: #64748b;
  margin-top: 4px;
}

.quick-demo-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  padding: 8px 12px;
  border-radius: 12px;
  font-size: 0.8rem;
  color: #475569;
  margin-bottom: 16px;
}

.btn-demo {
  background: var(--primary-color, #007d68);
  color: #ffffff;
  border: none;
  padding: 3px 10px;
  border-radius: 14px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
}

.tab-header {
  display: flex;
  background: #f1f5f9;
  border-radius: 24px;
  padding: 3px;
  margin-bottom: 20px;
}

.tab-btn {
  flex: 1;
  padding: 8px;
  border: none;
  background: transparent;
  font-size: 0.88rem;
  font-weight: 700;
  color: #64748b;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}

.tab-btn.active {
  background: #ffffff;
  color: var(--primary-color, #007d68);
  box-shadow: 0 2px 6px rgba(0, 125, 104, 0.15);
}

.auth-form {
  display: flex;
  flex-direction: column;
}

.alert-danger {
  background: #fef2f2;
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.2);
  padding: 8px 12px;
  border-radius: 10px;
  font-size: 0.82rem;
  margin-bottom: 14px;
}

.lockout-alert-box,
.login-warning-box {
  background: #fff1f2;
  border: 1.5px solid #fda4af;
  border-radius: 14px;
  padding: 14px 16px;
  margin-top: 14px;
  margin-bottom: 4px;
  box-shadow: 0 4px 12px rgba(225, 29, 72, 0.08);
  animation: pulseLock 0.3s ease;
  text-align: left;
}

@keyframes pulseLock {
  0% { transform: scale(0.98); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

.lockout-head {
  color: #e11d48;
  font-size: 0.95rem;
  margin-bottom: 6px;
}

.lockout-desc {
  font-size: 0.84rem;
  color: #4b5563;
  line-height: 1.45;
  margin: 0 0 10px 0;
}

.login-warning-text {
  font-size: 0.84rem;
  color: #374151;
  line-height: 1.45;
  margin: 0 0 10px 0;
}

.btn-lockout-recover {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #e11d48;
  color: #ffffff;
  border: none;
  border-radius: 20px;
  padding: 8px 16px;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 6px rgba(225, 29, 72, 0.25);
  font-family: inherit;
}

.btn-lockout-recover:hover {
  background: #be123c;
  transform: translateY(-1px);
}

.form-group {
  margin-bottom: 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #1e293b;
}

.label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.link-small {
  font-size: 0.78rem;
  color: var(--primary-color, #007d68);
  text-decoration: none;
  font-weight: 600;
}

.link-small:hover {
  color: var(--primary-mint, #00b99a);
}

.form-sub-row {
  display: flex;
  justify-content: flex-end;
  margin-top: -4px;
  margin-bottom: 14px;
}

.form-group-clean {
  margin-bottom: 12px;
}

.form-control {
  width: 100%;
  padding: 12px 14px;
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

.form-control::placeholder {
  color: #475569;
  font-size: 0.92rem;
  opacity: 0.85;
}

.form-control:focus {
  border-color: var(--primary-mint, #00b99a);
  box-shadow: 0 0 0 3px rgba(0, 185, 154, 0.18);
}

.input-rounded-lg {
  border: 1.5px solid #cbd5e1;
  border-radius: 12px;
  font-size: 0.95rem;
  padding: 12px 16px;
}

.input-rounded-lg::placeholder {
  color: #475569;
  font-weight: 400;
  opacity: 0.85;
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

.otp-input-box::placeholder {
  letter-spacing: normal;
  font-weight: 400;
  font-family: inherit;
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

.optional-tag {
  font-size: 0.78rem;
  font-weight: 400;
  color: #64748b;
  margin-left: 4px;
}

.otp-badge-sent {
  font-size: 0.75rem;
  color: #16a34a;
  background: #dcfce7;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 600;
}

.required-star {
  color: #ef4444;
  margin-left: 2px;
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

.btn-disabled {
  background: #94a3b8 !important;
  cursor: not-allowed !important;
  opacity: 0.7 !important;
  transform: none !important;
}

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
  transform: scale(1.05);
}

.btn-submit {
  width: 100%;
  padding: 12px;
  background: var(--primary-gradient, linear-gradient(135deg, #00b99a 0%, #007d68 100%));
  color: #ffffff;
  border: none;
  border-radius: 24px;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  margin-top: 8px;
  font-family: inherit;
  transition: all 0.2s;
  box-shadow: 0 4px 14px rgba(0, 125, 104, 0.25);
}

.btn-submit:hover:not(:disabled) {
  opacity: 0.95;
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(0, 125, 104, 0.35);
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.divider {
  display: flex;
  align-items: center;
  text-align: center;
  margin: 16px 0 12px;
  color: #94a3b8;
  font-size: 0.8rem;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid #e2e8f0;
}

.divider span {
  padding: 0 10px;
}

.btn-google {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px;
  background: transparent;
  border: 1.5px solid #e2e8f0;
  border-radius: 24px;
  font-size: 0.9rem;
  font-weight: 600;
  color: #0f172a;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
}

.btn-google:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.info-note {
  font-size: 0.78rem;
  color: #0369a1;
  background: #f0f9ff;
  padding: 8px 12px;
  border-radius: 10px;
  margin-bottom: 12px;
  line-height: 1.5;
}

.otp-header {
  text-align: center;
  margin-bottom: 14px;
}

.otp-header h3 {
  font-size: 1.2rem;
  font-weight: 700;
  color: #0f172a;
}

.otp-header p {
  font-size: 0.85rem;
  color: #64748b;
  margin-top: 4px;
}

.text-otp {
  text-align: center;
  font-size: 1.6rem;
  letter-spacing: 8px;
  font-weight: 800;
}

.timer-countdown {
  text-align: center;
  font-size: 0.82rem;
  color: #64748b;
  margin-bottom: 14px;
}

.btn-secondary-link {
  width: 100%;
  background: transparent;
  border: none;
  font-size: 0.85rem;
  color: #64748b;
  cursor: pointer;
  margin-top: 10px;
  font-family: inherit;
}

.btn-secondary-link:hover {
  color: #0f172a;
}

.spinner-small {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  display: inline-block;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes modalScaleIn {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(8px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* GOOGLE SSO POPUP MODAL */
.google-modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(15, 23, 42, 0.65);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 16px;
  animation: fadeIn 0.2s ease-out;
}

.google-modal-window {
  background: #ffffff;
  border-radius: 20px;
  width: 100%;
  max-width: 440px;
  box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.25);
  position: relative;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  animation: modalScaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

.google-modal-header {
  padding: 24px 24px 16px;
  text-align: center;
  border-bottom: 1px solid #f1f5f9;
  position: relative;
}

.google-close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  cursor: pointer;
  font-size: 0.95rem;
  transition: all 0.2s;
}

.google-close-btn:hover {
  background: #e2e8f0;
  color: #0f172a;
}

.google-modal-header .google-logo {
  margin-bottom: 10px;
}

.google-modal-header h3 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 4px;
}

.google-modal-header p {
  font-size: 0.88rem;
  color: #64748b;
  margin: 0;
}

.google-account-list {
  padding: 10px 16px;
  display: flex;
  flex-direction: column;
}

.google-account-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 14px;
  border-radius: 12px;
  cursor: pointer;
  transition: background-color 0.15s ease;
  border: 1px solid transparent;
}

.google-account-item:hover {
  background-color: #f1f5f9;
  border-color: #e2e8f0;
}

.google-acc-avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  object-fit: cover;
  border: 1.5px solid #e2e8f0;
  flex-shrink: 0;
}

.google-avatar-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f1f5f9;
  border: 1.5px solid #cbd5e1;
}

.google-acc-info {
  display: flex;
  flex-direction: column;
  flex: 1;
  text-align: left;
}

.google-acc-name {
  font-size: 0.92rem;
  font-weight: 600;
  color: #1e293b;
}

.google-acc-email {
  font-size: 0.82rem;
  color: #64748b;
}

.google-arrow {
  flex-shrink: 0;
}

.google-use-another {
  border-top: 1px solid #f1f5f9;
  margin-top: 6px;
  padding-top: 14px;
}

.google-custom-form {
  padding: 20px 24px;
  text-align: left;
}

.custom-note {
  font-size: 0.88rem;
  color: #475569;
  margin-bottom: 14px;
  font-weight: 500;
}

.google-custom-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 16px;
}

.btn-google-back {
  padding: 9px 18px;
  background: transparent;
  border: 1.5px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.88rem;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-google-back:hover {
  background: #f1f5f9;
}

.btn-google-next {
  padding: 9px 22px;
  background: #1a73e8;
  border: none;
  border-radius: 8px;
  font-size: 0.88rem;
  font-weight: 600;
  color: #ffffff;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-google-next:hover:not(:disabled) {
  background: #1557b0;
}

.btn-google-next:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.google-loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.94);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  z-index: 10;
}

.google-spinner {
  width: 38px;
  height: 38px;
  border: 3.5px solid #f1f5f9;
  border-top-color: #4285f4;
  border-right-color: #34a853;
  border-bottom-color: #fbbc05;
  border-left-color: #ea4335;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.google-loading-overlay p {
  font-size: 0.92rem;
  font-weight: 600;
  color: #1e293b;
}

.google-modal-footer {
  padding: 14px 24px 20px;
  background: #f8fafc;
  border-top: 1px solid #f1f5f9;
  text-align: center;
}

.google-modal-footer p {
  font-size: 0.76rem;
  color: #64748b;
  margin: 0 0 6px;
  line-height: 1.4;
}

.google-footer-links {
  font-size: 0.74rem;
  color: #1a73e8;
  display: flex;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
}

/* --- POPUP DIALOG MÀN NHỎ CHO GOOGLE SIGN-IN --- */
.google-dialog-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(15, 23, 42, 0.72);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  z-index: 1000005; /* Luôn nổi trên nền của AuthModal */
  animation: fadeIn 0.2s ease-out;
}

.google-dialog-card {
  position: relative;
  background: #ffffff;
  border-radius: 24px;
  width: 100%;
  max-width: 440px;
  padding: 32px 28px;
  box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(0, 0, 0, 0.05);
  animation: scaleUpGoogle 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes scaleUpGoogle {
  from {
    opacity: 0;
    transform: scale(0.92) translateY(12px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.google-dialog-close {
  position: absolute;
  top: 18px;
  right: 18px;
  background: transparent;
  border: none;
  color: #64748b;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.google-dialog-close:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.google-dialog-header {
  text-align: center;
  margin-bottom: 22px;
}

.google-icon-circle {
  width: 54px;
  height: 54px;
  border-radius: 50%;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.google-dialog-title {
  font-size: 1.35rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 6px;
}

.google-dialog-subtitle {
  font-size: 0.88rem;
  color: #64748b;
  line-height: 1.4;
}

.google-dialog-actions {
  display: flex;
  gap: 12px;
  margin-top: 22px;
}

.btn-google-cancel {
  flex: 1;
  padding: 12px;
  border-radius: 12px;
  background: #f1f5f9;
  color: #475569;
  border: none;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-google-cancel:hover {
  background: #e2e8f0;
  color: #0f172a;
}

.btn-google-submit {
  flex: 1.5;
  padding: 12px;
  border-radius: 12px;
  background: #1a73e8;
  color: #ffffff;
  border: none;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(26, 115, 232, 0.25);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn-google-submit:hover:not(:disabled) {
  background: #1557b0;
  box-shadow: 0 6px 16px rgba(26, 115, 232, 0.35);
}

.btn-google-submit:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  box-shadow: none;
}
</style>
