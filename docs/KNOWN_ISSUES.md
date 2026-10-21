# KNOWN ISSUES — Sakura Swipe Learning Limitations & Known Issues

Tài liệu này theo dõi các giới hạn kỹ thuật, vấn đề đã biết và phương án xử lý dự phòng trong quá trình phát triển.

---

## 1. Danh Sách Vấn Đề Hiện Tại

| Mã vấn đề | Mô tả chi tiết | Mức độ | Ảnh hưởng | Phương án xử lý / Kế hoạch khắc phục |
| :--- | :--- | :--- | :--- | :--- |
| `ISSUE-001` | Môi trường máy trạm chưa cài đặt công cụ Docker | Thấp | Không thể chạy container hóa MySQL trực tiếp bằng docker-compose | Sử dụng dịch vụ MySQL 8.x có sẵn qua Homebrew Service trên máy macOS hiện tại. |
| `ISSUE-002` | Xung đột cử chỉ cuộn trang mặc định của iOS Safari (Bounce effect / Rubber-banding) | Trung bình | Có thể gây giật khi người dùng vuốt dọc thẻ | Sử dụng CSS `overscroll-behavior: none` kết hợp xử lý `e.preventDefault()` trên vùng chứa cảm ứng khi phát hiện cử chỉ vuốt hợp lệ. |
| `ISSUE-003` | Quản lý font chữ hiển thị Kanji chuẩn (Noto Sans JP) có dung lượng tải lớn trên mạng 3G/4G | Thấp | Chữ Kanji có thể bị giật font khi vừa mở ứng dụng lần đầu | Nạp font tối ưu qua Google Fonts với thuộc tính `font-display: swap` và preload font chữ cho dải ký tự thường gặp. |
| `ISSUE-004` | MySQL không hỗ trợ Foreign Key cứng cho quan hệ Đa hình (`item_type`, `item_id`) | Thấp | Nguy cơ ID mồ côi nếu không kiểm soát chặt ở tầng ứng dụng | Giải quyết bằng ADR-008: Kiểm tra toàn vẹn 3 lớp (Zod Enum -> Service Verification -> Soft Delete). |
| `ISSUE-005` | Cơ chế dọn dẹp WebKit Storage trên iOS Safari có thể xóa cache IndexedDB nếu không mở app 7 ngày | Thấp | Mất bộ đệm thẻ học ngoại tuyến của học viên | Thêm cơ chế tự động nạp lại (re-seed) cache feed từ Server khi phát hiện IndexedDB rỗng lúc có mạng. |

---

## 2. Quy Trình Cập Nhật Khi Phát Hiện Lỗi Mới
1. Ghi nhận lỗi vào bảng với mã định danh tăng dần `ISSUE-xxx`.
2. Đánh giá mức độ ảnh hưởng (Cao, Trung bình, Thấp).
3. Đề xuất giải pháp khắc phục tạm thời (workaround) hoặc giải pháp triệt để.
4. Cập nhật trạng thái khi lỗi đã được giải quyết bằng bản vá code có test kèm theo.
