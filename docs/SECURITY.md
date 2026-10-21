# SECURITY — Sakura Swipe Learning Security & Data Protection Strategy

## 1. Nguyên Tắc Bảo Mật Cốt Lõi

Hệ thống tuân thủ mô hình **Defense in Depth** (Phòng thủ đa tầng), đảm bảo tính toàn vẹn dữ liệu học tập và bảo vệ thông tin người dùng khỏi các lỗ hổng phổ biến (OWASP Top 10).

---

## 2. Ma Trận Đánh Giá Rủi Ro An Ninh (Threat & Risk Matrix)

| Nguy cơ bảo mật                | Mức độ           | Kịch bản tấn công                                                                      | Giải pháp kỹ thuật phòng chống                                                                                                             |
| :----------------------------- | :--------------- | :------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------- |
| **SQL Injection (SQLi)**       | **Nghiêm trọng** | Kẻ tấn công tiêm mã SQL độc hại vào ô tìm kiếm hoặc form nhập liệu Kanji.              | 100% truy vấn qua Parameterized Queries (Prepared Statements) của `mysql2/promise`. Không bao giờ nối chuỗi SQL.                           |
| **Gian lận điểm & SRS**        | **Cao**          | Client tự ý sửa kết quả `isCorrect = true` hoặc gửi lại request nhiều lần để farm EXP. | Backend độc quyền chấm điểm và tính toán SRS; áp dụng `clientEventId` (UUID v4) trong bảng `learning_events` chống lặp lại.                |
| **Brute-force Mật khẩu**       | **Cao**          | Kẻ tấn công quét từ điển dò mật khẩu tài khoản học viên hoặc admin.                    | Mã hóa bằng `bcrypt` (salt rounds >= 10); kích hoạt `express-rate-limit` giới hạn tối đa 5 lần thử/phút trên 1 IP.                         |
| **Token Theft & Replay**       | **Trung bình**   | Lộ JWT Access Token khi truyền trên mạng hoặc lưu trữ không an toàn.                   | Access Token có thời hạn ngắn (15 phút); Refresh Token lưu trữ dạng `HttpOnly, Secure, SameSite=Strict` Cookie; cưỡng chế HTTPS toàn diện. |
| **Cross-Site Scripting (XSS)** | **Trung bình**   | Chèn thẻ `<script>` vào nội dung giải thích tiếng Việt hoặc câu hỏi.                   | React tự động sanitize JSX; cài đặt `helmet` thiết lập Content Security Policy (CSP); validate chặt chẽ kiểu dữ liệu đầu vào qua Zod.      |
| **Xung đột đồng bộ Offline**   | **Thấp**         | Sự kiện học ngoại tuyến bị gửi muộn sau khi học viên đã học trên thiết bị khác.        | Sử dụng timestamp của client kết hợp thuật toán Last-Write-Wins có kiểm soát trạng thái SRS trong Database Transaction.                    |

---

## 3. Xác Thực & Phân Quyền (Authentication & RBAC)

### 3.1. Mã hóa mật khẩu (Password Hashing)

- Sử dụng thuật toán **bcrypt** với hệ số muối (salt rounds) tối thiểu là `10`.
- Mật khẩu gốc dạng plaintext tuyệt đối không bao giờ được ghi vào log, không truyền qua query string và không lưu trữ trong database.

### 3.2. Cơ chế JWT (JSON Web Tokens)

- **Access Token**: Có thời hạn ngắn (15 phút), chứa định danh người dùng (`sub: userId`) và vai trò (`role: USER | ADMIN`). Ký bằng khóa bí mật (`JWT_SECRET`) lưu trong biến môi trường.
- **Header**: Bắt buộc gửi qua `Authorization: Bearer <token>`.
- **Server-side Revocation**: Hỗ trợ vô hiệu hóa token khi người dùng đổi mật khẩu hoặc bị khóa tài khoản thông qua trường `token_version` trong bảng `users`.

### 3.3. Phân quyền (Role-Based Access Control - RBAC)

- **Role USER**: Chỉ có quyền đọc nội dung đã được xuất bản (`PUBLISHED`), tạo và cập nhật sự kiện học tập của chính mình.
- **Role ADMIN / MODERATOR**: Có quyền CRUD nội dung Kanji, Từ vựng, Ngữ pháp, Câu hỏi và xem thống kê tổng hợp của hệ thống.
- **Quy tắc quan trọng**: Phân quyền phải được kiểm tra và cưỡng chế ở Middleware phía Server (`requireAuth`, `requireRole('ADMIN')`), tuyệt đối không chỉ dựa vào việc ẩn/hiện nút trên Frontend.

---

## 4. Phòng Chống Các Lỗ Hổng Web Phổ Biến (OWASP Mitigations)

### 4.1. SQL Injection (SQLi)

- Toàn bộ truy vấn xuống MySQL phải sử dụng **Parameterized Queries** (Prepared Statements) do thư viện `mysql2` xử lý.
- Tuyệt đối nghiêm cấm việc cộng chuỗi SQL thủ công (`SELECT * FROM kanji WHERE id = " + id`).

### 4.2. Cross-Site Scripting (XSS) & Headers An Toàn

- React tự động escape HTML khi render JSX, ngăn ngừa việc chèn thẻ script độc hại từ nội dung câu hỏi hoặc nghĩa tiếng Việt.
- Sử dụng thư viện `helmet` trên Express để cấu hình:
  - `Content-Security-Policy`: Chặn thực thi inline scripts không rõ nguồn gốc.
  - `X-Frame-Options: DENY`: Chống tấn công Clickjacking.
  - `Strict-Transport-Security`: Ép buộc sử dụng giao thức HTTPS.

### 4.3. Cross-Origin Resource Sharing (CORS)

- Backend chỉ cho phép các Origin tin cậy được cấu hình trong file biến môi trường `CORS_ORIGIN` (ví dụ: `http://localhost:5173`, `https://sakura.app`).
- Chặn tất cả các request có Origin lạ gửi kèm thông tin xác thực.

### 4.4. Rate Limiting

- Sử dụng `express-rate-limit` trên các endpoint nhạy cảm:
  - `/api/v1/auth/login` và `/api/v1/auth/register`: Giới hạn tối đa 5 requests/phút trên mỗi IP.
  - `/api/v1/feed` và `/api/v1/progress`: Giới hạn 120 requests/phút trên mỗi người dùng.
