# Tài liệu Quy chuẩn Làm việc Nhóm (Team Guidelines)

## 1. Quy chuẩn Quản lý Mã nguồn (GitHub Workflow)
Hệ thống áp dụng mô hình Feature Branching. Tuyệt đối không được phép đẩy (push) code trực tiếp lên nhánh `main`. Nhánh `main` chỉ chứa code đã hoàn thiện và chạy ổn định.

**Quy tắc đặt tên Nhánh (Branch Name):**
Sử dụng chữ thường, dấu gạch ngang và bắt đầu bằng tiền tố phân loại:
- **Tính năng mới:** `feature/ten-tinh-nang` (Ví dụ: `feature/jwt-authentication`, `feature/booking-lock`)
- **Sửa lỗi:** `bugfix/ten-loi` (Ví dụ: `bugfix/login-crash`, `bugfix/tour-price-display`)
- **Cập nhật tài liệu/cấu hình:** `chore/ten-cong-viec` (Ví dụ: `chore/setup-database`, `chore/update-readme`)

**Quy tắc ghi chú Commit (Commit Message)**
Commit message phải ngắn gọn, rõ ràng và cho biết loại thay đổi + vị trí thay đổi + nội dung chính.

**Cấu trúc chuẩn:**
`<type>(<scope>): <mô tả ngắn>`

Trong đó:
- `type`: Loại thay đổi.
- `scope`: Vị trí hoặc module bị thay đổi, ví dụ `frontend`, `backend`, `database`, `auth`, `booking`, `tour`, `root`.
- `mô tả`: Mô tả ngắn gọn nội dung đã thực hiện.
*(Ưu tiên viết mô tả bằng tiếng Anh để thống nhất trong Git history; nếu nhóm thống nhất dùng tiếng Việt thì phải sử dụng nhất quán).*

**Các loại Commit**

| Type | Ý nghĩa | Khi sử dụng |
|---|---|---|
| `feat` | Thêm tính năng | Khi thêm chức năng mới |
| `fix` | Sửa lỗi | Khi sửa bug |
| `refactor` | Tái cấu trúc code | Thay đổi code nhưng không thêm tính năng mới |
| `docs` | Tài liệu | README, tài liệu API, tài liệu dự án... |
| `style` | Format/UI style | CSS, format code, indentation... không thay đổi logic |
| `test` | Kiểm thử | Thêm hoặc sửa unit test, integration test... |
| `chore` | Công việc cấu hình/bảo trì | Config, dependency, script, setup project... |
| `perf` | Cải thiện hiệu năng | Tối ưu tốc độ, giảm truy vấn, giảm tài nguyên... |
| `build` | Hệ thống build | Thay đổi build tool, package, bundler... |
| `ci` | CI/CD | GitHub Actions hoặc các pipeline CI/CD |

**Ví dụ Commit theo từng trường hợp:**
1. Thêm tính năng mới - `feat`
   `feat(backend): add user registration API`
2. Sửa lỗi - `fix`
   `fix(backend): fix incorrect password validation`
3. Tái cấu trúc code - `refactor`
   `refactor(backend): simplify authentication middleware`
4. Tài liệu - `docs`
   `docs(root): update README installation guide`
5. Giao diện / định dạng code - `style`
   `style(frontend): improve tour card layout`
6. Test - `test`
   `test(backend): add tests for login API`
7. Cấu hình / bảo trì - `chore`
   `chore(root): initialize project structure`
8. Tối ưu hiệu năng - `perf`
   `perf(backend): optimize tour list query`
9. Build / Dependency - `build`
   `build(frontend): update Vite configuration`
10. CI/CD - `ci`
   `ci(root): add GitHub Actions workflow`

**Nguyên tắc chung**
- Một commit nên tập trung vào một mục đích chính.
- Commit message phải trả lời được: Thay đổi gì? Ở đâu?
- Không sử dụng commit message quá chung chung.
- Không đưa thông tin không liên quan vào commit.

---

## 2. Quy chuẩn Quy trình Duyệt mã (Code Review & Pull Request)
Duy trì thói quen nhận xét và đánh giá code chéo giữa các thành viên là bước bắt buộc trước khi gộp bất kỳ tính năng nào vào hệ thống chính.
- **Tạo Pull Request (PR):** Khi code xong một nhánh, đẩy lên GitHub và mở PR trỏ vào `main`. Tiêu đề PR phải tóm tắt rõ tính năng.
- **Yêu cầu người duyệt (Reviewer):** Gắn thẻ (tag) ít nhất 1 thành viên khác vào PR để đọc code.
- **Quy tắc Gộp (Merge Rule):** Người viết code không được tự nhấn nút Merge. Chỉ người được tag review, sau khi kiểm tra kỹ logic, mới có quyền nhấn Approve và Merge code vào `main`.
- **Đồng bộ máy cá nhân:** Ngay sau khi một PR được gộp vào `main`, các thành viên khác phải lập tức chạy lệnh `git checkout main` và `git pull origin main` để cập nhật code mới nhất về máy.

---

## 3. Quy chuẩn Đặt tên Biến và Tệp tin (Naming Conventions)
- **Biến và Hàm (Variables & Functions):** Sử dụng `camelCase`. Đặt tên bằng tiếng Anh, mang ý nghĩa hành động rõ ràng. (Đúng: `getTourDetails`, `isEmailVerified`).
- **Hằng số (Constants):** Sử dụng `UPPER_SNAKE_CASE`. (Ví dụ: `MAX_LOGIN_ATTEMPTS = 5`, `JWT_EXPIRES_IN = '1h'`).
- **Vue Components:** Sử dụng `PascalCase` với ít nhất 2 từ ghép. (Đúng: `TourCard.vue`, `TheNavbar.vue`).
- **Trong Cơ sở dữ liệu:**
  - Tên Bảng (Tables): Sử dụng danh từ số nhiều, `PascalCase` hoặc gạch dưới. (Ví dụ: `Users`, `Refresh_Tokens`).
  - Tên Cột (Columns): Sử dụng `PascalCase`. (Ví dụ: `UserID`, `AvailableSlots`).
- **Thiết kế API (RESTful Endpoints):**
  - Luôn sử dụng `kebab-case` cho đường dẫn (URI) và dùng danh từ số nhiều.
  - Lựa chọn đúng HTTP Method (`GET`, `POST`, `PUT`/`PATCH`, `DELETE`).
  - Ví dụ: `GET /api/tours`, `POST /api/bookings`.

---

## 4. Quy chuẩn Kiến trúc và Viết mã (Coding Guidelines)
- **Bắt lỗi toàn cục (Error Handling):** Ở Backend, mọi API thao tác với Database phải được bọc trong khối `try...catch`. Bắt buộc trả về JSON theo định dạng chuẩn hóa khi có lỗi.
  ```javascript
  // Định dạng Response chuẩn khi lỗi
  res.status(400).json({
      success: false,
      message: "Số chỗ trống không đủ để thực hiện đặt tour."
  });
  ```
- **Bảo vệ dữ liệu nhạy cảm:** Không bao giờ hard-code chuỗi kết nối Database, JWT Secret, hay API Key vào thẳng mã nguồn. Bắt buộc dùng `process.env.TEN_BIEN` và khai báo trong file `.env`.
- **Vue Composition API:** Ưu tiên viết logic giao diện Frontend trong thẻ `<script setup>` của Vue 3. Các hàm gọi API (sử dụng thư viện axios hoặc fetch) nên được tách riêng ra một thư mục `services/` để tái sử dụng.
- **Ngôn ngữ Chú thích (Comments):** Chấp nhận viết Comment bằng tiếng Việt đối với các nghiệp vụ phức tạp. Các đoạn code hiển nhiên không cần comment rườm rà.
