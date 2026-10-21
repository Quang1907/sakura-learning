# TASKS — Sakura Swipe Learning Task Registry

Tài liệu này ghi nhận toàn bộ các công việc chi tiết với ID duy nhất, quan hệ phụ thuộc (dependencies), tiêu chí nghiệm thu (acceptance criteria) và điều kiện hoàn thành (Definition of Done - DoD).

---

## Danh Sách Task Chi Tiết Theo Từng Phase

### Phase 0 — Product Design & System Blueprint

| Task ID | Tên công việc | Phụ thuộc | Trạng thái | Tiêu chí nghiệm thu (Acceptance Criteria) | Điều kiện hoàn thành (Definition of Done) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `TASK-P0-001` | Tạo bộ nhớ dự án và các tài liệu kỹ thuật cốt lõi | Không | **COMPLETED** | Đầy đủ 14 tài liệu trong `docs/`, `AGENTS.md`, `GEMINI.md`, `README.md` không mâu thuẫn | Toàn bộ tài liệu được commit vào Git, kiểm tra liên kết chéo khớp 100% |
| `TASK-P0-002` | Thiết kế chi tiết ERD và Schema MySQL 8 | `TASK-P0-001` | **COMPLETED** | Schema chuẩn 3NF, có FK, Unique Index, Enum, Soft Delete và Idempotency key | Có bảng danh mục Entity, sơ đồ Mermaid và quy tắc Transaction rõ ràng |
| `TASK-P0-003` | Đặc tả REST API contracts và DTOs | `TASK-P0-001` | **COMPLETED** | API chuẩn REST `/api/v1/`, phân định rõ role, có mã lỗi và status chuẩn | Chi tiết đầy đủ Request/Response body mẫu cho 5 module cốt lõi |
| `TASK-P0-004` | Hoàn thiện tài liệu Security và Testing | `TASK-P0-001` | **COMPLETED** | Ma trận rủi ro OWASP, chiến lược cách ly Test DB và test matrix chi tiết | Tài liệu `SECURITY.md` và `TESTING.md` được rà soát và phê duyệt |

---

### Phase 1 — Project Foundation

| Task ID | Tên công việc | Phụ thuộc | Trạng thái | Tiêu chí nghiệm thu (Acceptance Criteria) | Điều kiện hoàn thành (Definition of Done) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `TASK-P1-001` | Khởi tạo cấu trúc Monorepo NPM Workspaces | `TASK-P0-001` | **COMPLETED** | `npm install` root chạy mượt, liên kết được các package `apps/*` và `packages/shared` | `package.json` root và packages tồn tại, không có lỗi dependency |
| `TASK-P1-002` | Cấu hình TypeScript, ESLint & Prettier | `TASK-P1-001` | **PENDING** | Lệnh `npm run lint` và `npm run type-check` chạy thành công không có lỗi | File `tsconfig.base.json`, `.eslintrc.json` cấu hình strict mode |
| `TASK-P1-003` | Cấu hình MySQL Connection Pool & Migrations | `TASK-P1-002` | **PENDING** | Script kết nối database chạy thành công trên MySQL local | Module kết nối MySQL trả về connection hợp lệ, có test ping DB |
| `TASK-P1-004` | Xây dựng khung ứng dụng Backend (`apps/api`) | `TASK-P1-003` | **PENDING** | Express server chạy tại cổng chỉ định, endpoint `/api/v1/health` trả về 200 OK | Gọi curl test endpoint `/api/v1/health` trả về JSON success |
| `TASK-P1-005` | Cấu hình môi trường Test với Vitest | `TASK-P1-004` | **PENDING** | Lệnh `npm test` thực thi thành công unit test mẫu | Output terminal hiển thị ít nhất 1 bài test pass với Vitest |
| `TASK-P1-006` | Xây dựng nền móng Auth tối giản & Seed Users | `TASK-P1-004` | **PENDING** | Cung cấp helper JWT token, Auth Middleware và seed sẵn tài khoản `admin@sakura.app`, `user@sakura.app` | Unit test verify JWT pass; tài khoản test sẵn sàng cho Phase 2 & Phase 3 |

---

### Phase 2 — Core Learning Engine

| Task ID | Tên công việc | Phụ thuộc | Trạng thái | Tiêu chí nghiệm thu (Acceptance Criteria) | Điều kiện hoàn thành (Definition of Done) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `TASK-P2-001` | Tạo Shared DTOs và Zod Schemas trong `packages/shared` | `TASK-P1-001` | **PENDING** | Xuất khẩu types và validators dùng chung cho cả Web và API | Import thử nghiệm thành công trong cả `apps/api` và `apps/web` |
| `TASK-P2-002` | Triển khai `SrsService` (Thuật toán lặp lại ngắt quãng SM-2) | `TASK-P2-001` | **PENDING** | Unit test kiểm tra độ chính xác của việc tính khoảng thời gian ôn tập khi Đúng/Sai | 100% Unit test pass cho các case: thăng hạng stage, tụt hạng, interval |
| `TASK-P2-003` | Triển khai `FeedEngineService` (Thuật toán phân phối thẻ) | `TASK-P2-002` | **PENDING** | Kiểm tra tỷ lệ phân phối 60/30/10, chống lặp và chống câu hỏi liên tiếp | Unit test mô phỏng feed 10 thẻ thỏa mãn 3 quy tắc phân phối |

---

### Phase 3 — First End-to-End Module (Kanji Full-Stack)

| Task ID | Tên công việc | Phụ thuộc | Trạng thái | Tiêu chí nghiệm thu (Acceptance Criteria) | Điều kiện hoàn thành (Definition of Done) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `TASK-P3-001` | Triển khai Kanji Repository & Service trong `apps/api` | `TASK-P2-001` | **PENDING** | Đọc/ghi Kanji, ví dụ và cấp độ JLPT từ MySQL chuẩn hóa | Service gọi Repository qua transaction, không vi phạm layered rule |
| `TASK-P3-002` | Triển khai Kanji Controller, Router và Integration Test | `TASK-P3-001` | **PENDING** | API `GET /api/v1/kanji` và `POST /api/v1/admin/kanji` pass Supertest | Integration test pass với mã 200, 201 và 400 validation error |
| `TASK-P3-003` | Xây dựng Web App `apps/web` với giao diện Thẻ Kanji và cử chỉ vuốt | `TASK-P3-002` | **PENDING** | Giao diện Sakura responsive, vuốt dọc chuyển thẻ, vuốt ngang đánh dấu, có nút bấm trợ năng | Chạy trên trình duyệt di động mượt mà, đổi thẻ tức thì |
| `TASK-P3-004` | Xây dựng Admin App `apps/admin` quản lý Kanji cơ bản | `TASK-P3-002` | **PENDING** | Form tạo/sửa Kanji, xem danh sách và lọc theo JLPT | Thêm mới 1 chữ Kanji từ Admin, sau đó hiển thị ngay trên Web App |
| `TASK-P3-005` | Tích hợp và kiểm thử End-to-End toàn bộ luồng Kanji | `TASK-P3-003`, `TASK-P3-004` | **PENDING** | Người dùng học thẻ Kanji trên web -> lưu kết quả vào database -> kiểm tra hiển thị đúng trên admin | Báo cáo test E2E có đính kèm logs và chụp màn hình xác thực |
