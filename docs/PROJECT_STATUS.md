# PROJECT STATUS — Sakura Swipe Learning Current State

_Cập nhật lần cuối: 2026-10-21T11:20:00+09:00_

---

## 1. Tổng Quan Tiến Độ

| Mục                          | Trạng thái hiện tại                                                                                                    |
| :--------------------------- | :--------------------------------------------------------------------------------------------------------------------- |
| **Phase hiện tại**           | **Phase 4 — Learning Experience & Swipe-Based Learning (Vocabulary & Grammar Full-Stack)** (Hoàn tất 100%)             |
| **Tiến độ Phase 4**          | **100%** (Đã hoàn thành toàn bộ TASK-P4-001 đến TASK-P4-005)                                                          |
| **Task vừa hoàn thành**      | `TASK-P4-005` (Mở rộng Swipe Feed tích hợp đa nội dung & Thống kê học tập `LearningStatsModal`)                         |
| **Task tiếp theo**           | `TASK-P5-001` (Hoàn thiện luồng Đăng ký & Đăng nhập người dùng công khai - Bắt đầu Phase 5)                             |
| **Blocker hiện tại**         | **Không có**                                                                                                           |
| **Bước tiếp theo chính xác** | Sẵn sàng chuyển sang Phase 5 — Full User Management & Content Governance: xác thực JWT công khai, phân quyền RBAC và công cụ import dữ liệu. |

---

## 2. Bằng Chứng Thực Tế & Kết Quả Kiểm Thử (Phase 4)

- **Test Suite Thực Tế (`npm test`)**:
  - **111/111 tests passed** trên toàn bộ 14 test files (100% pass, 0 failed, 0 skipped).
  - Bao phủ toàn diện:
    - Shared Zod Schemas & DTOs cho Kanji, Vocabulary, Grammar, Question, Feed, Progress (18 tests)
    - Frontend Card Components: VocabularyCard, GrammarCard, KanjiCard (3 tests)
    - SRS Spaced Repetition SM-2 logic (14 tests)
    - Feed Engine 60/30/10, Anti-Fatigue & Anti-Repetition (8 tests)
    - Question Grading & Normalization (10 tests)
    - Auth & JWT Helper (4 tests)
    - Supertest Health & Routing API (2 tests)
    - Supertest Core Learning Engine API: Feed, Progress Idempotency, Question Submission (12 tests)
    - Supertest Kanji Public & Admin Management API (12 tests)
    - Supertest Vocabulary Public & Admin Management API (11 tests)
    - Supertest Grammar Public & Admin Management API (11 tests)
- **TypeScript Strict Type Check (`npm run type-check`)**:
  - `tsc --build` pass 100% cho cả 4 workspace: `@sakura/shared`, `@sakura/api`, `@sakura/web`, `@sakura/admin`.
- **Linter (`npm run lint`)**:
  - ESLint Flat Config pass sạch sẽ: **0 errors, 0 warnings**.
