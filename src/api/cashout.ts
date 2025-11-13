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


