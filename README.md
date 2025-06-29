# Chatbot Tools – Dự án Chatbot sử dụng OpenAI

## 📝 Mục lục
1. [Giới thiệu](#giới-thiệu)
2. [Kiến trúc & Công nghệ](#kiến-trúc--công-nghệ)
3. [Cấu trúc thư mục](#cấu-trúc-thư-mục)
4. [Chuẩn bị môi trường](#chuẩn-bị-môi-trường)
5. [Cài đặt & Chạy dự án](#cài-đặt--chạy-dự-án)
6. [Các lệnh npm quan trọng](#các-lệnh-npm-quan-trọng)
7. [Tài liệu API](#tài-liệu-api)
8. [Triển khai Production](#triển-khai-production)
9. [Đóng góp](#đóng-góp)
10. [Giấy phép](#giấy-phép)

---

## Giới thiệu
`chatbot_tools` là một dự án **full-stack** chatbot sử dụng mô hình ngôn ngữ của **OpenAI** nhằm cung cấp trải nghiệm trò chuyện tự nhiên qua giao diện web. Dự án bao gồm:

* **Backend**: Node.js + Express, lưu trữ dữ liệu trong SQLite, xác thực JWT và cung cấp REST API.
* **Frontend**: Vue 3 (Vite) + Tailwind CSS, giao tiếp với backend qua API được bảo vệ bởi cookie JWT.

Mục tiêu là tạo ra một khung (boilerplate) đơn giản, dễ mở rộng cho các dự án chatbot, đồng thời minh hoạ cách tích hợp OpenAI trong thực tế.

## Kiến trúc & Công nghệ
* **Ngôn ngữ**: JavaScript (ES2021+)
* **Backend**:
  * Express 4
  * SQLite3 (file `database.sqlite`)
  * JsonWebToken – xác thực phiên
  * Helmet, CORS, cookie-parser – bảo mật HTTP cơ bản
* **Frontend**:
  * Vue 3 + Composition API
  * Vue-Router, Pinia (tuỳ chọn mở rộng)
  * Tailwind CSS 3
* **Triển khai**: Có thể chạy trên bất kỳ VPS/VM/container hỗ trợ Node.js ≥ 16. (Script `deploy.sh` mẫu đi kèm.)

## Cấu trúc thư mục
```text
chatbot_tools/
├── backend/              # Express server & OpenAI integration
│   ├── controllers/      # Xử lý request/response
│   ├── middlewares/      # Middleware tuỳ chỉnh (log, sanitize, ...)
│   ├── routes/           # Định nghĩa endpoint REST
│   ├── services/         # Business logic (chat, user, ...)
│   ├── utils/            # Tiện ích (DB, logger, auth)
│   ├── index.js          # Điểm khởi chạy server
│   └── package.json
├── frontend/             # Ứng dụng Vue 3 (Vite)
│   ├── src/
│   │   ├── views/        # Trang Login, Chat
│   │   ├── components/   # Các component dùng chung
│   │   └── router/       # Định tuyến client-side
│   └── package.json
├── docs/                 # (Tuỳ chọn) Tài liệu kiến trúc & yêu cầu
└── README.md             # (Bạn đang đọc file này)
```

## Chuẩn bị môi trường
Tạo file `.env` ở thư mục `backend/` (hoặc gốc) và khai báo biến môi trường sau:

```bash
# .env
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
JWT_SECRET=your-secret-string
HOST=0.0.0.0        # (tuỳ chọn) Địa chỉ lắng nghe
PORT=5000           # (tuỳ chọn) Cổng server backend
NODE_ENV=development
```

> **Lưu ý**: Không commit file `.env` lên kho mã nguồn! Bạn có thể thêm vào `.gitignore`.

## Cài đặt & Chạy dự án
1. **Clone** repository & cài đặt phụ thuộc cho cả frontend và backend:
   ```bash
   git clone https://github.com/your-username/chatbot_tools.git
   cd chatbot_tools

   # Cài đặt backend
   cd backend && npm install
   # Quay lại gốc và cài frontend
   cd ../frontend && npm install
   ```
2. **Khởi chạy môi trường phát triển**:
   ```bash
   # Cửa sổ 1 – Backend
   cd backend
   npm run dev         # Hoặc: nodemon index.js

   # Cửa sổ 2 – Frontend
   cd ../frontend
   npm run dev         # Vite server tại http://localhost:5173
   ```
3. Truy cập `http://localhost:5173` và đăng nhập bằng tài khoản mặc định (auto tạo):
   * Username: **admin**
   * Password: **admin**

## Các lệnh npm quan trọng
| Thư mục | Lệnh | Mô tả |
|---------|------|-------|
| backend | `npm run dev` | Chạy server với nodemon |
| backend | `npm start` | Chạy server chế độ production |
| frontend| `npm run dev` | Hot-reload dev server |
| frontend| `npm run build` | Build static files vào `dist/` |

## Tài liệu API
_Base URL_: `http://localhost:5000/api`

| Phương thức | Endpoint | Miêu tả |
|-------------|----------|---------|
| POST | `/login` | Đăng nhập, trả về JWT cookie |
| POST | `/chat` | Gửi tin nhắn, trả về phản hồi AI |
| GET  | `/conversations` | Danh sách hội thoại của user |
| POST | `/conversations` | Tạo hội thoại mới |
| DELETE | `/conversations/:id` | Xoá hội thoại |

_Webhook_: `POST /webhook/openai` (ví dụ tích hợp if cần)

## Triển khai Production
1. Build frontend:
   ```bash
   cd frontend && npm run build
   ```
2. Copy thư mục `frontend/dist` sang `backend/public` (hoặc dùng script `deploy.sh`).
3. Cài đặt PM2 / Docker để chạy `node backend/index.js` ở chế độ nền.
4. Thiết lập HTTPS (Nginx reverse proxy hoặc dịch vụ cloud).

Ví dụ chạy bằng PM2:
```bash
pm install -g pm2
pm2 start backend/index.js --name chatbot-tools
pm2 save && pm2 startup
```

## Đóng góp
Đóng góp, báo lỗi hoặc đề xuất tính năng mới đều được hoan nghênh! Vui lòng tạo _issue_ hoặc gửi _pull request_.

## Giấy phép
Dự án phát hành theo giấy phép **MIT**. 