# TESTING — Sakura Swipe Learning Test Strategy & Quality Assurance

## 1. Triết Lý Kiểm Thử

- **Bằng chứng là tối thượng (Evidence-First)**: Không một tính năng hay bản sửa lỗi nào được coi là hoàn thành nếu không có log chạy test thành công thực tế đính kèm trong báo cáo.
- **Kim tự tháp kiểm thử (Test Pyramid)**: Tập trung kiểm thử tự động nhiều nhất ở Unit Test (Service logic, thuật toán SRS), tiếp theo là Integration Test (API Endpoints, Database transactions) và cuối cùng là End-to-End Test cho trải nghiệm vuốt (Swipe UX).

---

## 2. Phân Tầng Kiểm Thử (Test Levels & Tools)

| Tầng kiểm thử | Công cụ / Thư viện | Phạm vi áp dụng | Mục tiêu Coverage |
| :--- | :--- | :--- | :--- |
| **Unit Test** | Vitest | Business Services (FeedEngineService, SrsService, QuestionGradingService), Zod Schemas | >= 85% dòng lệnh |
| **Integration Test** | Vitest + Supertest | API Routers, Middleware, Controllers, Database Repositories với MySQL Test DB | >= 75% endpoints |
| **Component Test** | Vitest + React Testing Library | Thẻ Kanji, Thẻ Từ vựng, Thẻ Câu hỏi, Nút bấm trợ năng | Các tương tác cốt lõi |
| **E2E Test** | Playwright | Luồng học sinh từ Đăng nhập -> Vuốt thẻ -> Trả lời câu hỏi -> Cập nhật streak | Luồng Critical Path |

---

## 3. Ma Trận Kiểm Thử Nghiệp Vụ Cốt Lõi (Core Test Matrix)

### 3.1. Thuật Toán SRS & Feed Engine
- **Test Case 1 (Tỷ lệ phân phối)**: Gọi `FeedEngineService.generateFeed(user)` với 10 thẻ; kiểm tra kết quả trả về đúng tỷ lệ ~60% mới, ~30% ôn, ~10% câu hỏi.
- **Test Case 2 (Chống lặp)**: Đảm bảo không có cùng 1 Kanji xuất hiện 2 lần trong 10 thẻ gần nhất.
- **Test Case 3 (Không câu hỏi liên tiếp)**: Đảm bảo giữa 2 thẻ câu hỏi luôn có ít nhất 1 thẻ kiến thức.
- **Test Case 4 (Tính toán SRS khi đúng/sai)**:
  - Khi người dùng vuốt "Đã biết" hoặc trả lời đúng: `srs_stage` tăng 1, `next_review_at` giãn ra (1 ngày -> 3 ngày -> 7 ngày...).
  - Khi vuốt "Cần học lại" hoặc trả lời sai: `srs_stage` đặt lại về 0 hoặc 1, `next_review_at` đặt về 4 - 8 giờ sau.

### 3.2. Chấm Điểm Câu Hỏi (Question Grading Engine)
- **Test Case 5 (Trắc nghiệm A/B/C/D)**: Chọn đúng optionId -> trả về `isCorrect: true`, giải thích chi tiết. Chọn sai -> trả về `isCorrect: false`.
- **Test Case 6 (Điền văn bản - Nhiều đáp án chấp nhận)**: Với chữ 日 trong 日本, chấp nhận "に", "ni", "Ni", từ chối "つき", "nichi".

### 3.3. Tính Toàn Vẹn & Chống Trùng Lặp (Idempotency)
- **Test Case 7 (Idempotent Event)**: Gửi cùng một `clientEventId` 2 lần liên tiếp -> Lần thứ 2 trả về kết quả thành công của lần 1 mà không tăng EXP hay thay đổi lại `srs_stage`.

---

## 4. Quy Trình Chạy Kiểm Thử Bắt Buộc

Trước khi commit bất kỳ code nào hoặc bàn giao task:
```bash
# 1. Chạy lint và type check toàn bộ monorepo
npm run lint
npm run type-check

# 2. Chạy toàn bộ Unit & Integration tests
npm run test

# 3. Chạy kiểm thử có báo cáo độ bao phủ
npm run test:coverage
```
