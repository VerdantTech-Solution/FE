import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Clock, CheckCircle, XCircle, AlertCircle, Upload, X, CreditCard } from 'lucide-react';
import {
  getMyTickets,
  getTicketById,
  createTicketMessage,
  type TicketImage,
  type TicketItem,
  type TicketDetail,
} from '@/api/ticket';
import { useAuth } from '@/contexts/AuthContext';
import { Textarea } from '@/components/ui/textarea';
import {
  getSupportedBanks,
  getVendorBankAccounts,
  type VendorBankAccount,
  type SupportedBank,
} from '@/api/vendorbankaccounts';
import CreateBankDialog from '@/components/bank/CreateBankDialog';

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
  const [newMessage, setNewMessage] = useState('');
  const [messageImages, setMessageImages] = useState<TicketImage[]>([]);
  const [messageError, setMessageError] = useState('');
  const [messageSuccess, setMessageSuccess] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isUploadingMessageImage, setIsUploadingMessageImage] = useState(false);
  const selectedTicketIdRef = useRef<number | null>(null);
  const { user, isAuthenticated } = useAuth();
  const [bankAccounts, setBankAccounts] = useState<VendorBankAccount[]>([]);
  const [supportedBanks, setSupportedBanks] = useState<SupportedBank[]>([]);
  const [bankLoading, setBankLoading] = useState(false);
  const [bankError, setBankError] = useState('');
  const [isBankDialogOpen, setIsBankDialogOpen] = useState(false);

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

  useEffect(() => {
    selectedTicketIdRef.current = selectedTicketId;
  }, [selectedTicketId]);

  useEffect(() => {
    if (!messageSuccess) return;
    const timeout = setTimeout(() => setMessageSuccess(''), 5000);
    return () => clearTimeout(timeout);
  }, [messageSuccess]);

  const loadSupportedBanks = useCallback(async () => {
    try {
      const banks = await getSupportedBanks();
      setSupportedBanks(banks);
    } catch (err) {
      console.error('Load supported banks error:', err);
    }
  }, []);

  const loadBankAccounts = useCallback(async () => {
    const currentUserId = user?.id ? Number(user.id) : undefined;
    if (!currentUserId || !isAuthenticated) {
      setBankAccounts([]);
      return;
    }

    try {
      setBankLoading(true);
      setBankError('');
      const accounts = await getVendorBankAccounts(currentUserId);
      setBankAccounts(accounts || []);
    } catch (err: any) {
      console.error('Load user bank accounts error:', err);
      setBankAccounts([]);
      const message =
        err?.response?.data?.errors?.[0] ||
        err?.response?.data?.message ||
        err?.message ||
        'Không thể tải thông tin ngân hàng';
      setBankError(message);
    } finally {
      setBankLoading(false);
    }
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;
    void loadSupportedBanks();
    void loadBankAccounts();
  }, [isAuthenticated, user?.id, loadSupportedBanks, loadBankAccounts]);

  const handleBankAccountSuccess = useCallback(() => {
    void loadBankAccounts();
  }, [loadBankAccounts]);

  const findBankInfo = useCallback(
    (bankCode: string) => supportedBanks.find((bank) => bank.bin === bankCode || bank.code === bankCode),
    [supportedBanks]
  );

  const userIdForBank = user?.id ? Number(user.id) : 0;
  const bankDialog = (
    <CreateBankDialog
      open={isBankDialogOpen}
      onOpenChange={setIsBankDialogOpen}
      userId={userIdForBank}
      onSuccess={handleBankAccountSuccess}
    />
  );

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
      case 'approved':
        return (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
            <CheckCircle className="w-3 h-3 mr-1" />
            Đã phê duyệt
          </Badge>
        );
      case 'cancel':
      case 'cancelled':
      case 'canceled':
        return (
          <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
            <XCircle className="w-3 h-3 mr-1" />
            Đã hủy
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

  const resetMessageInputs = () => {
    setNewMessage('');
    setMessageImages([]);
    setMessageError('');
  };

  const loadTicketDetail = async (ticketId: number, options: { showLoading?: boolean } = {}) => {
    const { showLoading = true } = options;
    try {
      if (showLoading) {
        setDetailLoading(true);
      }
      setDetailError('');
      const response = await getTicketById(ticketId);

      if (selectedTicketIdRef.current !== ticketId) {
        return;
      }

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
      if (selectedTicketIdRef.current !== ticketId) {
        return;
      }
      const errorMsg =
        err?.response?.data?.errors?.join(', ') ||
        err?.response?.data?.errors?.[0] ||
        err?.response?.data?.message ||
        err?.message ||
        'Có lỗi xảy ra khi tải chi tiết yêu cầu hỗ trợ';
      setDetailError(errorMsg);
      setSelectedTicketDetail(null);
    } finally {
      if (showLoading) {
        setDetailLoading(false);
      }
    }
  };

  const handleSelectTicket = (ticketId: number) => {
    // Nếu đang mở ticket này thì đóng lại
    if (selectedTicketId === ticketId) {
      setSelectedTicketId(null);
      selectedTicketIdRef.current = null;
      setSelectedTicketDetail(null);
      setDetailError('');
      resetMessageInputs();
      setMessageSuccess('');
      return;
    }

    setSelectedTicketId(ticketId);
    selectedTicketIdRef.current = ticketId;
    setSelectedTicketDetail(null);
    setDetailError('');
    resetMessageInputs();
    setMessageSuccess('');
    void loadTicketDetail(ticketId, { showLoading: true });
  };

  const handleMessageImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = 3 - messageImages.length;
    if (remainingSlots <= 0) {
      setMessageError('Tối đa 3 ảnh cho mỗi tin nhắn.');
      return;
    }

    const selectedFiles = Array.from(files).slice(0, remainingSlots);
    const maxSize = 5 * 1024 * 1024;
    const validFiles = selectedFiles.filter((file) => {
      if (file.size > maxSize) {
        setMessageError(`Ảnh ${file.name} vượt quá 5MB.`);
        return false;
      }
      if (!file.type.startsWith('image/')) {
        setMessageError(`File ${file.name} không phải là ảnh.`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setIsUploadingMessageImage(true);
    setMessageError('');

    try {
      const uploadPromises = validFiles.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'Cloudinary Test');
        formData.append(
          'public_id',
          `ticket_message_${Date.now()}_${Math.random().toString(36).substring(7)}`
        );

        const cloudinaryResponse = await fetch(
          'https://api.cloudinary.com/v1_1/dtlkjzuhq/image/upload',
          {
            method: 'POST',
            body: formData,
          }
        );

        if (!cloudinaryResponse.ok) {
          throw new Error(`Upload thất bại cho ${file.name}`);
        }

        const cloudinaryData = await cloudinaryResponse.json();

        return {
          imageUrl: cloudinaryData.secure_url,
          imagePublicId: cloudinaryData.public_id,
        } as TicketImage;
      });

      const uploadedImages = await Promise.all(uploadPromises);
      setMessageImages((prev) => [...prev, ...uploadedImages]);
    } catch (err: any) {
      setMessageError(err?.message || 'Có lỗi xảy ra khi upload ảnh.');
    } finally {
      setIsUploadingMessageImage(false);
      event.target.value = '';
    }
  };

  const handleRemoveMessageImage = (index: number) => {
    setMessageImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSendMessage = async () => {
    if (!selectedTicketId) return;

    const trimmedMessage = newMessage.trim();
    if (!trimmedMessage) {
      setMessageError('Vui lòng nhập nội dung tin nhắn.');
      return;
    }

    setIsSendingMessage(true);
    setMessageError('');
    setMessageSuccess('');

    try {
      const response = await createTicketMessage(selectedTicketId, {
        description: trimmedMessage,
        images: messageImages.length > 0 ? messageImages : undefined,
      });

      if (response.status) {
        resetMessageInputs();
        setMessageSuccess('Tin nhắn đã được gửi thành công.');
        await loadTicketDetail(selectedTicketId, { showLoading: false });
      } else {
        const errorMsg =
          response.errors?.join(', ') ||
          response.errors?.[0] ||
          'Không thể gửi tin nhắn mới.';
        setMessageError(errorMsg);
      }
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.errors?.join(', ') ||
        err?.response?.data?.errors?.[0] ||
        err?.response?.data?.message ||
        err?.message ||
        'Có lỗi xảy ra khi gửi tin nhắn.';
      setMessageError(errorMsg);
    } finally {
      setIsSendingMessage(false);
    }
  };

  if (loading) {
    return (
      <>
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
        {bankDialog}
      </>
    );
  }

  if (error) {
    return (
      <>
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
        {bankDialog}
      </>
    );
  }

  if (tickets.length === 0) {
    return (
      <>
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
        {bankDialog}
      </>
    );
  }

  return (
    <>
      <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Danh sách yêu cầu hỗ trợ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
          {tickets.map((ticket) => {
            const isSelected = selectedTicketId === ticket.id;
            const currentDetail =
              isSelected && selectedTicketDetail?.id === ticket.id ? selectedTicketDetail : null;
            const messageCount = currentDetail?.requestMessages?.length ?? 0;
            const hasPendingReply =
              currentDetail?.requestMessages?.some(
                (message) => !message.replyNotes || !message.replyNotes.trim()
              ) ?? false;
            const reachedMessageLimit = messageCount >= 3;

            return (
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
              {isSelected && (
                <div
                  className="mt-4 border-t pt-3"
                  onClick={(event) => event.stopPropagation()}
                >
                  {ticket.requestType === 'RefundRequest' &&
                    ticket.status?.toLowerCase() === 'approved' && (
                      <div className="mb-4 rounded-md border border-blue-200 bg-blue-50 p-4">
                        <div className="flex items-start gap-3">
                          <div className="rounded-full bg-blue-100 p-2">
                            <CreditCard className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="flex-1 space-y-2 text-sm text-gray-700">
                            <p className="font-semibold text-gray-900">
                              Yêu cầu hoàn hàng đã được phê duyệt. Để nhận tiền hoàn, vui lòng cung
                              cấp thông tin ngân hàng.
                            </p>
                            {bankLoading ? (
                              <p className="text-xs text-gray-600">
                                Đang kiểm tra thông tin ngân hàng...
                              </p>
                            ) : bankAccounts.find((account) => account.isActive) ? (
                              (() => {
                                const activeAccount = bankAccounts.find((account) => account.isActive)!;
                                const bankInfo = findBankInfo(activeAccount.bankCode);
                                return (
                                  <>
                                    <div className="text-sm text-gray-800">
                                      <p>
                                        {bankInfo?.shortName ||
                                          bankInfo?.name ||
                                          activeAccount.bankCode}
                                      </p>
                                      <p className="font-mono text-base text-gray-900">
                                        {activeAccount.accountNumber}
                                      </p>
                                    </div>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setIsBankDialogOpen(true)}
                                      className="border-blue-200 text-blue-700 hover:bg-blue-100"
                                    >
                                      Cập nhật ngân hàng
                                    </Button>
                                  </>
                                );
                              })()
                            ) : (
                              <>
                                <p>
                                  Bạn chưa có tài khoản ngân hàng để nhận tiền. Thêm thông tin ngân
                                  hàng để chúng tôi chuyển khoản hoàn tiền cho bạn.
                                </p>
                                <Button
                                  size="sm"
                                  className="bg-blue-600 text-white hover:bg-blue-700"
                                  onClick={() => setIsBankDialogOpen(true)}
                                  disabled={!user?.id}
                                >
                                  Cung cấp thông tin ngân hàng
                                </Button>
                              </>
                            )}
                            {bankError && (
                              <p className="text-xs text-red-600">
                                {bankError}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                  {detailLoading && (
                    <p className="text-xs text-gray-500">Đang tải chi tiết...</p>
                  )}

                  {detailError && !detailLoading && (
                    <p className="text-xs text-red-500">{detailError}</p>
                  )}

                  {!detailLoading &&
                    !detailError &&
                    currentDetail?.requestMessages &&
                    currentDetail.requestMessages.length > 0 && (
                      <div className="space-y-3">
                        {currentDetail.requestMessages.map((message) => (
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

                  {!detailLoading && !detailError && (
                    <div className="mt-4 rounded-md border border-gray-200 bg-white p-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-gray-900">Gửi tin nhắn bổ sung</p>
                        <span className="text-xs text-gray-500">{messageCount}/3 tin nhắn</span>
                      </div>

                      {hasPendingReply && (
                        <p className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-100 rounded-md p-2">
                          Vui lòng chờ phản hồi của đội hỗ trợ trước khi gửi tin nhắn mới.
                        </p>
                      )}

                      {reachedMessageLimit && (
                        <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-md p-2">
                          Bạn đã đạt giới hạn tối đa 3 tin nhắn cho yêu cầu này.
                        </p>
                      )}

                      {messageError && (
                        <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-md p-2">
                          {messageError}
                        </p>
                      )}

                      {messageSuccess && (
                        <p className="text-xs text-green-600 bg-green-50 border border-green-100 rounded-md p-2">
                          {messageSuccess}
                        </p>
                      )}

                      <Textarea
                        placeholder="Nhập nội dung bạn muốn bổ sung..."
                        value={newMessage}
                        onChange={(e) => {
                          setNewMessage(e.target.value);
                          if (messageError) setMessageError('');
                        }}
                        rows={4}
                        className="resize-none"
                        disabled={isSendingMessage || hasPendingReply || reachedMessageLimit}
                      />

                      {messageImages.length > 0 && (
                        <div className="flex flex-wrap gap-3">
                          {messageImages.map((image, index) => (
                            <div key={image.imagePublicId || index} className="relative">
                              <img
                                src={image.imageUrl}
                                alt={`Message upload ${index + 1}`}
                                className="w-20 h-20 rounded-lg border border-gray-200 object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveMessageImage(index)}
                                className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1"
                                disabled={isSendingMessage}
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-3">
                        {messageImages.length < 3 && (
                          <label
                            className="flex items-center gap-2 rounded-md border border-dashed border-gray-300 px-3 py-2 text-sm text-gray-600 cursor-pointer hover:border-blue-500"
                          >
                            {isUploadingMessageImage ? (
                              <>
                                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                Đang upload...
                              </>
                            ) : (
                              <>
                                <Upload size={16} />
                                Thêm ảnh
                              </>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              className="hidden"
                              onChange={handleMessageImageSelect}
                              disabled={isSendingMessage || isUploadingMessageImage || hasPendingReply || reachedMessageLimit}
                            />
                          </label>
                        )}

                        <Button
                          onClick={handleSendMessage}
                          disabled={
                            isSendingMessage ||
                            isUploadingMessageImage ||
                            hasPendingReply ||
                            reachedMessageLimit
                          }
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          {isSendingMessage ? 'Đang gửi...' : 'Gửi tin nhắn'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              </div>
            );
          })}
          </div>
        </CardContent>
      </Card>
      {bankDialog}
    </>
  );
};

export default TicketList;

