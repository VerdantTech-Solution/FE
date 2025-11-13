import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Banknote, Loader2, RefreshCw } from "lucide-react";
import { getPayoutBalance } from "@/api/cashout";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);

export const BalanceManagement: React.FC = () => {
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    try {
      setError(null);
      const response = await getPayoutBalance();

      if (response.status && response.data) {
        setBalance(response.data.balance ?? 0);
      } else {
        const errorMessage =
          response.errors?.[0] || "Không thể lấy số dư PayOS Payout";
        setError(errorMessage);
        setBalance(null);
      }
    } catch (err: any) {
      const errorMessage =
        err?.errors?.[0] ||
        err?.message ||
        "Có lỗi xảy ra khi lấy số dư PayOS Payout";
      setError(errorMessage);
      setBalance(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchBalance();
    } finally {
      setRefreshing(false);
    }
  };

  const formattedBalance = useMemo(() => {
    if (balance === null) return "--";
    return formatCurrency(balance);
  }, [balance]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">
            Số dư PayOS Payout
          </h2>
          <p className="text-sm text-gray-500">
            Kiểm tra số dư tài khoản PayOS dùng để xử lý các yêu cầu rút tiền.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={loading || refreshing}
          className="gap-2"
        >
          {refreshing || loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Làm mới
        </Button>
      </div>

      {error && (
        <Card className="border border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-3 p-4 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <p>{error}</p>
          </CardContent>
        </Card>
      )}

      <Card className="bg-white shadow-sm border border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Banknote className="h-5 w-5 text-green-600" />
            Số dư hiện tại
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-3 py-6 text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              Đang tải số dư PayOS Payout...
            </div>
          ) : (
            <div className="py-6">
              <p className="text-4xl font-bold text-green-600">
                {formattedBalance}
              </p>
              <p className="mt-3 text-sm text-gray-500">
                Đây là số dư hiện có trong tài khoản PayOS của hệ thống để xử lý
                các yêu cầu rút tiền tự động. Vui lòng đảm bảo số dư luôn đủ để
                xử lý các yêu cầu rút tiền đang chờ.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BalanceManagement;


