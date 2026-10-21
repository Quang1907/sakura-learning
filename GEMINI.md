# GEMINI.md — Instructions for Gemini & AI Coding Agents

Tài liệu này cung cấp chỉ dẫn bắt buộc cho Gemini và các AI coding assistants khi làm việc trên kho mã nguồn **Sakura Swipe Learning**.

---

## 1. Bản Đồ Tài Liệu Dự Án (Project Memory Map)

Trước khi thực hiện bất kỳ thao tác nào (phân tích, tạo file, sửa code), bạn **BẮT BUỘC** phải đọc và tham chiếu các tài liệu tương ứng trong thư mục `docs/`:

| Tài liệu                 | Mục đích & Nội dung                                                                    |
| :----------------------- | :------------------------------------------------------------------------------------- |
| `docs/PRD.md`            | Bản mô tả yêu cầu sản phẩm, hành trình người dùng, các dạng câu hỏi và nội dung học    |
| `docs/ARCHITECTURE.md`   | Kiến trúc hệ thống, phân lớp backend, luồng frontend swipe feed, thuật toán nội dung   |
| `docs/DATABASE.md`       | Thiết kế cơ sở dữ liệu MySQL, ERD, Schema, Index, quan hệ N5-N1                        |
| `docs/API.md`            | Đặc tả REST API contracts, định dạng request/response, mã lỗi, authentication          |
| `docs/SECURITY.md`       | Chiến lược bảo mật, hash mật khẩu, JWT, RBAC (User/Admin), phòng chống SQLi/XSS        |
| `docs/TESTING.md`        | Chiến lược kiểm thử tự động, tiêu chí nghiệm thu, coverage target                      |
| `docs/ROADMAP.md`        | Lộ trình phát triển qua các phase từ Phase 0 đến Phase 6                               |
| `docs/PROJECT_STATUS.md` | Trạng thái hiện tại của dự án: phase hiện tại, task đang làm, blocker, bước tiếp theo  |
| `docs/TASKS.md`          | Danh sách task chi tiết có mã định danh (Task ID), dependencies và acceptance criteria |
| `docs/DECISIONS.md`      | Nhật ký ghi nhận các quyết định kiến trúc quan trọng (ADR)                             |
| `docs/KNOWN_ISSUES.md`   | Danh sách các lỗi tồn đọng, giới hạn kỹ thuật và phương án xử lý                       |

---

## 2. Quy Định Hành Vi Của AI Agent

1. **Không tạo thông tin giả (Hallucination)**: Không bao giờ tuyên bố tính năng đã chạy, test đã pass nếu bạn chưa trực tiếp chạy lệnh trên terminal và kiểm tra output.
2. **Không sửa đổi cấu trúc lớn tùy tiện**: Mọi thay đổi về database schema hoặc API contract đều phải được ghi nhận vào `docs/DECISIONS.md` và cập nhật tài liệu tương ứng trước khi sửa code.
3. **Cập nhật trạng thái sau mỗi phiên làm việc**:
   - Cập nhật tiến độ task trong `docs/TASKS.md`.
   - Cập nhật `docs/PROJECT_STATUS.md` với bằng chứng thực tế (git status, log, test output).
   - Đưa ra prompt bàn giao rõ ràng để phiên làm việc tiếp theo có thể tiếp tục liền mạch.
4. **Tuân thủ quy tắc Layered Architecture**:
   - Controller KHÔNG ĐƯỢC gọi Repository hay execute SQL query.
   - Luôn đặt logic nghiệp vụ tại Service.
   - Luôn validate input bằng schema ở tầng ngoài cùng.
