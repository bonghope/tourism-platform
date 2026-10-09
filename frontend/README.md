# frontend

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build
```

## Thanh toán, lịch sử đặt tour và hóa đơn

- `/bookings`: tìm kiếm, lọc và xem lịch sử đặt tour.
- `/payment/:bookingId`: phương thức thanh toán, đếm ngược giữ chỗ và kiểm tra trạng thái.
- `/bookings/:bookingId`: chi tiết hóa đơn, in và hủy đơn theo chính sách backend.
- Sau khi giữ chỗ thành công, trang đặt tour chuyển đến trang thanh toán.

Có thể sao chép `.env.example` thành `.env.local` và cấu hình `VITE_API_BASE_URL`.
`VITE_BOOKING_USER_ID` tạm mặc định `U14`, đồng nhất với luồng đặt tour cũ; thay bằng người dùng từ module đăng nhập khi module đó hoàn tất.
Để thử webhook giả lập hiện có ở môi trường local, đặt `VITE_ENABLE_DEMO_PAYMENT=true` và khởi động lại Vite. Nút thanh toán thử không thu tiền thật. Khi chạy Vite ở chế độ dev và chưa cấu hình biến này, thanh toán thử được bật mặc định. Production chỉ bật khi cấu hình rõ `true`; đặt `false` để tắt trong dev.
Backend hiện chưa tạo URL thanh toán thật hoặc xác minh chữ ký từ VNPAY/MoMo; cần tích hợp nhà cung cấp trước khi triển khai thanh toán thực tế.

Ngày tạo đơn và hạn giữ chỗ được lưu theo UTC trong MySQL hiện tại. API booking xuất hai trường này thành ISO 8601 có hậu tố Z; các màn hình booking hiển thị theo Asia/Ho_Chi_Minh (UTC+7). Khởi động lại backend sau khi cập nhật để áp dụng cách xuất thời gian.

Booking và review hiện yêu cầu JWT đăng nhập, mỗi tài khoản chỉ truy cập đơn của mình. Lịch sử nằm trong menu user. Để thử thanh toán local: backend đặt ENABLE_DEMO_PAYMENT=true (không dùng NODE_ENV=production), frontend đặt VITE_ENABLE_DEMO_PAYMENT=true. Webhook thử yêu cầu JWT và quyền sở hữu đơn; production chặn webhook giả lập. Cổng thanh toán thật chưa tích hợp.
