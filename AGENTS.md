# AGENTS.md — Coding Standards & Operating Rules for Sakura Swipe Learning

Tài liệu này định nghĩa các nguyên tắc làm việc, tiêu chuẩn lập trình, kiến trúc hệ thống và quy trình kiểm thử bắt buộc đối với tất cả các kỹ sư và AI agent tham gia phát triển dự án **Sakura Swipe Learning**.

---

## 1. Nguyên Tắc Cốt Lõi (Core Principles)

1. **Evidence-Based Engineering**: Không bao giờ báo cáo hoàn thành một tính năng hay sửa lỗi nếu chưa có bằng chứng thực tế (test results, logs, build output).
2. **Predictable Architecture**: Tuyệt đối tuân thủ mô hình phân lớp (Layered Architecture). Không nhảy lớp, không gọi chéo.
3. **Zero Secret Leakage**: Không bao giờ commit secret, API keys, password vào source control. Mọi cấu hình nhạy cảm phải thông qua biến môi trường (.env / .env.example).
4. **Data Integrity First**: Database schema phải có ràng buộc toàn vẹn dữ liệu (Foreign Keys, Unique Indexes, Not Null, Enum constraints, Transactions cho các thao tác nghiệp vụ phức tạp).
5. **No Blind Refactoring**: Không tự ý thay đổi API schema hoặc database schema mà không cập nhật tài liệu và kiểm thử hồi quy. Không xóa hay viết lại code ngoài phạm vi của task được giao.

---

## 2. Tiêu Chuẩn Kỹ Thuật (Tech Stack & Conventions)

### 2.1. Cấu Trúc Monorepo (NPM Workspaces)
```
/
├── apps/
│   ├── web/          # Frontend chính (React, Vite, TypeScript, TailwindCSS, Mobile-first)
│   ├── admin/        # Cổng quản trị và kiểm duyệt nội dung (React, Vite, TypeScript)
│   └── api/          # Backend REST API (Node.js, Express/Fastify, TypeScript, MySQL)
├── packages/
│   └── shared/       # Shared DTOs, types, constants, validation schemas (Zod)
├── docs/             # Bộ nhớ dự án và tài liệu đặc tả kỹ thuật
└── package.json
```

### 2.2. Quy Tắc Backend Phân Lớp (Layered Architecture)
Tất cả các module backend trong `apps/api` phải tuân theo luồng xử lý nghiêm ngặt:
`Router -> Middleware -> Controller -> Service -> Repository -> Database`

- **Router**: Chỉ định nghĩa đường dẫn HTTP, HTTP method, và gắn middleware (auth, validate). Không chứa logic nghiệp vụ.
- **Middleware**: Xử lý authentication, authorization, rate limiting, request context, validation handler.
- **Controller**: Nhận request từ HTTP, bóc tách DTO, gọi Service tương ứng, định dạng HTTP Response chuẩn JSON. Không được gọi trực tiếp Repository, không truy cập database.
- **Service**: Nơi chứa toàn bộ Business Logic. Quản lý luồng nghiệp vụ, tính toán điểm, thuật toán SRS (Spaced Repetition), điều phối nhiều Repository và quản lý Database Transactions.
- **Repository**: Chịu trách nhiệm trực tiếp truy vấn dữ liệu từ MySQL (SQL queries / Query Builder / ORM mapping). Không chứa logic nghiệp vụ.
- **DTO & Validation**: Mọi dữ liệu đầu vào (Request body, params, query) phải được validate thông qua schema (Zod) trước khi vào Controller/Service.

### 2.3. Quy Tắc Frontend (Mobile-first & Swipe Experience)
- **Thiết kế Mobile-first**: Tối ưu tuyệt đối cho màn hình cảm ứng dọc (iPhone/Android), responsive linh hoạt trên Tablet và Desktop.
- **Chủ đề Visual**: Phong cách Sakura / Anime thẩm mỹ cao, tone màu hồng hoa anh đào, trắng sứ, xám dịu và chế độ Dark Mode tinh tế.
- **Trải nghiệm Vuốt (Gestures)**:
  - Vuốt dọc: Lên (thẻ tiếp theo), Xuống (thẻ trước nếu còn trong lịch sử phiên).
  - Vuốt ngang: Phải (Đã biết/Nhớ), Trái (Học lại/Quên).
  - Thẻ câu hỏi: Chỉ cho phép vuốt tiếp sau khi đã tương tác trả lời và xem giải thích.
  - Phải luôn có nút bấm trợ năng (Accessibility buttons) tương đương cho mọi thao tác vuốt.

---

## 3. Quy Trình Làm Việc Khi Thực Hiện Task

1. **Trước khi sửa code**:
   - Đọc các tài liệu trong `docs/` để nắm rõ bối cảnh.
   - Xác định rõ `Task ID` từ `docs/TASKS.md`.
   - Xác định danh sách file bị ảnh hưởng, rủi ro tiềm ẩn và tiêu chí nghiệm thu (Acceptance Criteria).
2. **Trong khi sửa code**:
   - Thực hiện thay đổi nhỏ, có kiểm soát và tập trung vào mục tiêu của task.
   - Tuân thủ TypeScript strict mode, không dùng `any` bừa bãi.
   - Thêm unit test hoặc integration test cho logic mới tạo.
3. **Sau khi sửa code**:
   - Chạy test kiểm thử (`npm run test`, `npm run build`, `npm run lint`).
   - Kiểm tra `git diff` để đảm bảo không có file lạ, secret hay code thừa.
   - Cập nhật tài liệu: `docs/PROJECT_STATUS.md`, `docs/TASKS.md`, `docs/DECISIONS.md`.
   - Báo cáo kết quả và bằng chứng thực tế cho Technical Lead/User.