- **Chi Tiết Các Thành Phần Hoàn Thành**:
  1. `TASK-P4-001` (Vocabulary Module End-to-End):
     - Phân lớp chuẩn: `VocabularyRepository` <-> `VocabularyService` <-> `VocabularyController` <-> `VocabularyRouter`.
     - Lưu trữ từ vựng, cấp độ JLPT, Kanji liên kết, câu ví dụ minh họa và âm thanh.
     - Endpoints công khai: `GET /api/v1/vocabulary`, `GET /api/v1/vocabulary/:id` (lọc JLPT, tìm kiếm romaji/reading, phân trang).
     - Endpoints quản trị: `POST/PUT/DELETE /api/v1/admin/vocabulary` với xác thực RBAC (`ADMIN`, `MODERATOR`).
  2. `TASK-P4-002` (Grammar Module End-to-End):
     - Phân lớp chuẩn: `GrammarRepository` <-> `GrammarService` <-> `GrammarController` <-> `GrammarRouter`.
     - Lưu trữ mẫu ngữ pháp, cấu trúc câu, ý nghĩa tiếng Việt, ghi chú sử dụng và câu ví dụ minh họa.
     - Endpoints công khai: `GET /api/v1/grammar`, `GET /api/v1/grammar/:id`.
     - Endpoints quản trị: `POST/PUT/DELETE /api/v1/admin/grammar`.
  3. `TASK-P4-003` (Web App Mở Rộng: Vocabulary & Grammar UI):
     - `VocabularyCard`: Hiển thị chữ Kanji/Kana, Furigana, Romaji, phát âm Web Speech API `ja-JP`, câu ví dụ và Kanji liên kết.
     - `GrammarCard`: Hiển thị mẫu ngữ pháp, công thức cấu trúc, ý nghĩa, ghi chú và câu ví dụ song ngữ.
     - `VocabularyExplorer` & `GrammarExplorer`: Giao diện tra cứu, tìm kiếm tức thì và lọc JLPT N5..N1.
  4. `TASK-P4-004` (Admin App Quản Lý Đa Nội Dung):
     - `VocabularyTable` & `VocabularyFormModal`: Quản trị từ vựng, loại từ, cấp độ JLPT, câu ví dụ.
     - `GrammarTable` & `GrammarFormModal`: Quản trị mẫu ngữ pháp, cấu trúc và hướng dẫn sử dụng.
     - Điều hướng tab linh hoạt giữa Kanji, Từ vựng và Ngữ pháp.
  5. `TASK-P4-005` (Swipe Feed Đa Dạng & Thống Kê Học Tập):
     - `KanjiSwipeFeed` nâng cấp hỗ trợ đa dạng thẻ (`KANJI`, `VOCABULARY`, `GRAMMAR`, `QUESTION`).
     - Bộ lọc kép: Cấp độ JLPT (N5..N1) và Loại nội dung (Tất cả, Kanji, Từ vựng, Ngữ pháp).
     - Cử chỉ vuốt chuẩn Mobile: Vuốt lên (thẻ kế), vuốt xuống (thẻ trước), vuốt phải (đã thuộc), vuốt trái (cần học lại).
     - Ràng buộc an toàn: Không thể vuốt qua câu hỏi chưa trả lời bằng cử chỉ ngang.
     - `LearningStatsModal`: Hiển thị số liệu thực tế từ `/api/v1/progress/stats` (tổng thẻ, đã thành thạo SRS 5-8, đang học SRS 1-4, đến hạn ôn và phân loại theo JLPT).

---

## 3. Nhật Ký Trạng Thái Git

- **Branch**: `main`
- **File mới tạo Phase 4**:
  - `packages/shared/src/schemas/vocabulary.schema.ts`
  - `packages/shared/src/schemas/grammar.schema.ts`
  - `apps/api/src/modules/vocabulary/vocabulary.repository.ts`
  - `apps/api/src/modules/vocabulary/vocabulary.service.ts`
  - `apps/api/src/modules/vocabulary/vocabulary.controller.ts`
  - `apps/api/src/modules/vocabulary/vocabulary.router.ts`
  - `apps/api/src/modules/vocabulary/vocabulary.integration.test.ts`
  - `apps/api/src/modules/grammar/grammar.repository.ts`
  - `apps/api/src/modules/grammar/grammar.service.ts`
  - `apps/api/src/modules/grammar/grammar.controller.ts`
  - `apps/api/src/modules/grammar/grammar.router.ts`
  - `apps/api/src/modules/grammar/grammar.integration.test.ts`
  - `apps/web/src/components/VocabularyCard.tsx`
  - `apps/web/src/components/VocabularyExplorer.tsx`
  - `apps/web/src/components/GrammarCard.tsx`
  - `apps/web/src/components/GrammarExplorer.tsx`
  - `apps/web/src/components/LearningStatsModal.tsx`
  - `apps/web/src/components/cards.test.tsx`
  - `apps/admin/src/components/VocabularyTable.tsx`
  - `apps/admin/src/components/VocabularyFormModal.tsx`
  - `apps/admin/src/components/GrammarTable.tsx`
  - `apps/admin/src/components/GrammarFormModal.tsx`
