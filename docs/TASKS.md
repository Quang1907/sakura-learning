# TASKS — Sakura Swipe Learning Task Registry

Tài liệu này ghi nhận toàn bộ các công việc chi tiết với ID duy nhất, quan hệ phụ thuộc (dependencies), tiêu chí nghiệm thu (acceptance criteria) và điều kiện hoàn thành (Definition of Done - DoD).

---

## Danh Sách Task Chi Tiết Theo Từng Phase

### Phase 0 — Product Design & System Blueprint

| Task ID       | Tên công việc                                     | Phụ thuộc     | Trạng thái    | Tiêu chí nghiệm thu (Acceptance Criteria)                                               | Điều kiện hoàn thành (Definition of Done)                              |
| :------------ | :------------------------------------------------ | :------------ | :------------ | :-------------------------------------------------------------------------------------- | :--------------------------------------------------------------------- |
| `TASK-P0-001` | Tạo bộ nhớ dự án và các tài liệu kỹ thuật cốt lõi | Không         | **COMPLETED** | Đầy đủ 14 tài liệu trong `docs/`, `AGENTS.md`, `GEMINI.md`, `README.md` không mâu thuẫn | Toàn bộ tài liệu được commit vào Git, kiểm tra liên kết chéo khớp 100% |
| `TASK-P0-002` | Thiết kế chi tiết ERD và Schema MySQL 8           | `TASK-P0-001` | **COMPLETED** | Schema chuẩn 3NF, có FK, Unique Index, Enum, Soft Delete và Idempotency key             | Có bảng danh mục Entity, sơ đồ Mermaid và quy tắc Transaction rõ ràng  |
| `TASK-P0-003` | Đặc tả REST API contracts và DTOs                 | `TASK-P0-001` | **COMPLETED** | API chuẩn REST `/api/v1/`, phân định rõ role, có mã lỗi và status chuẩn                 | Chi tiết đầy đủ Request/Response body mẫu cho 5 module cốt lõi         |
| `TASK-P0-004` | Hoàn thiện tài liệu Security và Testing           | `TASK-P0-001` | **COMPLETED** | Ma trận rủi ro OWASP, chiến lược cách ly Test DB và test matrix chi tiết                | Tài liệu `SECURITY.md` và `TESTING.md` được rà soát và phê duyệt       |

---

### Phase 1 — Project Foundation

| Task ID       | Tên công việc                                | Phụ thuộc     | Trạng thái    | Tiêu chí nghiệm thu (Acceptance Criteria)                                                              | Điều kiện hoàn thành (Definition of Done)                                |
| :------------ | :------------------------------------------- | :------------ | :------------ | :----------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------- |
| `TASK-P1-001` | Khởi tạo cấu trúc Monorepo NPM Workspaces    | `TASK-P0-001` | **COMPLETED** | `npm install` root chạy mượt, liên kết được các package `apps/*` và `packages/shared`                  | `package.json` root và packages tồn tại, không có lỗi dependency         |
| `TASK-P1-002` | Cấu hình TypeScript, ESLint & Prettier       | `TASK-P1-001` | **COMPLETED** | Lệnh `npm run lint` và `npm run type-check` chạy thành công không có lỗi                               | File `tsconfig.base.json`, `.eslintrc.json` cấu hình strict mode         |
| `TASK-P1-003` | Cấu hình MySQL Connection Pool & Migrations  | `TASK-P1-002` | **COMPLETED** | Script kết nối database chạy thành công trên MySQL local                                               | Module kết nối MySQL trả về connection hợp lệ, có test ping DB           |
| `TASK-P1-004` | Xây dựng khung ứng dụng Backend (`apps/api`) | `TASK-P1-003` | **COMPLETED** | Express server chạy tại cổng chỉ định, endpoint `/api/v1/health` trả về 200 OK                         | Gọi curl test endpoint `/api/v1/health` trả về JSON success              |
| `TASK-P1-005` | Cấu hình môi trường Test với Vitest          | `TASK-P1-004` | **COMPLETED** | Lệnh `npm test` thực thi thành công unit test mẫu                                                      | Output terminal hiển thị ít nhất 1 bài test pass với Vitest              |
| `TASK-P1-006` | Xây dựng nền móng Auth tối giản & Seed Users | `TASK-P1-004` | **COMPLETED** | Cung cấp helper JWT token, Auth Middleware và seed sẵn tài khoản `admin@sakura.app`, `user@sakura.app` | Unit test verify JWT pass; tài khoản test sẵn sàng cho Phase 2 & Phase 3 |

---

### Phase 2 — Core Learning Engine

