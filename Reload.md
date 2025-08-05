# Hướng dẫn Development - Sudoku App

## Tính năng Hot Reload

Ứng dụng đã được tích hợp tính năng hot reload để tăng tốc độ phát triển. Bạn không cần phải tắt/mở lại ứng dụng mỗi khi thay đổi code.

## Cách sử dụng

### 1. Chạy ứng dụng với hot reload

```bash
# Cài đặt dependencies trước (chỉ cần chạy 1 lần)
npm install

# Chạy ứng dụng với hot reload tự động
npm run dev-reload
```

### 2. Chạy ứng dụng với development mode thông thường

```bash
# Chạy với DevTools nhưng không có auto-reload
npm run dev
```

### 3. Chạy ứng dụng production

```bash
# Chạy như người dùng cuối
npm start
```

## Tính năng Developer

Khi chạy ở chế độ development (`npm run dev` hoặc `npm run dev-reload`), bạn sẽ có các tính năng sau:

### Phím tắt:
- **F5** hoặc **Ctrl+R**: Reload ứng dụng
- **Ctrl+Shift+R**: Hard reload (bỏ qua cache)
- **F12**: Bật/tắt DevTools

### Nút reload:
- Xuất hiện nút 🔄 màu vàng ở góc trên bên trái
- Click để reload ứng dụng
- Có hiệu ứng animation để dễ nhận biết

### DevTools:
- Tự động mở khi chạy `npm run dev`
- Có thể toggle bằng F12

## Hot Reload tự động

Khi chạy `npm run dev-reload`, ứng dụng sẽ tự động reload khi bạn:
- Thay đổi file `.html`
- Thay đổi file `.css`
- Thay đổi file `.js`
- Thay đổi file trong thư mục `frontend/`

## Lưu ý quan trọng

1. **Backend (Flask) không auto-reload**: Bạn cần restart thủ công backend nếu thay đổi code Python
2. **Trạng thái game**: Khi reload, trạng thái game hiện tại sẽ bị mất (trừ khi đã save)
3. **Performance**: Hot reload có thể làm chậm ứng dụng một chút trong development

## Troubleshooting

### Nếu hot reload không hoạt động:
1. Đảm bảo đã cài đặt dependencies: `npm install`
2. Kiểm tra console có lỗi không
3. Thử restart ứng dụng
4. Xóa cache: `npm run dev-reload` với Ctrl+Shift+R

### Nếu nút reload không xuất hiện:
1. Đảm bảo đang chạy `npm run dev` hoặc `npm run dev-reload`
2. Kiểm tra console có thông báo "Developer mode đã được kích hoạt" không
3. Thử reload ứng dụng bằng F5

## Tips Development

1. **Sử dụng console.log()**: Mở DevTools (F12) để xem logs
2. **Thay đổi CSS**: Sẽ reload ngay lập tức
3. **Thay đổi JavaScript**: Có thể cần hard reload (Ctrl+Shift+R)
4. **Test trên production**: Thỉnh thoảng chạy `npm start` để đảm bảo mọi thứ hoạt động đúng

Chúc bạn code vui vẻ! 🚀
