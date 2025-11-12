import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { getTicketsByUser, type TicketItem } from '@/api/ticket';
import { useAuth } from '@/contexts/AuthContext';

interface TicketListProps {
  refreshKey?: number;
}

const TicketList = ({ refreshKey = 0 }: TicketListProps) => {
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const { user, isAuthenticated } = useAuth();

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError('');

      if (!isAuthenticated || !user?.id) {
        setTickets([]);
        setError('Vui lòng đăng nhập để xem yêu cầu hỗ trợ của bạn.');
        return;
      }

      const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
      if (!userId || Number.isNaN(userId)) {
        setTickets([]);
        setError('Không xác định được người dùng. Vui lòng thử lại sau.');
        return;
      }

      const response = await getTicketsByUser(userId);

      if (response.status && response.data) {
        setTickets(response.data);
      } else {
        const errorMsg = response.errors?.join(', ') || response.errors?.[0] || 'Không thể tải danh sách yêu cầu hỗ trợ';
        setError(errorMsg);
        setTickets([]);
      }
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.errors?.join(', ') ||
        err?.response?.data?.errors?.[0] ||
        err?.response?.data?.message ||
        err?.message ||
        'Có lỗi xảy ra khi tải danh sách yêu cầu hỗ trợ';
      setError(errorMsg);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey, user?.id, isAuthenticated]);

  const getStatusBadge = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    
    switch (normalizedStatus) {
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
            <Clock className="w-3 h-3 mr-1" />
            Đang chờ
          </Badge>
        );
      case 'inprogress':
      case 'in_progress':
        return (
          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
            <MessageSquare className="w-3 h-3 mr-1" />
            Đang xử lý
          </Badge>
        );
      case 'resolved':
      case 'completed':
        return (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
            <CheckCircle className="w-3 h-3 mr-1" />
            Đã giải quyết
          </Badge>
        );
      case 'closed':
        return (
          <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">
            <XCircle className="w-3 h-3 mr-1" />
            Đã đóng
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">
            {status}
          </Badge>
        );
    }
  };

  const getRequestTypeLabel = (type: string) => {
    return type === 'RefundRequest' ? 'Yêu cầu hoàn tiền' : 'Yêu cầu hỗ trợ';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm text-gray-500">Đang tải...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
        <CardContent className="py-10">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <p className="text-sm text-red-600 font-medium">Không thể tải danh sách yêu cầu hỗ trợ</p>
            <p className="text-sm text-gray-600">{error}</p>
            <Button
              variant="outline"
              onClick={fetchTickets}
              className="mt-2"
            >
              Thử lại
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (tickets.length === 0) {
    return (
      <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
        <CardContent className="py-12">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-50 to-blue-100 mb-4">
              <MessageSquare className="text-blue-500" size={32} />
            </div>
            <h3 className="text-sm font-medium text-gray-900 mb-1">Chưa có yêu cầu hỗ trợ</h3>
            <p className="text-xs text-gray-500">Tạo yêu cầu mới để được hỗ trợ</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Danh sách yêu cầu hỗ trợ</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <div
              key={ticket.id}
              className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all duration-200 bg-white"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900">{ticket.title}</h3>
                    {getStatusBadge(ticket.status)}
                  </div>
                  <p className="text-xs text-gray-500 mb-1">
                    {getRequestTypeLabel(ticket.requestType)}
                  </p>
                  <p className="text-sm text-gray-700 line-clamp-2">{ticket.description}</p>
                </div>
              </div>

              {/* Images Preview */}
              {ticket.images && ticket.images.length > 0 && (
                <div className="flex gap-2 mb-3 overflow-x-auto">
                  {ticket.images.slice(0, 3).map((image, index) => (
                    <img
                      key={index}
                      src={image.imageUrl}
                      alt={`Ticket image ${index + 1}`}
                      className="w-20 h-20 object-cover rounded-lg border border-gray-200 flex-shrink-0"
                    />
                  ))}
                  {ticket.images.length > 3 && (
                    <div className="w-20 h-20 rounded-lg border border-gray-200 flex items-center justify-center bg-gray-50 flex-shrink-0">
                      <span className="text-xs text-gray-500">+{ticket.images.length - 3}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Tạo: {formatDate(ticket.createdAt)}</span>
                {ticket.updatedAt !== ticket.createdAt && (
                  <span>Cập nhật: {formatDate(ticket.updatedAt)}</span>
                )}
              </div>

                {ticket.replyNotes && (
                  <div className="mt-3 rounded-md border border-blue-100 bg-blue-50 p-3">
                    <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">
                      Ghi chú từ đội hỗ trợ
                    </p>
                    <p className="text-sm text-blue-700 whitespace-pre-line">
                      {ticket.replyNotes}
                    </p>
                  </div>
                )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TicketList;