| Task ID       | Tên công việc                                                | Phụ thuộc     | Trạng thái  | Tiêu chí nghiệm thu (Acceptance Criteria)                                          | Điều kiện hoàn thành (Definition of Done)                              |
| :------------ | :----------------------------------------------------------- | :------------ | :---------- | :--------------------------------------------------------------------------------- | :--------------------------------------------------------------------- |
| `TASK-P2-001` | Tạo Shared DTOs và Zod Schemas trong `packages/shared`       | `TASK-P1-001` | **COMPLETED** | Xuất khẩu types và validators dùng chung cho cả Web và API                         | Import thử nghiệm thành công trong cả `apps/api` và `apps/web`         |
| `TASK-P2-002` | Triển khai `SrsService` (Thuật toán lặp lại ngắt quãng SM-2) | `TASK-P2-001` | **COMPLETED** | Unit test kiểm tra độ chính xác của việc tính khoảng thời gian ôn tập khi Đúng/Sai | 100% Unit test pass cho các case: thăng hạng stage, tụt hạng, interval |
| `TASK-P2-003` | Triển khai `FeedEngineService` (Thuật toán phân phối thẻ)    | `TASK-P2-002` | **COMPLETED** | Kiểm tra tỷ lệ phân phối 60/30/10, chống lặp và chống câu hỏi liên tiếp            | Unit test mô phỏng feed 10 thẻ thỏa mãn 3 quy tắc phân phối            |
| `TASK-P2-004` | Database Migrations & Seed Data cho Core Learning Engine     | `TASK-P2-001` | **COMPLETED** | Tạo 21 bảng chuẩn hóa trong `001_core_learning_engine.sql` và seed N5 data        | Migrations chạy qua không lỗi; cấu trúc bảng khớp 100% với ERD         |
| `TASK-P2-005` | Triển khai Question Grading Service & Question API           | `TASK-P2-004` | **COMPLETED** | Chấm điểm độc quyền phía server; chuẩn hóa Unicode/NFC; hỗ trợ multiple choice & text | API `POST /api/v1/questions/:id/submit` pass 100% Supertest            |
| `TASK-P2-006` | Triển khai Learning Progress Service & Idempotency Audit Log | `TASK-P2-004` | **COMPLETED** | Chống ghi nhận trùng bằng `clientEventId`; cập nhật atomic event, progress, streak | API `POST /api/v1/progress/event` pass idempotency test                |
| `TASK-P2-007` | Triển khai Swipe Feed API (Prefetch, Anti-Repetition/Fatigue)| `TASK-P2-003` | **COMPLETED** | API `/api/v1/feed` và `/api/v1/feed/next` phân phối thẻ an toàn, không lộ đáp án   | 100% Supertest API integration tests pass                              |

---

### Phase 3 — First End-to-End Module (Kanji Full-Stack)

| Task ID       | Tên công việc                                                      | Phụ thuộc                    | Trạng thái  | Tiêu chí nghiệm thu (Acceptance Criteria)                                                          | Điều kiện hoàn thành (Definition of Done)                          |
| :------------ | :----------------------------------------------------------------- | :--------------------------- | :---------- | :------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------- |
| `TASK-P3-001` | Triển khai Kanji Repository & Service trong `apps/api`             | `TASK-P2-001`                | **COMPLETED** | Đọc/ghi Kanji, ví dụ và cấp độ JLPT từ MySQL chuẩn hóa                                             | Service gọi Repository qua transaction, không vi phạm layered rule |
| `TASK-P3-002` | Triển khai Kanji Controller, Router và Integration Test            | `TASK-P3-001`                | **COMPLETED** | API `GET /api/v1/kanji` và `POST /api/v1/admin/kanji` pass Supertest                               | Integration test pass với mã 200, 201 và 400 validation error      |
| `TASK-P3-003` | Xây dựng Web App `apps/web` với giao diện Thẻ Kanji và cử chỉ vuốt | `TASK-P3-002`                | **COMPLETED** | Giao diện Sakura responsive, vuốt dọc chuyển thẻ, vuốt ngang đánh dấu, có nút bấm trợ năng         | Chạy trên trình duyệt di động mượt mà, đổi thẻ tức thì             |
| `TASK-P3-004` | Xây dựng Admin App `apps/admin` quản lý Kanji cơ bản               | `TASK-P3-002`                | **COMPLETED** | Form tạo/sửa Kanji, xem danh sách và lọc theo JLPT                                                 | Thêm mới 1 chữ Kanji từ Admin, sau đó hiển thị ngay trên Web App   |
| `TASK-P3-005` | Tích hợp và kiểm thử End-to-End toàn bộ luồng Kanji                | `TASK-P3-003`, `TASK-P3-004` | **COMPLETED** | Người dùng học thẻ Kanji trên web -> lưu kết quả vào database -> kiểm tra hiển thị đúng trên admin | Báo cáo test E2E có đính kèm logs và chụp màn hình xác thực        |

