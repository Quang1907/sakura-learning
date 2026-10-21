# API CONTRACTS — Sakura Swipe Learning REST API Specification

## 1. Quy Chuẩn Chung (API Conventions)

- **Version Prefix**: Tất cả các endpoints đều bắt đầu với `/api/v1`.
- **Content-Type**: `application/json; charset=utf-8`.
- **Authentication**: Bearer Token trong Header (`Authorization: Bearer <jwt_token>`).
- **Idempotency**: Các endpoint ghi nhận thao tác học tập bắt buộc phải truyền `clientEventId` (UUID v4) trong JSON body. Hệ thống hỗ trợ đọc từ Header `X-Idempotency-Key` (nếu có, ưu tiên header). Cả hai đều ánh xạ vào cột `client_event_id` trong MySQL.
- **Health Check Endpoint**: `GET /api/v1/health` phục vụ kiểm tra trạng thái hoạt động của server và kết nối MySQL (trả về 200 OK kèm uptime và timestamp).
- **Cấu trúc chuẩn phản hồi thành công (Standard Success Response)**:

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2026-10-21T10:00:00Z"
  }
}
```

- **Cấu trúc chuẩn phân trang (Pagination Metadata)**:

```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalItems": 105,
    "totalPages": 6,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

- **Cấu trúc chuẩn phản hồi lỗi (Standard Error Response)**:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Dữ liệu đầu vào không hợp lệ.",
    "details": [{ "field": "email", "issue": "Email không đúng định dạng." }]
  }
}
```

---

## 2. Mã Lỗi Hệ Thống Chuẩn (Error Codes)

| Mã lỗi HTTP             | Error Code              | Mô tả                                                        |
| :---------------------- | :---------------------- | :----------------------------------------------------------- |
| `400 Bad Request`       | `VALIDATION_FAILED`     | Schema Zod phát hiện dữ liệu đầu vào không hợp lệ.           |
| `400 Bad Request`       | `INVALID_CREDENTIALS`   | Sai email hoặc mật khẩu đăng nhập.                           |
| `401 Unauthorized`      | `UNAUTHORIZED`          | Thiếu hoặc token JWT đã hết hạn/không hợp lệ.                |
| `403 Forbidden`         | `FORBIDDEN`             | Không đủ quyền truy cập tài nguyên (ví dụ: cần quyền ADMIN). |
| `404 Not Found`         | `NOT_FOUND`             | Không tìm thấy bản ghi theo ID yêu cầu.                      |
| `409 Conflict`          | `DUPLICATE_RESOURCE`    | Email hoặc ký tự Kanji đã tồn tại trong hệ thống.            |
| `429 Too Many Requests` | `RATE_LIMITED`          | Vượt quá giới hạn request cho phép trên phút.                |
| `500 Server Error`      | `INTERNAL_SERVER_ERROR` | Lỗi ngoại lệ hệ thống chưa được phân loại.                   |

---

## 3. Chi Tiết Các Endpoints Theo Module

### 3.0. System Health (`/api/v1/health`)

#### `GET /api/v1/health`

- **Mục đích**: Kiểm tra tình trạng sẵn sàng của hệ thống API và kết nối MySQL Connection Pool.
- **Headers**: Không yêu cầu Authentication.
- **Response 200 OK**:

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "uptimeSeconds": 1420,
    "timestamp": "2026-10-21T10:15:00Z",
    "database": {
      "status": "connected",
      "poolActive": 2,
      "poolIdle": 8
    }
  }
}
```

---

### 3.1. Authentication & Profile (`/api/v1/auth`)

#### `POST /api/v1/auth/register`

- **Mục đích**: Đăng ký tài khoản người học.
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
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "eyJhbGciOi...",
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

- **Mục đích**: Đăng nhập lấy cặp Tokens.
- **Request Body**:

```json
{
  "email": "user@sakura.app",
  "password": "StrongPassword123!"
}
```

#### `POST /api/v1/auth/refresh`

- **Request Body**: `{ "refreshToken": "eyJhbGciOi..." }`
- **Response 200 OK**: `{ "accessToken": "new_token..." }`

#### `GET /api/v1/auth/me`

- **Mục đích**: Lấy thông tin cá nhân, level EXP và streak hiện tại.
- **Headers**: `Authorization: Bearer <token>`
- **Response 200 OK**:

```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@sakura.app",
    "displayName": "Linh Sakura",
    "avatarUrl": null,
    "role": "USER",
    "targetJlpt": "N5",
    "dailyGoalCards": 20,
    "currentStreakDays": 5,
    "totalExp": 340,
    "levelName": "Nụ hoa anh đào",
    "ratios": { "new": 0.6, "review": 0.3 }
  }
}
```

