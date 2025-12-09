import React from "react";

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-2">
    <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
    <div className="text-sm text-gray-700 leading-relaxed">{children}</div>
  </section>
);

export const TermsPage: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-green-600 font-semibold">VerdantTech Solution</p>
        <h1 className="text-3xl font-bold text-gray-900">Điều khoản &amp; Điều kiện</h1>
        <p className="text-sm text-gray-600">
          Bằng cách sử dụng nền tảng, bạn đồng ý tuân thủ các điều khoản dưới đây. Vui lòng đọc kỹ trước khi tiếp tục.
        </p>
      </div>

      <div className="space-y-4">
        <Section title="1. Phạm vi áp dụng">
          <ul className="list-disc pl-4 space-y-1">
            <li>Áp dụng cho mọi người dùng truy cập và sử dụng các sản phẩm/dịch vụ trên verdanttechsolution.verdev.id.vn.</li>
            <li>Ưu tiên áp dụng các chính sách/điều khoản chuyên biệt (nếu có) công bố riêng cho từng dịch vụ.</li>
          </ul>
        </Section>

        <Section title="2. Tài khoản &amp; bảo mật">
          <ul className="list-disc pl-4 space-y-1">
            <li>Bạn cần cung cấp thông tin chính xác, cập nhật và chịu trách nhiệm bảo mật thông tin đăng nhập.</li>
            <li>Không được chia sẻ hoặc cho phép người khác sử dụng tài khoản của bạn.</li>
            <li>Thông báo ngay cho chúng tôi nếu phát hiện truy cập trái phép hoặc nghi ngờ rủi ro bảo mật.</li>
          </ul>
        </Section>

        <Section title="3. Quy tắc sử dụng">
          <ul className="list-disc pl-4 space-y-1">
            <li>Không đăng tải nội dung vi phạm pháp luật, nội dung phản cảm, sai sự thật hoặc xâm phạm quyền của bên thứ ba.</li>
            <li>Không can thiệp, phá hoại hệ thống hoặc thực hiện các hành vi gây gián đoạn dịch vụ.</li>
            <li>Tuân thủ quy định về nội dung, giao dịch, thanh toán, vận chuyển và hoàn tiền của nền tảng.</li>
          </ul>
        </Section>

        <Section title="4. Sản phẩm &amp; dịch vụ">
          <ul className="list-disc pl-4 space-y-1">
            <li>Thông tin sản phẩm/dịch vụ (giá, tồn kho, mô tả) có thể được cập nhật theo thời gian thực và có thể thay đổi.</li>
            <li>Chúng tôi nỗ lực đảm bảo độ chính xác nhưng không đảm bảo tuyệt đối về mọi sai sót ngoài ý muốn.</li>
          </ul>
        </Section>

        <Section title="5. Giao dịch &amp; thanh toán">
          <ul className="list-disc pl-4 space-y-1">
            <li>Đơn hàng chỉ được xem là xác nhận khi bạn nhận được thông báo xác nhận từ hệ thống.</li>
            <li>Tuân thủ hướng dẫn thanh toán an toàn; không chia sẻ thông tin thẻ/tài khoản với bất kỳ ai.</li>
          </ul>
        </Section>

        <Section title="6. Trách nhiệm &amp; giới hạn">
          <ul className="list-disc pl-4 space-y-1">
            <li>Chúng tôi không chịu trách nhiệm cho thiệt hại phát sinh do việc sử dụng sai, lạm dụng hoặc vi phạm điều khoản.</li>
            <li>Trong phạm vi pháp luật cho phép, trách nhiệm (nếu có) được giới hạn ở giá trị giao dịch liên quan.</li>
          </ul>
        </Section>

        <Section title="7. Sửa đổi điều khoản">
          <p>
            Điều khoản có thể được cập nhật để phù hợp với pháp luật và sản phẩm mới. Phiên bản cập nhật sẽ được công bố trên website; việc tiếp tục sử dụng đồng nghĩa
            bạn chấp nhận các thay đổi.
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

export default TermsPage;

