import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, UserCheck, Package, Award, FileCheck, HelpCircle, AlertCircle } from 'lucide-react';
// Dashboard API removed
type QueueStatistics = {
  vendorProfile: number;
  productRegistration: number;
  vendorCertificate: number;
  productCertificate: number;
  request: number;
  total: number;
};

interface QueueStatisticsCardProps {
  title?: string;
}

export const QueueStatisticsCard = ({ title = "Thống kê yêu cầu chờ xử lý" }: QueueStatisticsCardProps) => {
  const [queueStats, setQueueStats] = useState<QueueStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Dashboard API removed - functionality disabled
        const response = { status: false, data: null };
        if (response.status && response.data) {
          setQueueStats(response.data);
        } else {
          setError('Không thể tải dữ liệu');
        }
      } catch (err: any) {
        console.error('Error fetching queue statistics:', err);
        const errorMessage = err?.response?.data?.errors?.join(", ") || err?.message || "Có lỗi xảy ra khi tải dữ liệu";
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const queueItems = [
    {
      key: 'vendorProfile' as keyof QueueStatistics,
      label: 'Hồ sơ Vendor',
      icon: UserCheck,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      key: 'productRegistration' as keyof QueueStatistics,
      label: 'Đăng ký Sản phẩm',
      icon: Package,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      key: 'vendorCertificate' as keyof QueueStatistics,
      label: 'Chứng chỉ Vendor',
      icon: Award,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      key: 'productCertificate' as keyof QueueStatistics,
      label: 'Chứng chỉ Sản phẩm',
      icon: FileCheck,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      key: 'request' as keyof QueueStatistics,
      label: 'Yêu cầu khác',
      icon: HelpCircle,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50'
    }
  ];

  if (isLoading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px]">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Đang tải dữ liệu...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px]">
            <div className="text-center">
              <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
              <p className="text-sm text-red-600 mb-2">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="text-sm text-blue-600 hover:underline"
              >
                Thử lại
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          {queueStats && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Tổng:</span>
              <span className={`text-lg font-bold ${
                queueStats.total > 0 ? 'text-red-600' : 'text-green-600'
              }`}>
                {queueStats.total}
              </span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {queueStats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {queueItems.map((item) => {
              const Icon = item.icon;
              const value = queueStats[item.key] || 0;
              return (
                <div
                  key={String(item.key)}
                  className={`p-4 rounded-lg border ${
                    value > 0 ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className={`p-2 rounded-lg ${item.bgColor}`}>
                      <Icon className={`w-5 h-5 ${item.color}`} />
                    </div>
                    {value > 0 && (
                      <span className="text-xs font-semibold text-red-600 bg-red-100 px-2 py-1 rounded-full">
                        {value}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-gray-700 mb-1">{item.label}</p>
                  <p className={`text-2xl font-bold ${
                    value > 0 ? 'text-red-600' : 'text-gray-400'
                  }`}>
                    {value}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center justify-center h-[200px]">
            <p className="text-sm text-gray-500">Không có dữ liệu</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