---

### 3.2. Swipe Feed Engine (`/api/v1/feed`)

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

#### `POST /api/v1/feed/next`

- **Mục đích**: Nạp ngầm (prefetch) thẻ tiếp theo khi người dùng vuốt gần hết bộ đệm.
- **Request Body**:

```json
{
  "currentCardIds": ["kanji_1", "question_10"],
  "limit": 5
}
```

---

### 3.3. Learning Progress & Events (`/api/v1/progress`)

#### `POST /api/v1/progress/event` (Idempotent)

- **Mục đích**: Ghi nhận thao tác vuốt thẻ (Đã nhớ / Cần học lại) chống trùng lặp.
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:

```json
{
  "clientEventId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "itemType": "KANJI",
  "itemId": 1,
  "action": "SWIPE_RIGHT_KNOWN",
  "metadata": {
    "timeSpentMs": 3500
  }
}
```

- **Response 200 OK**:

```json
{
  "success": true,
  "data": {
    "recorded": true,
    "nextReviewAt": "2026-10-22T10:00:00Z",
    "srsStage": 1,
    "expEarned": 5,
    "newTotalExp": 345,
    "currentStreakDays": 5
  }
}
```

#### `POST /api/v1/progress/batch` (Idempotent Batch Sync)

- **Mục đích**: Đồng bộ lô nhiều sự kiện học tập từ IndexedDB Outbox của client sau khi ngoại tuyến.
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:

```json
{
  "events": [
    {
      "clientEventId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      "itemType": "KANJI",
      "itemId": 1,
      "action": "SWIPE_RIGHT_KNOWN",
      "metadata": { "timeSpentMs": 2500 }
    }
  ]
}
```

- **Response 200 OK**:

```json
{
  "success": true,
  "data": {
    "results": [
      {
        "clientEventId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
        "recorded": true,
        "nextReviewAt": "2026-10-22T10:00:00Z",
        "srsStage": 1,
        "expEarned": 5,
        "newTotalExp": 345,
        "currentStreakDays": 5
      }
    ],
    "totalProcessed": 1,
    "totalExpEarned": 5
  }
}
```

#### `GET /api/v1/progress/stats`

- **Mục đích**: Thống kê số lượng thẻ theo từng giai đoạn SRS và cấp độ JLPT.
- **Response 200 OK**:

```json
{
  "success": true,
  "data": {
    "totalMastered": 42,
    "totalLearning": 18,
    "dueReviewsCount": 7,
    "byJlpt": {
      "N5": { "total": 100, "learned": 60, "mastered": 40 },
      "N4": { "total": 180, "learned": 15, "mastered": 2 }
    }
  }
}
```

---

### 3.4. Question Engine (`/api/v1/questions`)

#### `POST /api/v1/questions/:id/submit` (Idempotent)

- **Mục đích**: Nộp câu trả lời cho thẻ câu hỏi và nhận kết quả tức thì.
- **Request Body**:

```json
{
  "clientEventId": "e2a1b9c3-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
  "selectedOptionId": 1,
  "textAnswer": null,
  "durationMs": 4200
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
    "expEarned": 10,
    "srsUpdated": true,
    "nextReviewAt": "2026-10-23T10:00:00Z"
  }
}
```

---

### 3.5. Kanji Management (`/api/v1/kanji` & `/api/v1/admin/kanji`)

#### `GET /api/v1/kanji`

- **Query Params**: `jlpt=N5&page=1&limit=20&search=日`
- **Response 200 OK**: Trả về danh sách Kanji kèm phân trang.

#### `GET /api/v1/kanji/:id`

- **Response 200 OK**: Chi tiết Kanji, các cấp độ JLPT liên kết và danh sách ví dụ.

#### `POST /api/v1/admin/kanji` (Admin/Moderator Only)

- **Request Body**:

```json
{
  "character": "月",
  "hanViet": "NGUYỆT",
  "onyomi": "ゲツ, ガツ",
  "kunyomi": "つき",
  "strokeCount": 4,
  "radical": "月",
  "meaningVi": "Mặt trăng, tháng",
  "jlptLevels": ["N5"],
  "examples": [
    {
      "word": "今月",
      "reading": "こんげつ",
      "meaningVi": "Tháng này",
      "sentenceJp": "今月は桜が咲きます。",
      "sentenceVi": "Tháng này hoa anh đào sẽ nở."
    }
  ]
}
```

