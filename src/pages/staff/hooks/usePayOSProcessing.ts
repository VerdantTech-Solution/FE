import { useState } from 'react';
import { processCashout, type CashoutRequestData, type ProcessedCashoutData } from '@/api/wallet';

interface UsePayOSProcessingProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export const usePayOSProcessing = ({ onSuccess, onError }: UsePayOSProcessingProps = {}) => {
  const [isProcessingPayOS, setIsProcessingPayOS] = useState(false);
  const [processingPayOSId, setProcessingPayOSId] = useState<number | null>(null);
  const [isPayOSConfirmDialogOpen, setIsPayOSConfirmDialogOpen] = useState(false);
  const [selectedPayOSRequest, setSelectedPayOSRequest] = useState<CashoutRequestData | null>(null);
  const [isPayOSErrorDialogOpen, setIsPayOSErrorDialogOpen] = useState(false);
  const [payOSError, setPayOSError] = useState<string | null>(null);
  const [isPayOSSuccessDialogOpen, setIsPayOSSuccessDialogOpen] = useState(false);
  const [payOSSuccessData, setPayOSSuccessData] = useState<ProcessedCashoutData | null>(null);

  const handleOpenPayOSConfirmDialog = (request: CashoutRequestData) => {
    setSelectedPayOSRequest(request);
    setIsPayOSConfirmDialogOpen(true);
  };

  const handleClosePayOSConfirmDialog = () => {
    setIsPayOSConfirmDialogOpen(false);
    setSelectedPayOSRequest(null);
  };

  const handleProcessCashoutPayOS = async () => {
    if (!selectedPayOSRequest) {
      return;
    }

    // Get vendorId from either vendorId field or user.id
    const vendorId = selectedPayOSRequest.vendorId || selectedPayOSRequest.user?.id;
    if (!vendorId) {
      const errorMsg = 'Không tìm thấy ID nhà cung cấp';
      setPayOSError(errorMsg);
      setIsPayOSErrorDialogOpen(true);
      handleClosePayOSConfirmDialog();
      onError?.(errorMsg);
      return;
    }

    setIsProcessingPayOS(true);
    setProcessingPayOSId(selectedPayOSRequest.id);
    handleClosePayOSConfirmDialog();

    try {
      const response = await processCashout(vendorId);

      if (response.status && response.data) {
        // Success
        const successData = response.data;
        
        // Lấy ra toAccountName từ response
        const toAccountName = successData.toAccountName;
        console.log('ToAccountName:', toAccountName);
        
        setPayOSSuccessData(successData);
        setIsPayOSSuccessDialogOpen(true);
        onSuccess?.();
      } else {
        // Check if error is 429 Too Many Requests
        const errorText = response.errors && response.errors.length > 0
          ? response.errors.join(', ')
          : 'Không thể xử lý yêu cầu rút tiền qua PayOS';
        
        const isTooManyRequests = 
          errorText.includes('429') ||
          errorText.includes('Too Many Requests') ||
          errorText.includes('TooManyRequests') ||
          response.statusCode === 'TooManyRequests' ||
          (typeof response.statusCode === 'number' && response.statusCode === 429);
        
        const errorMessage = isTooManyRequests
          ? 'Thao tác quá nhiều, vui lòng thử lại sau'
          : errorText;
        
        setPayOSError(errorMessage);
        setIsPayOSErrorDialogOpen(true);
        onError?.(errorMessage);
      }
    } catch (err: any) {
      // Check if error is 429 Too Many Requests
      const errorText = err?.message || err?.errors?.[0] || 'Có lỗi xảy ra khi xử lý yêu cầu rút tiền qua PayOS';
      
      const isTooManyRequests = 
        err?.response?.status === 429 ||
        err?.status === 429 ||
        errorText.includes('429') ||
        errorText.includes('Too Many Requests') ||
        errorText.includes('TooManyRequests');
      
      const errorMessage = isTooManyRequests
        ? 'Thao tác quá nhiều, vui lòng thử lại sau'
        : errorText;
      
      setPayOSError(errorMessage);
      setIsPayOSErrorDialogOpen(true);
      onError?.(errorMessage);
    } finally {
      setIsProcessingPayOS(false);
      setProcessingPayOSId(null);
    }
  };

  const closePayOSErrorDialog = () => {
    setIsPayOSErrorDialogOpen(false);
    setPayOSError(null);
  };

  const closePayOSSuccessDialog = () => {
    setIsPayOSSuccessDialogOpen(false);
  };

  return {
    // State
    isProcessingPayOS,
    processingPayOSId,
    isPayOSConfirmDialogOpen,
    selectedPayOSRequest,
    isPayOSErrorDialogOpen,
    payOSError,
    isPayOSSuccessDialogOpen,
    payOSSuccessData,
    
    // Handlers
    handleOpenPayOSConfirmDialog,
    handleClosePayOSConfirmDialog,
    handleProcessCashoutPayOS,
    closePayOSErrorDialog,
    closePayOSSuccessDialog,
  };
};

