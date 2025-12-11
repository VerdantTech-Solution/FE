import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import VendorSidebar from './VendorSidebar';
import { AdminOverviewPage } from '@/pages/admin/AdminOverviewPage';
import { 
  LogOut
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router';

const VendorDashboard = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const { logout} = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

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
        <motion.header 
          className="bg-white shadow-sm border-b border-gray-200 px-8 py-6"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <motion.h1 
                className="text-3xl font-bold text-gray-900"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.5 }}
              >
                Tổng quan
              </motion.h1>
              <motion.p 
                className="text-gray-600 mt-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.5 }}
              >
                Thống kê và báo cáo hoạt động của bạn
              </motion.p>
            </div>
            <div className="flex items-center gap-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.9, duration: 0.3 }}
              >
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
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.0, duration: 0.3 }}
              >
                <Button 
                  variant="outline" 
                  className="border-red-300 text-red-600 hover:bg-red-50"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Đăng xuất
                </Button>
              </motion.div>
            </div>
          </div>
        </motion.header>

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
