# Tài liệu Quy chuẩn Làm việc Nhóm (Team Guidelines)

---

## 1. Quy chuẩn Quản lý Mã nguồn (GitHub Workflow)

Hệ thống áp dụng mô hình **Feature Branching**. Tuyệt đối **không được phép đẩy (push) code trực tiếp lên nhánh `main`**. Nhánh `main` chỉ chứa code đã hoàn thiện và chạy ổn định.

### Quy tắc đặt tên Nhánh (Branch Name):
Sử dụng chữ thường, dấu gạch ngang `-` và bắt đầu bằng tiền tố phân loại:
- **Tính năng mới:** `feature/ten-tinh-nang` (Ví dụ: `feature/jwt-authentication`, `feature/booking-lock`, `feature/homepage-tour`)
- **Sửa lỗi:** `bugfix/ten-loi` (Ví dụ: `bugfix/login-crash`, `bugfix/tour-price-display`)
- **Cập nhật tài liệu / cấu hình:** `chore/ten-cong-viec` (Ví dụ: `chore/setup-database`, `chore/update-readme`)

---

### Quy tắc ghi chú Commit (Commit Message)
Commit message phải ngắn gọn, rõ ràng và cho biết: **Loại thay đổi** + **Vị trí thay đổi** + **Nội dung chính**.

#### Cấu trúc chuẩn:
```text
<type>(<scope>): <mô tả ngắn>
```

**Trong đó:**
- `type`: Loại thay đổi (xem bảng bên dưới).
- `scope`: Vị trí hoặc module bị thay đổi, ví dụ: `frontend`, `backend`, `database`, `auth`, `booking`, `tour`, `root`.
- `mô tả`: Mô tả ngắn gọn nội dung đã thực hiện.
*(Ưu tiên viết mô tả bằng tiếng Anh để thống nhất trong Git history; nếu nhóm thống nhất dùng tiếng Việt thì phải sử dụng nhất quán).*

#### Các loại Commit (`Type`):

| Type | Ý nghĩa | Khi sử dụng |
|---|---|---|
| `feat` | Thêm tính năng | Khi thêm chức năng mới |
| `fix` | Sửa lỗi | Khi sửa bug |
| `refactor` | Tái cấu trúc code | Thay đổi code nhưng không thêm tính năng mới |
| `docs` | Tài liệu | README, tài liệu API, tài liệu dự án... |
| `style` | Format / UI style | CSS, format code, indentation... không thay đổi logic |
| `test` | Kiểm thử | Thêm hoặc sửa unit test, integration test... |
| `chore` | Cấu hình / bảo trì | Config, dependency, script, setup project... |
| `perf` | Cải thiện hiệu năng | Tối ưu tốc độ, giảm truy vấn, giảm tài nguyên... |
| `build` | Hệ thống build | Thay đổi build tool, package, bundler... |
| `ci` | CI/CD | GitHub Actions hoặc các pipeline CI/CD |

---

### Ví dụ Commit theo từng trường hợp

1. **Thêm tính năng mới – `feat`**
   ```text
   feat(backend): add user registration API
   feat(backend): add JWT authentication
   ```

2. **Sửa lỗi – `fix`**
   ```text
   fix(backend): fix incorrect password validation
   fix(backend): fix expired JWT handling
   ```

3. **Tái cấu trúc code – `refactor`**  
   *(Dùng khi không thay đổi chức năng, chỉ cải thiện cấu trúc hoặc cách tổ chức code)*
   ```text
   refactor(backend): simplify authentication middleware
   refactor(backend): extract database logic into services
   ```

4. **Tài liệu – `docs`**
   ```text
   docs(root): update README installation guide
   docs(root): add project setup instructions
   ```

5. **Giao diện / Định dạng code – `style`**  
   *(Dùng khi thay đổi cách trình bày, không thay đổi logic nghiệp vụ)*
   ```text
   style(frontend): improve tour card layout
   style(frontend): adjust booking form spacing
   ```

6. **Kiểm thử – `test`**
   ```text
   test(backend): add tests for login API
   test(backend): add user registration tests
   ```

7. **Cấu hình / Bảo trì – `chore`**
   ```text
   chore(root): initialize project structure
   chore(backend): configure environment variables
   ```

8. **Tối ưu hiệu năng – `perf`**
   ```text
   perf(backend): optimize tour list query
   perf(backend): reduce database queries
   ```

9. **Build / Dependency – `build`**
   ```text
   build(frontend): update Vite configuration
   build(backend): update Node.js dependencies
   ```

10. **CI/CD – `ci`**
    ```text
    ci(root): add GitHub Actions workflow
    ci(backend): add automated test workflow
    ```

---

### Ví dụ theo một chức năng hoàn chỉnh
*Ví dụ: Thành viên A thực hiện chức năng Đăng nhập:*
```text
feat(backend): add login API
feat(backend): add JWT token generation
feat(backend): add refresh token mechanism
feat(frontend): add login form
feat(frontend): integrate login API
fix(frontend): fix login validation message
test(backend): add login API tests
docs(backend): document login API
```

### Ví dụ khi sửa một chức năng đã có
- Nếu phát hiện chức năng đặt tour tính sai số chỗ:
  ```text
  fix(booking): fix available slot calculation
  ```
- Nếu sau đó phát hiện code tính số chỗ đang nằm sai vị trí và cần tách lại:
  ```text
  refactor(booking): extract slot calculation logic
  ```
- Nếu thêm test để tránh lỗi quay lại:
  ```text
  test(booking): add available slot validation tests
  ```

---

### Các lưu ý quan trọng về Commit:
❌ **Không sử dụng các commit message quá chung chung hoặc gộp quá nhiều việc:**
```text
# SAI:
feat(backend): add login, fix booking, update UI and database
```
✅ **Thay vào đó, chia thành các commit nhỏ có mục đích rõ ràng:**
```text
# ĐÚNG:
feat(backend): add login API
fix(booking): fix available slot calculation
style(frontend): update booking form
chore(database): add booking indexes
```

#### Nguyên tắc cốt lõi:
- Một commit nên tập trung vào **một mục đích chính**.
- Commit message phải trả lời được: **Thay đổi gì? Ở đâu?**
- `feat` dùng cho tính năng mới, `fix` dùng cho bug, `refactor` dùng cho cải tổ code không đổi chức năng.
- `style` chỉ dùng cho thay đổi về format/UI/CSS không làm thay đổi logic nghiệp vụ.

---

## 2. Quy chuẩn Quy trình Duyệt mã (Code Review & Pull Request)

Duy trì thói quen nhận xét và đánh giá code chéo giữa các thành viên là bước bắt buộc trước khi gộp bất kỳ tính năng nào vào hệ thống chính.

1. **Tạo Pull Request (PR):**
   - Khi hoàn thành tính năng trên một nhánh, đẩy lên GitHub và mở PR trỏ vào `main` (hoặc nhánh integration của team).
   - Tiêu đề PR phải tóm tắt rõ tính năng:  
     *Ví dụ:* `[Module 1] Hoàn thiện luồng cấp phát Refresh Token` hoặc `[Frontend] Hoàn thiện giao diện trang chủ TaVivu`

2. **Yêu cầu người duyệt (Reviewer):**
   - Gắn thẻ (tag) ít nhất **1 thành viên khác** vào PR để đọc và đánh giá code.
   - Trình bày rõ phần code cốt lõi cần chú ý trong phần mô tả PR.  
     *Ví dụ:* *"Hãy xem kỹ đoạn khóa dòng Row-level lock ở file booking.controller.js"*

3. **Quy tắc Gộp (Merge Rule):**
   - **Người viết code không được tự nhấn nút Merge.**
   - Chỉ người được tag review, sau khi kiểm tra kỹ logic, mới có quyền nhấn **Approve** và **Merge** code vào nhánh chính.

4. **Đồng bộ máy cá nhân:**
   - Ngay sau khi một PR được gộp vào `main`, tất cả các thành viên khác phải lập tức chạy lệnh:
     ```bash
     git checkout main
     git pull origin main
     ```
     để cập nhật code mới nhất về máy trước khi tạo nhánh làm tính năng tiếp theo.

---

## 3. Quy chuẩn Đặt tên Biến và Tệp tin (Naming Conventions)

