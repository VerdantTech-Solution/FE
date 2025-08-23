
import { motion } from 'framer-motion';
import { CarouselComponent } from './CarouselComponent'
import AgricultureSolutions from './AgricultureSolutions'
import AgriculturalMarketplace from './AgriculturalMarketplace'
import WhyChoosePlatform from './WhyChoosePlatform'

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

