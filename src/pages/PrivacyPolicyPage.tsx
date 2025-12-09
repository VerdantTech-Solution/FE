import React from "react";

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-2">
    <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
    <div className="text-sm text-gray-700 leading-relaxed">{children}</div>
  </section>
);

export const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-green-600 font-semibold">VerdantTech Solution</p>
        <h1 className="text-3xl font-bold text-gray-900">Chính sách bảo mật</h1>
        <p className="text-sm text-gray-600">
          Chúng tôi cam kết bảo vệ dữ liệu cá nhân của bạn và chỉ sử dụng cho mục đích phục vụ sản phẩm/dịch vụ của VerdantTech.
        </p>
      </div>

      <div className="space-y-4">
        <Section title="1. Dữ liệu thu thập">
          <ul className="list-disc pl-4 space-y-1">
            <li>Thông tin tài khoản: tên, email, số điện thoại, địa chỉ.</li>
            <li>Thông tin giao dịch: đơn hàng, thanh toán, lịch sử hỗ trợ.</li>
            <li>Dữ liệu kỹ thuật: thiết bị, trình duyệt, cookie, log truy cập phục vụ bảo mật và tối ưu trải nghiệm.</li>
          </ul>
        </Section>

        <Section title="2. Mục đích sử dụng">
          <ul className="list-disc pl-4 space-y-1">
            <li>Cung cấp và vận hành dịch vụ, xử lý đơn hàng và thanh toán.</li>
            <li>Cá nhân hóa trải nghiệm, đề xuất nội dung/sản phẩm phù hợp.</li>
            <li>Đảm bảo an toàn, phòng chống gian lận, cải thiện hiệu suất hệ thống.</li>
            <li>Liên hệ, chăm sóc khách hàng, hỗ trợ kỹ thuật khi cần.</li>
          </ul>
        </Section>

        <Section title="3. Chia sẻ dữ liệu">
          <ul className="list-disc pl-4 space-y-1">
            <li>Chỉ chia sẻ với đối tác cung cấp hạ tầng, thanh toán, vận chuyển khi cần để hoàn tất dịch vụ.</li>
            <li>Tuân thủ yêu cầu của cơ quan nhà nước có thẩm quyền theo quy định pháp luật.</li>
            <li>Không bán, trao đổi dữ liệu cá nhân cho bên thứ ba vì mục đích thương mại không liên quan.</li>
          </ul>
        </Section>

        <Section title="4. Lưu trữ &amp; bảo mật">
          <ul className="list-disc pl-4 space-y-1">
            <li>Dữ liệu được lưu trữ trên hạ tầng bảo mật, kiểm soát truy cập và sao lưu định kỳ.</li>
            <li>Áp dụng biện pháp kỹ thuật (mã hóa, phân quyền) và tổ chức (quy trình nội bộ) để bảo vệ dữ liệu.</li>
          </ul>
        </Section>

        <Section title="5. Quyền của bạn">
          <ul className="list-disc pl-4 space-y-1">
            <li>Yêu cầu truy cập, chỉnh sửa thông tin cá nhân của mình.</li>
            <li>Yêu cầu xóa hoặc hạn chế xử lý (khi phù hợp quy định pháp luật và nghĩa vụ lưu trữ).</li>
            <li>Từ chối nhận thông tin tiếp thị bất cứ lúc nào.</li>
          </ul>
        </Section>

        <Section title="6. Cookie &amp; công nghệ tương tự">
          <p>
            Chúng tôi sử dụng cookie để ghi nhớ phiên đăng nhập, phân tích lưu lượng và cải thiện trải nghiệm. Bạn có thể kiểm soát cookie qua cài đặt trình duyệt, tuy
            nhiên một số tính năng có thể bị ảnh hưởng.
          </p>
        </Section>

        <Section title="7. Cập nhật chính sách">
          <p>
            Chính sách có thể được cập nhật để đáp ứng quy định mới. Phiên bản mới sẽ được công bố trên website và áp dụng kể từ thời điểm công bố.
          </p>
        </Section>

        <Section title="8. Liên hệ">
          <ul className="list-disc pl-4 space-y-1">
            <li>Email: verdanttechsolution@gmail.com</li>
            <li>Địa chỉ: 7 Đ. D1, Long Thạnh Mỹ, Thủ Đức, TP. Hồ Chí Minh</li>
            <li>Thời gian hỗ trợ: T2 – T7, 9h → 20h</li>
          </ul>
        </Section>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;

