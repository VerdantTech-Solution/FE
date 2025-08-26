
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { CarouselComponent } from './CarouselComponent'
import AgricultureSolutions from './AgricultureSolutions'
import AgriculturalMarketplace from './AgriculturalMarketplace'
import WhyChoosePlatform from './WhyChoosePlatform'
import { Spinner } from '@/components/ui/shadcn-io/spinner';

// Animation variants
const pageVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.8,
      staggerChildren: 0.3
    }
  }
};

const sectionVariants = {
  hidden: { y: 50, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.8,
      ease: "easeOut" as const
    }
  }
};

export const HomePage = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time for better UX
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  // Loading screen
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-emerald-50">
        <div className="text-center">
          
          {/* Spinner chính */}
          <div className=" flex justify-center mb-6">
            <Spinner 
              variant="circle-filled" 
              size={60} 
              className="text-green-600 mx-auto"
            />
          </div>
          
          {/* Tiêu đề */}
          <h2 className="text-2xl font-bold text-gray-800 mb-3">
            Đang tải trang chủ
          </h2>
          
          {/* Mô tả */}
          <p className="text-gray-600 mb-6">
            Chuẩn bị nội dung nông nghiệp thông minh...
          </p>
          
          {/* Progress indicator */}
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    );
  }

  // Main content
  return (
    <motion.div 
      className='my-[100px]'
      initial="hidden"
      animate="visible"
      variants={pageVariants}
    >
      <motion.div variants={sectionVariants}>
        <CarouselComponent/>
      </motion.div>
      
      <motion.div 
        variants={sectionVariants}
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        initial="hidden"
      >
        <AgricultureSolutions />
      </motion.div>
      
      <motion.div 
        variants={sectionVariants}
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        initial="hidden"
      >
        <AgriculturalMarketplace />
      </motion.div>
      
      <motion.div 
        variants={sectionVariants}
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        initial="hidden"
      >
        <WhyChoosePlatform />
      </motion.div>
    </motion.div>
  )
}

