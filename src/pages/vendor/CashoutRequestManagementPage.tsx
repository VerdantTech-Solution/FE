import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/shadcn-io/spinner';
import VendorSidebar from './VendorSidebar';
import { 
  FileText,
  Building2,
  CreditCard,
  User,
  Calendar,
  AlertCircle,
  RefreshCw,
  DollarSign,
  Clock
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getPendingCashoutRequest, deletePendingCashoutRequest, type CashoutRequestData } from '@/api/wallet';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Trash2 } from 'lucide-react';

const currency = (v: number) => v.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const StatusBadge = ({ status }: { status: string }) => {
  const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string }> = {
    'Pending': {
      label: 'Đang chờ',
      variant: 'default',
      className: 'bg-yellow-100 text-yellow-800 border-yellow-300'
    },
    'Approved': {
      label: 'Đã duyệt',
      variant: 'default',
      className: 'bg-green-100 text-green-800 border-green-300'
    },
    'Rejected': {
      label: 'Đã từ chối',
      variant: 'destructive',
      className: 'bg-red-100 text-red-800 border-red-300'
    },
    'Completed': {
      label: 'Hoàn thành',
      variant: 'default',
      className: 'bg-blue-100 text-blue-800 border-blue-300'
    }
  };

  const config = statusConfig[status] || {
    label: status,
    variant: 'outline',
    className: 'bg-gray-100 text-gray-800 border-gray-300'
  };

  return (
    <Badge variant={config.variant} className={config.className}>
      {config.label}
    </Badge>
  );
};

const CashoutRequestManagementPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cashoutRequest, setCashoutRequest] = useState<CashoutRequestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchCashoutRequest = async () => {
    if (!user?.id) {
      setError('Không tìm thấy thông tin người dùng');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const userId = Number(user.id);
      const response = await getPendingCashoutRequest(userId);

      if (response && typeof response === 'object' && 'status' in response) {
        const statusValue: any = response.status;
        const statusIsTrue = statusValue === true || 
                            statusValue === 'true' ||
                            (typeof statusValue === 'string' && String(statusValue).toLowerCase() === 'true');
        
        if (statusIsTrue && response.data) {
          setCashoutRequest(response.data);
        } else {
          // No cashout request found
          setCashoutRequest(null);
        }
      } else if (response && typeof response === 'object' && 'id' in response) {
        // Response is directly the cashout data
        setCashoutRequest(response as CashoutRequestData);
      } else {
        setCashoutRequest(null);
      }
    } catch (err: any) {
      setError(err?.message || 'Không thể tải thông tin yêu cầu rút tiền');
      setCashoutRequest(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCashoutRequest();
  }, [user?.id]);

  const handleDeleteRequest = async () => {
    try {
      setDeleting(true);
      const response = await deletePendingCashoutRequest();

      if (response && typeof response === 'object' && 'status' in response) {
        const statusValue: any = response.status;
        const statusIsTrue = statusValue === true || 
                            statusValue === 'true' ||
                            (typeof statusValue === 'string' && String(statusValue).toLowerCase() === 'true');
        
        if (statusIsTrue) {
          // Delete successful
          setShowDeleteDialog(false);
          setCashoutRequest(null);
          // Optionally show success message or navigate
        } else {
          // Delete failed
          const errorMessage = response.errors && response.errors.length > 0 
            ? response.errors[0] 
            : 'Không thể xóa yêu cầu rút tiền';
          setError(errorMessage);
        }
      } else {
        setError('Không thể xóa yêu cầu rút tiền');
      }
    } catch (err: any) {
      setError(err?.message || 'Không thể xóa yêu cầu rút tiền');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <VendorSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Spinner variant="circle-filled" size={60} className="text-green-600 mx-auto mb-4" />
            <p className="text-gray-600">Đang tải thông tin yêu cầu rút tiền...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <VendorSidebar />
      
      <div className="flex-1 overflow-y-auto">
        <div className="p-8">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Quản lý yêu cầu rút tiền</h1>
              <p className="text-gray-600 mt-1">Xem và theo dõi trạng thái yêu cầu rút tiền của bạn</p>
            </div>
            <div className="flex items-center gap-3">
              {cashoutRequest && cashoutRequest.status === 'Pending' && (
                <Button 
                  variant="destructive" 
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={deleting || loading}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Xóa yêu cầu
                </Button>
              )}
              <Button 
                variant="outline" 
                onClick={fetchCashoutRequest}
                disabled={loading}
              >
                {loading ? (
                  <Spinner variant="circle-filled" size={16} className="mr-2" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Làm mới
              </Button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <Card className="border-red-200 bg-red-50 mb-6">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 text-red-600">
                  <AlertCircle className="w-5 h-5" />
                  <p>{error}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Cashout Request Card */}
          {cashoutRequest ? (
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="w-6 h-6 text-green-600" />
                    <span>Yêu cầu rút tiền #{cashoutRequest.id}</span>
                  </CardTitle>
                  <StatusBadge status={cashoutRequest.status} />
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Amount */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Số tiền yêu cầu</p>
                      <p className="text-3xl font-bold text-green-700">
                        {currency(cashoutRequest.amount)}
                      </p>
                    </div>
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                      <DollarSign className="w-8 h-8 text-green-600" />
                    </div>
                  </div>
                </div>

                {/* Bank Account Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="bg-gray-50">
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                        <CreditCard className="w-5 h-5 mr-2 text-gray-600" />
                        Thông tin ngân hàng
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2 text-sm">
                          <Building2 className="w-4 h-4 text-gray-500" />
                          <span className="font-medium text-gray-700">Ngân hàng:</span>
                          <span className="text-gray-900">{cashoutRequest.bankAccount.bankCode}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm">
                          <CreditCard className="w-4 h-4 text-gray-500" />
                          <span className="font-medium text-gray-700">Số tài khoản:</span>
                          <span className="text-gray-900 font-mono">{cashoutRequest.bankAccount.accountNumber}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm">
                          <User className="w-4 h-4 text-gray-500" />
                          <span className="font-medium text-gray-700">Chủ tài khoản:</span>
                          <span className="text-gray-900">{cashoutRequest.bankAccount.accountHolder}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gray-50">
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                        <Clock className="w-5 h-5 mr-2 text-gray-600" />
                        Thông tin yêu cầu
                      </h3>
                      <div className="space-y-3">
                        {cashoutRequest.reason && cashoutRequest.reason !== 'string' && (
                          <div className="text-sm">
                            <span className="font-medium text-gray-700">Lý do:</span>
                            <p className="text-gray-900 mt-1">{cashoutRequest.reason}</p>
                          </div>
                        )}
                        {cashoutRequest.notes && cashoutRequest.notes !== 'string' && (
                          <div className="text-sm">
                            <span className="font-medium text-gray-700">Ghi chú:</span>
                            <p className="text-gray-900 mt-1">{cashoutRequest.notes}</p>
                          </div>
                        )}
                        <div className="flex items-center space-x-2 text-sm">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="font-medium text-gray-700">Ngày tạo:</span>
                          <span className="text-gray-900">{formatDate(cashoutRequest.createdAt)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Status Info */}
                {cashoutRequest.status === 'Pending' && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <Clock className="w-5 h-5 text-yellow-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-yellow-900">Yêu cầu đang chờ xử lý</p>
                        <p className="text-sm text-yellow-700 mt-1">
                          Yêu cầu rút tiền của bạn đang được xem xét bởi quản trị viên. Vui lòng chờ thông báo.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {cashoutRequest.status === 'Approved' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center mt-0.5">
                        <span className="text-white text-xs">✓</span>
                      </div>
                      <div>
                        <p className="font-medium text-green-900">Yêu cầu đã được duyệt</p>
                        <p className="text-sm text-green-700 mt-1">
                          Yêu cầu rút tiền của bạn đã được duyệt. Tiền sẽ được chuyển vào tài khoản ngân hàng của bạn trong thời gian sớm nhất.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {cashoutRequest.status === 'Rejected' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-red-900">Yêu cầu đã bị từ chối</p>
                        <p className="text-sm text-red-700 mt-1">
                          Yêu cầu rút tiền của bạn đã bị từ chối. Vui lòng liên hệ với quản trị viên để biết thêm chi tiết.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {cashoutRequest.status === 'Completed' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center mt-0.5">
                        <span className="text-white text-xs">✓</span>
                      </div>
                      <div>
                        <p className="font-medium text-blue-900">Yêu cầu đã hoàn thành</p>
                        <p className="text-sm text-blue-700 mt-1">
                          Tiền đã được chuyển vào tài khoản ngân hàng của bạn thành công.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Chưa có yêu cầu rút tiền</h3>
                <p className="text-gray-600 mb-6">
                  Hiện tại bạn chưa có yêu cầu rút tiền nào. Bạn có thể tạo yêu cầu rút tiền mới từ trang Ví.
                </p>
                <Button 
                  onClick={() => navigate('/vendor/wallet')}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Đi đến trang Ví
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Delete Confirmation Dialog */}
          <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <AlertDialogContent className="max-w-md">
              <AlertDialogHeader>
                <div className="mx-auto mb-4 w-14 h-14 bg-red-50 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-7 h-7 text-red-600" />
                </div>
                <AlertDialogTitle>Xác nhận xóa yêu cầu rút tiền?</AlertDialogTitle>
                <AlertDialogDescription>
                  Bạn có chắc chắn muốn xóa yêu cầu rút tiền này? Hành động này không thể hoàn tác. 
                  Bạn sẽ cần tạo yêu cầu mới nếu muốn rút tiền sau này.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={deleting}>Hủy</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteRequest}
                  disabled={deleting}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {deleting ? (
                    <>
                      <Spinner variant="circle-filled" size={16} className="mr-2" />
                      Đang xóa...
                    </>
                  ) : (
                    'Xóa'
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
};

export default CashoutRequestManagementPage;