#### `PUT /api/v1/admin/kanji/:id` (Admin/Moderator Only)

- **Mục đích**: Cập nhật thông tin Kanji.

#### `DELETE /api/v1/admin/kanji/:id` (Admin Only)

- **Mục đích**: Xóa mềm (`deleted_at = NOW()`) Kanji khỏi hệ thống.

---

### 3.6. Vocabulary Management (`/api/v1/vocabulary` & `/api/v1/admin/vocabulary`)

#### `GET /api/v1/vocabulary`
- **Query Params**: `jlpt=N5&page=1&limit=20&search=nihon&partOfSpeech=noun`
- **Response 200 OK**: Trả về danh sách từ vựng kèm phân trang `meta: { total, page, limit, totalPages }`.

#### `GET /api/v1/vocabulary/:id`
- **Response 200 OK**: Chi tiết từ vựng, cấp độ JLPT, danh sách Kanji liên kết và các câu ví dụ mẫu.

#### `POST /api/v1/admin/vocabulary` (Admin/Moderator Only)
- **Request Body**:
```json
{
  "word": "友達",
  "reading": "ともだち",
  "romaji": "tomodachi",
  "partOfSpeech": "noun",
  "meaningVi": "Bạn bè",
  "jlptLevels": ["N5"],
  "examples": [
    {
      "sentenceJp": "彼は私の友達です。",
      "sentenceVi": "Anh ấy là bạn của tôi."
    }
  ]
}
```

#### `PUT /api/v1/admin/vocabulary/:id` (Admin/Moderator Only)
- **Mục đích**: Cập nhật thông tin từ vựng, nghĩa, cấp độ hoặc câu ví dụ.

#### `DELETE /api/v1/admin/vocabulary/:id` (Admin Only)
- **Mục đích**: Xóa mềm (`deleted_at = NOW()`) từ vựng khỏi hệ thống.

---

### 3.7. Grammar Management (`/api/v1/grammar` & `/api/v1/admin/grammar`)

#### `GET /api/v1/grammar`
- **Query Params**: `jlpt=N5&page=1&limit=20&search=です`
- **Response 200 OK**: Trả về danh sách mẫu ngữ pháp kèm phân trang.

#### `GET /api/v1/grammar/:id`
- **Response 200 OK**: Chi tiết mẫu ngữ pháp, cấu trúc, ý nghĩa, hướng dẫn sử dụng và câu ví dụ.

#### `POST /api/v1/admin/grammar` (Admin/Moderator Only)
- **Request Body**:
```json
{
  "title": "〜は〜です",
  "structure": "N1 は N2 です",
  "meaningVi": "N1 là N2",
  "usageNotes": "Mẫu câu khẳng định cơ bản trong tiếng Nhật",
  "jlptLevels": ["N5"],
  "sentences": [
    {
      "sentenceJp": "私は日本人です。",
      "sentenceVi": "Tôi là người Nhật Bản."
    }
  ]
}
```

#### `PUT /api/v1/admin/grammar/:id` (Admin/Moderator Only)
- **Mục đích**: Cập nhật thông tin mẫu ngữ pháp.

#### `DELETE /api/v1/admin/grammar/:id` (Admin Only)
- **Mục đích**: Xóa mềm (`deleted_at = NOW()`) mẫu ngữ pháp khỏi hệ thống.

---

### 3.8. Offline Content Packages (`/api/v1/packages`)

#### `GET /api/v1/packages/jlpt/:level`
- **Mục đích**: Tải trọn bộ gói dữ liệu học tập offline theo cấp độ JLPT (N5 - N1), bao gồm Kanji, Từ vựng, Ngữ pháp, Câu ví dụ và Ngân hàng câu hỏi trắc nghiệm.
- **Headers**: `Authorization: Bearer <token>`
- **Response 200 OK**:
```json
{
  "success": true,
  "data": {
    "metadata": {
      "packageId": "jlpt_n5",
      "jlptLevel": "N5",
      "title": "Gói học offline JLPT N5",
      "description": "Trọn bộ Kanji, Từ vựng, Ngữ pháp và Câu hỏi trắc nghiệm trình độ N5",
      "totalKanji": 10,
      "totalVocabulary": 25,
      "totalGrammar": 12,
      "totalQuestions": 15,
      "version": 1,
      "sizeEstimateBytes": 45000,
      "updatedAt": "2026-10-21T10:00:00Z"
    },
    "kanji": [ ... ],
    "vocabulary": [ ... ],
    "grammar": [ ... ],
    "questions": [ ... ]
  }
}
```

