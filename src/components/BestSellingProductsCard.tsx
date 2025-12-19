import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, TrendingUp, Package, Calendar, Search } from "lucide-react";
// Dashboard API removed
type BestSellingProduct = any;

interface BestSellingProductsCardProps {
  selectedPeriod?: string;
  from?: string;
  to?: string;
  title?: string;
  showDatePicker?: boolean;
}

const formatRevenue = (amount: number) => {
  if (amount >= 1000000000) {
    return `${(amount / 1000000000).toFixed(2)}B`;
  } else if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M`;
  } else if (amount >= 1000) {
    return `${(amount / 1000).toFixed(1)}K`;
  }
  return amount.toLocaleString('vi-VN');
};

// Dashboard API removed - getDateRange function removed

export const BestSellingProductsCard: React.FC<BestSellingProductsCardProps> = ({
  selectedPeriod = 'month',
  from: propFrom,
  to: propTo,
  title = "Top 5 sản phẩm bán chạy",
  showDatePicker = true
}) => {
  const [products, setProducts] = useState<BestSellingProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localFrom, setLocalFrom] = useState<string>("");
  const [localTo, setLocalTo] = useState<string>("");
  const [useCustomDate, setUseCustomDate] = useState(false);

  // Initialize date range
  useEffect(() => {
    if (propFrom && propTo) {
      setLocalFrom(propFrom);
      setLocalTo(propTo);
      setUseCustomDate(true);
    } else {
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const formatDate = (date: Date) => {
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
      };
      setLocalFrom(formatDate(startOfMonth));
      setLocalTo(formatDate(today));
    }
  }, [propFrom, propTo]);

  const fetchProducts = async (_fromDate?: string, _toDate?: string) => {
    setLoading(true);
    setError(null);
    try {
      // Dashboard API removed - functionality disabled
      const response = { status: false, data: { products: [] } };

      if (response.status && response.data && response.data.products && Array.isArray(response.data.products)) {
        // Lấy top 5
        setProducts(response.data.products.slice(0, 5));
      } else {
        setProducts([]);
      }
    } catch (err: any) {
      console.error("Error fetching best selling products:", err);
      setError(err?.message || "Không thể tải dữ liệu");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!useCustomDate || (localFrom && localTo)) {
      fetchProducts();
    }
  }, [selectedPeriod, propFrom, propTo]);

  const handleSearch = () => {
    if (localFrom && localTo) {
      fetchProducts(localFrom, localTo);
      setUseCustomDate(true);
    }
  };

  const handleReset = () => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const formatDate = (date: Date) => {
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };
    setLocalFrom(formatDate(startOfMonth));
    setLocalTo(formatDate(today));
    setUseCustomDate(false);
    fetchProducts(formatDate(startOfMonth), formatDate(today));
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case 2:
        return "bg-gray-100 text-gray-800 border-gray-300";
      case 3:
        return "bg-orange-100 text-orange-800 border-orange-300";
      default:
        return "bg-blue-100 text-blue-800 border-blue-300";
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `#${rank}`;
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            {title}
          </CardTitle>
        </div>
        {showDatePicker && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="best-selling-from" className="text-sm font-medium text-gray-700 mb-2 block">
                  Từ ngày
                </Label>
                <Input
                  id="best-selling-from"
                  type="date"
                  value={localFrom}
                  onChange={(e) => setLocalFrom(e.target.value)}
                  max={localTo || undefined}
                  className="w-full"
                />
              </div>
              <div>
                <Label htmlFor="best-selling-to" className="text-sm font-medium text-gray-700 mb-2 block">
                  Đến ngày
                </Label>
                <Input
                  id="best-selling-to"
                  type="date"
                  value={localTo}
                  onChange={(e) => setLocalTo(e.target.value)}
                  min={localFrom || undefined}
                  className="w-full"
                />
              </div>
              <div className="flex items-end gap-2">
                <Button
                  onClick={handleSearch}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  disabled={!localFrom || !localTo}
                >
                  <Search className="w-4 h-4 mr-2" />
                  Tìm kiếm
                </Button>
                <Button
                  variant="outline"
                  onClick={handleReset}
                  className="px-4"
                >
                  <Calendar className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-[300px]">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Đang tải dữ liệu...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-[300px]">
            <div className="text-center">
              <p className="text-sm text-red-600 mb-2">{error}</p>
            </div>
          </div>
        ) : products.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-gray-500 text-sm">
            <div className="text-center">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p>Chưa có dữ liệu sản phẩm bán chạy</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {products.map((item, index) => {
              const rank = index + 1;
              const product = item.product;
              const quantity = item.soldQuantity || 0;
              const revenue = quantity * (product.unitPrice || 0);

              return (
                <div
                  key={product.id || index}
                  className="flex items-center gap-4 p-3 rounded-lg border border-gray-200 hover:border-green-300 hover:shadow-sm transition-all"
                >
                  {/* Rank Badge */}
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold text-sm ${getRankColor(rank)}`}
                  >
                    {getRankIcon(rank)}
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 truncate">
                      {product.productName || `Sản phẩm #${product.id || index + 1}`}
                    </h4>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Package className="w-3 h-3" />
                        {quantity.toLocaleString('vi-VN')} sản phẩm
                      </span>
                      <span className="text-green-600 font-medium">
                        {formatRevenue(revenue)}đ
                      </span>
                    </div>
                  </div>

                  {/* Revenue Bar */}
                  <div className="flex-shrink-0 w-24">
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 transition-all"
                        style={{
                          width: `${Math.min(
                            products.length > 0 && products[0].product.unitPrice
                              ? (revenue / (products[0].soldQuantity * products[0].product.unitPrice)) * 100
                              : 100,
                            100
                          )}%`
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

