# Collaborative LaTeX Studio (Soạn Thảo LaTeX Cộng Tác Trực Tuyến Đa Người Dùng)

Hệ thống web hiện đại cho phép **từ 6 người dùng trở lên cùng soạn thảo đồng thời (real-time collaborative editing)** trên cùng một dự án LaTeX và biên dịch xuất file PDF trực quan, tương tự như Overleaf nhưng gọn nhẹ, tự lưu trữ (self-hosted) và không yêu cầu cài đặt TeX Live nặng hàng gigabyte.

---

## 🌟 Tính Năng Nổi Bật

1. **Cộng tác Thời gian thực (Real-time Collaboration với CRDT Yjs)**:
   - Cho phép **6+ người dùng** cùng gõ đồng thời vào cùng một file hoặc chuyển đổi qua lại giữa các file trong dự án.
   - Hiển thị vị trí con trỏ (cursors) và vùng bôi đen (selection) của từng người với tên và màu sắc đại diện riêng biệt.
   - Tự động đồng bộ liên tục, không bao giờ bị ghi đè hay mất dữ liệu (thuật toán CRDT phân tán).

2. **Trình soạn thảo Monaco Editor (VS Code Engine)**:
   - Tô màu cú pháp LaTeX chuẩn xác, đánh số dòng, gấp mã (code folding), tự động đóng ngoặc.
   - Bắt dòng lỗi biên dịch và gạch chân đỏ (squiggly lines); bấm vào thông báo lỗi để nhảy ngay đến dòng bị lỗi.
   - Thanh công cụ định dạng nhanh: chèn nhanh công thức toán học (`\[...\]`, `$x$`), bảng (`table`), ma trận (`pmatrix`), hình ảnh (`figure`), danh sách (`itemize`), trích dẫn (`cite`).

3. **Biên dịch & Xuất PDF Tốc độ Cao (Tectonic Engine)**:
   - Tích hợp sẵn động cơ **Tectonic LaTeX Standalone** trong thư mục `./bin/tectonic.exe`.
   - Tự động tải các gói macro CTAN khi cần (on-the-fly) và lưu vào bộ đệm (cache), tốc độ biên dịch các lần tiếp theo chỉ mất **~0.5s - 1s**.
   - Bấm nút **"Biên dịch PDF"** hoặc dùng phím tắt **`Ctrl + S`** / **`F5`**.

4. **Trình xem trước PDF & Báo lỗi Trực quan**:
   - Khung xem trước PDF trực tiếp bên cạnh trình soạn thảo (zoom in/out, fit page, reload).
   - Tab chuyển đổi xem **Nhật ký & Lỗi chi tiết (Compilation Logs & Error Diagnostics)**.
   - Tải về file `.pdf` thành phẩm chỉ với 1 cú click.

5. **Trang Cá Nhân Quản Lý Dự Án (Workspace Dashboard)**:
   - Giao diện quản lý dự án phong cách Overleaf hiện đại.
   - Phân loại rõ ràng: **"Dự án của tôi"** (các bài do bạn tạo) và **"Được chia sẻ với tôi"** (các dự án bạn bè mời qua Gmail).
   - Nút bấm **+ Tạo Dự Án Mới** hỗ trợ 4 mẫu chuẩn:
     1. *Bài Báo Khoa Học (XeLaTeX / Fontspec tiếng Việt)*
     2. *Báo Cáo Kỹ Thuật / Đồ Án (Report)*
     3. *Slide Thuyết Trình (Beamer)*
     4. *Tài Liệu Trống (Blank)*
   - Thanh tìm kiếm dự án tức thì, quản lý tải PDF, tải ZIP và xóa dự án.

6. **Phòng Chat & Mời Cộng Tác Viên qua Gmail**:
   - Khung chat thảo luận trực tiếp ngay trong không gian làm việc.
   - Modal **"Chia sẻ & Mời thành viên"**:
     - Nhập Gmail bạn bè để gửi thư mời tự động (Nodemailer SMTP).
     - Nút "Mở Gmail" mở tab soạn thư Gmail trực tiếp với tiêu đề và link dự án.
     - Sao chép liên kết mời thành viên trực tiếp.

---

## 🚀 Hướng Dẫn Cài Đặt & Khởi Chạy

### 1. Yêu cầu Hệ thống
- **Node.js** (Khuyến nghị phiên bản 18+ hoặc 20+; hệ thống đã kiểm thử thành công trên Node.js v24).
- Bộ biên dịch Tectonic đã được cấu hình sẵn trong thư mục `./bin/tectonic.exe`.

### 2. Cài đặt các gói thư viện
Mở PowerShell hoặc Command Prompt tại thư mục dự án và chạy:
```bash
npm run install:all
```
*(Lệnh trên sẽ tự động cài đặt các dependency cho cả thư mục `server/` và `client/`)*

### 3. Khởi chạy Ứng dụng

#### Cách 1: Chạy Server đã đóng gói sẵn Frontend (Khuyến nghị - Nhanh nhất)
Frontend đã được biên dịch sẵn vào thư mục `client/dist`. Bạn chỉ cần khởi động backend server:
```bash
npm run server
```
Truy cập trình duyệt tại: **`http://localhost:3001`**

