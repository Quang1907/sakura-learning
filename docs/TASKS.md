# TASKS — Sakura Swipe Learning Task Registry

Tài liệu này ghi nhận toàn bộ các công việc chi tiết với ID duy nhất, quan hệ phụ thuộc (dependencies), tiêu chí nghiệm thu (acceptance criteria) và bằng chứng kiểm thử thực tế.

---

## Danh Sách Task Theo Phase

### Phase 0 — Product Design & Blueprint

| Task ID | Tên công việc | Phụ thuộc | Trạng thái | Tiêu chí nghiệm thu (Acceptance Criteria) |
| :--- | :--- | :--- | :--- | :--- |
| `TASK-P0-001` | Tạo bộ nhớ dự án và các tài liệu kỹ thuật cốt lõi | Không | **COMPLETED** | Đầy đủ 14 tài liệu trong `docs/`, `AGENTS.md`, `GEMINI.md`, `README.md` không mâu thuẫn |
| `TASK-P0-002` | Thiết kế chi tiết ERD và Schema MySQL 8 | `TASK-P0-001` | **COMPLETED** | Schema chuẩn 3NF, có FK, Unique Index, Enum và Idempotency key |
| `TASK-P0-003` | Đặc tả REST API contracts và DTOs | `TASK-P0-001` | **COMPLETED** | API chuẩn REST, phân định rõ role, có mã lỗi và status chuẩn |

---

### Phase 1 — Project Foundation

| Task ID | Tên công việc | Phụ thuộc | Trạng thái | Tiêu chí nghiệm thu (Acceptance Criteria) |
| :--- | :--- | :--- | :--- | :--- |
| `TASK-P1-001` | Khởi tạo cấu trúc Monorepo NPM Workspaces | `TASK-P0-001` | **PENDING** | `npm install` root chạy mượt, liên kết được các package `apps/*` và `packages/shared` |
| `TASK-P1-002` | Cấu hình TypeScript, ESLint & Prettier | `TASK-P1-001` | **PENDING** | Lệnh `npm run lint` và `npm run type-check` chạy thành công không có lỗi |
| `TASK-P1-003` | Cấu hình MySQL Connection Pool & Migrations | `TASK-P1-002` | **PENDING** | Script khởi tạo database chạy thành công trên MySQL local, sinh ra đầy đủ các bảng |
| `TASK-P1-004` | Xây dựng khung ứng dụng Backend (`apps/api`) | `TASK-P1-003` | **PENDING** | Express server chạy tại cổng chỉ định, endpoint `/api/v1/health` trả về 200 OK |
| `TASK-P1-005` | Cấu hình môi trường Test với Vitest | `TASK-P1-004` | **PENDING** | Lệnh `npm test` thực thi thành công unit test mẫu |

---

### Phase 2 — Core Learning Engine

| Task ID | Tên công việc | Phụ thuộc | Trạng thái | Tiêu chí nghiệm thu (Acceptance Criteria) |
| :--- | :--- | :--- | :--- | :--- |
| `TASK-P2-001` | Tạo Shared DTOs và Zod Schemas trong `packages/shared` | `TASK-P1-001` | **PENDING** | Xuất khẩu types và validators dùng chung cho cả Web và API |
| `TASK-P2-002` | Triển khai `SrsService` (Thuật toán lặp lại ngắt quãng SM-2) | `TASK-P2-001` | **PENDING** | Unit test kiểm tra độ chính xác của việc tính khoảng thời gian ôn tập khi Đúng/Sai |
| `TASK-P2-003` | Triển khai `FeedEngineService` (Thuật toán phân phối thẻ) | `TASK-P2-002` | **PENDING** | Kiểm tra tỷ lệ phân phối 60/30/10, chống lặp và chống câu hỏi liên tiếp |

---

### Phase 3 — First End-to-End Module (Kanji Full-Stack)

| Task ID | Tên công việc | Phụ thuộc | Trạng thái | Tiêu chí nghiệm thu (Acceptance Criteria) |
| :--- | :--- | :--- | :--- | :--- |
| `TASK-P3-001` | Triển khai Kanji Repository & Service trong `apps/api` | `TASK-P2-001` | **PENDING** | Đọc/ghi Kanji, ví dụ và cấp độ JLPT từ MySQL chuẩn hóa |
| `TASK-P3-002` | Triển khai Kanji Controller, Router và Integration Test | `TASK-P3-001` | **PENDING** | API `GET /api/v1/kanji` và `POST /api/v1/admin/kanji` pass Supertest |
| `TASK-P3-003` | Xây dựng Web App `apps/web` với giao diện Thẻ Kanji và cử chỉ vuốt | `TASK-P3-002` | **PENDING** | Giao diện Sakura responsive, vuốt dọc chuyển thẻ, vuốt ngang đánh dấu, có nút bấm trợ năng |
| `TASK-P3-004` | Xây dựng Admin App `apps/admin` quản lý Kanji cơ bản | `TASK-P3-002` | **PENDING** | Form tạo/sửa Kanji, xem danh sách và lọc theo JLPT |
| `TASK-P3-005` | Tích hợp và kiểm thử End-to-End toàn bộ luồng Kanji | `TASK-P3-003`, `TASK-P3-004` | **PENDING** | Người dùng học thẻ Kanji trên web -> lưu kết quả vào database -> kiểm tra hiển thị đúng trên admin |
