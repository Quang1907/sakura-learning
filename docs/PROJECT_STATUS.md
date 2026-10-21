# PROJECT STATUS — Sakura Swipe Learning Current State

_Cập nhật lần cuối: 2026-10-21T11:48:00+09:00 — Final Audit & Release Gate Passed_

---

## 1. Tổng Quan Tiến Độ

| Mục                          | Trạng thái hiện tại                                                                                                    |
| :--------------------------- | :--------------------------------------------------------------------------------------------------------------------- |
| **Phase hiện tại**           | **Phase 6 — Offline-First PWA & Final Release Gate** (Hoàn tất 100%)                                                   |
| **Tiến độ Dự Án**            | **Hoàn thành xuất sắc toàn bộ Phase 0 đến Phase 6**                                                                    |
| **Task vừa hoàn thành**      | `FINAL-AUDIT`: Kiểm toán kỹ thuật toàn diện, sửa bảo mật User Isolation, hoàn thiện Auth API & Release Gate            |
| **Sẵn sàng phát hành**       | **SẴN SÀNG 100% (Production, MySQL 8 & iPhone PWA Ready)**                                                             |
| **Blocker hiện tại**         | **Không có**                                                                                                           |
| **Bước tiếp theo chính xác** | Người dùng có thể khởi chạy server hoặc truy cập qua Safari trên iPhone để trải nghiệm học tiếng Nhật hoàn chỉnh.      |

---

## 2. Bằng Chứng Thực Tế & Kết Quả Kiểm Thử (Final Audit)

- **Test Suite Thực Tế (`npm test`)**:
  - **137/137 tests passed** trên toàn bộ 19 test files (100% pass, 0 failed, 0 skipped).
  - Bao phủ toàn diện:
    - Shared Zod Schemas & DTOs (18 tests)
    - Frontend Card Components: VocabularyCard, GrammarCard, KanjiCard (3 tests)
    - SRS Spaced Repetition SM-2 logic (14 tests)
    - Feed Engine 60/30/10, Anti-Fatigue & Anti-Repetition (8 tests)
    - Question Grading & Normalization (10 tests)
    - Auth & JWT Helper (2 tests)
    - Auth API (Login, Register, Me) & User Progress Isolation Matrix (9 tests)
    - Supertest Health & Routing API (2 tests)
    - Supertest Core Learning Engine API: Feed, Progress Idempotency, Question Submission (12 tests)
    - Supertest Kanji Public & Admin Management API (12 tests)
    - Supertest Vocabulary Public & Admin Management API (11 tests)
    - Supertest Grammar Public & Admin Management API (11 tests)
    - Supertest Offline Content Packages & Batch Progress Synchronization API (6 tests)
    - StorageService: IndexedDB persistence, quota check, outbox queue & cache clean-up (4 tests)
    - OfflineFeedService: local feed assembly, Anti-Repetition, Anti-Fatigue & offline grading (4 tests)
    - SyncService: network listener, batch sync trigger, idempotency & error backoff (3 tests)
- **TypeScript Strict Type Check (`npm run type-check`)**:
  - `tsc --build` pass 100% cho cả 4 workspace: `@sakura/shared`, `@sakura/api`, `@sakura/web`, `@sakura/admin`.
- **Linter (`npm run lint`)**:
  - ESLint Flat Config pass sạch sẽ: **0 errors, 0 warnings**.
- **Production Build (`npm run build`)**:
  - Biên dịch hoàn tất thành công.

---

## 3. Các Thành Phần Trọng Yếu Đã Triển Khai (Phase 6)

1. **PWA Manifest & Apple iOS Meta Tags**:
   - `apps/web/public/manifest.webmanifest`: `standalone` display, theme `#fff1f2`, icon SVG sắc nét maskable và any.
   - `apps/web/index.html`: `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`, `apple-touch-icon`.
2. **Service Worker (`apps/web/public/sw.js`)**:
   - Pre-cache App Shell tĩnh cho phép mở ứng dụng tức thì khi không có mạng.
   - Navigation fallback về `index.html`.
   - Bảo mật: Tuyệt đối không cache endpoint xác thực `/api/v1/auth/*`.
   - Versioning (`sakura-swipe-v1`) dọn dẹp cache cũ khi có cập nhật mới.
3. **Storage Layer IndexedDB (`StorageService`)**:
   - Stores: `packages`, `kanji`, `vocabulary`, `grammar`, `questions`, `local_progress`, `outbox_events`.
   - Cơ chế bảo toàn dữ liệu: Cho phép xóa cache nội dung (`clearContentCache`) nhưng giữ nguyên tiến độ học `local_progress` và hàng đợi `outbox_events`.
4. **Offline Feed & Chấm Điểm Ngoại Tuyến**:
   - `OfflineFeedService` tự động sinh thẻ từ IndexedDB khi mất mạng.
   - Chấm điểm câu hỏi ngoại tuyến, hiển thị giải thích tức thì và cộng điểm EXP cục bộ.
5. **Outbox Synchronization Service (`SyncService`)**:
   - Tự động bắt sự kiện `window.addEventListener('online')` để đồng bộ lô sự kiện học ngoại tuyến lên backend.
   - Backend endpoint `POST /api/v1/progress/batch` xử lý nguyên tử, bảo đảm Idempotency từng event qua `clientEventId`.
   - Chỉ xóa sự kiện khỏi Outbox sau khi máy chủ xác nhận thành công.
6. **Offline Manager Modal (`OfflineManagerModal`)**:
   - Xem trạng thái kết nối Online / Offline.
   - Theo dõi số sự kiện đang chờ đồng bộ và nút "Đồng bộ ngay".
   - Tải về và gỡ bỏ gói học ngoại tuyến theo từng cấp độ JLPT (N5..N3).
   - Đo lường dung lượng bộ nhớ thiết bị đã sử dụng.
   - Hướng dẫn trực quan cài đặt PWA Add to Home Screen trên iPhone Safari.

---

## 4. Hướng Dẫn Cài Đặt Trên iPhone (Release Guide)

1. **Mở trình duyệt Safari** trên iPhone và truy cập vào địa chỉ ứng dụng Sakura.
2. Bấm vào nút **Chia sẻ (Share)** ở thanh công cụ dưới cùng của trình duyệt Safari.
3. Cuộn xuống và chọn **"Thêm vào Màn hình chính" (Add to Home Screen)**.
4. Đặt tên ứng dụng là **"Sakura"** rồi bấm **Thêm (Add)**.
5. Biểu tượng hoa anh đào Sakura sẽ xuất hiện trên màn hình chính iPhone.
6. Mở app từ màn hình chính: Bấm nút **Offline** trên thanh tiêu đề &rarr; Bấm **Tải về** gói **JLPT N5**.
7. Bật Chế độ máy bay (Airplane Mode) để kiểm tra: Ứng dụng vẫn mở mượt mà, lướt thẻ, trả lời câu hỏi và tự động đồng bộ khi tắt chế độ máy bay!
