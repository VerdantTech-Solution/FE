import { motion } from 'framer-motion';
import { Sprout, Leaf, Brain, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AgricultureInnovation = () => {
  const navigate = useNavigate();
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.25,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 60, scale: 0.9 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 1.2,
        ease: [0.25, 0.46, 0.45, 0.94] as const
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 80, scale: 0.8 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 1.0,
        ease: [0.25, 0.46, 0.45, 0.94] as const
      }
    },
    hover: {
      y: -15,
      scale: 1.05,
      rotateY: 5,
      transition: {
        duration: 0.4,
        ease: [0.25, 0.46, 0.45, 0.94] as const
      }
    }
  };

  const features = [
    {
      icon: Sprout,
      title: "Phân Tích Sức Khỏe Đất",
      description: "Đánh giá đất và dữ liệu môi trường để hỗ trợ canh tác bền vững"
    },
    {
      icon: Leaf,
      title: "Hỗ Trợ Canh Tác Rau Củ",
      description: "AI tư vấn phương pháp canh tác phù hợp với từng điều kiện trang trại"
    },
    {
      icon: Brain,
      title: "Chia sẻ Kiến Thức Nông Nghiệp",
      description: "Định hướng nông dân áp dụng công nghệ xanh và bền vững trong canh tác"
    }
  ];

  return (
    <div className="relative bg-white py-20 px-6 overflow-hidden">
      <motion.div 
        className="relative z-10 max-w-7xl mx-auto"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        {/* Header Section */}
        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          {/* Left - Main Heading */}
          <motion.div variants={itemVariants}>
            <h2 
              className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight"
              style={{ fontFamily: 'Playfair Display, serif' }}
            >Giải Pháp Nông Nghiệp<br/>
              <span className="text-green-600">Xanh - Bền Vững</span>
            </h2>
          </motion.div>

          {/* Right - Description */}
          <motion.div variants={itemVariants}>
            <p className="text-lg text-gray-700 leading-relaxed mb-6">
              VerdantTech là {' '}
              <span className="font-semibold text-gray-900">
               nền tảng số cung cấp các thiết bị nông nghiệp xanh kết hợp trí tuệ nhân tạo (AI)
              </span>{' '}            
              nhằm hỗ trợ nông dân trong quá trình {' '} 
              <span className="font-semibold text-gray-900">canh tác rau củ theo hướng bền vững</span>
              . Hệ thống cho phép quản lý trang trại, thu thập dữ liệu môi trường,
              đánh giá mức độ xanh và đưa ra các khuyến nghị canh tác thông minh
              giúp tối ưu năng suất và giảm tác động đến môi trường.
            </p>
            
            <motion.button
              className="inline-flex items-center gap-2 text-green-600 font-semibold hover:text-green-700 transition-colors duration-300"
              whileHover={{ x: 5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/farmlist')}
            >
              Tìm hiểu thêm
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </motion.div>
        </div>

        {/* Feature Cards */}
        <motion.div 
          className="grid md:grid-cols-3 gap-8 mb-16"
          variants={containerVariants}
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={cardVariants}
              whileHover="hover"
              className="bg-green-50 rounded-2xl p-8 text-center cursor-pointer group"
            >
              {/* Icon */}
              <motion.div 
                className="flex justify-center mb-6"
                initial={{ scale: 0, rotate: -360, opacity: 0 }}
                whileInView={{ scale: 1, rotate: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ 
                  duration: 1.5, 
                  ease: [0.25, 0.46, 0.45, 0.94] as const, 
                  delay: 0.4 
                }}
                whileHover={{ 
                  scale: 1.2, 
                  rotate: 10,
                  transition: { duration: 0.3 }
                }}
              >
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                  <feature.icon className="w-8 h-8 text-green-600" />
                </div>
              </motion.div>

              {/* Content */}
              <motion.h3 
                className="text-xl font-semibold text-gray-900 mb-3"
                style={{ fontFamily: 'Playfair Display, serif' }}
              >
                {feature.title}
              </motion.h3>
              
              <motion.p 
                className="text-gray-600 leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ 
                  duration: 1.0,
                  delay: 0.8 + index * 0.2,
                  ease: [0.25, 0.46, 0.45, 0.94] as const
                }}
              >
                {feature.description}
              </motion.p>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom Large Heading */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 100, scale: 0.9 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true }}
          transition={{ 
            duration: 1.8, 
            ease: [0.25, 0.46, 0.45, 0.94] as const,
            delay: 0.5
          }}
        >
          <h3 
            className="text-4xl lg:text-6xl font-bold leading-tight"
            style={{ fontFamily: 'Playfair Display, serif' }}
          >
            <span className="text-gray-400">Định Hướng Canh Tác Rau Củ</span><br/>
            <span className="text-green-600">Xanh & Bền Vững</span>
          </h3>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default AgricultureInnovation;