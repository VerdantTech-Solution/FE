import React, { useRef, useEffect, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface VendorTermsSectionProps {
  accepted: boolean;
  onAcceptChange: (accepted: boolean) => void;
}

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="space-y-2 mb-4">
    <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
    <div className="text-xs text-gray-700 leading-relaxed">{children}</div>
  </section>
);

export const VendorTermsSection: React.FC<VendorTermsSectionProps> = ({ accepted, onAcceptChange }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);

  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10; // 10px threshold
    
    if (isAtBottom && !hasScrolledToBottom) {
      setHasScrolledToBottom(true);
    }
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      // Check initial state
      handleScroll();
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [hasScrolledToBottom]);

  return (
    <Card className="border-gray-200">
      <CardContent className="p-4 space-y-4">
        <div className="space-y-2">
          <h2 className="text-base font-semibold text-gray-900">Điều khoản dành cho Nhà cung cấp</h2>
          <p className="text-xs text-gray-600">
            Vui lòng đọc kỹ các điều khoản dưới đây trước khi đăng ký làm nhà cung cấp trên nền tảng VerdantTech.
          </p>
        </div>

        <div
          ref={scrollContainerRef}
          className="border border-gray-200 rounded-lg p-4 bg-gray-50 max-h-[400px] overflow-y-auto text-xs"
          style={{ scrollbarWidth: 'thin' }}
        >
          <div className="space-y-4">
            <Section title="1. Phạm vi áp dụng">
              <ul className="list-disc pl-4 space-y-1">
                <li>Điều khoản này áp dụng cho tất cả các nhà cung cấp đăng ký và sử dụng dịch vụ trên nền tảng VerdantTech.</li>
                <li>Bằng việc đăng ký tài khoản nhà cung cấp, bạn đồng ý tuân thủ toàn bộ các điều khoản và điều kiện được quy định tại đây.</li>
              </ul>
            </Section>

            <Section title="2. Đăng ký và xác thực tài khoản">
              <ul className="list-disc pl-4 space-y-1">
                <li>Nhà cung cấp phải cung cấp thông tin chính xác, đầy đủ và cập nhật về công ty, giấy phép kinh doanh, mã số thuế và các chứng chỉ liên quan.</li>
                <li>Tài khoản nhà cung cấp sẽ được xét duyệt bởi đội ngũ quản trị viên. VerdantTech có quyền từ chối đăng ký mà không cần giải thích lý do.</li>
                <li>Nhà cung cấp chịu trách nhiệm bảo mật thông tin đăng nhập và không được chia sẻ tài khoản với bên thứ ba.</li>
              </ul>
            </Section>

            <Section title="3. Quyền và nghĩa vụ của Nhà cung cấp">
              <ul className="list-disc pl-4 space-y-1">
                <li>Nhà cung cấp có quyền đăng bán sản phẩm hợp pháp, cập nhật thông tin sản phẩm và quản lý đơn hàng của mình.</li>
                <li>Nhà cung cấp có nghĩa vụ cung cấp thông tin sản phẩm chính xác, đảm bảo chất lượng sản phẩm và tuân thủ các quy định về an toàn thực phẩm, môi trường.</li>
                <li>Nhà cung cấp phải chịu trách nhiệm về mọi hoạt động diễn ra trên tài khoản của mình.</li>
              </ul>
            </Section>

            <Section title="4. Quản lý sản phẩm">
              <ul className="list-disc pl-4 space-y-1">
                <li>Tất cả sản phẩm đăng bán phải được đăng ký và chờ phê duyệt từ phía VerdantTech trước khi được hiển thị công khai.</li>
                <li>Nhà cung cấp không được đăng bán sản phẩm vi phạm pháp luật, sản phẩm giả, hàng nhái hoặc sản phẩm không đảm bảo chất lượng.</li>
                <li>Thông tin sản phẩm (giá, tồn kho, mô tả) phải được cập nhật chính xác và kịp thời.</li>
              </ul>
            </Section>

            <Section title="5. Hoa hồng và thanh toán">
              <ul className="list-disc pl-4 space-y-1">
                <li>VerdantTech sẽ thu một tỷ lệ hoa hồng nhất định trên mỗi giao dịch thành công, tỷ lệ này sẽ được thông báo cụ thể khi đăng ký.</li>
                <li>Thanh toán cho nhà cung cấp sẽ được thực hiện theo chu kỳ đã thỏa thuận, sau khi trừ đi các khoản hoa hồng và phí dịch vụ (nếu có).</li>
                <li>Nhà cung cấp chịu trách nhiệm về các khoản thuế và phí phát sinh từ hoạt động kinh doanh của mình.</li>
              </ul>
            </Section>

            <Section title="6. Vận chuyển và giao hàng">
              <ul className="list-disc pl-4 space-y-1">
                <li>Nhà cung cấp có trách nhiệm đóng gói sản phẩm đảm bảo chất lượng và an toàn trong quá trình vận chuyển.</li>
                <li>Nhà cung cấp phải tuân thủ các quy định về thời gian giao hàng đã cam kết với khách hàng.</li>
                <li>Trong trường hợp sản phẩm bị hư hỏng, thiếu sót trong quá trình vận chuyển, nhà cung cấp chịu trách nhiệm xử lý theo chính sách của VerdantTech.</li>
              </ul>
            </Section>

            <Section title="7. Khiếu nại và giải quyết tranh chấp">
              <ul className="list-disc pl-4 space-y-1">
                <li>Nhà cung cấp có trách nhiệm giải quyết các khiếu nại từ khách hàng một cách nhanh chóng và công bằng.</li>
                <li>VerdantTech có quyền can thiệp và đưa ra quyết định cuối cùng trong các trường hợp tranh chấp giữa nhà cung cấp và khách hàng.</li>
                <li>Nhà cung cấp đồng ý tuân thủ các quyết định của VerdantTech về việc giải quyết tranh chấp.</li>
              </ul>
            </Section>

            <Section title="8. Chấm dứt hợp đồng">
              <ul className="list-disc pl-4 space-y-1">
                <li>VerdantTech có quyền tạm ngưng hoặc chấm dứt tài khoản nhà cung cấp nếu vi phạm các điều khoản này hoặc có hành vi gian lận.</li>
                <li>Nhà cung cấp có quyền yêu cầu chấm dứt tài khoản sau khi hoàn tất các nghĩa vụ tài chính còn lại.</li>
                <li>Việc chấm dứt tài khoản không miễn trừ các nghĩa vụ và trách nhiệm phát sinh trước thời điểm chấm dứt.</li>
              </ul>
            </Section>

            <Section title="9. Bảo mật thông tin">
              <ul className="list-disc pl-4 space-y-1">
                <li>VerdantTech cam kết bảo mật thông tin của nhà cung cấp theo quy định của pháp luật về bảo vệ dữ liệu cá nhân.</li>
                <li>Nhà cung cấp không được sử dụng thông tin khách hàng cho mục đích khác ngoài việc thực hiện giao dịch trên nền tảng.</li>
              </ul>
            </Section>

            <Section title="10. Sửa đổi điều khoản">
              <p>
                VerdantTech có quyền cập nhật, sửa đổi các điều khoản này. Phiên bản cập nhật sẽ được thông báo trên nền tảng. Việc tiếp tục sử dụng dịch vụ sau khi điều khoản được cập nhật đồng nghĩa với việc nhà cung cấp chấp nhận các thay đổi.
              </p>
            </Section>

            <Section title="11. Liên hệ">
              <ul className="list-disc pl-4 space-y-1">
                <li>Email: verdanttechsolution@gmail.com</li>
                <li>Địa chỉ: 7 Đ. D1, Long Thạnh Mỹ, Thủ Đức, TP. Hồ Chí Minh</li>
                <li>Thời gian hỗ trợ: T2 – T7, 9h → 20h</li>
              </ul>
            </Section>
          </div>
        </div>

        <div className="flex items-start space-x-2 pt-2 border-t">
          <Checkbox
            id="accept-terms"
            checked={accepted}
            onCheckedChange={(checked) => onAcceptChange(checked === true)}
            className="mt-1"
          />
          <Label
            htmlFor="accept-terms"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
          >
            Tôi đã đọc và đồng ý với các điều khoản trên
          </Label>
        </div>
      </CardContent>
    </Card>
  );
};