---

### Phase 4 — Learning Experience Expansion (Vocabulary & Grammar Full-Stack)

| Task ID       | Tên công việc                                                                   | Phụ thuộc                    | Trạng thái    | Tiêu chí nghiệm thu (Acceptance Criteria)                                                                 | Điều kiện hoàn thành (Definition of Done)                                   |
| :------------ | :------------------------------------------------------------------------------ | :--------------------------- | :------------ | :-------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------- |
| `TASK-P4-001` | Triển khai Vocabulary Repository, Service, Controller & Router (`apps/api`)     | `TASK-P3-005`                | **COMPLETED** | Đầy đủ CRUD từ vựng, liên kết JLPT (N5-N1), câu ví dụ mẫu, phân trang và tìm kiếm theo romaji/reading    | 11 integration tests Supertest pass 100% với mã 200, 201, 400, 404          |
| `TASK-P4-002` | Triển khai Grammar Repository, Service, Controller & Router (`apps/api`)        | `TASK-P3-005`                | **COMPLETED** | Đầy đủ CRUD mẫu ngữ pháp, cấu trúc kết nối, ý nghĩa tiếng Việt, câu ví dụ và cấp độ JLPT                  | 11 integration tests Supertest pass 100% với mã 200, 201, 400, 404          |
| `TASK-P4-003` | Xây dựng Web App `apps/web` mở rộng cho Từ vựng & Ngữ pháp                      | `TASK-P4-001`, `TASK-P4-002` | **COMPLETED** | `VocabularyExplorer`, `VocabularyCard`, `GrammarExplorer`, `GrammarCard` với giao diện Sakura thẩm mỹ cao  | Responsive mobile-first, tìm kiếm tức thì, lọc theo tab JLPT N5..N1         |
| `TASK-P4-004` | Xây dựng Admin App `apps/admin` quản lý Từ vựng & Ngữ pháp                      | `TASK-P4-001`, `TASK-P4-002` | **COMPLETED** | Bảng quản lý `VocabularyTable`, `GrammarTable` và các Form tạo/sửa có validation Zod                      | Admin thực hiện thêm, sửa, xóa mềm từ vựng và ngữ pháp an toàn              |
| `TASK-P4-005` | Mở rộng Swipe Feed tích hợp đa nội dung & Thống kê học tập (`LearningStatsModal`)| `TASK-P4-003`                | **COMPLETED** | Feed phân phối mượt mà Kanji, Từ vựng, Ngữ pháp và Câu hỏi; Modal thống kê hiển thị chi tiết theo cấp độ   | Type-check 0 lỗi, tương tác vuốt và trả lời câu hỏi trực tiếp trên feed     |

---

### Phase 5 — Full User Management & Content Governance

| Task ID       | Tên công việc                                                                   | Phụ thuộc                    | Trạng thái    | Tiêu chí nghiệm thu (Acceptance Criteria)                                                                 | Điều kiện hoàn thành (Definition of Done)                                   |
| :------------ | :------------------------------------------------------------------------------ | :--------------------------- | :------------ | :-------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------- |
| `TASK-P5-001` | Hoàn thiện luồng Đăng ký & Đăng nhập người dùng công khai                       | `TASK-P4-005`                | **PLANNED**   | Endpoint `/api/v1/auth/register`, `/api/v1/auth/login` với mã hóa bcrypt và sinh cặp Token                | Test login/register pass 100%, có form giao diện trên Web & Admin           |
| `TASK-P5-002` | Quản trị người dùng & Phân quyền RBAC nâng cao trên Admin                       | `TASK-P5-001`                | **PLANNED**   | Cổng quản trị xem danh sách người dùng, thay đổi vai trò (USER, MODERATOR, ADMIN) và khóa tài khoản       | API `/api/v1/admin/users` được bảo vệ nghiêm ngặt bằng Role middleware      |
| `TASK-P5-003` | Công cụ Batch Import/Export dữ liệu JLPT (CSV/JSON)                             | `TASK-P4-005`                | **PLANNED**   | Giáo viên / Admin có thể upload file CSV để nhập hàng loạt Kanji, Từ vựng, Ngữ pháp kèm kiểm tra định dạng| Transaction import đảm bảo an toàn toàn vẹn dữ liệu, báo cáo lỗi chi tiết   |
