import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  DollarSign, 
  Package
} from "lucide-react";
import { getRevenue, getOrderStatistics, type RevenueData, type OrderStatistics } from "@/api/dashboard";
import { BestSellingProductsCard } from "@/components/BestSellingProductsCard";
import { RevenueLast7DaysCard } from "@/components/RevenueLast7DaysCard";
import { QueueStatisticsCard } from "@/components/QueueStatisticsCard";

export const StaffOverviewPage: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null);
  const [orderStats, setOrderStats] = useState<OrderStatistics | null>(null);
  const [isLoadingRevenue, setIsLoadingRevenue] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Calculate date range based on selected period
  const getDateRange = (period: string): { from: string; to: string } => {
    const today = new Date();
    const formatDate = (date: Date) => {
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };

    switch (period) {
      case 'day':
        return {
          from: formatDate(today),
          to: formatDate(today)
        };
      case 'week':
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        return {
          from: formatDate(startOfWeek),
          to: formatDate(today)
        };
      case 'month':
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        return {
          from: formatDate(startOfMonth),
          to: formatDate(today)
        };
      case 'year':
        const startOfYear = new Date(today.getFullYear(), 0, 1);
        return {
          from: formatDate(startOfYear),
          to: formatDate(today)
        };
      default:
        return {
          from: formatDate(new Date(today.getFullYear(), today.getMonth(), 1)),
          to: formatDate(today)
        };
    }
  };

  const fetchRevenue = async () => {
    setIsLoadingRevenue(true);
    try {
      const dateRange = getDateRange(selectedPeriod);
      const response = await getRevenue({ from: dateRange.from, to: dateRange.to });
      if (response.status && response.data) {
        setRevenueData(response.data);
      } else {
        setRevenueData(null);
      }
    } catch (err) {
      console.error("Error fetching revenue:", err);
      setRevenueData(null);
    } finally {
      setIsLoadingRevenue(false);
    }
  };

  const fetchOrderStatistics = async () => {
    setIsLoadingStats(true);
    try {
      const dateRange = getDateRange(selectedPeriod);
      const response = await getOrderStatistics({ from: dateRange.from, to: dateRange.to });
      if (response.status && response.data) {
        setOrderStats(response.data);
      } else {
        setOrderStats(null);
      }
    } catch (err) {
      console.error("Error fetching order statistics:", err);
      setOrderStats(null);
    } finally {
      setIsLoadingStats(false);
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

