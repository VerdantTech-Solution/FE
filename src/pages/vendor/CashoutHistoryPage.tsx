import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/shadcn-io/spinner';
import VendorSidebar from './VendorSidebar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  History,
  Building2,
  CreditCard,
  DollarSign,
  RefreshCw,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Calendar,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router';
import {
  getVendorCashoutHistory,
  type CashoutRequestData,
  type CashoutRequestsPage,
} from '@/api/wallet';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);

const formatDateTime = (value?: string) => {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString('vi-VN');
  } catch {
    return value;
  }
};

const getStatusBadgeClass = (status?: string) => {
  switch (status) {
    case 'Approved':
      return 'bg-green-100 text-green-700';
    case 'Rejected':
      return 'bg-red-100 text-red-700';
    case 'Processing':
      return 'bg-blue-100 text-blue-700';
    case 'Completed':
      return 'bg-blue-100 text-blue-700';
    default:
      return 'bg-yellow-100 text-yellow-700';
  }
};

const getStatusLabel = (status?: string) => {
  switch (status) {
    case 'Pending':
      return 'Đang chờ';
    case 'Processing':
      return 'Đang xử lý';
    case 'Approved':
      return 'Đã duyệt';
    case 'Rejected':
      return 'Đã từ chối';
    case 'Completed':
      return 'Hoàn thành';
    default:
      return status || 'Unknown';
  }
};

const defaultPagination: CashoutRequestsPage = {
  data: [],
  currentPage: 1,
  pageSize: 10,
  totalPages: 1,
  totalRecords: 0,
  hasNextPage: false,
  hasPreviousPage: false,
};

const CashoutHistoryPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<CashoutRequestData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [paginationMeta, setPaginationMeta] =
    useState<CashoutRequestsPage>(defaultPagination);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const fetchCashoutHistory = useCallback(
    async (
      page = currentPage,
      size = pageSize,
      options?: { skipLoading?: boolean }
    ) => {
      if (!user?.id) {
        setError('Không tìm thấy thông tin người dùng');
        setLoading(false);
        return;
      }

      const skipLoading = options?.skipLoading ?? false;

      try {
        if (!skipLoading) {
          setLoading(true);
        }
        setError(null);

        const userId = Number(user.id);
        const response = await getVendorCashoutHistory(userId, page, size);

        if (response && response.status && response.data) {
          setRequests(response.data.data || []);
          setPaginationMeta({
            data: response.data.data || [],
            currentPage: response.data.currentPage,
            pageSize: response.data.pageSize,
            totalPages: response.data.totalPages,
            totalRecords: response.data.totalRecords,
            hasNextPage: response.data.hasNextPage,
            hasPreviousPage: response.data.hasPreviousPage,
          });
        } else {
          setRequests([]);
          setPaginationMeta((prev) => ({
            ...prev,
            data: [],
            currentPage: page,
            pageSize: size,
          }));

          const errorMessage =
            response?.errors && response.errors.length > 0
              ? response.errors.join(', ')
              : 'Không có dữ liệu lịch sử rút tiền';
          setError(errorMessage);
        }
      } catch (err: any) {
        const errorMessage =
          err?.errors?.[0] ||
          err?.message ||
          'Có lỗi xảy ra khi tải lịch sử rút tiền';
        setError(errorMessage);
        setRequests([]);
        setPaginationMeta((prev) => ({
          ...prev,
          data: [],
          currentPage: page,
          pageSize: size,
        }));
      } finally {
        if (!skipLoading) {
          setLoading(false);
        }
      }
    },
    [user?.id, currentPage, pageSize]
  );

  useEffect(() => {
    fetchCashoutHistory(currentPage, pageSize);
  }, [currentPage, pageSize, fetchCashoutHistory]);

  const totalRequestedAmount = useMemo(
    () => requests.reduce((sum, item) => sum + (item.amount || 0), 0),
    [requests]
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchCashoutHistory(currentPage, pageSize, { skipLoading: true });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handlePageSizeChange = (value: string) => {
    const size = Number(value);
    setPageSize(size);
    setCurrentPage(1);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < paginationMeta.totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <VendorSidebar />

      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Lịch sử rút tiền</h1>
              <p className="text-gray-600">Xem tất cả các yêu cầu rút tiền của bạn</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" className="p-2">
                <History size={20} />
              </Button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">{user?.fullName || 'Vendor Name'}</span>
              </div>
              <Button 
                variant="outline" 
                className="border-red-300 text-red-600 hover:bg-red-50"
                onClick={handleLogout}
              >
                Đăng xuất
              </Button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div></div>
              <div className="flex items-center gap-3">
                <Select
                  value={pageSize.toString()}
                  onValueChange={handlePageSizeChange}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Số dòng" />
                  </SelectTrigger>
                  <SelectContent>
                    {[5, 10, 20, 50].map((size) => (
                      <SelectItem key={size} value={size.toString()}>
                        {size} dòng / trang
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  onClick={handleRefresh}
                  disabled={loading || isRefreshing}
                  className="gap-2"
                >
                  {isRefreshing || loading ? (
                    <Spinner variant="circle-filled" size={16} className="animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  Làm mới
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Tổng yêu cầu</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {paginationMeta.totalRecords}
                    </p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100">
                    <History className="h-5 w-5 text-gray-600" />
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Tổng số tiền</p>
                    <p className="text-3xl font-bold text-green-600">
                      {formatCurrency(totalRequestedAmount)}
                    </p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                    <DollarSign className="h-5 w-5 text-green-600" />
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Đang chờ xử lý</p>
                    <p className="text-3xl font-bold text-yellow-600">
                      {requests.filter(
                        (r) => r.status === 'Pending' || r.status === 'Processing'
                      ).length}
                    </p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-100">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                  </div>
                </div>
              </Card>
            </div>

            {error && (
              <Card className="border border-red-200 bg-red-50">
                <CardContent className="flex items-center gap-3 p-4 text-red-600">
                  <AlertCircle className="h-5 w-5" />
                  <p>{error}</p>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">
                  Danh sách yêu cầu rút tiền
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading && !isRefreshing ? (
                  <div className="flex items-center justify-center py-12 text-gray-500">
                    <Spinner variant="circle-filled" size={20} className="mr-3 animate-spin" />
                    Đang tải dữ liệu...
                  </div>
                ) : requests.length === 0 ? (
                  <div className="py-12 text-center text-gray-500">
                    <History className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p>Chưa có yêu cầu rút tiền nào.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Mã yêu cầu
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Số tiền
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Ngân hàng
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Lý do/Ghi chú
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Ngày tạo
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Trạng thái
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white">
                        {requests.map((request) => (
                          <tr key={request.id} className="hover:bg-gray-50">
                            <td className="px-4 py-4 text-sm font-medium text-gray-900">
                              #{request.id}
                            </td>
                            <td className="px-4 py-4 text-sm font-semibold text-green-600">
                              {formatCurrency(request.amount)}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-700">
                              <div className="flex flex-col gap-1">
                                <span className="flex items-center gap-2 text-gray-900">
                                  <Building2 className="h-4 w-4 text-gray-400" />
                                  {request.bankAccount?.bankCode || '—'}
                                </span>
                                <span className="flex items-center gap-2 text-gray-600">
                                  <CreditCard className="h-4 w-4 text-gray-400" />
                                  {request.bankAccount?.accountNumber || '—'}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-700">
                              <div className="space-y-1">
                                {request.reason && (
                                  <p className="text-gray-700">
                                    <span className="font-medium text-gray-900">Lý do:</span>{' '}
                                    {request.reason}
                                  </p>
                                )}
                                {request.notes && (
                                  <p className="text-gray-500">
                                    <span className="font-medium text-gray-900">Ghi chú:</span>{' '}
                                    {request.notes}
                                  </p>
                                )}
                                {!request.reason && !request.notes && '—'}
                              </div>
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-700">
                              <div className="space-y-1">
                                <p className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-gray-400" />
                                  {formatDateTime(request.createdAt)}
                                </p>
                                {request.processedAt && (
                                  <p className="text-xs text-gray-500">
                                    Xử lý: {formatDateTime(request.processedAt)}
                                  </p>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-4 text-sm">
                              <Badge
                                className={`${getStatusBadgeClass(
                                  request.status
                                )} border-0`}
                              >
                                {getStatusLabel(request.status)}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="mt-6 flex flex-col items-center justify-between gap-4 border-t border-gray-200 pt-4 text-sm text-gray-600 md:flex-row">
                  <div>
                    Trang {paginationMeta.currentPage} / {paginationMeta.totalPages} •{' '}
                    {paginationMeta.totalRecords} yêu cầu
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePreviousPage}
                      disabled={currentPage === 1 || loading}
                      className="gap-1"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Trước
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextPage}
                      disabled={
                        currentPage === paginationMeta.totalPages ||
                        loading ||
                        paginationMeta.totalPages === 0
                      }
                      className="gap-1"
                    >
                      Sau
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CashoutHistoryPage;

