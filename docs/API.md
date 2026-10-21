# API CONTRACTS — Sakura Swipe Learning REST API Specification

## 1. Quy Chuẩn Chung (API Conventions)

- **Version Prefix**: Tất cả các endpoints đều bắt đầu với `/api/v1`.
- **Content-Type**: `application/json; charset=utf-8`.
- **Authentication**: Bearer Token trong Header (`Authorization: Bearer <jwt_token>`).
- **Idempotency**: Các endpoint ghi nhận thao tác học tập bắt buộc phải truyền `clientEventId` (UUID v4).
- **Chuẩn cấu trúc phản hồi thành công (Standard Success Response)**:
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2026-10-21T09:30:00Z"
  }
}
```
- **Chuẩn cấu trúc phản hồi lỗi (Standard Error Response)**:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Dữ liệu đầu vào không hợp lệ.",
    "details": [
      { "field": "email", "issue": "Email không đúng định dạng." }
    ]
  }
}
```

---

## 2. Danh Sách Endpoint Cốt Lõi

### 2.1. Authentication & Profile (`/api/v1/auth`)

#### `POST /api/v1/auth/register`
- **Mục đích**: Đăng ký tài khoản mới.
- **Request Body**:
```json
{
  "email": "user@sakura.app",
  "password": "StrongPassword123!",
  "displayName": "Linh Sakura",
  "targetJlpt": "N5"
}
```
- **Response 201 Created**:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOi...",
    "user": {
      "id": 1,
      "email": "user@sakura.app",
      "displayName": "Linh Sakura",
      "role": "USER",
      "targetJlpt": "N5"
    }
  }
}
```

#### `POST /api/v1/auth/login`
- **Mục đích**: Đăng nhập lấy JWT Token.
- **Request Body**:
```json
{
  "email": "user@sakura.app",
  "password": "StrongPassword123!"
}
```

#### `GET /api/v1/auth/me`
- **Mục đích**: Lấy thông tin người dùng hiện tại và tiến trình học tóm tắt.
- **Headers**: `Authorization: Bearer <token>`

---

### 2.2. Swipe Feed Engine (`/api/v1/feed`)

#### `GET /api/v1/feed`
- **Mục đích**: Lấy danh sách thẻ ban đầu cho phiên học (gồm thẻ mới, thẻ cần ôn và câu hỏi củng cố).
- **Query Params**:
  - `jlpt`: `N5` | `N4` | `N3` | `N2` | `N1` (tùy chọn, mặc định lấy theo profile).
  - `limit`: Số lượng thẻ cần nạp (mặc định: 10, tối đa: 20).
- **Response 200 OK**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "cardId": "kanji_1",
        "cardType": "KANJI",
        "content": {
          "id": 1,
          "character": "日",
          "hanViet": "NHẬT",
          "onyomi": "ニチ, ジツ",
          "kunyomi": "ひ, -び, -か",
          "strokeCount": 4,
          "meaningVi": "Mặt trời, ban ngày, ngày",
          "examples": [
            {
              "word": "日本",
              "reading": "にほん",
              "meaningVi": "Nhật Bản",
              "sentenceJp": "日本の春は桜が綺麗です。",
              "sentenceVi": "Mùa xuân Nhật Bản hoa anh đào rất đẹp."
            }
          ]
        },
        "srsContext": {
          "isReview": false,
          "stage": 0
        }
      },
      {
        "cardId": "question_10",
        "cardType": "QUESTION",
        "content": {
          "id": 10,
          "questionType": "MULTIPLE_CHOICE",
          "prompt": "Chọn cách đọc đúng của chữ Kanji: 日 (trong từ 日本)",
          "options": [
            { "id": 1, "content": "に" },
            { "id": 2, "content": "つき" },
            { "id": 3, "content": "ほん" },
            { "id": 4, "content": "みず" }
          ]
        }
      }
    ],
    "remainingCount": 140
  }
}
```

---

### 2.3. Progress & Learning Events (`/api/v1/progress`)

#### `POST /api/v1/progress/event`
- **Mục đích**: Ghi nhận thao tác vuốt thẻ hoặc trả lời câu hỏi (có chống trùng lặp Idempotency).
- **Request Body**:
```json
{
  "clientEventId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "itemType": "KANJI",
  "itemId": 1,
  "action": "SWIPE_RIGHT_KNOWN",
  "metadata": {
    "timeSpentMs": 4200
  }
}
```
- **Response 200 OK**:
```json
{
  "success": true,
  "data": {
    "recorded": true,
    "nextReviewAt": "2026-10-22T09:30:00Z",
    "srsStage": 1,
    "expEarned": 10
  }
}
```

#### `POST /api/v1/questions/:id/submit`
- **Mục đích**: Nộp câu trả lời cho thẻ câu hỏi và nhận kết quả, giải thích.
- **Request Body**:
```json
{
  "clientEventId": "e2a1b9c3-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
  "selectedOptionId": 1,
  "textAnswer": null
}
```
- **Response 200 OK**:
```json
{
  "success": true,
  "data": {
    "isCorrect": true,
    "correctOptionId": 1,
    "explanation": "Trong từ 日本 (Nihon), chữ 日 (Nhật) được đọc là に (ni).",
    "srsUpdated": true
  }
}
```

---

### 2.4. Kanji Management (`/api/v1/kanji` & `/api/v1/admin/kanji`)

#### `GET /api/v1/kanji`
- Danh sách Kanji có phân trang và lọc theo cấp độ JLPT (`?jlpt=N5&page=1&limit=20`).

#### `POST /api/v1/admin/kanji` (Admin only)
- Tạo mới một chữ Kanji kèm liên kết cấp độ JLPT và danh sách ví dụ.
