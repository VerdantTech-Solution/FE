import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import {
  getMyTickets,
  getTicketById,
  type TicketImage,
  type TicketItem,
  type TicketDetail,
} from '@/api/ticket';
import { useAuth } from '@/contexts/AuthContext';

interface TicketListProps {
  refreshKey?: number;
}

const TicketList = ({ refreshKey = 0 }: TicketListProps) => {
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [selectedTicketDetail, setSelectedTicketDetail] = useState<TicketDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);
  const [detailError, setDetailError] = useState<string>('');
  const { user, isAuthenticated } = useAuth();

  type TicketWithFallbackImages = TicketItem & {
    requestTicketImages?: TicketImage[];
    ticketImages?: TicketImage[];
  };

  const normalizeTicketImages = (ticket: TicketWithFallbackImages): TicketItem => {
    if (ticket.images && ticket.images.length > 0) {
      return ticket;
    }

    const fallbackImages = ticket.requestTicketImages || ticket.ticketImages;

    if (Array.isArray(fallbackImages) && fallbackImages.length > 0) {
      return {
        ...ticket,
        images: fallbackImages.map((image) => ({
          imageUrl: image.imageUrl,
          imagePublicId: image.imagePublicId,
        })),
      };
    }

    return ticket;
  };

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError('');

      if (!isAuthenticated) {
        setTickets([]);
        setError('Vui lòng đăng nhập để xem yêu cầu hỗ trợ của bạn.');
        return;
      }

      const response = await getMyTickets({ page: 1, pageSize: 50 });

      if (response.status && response.data?.data) {
        const normalizedTickets = response.data.data.map(normalizeTicketImages);
        setTickets(normalizedTickets);
      } else {
        const errorMsg =
          response.errors?.join(', ') ||
          response.errors?.[0] ||
          'Không thể tải danh sách yêu cầu hỗ trợ';
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

  const handleSelectTicket = async (ticketId: number) => {
    // Nếu đang mở ticket này thì đóng lại
    if (selectedTicketId === ticketId) {
      setSelectedTicketId(null);
      setSelectedTicketDetail(null);
      setDetailError('');
      return;
    }

    try {
      setSelectedTicketId(ticketId);
      setDetailLoading(true);
      setDetailError('');

      const response = await getTicketById(ticketId);

      if (response.status && response.data) {
        setSelectedTicketDetail(response.data);
      } else {
        const errorMsg =
          response.errors?.join(', ') ||
          response.errors?.[0] ||
          'Không thể tải chi tiết yêu cầu hỗ trợ';
        setDetailError(errorMsg);
        setSelectedTicketDetail(null);
      }
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.errors?.join(', ') ||
        err?.response?.data?.errors?.[0] ||
        err?.response?.data?.message ||
        err?.message ||
        'Có lỗi xảy ra khi tải chi tiết yêu cầu hỗ trợ';
      setDetailError(errorMsg);
      setSelectedTicketDetail(null);
    } finally {
      setDetailLoading(false);
    }
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
              className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all duration-200 bg-white cursor-pointer"
              onClick={() => handleSelectTicket(ticket.id)}
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

              {/* Chi tiết ticket (messages) */}
              {selectedTicketId === ticket.id && (
                <div className="mt-4 border-t pt-3">
                  {detailLoading && (
                    <p className="text-xs text-gray-500">Đang tải chi tiết...</p>
                  )}

                  {detailError && !detailLoading && (
                    <p className="text-xs text-red-500">{detailError}</p>
                  )}

                  {!detailLoading &&
                    !detailError &&
                    selectedTicketDetail?.requestMessages &&
                    selectedTicketDetail.requestMessages.length > 0 && (
                      <div className="space-y-3">
                        {selectedTicketDetail.requestMessages.map((message) => (
                          <div
                            key={message.id}
                            className="rounded-md border border-gray-200 bg-gray-50 p-3"
                          >
                            <p className="text-xs text-gray-500 mb-1">
                              {formatDate(message.createdAt)}
                            </p>
                            <p className="text-sm text-gray-800 whitespace-pre-line mb-2">
                              {message.description}
                            </p>

                            {message.images && message.images.length > 0 && (
                              <div className="flex gap-2 mb-2 overflow-x-auto">
                                {message.images.map((image, index) => (
                                  <img
                                    key={index}
                                    src={image.imageUrl}
                                    alt={`Message image ${index + 1}`}
                                    className="w-16 h-16 object-cover rounded border border-gray-200 flex-shrink-0"
                                  />
                                ))}
                              </div>
                            )}

                            {message.replyNotes && (
                              <div className="mt-2 rounded border border-blue-100 bg-blue-50 p-2">
                                <p className="text-[11px] font-semibold text-blue-700 uppercase tracking-wide mb-1">
                                  Phản hồi từ đội hỗ trợ
                                </p>
                                <p className="text-xs text-blue-700 whitespace-pre-line">
                                  {message.replyNotes}
                                </p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
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

