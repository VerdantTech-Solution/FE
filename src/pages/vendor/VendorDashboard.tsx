import { useState } from 'react';
import { motion } from 'framer-motion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import VendorSidebar from './VendorSidebar';
import { AdminOverviewPage } from '@/pages/admin/AdminOverviewPage';
import VendorHeader from './VendorHeader';

const VendorDashboard = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  // Animation variants
  const contentVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut" as const
      }
    }
  };

  const pageVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut" as const
      }
    },
    exit: { 
      opacity: 0, 
      y: -20,
      transition: {
        duration: 0.2,
        ease: "easeIn" as const
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 z-30">
        <VendorSidebar />
      </div>
      
      {/* Main Content */}
      <div className="ml-64">
        <motion.div 
          variants={contentVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.3 }}
        >
        {/* Header */}
        <VendorHeader
          title="Tổng quan"
          subtitle="Thống kê và báo cáo hoạt động của bạn"
          rightContent={
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Hôm nay</SelectItem>
                <SelectItem value="week">Tuần này</SelectItem>
                <SelectItem value="month">Tháng này</SelectItem>
                <SelectItem value="year">Năm nay</SelectItem>
              </SelectContent>
            </Select>
          }
        />

        {/* Page Content */}
        <motion.div 
          className="p-8"
          variants={pageVariants}
          initial="hidden"
          animate="visible"
          key={selectedPeriod}
        >
          <AdminOverviewPage 
            selectedPeriod={selectedPeriod}
            setSelectedPeriod={setSelectedPeriod}
          />
        </motion.div>
      </motion.div>
      </div>
    </div>
  );
};

export default VendorDashboard;
