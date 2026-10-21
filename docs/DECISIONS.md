# DECISIONS — Architecture Decision Records (ADR)

Tài liệu này ghi lại các quyết định kỹ thuật và kiến trúc quan trọng của dự án **Sakura Swipe Learning**, lý do lựa chọn và các đánh đổi (trade-offs).

---

## ADR-001: Lựa chọn Monorepo sử dụng NPM Workspaces
- **Bối cảnh**: Hệ thống bao gồm Web Client, Admin Portal, REST API Service và các định nghĩa kiểu dữ liệu dùng chung (Types, DTOs, Zod Schemas).
- **Quyết định**: Sử dụng NPM Workspaces có sẵn trong Node.js (thay vì Nx hay Turborepo phức tạp ở giai đoạn đầu) để giữ cho dự án đơn giản, nhẹ nhàng và không phụ thuộc công cụ bên thứ ba.
- **Hệ quả**:
  - *Ưu điểm*: Cài đặt nhanh, chia sẻ code trực tiếp giữa `packages/shared` và `apps/*`.
  - *Đánh đổi*: Cần tự cấu hình script build và test song song trong root `package.json`.

---

## ADR-002: Kiến trúc phân tầng nghiêm ngặt (Strict Layered Architecture)
- **Bối cảnh**: Cần tránh việc code logic nghiệp vụ bị phân tán rải rác trong Controller hoặc Database Queries gây khó khăn cho việc viết Unit Test và bảo trì.
- **Quyết định**: Bắt buộc tuân theo luồng `Router -> Controller -> Service -> Repository -> Database`.
- **Hệ quả**:
  - *Ưu điểm*: Dễ viết Unit Test cô lập (Mock Repository khi test Service), logic tập trung, chuẩn hóa luồng xử lý lỗi.
  - *Đánh đổi*: Viết thêm một số boilerplate code giữa các tầng, nhưng hoàn toàn xứng đáng về mặt dài hạn.

---

## ADR-003: Quan hệ đa cấp độ JLPT cho Kanji và Từ vựng
- **Bối cảnh**: Nhiều chữ Kanji hoặc Từ vựng cơ bản xuất hiện ở N5 nhưng có thể tiếp tục được mở rộng ngữ cảnh ở N4, N3.
- **Quyết định**: Không lưu cứng một cột `jlpt_level` duy nhất trong bảng `kanji`, mà tạo bảng liên kết nhiều-nhiều (`kanji_jlpt`).
- **Hệ quả**:
  - *Ưu điểm*: Phản ánh chính xác thực tế học tiếng Nhật, linh hoạt cho việc mở rộng giáo trình.
  - *Đánh đổi*: Cần JOIN bảng khi truy vấn theo cấp độ JLPT.

---

## ADR-004: Cơ chế Idempotency cho cập nhật tiến trình học
- **Bối cảnh**: Thiết bị di động thường xuyên gặp tình trạng mạng chập chờn, khiến client tự động gửi lại request (retry) hoặc người dùng bấm chạm liên tục.
- **Quyết định**: Yêu cầu client sinh `clientEventId` (UUID v4) cho mỗi tương tác học tập và lưu trong bảng `learning_events` với ràng buộc `UNIQUE`.
- **Hệ quả**:
  - *Ưu điểm*: Đảm bảo không bao giờ bị cộng thừa điểm kinh nghiệm, không làm sai lệch chu kỳ ôn tập SRS khi bị lặp request.
  - *Đánh đổi*: Server phải kiểm tra bảng `learning_events` trước khi xử lý logic nghiệp vụ.

---

## ADR-005: Sliding Window Buffer cho giao diện vuốt di động
- **Bối cảnh**: Nếu render hàng trăm thẻ vào DOM cùng một lúc trên trình duyệt di động (Safari/Chrome trên iPhone), ứng dụng sẽ bị giật lag, tiêu tốn RAM và giảm thời lượng pin.
- **Quyết định**: Chỉ duy trì 3-5 phần tử DOM trong cửa sổ trượt (Thẻ trước, Thẻ hiện tại, Thẻ chuẩn bị nạp).
- **Hệ quả**:
  - *Ưu điểm*: Hiệu năng mượt mà 60fps, tiết kiệm tài nguyên.
  - *Đánh đổi*: Quản lý state của mảng thẻ phức tạp hơn một danh sách tĩnh thông thường.
