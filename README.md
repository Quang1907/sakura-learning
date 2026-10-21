# 🌸 Sakura Swipe Learning (さくらスワイプ学習)

> **Nền tảng học tiếng Nhật theo định dạng thẻ vuốt dọc lấy cảm hứng từ video ngắn (TikTok/Reels), kết hợp thuật toán Spaced Repetition (SRS) giúp ghi nhớ Kanji, Từ vựng, Ngữ pháp từ N5 đến N1 một cách tự nhiên và say mê.**

---

## 📖 1. Giới Thiệu Tổng Quan

**Sakura Swipe Learning** được thiết kế nhằm giải quyết vấn đề nhanh nản chí khi học tiếng Nhật qua sách vở hay flashcard truyền thống. Bằng cách kết hợp giao diện vuốt dọc gây nghiện, thẩm mỹ hoa anh đào (Sakura/Anime) hiện đại và thuật toán phân phối nội dung thông minh, người học có thể tận dụng từng phút rảnh rỗi để học và ôn tập hiệu quả.

### Điểm nổi bật:

- 📱 **Mobile-First Experience**: Tối ưu tuyệt đối cho iPhone và thiết bị di động, thao tác vuốt dọc mượt mà kèm nút bấm trợ năng.
- 🎴 **Đa Dạng Thể Loại Thẻ Học**: Kanji, Từ vựng, Ngữ pháp, Mẫu câu, Hội thoại và Ngân hàng câu hỏi trắc nghiệm/ghép câu/tự luận tương tác.
- 🧠 **Smart SRS Feed Engine**: Thuật toán phân phối thẻ thông minh kết hợp kiến thức mới, nội dung ôn tập ngắt quãng và câu hỏi củng cố điểm yếu.
- 🌸 **Sakura Aesthetic**: Thiết kế thanh lịch, phối màu pastel hoa anh đào, hỗ trợ Furigana, âm thanh phát âm và giải thích tiếng Việt chi tiết.
- 🏢 **Kiến Trúc Chuẩn Enterprise**: Monorepo sạch sẽ, backend phân lớp rõ ràng (Router - Controller - Service - Repository), cơ sở dữ liệu MySQL chuẩn hóa.

---

## 🛠️ 2. Công Nghệ Sử Dụng (Tech Stack)

- **Frontend**: React 18 / Vite, TypeScript, TailwindCSS, Lucide Icons, Framer Motion (cho tương tác vuốt mượt mà).
- **Backend**: Node.js, Express / Fastify, TypeScript.
- **Database**: MySQL 8.x (với ràng buộc toàn vẹn, foreign keys và index tối ưu).
- **Validation**: Zod (chia sẻ type và schema giữa Frontend và Backend).
- **Testing**: Vitest, Supertest, Playwright.
- **Monorepo**: NPM Workspaces.

---

## 📂 3. Cấu Trúc Monorepo

```
sakura-learning/
├── apps/
│   ├── web/               # Ứng dụng Web/PWA chính dành cho người học
│   ├── admin/             # Ứng dụng Quản trị nội dung và thống kê
│   └── api/               # REST API Backend phục vụ toàn hệ thống
├── packages/
│   └── shared/            # DTOs, Enums, Constants, Schemas Zod dùng chung
├── docs/                  # Tài liệu đặc tả kỹ thuật và bộ nhớ dự án
├── AGENTS.md              # Tiêu chuẩn lập trình cho kỹ sư & AI
├── GEMINI.md              # Hướng dẫn AI Agent
└── README.md              # Giới thiệu dự án
```

---

## 🚀 4. Hướng Dẫn Vận Hành Monorepo (NPM Workspaces)

### 4.1. Cài đặt và liên kết Workspaces

```bash
# Cài đặt và tự động liên kết (symlink) các package trong monorepo
npm install

# Kiểm tra danh sách workspaces đã nhận diện
npm query ":root > *"
```

### 4.2. Cấu hình Biến Môi Trường (Environment Variables)

Sao chép file mẫu `.env.example` thành `.env` tại thư mục gốc:

```bash
cp .env.example .env
```

Cấu hình các tham số cần thiết:
- `PORT`: Cổng chạy Express Backend (mặc định: `3000`).
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`: Thông số kết nối MySQL 8.
- `JWT_SECRET`: Chuỗi bí mật ký Token tối thiểu 32 ký tự (chỉ dùng bí mật mạnh ở môi trường production).
- `CORS_ORIGIN`: Danh sách domain frontend được phép truy cập (ví dụ: `http://localhost:5173,https://sakura.app`).

### 4.3. Cấu hình Cơ Sở Dữ Liệu, Migration & Seed Data

Sakura hỗ trợ cả kết nối MySQL 8 thực tế và chế độ In-Memory tự động khi chạy kiểm thử hoặc chạy offline.

Để khởi tạo hoặc cập nhật cấu trúc cơ sở dữ liệu trên MySQL:

