# Hướng dẫn Debug và Lấy Ảnh từ Product Registration

## Cách ảnh được gửi khi Register Product

Khi vendor đăng ký sản phẩm:
1. **Frontend**: Ảnh được gửi dưới dạng `File[]` trong `FormData` với key `"Images"`
2. **API Call**: `POST /api/ProductRegistrations` với `Content-Type: multipart/form-data`
3. **Backend**: Backend nhận ảnh và có thể lưu theo 2 cách:
   - **Cách 1**: Lưu vào bảng `media_links` với `owner_type` và `owner_id` = `ProductRegistration.id`
   - **Cách 2**: Lưu URLs vào field `images` của bảng `ProductRegistration`

## Cách lấy ảnh (theo thứ tự ưu tiên)

### Ưu tiên 1: Parse từ field `images` trong ProductRegistration response
- Field `images` có thể là:
  - `string` (CSV hoặc single URL): `"url1,url2,url3"` hoặc `"url1"`
  - `string[]`: `["url1", "url2", "url3"]`
  - `ProductImage[]`: Array of objects với `{id, imageUrl, imagePublicId, sortOrder, purpose}`
  - `MediaLink[]`: Array of objects với `{id, ownerType, ownerId, imageUrl, ...}`

### Ưu tiên 2: Lấy từ detail endpoint
- Gọi `GET /api/ProductRegistrations/{id}` để lấy chi tiết
- Parse field `images` từ response
- Kiểm tra các field khác: `mediaLinks`, `media_links`, `imageUrls`

### Ưu tiên 3: Fetch từ MediaLinks API
- Thử các endpoint formats:
  - `/api/MediaLinks?ownerType={ownerType}&ownerId={id}`
  - `/api/MediaLinks/{ownerType}/{id}`
  - `/api/MediaLinks?owner_type={ownerType}&owner_id={id}`
  - `/api/MediaLinks/{ownerType}?ownerId={id}`
  - `/api/MediaLinks?filter[ownerType]={ownerType}&filter[ownerId]={id}`
  - `/api/MediaLinks/GetByOwner?ownerType={ownerType}&ownerId={id}`

- Thử các `ownerType` values:
  - `ProductRegistration`
  - `product_registration`
  - `ProductRegistrations`
  - `product_registrations`
  - `productregistration`
  - `Product_Registration`
  - `product_registration_image`
  - `ProductRegistrationImage`

## Debug Steps

1. **Kiểm tra Console Logs khi Register**:
   - Mở Console khi đăng ký sản phẩm
   - Tìm log `=== Register product response ===`
   - Xem structure của response, đặc biệt là field `images`

2. **Kiểm tra Console Logs khi Load WarehousePanel**:
   - Mở Console khi vào trang Warehouse Panel
   - Tìm log `=== First ProductRegistration item ===`
   - Xem structure của registration item, đặc biệt là field `images`

3. **Kiểm tra Network Tab**:
   - Mở DevTools > Network
   - Tìm request `GET /api/ProductRegistrations`
   - Xem response body để biết structure thực tế

4. **Kiểm tra Database** (nếu có quyền truy cập):
   - Kiểm tra bảng `ProductRegistration`: xem field `images` có giá trị gì
   - Kiểm tra bảng `media_links`: xem có records với `owner_id` = ProductRegistration.id không
   - Xem `owner_type` được sử dụng là gì

## Cần xác nhận từ Backend

1. **Khi upload ảnh, backend lưu ở đâu?**
   - Vào bảng `media_links` với `owner_type` và `owner_id`?
   - Vào field `images` của `ProductRegistration`?

2. **Khi GET ProductRegistration, backend trả về ảnh như thế nào?**
   - Trong field `images`?
   - Trong field `mediaLinks` hoặc `media_links`?
   - Cần gọi API riêng để lấy?

3. **owner_type chính xác là gì?**
   - `ProductRegistration`?
   - `product_registration`?
   - Hay format khác?

4. **API endpoint để lấy media links là gì?**
   - `/api/MediaLinks?ownerType=...&ownerId=...`?
   - Hay format khác?

## Code đã implement

- ✅ Parse `images` field từ ProductRegistration (string, array, objects)
- ✅ Fetch từ detail endpoint
- ✅ Fetch từ MediaLinks API với nhiều endpoint formats
- ✅ Logging chi tiết để debug
- ✅ Fallback UI khi không có ảnh

## Next Steps

Sau khi xem console logs, bạn sẽ biết:
1. Backend trả về ảnh ở đâu trong response
2. Format của ảnh (string, array, objects)
3. Cần gọi API nào để lấy ảnh

Sau đó có thể điều chỉnh code cho phù hợp.

