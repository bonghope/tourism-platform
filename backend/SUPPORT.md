# Hỗ trợ khách hàng

## Khởi tạo

Trong backend, dùng cấu hình MySQL hiện có rồi chạy:

```powershell
npm run migrate:support
npm start
```

Migration chỉ tạo hai bảng mới `Support_Conversations`, `Support_Messages`, không sửa dữ liệu hiện tại. Có thể chạy lại. Máy local hiện tại đã chạy migration thành công; chỉ cần khởi động lại backend để nạp route.

Khách hàng: `/support` hoặc **Liên hệ hỗ trợ** trong chi tiết hóa đơn. Admin: tab **Hỗ trợ khách hàng**. Cả hai frontend dùng `VITE_API_BASE_URL`; khi chạy local đặt `http://localhost:3000/api`.

## Luồng sử dụng

1. Khách đăng nhập, tạo yêu cầu, chọn chủ đề, tùy chọn một booking thuộc tài khoản, nhập tiêu đề và tin nhắn đầu tiên.
2. Admin mở tab hỗ trợ, chọn hội thoại để trả lời. Tin khách gửi hiển thị ở bên trái, tin Admin ở bên phải trong cổng quản trị (ngược lại trong cổng khách).
3. Tin mới tải mỗi 5 giây khi trang đang được mở. Badge ngoài hội thoại tải mỗi 15 giây. Các bộ đếm là số tin chưa đọc, không phải số hội thoại.
4. Admin đổi OPEN (Mới tiếp nhận), IN_PROGRESS (Đang xử lý), RESOLVED (Đã giải quyết). Trả lời tự chuyển IN_PROGRESS. Khách gửi tiếp sau RESOLVED tự mở lại OPEN.
5. Hủy/hoàn tiền vẫn thực hiện ở quản trị booking. Chat không tự hủy đơn hay chuyển tiền.

Danh sách tải 50 hội thoại mỗi trang; nút xem thêm tải tiếp. Hội thoại tải 50 tin mới nhất; nút xem tin trước tải lịch sử. Chỉ đánh dấu đã đọc những tin thực sự được trả về. Nội dung văn bản hiển thị bằng Vue interpolation, không render HTML.

## API

Tất cả endpoint yêu cầu JWT; quyền Admin lấy từ trạng thái người dùng hiện tại trong DB qua middleware hiện có.

| Phương thức | Endpoint | Chức năng |
|---|---|---|
| GET | /api/support | Danh sách của khách; Admin xem toàn bộ. `status`, `offset` tùy chọn |
| GET | /api/support/unread | Tổng tin chưa đọc |
| POST | /api/support | Tạo hội thoại và tin đầu; `subject`, `category`, `content`, `bookingId` tùy chọn |
| GET | /api/support/:id | Chi tiết, booking liên quan, 50 tin mới; `before=MessageID` tải tin cũ |
| POST | /api/support/:id/messages | Gửi tin: `messageId` UUID do client tạo, `content` |
| PATCH | /api/support/:id/status | Admin cập nhật `status` |

Giới hạn: tiêu đề 150 ký tự, tin nhắn 2.000 ký tự. Gửi lại cùng messageId/nội dung không tạo bản sao; cùng ID nhưng khác nội dung trả 409. User khác nhận 404 khi truy cập hội thoại không thuộc mình; chỉ Admin có thể đổi trạng thái.

## Kiểm thử

```powershell
npm test
# Kiểm thử tích hợp trên DB local đã có bộ dữ liệu bài tập U-001, U-002, U-003:
$env:RUN_SUPPORT_INTEGRATION='true'
node --test tests/support.integration.test.js
```

Test tích hợp dựng máy chủ tạm trên cổng ngẫu nhiên, kiểm tra xác thực, quyền sở hữu, gắn booking, trả lời, chưa đọc, đổi trạng thái, gửi lặp và phân trang. Chỉ tạo hội thoại phục vụ test và tự xóa hội thoại đó sau khi chạy. Không nhắn vào hội thoại khách hàng có sẵn.

Kiểm tra giao diện thủ công: mở khách và Admin ở hai trình duyệt/cửa sổ riêng; tạo yêu cầu từ hóa đơn, trả lời hai chiều, kiểm tra badge và đổi trạng thái. Khởi động lại backend sau khi cập nhật code.

Phiên bản này hỗ trợ văn bản, chưa có file đính kèm, email hoặc thông báo đẩy.
