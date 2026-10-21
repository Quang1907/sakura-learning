# DECISIONS — Architecture Decision Records (ADR)

Tài liệu này ghi lại các quyết định kỹ thuật và kiến trúc quan trọng của dự án **Sakura Swipe Learning**, lý do lựa chọn và các đánh đổi (trade-offs).

---

## ADR-001: Lựa chọn Monorepo sử dụng NPM Workspaces

- **Bối cảnh**: Hệ thống bao gồm Web Client, Admin Portal, REST API Service và các định nghĩa kiểu dữ liệu dùng chung (Types, DTOs, Zod Schemas).
- **Quyết định**: Sử dụng NPM Workspaces có sẵn trong Node.js (thay vì Nx hay Turborepo phức tạp ở giai đoạn đầu) để giữ cho dự án đơn giản, nhẹ nhàng và không phụ thuộc công cụ bên thứ ba.
- **Hệ quả**:
  - _Ưu điểm_: Cài đặt nhanh, chia sẻ code trực tiếp giữa `packages/shared` và `apps/*`.
  - _Đánh đổi_: Cần tự cấu hình script build và test song song trong root `package.json`.

---

## ADR-002: Kiến trúc phân tầng nghiêm ngặt (Strict Layered Architecture)

- **Bối cảnh**: Cần tránh việc code logic nghiệp vụ bị phân tán rải rác trong Controller hoặc Database Queries gây khó khăn cho việc viết Unit Test và bảo trì.
- **Quyết định**: Bắt buộc tuân theo luồng `Router -> Controller -> Service -> Repository -> Database`. Controller không gọi Repository trực tiếp, không truy cập database.
- **Hệ quả**:
  - _Ưu điểm_: Dễ viết Unit Test cô lập (Mock Repository khi test Service), logic tập trung, chuẩn hóa luồng xử lý lỗi.
  - _Đánh đổi_: Viết thêm một số boilerplate code giữa các tầng, nhưng hoàn toàn xứng đáng về mặt dài hạn.

---

## ADR-003: Quan hệ đa cấp độ JLPT cho Kanji và Từ vựng

- **Bối cảnh**: Nhiều chữ Kanji hoặc Từ vựng cơ bản xuất hiện ở N5 nhưng có thể tiếp tục được mở rộng ngữ cảnh ở N4, N3.
- **Quyết định**: Không lưu cứng một cột `jlpt_level` duy nhất trong bảng `kanji`, mà tạo bảng liên kết nhiều-nhiều (`kanji_jlpt`).
- **Hệ quả**:
  - _Ưu điểm_: Phản ánh chính xác thực tế học tiếng Nhật, linh hoạt cho việc mở rộng giáo trình.
  - _Đánh đổi_: Cần JOIN bảng khi truy vấn theo cấp độ JLPT.

---

## ADR-004: Cơ chế Idempotency cho cập nhật tiến trình học

- **Bối cảnh**: Thiết bị di động thường xuyên gặp tình trạng mạng chập chờn, khiến client tự động gửi lại request (retry) hoặc người dùng bấm chạm liên tục.
- **Quyết định**: Yêu cầu client sinh `clientEventId` (UUID v4) cho mỗi tương tác học tập và lưu trong bảng `learning_events` với ràng buộc `UNIQUE`.
- **Hệ quả**:
  - _Ưu điểm_: Đảm bảo không bao giờ bị cộng thừa điểm kinh nghiệm, không làm sai lệch chu kỳ ôn tập SRS khi bị lặp request.
  - _Đánh đổi_: Server phải kiểm tra bảng `learning_events` trước khi xử lý logic nghiệp vụ.

---

## ADR-005: Sliding Window Buffer cho giao diện vuốt di động

- **Bối cảnh**: Nếu render hàng trăm thẻ vào DOM cùng một lúc trên trình duyệt di động (Safari/Chrome trên iPhone), ứng dụng sẽ bị giật lag, tiêu tốn RAM và giảm thời lượng pin.
- **Quyết định**: Chỉ duy trì 3-5 phần tử DOM trong cửa sổ trượt (Thẻ trước, Thẻ hiện tại, Thẻ chuẩn bị nạp).
- **Hệ quả**:
  - _Ưu điểm_: Hiệu năng mượt mà 60fps, tiết kiệm tài nguyên.
  - _Đánh đổi_: Quản lý state của mảng thẻ phức tạp hơn một danh sách tĩnh thông thường.

---

## ADR-006: Cơ chế Soft Delete cho các thực thể nội dung học tập

- **Bối cảnh**: Khi Admin xóa một chữ Kanji hoặc Từ vựng đã xuất bản, nếu dùng Hard Delete (`DELETE FROM`), tất cả bản ghi tiến trình học tập (`user_progress`), lịch sử thao tác (`learning_events`) của hàng ngàn học viên sẽ bị xóa theo (Cascade) hoặc gây lỗi vi phạm khóa ngoại.
- **Quyết định**: Sử dụng cột `deleted_at DATETIME NULL` cho các bảng kiến thức (`kanji`, `vocabulary`, `grammar`, `sentences`, `questions`). Truy vấn thông thường sẽ lọc `WHERE deleted_at IS NULL`.
- **Hệ quả**:
  - _Ưu điểm_: Bảo toàn 100% dữ liệu lịch sử và điểm số học viên, có thể phục hồi khi xóa nhầm.
  - _Đánh đổi_: Các câu truy vấn cần thêm điều kiện kiểm tra `deleted_at IS NULL` và thêm index tối ưu.

