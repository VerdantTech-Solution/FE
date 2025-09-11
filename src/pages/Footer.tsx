
import { motion } from 'framer-motion';
import logo from "@/assets/logo.png";

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
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Company Info */}
          <motion.div variants={itemVariants}>
            <div className="flex items-center gap-3 mb-6">
              <img 
                src={logo} 
                alt="Harvest Logo" 
                className="h-8 w-auto"
              />
              <span className="text-xl font-bold text-gray-900">VerdantTech</span>
            </div>
            <p className="text-gray-600 text-sm mb-6 leading-relaxed">
              FPT University, Thành Phố Hồ Chí Minh, Việt Nam
            </p>
          </motion.div>

          {/* Navigation Links */}
          <motion.div variants={itemVariants}>
            <h3 className="text-lg font-semibold mb-6 text-gray-900">Điều hướng</h3>
            <ul className="space-y-3">
              <li>
                <a href="/" className="text-gray-600 hover:text-gray-900 transition-colors text-sm">
                  Trang chủ
                </a>
              </li>
              <li>
                <a href="/about" className="text-gray-600 hover:text-gray-900 transition-colors text-sm">
                  Về chúng tôi
                </a>
              </li>
              <li>
                <a href="/services" className="text-gray-600 hover:text-gray-900 transition-colors text-sm">
                  Dịch vụ
                </a>
              </li>
              <li>
                <a href="/portfolio" className="text-gray-600 hover:text-gray-900 transition-colors text-sm">
                  Danh mục đầu tư
                </a>
              </li>
              <li>
                <a href="/articles" className="text-gray-600 hover:text-gray-900 transition-colors text-sm">
                  Bài viết
                </a>
              </li>
            </ul>
          </motion.div>

          {/* Project Links */}
          <motion.div variants={itemVariants}>
            <h3 className="text-lg font-semibold mb-6 text-gray-900">Dự án</h3>
            <ul className="space-y-3">
              <li>
                <a href="/agrifuture" className="text-gray-600 hover:text-gray-900 transition-colors text-sm">
                  Giải pháp AgriFuture
                </a>
              </li>
              <li>
                <a href="/bowery" className="text-gray-600 hover:text-gray-900 transition-colors text-sm">
                  Bowery AgroField
                </a>
              </li>
              <li>
                <a href="/smartfarm" className="text-gray-600 hover:text-gray-900 transition-colors text-sm">
                  SmartFarm
                </a>
              </li>
            </ul>
          </motion.div>

          {/* Support Links */}
          <motion.div variants={itemVariants}>
            <h3 className="text-lg font-semibold mb-6 text-gray-900">Hỗ trợ</h3>
            <ul className="space-y-3">
              <li>
                <a href="/help" className="text-gray-600 hover:text-gray-900 transition-colors text-sm">
                  Trợ giúp & hỗ trợ
                </a>
              </li>
              <li>
                <a href="/security" className="text-gray-600 hover:text-gray-900 transition-colors text-sm">
                  Bảo mật
                </a>
              </li>
            </ul>
          </motion.div>
        </div>
      </motion.div>

      {/* Bottom Footer */}
      <motion.div 
        className="bg-gray-50 border-t border-gray-200"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-gray-500 text-sm">
              Bản quyền © 2024. VerdantTech. Tất cả quyền được bảo lưu.
            </div>
            <div className="flex items-center gap-6 text-sm">
              <a href="/terms" className="text-gray-500 hover:text-gray-900 transition-colors">
                Điều khoản & Điều kiện
              </a>
              <a href="/privacy" className="text-gray-500 hover:text-gray-900 transition-colors">
                Chính sách bảo mật
              </a>
            </div>
          </div>
        </div>
      </motion.div>
    </footer>
  );
};
