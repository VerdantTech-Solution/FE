import React from 'react';
import { Check, MapPin, FileText, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  steps: string[];
  onStepClick?: (step: number) => void;
}

const stepIcons = [MapPin, FileText, CheckCircle2];

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  currentStep,
  totalSteps,
  steps,
  onStepClick
}) => {
  return (
    <div className="w-full">
      <div className="relative">
        {/* Background gradient line */}
        <div className="absolute top-6 left-0 right-0 h-1 bg-gradient-to-r from-gray-200 via-gray-200 to-gray-200 rounded-full"></div>
        
        {/* Progress line */}
        <motion.div 
          className="absolute top-6 left-0 h-1 bg-gradient-to-r from-emerald-500 via-blue-500 to-emerald-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ 
            width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` 
          }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        />
        
        <div className="flex items-center justify-between relative z-10">
          {steps.map((step, index) => {
            const stepNumber = index + 1;
            const isCompleted = stepNumber < currentStep;
            const isCurrent = stepNumber === currentStep;
            const isUpcoming = stepNumber > currentStep;
            const IconComponent = stepIcons[index] || Check;

            return (
              <div key={stepNumber} className="flex flex-col items-center group">
                {/* Step Circle with enhanced styling */}
                <motion.div
                  className={`
                    relative w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold
                    transition-all duration-500 cursor-pointer shadow-lg
                    ${isCompleted 
                      ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-emerald-200' 
                      : isCurrent 
                        ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-blue-200 ring-4 ring-blue-100' 
                        : 'bg-white text-gray-400 border-2 border-gray-200 shadow-gray-100'
                    }
                    ${onStepClick ? 'hover:scale-110' : ''}
                  `}
                  whileHover={onStepClick ? { scale: 1.1, y: -2 } : {}}
                  whileTap={onStepClick ? { scale: 0.95 } : {}}
                  onClick={() => onStepClick && onStepClick(stepNumber)}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ 
                    delay: index * 0.2,
                    type: "spring",
                    stiffness: 200,
                    damping: 20
                  }}
                >
                  {/* Inner glow effect for current step */}
                  {isCurrent && (
                    <motion.div
                      className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent"
                      animate={{ 
                        opacity: [0.5, 1, 0.5],
                        scale: [1, 1.1, 1]
                      }}
                      transition={{ 
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                  )}
                  
                  {/* Step content */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.2 + 0.3 }}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5" />
                    ) : isCurrent ? (
                      <IconComponent className="w-5 h-5" />
                    ) : (
                      <IconComponent className="w-5 h-5" />
                    )}
                  </motion.div>
                  
                  {/* Step number badge for upcoming steps */}
                  {isUpcoming && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-gray-300 text-gray-600 text-xs rounded-full flex items-center justify-center font-bold">
                      {stepNumber}
                    </div>
                  )}
                </motion.div>
                
                {/* Step Label with enhanced styling */}
                <motion.div 
                  className={`
                    mt-4 text-sm font-semibold text-center max-w-24 leading-tight
                    ${isCompleted 
                      ? 'text-emerald-700' 
                      : isCurrent 
                        ? 'text-blue-700' 
                        : 'text-gray-500'
                    }
                  `}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.2 + 0.4 }}
                >
                  {step}
                </motion.div>
                
                {/* Step description */}
                <motion.div 
                  className={`
                    mt-1 text-xs text-center max-w-28 leading-tight
                    ${isCompleted 
                      ? 'text-emerald-600' 
                      : isCurrent 
                        ? 'text-blue-600' 
                        : 'text-gray-400'
                    }
                  `}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.2 + 0.6 }}
                >
                  {isCompleted ? 'Hoàn thành' : isCurrent ? 'Đang thực hiện' : 'Chờ thực hiện'}
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StepIndicator;
