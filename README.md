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

## 🚀 4. Hướng Dẫn Cài Đặt & Chạy Thử Nghiệm

*(Sẽ được cập nhật chi tiết sau khi hoàn thành Phase 1 — Project Foundation)*

```bash
# Cài đặt toàn bộ dependencies trong monorepo
npm install

# Khởi chạy toàn bộ hệ thống ở môi trường Development
npm run dev

# Chạy kiểm thử tự động
npm test
```
