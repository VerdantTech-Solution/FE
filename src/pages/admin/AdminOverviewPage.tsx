import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Package, 
  ArrowUp,
  ArrowDown,
  Loader2,
  CheckCircle
} from "lucide-react";
import { getRevenue, getOrderStatistics, getBestSellingProducts, type RevenueData, type OrderStatistics, type BestSellingProduct } from "@/api/dashboard";
import { getProductRegistrations } from "@/api/product";

// Recharts imports
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell
} from 'recharts';

interface OverviewPageProps {
  selectedPeriod: string;
  setSelectedPeriod: (period: string) => void;
}

export const AdminOverviewPage = ({ selectedPeriod, setSelectedPeriod }: OverviewPageProps) => {
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null);
  const [monthlyRevenueData, setMonthlyRevenueData] = useState<Array<{ month: string; revenue: number }>>([]);
  const [dailyRevenueData, setDailyRevenueData] = useState<Array<{ day: string; revenue: number }>>([]);
  const [weeklyRevenueData, setWeeklyRevenueData] = useState<Array<{ week: string; revenue: number }>>([]);
  const [yearlyRevenueData, setYearlyRevenueData] = useState<Array<{ year: string; revenue: number }>>([]);
  const [isLoadingRevenue, setIsLoadingRevenue] = useState(false);
  const [revenueError, setRevenueError] = useState<string | null>(null);
  const [orderStats, setOrderStats] = useState<OrderStatistics | null>(null);
  const [bestSellingProducts, setBestSellingProducts] = useState<BestSellingProduct[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [approvedRegistrationsCount, setApprovedRegistrationsCount] = useState<number>(0);
  
  // Custom date range for date picker
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const formatDate = (date: Date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };
  
  const [customDateFrom, setCustomDateFrom] = useState<string>(formatDate(startOfMonth));
  const [customDateTo, setCustomDateTo] = useState<string>(formatDate(today));


  // Calculate date range based on selected period
  const getDateRange = (period: string): { from: string; to: string } => {
    const today = new Date();
    const formatDate = (date: Date) => {
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };

    let from: Date;
    let to: Date = new Date(today);

    switch (period) {
      case 'day':
        // Current month (from start of month to today) - show all days in month
        from = new Date(today.getFullYear(), today.getMonth(), 1);
        to = new Date(today);
        break;
      case 'week':
        // Current month (from start of month to today) - will be split into weeks
        from = new Date(today.getFullYear(), today.getMonth(), 1);
        to = new Date(today);
        break;
      case 'month':
        // All months in current year (from start of year to today)
        from = new Date(today.getFullYear(), 0, 1);
        to = new Date(today);
        break;
      case 'custom':
        // Custom date range
        from = new Date(customDateFrom);
        to = new Date(customDateTo);
        break;
      case 'year':
        // Last 5 years (from 5 years ago to today)
        from = new Date(today.getFullYear() - 4, 0, 1);
        to = new Date(today);
        break;
      default:
        // Default to this month
        from = new Date(today.getFullYear(), today.getMonth(), 1);
        to = new Date(today);
    }

    return {
      from: formatDate(from),
      to: formatDate(to),
    };
  };

  // Split date range into days
  const splitIntoDays = (from: string, to: string): Array<{ from: string; to: string; day: string }> => {
    const startDate = new Date(from);
    const endDate = new Date(to);
    const days: Array<{ from: string; to: string; day: string }> = [];

    const formatDate = (date: Date) => {
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };

    const formatDayLabel = (date: Date) => {
      const dd = String(date.getDate()).padStart(2, '0');
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      return `${dd}/${mm}`;
    };

    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dayStart = new Date(currentDate);
      const dayEnd = new Date(currentDate);
      
      days.push({
        from: formatDate(dayStart),
        to: formatDate(dayEnd),
        day: formatDayLabel(dayStart),
      });

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return days;
  };

  // Split date range into weeks
  const splitIntoWeeks = (from: string, to: string): Array<{ from: string; to: string; week: string }> => {
    const startDate = new Date(from);
    const endDate = new Date(to);
    const weeks: Array<{ from: string; to: string; week: string }> = [];

    const formatDate = (date: Date) => {
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };

    const formatWeekLabel = (weekStart: Date, weekEnd: Date) => {
      const dd1 = String(weekStart.getDate()).padStart(2, '0');
      const mm1 = String(weekStart.getMonth() + 1).padStart(2, '0');
      const dd2 = String(weekEnd.getDate()).padStart(2, '0');
      const mm2 = String(weekEnd.getMonth() + 1).padStart(2, '0');
      return `${dd1}/${mm1} - ${dd2}/${mm2}`;
    };

    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      // Get Monday of current week
      const dayOfWeek = currentDate.getDay();
      const diff = currentDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      const weekStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), diff);
      
      // Get Sunday of current week
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      // Adjust if weekEnd is beyond endDate
      const actualEnd = weekEnd > endDate ? endDate : weekEnd;
      
      weeks.push({
        from: formatDate(weekStart),
        to: formatDate(actualEnd),
        week: formatWeekLabel(weekStart, actualEnd),
      });

      // Move to next week (Monday)
      currentDate = new Date(weekEnd);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return weeks;
  };

  // Split date range into years
  const splitIntoYears = (from: string, to: string): Array<{ from: string; to: string; year: string }> => {
    const startDate = new Date(from);
    const endDate = new Date(to);
    const years: Array<{ from: string; to: string; year: string }> = [];

    const formatDate = (date: Date) => {
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };

    let currentYear = startDate.getFullYear();
    const endYear = endDate.getFullYear();

    while (currentYear <= endYear) {
      const yearStart = new Date(currentYear, 0, 1);
      const yearEnd = new Date(currentYear, 11, 31);
      
      // Adjust if yearEnd is beyond endDate
      const actualEnd = yearEnd > endDate ? endDate : yearEnd;
      
      years.push({
        from: formatDate(yearStart),
        to: formatDate(actualEnd),
        year: String(currentYear),
      });

      currentYear++;
    }

    return years;
  };

  // Split date range into months
  const splitIntoMonths = (from: string, to: string, showAllMonths: boolean = false): Array<{ from: string; to: string; month: string }> => {
    const startDate = new Date(from);
    const endDate = new Date(to);
    const months: Array<{ from: string; to: string; month: string }> = [];

    const formatDate = (date: Date) => {
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };

    const getMonthLabel = (date: Date) => {
      const monthNames = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
      return monthNames[date.getMonth()];
    };

    // If showAllMonths is true, show all 12 months of the year
    if (showAllMonths) {
      const year = startDate.getFullYear();
      for (let month = 0; month < 12; month++) {
        const monthStart = new Date(year, month, 1);
        const monthEnd = new Date(year, month + 1, 0);
        
        // Adjust end date if it's beyond the requested end date
        const actualEnd = monthEnd > endDate ? endDate : monthEnd;
        
        months.push({
          from: formatDate(monthStart),
          to: formatDate(actualEnd),
          month: getMonthLabel(monthStart),
        });
      }
      return months;
    }

    // Otherwise, only show months in the date range
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      // Adjust end date if it's beyond the requested end date
      const actualEnd = monthEnd > endDate ? endDate : monthEnd;
      
      months.push({
        from: formatDate(monthStart),
        to: formatDate(actualEnd),
        month: getMonthLabel(monthStart),
      });

      // Move to next month
      currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    }

    return months;
  };

  // Fetch revenue data
  const fetchRevenue = async () => {
    setIsLoadingRevenue(true);
    setRevenueError(null);
    try {
      const dateRange = getDateRange(selectedPeriod);
      
      // For day, split into days and fetch each day (show all days in current month)
      if (selectedPeriod === 'day') {
        // Split into days and fetch each day
        const days = splitIntoDays(dateRange.from, dateRange.to);
        const dailyData: Array<{ day: string; revenue: number }> = [];
        let totalRevenue = 0;

        // Fetch revenue for each day
        for (const dayRange of days) {
          try {
            const dayEndDate = new Date(dayRange.to);
            const today = new Date();
            if (dayEndDate <= today) {
              const response = await getRevenue({ from: dayRange.from, to: dayRange.to });
              if (response.status && response.data && response.data.revenue !== undefined) {
                dailyData.push({
                  day: dayRange.day,
                  revenue: response.data.revenue,
                });
                totalRevenue += response.data.revenue;
              } else {
                dailyData.push({
                  day: dayRange.day,
                  revenue: 0,
                });
              }
            } else {
              dailyData.push({
                day: dayRange.day,
                revenue: 0,
              });
            }
          } catch (err) {
            console.error(`Error fetching revenue for ${dayRange.day}:`, err);
            dailyData.push({
              day: dayRange.day,
              revenue: 0,
            });
          }
        }

        setDailyRevenueData(dailyData);
        setMonthlyRevenueData([]);
        setWeeklyRevenueData([]);
        setYearlyRevenueData([]);
        setRevenueData({
          from: dateRange.from,
          to: dateRange.to,
          revenue: totalRevenue,
        });
      } else if (selectedPeriod === 'month') {
        // For month, split into months and fetch each month (show all 12 months)
        const showAllMonths = true;
        const months = splitIntoMonths(dateRange.from, dateRange.to, showAllMonths);
        const monthlyData: Array<{ month: string; revenue: number }> = [];
        let totalRevenue = 0;

        // Fetch revenue for each month
        for (const monthRange of months) {
          try {
            // Only fetch if the month range is valid (not in the future)
            const monthEndDate = new Date(monthRange.to);
            const today = new Date();
            if (monthEndDate <= today) {
              const response = await getRevenue({ from: monthRange.from, to: monthRange.to });
              if (response.status && response.data && response.data.revenue !== undefined) {
                monthlyData.push({
                  month: monthRange.month,
                  revenue: response.data.revenue,
                });
                totalRevenue += response.data.revenue;
              } else {
                monthlyData.push({
                  month: monthRange.month,
                  revenue: 0,
                });
              }
            } else {
              // Future month, set revenue to 0
              monthlyData.push({
                month: monthRange.month,
                revenue: 0,
              });
            }
          } catch (err) {
            console.error(`Error fetching revenue for ${monthRange.month}:`, err);
            monthlyData.push({
              month: monthRange.month,
              revenue: 0,
            });
          }
        }

        setMonthlyRevenueData(monthlyData);
        setDailyRevenueData([]);
        setWeeklyRevenueData([]);
        setYearlyRevenueData([]);
        setRevenueData({
          from: dateRange.from,
          to: dateRange.to,
          revenue: totalRevenue,
        });
      } else if (selectedPeriod === 'week') {
        // For week, split into weeks of current month
        const weeks = splitIntoWeeks(dateRange.from, dateRange.to);
        const weeklyData: Array<{ week: string; revenue: number }> = [];
        let totalRevenue = 0;

        // Fetch revenue for each week
        for (const weekRange of weeks) {
          try {
            const weekEndDate = new Date(weekRange.to);
            const today = new Date();
            if (weekEndDate <= today) {
              const response = await getRevenue({ from: weekRange.from, to: weekRange.to });
              if (response.status && response.data && response.data.revenue !== undefined) {
                weeklyData.push({
                  week: weekRange.week,
                  revenue: response.data.revenue,
                });
                totalRevenue += response.data.revenue;
              } else {
                weeklyData.push({
                  week: weekRange.week,
                  revenue: 0,
                });
              }
            } else {
              weeklyData.push({
                week: weekRange.week,
                revenue: 0,
              });
            }
          } catch (err) {
            console.error(`Error fetching revenue for ${weekRange.week}:`, err);
            weeklyData.push({
              week: weekRange.week,
              revenue: 0,
            });
          }
        }

        setWeeklyRevenueData(weeklyData);
        setDailyRevenueData([]);
        setMonthlyRevenueData([]);
        setYearlyRevenueData([]);
        setRevenueData({
          from: dateRange.from,
          to: dateRange.to,
          revenue: totalRevenue,
        });
      } else if (selectedPeriod === 'year') {
        // For year, split into years
        const years = splitIntoYears(dateRange.from, dateRange.to);
        const yearlyData: Array<{ year: string; revenue: number }> = [];
        let totalRevenue = 0;

        // Fetch revenue for each year
        for (const yearRange of years) {
          try {
            const yearEndDate = new Date(yearRange.to);
            const today = new Date();
            if (yearEndDate <= today) {
              const response = await getRevenue({ from: yearRange.from, to: yearRange.to });
              if (response.status && response.data && response.data.revenue !== undefined) {
                yearlyData.push({
                  year: yearRange.year,
                  revenue: response.data.revenue,
                });
                totalRevenue += response.data.revenue;
              } else {
                yearlyData.push({
                  year: yearRange.year,
                  revenue: 0,
                });
              }
            } else {
              yearlyData.push({
                year: yearRange.year,
                revenue: 0,
              });
            }
          } catch (err) {
            console.error(`Error fetching revenue for ${yearRange.year}:`, err);
            yearlyData.push({
              year: yearRange.year,
              revenue: 0,
            });
          }
        }

        setYearlyRevenueData(yearlyData);
        setDailyRevenueData([]);
        setMonthlyRevenueData([]);
        setWeeklyRevenueData([]);
        setRevenueData({
          from: dateRange.from,
          to: dateRange.to,
          revenue: totalRevenue,
        });
      } else {
        // For custom, calculate number of days in range
        const startDate = new Date(dateRange.from);
        const endDate = new Date(dateRange.to);
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end days
        
        // If range is <= 31 days, show by day; otherwise show by month
        if (diffDays <= 31) {
          // Split into days
          const days = splitIntoDays(dateRange.from, dateRange.to);
          const dailyData: Array<{ day: string; revenue: number }> = [];
          let totalRevenue = 0;

          // Fetch revenue for each day
          for (const dayRange of days) {
            try {
              const dayEndDate = new Date(dayRange.to);
              const today = new Date();
              if (dayEndDate <= today) {
                const response = await getRevenue({ from: dayRange.from, to: dayRange.to });
                if (response.status && response.data && response.data.revenue !== undefined) {
                  dailyData.push({
                    day: dayRange.day,
                    revenue: response.data.revenue,
                  });
                  totalRevenue += response.data.revenue;
                } else {
                  dailyData.push({
                    day: dayRange.day,
                    revenue: 0,
                  });
                }
              } else {
                dailyData.push({
                  day: dayRange.day,
                  revenue: 0,
                });
              }
            } catch (err) {
              console.error(`Error fetching revenue for ${dayRange.day}:`, err);
              dailyData.push({
                day: dayRange.day,
                revenue: 0,
              });
            }
          }

          setDailyRevenueData(dailyData);
          setMonthlyRevenueData([]);
          setWeeklyRevenueData([]);
          setYearlyRevenueData([]);
          setRevenueData({
            from: dateRange.from,
            to: dateRange.to,
            revenue: totalRevenue,
          });
        } else {
          // Split into months
          const months = splitIntoMonths(dateRange.from, dateRange.to, false);
          const monthlyData: Array<{ month: string; revenue: number }> = [];
          let totalRevenue = 0;

          // Fetch revenue for each month
          for (const monthRange of months) {
            try {
              // Only fetch if the month range is valid (not in the future)
              const monthEndDate = new Date(monthRange.to);
              const today = new Date();
              if (monthEndDate <= today) {
                const response = await getRevenue({ from: monthRange.from, to: monthRange.to });
                if (response.status && response.data && response.data.revenue !== undefined) {
                  monthlyData.push({
                    month: monthRange.month,
                    revenue: response.data.revenue,
                  });
                  totalRevenue += response.data.revenue;
                } else {
                  monthlyData.push({
                    month: monthRange.month,
                    revenue: 0,
                  });
                }
              } else {
                // Future month, set revenue to 0
                monthlyData.push({
                  month: monthRange.month,
                  revenue: 0,
                });
              }
            } catch (err) {
              console.error(`Error fetching revenue for ${monthRange.month}:`, err);
              monthlyData.push({
                month: monthRange.month,
                revenue: 0,
              });
            }
          }

          setMonthlyRevenueData(monthlyData);
          setDailyRevenueData([]);
          setWeeklyRevenueData([]);
          setYearlyRevenueData([]);
          setRevenueData({
            from: dateRange.from,
            to: dateRange.to,
            revenue: totalRevenue,
          });
        }
      }
    } catch (err: any) {
      const errorMessage = err?.response?.data?.errors?.join(", ") || err?.message || "Có lỗi xảy ra khi tải doanh thu";
      setRevenueError(errorMessage);
      setRevenueData(null);
      setMonthlyRevenueData([]);
      setDailyRevenueData([]);
      setWeeklyRevenueData([]);
      setYearlyRevenueData([]);
      console.error("Error fetching revenue:", err);
    } finally {
      setIsLoadingRevenue(false);
    }
  };

  // Fetch order statistics
  const fetchOrderStatistics = async () => {
    try {
      const dateRange = getDateRange(selectedPeriod);
      const response = await getOrderStatistics({ from: dateRange.from, to: dateRange.to });
      if (response.status && response.data) {
        setOrderStats(response.data);
      } else {
        setOrderStats(null);
      }
    } catch (err: any) {
      // API might not be available for vendor or endpoint doesn't exist
      if (err?.response?.status === 404) {
        console.warn("Order statistics API not available");
      } else {
        console.error("Error fetching order statistics:", err);
      }
      setOrderStats(null);
    }
  };

  // Fetch best selling products
  const fetchBestSellingProducts = async () => {
    setIsLoadingProducts(true);
    try {
      const dateRange = getDateRange(selectedPeriod);
      const response = await getBestSellingProducts({ from: dateRange.from, to: dateRange.to });
      if (response.status && response.data && Array.isArray(response.data)) {
        setBestSellingProducts(response.data);
      } else {
        setBestSellingProducts([]);
      }
    } catch (err) {
      console.error("Error fetching best selling products:", err);
      setBestSellingProducts([]);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  // Fetch approved registrations count
  const fetchApprovedRegistrationsCount = async () => {
    try {
      const registrations = await getProductRegistrations();
      const approvedCount = registrations.filter(reg => reg.status === 'Approved').length;
      setApprovedRegistrationsCount(approvedCount);
    } catch (err) {
      console.error("Error fetching approved registrations count:", err);
      setApprovedRegistrationsCount(0);
    }
  };

  useEffect(() => {
    fetchRevenue();
    fetchOrderStatistics();
    fetchBestSellingProducts();
    fetchApprovedRegistrationsCount();
  }, [selectedPeriod, customDateFrom, customDateTo]);

  // Format revenue for display
  const formatRevenue = (amount: number) => {
    if (amount >= 1000000000) {
      return `${(amount / 1000000000).toFixed(2)}B`;
    } else if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(1)}K`;
    }
    return amount.toLocaleString();
  };

  // Get period label
  const getPeriodLabel = (period: string) => {
    switch (period) {
      case 'day':
        return 'Hôm nay';
      case 'week':
        return 'Tuần này';
      case 'month':
        return 'Tháng này';
      case 'year':
        return 'Năm nay';
      case 'custom':
        return 'Tùy chọn';
      default:
        return 'Tháng này';
    }
  };

  // Prepare chart data - use daily, weekly, monthly, or yearly data if available, otherwise use single data point
  const chartData = useMemo(() => {
    // Use daily data if available (for day view)
    if (dailyRevenueData.length > 0) {
      return dailyRevenueData.map(item => ({ 
        period: item.day, 
        revenue: item.revenue 
      }));
    }
    
    // Use weekly data if available (for week view)
    if (weeklyRevenueData.length > 0) {
      return weeklyRevenueData.map(item => ({ 
        period: item.week, 
        revenue: item.revenue 
      }));
    }
    
    // Use monthly data if available (for month view)
    if (monthlyRevenueData.length > 0) {
      return monthlyRevenueData.map(item => ({ 
        period: item.month, 
        revenue: item.revenue 
      }));
    }
    
    // Use yearly data if available (for year view)
    if (yearlyRevenueData.length > 0) {
      return yearlyRevenueData.map(item => ({ 
        period: item.year, 
        revenue: item.revenue 
      }));
    }
    
    if (!revenueData || revenueData.revenue === undefined) {
      return [{ period: getPeriodLabel(selectedPeriod), revenue: 0 }];
    }

    return [
      {
        period: getPeriodLabel(selectedPeriod),
        revenue: revenueData.revenue,
      },
    ];
  }, [dailyRevenueData, weeklyRevenueData, monthlyRevenueData, yearlyRevenueData, revenueData, selectedPeriod]);

  // Prepare product categories from best selling products API
  const productCategories = useMemo(() => {
    // Ensure bestSellingProducts is always an array
    if (!Array.isArray(bestSellingProducts) || bestSellingProducts.length === 0) {
      return [];
    }
    
    const totalRevenue = bestSellingProducts.reduce((sum, product) => sum + (product.totalRevenue || 0), 0);
    
    return bestSellingProducts.map((product, index) => ({
      name: product.productName || `Sản phẩm ${index + 1}`,
      value: totalRevenue > 0 ? Math.round(((product.totalRevenue || 0) / totalRevenue) * 100) : 0,
      color: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'][index % 5],
      sales: product.totalRevenue || 0,
    }));
  }, [bestSellingProducts]);


  const stats = [
    {
      title: 'Tổng doanh thu',
      value: revenueData?.revenue ? `${formatRevenue(revenueData.revenue)}` : '0',
      change: null,
      trend: null,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Tổng đơn hàng',
      value: orderStats?.total ? orderStats.total.toLocaleString() : '0',
      change: null,
      trend: null,
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Đơn đã giao',
      value: orderStats?.delivered ? orderStats.delivered.toLocaleString() : '0',
      change: null,
      trend: null,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Tỷ lệ hoàn thành',
      value: orderStats?.total && orderStats.total > 0 
        ? `${((orderStats.delivered || 0) / orderStats.total * 100).toFixed(1)}%`
        : '0%',
      change: null,
      trend: null,
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      title: 'Tổng đơn đăng ký thành công',
      value: approvedRegistrationsCount.toLocaleString(),
      change: null,
      trend: null,
      icon: CheckCircle,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50'
    }
  ];


  const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
              {stat.change && stat.trend && (
                <div className="flex items-center gap-2 mt-2">
                  {stat.trend === 'up' ? (
                    <ArrowUp className="w-4 h-4 text-green-600" />
                  ) : (
                    <ArrowDown className="w-4 h-4 text-red-600" />
                  )}
                  <span className={`text-sm font-medium ${
                    stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.change}
                  </span>
                  <span className="text-sm text-gray-500">so với tháng trước</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2 border-0 shadow-sm">
          <CardHeader>
            <div className="space-y-4">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg font-semibold">Biểu đồ doanh thu</CardTitle>
              <div className="flex gap-2">
                  <Button
                    variant={selectedPeriod === 'day' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedPeriod('day')}
                  >
                    Ngày
                  </Button>
                <Button
                  variant={selectedPeriod === 'week' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedPeriod('week')}
                >
                  Tuần
                </Button>
                <Button
                  variant={selectedPeriod === 'month' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedPeriod('month')}
                >
                  Tháng
                </Button>
                <Button
                  variant={selectedPeriod === 'year' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedPeriod('year')}
                >
                  Năm
                </Button>
                </div>
              </div>
              {selectedPeriod === 'custom' && (
                <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                  <div>
                    <Label htmlFor="date-from" className="text-sm font-medium text-gray-700 mb-2 block">
                      Từ ngày
                    </Label>
                    <Input
                      id="date-from"
                      type="date"
                      value={customDateFrom}
                      onChange={(e) => setCustomDateFrom(e.target.value)}
                      max={customDateTo || undefined}
                    />
                  </div>
                  <div>
                    <Label htmlFor="date-to" className="text-sm font-medium text-gray-700 mb-2 block">
                      Đến ngày
                    </Label>
                    <Input
                      id="date-to"
                      type="date"
                      value={customDateTo}
                      onChange={(e) => setCustomDateTo(e.target.value)}
                      min={customDateFrom || undefined}
                    />
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <Button
                  variant={selectedPeriod === 'custom' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedPeriod('custom')}
                >
                  Tùy chọn
                </Button>
                {selectedPeriod === 'custom' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const today = new Date();
                      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                      setCustomDateFrom(formatDate(startOfMonth));
                      setCustomDateTo(formatDate(today));
                    }}
                  >
                    Đặt lại
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingRevenue ? (
              <div className="flex items-center justify-center h-[300px]">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Đang tải dữ liệu...</p>
                </div>
              </div>
            ) : revenueError ? (
              <div className="flex items-center justify-center h-[300px]">
                <div className="text-center">
                  <p className="text-sm text-red-600 mb-2">{revenueError}</p>
                  <Button variant="outline" size="sm" onClick={fetchRevenue}>
                    Thử lại
                  </Button>
                </div>
              </div>
            ) : (
            <ResponsiveContainer width="100%" height={300}>
                <RechartsBarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="period" 
                    stroke="#6b7280"
                    angle={selectedPeriod === 'month' ? -45 : 0}
                    textAnchor={selectedPeriod === 'month' ? 'end' : 'middle'}
                    height={selectedPeriod === 'month' ? 80 : 30}
                  />
                  <YAxis 
                    stroke="#6b7280"
                    tickFormatter={(value) => formatRevenue(value)}
                  />
                <Tooltip 
                    formatter={(value: number) => [`${Number(value).toLocaleString('vi-VN')}đ`, 'Doanh thu']}
                    labelFormatter={(label) => label}
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                />
                <Legend />
                <Bar dataKey="revenue" fill="#10B981" radius={[4, 4, 0, 0]} />
              </RechartsBarChart>
            </ResponsiveContainer>
            )}
            {revenueData && revenueData.revenue !== undefined && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Tổng doanh thu ({getPeriodLabel(selectedPeriod)}):</span>
                  <span className="text-lg font-bold text-green-600">
                    {revenueData.revenue.toLocaleString('vi-VN')}đ
                  </span>
                </div>
                {revenueData.from && revenueData.to && (
                  <div className="text-xs text-gray-500 mt-1">
                    Từ {revenueData.from} đến {revenueData.to}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Best Selling Products Pie Chart */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Sản phẩm bán chạy</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingProducts ? (
              <div className="flex items-center justify-center h-[200px]">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              </div>
            ) : productCategories.length > 0 ? (
              <>
                <div className="flex items-center justify-center">
                  <ResponsiveContainer width="60%" height={200}>
                    <RechartsPieChart>
                      <Pie
                        data={productCategories}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                        outerRadius={70}
                        innerRadius={30}
                        fill="#8884d8"
                        dataKey="value"
                        paddingAngle={2}
                      >
                        {productCategories.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => [`${value}%`, 'Tỷ lệ']}
                        labelStyle={{ fontWeight: 'bold' }}
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                  
                  {/* Custom Legend */}
                  <div className="w-40 ml-6 space-y-3">
                    {productCategories.map((category, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full shadow-sm"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {category.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {category.value}% • {category.sales.toLocaleString()}đ
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Summary */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Tổng cộng:</span>
                    <span className="font-semibold text-gray-900">
                      {productCategories.reduce((sum, cat) => sum + cat.sales, 0).toLocaleString()}đ
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-gray-500 text-sm">
                Chưa có dữ liệu sản phẩm bán chạy
              </div>
            )}
          </CardContent>
        </Card>
      </div>

    </>
  );
};
