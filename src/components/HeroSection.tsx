import { ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import bg from "@/assets/xephunthuoc.jpg";

const HeroSection = () => {
  const scrollToContent = () => {
    window.scrollTo({
      top: window.innerHeight,
      behavior: 'smooth'
    });
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <div 
          className="w-full h-full bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${bg})`
          }}
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        {/* Main Title with Animation */}
        <motion.h1 
          className="text-6xl sm:text-7xl lg:text-8xl xl:text-9xl font-bold text-white mb-8"
          style={{ fontFamily: 'Playfair Display, serif' }}
          initial={{ opacity: 0, y: 50, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ 
            duration: 1.2, 
            ease: "easeOut",
            delay: 0.3
          }}
        >
          VerdantTech.
        </motion.h1>

        {/* Description with Animation */}
        <motion.div 
          className="max-w-4xl mx-auto mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 1, 
            delay: 0.8,
            ease: "easeOut"
          }}
        >
          <p className="text-lg sm:text-xl lg:text-2xl text-white leading-relaxed text-center">
            Tiên phong trong tương lai nông nghiệp bằng cách tích hợp các công nghệ tiên tiến và 
            thực hành đổi mới. Sứ mệnh của chúng tôi là tạo ra các giải pháp canh tác bền vững và 
            hiệu quả, đảm bảo một vụ thu hoạch khỏe mạnh và dồi dào cho các thế hệ mai sau.
          </p>
        </motion.div>

        {/* Explore More Button with Animation */}
        <motion.div 
          className="flex flex-col items-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 1, 
            delay: 1.2,
            ease: "easeOut"
          }}
        >
          <motion.button
            onClick={scrollToContent}
            className="group flex flex-col items-center cursor-pointer"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            animate={{ y: [0, 8, 0] }}
            transition={{ 
              y: { duration: 2, repeat: Infinity, ease: "easeInOut" }
            }}
          >
            <motion.span 
              className="text-white text-sm font-medium tracking-widest mb-4 uppercase"
              style={{ fontFamily: 'Playfair Display, serif' }}
              animate={{ 
                textShadow: [
                  "0 0 0px rgba(255,255,255,0)",
                  "0 0 20px rgba(255,255,255,0.5)",
                  "0 0 0px rgba(255,255,255,0)"
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              Khám Phá Thêm
            </motion.span>
            
            <motion.div 
              className="w-12 h-12 border-2 border-white rounded-full flex items-center justify-center group-hover:bg-white/10 transition-colors duration-300"
              animate={{ 
                rotate: [0, 5, -5, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 3, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
            >
              <ChevronDown className="w-6 h-6 text-white" />
            </motion.div>
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
};

export default HeroSection;