---

## ADR-007: Ranh giới giao dịch (Transaction Boundary) tại tầng Service

- **Bối cảnh**: Một thao tác nộp bài hoặc vuốt thẻ bao gồm ghi nhật ký sự kiện, tính toán lại SRS, cập nhật EXP và tính chuỗi streak. Nếu xảy ra lỗi giữa chừng, dữ liệu sẽ bị bất nhất.
- **Quyết định**: Ranh giới Database Transaction được kiểm soát tại tầng Service. Mọi thao tác cập nhật tiến trình phải nằm trọn trong một Transaction với mức cô lập `READ COMMITTED`.
- **Hệ quả**:
  - _Ưu điểm_: Đảm bảo tính toàn vẹn tuyệt đối (ACID).
  - _Đánh đổi_: Cần truyền Connection/Client qua các Repository methods trong cùng transaction context.

---

## ADR-008: Xử lý quan hệ Đa hình và Bảo vệ Toàn vẹn Dữ liệu 3 Lớp

- **Bối cảnh**: `user_progress` và `learning_events` cần theo dõi tiến trình của nhiều loại kiến thức khác nhau (Kanji, Từ vựng, Ngữ pháp). MySQL không hỗ trợ Foreign Key trực tiếp trên composite polymorphic `(item_type, item_id)`.
- **Quyết định**: Áp dụng mô hình bảo vệ 3 lớp: (1) Validation Enum bằng Zod ở Middleware, (2) Kiểm tra ID tồn tại trong Database tại Service, (3) Áp dụng Soft Delete để bản ghi cha không bao giờ bị xóa cứng.
- **Hệ quả**:
  - _Ưu điểm_: Cấu trúc bảng gọn gàng, thuật toán Feed dễ dàng query chung 1 bảng mà không cần UNION.
  - _Đánh đổi_: Cần viết kiểm tra thủ công trong Service thay vì dựa hoàn toàn vào Database Constraint.

---

## ADR-009: Triển khai Nền móng Auth Tối giản (Minimal Auth) ngay trong Phase 1

- **Bối cảnh**: Ban đầu Authentication được xếp ở Phase 5. Tuy nhiên, Phase 3 (First End-to-End Module) lại cần `user_id` để ghi nhận tiến trình học và cần kiểm tra quyền `ADMIN` cho API tạo Kanji. Nếu hoãn Auth đến Phase 5, Phase 3 sẽ buộc phải dùng mã giả / hardcoded `user_id` và sau đó phải viết lại toàn bộ router.
- **Quyết định**: Đưa phần Minimal Auth (JWT Helper, Auth Middleware, seed tài khoản test `admin@sakura.app` và `user@sakura.app`) vào `TASK-P1-006` của Phase 1. Giữ Phase 5 cho Full User Management (Đăng ký, Quên mật khẩu, Profile, Phân quyền RBAC nâng cao, Import/Export).
- **Hệ quả**:
  - _Ưu điểm_: Đảm bảo tính liên tục của kiến trúc, Phase 3 có sẵn cơ chế bảo mật thật và gắn đúng tiến trình học viên.
  - _Đánh đổi_: Phase 1 tăng thêm 1 task nhỏ, nhưng giảm thiểu rủi ro refactor lớn về sau.

---

## ADR-010: Thống nhất mô hình câu ví dụ dùng chung (`sentences`) và kiến trúc thẻ vuốt đa dạng (Phase 4)

- **Bối cảnh**: Hệ thống mở rộng sang Từ vựng và Ngữ pháp. Cả hai thực thể này đều liên kết với các câu ví dụ minh họa song ngữ Nhật - Việt, kèm theo yêu cầu trải nghiệm học vuốt thẻ hỗ trợ đa loại hình nội dung (Kanji, Vocabulary, Grammar, Question).
- **Quyết định**:
  1. Sử dụng bảng `sentences` dùng chung với hai khóa ngoại tùy chọn `vocab_id` và `grammar_id`, tránh nhân bản câu ví dụ giữa các bảng.
  2. Mở rộng `ContentRepository` và `FeedService` để phân phối mượt mà các loại thẻ theo bộ lọc người dùng (`ALL`, `KANJI`, `VOCABULARY`, `GRAMMAR`), đồng thời đảm bảo quy tắc Anti-Fatigue (câu hỏi không bao giờ xuất hiện liên tiếp) và Anti-Repetition.
  3. Trên giao diện Web và Mobile, cấm hành vi vuốt ngang qua thẻ câu hỏi khi người dùng chưa gửi đáp án nhằm bảo đảm tính trung thực của kiểm tra kiến thức.
- **Hệ quả**:
  - _Ưu điểm_: Cơ sở dữ liệu chuẩn hóa, tái sử dụng tối đa câu ví dụ, trải nghiệm vuốt thích ứng theo mục tiêu học tập của từng học viên.
  - _Đánh đổi_: Logic lọc và lắp ghép thẻ tại `FeedEngineService` cần phối hợp nhiều nguồn dữ liệu hơn.
