import React from "react";

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-2">
    <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
    <div className="text-sm text-gray-700 leading-relaxed">{children}</div>
  </section>
);

export const RefundPolicyPage: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-green-600 font-semibold">VerdantTech Solution</p>
        <h1 className="text-3xl font-bold text-gray-900">Chính sách hoàn tiền</h1>
        <p className="text-sm text-gray-600">
          Quy định về điều kiện, quy trình và thời gian xử lý hoàn tiền/đổi trả áp dụng cho các giao dịch trên nền tảng.
        </p>
      </div>

      <div className="space-y-4">
        <Section title="1. Phạm vi áp dụng">
          <ul className="list-disc pl-4 space-y-1">
            <li>Áp dụng cho các đơn hàng mua trên verdanttechsolution.verdev.id.vn.</li>
            <li>Không áp dụng cho sản phẩm/dịch vụ được tuyên bố “không hoàn/không đổi” hoặc theo điều khoản riêng.</li>
          </ul>
        </Section>

        <Section title="2. Trường hợp được hoàn tiền/đổi trả">
          <ul className="list-disc pl-4 space-y-1">
            <li>Sản phẩm lỗi kỹ thuật, hư hỏng do vận chuyển, giao sai sản phẩm/số lượng so với đơn đặt.</li>
            <li>Sản phẩm không đúng mô tả cơ bản (chủng loại, thông số chính) đã công bố.</li>
            <li>Các trường hợp khác theo quy định pháp luật hoặc thỏa thuận riêng (nếu có).</li>
          </ul>
        </Section>

        <Section title="3. Điều kiện">
          <ul className="list-disc pl-4 space-y-1">
            <li>Thông báo yêu cầu hoàn tiền/đổi trả trong vòng 07 ngày kể từ khi nhận hàng.</li>
            <li>Sản phẩm còn tem, nhãn, phụ kiện, hóa đơn/chứng từ (nếu có) và không bị hư hỏng do sử dụng sai.</li>
            <li>Cung cấp bằng chứng (ảnh/video) về tình trạng sản phẩm để đối chiếu.</li>
          </ul>
        </Section>

        <Section title="4. Quy trình">
          <ol className="list-decimal pl-4 space-y-1">
            <li>Gửi yêu cầu qua mục hỗ trợ/ticket hoặc email kèm thông tin đơn hàng và bằng chứng.</li>
            <li>Chúng tôi xác minh và phản hồi hướng dẫn hoàn/đổi trong thời gian sớm nhất.</li>
            <li>Hoàn tiền qua phương thức đã thanh toán hoặc thỏa thuận khác (nếu có).</li>
          </ol>
        </Section>

        <Section title="5. Thời gian xử lý">
          <ul className="list-disc pl-4 space-y-1">
            <li>Xác minh yêu cầu: 1–3 ngày làm việc.</li>
            <li>Thực hiện hoàn tiền (sau khi xác minh): 3–7 ngày làm việc, tùy thuộc đơn vị thanh toán/ví/nhà phát hành thẻ.</li>
          </ul>
        </Section>

        <Section title="6. Chi phí vận chuyển">
          <ul className="list-disc pl-4 space-y-1">
            <li>Trường hợp lỗi do chúng tôi/đơn vị vận chuyển: chúng tôi chịu chi phí trả hàng.</li>
            <li>Trường hợp đổi/hoàn do khách hàng không còn nhu cầu (nếu được chấp nhận): khách hàng chịu chi phí vận chuyển hai chiều.</li>
          </ul>
        </Section>

        <Section title="7. Các trường hợp từ chối">
          <ul className="list-disc pl-4 space-y-1">
            <li>Sản phẩm hư hỏng do sử dụng sai mục đích, bảo quản không đúng hướng dẫn.</li>
            <li>Sản phẩm hết thời hạn yêu cầu hoặc thiếu thông tin/bằng chứng cần thiết để xác minh.</li>
            <li>Sản phẩm thuộc danh mục không áp dụng hoàn/đổi đã được thông báo trước.</li>
          </ul>
        </Section>

        <Section title="8. Liên hệ hỗ trợ">
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

export default RefundPolicyPage;

