# Mô tả chi tiết trò chơi Sudoku

## Quan trọng
- **Đáp án phải tùy biến**: Tại một ô trống bất kỳ chỉ cần điền số **đúng luật** (số đó không trùng với hàng – cột – khối chứa ô đó). Không bắt buộc ô trống đó phải là số duy nhất hợp lệ.
- **Các tính năng như giải, gợi ý** phải sử dụng **giải thuật vét cạn (Backtracking)** để giải, **không được ẩn trước đáp án rồi hiện lên**.

---

## 1. Giao diện bên ngoài
- **Ảnh minh họa**
- **Tên trò chơi**
- **Các nút**:
  - `Tiếp tục`
  - `Trò chơi mới`
  - `Luật chơi`

---

## 2. Giao diện bên trong game

### Tính năng chung
- `Thoát game` → **Tự động lưu trạng thái hiện tại**
- `Tạm dừng thời gian`
- `Đổi giao diện sáng/tối`

### Header
- `Điểm số`
- `Lỗi: 0/3`
- `Mức độ`
- `Thời gian`

### Giao diện lưới Sudoku 9x9
- Tự sinh các ô số
- **Số lượng ô có sẵn tùy theo mức độ**

### Footer
- `Hoàn tác`
  - Hoàn tác từng bước (kể cả ô sai, ô đúng và ghi chú)
- `Xóa`
  - Chỉ xóa được các ô nhập sai
- `Ghi chú`
  - Chỉ chấp nhận khi ghi chú đúng số (phải kiểm tra hàng – cột – khối 3x3 chứa ô đó **không có số đã ghi chú**)
- `Gợi ý`
  - Chọn 1 ô bất kỳ để gợi ý đáp án
  - Có **3 lượt** và **không làm mới** khi thoát vào lại
- `Giải`
  - Lấp đầy các ô trống còn lại bằng **giải thuật Backtracking**

---

## Mức độ
- Khi bắt đầu `Trò chơi mới` → chọn mức độ:
  - `Dễ`
  - `Trung bình`
  - `Khó`

---

## Tính năng khác
- `Đếm thời gian` chơi
- `Lưu lại thành tích (điểm)` theo từng mức độ
  - Thời gian giải càng ngắn điểm càng cao
- `Tạm dừng thời gian`
  - Khi dừng sẽ **ẩn giao diện lưới 9x9**
- **Xử thua khi nhập sai quá 3 lần**
  - In đỏ số sai
  - Highlight các ô trùng
  - Hiện thông báo `Trò chơi mới` hoặc `Chơi lại màn trước`

- **Highlight phạm vi ảnh hưởng khi chọn ô bất kỳ**
  - Hàng
  - Cột
  - Khối 3x3

- **Khi thoát**
  - Tự động lưu trạng thái vào file
  - Khi vào lại có 2 lựa chọn:
    - `Trò chơi mới`
    - `Tiếp tục` (vào lại trạng thái trước đó)

- **Hiển thị các số từ 1 – 9 bên ngoài lưới**
  - Đếm số lượng còn lại của mỗi số
  - (Ví dụ: đã có 5 số 6 → số lượng còn lại là 4)