```bash
# Kiểm tra kết nối cơ sở dữ liệu
npm --workspace=@sakura/api run db:test

# Thực thi migration và tự động seed tài khoản admin/user + bài học N5
npm --workspace=@sakura/api run db:migrate
```

*Tài khoản thử nghiệm mặc định:*
- **Admin**: `admin@sakura.app` / `Admin@Sakura2026!`
- **Học viên**: `user@sakura.app` / `User@Sakura2026!`

### 4.4. Chạy Ứng Dụng Trong Môi Trường Phát Triển (Local Development)

```bash
# Khởi động Backend API (chạy tại http://localhost:3000)
npm --workspace=@sakura/api run dev

# Chạy build kiểm tra toàn bộ workspaces
npm run build

# Chạy toàn bộ 137 bài test tự động
npm test

# Chạy kiểm tra TypeScript Strict Mode
npm run type-check

# Chạy linter
npm run lint
```

---

## 📱 5. Hướng Dẫn Cài Đặt & Sử Dụng PWA Trên iPhone (Safari)

Sakura được tối ưu hóa như một Progressive Web App (PWA) độc lập:

1. **Truy cập qua HTTPS**: Mở trình duyệt Safari trên iPhone và truy cập vào địa chỉ URL của ứng dụng Sakura (yêu cầu giao thức HTTPS đối với production).
2. **Thêm vào Màn hình chính**:
   - Bấm vào biểu tượng **Chia sẻ (Share)** ở thanh công cụ Safari bên dưới.
   - Cuộn xuống danh sách tác vụ và chọn **"Thêm vào Màn hình chính" (Add to Home Screen)**.
   - Đặt tên là **"Sakura"** rồi bấm **Thêm (Add)** ở góc trên bên phải.
3. **Mở như ứng dụng gốc (Standalone)**:
   - Chạm vào biểu tượng Sakura trên màn hình chính: Ứng dụng sẽ mở toàn màn hình không có thanh URL của Safari.
4. **Tải gói học ngoại tuyến**:
   - Bấm vào nút **Offline** trên thanh tiêu đề góc trên bên phải.
   - Chọn tải gói **JLPT N5** (gồm Kanji, Từ vựng, Ngữ pháp và Câu hỏi).
5. **Học không cần mạng (Offline Mode)**:
   - Bật **Chế độ máy bay (Airplane Mode)**. Mở lại ứng dụng: Toàn bộ nội dung N5 vẫn hoạt động mượt mà, trả lời câu hỏi và nhận giải thích tức thì.
   - Mọi thao tác học được lưu vào hàng đợi `outbox_events` trong IndexedDB và sẽ tự động đồng bộ lên máy chủ khi có mạng trở lại.

---

## 🔒 6. Chính Sách Hoạt Động Ngoại Tuyến (Offline Scope Policy)

- **Nhóm A — Hoạt động 100% Offline**:
  - Mở App Shell đã cache từ Service Worker (`sw.js`).
  - Lướt thẻ bài học Kanji, Từ vựng, Ngữ pháp đã tải về máy.
  - Trả lời câu hỏi và chấm điểm ngoại tuyến bằng `OfflineFeedService`.
  - Lưu tiến độ học vào `local_progress` và hàng đợi `outbox_events` trong IndexedDB.
- **Nhóm B — Hoạt động có điều kiện**:
  - Phân phối thẻ feed ngẫu nhiên có kiểm soát chống lặp từ bộ nhớ cục bộ.
  - Quản lý và giải phóng dung lượng gói học mà không làm mất tiến độ đã lưu.
- **Nhóm C — Bắt buộc phải có mạng**:
  - Tải gói bài học JLPT mới từ máy chủ.
  - Đồng bộ lô sự kiện học lên backend (`POST /api/v1/progress/batch`).
  - Đăng ký / Đăng nhập tài khoản mới.
  - Các thao tác quản trị nội dung của Admin (`/api/v1/admin/*`).

---

## ⚠️ 7. Xử Lý Các Sự Cố Phổ Biến (Troubleshooting)

1. **Lỗi `ECONNREFUSED` khi kết nối MySQL:**
   - Đảm bảo MySQL service đang chạy (`brew services start mysql` trên macOS hoặc Docker container).
   - Kiểm tra thông số `DB_HOST`, `DB_PORT`, `DB_PASSWORD` trong file `.env`.
   - Lưu ý: Các bộ test (`npm test`) tự động chuyển sang chế độ In-Memory nên không phụ thuộc vào MySQL đang bật hay tắt.
2. **PWA không hiện nút "Thêm vào Màn hình chính" trên Safari:**
   - Safari yêu cầu trang web được phục vụ qua HTTPS (ngoại lệ duy nhất là `localhost`).
   - Kiểm tra manifest tại `/manifest.webmanifest` đã load thành công với mã 200.
3. **Cache cũ không cập nhật sau khi deploy:**
   - Service Worker quản lý phiên bản qua cache key `sakura-swipe-v1`. Khi cập nhật bản mới, Service Worker tự động dọn dẹp cache cũ khi kích hoạt (`activate` event) hoặc bấm làm mới trang.

