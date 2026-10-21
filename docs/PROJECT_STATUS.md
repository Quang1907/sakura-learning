# PROJECT STATUS — Sakura Swipe Learning Current State

*Cập nhật lần cuối: 2026-10-21T10:10:00+09:00*

---

## 1. Tổng Quan Tiến Độ

| Mục | Trạng thái hiện tại |
| :--- | :--- |
| **Phase hiện tại** | **Phase 1 — Project Foundation** |
| **Tiến độ Phase 1** | **20%** (Đã hoàn thành TASK-P1-001) |
| **Task vừa hoàn thành** | `TASK-P1-001` (Khởi tạo cấu trúc Monorepo NPM Workspaces thành công) |
| **Task tiếp theo** | `TASK-P1-002` (Cấu hình TypeScript strict mode, ESLint & Prettier) |
| **Blocker hiện tại** | **Không có** |
| **Bước tiếp theo chính xác** | Triển khai `TASK-P1-002`: tạo `tsconfig.base.json`, cấu hình TypeScript cho từng package và cấu hình ESLint/Prettier. |

---

## 2. Trạng Thái Git & Danh Sách Tài Liệu Đã Cập Nhật

- **Branch**: `main`
- **Tài liệu được hoàn thiện chi tiết trong phiên làm việc**:
  - `docs/PRD.md`: Bổ sung chi tiết User Personas, JLPT N5-N1 routing, User Level / EXP, Acceptance Criteria cụ thể.
  - `docs/ARCHITECTURE.md`: Tách biệt nghiêm ngặt 6 tầng (Router, Middleware, Controller, Service, Repository, Model), kiến trúc PWA/Offline với Dexie.js và Sliding Window Buffer.
  - `docs/DATABASE.md`: Danh mục đầy đủ 18 thực thể, sơ đồ Mermaid ERD, bảng đặc tả chi tiết, Soft Delete (`deleted_at`), Idempotency key, quy tắc Database Transaction (ACID).
  - `docs/API.md`: API versioning `/api/v1/`, Request/Response chi tiết, Pagination metadata, mã lỗi chuẩn, Idempotent event submission.
  - `docs/SECURITY.md`: Ma trận đánh giá rủi ro an ninh OWASP, phân quyền RBAC đa tầng, bảo mật mật khẩu bcrypt, JWT Access/Refresh tokens.
  - `docs/TESTING.md`: Chiến lược cô lập Test DB (`sakura_learning_test`), ma trận test cases chi tiết cho SRS và Question Engine, quy trình chạy kiểm thử.
  - `docs/TASKS.md`: Danh mục task đầy đủ từ Phase 0 đến Phase 3 kèm tiêu chí nghiệm thu và Definition of Done (DoD).
  - `docs/DECISIONS.md`: Bổ sung ADR-006 (Soft Delete) và ADR-007 (Transaction Boundary tại Service).

---

## 3. Bằng Chứng Thực Tế & Đối Soát Nhất Quán

- **Tuân thủ quy tắc**:
  - Chưa tạo code ứng dụng.
  - Chưa cài dependencies.
  - Chưa tạo database MySQL thực tế.
  - Giữ vững các quyết định kiến trúc: Layered Architecture, Monorepo NPM Workspaces, Sliding Window Buffer, Idempotency.
- **Đối soát kỹ thuật**:
  - Schema trong `docs/DATABASE.md` khớp 100% với DTO và API Contracts trong `docs/API.md`.
  - Quy tắc phân lớp trong `docs/ARCHITECTURE.md` tuân thủ nghiêm ngặt chỉ thị: Controller không gọi Repository, không truy cập Database.