#### Cách 2: Chạy chế độ Phát triển (Dev Mode song song Hot-Reload)
```bash
npm run dev
```
Trình duyệt client sẽ chạy tại `http://localhost:5173` và tự động kết nối qua proxy tới server `http://localhost:3001`.

---

## 👥 Hướng Dẫn Thử Nghiệm 6+ Người Cùng Soạn Thảo

1. Mở trang web tại `http://localhost:3001`.
2. Bấm vào biểu tượng **"Chia sẻ" (Share)** trên thanh điều hướng góc trên bên phải.
3. Trong bảng hiện ra, bạn có thể:
   - Sao chép đường dẫn mời và gửi cho bạn bè trong mạng nội bộ hoặc qua proxy.
   - Hoặc bấm vào các nút có sẵn:
     - *Nguyễn Văn A (Nhóm trưởng)*
     - *Trần Thị B (Thành viên 2)*
     - *Lê Hoàng C (Thành viên 3)*
     - *Phạm Minh D (Thành viên 4)*
     - *Vũ Thu E (Thành viên 5)*
     - *Đặng Hữu F (Thành viên 6)*
4. Mỗi tab trình duyệt sẽ đại diện cho một người dùng với màu con trỏ và tên hiển thị riêng biệt. Khi một người gõ, các tab còn lại sẽ thấy con trỏ di chuyển và chữ xuất hiện ngay lập tức!
5. Bấm **"Biên dịch PDF"** từ bất kỳ tab nào để cập nhật kết quả tài liệu mới nhất.

---

## 📁 Cấu Trúc Mã Nguồn

```
Latexapp/
├── .env.example              # File mẫu cấu hình Gmail và Google Sign-In
├── .env                      # File cấu hình biến môi trường cục bộ
├── bin/
│   └── tectonic.exe          # Động cơ biên dịch LaTeX độc lập tốc độ cao
├── server/
│   ├── compiler.js           # Module gọi Tectonic và phân tích log/bắt dòng lỗi
│   ├── mailer.js             # Module gửi email lời mời qua Gmail (Nodemailer)
│   ├── index.js              # Express REST API & WebSocket Yjs Server
│   ├── template.js           # Mẫu tài liệu LaTeX chuẩn tiếng Việt UTF-8
│   └── package.json
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx       # Thanh điều hướng, avatar cộng tác viên, compile button
│   │   │   ├── FileTree.jsx     # Quản lý file, thêm/xóa file, upload ảnh
│   │   │   ├── Toolbar.jsx      # Phím tắt chèn công thức toán, bảng, ma trận
│   │   │   ├── Editor.jsx       # Monaco Editor + Yjs Binding (con trỏ real-time)
│   │   │   ├── PdfViewer.jsx    # Trình xem PDF & hiển thị lỗi chi tiết
│   │   │   ├── ChatDrawer.jsx   # Khung chat thảo luận nhóm
│   │   │   ├── ShareModal.jsx   # Modal mời thành viên qua Gmail & chia sẻ link
│   │   │   ├── AuthModal.jsx    # Modal đăng nhập Google / tài khoản cá nhân
│   │   │   └── ProjectModal.jsx # Modal tạo dự án mới
│   │   ├── utils/
│   │   │   └── userColors.js    # Bảng màu và bộ tạo tên ngẫu nhiên
│   │   ├── App.jsx              # Giao diện chính điều phối trạng thái
│   │   ├── index.css            # Style Tailwind & CSS con trỏ Yjs
│   │   └── main.jsx
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
├── projects/                 # Nơi lưu trữ mã nguồn các dự án LaTeX và file PDF
├── start-dev.js              # Script khởi động đồng thời client + server
└── package.json
```

---

## 📧 Hướng Dẫn Cấu Hình Gmail & Đăng Nhập Google (Tùy Chọn)

Hệ thống đã hỗ trợ **2 cách mời bạn bè**:
1. **Cách 1 - Ngay lập tức (Không cần cấu hình gì)**: Trong bảng "Chia sẻ", nhập email bạn bè rồi bấm **"Mở Gmail"**: Ứng dụng sẽ tự động mở tab soạn thư Gmail mới với đầy đủ tiêu đề và liên kết mời đã điền sẵn.
2. **Cách 2 - Tự động gửi email ngầm từ Server**:
   Mở file `.env` tại thư mục gốc và điền:
   ```env
   GMAIL_USER=your_email@gmail.com
   GMAIL_APP_PASS=xxxx xxxx xxxx xxxx
   GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
   ```
   - **GMAIL_APP_PASS**: Vào `myaccount.google.com` > **Bảo mật** > Bật **Xác minh 2 bước** > Vào **Mật khẩu ứng dụng** tạo mật khẩu mới 16 ký tự.
   - **GOOGLE_CLIENT_ID**: Vào `console.cloud.google.com` > Tạo OAuth 2.0 Client ID (loại Web Application).


