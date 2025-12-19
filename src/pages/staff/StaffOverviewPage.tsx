import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  DollarSign, 
  Package
} from "lucide-react";
// Dashboard API removed
type RevenueData = {
  from?: string;
  to?: string;
  revenue?: number;
  totalRevenue?: number;
  dailyRevenues?: Array<{
    date: string;
    revenue: number;
  }>;
};
type OrderStatistics = {
  from?: string;
  to?: string;
  total?: number;
  paid?: number;
  shipped?: number;
  cancelled?: number;
  delivered?: number;
  refunded?: number;
};
import { BestSellingProductsCard } from "@/components/BestSellingProductsCard";
import { RevenueLast7DaysCard } from "@/components/RevenueLast7DaysCard";
import { QueueStatisticsCard } from "@/components/QueueStatisticsCard";

export const StaffOverviewPage: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null);
  const [orderStats, setOrderStats] = useState<OrderStatistics | null>(null);

  // Dashboard API removed - getDateRange function removed

  const fetchRevenue = async () => {
    try {
      // Dashboard API removed - functionality disabled
      const response = { status: false, data: null };
      if (response.status && response.data) {
        setRevenueData(response.data);
      } else {
        setRevenueData(null);
      }
    } catch (err) {
      console.error("Error fetching revenue:", err);
      setRevenueData(null);
    }
  };

  const fetchOrderStatistics = async () => {
    try {
      // Dashboard API removed - functionality disabled
      const response = { status: false, data: null };
      if (response.status && response.data) {
        setOrderStats(response.data);
      } else {
        setOrderStats(null);
      }
    } catch (err) {
      console.error("Error fetching order statistics:", err);
      setOrderStats(null);
    }
  };

  useEffect(() => {
    fetchRevenue();
    fetchOrderStatistics();
  }, [selectedPeriod]);

  const formatRevenue = (amount: number) => {
    if (amount >= 1000000000) {
      return `${(amount / 1000000000).toFixed(2)}B`;
    } else if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(1)}K`;
    }
    return amount.toLocaleString('vi-VN');
  };

  const stats = [
    {
      title: 'Tổng doanh thu',
      value: revenueData?.revenue ? `${formatRevenue(revenueData.revenue)}` : '0',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Tổng đơn hàng',
      value: orderStats?.total ? orderStats.total.toLocaleString() : '0',
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Tổng quan</h2>
          <p className="text-sm text-gray-500 mt-1">Thống kê và báo cáo hoạt động</p>
        </div>
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
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="hover:shadow-lg transition-all duration-300 border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Best Selling Products */}
      <BestSellingProductsCard 
        selectedPeriod={selectedPeriod}
        title="Top 5 sản phẩm bán chạy"
        showDatePicker={true}
      />

      {/* Revenue Last 7 Days */}
      <div className="mt-6">
        <RevenueLast7DaysCard />
      </div>

      {/* Queue Statistics */}
      <div className="mt-6">
        <QueueStatisticsCard />
      </div>
    </div>
  );
};

