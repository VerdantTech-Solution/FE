import { apiClient } from "./apiClient";

export interface PayoutBalanceData {
  balance: number;
}

export interface GetPayoutBalanceResponse {
  status: boolean;
  statusCode: string;
  data: PayoutBalanceData | null;
  errors: string[];
}

export const getPayoutBalance = async (): Promise<GetPayoutBalanceResponse> => {
  try {
    const response = await apiClient.get<GetPayoutBalanceResponse>(
      "/api/Cashout/balance"
    ) as unknown as GetPayoutBalanceResponse;

    if (response && typeof response === "object" && "status" in response) {
      return response;
    }

    return response;
  } catch (error: any) {
    if (error && typeof error === "object") {
      if ("status" in error && "statusCode" in error) {
        return error as GetPayoutBalanceResponse;
      }

      const errorMessage =
        Array.isArray(error?.errors) && error.errors.length > 0
          ? error.errors[0]
          : error?.message || "Không thể lấy số dư PayOS Payout";

      return {
        status: false,
        statusCode: error?.statusCode || "Error",
        data: null,
        errors: [errorMessage],
      };
    }

    return {
      status: false,
      statusCode: "Error",
      data: null,
      errors: ["Không thể lấy số dư PayOS Payout"],
    };
  }
};

export interface RefundIdentityNumberPayload {
  serialNumber?: string;
  lotNumber: string;
  quantity: number;
}

export interface RefundOrderDetailPayload {
  orderDetailId: number;
  identityNumbers: RefundIdentityNumberPayload[];
}

export interface ProcessRefundRequestPayload {
  orderDetails: RefundOrderDetailPayload[];
  refundAmount: number;
  bankAccountId: number;
  gatewayPaymentId?: string | null;
}

export interface ProcessRefundResponse {
  status: boolean;
  statusCode: string | number;
  data: string | null;
  errors: string[];
}

export const processRefundRequest = async (
  requestId: number,
  payload: ProcessRefundRequestPayload
): Promise<ProcessRefundResponse> => {
  try {
    const response = await apiClient.post<ProcessRefundResponse>(
      `/api/Cashout/refund/${requestId}`,
      payload
    ) as unknown as ProcessRefundResponse;

    return response;
  } catch (error: any) {
    if (error?.response?.data) {
      return {
        status: false,
        statusCode: error.response.data.statusCode || "Error",
        data: null,
        errors: Array.isArray(error.response.data.errors)
          ? error.response.data.errors
          : [error.response.data.message || "Không thể xử lý hoàn tiền"],
      };
    }

    if (error && typeof error === "object" && "status" in error) {
      return error as ProcessRefundResponse;
    }

    return {
      status: false,
      statusCode: "Error",
      data: null,
      errors: [error?.message || "Không thể xử lý hoàn tiền"],
    };
  }
};

