# Insight Khách hàng Messenger — BM SIAM Thailand

Website Next.js hiển thị report khách hàng **để lại số điện thoại** qua Messenger,
gộp dữ liệu từ **26 Page** thuộc Business Manager "Bệnh Viện Thẩm Mỹ SIAM Thailand",
kèm nhân khẩu học suy luận (giới tính, nhà mạng) và chủ đề khách quan tâm.

## Bảo mật — đọc trước khi deploy

Trang này hiển thị **số điện thoại thật của khách hàng** nên đã được khoá bằng mật khẩu
đăng nhập (`middleware.js`). **Không tắt lớp đăng nhập này** khi public link ra ngoài.
Chỉ chia sẻ mật khẩu cho người có nhu cầu xem report.

## Biến môi trường cần cấu hình trên Vercel

| Biến | Mô tả |
|---|---|
| `META_ACCESS_TOKEN` | Facebook System User Access Token, quyền `pages_messaging`, `pages_read_engagement`, `pages_show_list`, được cấp cho toàn bộ 26 Page trong BM. Chưa set thì site chạy ở chế độ **dữ liệu mẫu (demo)**. |
| `GRAPH_API_VERSION` | Mặc định `v19.0`, có thể để trống. |
| `SITE_PASSWORD` | Mật khẩu đăng nhập trang. |
| `SESSION_SECRET` | Chuỗi bí mật ngẫu nhiên để ký session cookie. |
| `REFRESH_SECRET` | Khoá bí mật để gọi `POST /api/refresh?key=...` làm mới dữ liệu từ bên ngoài (cron). |

Xem `.env.example`.

## Chạy thử ở local

```bash
npm install
cp .env.example .env.local   # điền các biến ở trên
npm run dev
```

Mở http://localhost:3000 — nếu chưa điền `META_ACCESS_TOKEN`, trang hiển thị dữ liệu mẫu
(có banner cảnh báo màu vàng ở đầu trang).

## Cách dữ liệu được lấy & cache

- `lib/pages.js` — danh sách 26 Page (page_id + tên) trong BM SIAM Thailand, lấy qua Meta
  Ads MCP connector. Muốn cập nhật danh sách (BM thêm/bớt Page) thì sửa trực tiếp file này.
  - `lib/metaGraph.js` — gọi Facebook Graph API `/{page-id}/conversations` cho từng Page bằng
    Page Access Token (đổi từ System User Token), giới hạn 60 hội thoại mới nhất + 60 tin
      nhắn/hội thoại mỗi Page để tránh timeout trên serverless function.
      - `lib/analyze.js` — trích số điện thoại, suy luận giới tính/nhà mạng, phân loại chủ đề
        theo từ khoá (`lib/topics.js`), rồi cache kết quả **1 giờ** bằng `unstable_cache` của
          Next.js (không cần thêm database).
          - Bấm **"Làm mới dữ liệu"** trên giao diện để buộc lấy lại ngay (gọi `POST /api/refresh`).

          ### Giới hạn cần biết

          Vì fetch trực tiếp trong request thay vì chạy nền, lần đầu cache miss (~mỗi giờ) có thể
          mất vài giây đến vài chục giây tuỳ số lượng hội thoại thật của 26 Page. Nếu sau này dữ
          liệu lớn hơn đáng kể và bị timeout, nên chuyển sang mô hình: Vercel Cron chạy job fetch
          riêng, ghi kết quả vào một DB/KV (Vercel KV, Postgres...), trang chỉ đọc từ đó.

          ## Deploy lên Vercel qua GitHub

          1. Tạo repo GitHub, push code này lên.
          2. Vào vercel.com → New Project → Import repo GitHub vừa tạo.
          3. Ở bước cấu hình, thêm đủ 5 biến môi trường ở bảng trên (Production + Preview).
          4. Deploy. Sau khi có link, đăng nhập thử bằng `SITE_PASSWORD` đã đặt.
          5. Nếu đã có `META_ACCESS_TOKEN` thật, bấm "Làm mới dữ liệu" trên trang để kéo dữ liệu
             Messenger thật thay cho dữ liệu mẫu.

             ## Cấu trúc thư mục

             ```
             ├── app/
             │   ├── page.js              # Trang dashboard chính (Server Component)
             │   ├── login/page.js        # Trang đăng nhập
             │   ├── api/login/route.js   # Xử lý đăng nhập
             │   ├── api/logout/route.js
             │   └── api/refresh/route.js # Làm mới cache dữ liệu
             ├── components/Dashboard.js  # UI dashboard (Client Component) — biểu đồ, bộ lọc, bảng
             ├── lib/
             │   ├── pages.js             # Danh sách 26 Page trong BM SIAM Thailand
             │   ├── metaGraph.js         # Gọi Facebook Graph API
             │   ├── phone.js             # Trích SĐT + suy luận nhà mạng
             │   ├── nameGender.js        # Suy luận giới tính từ tên
             │   ├── topics.js            # Từ điển & khớp chủ đề
             │   ├── analyze.js           # Orchestration + cache
             │   ├── auth.js               # Đăng nhập mật khẩu + session cookie
             │   └── sampleConversations.json  # Dữ liệu mẫu (demo) khi chưa có token thật
             ├── middleware.js            # Chặn truy cập khi chưa đăng nhập
             └── .env.example
             ```

             ## Tuân thủ pháp luật

             Số điện thoại/nội dung chat là dữ liệu cá nhân. Việc thu thập/lưu trữ/phân tích cần tuân
             thủ Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân. Chỉ dùng cho khách đã chủ động nhắn
             tin cho các Page của SIAM Thailand, không chia sẻ dữ liệu ra ngoài, giữ mật khẩu trang kín.
             
