# Tour và lịch khởi hành

`Tours` giữ thông tin chung: ID, tên, slug, giá, thời lượng, hành trình, trạng thái và thống kê đánh giá.

`TourDepartures` lưu từng đợt: DepartureID, TourID, StartDate, EndDate, MaxSlots, AvailableSlots, Status. Một tour có nhiều lịch; mỗi booking lưu DepartureID và TourID. Ngày được lưu UTC, admin nhập giờ Việt Nam.

Trong admin: Quản lý tour → Lịch khởi hành → nhập ngày bắt đầu, kết thúc và sức chứa → Thêm lịch khởi hành. Khách chọn lịch khi xem/đặt tour. Tour cần được xuất bản và lịch cần mở bán, chưa khởi hành, còn chỗ để đặt.

Lịch đã có booking không được sửa ngày. Có thể đóng bán hoặc điều chỉnh sức chứa, nhưng không giảm dưới số chỗ đã giữ/bán. Tạo lịch mới không thay đổi booking cũ. Worker hoàn tất booking theo EndDate của lịch đã đặt; đánh giá yêu cầu COMPLETED và trong 30 ngày kể từ EndDate đó.

## Áp dụng trên database khác

Dừng backend trước khi chuyển schema. Từ thư mục backend chạy:

```powershell
npm run migrate
npm run migrate:departures
npm start
```

Migration departure sao lưu Tours/Bookings vào `backend/backups/` trước khi sửa schema (không đưa lên Git), chuyển lịch hiện tại và nối booking cũ với lịch đó, rồi bỏ các cột ngày/sức chứa khỏi Tours. DDL MySQL không nằm trong một transaction chung; giữ snapshot để phục hồi nếu migration bị gián đoạn. Chạy lại sau khi hoàn tất sẽ bỏ qua migration.

Ngày cũ được hiểu theo giờ Việt Nam. Lịch cũ thiếu ngày kết thúc hoặc ngày kết thúc không hợp lệ sẽ đóng bán, cần kiểm tra dữ liệu trước khi mở lại. Những ngày đã bị ghi đè trước migration không thể khôi phục từ bảng Tours hiện tại.