Sự đồng nhất trong cách đặt tên giúp code Frontend (Vue) và Backend (Node) luôn liền mạch, dễ đọc và bảo trì.

### Trong mã nguồn Node.js & Vue.js:
- **Biến và Hàm (Variables & Functions):**
  - Sử dụng `camelCase`.
  - Đặt tên bằng tiếng Anh, mang ý nghĩa hành động rõ ràng.
  - *Đúng:* `getTourDetails`, `isEmailVerified`, `fetchDestinations`.
  - *Sai:* `laydulieu`, `test1`, `data2`.
- **Hằng số (Constants):**
  - Sử dụng `UPPER_SNAKE_CASE` đối với các giá trị cấu hình không thay đổi.
  - *Ví dụ:* `MAX_LOGIN_ATTEMPTS = 5`, `JWT_EXPIRES_IN = '1h'`, `DEFAULT_PAGE_LIMIT = 10`.
- **Vue Components:**
  - Sử dụng `PascalCase` với ít nhất **2 từ ghép** để tránh trùng lặp với thẻ HTML gốc.
  - *Đúng:* `TourCard.vue`, `TheNavbar.vue`, `TheFooter.vue`, `PromoAdventureBanner.vue`.
  - *Sai:* `tour.vue`, `Card.vue`.

### Trong Cơ sở dữ liệu (Database Schema):
- **Tên Bảng (Tables):** Sử dụng danh từ số nhiều, viết hoa chữ cái đầu (`PascalCase`) hoặc phân tách bằng gạch dưới.  
  *Ví dụ:* `Users`, `Refresh_Tokens`, `Tour_Images`, `Destinations`.
- **Tên Cột (Columns):** Sử dụng `PascalCase`.  
  *Ví dụ:* `UserID`, `AvailableSlots`, `HoldExpiresAt`, `CreatedAt`.

### Thiết kế API (RESTful Endpoints):
- Luôn sử dụng `kebab-case` cho đường dẫn (URI) và dùng danh từ số nhiều.
- Lựa chọn đúng HTTP Method:
  - `GET`: Lấy/đọc dữ liệu
  - `POST`: Tạo mới
  - `PUT` / `PATCH`: Cập nhật
  - `DELETE`: Xóa
- **Ví dụ API chuẩn:**
  - `GET /api/tours` (Lấy danh sách tour)
  - `GET /api/tours/:id` (Lấy chi tiết 1 tour)
  - `POST /api/bookings` (Tạo đơn đặt tour mới)
  - `GET /api/destinations` (Lấy danh sách điểm đến)

---

## 4. Quy chuẩn Kiến trúc và Viết mã (Coding Guidelines)

1. **Bắt lỗi toàn cục (Error Handling):**
   - Ở Backend, mọi API thao tác với Database phải được bọc trong khối `try...catch`.
   - Bắt buộc trả về JSON theo định dạng chuẩn hóa khi có lỗi để Frontend dễ dàng bắt và hiển thị thông báo:
     ```javascript
     // Định dạng Response chuẩn khi lỗi
     res.status(400).json({
         success: false,
         message: "Số chỗ trống không đủ để thực hiện đặt tour."
     });
     ```

2. **Bảo vệ dữ liệu nhạy cảm:**
   - **Tuyệt đối không hard-code** (viết cứng) chuỗi kết nối Database, JWT Secret, hay API Key vào thẳng mã nguồn.
   - Bắt buộc dùng `process.env.TEN_BIEN` và khai báo trong file `.env`. Đảm bảo file `.env` đã nằm trong `.gitignore`.

3. **Vue Composition API:**
   - Ưu tiên viết logic giao diện Frontend trong thẻ `<script setup>` của Vue 3.
   - Các hàm gọi API (sử dụng thư viện `axios` hoặc `fetch`) nên được tách riêng ra một thư mục `services/` hoặc `api/` để tái sử dụng.

4. **Ngôn ngữ Chú thích (Comments):**
   - Chấp nhận viết Comment bằng tiếng Việt đối với các nghiệp vụ phức tạp (như giải thích luồng xử lý Transaction, cơ chế chống Overbooking, thuật toán xoay vòng carousel...).
   - Các đoạn code hiển nhiên, quen thuộc không cần comment rườm rà.
