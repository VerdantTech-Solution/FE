import { motion, useScroll, useTransform } from 'framer-motion';
import { useState, useRef } from 'react';

const NewHeroSection = () => {
  const [email, setEmail] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [300, -300]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle email submission
    console.log('Email submitted:', email);
    setEmail('');
  };

  return (
    <div ref={containerRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <div 
          className="w-full h-full bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('/src/assets/canhdep.jpg')`
          }}
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* Large Overlay Text with Scroll Animation */}
      <motion.div 
        className="absolute inset-0 z-5 flex items-end justify-center"
        style={{ y, opacity }}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 1 }}
      >
        <motion.h1 
          className="text-[8rem] sm:text-[10rem] lg:text-[12rem] font-bold text-gray-300/80 select-none drop-shadow-2xl mb-[-8rem]"
          initial={{ scale: 0.1, opacity: 0, y: 200, rotateX: 90 }}
          whileInView={{ 
            scale: 1, 
            opacity: 0.8,
            y: 0,
            rotateX: 0
          }}
          viewport={{ once: true, amount: 0.2}}
          transition={{ 
            duration: 5, 
            ease: [0.25, 0.46, 0.45, 0.94],
            delay: 0.8
          }}
          animate={{
            textShadow: [
              "0 0 0px rgba(156, 163, 175, 0)",
              "0 0 40px rgba(156, 163, 175, 0.6)",
              "0 0 80px rgba(156, 163, 175, 0.4)",
              "0 0 40px rgba(156, 163, 175, 0.6)",
              "0 0 0px rgba(156, 163, 175, 0)"
            ],
            scale: [1, 1.02, 1],
            y: [0, -5, 0]
          }}
          style={{
            fontFamily: 'Playfair Display, serif',
            textShadow: '0 0 30px rgba(156, 163, 175, 0.7), 0 0 60px rgba(156, 163, 175, 0.5), 0 0 90px rgba(156, 163, 175, 0.3)',
            writingMode: 'horizontal-tb',
            textOrientation: 'mixed'
          }}
        >
          VerdantTech.
        </motion.h1>
      </motion.div>

      {/* Content */}
      <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        {/* Main Headline */}
        <motion.h2 
          className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight"
          style={{ fontFamily: 'Playfair Display, serif' }}
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ 
            duration: 1.2, 
            ease: "easeOut"
          }}
        >
          Khám phá cách các công cụ tiên tiến của chúng tôi 
          <span className="block">biến đổi cánh đồng và tăng năng suất</span>
        </motion.h2>

        {/* Sub-headline */}
        <motion.p 
          className="text-lg sm:text-xl text-white/90 mb-10 max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ 
            duration: 1, 
            ease: "easeOut",
            delay: 0.2
          }}
        >
          Sẵn sàng tăng năng suất? Biến đổi trang trại của bạn với các giải pháp đổi mới ngay bây giờ!
        </motion.p>

        {/* Email Signup Form */}
        <motion.form 
          onSubmit={handleSubmit}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ 
            duration: 1, 
            ease: "easeOut",
            delay: 0.4
          }}
        >
          <motion.input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email của bạn tại đây"
            className="flex-1 px-6 py-4 rounded-full bg-white/95 backdrop-blur-sm text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:bg-white transition-all duration-300 shadow-lg"
            whileFocus={{ scale: 1.02 }}
            required
          />
          <motion.button
            type="submit"
            className="px-8 py-4 bg-yellow-400 text-black font-semibold rounded-full hover:bg-yellow-300 transition-colors duration-300 whitespace-nowrap shadow-lg"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            animate={{ 
              boxShadow: [
                "0 0 0px rgba(255, 193, 7, 0)",
                "0 0 20px rgba(255, 193, 7, 0.5)",
                "0 0 0px rgba(255, 193, 7, 0)"
              ]
            }}
            transition={{ 
              boxShadow: { duration: 2, repeat: Infinity, ease: "easeInOut" }
            }}
          >
            Tham gia ngay
          </motion.button>
        </motion.form>
      </div>

      {/* Floating Elements Animation */}
      <div className="absolute inset-0 z-5 pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-gray-300/40 rounded-full"
            style={{
              left: `${10 + i * 8}%`,
              top: `${20 + (i % 6) * 12}%`,
            }}
            animate={{
              y: [0, -60, 0],
              opacity: [0.2, 0.9, 0.2],
              scale: [0.3, 2.5, 0.3],
              rotate: [0, 360, 720],
            }}
            transition={{
              duration: 18 + i * 0.8,
              repeat: Infinity,
              ease: [0.25, 0.46, 0.45, 0.94],
              delay: i * 1.2,
            }}
          />
        ))}
        
        {/* Additional Glowing Particles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={`glow-${i}`}
            className="absolute w-6 h-6 bg-gray-300/30 rounded-full blur-md"
            style={{
              left: `${20 + i * 15}%`,
              top: `${30 + (i % 3) * 20}%`,
            }}
            animate={{
              scale: [0, 4, 0],
              opacity: [0, 0.8, 0],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: [0.25, 0.46, 0.45, 0.94],
              delay: i * 1.8,
            }}
          />
        ))}
        
        {/* Slow Drifting Particles */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={`drift-${i}`}
            className="absolute w-1 h-1 bg-gray-400/50 rounded-full"
            style={{
              left: `${5 + i * 12}%`,
              top: `${15 + (i % 4) * 20}%`,
            }}
            animate={{
              x: [0, 100, 0],
              y: [0, -50, 0],
              opacity: [0.3, 0.7, 0.3],
            }}
            transition={{
              duration: 25 + i * 0.5,
              repeat: Infinity,
              ease: [0.25, 0.46, 0.45, 0.94],
              delay: i * 2.5,
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default NewHeroSection;
