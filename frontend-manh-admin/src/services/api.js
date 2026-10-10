// API Service chuyên trách cho Quản trị viên (Module 6)
const API_BASE_URL = 'http://localhost:3000/api';

const mockDb = {
  users: [
    { UserID: 'u-101', FullName: 'Nguyễn Văn Mạnh', Email: 'manh@tavivu.vn', Phone: '0912345678', Role: 'ADMIN', Status: 'ACTIVE', CreatedAt: '2026-01-10T08:00:00Z', AvatarURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150' },
    { UserID: 'u-102', FullName: 'Trần Thị Mai', Email: 'mai.tran@gmail.com', Phone: '0988776655', Role: 'USER', Status: 'ACTIVE', CreatedAt: '2026-02-15T09:30:00Z', AvatarURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150' },
    { UserID: 'u-103', FullName: 'Lê Hoàng Nam', Email: 'nam.le@gmail.com', Phone: '0901234888', Role: 'USER', Status: 'LOCKED', CreatedAt: '2026-03-01T14:20:00Z', AvatarURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150' },
    { UserID: 'u-104', FullName: 'Phạm Thu Trang', Email: 'trang.pham@yahoo.com', Phone: '0933445566', Role: 'USER', Status: 'BANNED', CreatedAt: '2026-03-12T11:15:00Z', AvatarURL: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150' }
  ],
  destinations: [
    { DestinationID: 'd-1', Name: 'Vịnh Hạ Long', Slug: 'vinh-ha-long', Description: 'Kỳ quan thiên nhiên thế giới với hàng nghìn hòn đảo đá vôi kỳ vĩ.', Keywords: 'ha-long, quang-ninh, di-san', ImageURL: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=800', Status: 'PUBLISHED' },
    { DestinationID: 'd-2', Name: 'Phố Cổ Hội An', Slug: 'pho-co-hoi-an', Description: 'Di sản văn hóa thế giới với vẻ đẹp rực rỡ sắc màu đèn lồng ven sông Hoài.', Keywords: 'hoi-an, quang-nam, pho-co', ImageURL: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=800', Status: 'PUBLISHED' },
    { DestinationID: 'd-3', Name: 'Đảo Ngọc Phú Quốc', Slug: 'dao-ngoc-phu-quoc', Description: 'Thiên đường nghỉ dưỡng biển đảo với những bờ cát trắng và nước biển trong xanh.', Keywords: 'phu-quoc, kien-giang, bien-dao', ImageURL: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800', Status: 'HIDDEN' }
  ],
  tours: [
    {
      TourID: 't-1',
      Title: 'Du thuyền 5 sao ngắm hoàng hôn Vịnh Hạ Long',
      Slug: 'du-thuyen-5-sao-vinh-ha-long',
      Price: 2280000,
      OriginalPrice: 2850000,
      DiscountPercent: 20,
      StartDate: '2026-11-15',
      Duration: '2 Ngày 1 Đêm',
      MaxSlots: 30,
      AvailableSlots: 18,
      AverageRating: 4.9,
      Status: 'PUBLISHED',
      DestinationID: 'd-1',
      Itinerary: JSON.stringify([
        { day: 1, title: 'Check-in bến Tuần Châu & Tiệc trà hoàng hôn', detail: 'Đón khách tại cảng Tuần Châu, làm thủ tục nhận phòng du thuyền và thưởng thức tiệc hải sản.' },
        { day: 2, title: 'Chèo thuyền Kayak Hang Luồn & Trở về Hà Nội', detail: 'Tập thái cực quyền đón bình minh và chèo kayak khám phá vẻ đẹp tự nhiên.' }
      ])
    },
    {
      TourID: 't-2',
      Title: 'Khám phá văn hóa & ẩm thực Phố Cổ Hội An',
      Slug: 'kham-pha-pho-co-hoi-an',
      Price: 1755000,
      OriginalPrice: 1950000,
      DiscountPercent: 10,
      StartDate: '2026-11-20',
      Duration: '3 Ngày 2 Đêm',
      MaxSlots: 25,
      AvailableSlots: 10,
      AverageRating: 4.8,
      Status: 'PUBLISHED',
      DestinationID: 'd-2',
      Itinerary: JSON.stringify([
        { day: 1, title: 'Dạo bộ phố cổ & Thả đèn hoa đăng sông Hoài', detail: 'Khám phá Chùa Cầu, hội quán Phúc Kiến và trải nghiệm ẩm thực bản địa.' },
        { day: 2, title: 'Làng gốm Thanh Hà & Rừng dừa Bảy Mẫu', detail: 'Đi thuyền thúng trải nghiệm cảm giác mạo hiểm và học làm gốm thủ công.' }
      ])
    },
    {
      TourID: 't-3',
      Title: 'Lặn ngắm san hô & Hoàng hôn Sunset Sanato Phú Quốc',
      Slug: 'lan-ngam-san-ho-phu-quoc',
      Price: 3490000,
      OriginalPrice: 3490000,
      DiscountPercent: 0,
      StartDate: '2026-12-05',
      Duration: '4 Ngày 3 Đêm',
      MaxSlots: 20,
      AvailableSlots: 20,
      AverageRating: 5.0,
      Status: 'DRAFT',
      DestinationID: 'd-3',
      Itinerary: JSON.stringify([
        { day: 1, title: 'Đón sân bay Phú Quốc & Check-in resort', detail: 'Nghỉ ngơi và dạo chơi chợ đêm Grand World.' }
      ])
    }
  ],
  bookings: [
    {
      BookingID: 'BK-1001',
      CreatedAt: '2026-10-05T14:30:00Z',
      PassengerCount: 2,
      TotalPrice: 5700000,
      Status: 'PAID',
      PaymentMethod: 'VNPAY',
      ContactName: 'Trần Thị Mai',
      ContactPhone: '0988776655',
      CustomerName: 'Trần Thị Mai',
      Email: 'mai.tran@gmail.com',
      TourID: 't-1',
      TourTitle: 'Du thuyền 5 sao ngắm hoàng hôn Vịnh Hạ Long',
      StartDate: '2026-11-15'
    },
    {
      BookingID: 'BK-1002',
      CreatedAt: '2026-10-06T09:15:00Z',
      PassengerCount: 4,
      TotalPrice: 7800000,
      Status: 'PENDING',
      PaymentMethod: 'MOMO',
      ContactName: 'Lê Hoàng Nam',
      ContactPhone: '0901234888',
      CustomerName: 'Lê Hoàng Nam',
      Email: 'nam.le@gmail.com',
      TourID: 't-2',
      TourTitle: 'Khám phá văn hóa & ẩm thực Phố Cổ Hội An',
      StartDate: '2026-11-20'
    },
    {
      BookingID: 'BK-1003',
      CreatedAt: '2026-10-04T16:00:00Z',
      PassengerCount: 1,
      TotalPrice: 2850000,
      Status: 'REFUNDING',
      PaymentMethod: 'BANK_TRANSFER',
      ContactName: 'Phạm Thu Trang',
      ContactPhone: '0933445566',
      CustomerName: 'Phạm Thu Trang',
      Email: 'trang.pham@yahoo.com',
      TourID: 't-1',
      TourTitle: 'Du thuyền 5 sao ngắm hoàng hôn Vịnh Hạ Long',
      StartDate: '2026-11-15'
    }
  ],
  reviews: [
    {
      ReviewID: 'RV-501',
      TourID: 't-1',
      TourTitle: 'Du thuyền 5 sao ngắm hoàng hôn Vịnh Hạ Long',
      UserID: 'u-102',
      ReviewerName: 'Trần Thị Mai',
      AvatarURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      Rating: 5,
      Content: 'Chuyến đi tuyệt vời! Đồ ăn trên du thuyền tươi ngon, phòng ngủ sạch sẽ, hướng dẫn viên rất chu đáo.',
      OwnerReply: 'Cảm ơn bạn Mai đã đồng hành cùng TaVivu! Rất mong được đón tiếp bạn trong những chuyến đi tiếp theo.',
      Status: 'PUBLISHED',
      CreatedAt: '2026-09-28T10:00:00Z'
    },
    {
      ReviewID: 'RV-502',
      TourID: 't-2',
      TourTitle: 'Khám phá văn hóa & ẩm thực Phố Cổ Hội An',
      UserID: 'u-104',
      ReviewerName: 'Phạm Thu Trang',
      AvatarURL: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
      Rating: 1,
      Content: 'Quảng cáo cờ bạc trái phép, spam link xấu...',
      OwnerReply: null,
      Status: 'HIDDEN',
      CreatedAt: '2026-10-02T15:20:00Z'
    }
  ]
};

class AdminApiService {
  constructor() {
    this.token = localStorage.getItem('admin_token') || null;
    this.currentAdmin = null;
    try {
      this.currentAdmin = JSON.parse(localStorage.getItem('admin_profile')) || null;
    } catch (e) {}
  }

  isTokenValid(token) {
    if (!token || token === 'admin-jwt-token') return false;
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return false;
      const payload = JSON.parse(atob(parts[1]));
      if (payload.exp && payload.exp * 1000 <= Date.now() + 60000) {
        return false; // Expired or expiring within 1 minute
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  isAuthenticated() {
    return !!this.token && this.isTokenValid(this.token);
  }

  async login(account, password) {
    const rawAccount = (account || '').trim();
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        account: rawAccount,
        phone: rawAccount,
        password: password
      })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      const err = new Error(data.message || 'Đăng nhập không thành công');
      err.isLocked = data.isLocked || false;
      err.remainingMinutes = data.remainingMinutes || 0;
      err.remainingAttempts = data.remainingAttempts;
      throw err;
    }

    const role = (data.user?.role || data.user?.Role || '').toUpperCase();
    if (role !== 'ADMIN') {
      throw new Error(`Tài khoản (${data.user?.phone || data.user?.email}) không có quyền Quản trị viên (Role: ${role || 'USER'}). Cổng này chỉ dành riêng cho Admin.`);
    }

    this.token = data.accessToken;
    this.currentAdmin = {
      userId: data.user.userId || data.user.UserID,
      UserID: data.user.userId || data.user.UserID,
      fullName: data.user.fullName || data.user.FullName,
      FullName: data.user.fullName || data.user.FullName,
      email: data.user.email || data.user.Email,
      Email: data.user.email || data.user.Email,
      phone: data.user.phone || data.user.Phone,
      Phone: data.user.phone || data.user.Phone,
      role: 'ADMIN',
      Role: 'ADMIN',
      avatarUrl: data.user.avatarUrl || data.user.AvatarURL,
      AvatarURL: data.user.avatarUrl || data.user.AvatarURL
    };

    localStorage.setItem('admin_token', this.token);
    localStorage.setItem('admin_profile', JSON.stringify(this.currentAdmin));
    return this.currentAdmin;
  }

  logout() {
    this.token = null;
    this.currentAdmin = null;
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_profile');
  }

  async ensureToken(forceRefresh = false) {
    if (!forceRefresh && this.isTokenValid(this.token)) {
      return this.token;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/auth/admin-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: this.currentAdmin?.userId || undefined })
      });
      const data = await res.json();
      if (data.success && data.accessToken) {
        this.token = data.accessToken;
        this.currentAdmin = data.admin;
        localStorage.setItem('admin_token', data.accessToken);
        localStorage.setItem('admin_profile', JSON.stringify(data.admin));
        return this.token;
      }
    } catch (e) {
      console.warn('Auto fetch admin token error:', e);
    }
    return this.token;
  }

  async getAuthHeaders() {
    await this.ensureToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`
    };
  }

  async authFetch(url, options = {}) {
    let headers = await this.getAuthHeaders();
    let finalOptions = {
      ...options,
      headers: { ...headers, ...(options.headers || {}) }
    };
    let res = await fetch(url, finalOptions);

    // Nếu gặp 401 hoặc 403 (Token hết hạn hoặc không khớp), tự động xin Token mới và thử lại 1 lần
    if (res.status === 401 || res.status === 403) {
      console.warn('Admin token rejected, refreshing token and retrying...');
      await this.ensureToken(true);
      headers = await this.getAuthHeaders();
      finalOptions = {
        ...options,
        headers: { ...headers, ...(options.headers || {}) }
      };
      res = await fetch(url, finalOptions);
    }
    return res;
  }

  getCurrentAdmin() {
    return this.currentAdmin;
  }

  async getAdmins() {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/admin-list`);
      const data = await res.json();
      if (data.success && data.data && data.data.length > 0) return data.data;
    } catch (e) {}
    return [
      { UserID: 'U02', FullName: 'Nguyễn Văn Mạnh', Role: 'ADMIN', Email: 'manh.nguyen@webdulich.com' },
      { UserID: 'U03', FullName: 'Trần Thị Linh', Role: 'ADMIN', Email: 'linh.tran@webdulich.com' },
      { UserID: 'U01', FullName: 'Vũ Đức Tài', Role: 'ADMIN', Email: 'tai.vu@webdulich.com' },
      { UserID: '13001729-7520-460a-9b3c-1ac53d851f49', FullName: 'Mạnh Đã Cập Nhật Tên', Role: 'ADMIN', Email: 'manh.test1@gmail.com' }
    ];
  }

  async switchAdmin(userId) {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/admin-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      const data = await res.json();
      if (data.success && data.accessToken) {
        this.token = data.accessToken;
        this.currentAdmin = data.admin;
        localStorage.setItem('admin_token', data.accessToken);
        localStorage.setItem('admin_profile', JSON.stringify(data.admin));
        return data.admin;
      }
    } catch (e) {
      console.error('Lỗi khi chuyển đổi admin:', e);
    }
    return null;
  }

  async checkBackend() {
    try {
      const res = await fetch('http://localhost:3000/', { signal: AbortSignal.timeout(1200) });
      return res.ok;
    } catch (e) {
      return false;
    }
  }

  // 1. Quản lý Người dùng
  async getUsers(keyword = '') {
    try {
      const url = keyword ? `${API_BASE_URL}/admin/users?keyword=${encodeURIComponent(keyword)}` : `${API_BASE_URL}/admin/users`;
      const res = await this.authFetch(url);
      const data = await res.json();
      if (data.success) return data;
      throw new Error(data.message);
    } catch (e) {
      let filtered = mockDb.users;
      if (keyword) {
        const k = keyword.toLowerCase();
        filtered = filtered.filter(u => u.Email.toLowerCase().includes(k) || u.FullName.toLowerCase().includes(k) || (u.Phone && u.Phone.includes(k)));
      }
      return { success: true, data: filtered };
    }
  }

  async banUser(userId) {
    try {
      const res = await this.authFetch(`${API_BASE_URL}/admin/users/${userId}/ban`, {
        method: 'PUT'
      });
      const data = await res.json();
      if (data.success) return data;
      throw new Error(data.message);
    } catch (e) {
      const u = mockDb.users.find(x => x.UserID === userId);
      if (u) u.Status = 'BANNED';
      return { success: true, message: 'Đã khóa tài khoản thành công.' };
    }
  }

  async unbanUser(userId) {
    try {
      const res = await this.authFetch(`${API_BASE_URL}/admin/users/${userId}/unban`, {
        method: 'PUT'
      });
      const data = await res.json();
      if (data.success) return data;
      throw new Error(data.message);
    } catch (e) {
      const u = mockDb.users.find(x => x.UserID === userId);
      if (u) u.Status = 'ACTIVE';
      return { success: true, message: 'Đã mở khóa tài khoản thành công.' };
    }
  }

  async updateUserRole(userId, role) {
    try {
      const res = await this.authFetch(`${API_BASE_URL}/admin/users/${userId}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role })
      });
      const data = await res.json();
      if (data.success) return data;
      throw new Error(data.message);
    } catch (e) {
      const u = mockDb.users.find(x => x.UserID === userId);
      if (u) u.Role = role;
      return { success: true, message: `Đã đổi vai trò thành ${role} thành công.` };
    }
  }

  // 2. Quản lý Điểm đến
  async getDestinations() {
    try {
      const res = await this.authFetch(`${API_BASE_URL}/admin/destinations`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) return data;
      throw new Error(data.message || 'Error fetching destinations');
    } catch (e) {
      try {
        const res2 = await fetch(`${API_BASE_URL}/destinations`);
        const data2 = await res2.json();
        if (data2.success && Array.isArray(data2.data)) return data2;
      } catch (err) {}
      return { success: true, data: mockDb.destinations };
    }
  }

  async createDestination(data) {
    try {
      const res = await this.authFetch(`${API_BASE_URL}/admin/destinations`, {
        method: 'POST',
        body: JSON.stringify(data)
      });
      const resData = await res.json();
      if (resData.success) return resData;
      throw new Error(resData.message);
    } catch (e) {
      const item = {
        DestinationID: 'd-' + Date.now(),
        Name: data.name,
        Slug: data.slug || data.name.toLowerCase().replace(/\s+/g, '-'),
        Description: data.description,
        Keywords: data.keywords,
        ImageURL: data.imageUrl || 'https://images.unsplash.com/photo-1528127269322-539801943592?w=800',
        Status: 'PUBLISHED'
      };
      mockDb.destinations.unshift(item);
      return { success: true, message: 'Tạo địa danh thành công.', destinationId: item.DestinationID };
    }
  }

  async updateDestination(destinationId, data) {
    try {
      const res = await this.authFetch(`${API_BASE_URL}/admin/destinations/${destinationId}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
      const resData = await res.json();
      if (resData.success) return resData;
      throw new Error(resData.message);
    } catch (e) {
      const d = mockDb.destinations.find(x => x.DestinationID === destinationId);
      if (d) Object.assign(d, data);
      return { success: true, message: 'Cập nhật địa danh thành công.' };
    }
  }

  async toggleDestinationStatus(destinationId, status) {
    try {
      const res = await this.authFetch(`${API_BASE_URL}/admin/destinations/${destinationId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      const resData = await res.json();
      if (resData.success) return resData;
      throw new Error(resData.message);
    } catch (e) {
      const d = mockDb.destinations.find(x => x.DestinationID === destinationId);
      if (d) d.Status = status;
      return { success: true, message: `Đã đổi trạng thái sang ${status}.` };
    }
  }

  // 3. Quản lý Tour
  async getTours() {
    try {
      const res = await this.authFetch(`${API_BASE_URL}/admin/tours`);
      const data = await res.json();
      if (data.success) return data;
      throw new Error();
    } catch (e) {
      throw e;
    }
  }

  async createTour(data) {
    try {
      const res = await this.authFetch(`${API_BASE_URL}/admin/tours`, {
        method: 'POST',
        body: JSON.stringify(data)
      });
      const resData = await res.json();
      if (resData.success) return resData;
      throw new Error(resData.message);
    } catch (e) {
      throw e;
    }
  }

  async updateTour(tourId, data) {
    try {
      const res = await this.authFetch(`${API_BASE_URL}/admin/tours/${tourId}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
      const resData = await res.json();
      if (resData.success) return resData;
      throw new Error(resData.message);
    } catch (e) {
      throw e;
    }
  }

  async updateTourStatus(tourId, status) {
    try {
      const res = await this.authFetch(`${API_BASE_URL}/admin/tours/${tourId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      const resData = await res.json();
      if (resData.success) return resData;
      throw new Error(resData.message);
    } catch (e) {
      throw e;
    }
  }

  async softDeleteTour(tourId) {
    try {
      const res = await this.authFetch(`${API_BASE_URL}/admin/tours/${tourId}/delete`, {
        method: 'PATCH'
      });
      const resData = await res.json();
      if (resData.success) return resData;
      throw new Error(resData.message);
    } catch (e) {
      const t = mockDb.tours.find(x => x.TourID === tourId);
      if (t) t.Status = 'DELETED';
      return { success: true, message: 'Đã xóa mềm Tour thành công.' };
    }
  }

  // 4. Quản lý Đơn đặt tour (Bookings)
  async getBookings(status = '') {
    try {
      const url = status ? `${API_BASE_URL}/admin/bookings?status=${encodeURIComponent(status)}` : `${API_BASE_URL}/admin/bookings`;
      const res = await this.authFetch(url);
      const data = await res.json();
      if (data.success) return data;
      throw new Error(data.message);
    } catch (e) {
      let filtered = mockDb.bookings;
      if (status) {
        filtered = filtered.filter(b => b.Status.toUpperCase() === status.toUpperCase());
      }
      return { success: true, total: filtered.length, data: filtered };
    }
  }

  async forceCancelBooking(bookingId) {
    try {
      const res = await this.authFetch(`${API_BASE_URL}/admin/bookings/${bookingId}/force-cancel`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) return data;
      throw new Error(data.message);
    } catch (e) {
      const b = mockDb.bookings.find(x => x.BookingID === bookingId);
      if (b) {
        b.Status = 'REFUNDING';
        const t = mockDb.tours.find(x => x.TourID === b.TourID);
        if (t) t.AvailableSlots += b.PassengerCount;
      }
      return { success: true, message: 'Đã hủy đơn và hoàn trả chỗ trống thành công.' };
    }
  }

  // 5. Kiểm duyệt Đánh giá (Reviews)
  async getReviews(status = '') {
    try {
      const url = status ? `${API_BASE_URL}/admin/reviews?status=${encodeURIComponent(status)}` : `${API_BASE_URL}/admin/reviews`;
      const res = await this.authFetch(url);
      const data = await res.json();
      if (data.success) return data;
      throw new Error(data.message);
    } catch (e) {
      let filtered = mockDb.reviews;
      if (status) filtered = filtered.filter(r => r.Status.toUpperCase() === status.toUpperCase());
      return { success: true, total: filtered.length, data: filtered };
    }
  }

  async hideReview(reviewId) {
    try {
      const res = await this.authFetch(`${API_BASE_URL}/admin/reviews/${reviewId}/hide`, {
        method: 'PATCH'
      });
      const data = await res.json();
      if (data.success) return data;
      throw new Error(data.message);
    } catch (e) {
      const r = mockDb.reviews.find(x => x.ReviewID === reviewId);
      if (r) r.Status = 'HIDDEN';
      return { success: true, message: 'Đã ẩn đánh giá vi phạm.' };
    }
  }

  async replyReview(reviewId, replyContent) {
    try {
      const res = await this.authFetch(`${API_BASE_URL}/admin/reviews/${reviewId}/reply`, {
        method: 'PUT',
        body: JSON.stringify({ replyContent })
      });
      const data = await res.json();
      if (data.success) return data;
      throw new Error(data.message);
    } catch (e) {
      const r = mockDb.reviews.find(x => x.ReviewID === reviewId);
      if (r) r.OwnerReply = replyContent;
      return { success: true, message: 'Đã lưu phản hồi của Quản trị viên.' };
    }
  }
}

export const adminApi = new AdminApiService();
export default adminApi;
