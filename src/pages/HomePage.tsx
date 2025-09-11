import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import HeroSection from '@/components/HeroSection';
import AgricultureInnovation from '@/components/AgricultureInnovation';
import AgriculturalMarketplace from './AgriculturalMarketplace'
import WhyChoosePlatform from './WhyChoosePlatform'
import StatisticsSection from '@/components/StatisticsSection'
import { Spinner } from '@/components/ui/shadcn-io/spinner';
import ServicesPage from './ServicesPage';
import NewHeroSection from '@/components/NewHeroSection';

// Enhanced Animation variants with multiple styles
const pageVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 1.2,
      ease: [0.25, 0.46, 0.45, 0.94] as const
    }
  }
};

const fadeInVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 1.0,
      ease: [0.25, 0.46, 0.45, 0.94] as const
    }
  }
};

const slideUpVariants = {
  hidden: { opacity: 0, y: 80 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 1.2,
      ease: [0.25, 0.46, 0.45, 0.94] as const
    }
  }
};

const scaleInVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 1.0,
      ease: [0.25, 0.46, 0.45, 0.94] as const
    }
  }
};

const staggerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2
    }
  }
};


export const HomePage = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time for better UX
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Simple Loading screen
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-emerald-50">
        <div className="text-center">
          <Spinner 
            variant="circle-filled" 
            size={60} 
            className="text-green-600 mx-auto mb-4"
          />
          <h2 
            className="text-2xl font-bold text-gray-800 mb-2"
            style={{ fontFamily: 'Playfair Display, serif' }}
          >
            Đang tải trang chủ
          </h2>
          <p className="text-gray-600">
            Chuẩn bị nội dung nông nghiệp thông minh...
          </p>
        </div>
      </div>
    );
  }

  // Clean Main content
  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={pageVariants}
      className="relative"
    >
   
      
      {/* Hero Section */}
      <HeroSection />
      
      {/* Statistics Section */}
      <motion.div 
        variants={fadeInVariants}
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        initial="hidden"
      >
        <StatisticsSection />
      </motion.div>
      
      {/* Agriculture Innovation Section */}
      <motion.div 
        variants={slideUpVariants}
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        initial="hidden"
      >
        <AgricultureInnovation />
      </motion.div>
      
      <motion.hr 
        className="mx-[100px] h-[2px] w-100% bg-gray-300"
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      />

      <motion.div
        variants={scaleInVariants}
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        initial="hidden"
      >
        <ServicesPage/>
      </motion.div>
      
      {/* Agricultural Marketplace Section */}
      <motion.div 
        variants={staggerVariants}
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        initial="hidden"
        className="bg-gray-50"
      >
        <AgriculturalMarketplace />
      </motion.div>
      
      {/* Why Choose Platform Section */}
      <motion.div 
        variants={fadeInVariants}
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        initial="hidden"
        className="bg-white"
      >
        <WhyChoosePlatform />
      </motion.div>

      {/* New Hero Section */}
      <motion.div
        variants={slideUpVariants}
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
        initial="hidden"
      >
        <NewHeroSection />
      </motion.div>

    </motion.div>
  )
}