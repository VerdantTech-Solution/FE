import { motion } from 'framer-motion';
import logo from "@/assets/logo.png";
import { MapPin, Phone, Mail, Clock, Globe } from 'lucide-react';

export const Footer = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut" as const
      }
    }
  };

  return (
    <footer className="bg-white text-gray-900">
      {/* Main Footer Content */}
      <motion.div 
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          
          {/* Company Info */}
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <img 
                src={logo} 
                alt="VerdantTech Logo" 
                className="h-8 w-auto"
              />
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-gray-900">VerdantTech</span>
                <span className="text-xs text-gray-400 font-medium tracking-wider">SOLUTION</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin size={16} className="text-green-600 flex-shrink-0 mt-1" />
                <p className="text-gray-600 text-sm leading-relaxed">
                  7 Đ. D1, Long Thạnh Mỹ, Thủ Đức, Thành phố Hồ Chí Minh
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={16} className="text-green-600 flex-shrink-0" />
                <a href="tel:0123456789" className="text-gray-600 hover:text-green-600 transition-colors text-sm">
                  0123456789
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Mail size={16} className="text-green-600 flex-shrink-0" />
                <a href="mailto:verdanttechsolution@gmail.com" className="text-gray-600 hover:text-green-600 transition-colors text-sm">
                  verdanttechsolution@gmail.com
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Clock size={16} className="text-green-600 flex-shrink-0" />
                <div className="text-gray-600 text-sm">
                  T2 – T7: 9h → 20h
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Globe size={16} className="text-green-600 flex-shrink-0" />
                <a href="https://verdanttechsolution.verdev.id.vn/" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-green-600 transition-colors text-sm">
                  verdanttechsolution.verdev.id.vn
                </a>
              </div>
            </div>
          </motion.div>

          {/* About Us */}
          <motion.div variants={itemVariants}>
            <h3 className="text-base font-semibold mb-5 text-gray-900">Về chúng tôi</h3>
            <ul className="space-y-2">
              <li>
                <a href="/about" className="text-gray-600 hover:text-green-600 transition-colors text-sm">
                  Giới thiệu
                </a>
              </li>
              <li>
                <a href="/" className="text-gray-600 hover:text-green-600 transition-colors text-sm">
                  Trang chủ
                </a>
              </li>             
              <li>
                <a href="/marketplace" className="text-gray-600 hover:text-green-600 transition-colors text-sm">
                  Chợ
                </a>
              </li>
              <li>
                <a href="/articles" className="text-gray-600 hover:text-green-600 transition-colors text-sm">
                  Bài viết
                </a>
              </li>
              <li>
                <a href="/ticket" className="text-gray-600 hover:text-green-600 transition-colors text-sm">
                  Trung tâm hỗ trợ
                </a>
              </li>
            </ul>
          </motion.div>

          {/* Support */}
          <motion.div variants={itemVariants}>
            <h3 className="text-base font-semibold mb-5 text-gray-900">Hỗ trợ</h3>
            <ul className="space-y-2">
              <li>
                <a href="/ticket" className="text-gray-600 hover:text-green-600 transition-colors text-sm">
                  Trợ giúp & hỗ trợ
                </a>
              </li>
              <li>
                <a href="/faq" className="text-gray-600 hover:text-green-600 transition-colors text-sm">
                  Câu hỏi thường gặp
                </a>
              </li>
              <li>
                <a href="/contact" className="text-gray-600 hover:text-green-600 transition-colors text-sm">
                  Liên hệ chúng tôi
                </a>
              </li>
            </ul>
          </motion.div>

          {/* Policy */}
          <motion.div variants={itemVariants}>
            <h3 className="text-base font-semibold mb-5 text-gray-900">Chính sách</h3>
            <ul className="space-y-2">
              <li>
                <a href="/terms" className="text-gray-600 hover:text-green-600 transition-colors text-sm">
                  Điều khoản & Điều kiện
                </a>
              </li>
              <li>
                <a href="/privacy" className="text-gray-600 hover:text-green-600 transition-colors text-sm">
                  Chính sách bảo mật
                </a>
              </li>
              <li>
                <a href="/refund-policy" className="text-gray-600 hover:text-green-600 transition-colors text-sm">
                  Chính sách hoàn tiền
                </a>
              </li>
            </ul>
          </motion.div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-4 border-t border-gray-200">
          <p className="text-gray-500 text-xs text-center">
            Bản quyền © 2024. VerdantTech. Tất cả quyền được bảo lưu.
          </p>
        </div>
      </motion.div>

      {/* Divider */}
      <div className="border-t border-gray-100"></div>
    </footer>
  );
};
