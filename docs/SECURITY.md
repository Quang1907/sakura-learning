# SECURITY — Sakura Swipe Learning Security & Data Protection Strategy

## 1. Nguyên Tắc Bảo Mật Cốt Lõi

Hệ thống tuân thủ mô hình **Defense in Depth** (Phòng thủ đa tầng), đảm bảo tính toàn vẹn dữ liệu học tập và bảo vệ thông tin người dùng khỏi các lỗ hổng phổ biến (OWASP Top 10).

---

## 2. Xác Thực & Phân Quyền (Authentication & RBAC)

### 2.1. Mã hóa mật khẩu (Password Hashing)
- Sử dụng thuật toán **bcrypt** với hệ số muối (salt rounds) tối thiểu là `10`.
- Mật khẩu gốc dạng plaintext tuyệt đối không bao giờ được ghi vào log, không truyền qua query string và không lưu trữ trong database.

### 2.2. Cơ chế JWT (JSON Web Tokens)
- **Access Token**: Có thời hạn ngắn (ví dụ: 15 - 60 phút), chứa định danh người dùng (`sub: userId`) và vai trò (`role: USER | ADMIN`). Ký bằng khóa bí mật (`JWT_SECRET`) lưu trong biến môi trường.
- **Header**: Bắt buộc gửi qua `Authorization: Bearer <token>`.
- **Server-side Revocation**: Hỗ trợ vô hiệu hóa token khi người dùng đổi mật khẩu hoặc bị khóa tài khoản thông qua trường `token_version` trong bảng `users`.

### 2.3. Phân quyền (Role-Based Access Control - RBAC)
- **Role USER**: Chỉ có quyền đọc nội dung đã được xuất bản (`PUBLISHED`), tạo và cập nhật sự kiện học tập của chính mình.
- **Role ADMIN / MODERATOR**: Có quyền CRUD nội dung Kanji, Từ vựng, Ngữ pháp, Câu hỏi và xem thống kê tổng hợp của hệ thống.
- **Quy tắc quan trọng**: Phân quyền phải được kiểm tra và cưỡng chế ở Middleware phía Server (`requireAuth`, `requireRole('ADMIN')`), tuyệt đối không chỉ dựa vào việc ẩn/hiện nút trên Frontend.

---

## 3. Phòng Chống Các Lỗ Hổng Web Phổ Biến (OWASP Mitigations)

### 3.1. SQL Injection (SQLi)
- Toàn bộ truy vấn xuống MySQL phải sử dụng **Parameterized Queries** (Prepared Statements) do thư viện `mysql2` hoặc Query Builder xử lý.
- Tuyệt đối nghiêm cấm việc cộng chuỗi SQL thủ công (`SELECT * FROM kanji WHERE id = " + id`).

### 3.2. Cross-Site Scripting (XSS)
- React tự động escape HTML khi render JSX, ngăn ngừa việc chèn thẻ script độc hại từ nội dung câu hỏi hoặc nghĩa tiếng Việt.
- Sử dụng thư viện `helmet` trên Express để cấu hình Content Security Policy (CSP), chặn thực thi inline scripts không rõ nguồn gốc.

### 3.3. Cross-Origin Resource Sharing (CORS)
- Backend chỉ cho phép các Origin tin cậy được cấu hình trong file biến môi trường `CORS_ORIGIN` (ví dụ: `http://localhost:5173`, `https://sakura.app`).
- Chặn tất cả các request có Origin lạ gửi kèm thông tin xác thực.

### 3.4. Rate Limiting & Chống Brute-Force
- Sử dụng `express-rate-limit` trên các endpoint nhạy cảm:
  - `/api/v1/auth/login` và `/api/v1/auth/register`: Giới hạn tối đa 5-10 requests/phút trên mỗi IP.
  - `/api/v1/feed` và `/api/v1/progress`: Giới hạn 120 requests/phút trên mỗi người dùng.

---

## 4. Bảo Vệ Tiến Trình Học & Chống Gian Lận (Progress Integrity)

- **Idempotency Key**: Bắt buộc có `clientEventId` định dạng UUID v4 cho mọi hành động học tập. Nếu cùng một event ID được gửi lại nhiều lần (do mạng lag hoặc retry tự động), hệ thống trả về kết quả cũ mà không cộng dồn điểm hay lặp lại việc cập nhật SRS.
- **Kiểm tra tính hợp lệ của câu trả lời**: Việc chấm điểm câu hỏi (đúng/sai) và tính toán thời gian ôn tập tiếp theo (SRS interval) phải được thực hiện tại **Backend Service**, không giao cho Frontend tự tính toán rồi gửi kết quả lên.
