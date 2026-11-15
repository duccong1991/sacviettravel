/* Cấu hình đăng nhập Google / Facebook cho Sắc Việt.
   Đây là file DUY NHẤT cần sửa. Điền ID vào bên dưới rồi tải lại trang.
   Bỏ trống cả hai thì game vẫn chạy bình thường bằng ID thiết bị / ID ngẫu nhiên.

   ── GOOGLE ───────────────────────────────────────────────────────────────
   1. https://console.cloud.google.com/apis/credentials
   2. Create credentials → OAuth client ID → Application type: Web application
   3. Authorized JavaScript origins — thêm CHÍNH XÁC từng origin (không có dấu / ở cuối):
        http://localhost:5178
        http://127.0.0.1:5178
        https://ten-mien-that-cua-ban   (khi phát hành)
   4. Copy "Client ID" (dạng 1234567890-xxxx.apps.googleusercontent.com)
      dán vào googleClientId. Không cần Client Secret cho cách đăng nhập này.
   Lưu ý: Google chỉ chấp nhận trang chạy bằng http://localhost, http://127.0.0.1
   hoặc https://. Mở file bằng file:// sẽ không đăng nhập được.

   ── FACEBOOK ─────────────────────────────────────────────────────────────
   1. https://developers.facebook.com/apps → Create app → Consumer / Game tuỳ nhu cầu
   2. Add product: Facebook Login → Settings
        Valid OAuth Redirect URIs: https://ten-mien-that-cua-ban/
        (chế độ JS popup chỉ cần domain hợp lệ; localhost được phép khi test)
   3. Settings → Basic:
        App Domains: localhost
                     ten-mien-that-cua-ban
        Privacy Policy URL: bắt buộc khi chuyển app sang Live
   4. Copy "App ID" (dãy số) dán vào facebookAppId. Không cần App Secret ở đây.
   5. App Mode: Development chỉ cho admin/tester đăng nhập. Muốn mọi người dùng
      được thì chuyển sang Live (và hoàn tất các mục Meta yêu cầu).
   Lưu ý: Facebook bắt buộc HTTPS cho tên miền thật; http chỉ dùng được với localhost.

   ── KIỂM TRA ─────────────────────────────────────────────────────────────
   Mở game → bấm chip người chơi ở góc phải → mục "Đăng nhập để giữ ID ổn định".
   - Nút Google chỉ hiện khi googleClientId đã điền.
   - Nút Facebook bấm được khi facebookAppId đã điền.
   - Nếu bấm mà báo lỗi, xem lại origin/domain đã thêm đúng chưa và tải lại trang.
*/
window.SACVIET_AUTH = {
  googleClientId: '',
  facebookAppId: '',
  // Đổi khi Meta ngừng hỗ trợ phiên bản cũ: https://developers.facebook.com/docs/graph-api/changelog
  facebookVersion: 'v26.0',
  facebookLocale: 'vi_VN',
};
