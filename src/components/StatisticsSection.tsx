import { motion, useInView } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';

const StatisticsSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  
  const statistics = [
    {
      target: 32,
      suffix: "+",
      label: "Năm Kinh Nghiệm",
     
    },
    {
      target: 182,
      suffix: "+",
      label: "Dự Án Đang Thực Hiện",
    
    },
    {
      target: 134,
      suffix: "K",
      label: "Nông Dân Trên Thế Giới",
    
    },
    {
      target: 15,
      suffix: " Tỷ",
      label: "Lợi Nhuận Nông Nghiệp",
    
    }
  ];

  const Counter = ({ target, suffix, delay = 0 }: { target: number; suffix: string; delay?: number }) => {
    const [count, setCount] = useState(0);
    
    useEffect(() => {
      if (isInView) {
        const timer = setTimeout(() => {
          const increment = target / 50;
          const interval = setInterval(() => {
            setCount(prev => {
              if (prev >= target) {
                clearInterval(interval);
                return target;
              }
              return Math.min(prev + increment, target);
            });
          }, 30);
          
          return () => clearInterval(interval);
        }, delay);
        
        return () => clearTimeout(timer);
      }
    }, [target, delay]);
    
    return (
      <span className="font-mono no-underline">
        {Math.floor(count)}{suffix}
      </span>
    );
  };

  return (
    <section ref={ref} className="py-20 bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {statistics.map((stat, index) => (
            <motion.div
              key={index}
              className="text-center"
              initial={{ opacity: 0, y: 60, scale: 0.8 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ 
                duration: 1.2, 
                delay: index * 0.2,
                ease: [0.25, 0.46, 0.45, 0.94] as const
              }}
              whileHover={{ 
                scale: 1.05,
                transition: { duration: 0.3 }
              }}
            >
              {/* Large Value */}
              <motion.div
                className="text-4xl lg:text-5xl font-bold text-gray-800 mb-3"
                initial={{ scale: 0.5, rotateY: -90 }}
                whileInView={{ scale: 1, rotateY: 0 }}
                viewport={{ once: true }}
                transition={{ 
                  duration: 1.5, 
                  delay: index * 0.2 + 0.3,
                  ease: [0.25, 0.46, 0.45, 0.94] as const
                }}
              >
                <Counter target={stat.target} suffix={stat.suffix} delay={index * 300} />
              </motion.div>

              {/* Animated Bar */}
              <motion.div
                className={`h-1 w-16 mx-auto mb-4 bg-gradient-to-r from-green-400 to-green-600 rounded-full`}
                initial={{ width: 0, opacity: 0 }}
                whileInView={{ width: 64, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ 
                  duration: 1.8, 
                  delay: index * 0.2 + 0.6,
                  ease: [0.25, 0.46, 0.45, 0.94] as const
                }}
                whileHover={{ 
                  width: 80,
                  transition: { duration: 0.3 }
                }}
              />

              {/* Label */}
              <motion.p
                className="text-gray-600 text-sm lg:text-base font-medium no-underline"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ 
                  duration: 1.0, 
                  delay: index * 0.2 + 0.8,
                  ease: [0.25, 0.46, 0.45, 0.94] as const
                }}
              >
                {stat.label}
              </motion.p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatisticsSection;