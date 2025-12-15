import { motion } from 'framer-motion';
import { ArrowRight} from 'lucide-react';
import nongdan from '@/assets/nongdan.jpg';
import drone from '@/assets/drone.jpg';

const ServicesPage = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut" as const
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, x: -50 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut" as const
      }
    },
    hover: {
      x: 10,
      transition: {
        duration: 0.3,
        ease: "easeOut" as const
      }
    }
  };

  const imageVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 1,
        ease: "easeOut" as const
      }
    },
    hover: {
      scale: 1.05,
      transition: {
        duration: 0.3,
        ease: "easeOut" as const
      }
    }
  };


  return (
    <div className="min-h-screen bg-white py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
      <motion.div 
        className="max-w-7xl mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div 
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 sm:mb-12 lg:mb-16"
          variants={itemVariants}
        >
          <motion.h1 
            className="text-xl sm:text-2xl font-bold text-gray-900"
            style={{ fontFamily: 'Playfair Display, serif' }}
            whileHover={{ scale: 1.05 }}
          >
            Dịch Vụ
          </motion.h1>
          <motion.button
            className="text-green-600 font-semibold hover:text-green-700 transition-colors duration-300 text-sm sm:text-base"
            whileHover={{ x: 5 }}
            whileTap={{ scale: 0.95 }}
          >
            Xem tất cả
          </motion.button>
        </motion.div>

        {/* Main Title */}
        <motion.div 
          className="mb-8 sm:mb-12 lg:mb-16"
          variants={itemVariants}
        >
          <h2 
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 leading-tight"
            style={{ fontFamily: 'Playfair Display, serif' }}
          >
            Dịch Vụ Tiên Tiến Cho Nông Nghiệp Hiệu Quả
          </h2>
        </motion.div>

        {/* Description Paragraph */}
        <motion.div 
          className="max-w-2xl ml-0 sm:ml-auto mb-12 sm:mb-16 lg:mb-20"
          variants={itemVariants}
        >
          <p className="text-base sm:text-lg text-gray-700 leading-relaxed">
            Chúng tôi cung cấp một bộ dịch vụ nông nghiệp đầy đủ được thiết kế để trao quyền cho nông dân với những đổi mới mới nhất và thực hành bền vững. 
            Từ các kỹ thuật canh tác chính xác giúp tối đa hóa năng suất cây trồng đến các giải pháp thân thiện với môi trường bảo vệ hành tinh của chúng ta, 
            các dịch vụ toàn diện của chúng tôi được điều chỉnh để đáp ứng nhu cầu riêng biệt của mọi trang trại.
          </p>
        </motion.div>

        {/* Services Grid - Layout như hình */}
        <div className="space-y-12 sm:space-y-16 lg:space-y-20">
          {/* Service 01 - Text trái, Image phải */}
          <motion.div
            className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center"
            variants={cardVariants}
          >
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              {/* Service Number and Line */}
              <motion.div 
                className="flex items-center mb-4 sm:mb-6"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <span className="text-4xl sm:text-5xl lg:text-6xl font-bold text-green-200 mr-2 sm:mr-4">
                  01
                </span>
                <motion.div 
                  className="hidden sm:block h-[2px] bg-gray-300"
                  initial={{ width: 0 }}
                  whileInView={{ width: '100%', maxWidth: 500 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, delay: 0.3 }}
                />
              </motion.div>

              {/* Service Content */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                <h3 
                  className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-3 sm:mb-4 leading-tight"
                  style={{ fontFamily: 'Playfair Display, serif' }}
                >
                  Tăng Năng Suất Rau Củ Với Chất Lượng Tốt Nhất
                </h3>
                
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4 sm:mb-6">
                  Tại VerdantTech, chúng tôi cam kết giúp bạn đạt được năng suất cây trồng cao nhất thông qua các dịch vụ nông nghiệp toàn diện và đổi mới.
                </p>

                <motion.button
                  className="inline-flex items-center gap-2 px-6 py-3 border border-green-600 text-gray-900 font-semibold rounded-lg hover:bg-green-600 hover:text-white transition-all duration-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Đọc thêm
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </motion.div>
            </motion.div>

            {/* Right Image */}
            <motion.div
              className="relative overflow-hidden rounded-xl sm:rounded-2xl"
              variants={imageVariants}
              whileHover="hover"
            >
              <motion.img
                src={nongdan}
                alt="Tăng năng suất cây trồng"
                className="w-full h-64 sm:h-80 lg:h-96 object-cover"
                initial={{ opacity: 0, scale: 1.1 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: 0.6 }}
              />
            </motion.div>
          </motion.div>

          {/* Service 02 - Image trái, Text phải */}
          <motion.div
            className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center"
            variants={cardVariants}
          >
            {/* Left Image */}
            
            <motion.div
              className="relative overflow-hidden rounded-xl sm:rounded-2xl order-2 lg:order-1"
              variants={imageVariants}
              whileHover="hover"
            >
              <motion.img
                src={drone}
                alt="Tích hợp công nghệ"
                className="w-full h-64 sm:h-80 lg:h-96 object-cover"
                initial={{ opacity: 0, scale: 1.1 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1 }}
              />
            </motion.div>

            {/* Right Content */}
            <motion.div
              className="order-1 lg:order-2"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              {/* Service Number and Line */}
              <motion.div 
                className="flex items-center mb-4 sm:mb-6"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <span className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-200 mr-2 sm:mr-4">
                  02
                </span>
                <motion.div 
                 className="hidden sm:block h-[2px] bg-gray-300"
                  initial={{ width: 0 }}
                  whileInView={{ width: '100%', maxWidth: 500 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, delay: 0.3 }}
                />
              </motion.div>

              {/* Service Content */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                <h3 
                  className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-3 sm:mb-4 leading-tight"
                  style={{ fontFamily: 'Playfair Display, serif' }}
                >
                  Tích Hợp Công Nghệ
                </h3>
                
                <p className="text-sm sm:text-base text-gray-900 leading-relaxed mb-4 sm:mb-6">
                  Tại VerdantTech, chúng tôi chuyên tích hợp liền mạch các công nghệ tiên tiến vào hoạt động nông nghiệp để tối ưu hóa hiệu quả và năng suất.
                </p>

                <motion.button
                  className="inline-flex items-center gap-2 px-6 py-3 border border-green-600 text-gray-900 font-semibold rounded-lg hover:bg-green-600 hover:text-white transition-all duration-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Đọc thêm
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>

        {/* Floating Elements */}
        <motion.div 
          className="absolute top-40 left-10 w-20 h-20 bg-green-200/30 rounded-full blur-xl"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
            x: [0, 20, 0],
            y: [0, -10, 0]
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        
        <motion.div 
          className="absolute bottom-40 right-10 w-16 h-16 bg-blue-200/30 rounded-full blur-xl"
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.5, 0.2],
            x: [0, -15, 0],
            y: [0, 15, 0]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
      </motion.div>
    </div>
  );
};

export default ServicesPage;
