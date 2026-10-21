# TESTING — Sakura Swipe Learning Test Strategy & Quality Assurance

## 1. Triết Lý Kiểm Thử

- **Bằng chứng là tối thượng (Evidence-First)**: Không một tính năng hay bản sửa lỗi nào được coi là hoàn thành nếu không có log chạy test thành công thực tế đính kèm trong báo cáo.
- **Kim tự tháp kiểm thử (Test Pyramid)**: Tập trung kiểm thử tự động nhiều nhất ở Unit Test (Service logic, thuật toán SRS), tiếp theo là Integration Test (API Endpoints, Database transactions) và cuối cùng là End-to-End Test cho trải nghiệm vuốt (Swipe UX).

---

## 2. Phân Tầng Kiểm Thử & Công Cụ (Test Levels & Tools)

| Tầng kiểm thử        | Công cụ / Thư viện             | Phạm vi áp dụng                                                                        | Mục tiêu Coverage       |
| :------------------- | :----------------------------- | :------------------------------------------------------------------------------------- | :---------------------- |
| **Unit Test**        | Vitest                         | Business Services (FeedEngineService, SrsService, QuestionGradingService), Zod Schemas | >= 85% dòng lệnh        |
| **Integration Test** | Vitest + Supertest             | API Routers, Middleware, Controllers, Database Repositories với MySQL Test DB          | >= 75% endpoints        |
| **Component Test**   | Vitest + React Testing Library | Thẻ Kanji, Thẻ Từ vựng, Thẻ Câu hỏi, Thanh điều khiển trợ năng                         | Các tương tác giao diện |
| **E2E Test**         | Playwright                     | Toàn bộ luồng người học từ Đăng nhập -> Vuốt thẻ -> Làm bài -> Cập nhật streak         | Luồng người dùng chính  |
| **Mobile UX & Perf** | Lighthouse CI                  | Kiểm tra 60fps khi vuốt, PWA manifest, SEO và tính tiếp cận (Accessibility)            | Điểm số >= 90           |

---

## 3. Chiến Lược Cô Lập Cơ Sở Dữ Liệu Test (Test Database Isolation)

Để tránh làm sai lệch dữ liệu thử nghiệm trong quá trình phát triển:

1. **Database riêng biệt**: Integration tests sử dụng cơ sở dữ liệu riêng `sakura_learning_test`.
2. **Setup & Teardown**:
   - Trước khi chạy test suite: Chạy migration để đảm bảo cấu trúc bảng mới nhất.
   - Trước mỗi test case (`beforeEach`): Sử dụng Transaction rollback hoặc truncate các bảng ghi nhận tiến trình (`learning_events`, `user_progress`, `answer_submissions`) để đảm bảo tính độc lập tuyệt đối giữa các bài test.
3. **Seed Data Chuẩn**: Nạp sẵn một bộ từ điển mẫu (10 Kanji N5, 10 Từ vựng N5, 5 Câu hỏi) cố định phục vụ cho việc kiểm thử feed.

---

## 4. Ma Trận Kiểm Thử Nghiệp Vụ Cốt Lõi (Core Test Matrix)

### 4.1. Thuật Toán SRS & Feed Engine

- **TC-SRS-01 (Tỷ lệ phân phối 60/30/10)**:
  - _Input_: Học viên N5 có 20 thẻ đã học, 5 thẻ đến hạn ôn, 5 câu hỏi trong ngân hàng. Yêu cầu nạp 10 thẻ.
  - _Expected_: Trả về xấp xỉ 6 thẻ mới, 3 thẻ ôn tập, 1 thẻ câu hỏi.
- **TC-SRS-02 (Quy tắc chống lặp thẻ)**:
  - _Input_: Lấy 10 thẻ tiếp theo.
  - _Expected_: Không có bất kỳ thẻ Kanji nào xuất hiện 2 lần trong 10 thẻ gần nhất.
- **TC-SRS-03 (Chống câu hỏi liên tiếp)**:
  - _Input_: Hàng đợi sinh ra ngẫu nhiên có 2 câu hỏi.
  - _Expected_: Feed Engine tự động xen kẽ ít nhất 1 thẻ kiến thức giữa 2 câu hỏi.
- **TC-SRS-04 (Cập nhật SRS khi vuốt Đã Nhớ)**:
  - _Input_: Thẻ đang ở `srs_stage = 0`, nhận action `SWIPE_RIGHT_KNOWN`.
  - _Expected_: `srs_stage` tăng lên 1, `next_review_at` giãn ra sau 4 giờ.
- **TC-SRS-05 (Cập nhật SRS khi vuốt Cần Học Lại)**:
  - _Input_: Thẻ đang ở `srs_stage = 4`, nhận action `SWIPE_LEFT_AGAIN`.
  - _Expected_: `srs_stage` lùi về 2, `next_review_at` đặt về 4 giờ sau.

### 4.2. Chấm Điểm & Động Cơ Câu Hỏi (Question Engine)

- **TC-QST-01 (Trắc nghiệm A/B/C/D)**:
  - _Input_: Gửi `selectedOptionId = 1` (đúng).
  - _Expected_: `isCorrect = true`, trả về giải thích, cập nhật SRS stage tăng.
- **TC-QST-02 (Tự luận điền cách đọc - Nhiều biến thể)**:
  - _Input_: Kanji 日 trong 日本, chấp nhận: `["に", "ni", "Ni"]`.
  - _Expected_: Nhập "ni" -> Pass; Nhập "nichi" -> Fail, giải thích chi tiết.

### 4.3. Chống Trùng Lặp Tiến Trình (Idempotency)

- **TC-IDEM-01 (Gửi lặp cùng Client Event ID)**:
  - _Input_: Gửi cùng một `clientEventId` 2 lần liên tiếp với payload giống hệt nhau.
  - _Expected_: Cả 2 lần đều trả về 200 OK; tổng số EXP của người dùng chỉ được cộng đúng 1 lần duy nhất; bảng `learning_events` chỉ có đúng 1 bản ghi.

---

## 5. Quy Trình Chạy Kiểm Thử Bắt Buộc

Trước khi commit bất kỳ thay đổi nào:

```bash
# 1. Kiểm tra cú pháp và kiểu dữ liệu TypeScript
npm run lint
npm run type-check

# 2. Chạy toàn bộ Unit & Integration tests
npm run test

# 3. Chạy kiểm thử có đo độ bao phủ code
npm run test:coverage
```
