// API Service kết nối Backend cổng 3000 cho Khách hàng (Module 1)
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api').replace(/\/$/, '');

class ApiService {
  constructor() {
    this.token = localStorage.getItem('user_access_token') || null;
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('user_access_token', token);
    } else {
      localStorage.removeItem('user_access_token');
    }
  }

  getToken() {
    return localStorage.getItem('user_access_token');
  }

  getAuthHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  // 1. Đăng ký tài khoản (Bước 1: gửi thông tin nhận OTP 5 phút)
  async register(phoneOrObj, email = '', fullName = '', password = '') {
    let payload;
    if (typeof phoneOrObj === 'object' && phoneOrObj !== null) {
      payload = phoneOrObj;
    } else {
      payload = { phone: phoneOrObj, email, fullName, password };
    }
    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return await res.json();
    } catch (e) {
      return { success: false, message: 'Không thể kết nối máy chủ hoặc dữ liệu phản hồi không hợp lệ. Vui lòng thử lại.' };
    }
  }

  // Bước 2: Xác thực mã OTP để kích hoạt tài khoản
  async verifyRegisterOtp(phoneOrObj, otp, password = '', fullName = '', email = '') {
    let payload;
    if (typeof phoneOrObj === 'object' && phoneOrObj !== null) {
      payload = phoneOrObj;
    } else {
      payload = { phone: phoneOrObj, otp, password, fullName, email };
    }
    try {
      const res = await fetch(`${API_BASE_URL}/auth/verify-register-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return await res.json();
    } catch (e) {
      return { success: false, message: 'Không thể kết nối máy chủ hoặc dữ liệu phản hồi không hợp lệ. Vui lòng thử lại.' };
    }
  }

  // 2. Đăng nhập truyền thống (Ưu tiên Số điện thoại hoặc Email, Anti Brute-force 5 lần sai khóa 15p)
  async login(account, password) {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          account, 
          email: account, 
          phone: account, 
          password 
        })
      });
      const data = await res.json();
      if (data.success && data.accessToken) {
        this.setToken(data.accessToken);
      }
      return data;
    } catch (e) {
      return { success: false, message: 'Không thể kết nối máy chủ hoặc dữ liệu phản hồi không hợp lệ. Vui lòng thử lại.' };
    }
  }

  // 3a. Gửi OTP đến Gmail cho Đăng nhập Google
  async requestGoogleOtp(email) {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/google-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      return await res.json();
    } catch (e) {
      return { success: false, message: 'Không thể kết nối máy chủ hoặc dữ liệu phản hồi không hợp lệ. Vui lòng thử lại.' };
    }
  }

  // 3b. Đăng nhập Google (Tài khoản Gmail + Mật khẩu + OTP)
  async googleLogin(payload) {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/google-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success && data.accessToken) {
        this.setToken(data.accessToken);
      }
      return data;
    } catch (e) {
      return { success: false, message: 'Không thể kết nối máy chủ hoặc dữ liệu phản hồi không hợp lệ. Vui lòng thử lại.' };
    }
  }

  // 4. Quên mật khẩu & Đặt lại mật khẩu (Số điện thoại là phương thức chính nhận OTP)
  async forgotPassword(phoneOrAccount) {
    const accountStr = (typeof phoneOrAccount === 'object' && phoneOrAccount !== null)
      ? (phoneOrAccount.phone || phoneOrAccount.account || phoneOrAccount.email || '')
      : (phoneOrAccount || '');
    
    const payload = {
      phone: accountStr,
      account: accountStr,
      email: accountStr
    };

    try {
      const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return await res.json();
    } catch (e) {
      return { success: false, message: 'Không thể kết nối máy chủ hoặc dữ liệu phản hồi không hợp lệ. Vui lòng thử lại.' };
    }
  }

  async resetPassword(phoneOrAccount, otp, newPassword) {
    let payload;
    if (typeof phoneOrAccount === 'object' && phoneOrAccount !== null) {
      payload = phoneOrAccount;
    } else {
      payload = {
        phone: phoneOrAccount,
        account: phoneOrAccount,
        email: phoneOrAccount,
        otp,
        newPassword
      };
    }

    try {
      const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return await res.json();
    } catch (e) {
      return { success: false, message: 'Không thể kết nối máy chủ hoặc dữ liệu phản hồi không hợp lệ. Vui lòng thử lại.' };
    }
  }

  // 5. Hồ sơ cá nhân (Profile)
  async getProfile() {
    try {
      const res = await fetch(`${API_BASE_URL}/user/profile`, {
        headers: this.getAuthHeaders()
      });
      return await res.json();
    } catch (e) {
      return { success: false, message: 'Không thể kết nối máy chủ hoặc dữ liệu phản hồi không hợp lệ. Vui lòng thử lại.' };
    }
  }

  async updateProfile(data) {
    try {
      const res = await fetch(`${API_BASE_URL}/user/profile`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data)
      });
      return await res.json();
    } catch (e) {
      return { success: false, message: 'Không thể kết nối máy chủ hoặc dữ liệu phản hồi không hợp lệ. Vui lòng thử lại.' };
    }
  }

  // Yêu cầu OTP xác thực Email riêng trong Hồ sơ cá nhân
  async requestEmailOtp(email) {
    try {
      const res = await fetch(`${API_BASE_URL}/user/request-email-otp`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ email })
      });
      return await res.json();
    } catch (e) {
      return { success: false, message: 'Không thể kết nối máy chủ hoặc dữ liệu phản hồi không hợp lệ. Vui lòng thử lại.' };
    }
  }

  // Xác thực mã OTP và liên kết Email vào tài khoản
  async verifyEmailOtp(otp) {
    try {
      const res = await fetch(`${API_BASE_URL}/user/verify-email-otp`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ otp })
      });
      return await res.json();
    } catch (e) {
      return { success: false, message: 'Không thể kết nối máy chủ hoặc dữ liệu phản hồi không hợp lệ. Vui lòng thử lại.' };
    }
  }

  // 6. Đổi mật khẩu
  async changePassword(oldPassword, newPassword) {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ oldPassword, newPassword })
      });
      return await res.json();
    } catch (e) {
      return { success: false, message: 'Không thể kết nối máy chủ hoặc dữ liệu phản hồi không hợp lệ. Vui lòng thử lại.' };
    }
  }

  // 7. Đăng xuất
  async logout() {
    try {
      await fetch(`${API_BASE_URL}/user/logout`, {
        method: 'POST',
        headers: this.getAuthHeaders()
      });
    } catch (e) {
      // Ignored
    } finally {
      this.setToken(null);
    }
    return { success: true, message: 'Đăng xuất thành công.' };
  }
}

export const api = new ApiService();
export default api;
