import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, AlertCircle, TrendingUp, Package, ExternalLink, CheckCircle2, ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { fetchFarmAIAdvisory } from "@/services/farmAdvisoryService";
import { saveAdvisoryToHistory } from "@/services/aiAdvisoryHistoryService";
import { addToCart } from "@/api/cart";
import { getProductById, type Product } from "@/api/product";
import type { FarmProfile } from "@/api/farm";
import type { SurveyResponseItem } from "@/api/survey";

interface RecommendedProduct {
  name: string;
  category: string;
  why: string;
  product: {
    productName: string;
    description: string;
    unitPrice: number;
    imageUrl?: string;
    link?: string;
    productId?: number; // Optional product ID để thêm vào giỏ hàng
  };
  comparison: {
    currentTool: string;
    newTool: string;
    whyBetter: string;
  };
}

interface AIAdvisoryData {
  overview: string;
  greenScore: number;
  issues: string[];
  improvements: string[];
  recommendedProducts: RecommendedProduct[];
}

interface AIAdvisoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  farm: FarmProfile | null;
  surveyResponses: SurveyResponseItem[];
  soilData: any;
  onSuccess?: () => void; // Callback khi tạo gợi ý thành công
  initialAdvisory?: string | null; // Gợi ý ban đầu từ lịch sử (nếu có)
}

export const AIAdvisoryDialog = ({
  open,
  onOpenChange,
  farm,
  surveyResponses,
  soilData,
  onSuccess,
  initialAdvisory,
}: AIAdvisoryDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [advisoryData, setAdvisoryData] = useState<AIAdvisoryData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [addingToCart, setAddingToCart] = useState<Record<number, boolean>>({});
  const [cartMessage, setCartMessage] = useState<Record<number, string>>({});
  const [productData, setProductData] = useState<Record<number, Product | null>>({});
  const [loadingProducts, setLoadingProducts] = useState<Record<number, boolean>>({});
  const navigate = useNavigate();

  // Extract product ID from link
  const extractProductId = (link?: string): number | null => {
    if (!link) return null;
    // Extract ID from URL like "https://verdanttechsolution.verdev.id.vn/product/120"
    // or "/product/120" or "product/120"
    const match = link.match(/(?:^|\/)(?:product|products)\/(\d+)/i);
    if (match) {
      return parseInt(match[1], 10);
    }
    return null;
  };

  // Get product image URL
  const getProductImageUrl = (product: RecommendedProduct, index: number): string => {
    // Ưu tiên lấy từ productData (từ API)
    const apiProduct = productData[index];
    if (apiProduct?.images) {
      if (Array.isArray(apiProduct.images) && apiProduct.images.length > 0) {
        const firstImage = apiProduct.images[0];
        if (typeof firstImage === 'string') {
          return firstImage;
        } else if (firstImage && typeof firstImage === 'object' && 'imageUrl' in firstImage) {
          return (firstImage as any).imageUrl || '';
        }
      } else if (typeof apiProduct.images === 'string') {
        return apiProduct.images;
      }
    }
    
    // Fallback to imageUrl từ response
    if (apiProduct?.image) {
      return apiProduct.image;
    }
    
    // Fallback to imageUrl từ AI response
    return product.product.imageUrl || '';
  };

  // Parse response từ string sang object
  const parseResponse = (response: string): AIAdvisoryData | null => {
    try {
      // Thử parse JSON nếu response là string JSON
      const parsed = typeof response === 'string' ? JSON.parse(response) : response;
      if (parsed && typeof parsed === 'object') {
        return parsed as AIAdvisoryData;
      }
    } catch (e) {
      // Nếu không parse được, có thể là plain text
      console.warn('Response is not JSON, treating as plain text');
    }
    return null;
  };

  useEffect(() => {
    if (open && farm) {
      // Nếu có gợi ý ban đầu từ lịch sử, hiển thị nó
      if (initialAdvisory) {
        setAiResponse(initialAdvisory);
        const parsed = parseResponse(initialAdvisory);
        setAdvisoryData(parsed);
        setError(null);
      } else {
        // Nếu không có, gọi AI mới
        fetchAIAdvisory();
      }
    } else {
      // Reset khi đóng dialog
      setAiResponse(null);
      setAdvisoryData(null);
      setError(null);
      setProductData({});
    }
  }, [open, farm, initialAdvisory]);

  // Fetch product data khi có recommendedProducts
  useEffect(() => {
    if (!advisoryData?.recommendedProducts) return;

    const fetchProducts = async () => {
      const newProductData: Record<number, Product | null> = {};
      const newLoadingProducts: Record<number, boolean> = {};

      for (let index = 0; index < advisoryData.recommendedProducts.length; index++) {
        const product = advisoryData.recommendedProducts[index];
        const productId = product.product.productId || extractProductId(product.product.link);
        
        if (productId && !productData[index]) {
          try {
            newLoadingProducts[index] = true;
            setLoadingProducts(prev => ({ ...prev, ...newLoadingProducts }));
            
            const data = await getProductById(productId);
            newProductData[index] = data;
            setProductData(prev => ({ ...prev, ...newProductData }));
          } catch (error) {
            console.error(`Error fetching product ${productId}:`, error);
          } finally {
            setLoadingProducts(prev => ({ ...prev, [index]: false }));
          }
        }
      }
    };

    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [advisoryData?.recommendedProducts]);

  const fetchAIAdvisory = async () => {
    if (!farm) return;

    setLoading(true);
    setError(null);
    setAiResponse(null);

    try {
      // Sử dụng service để gọi AI tư vấn
      const response = await fetchFarmAIAdvisory(farm, surveyResponses, soilData);
      setAiResponse(response);
      
      // Parse response để hiển thị UI
      const parsed = parseResponse(response);
      setAdvisoryData(parsed);

      // Lưu vào lịch sử
      if (response && farm.id) {
        saveAdvisoryToHistory(
          farm.id,
          farm.farmName,
          response,
          surveyResponses.length,
          !!soilData
        );
        
        // Gọi callback để refresh danh sách ở parent component
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (err: any) {
      console.error("Error fetching AI advisory:", err);
      const errorMessage = err?.message || "Đã có lỗi xảy ra khi gọi dịch vụ AI. Vui lòng thử lại sau.";
      setError(errorMessage);
      
      // Kiểm tra nếu là lỗi unauthorized (token hết hạn)
      if (
        errorMessage.includes("hết hạn") ||
        errorMessage.includes("đăng nhập lại") ||
        errorMessage.includes("UNAUTHORIZED") ||
        errorMessage.includes("unauthorized")
      ) {
        // Tự động redirect về login sau 3 giây
        setTimeout(() => {
          window.location.href = '/login';
        }, 3000);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onOpenChange(false);
    }
  };

  const handleAddToCart = async (product: RecommendedProduct, index: number) => {
    // Kiểm tra đăng nhập
    const token = localStorage.getItem('authToken');
    if (!token) {
      setCartMessage({ ...cartMessage, [index]: 'Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng' });
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      return;
    }

    // Extract productId từ productId hoặc link
    const productId = product.product.productId || extractProductId(product.product.link);
    if (!productId) {
      setCartMessage({ ...cartMessage, [index]: 'Vui lòng vào trang chi tiết để thêm sản phẩm vào giỏ hàng' });
      setTimeout(() => {
        if (product.product.link) {
          const extractedId = extractProductId(product.product.link);
          if (extractedId) {
            navigate(`/product/${extractedId}`);
            onOpenChange(false);
          } else {
            window.open(product.product.link, '_blank');
          }
        }
      }, 2000);
      return;
    }

    try {
      setAddingToCart({ ...addingToCart, [index]: true });
      setCartMessage({ ...cartMessage, [index]: '' });

      await addToCart({
        productId: productId,
        quantity: 1,
      });

      setCartMessage({ ...cartMessage, [index]: 'Đã thêm vào giỏ hàng thành công!' });
      
      // Dispatch event để cập nhật cart count
      window.dispatchEvent(new Event('cart:updated'));

      setTimeout(() => {
        setCartMessage({ ...cartMessage, [index]: '' });
      }, 3000);
    } catch (err: any) {
      console.error('Error adding to cart:', err);
      const errorMsg = err?.message || err?.errors?.[0] || 'Không thể thêm sản phẩm vào giỏ hàng';
      setCartMessage({ ...cartMessage, [index]: errorMsg });
      setTimeout(() => {
        setCartMessage({ ...cartMessage, [index]: '' });
      }, 3000);
    } finally {
      setAddingToCart({ ...addingToCart, [index]: false });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[95vw] lg:max-w-[85vw] xl:max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-purple-600" />
            AI Tư Vấn Tổng Quan Trang Trại
          </DialogTitle>
          <DialogDescription>
            Phân tích và tư vấn dựa trên thông tin trang trại, khảo sát và dữ liệu đất
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-purple-600 mb-4" />
              <p className="text-gray-600">Đang phân tích và tạo tư vấn...</p>
              <p className="text-sm text-gray-500 mt-2">Vui lòng đợi trong giây lát</p>
            </div>
          ) : error ? (
            <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="text-lg font-semibold text-red-800 mb-2">Lỗi</h3>
              <p className="text-sm text-red-600 whitespace-pre-line">{error}</p>
              {error.includes("hết hạn") || error.includes("đăng nhập lại") || error.includes("UNAUTHORIZED") ? (
                <p className="text-xs text-red-500 mt-2 italic">
                  Bạn sẽ được chuyển đến trang đăng nhập trong giây lát...
                </p>
              ) : (
                <Button
                  onClick={fetchAIAdvisory}
                  variant="outline"
                  className="mt-4"
                  disabled={loading}
                >
                  Thử lại
                </Button>
              )}
            </div>
          ) : advisoryData ? (
            <div className="space-y-6">
              {/* Green Score */}
              <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-green-600" />
                    Điểm Xanh Trang Trại
                  </h3>
                  <div className="text-3xl font-bold text-green-600">{advisoryData.greenScore}/100</div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                  <div
                    className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${advisoryData.greenScore}%` }}
                  />
                </div>
              </div>

              {/* Overview */}
              <div className="p-6 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  Tổng Quan
                </h3>
                <p className="text-gray-700 leading-relaxed">{advisoryData.overview}</p>
              </div>

              {/* Issues */}
              {advisoryData.issues && advisoryData.issues.length > 0 && (
                <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
                  <h3 className="text-lg font-semibold text-red-800 mb-3 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    Vấn Đề Cần Quan Tâm
                  </h3>
                  <ul className="space-y-2">
                    {advisoryData.issues.map((issue, index) => (
                      <li key={index} className="flex items-start gap-2 text-gray-700">
                        <span className="text-red-600 mt-1">•</span>
                        <span>{issue}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Improvements */}
              {advisoryData.improvements && advisoryData.improvements.length > 0 && (
                <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    Đề Xuất Cải Thiện
                  </h3>
                  <ul className="space-y-2">
                    {advisoryData.improvements.map((improvement, index) => (
                      <li key={index} className="flex items-start gap-2 text-gray-700">
                        <CheckCircle2 className="h-4 w-4 text-blue-600 mt-1 flex-shrink-0" />
                        <span>{improvement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommended Products */}
              {advisoryData.recommendedProducts && advisoryData.recommendedProducts.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <Package className="h-5 w-5 text-purple-600" />
                    Sản Phẩm Đề Xuất
                  </h3>
                  {advisoryData.recommendedProducts.map((product, index) => (
                    <div
                      key={index}
                      className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex gap-4 mb-4">
                        {/* Product Image */}
                        {(() => {
                          const imageUrl = getProductImageUrl(product, index);
                          return imageUrl ? (
                            <div className="flex-shrink-0">
                              <img
                                src={imageUrl}
                                alt={product.product.productName}
                                className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/128x128?text=No+Image';
                                }}
                              />
                            </div>
                          ) : loadingProducts[index] ? (
                            <div className="flex-shrink-0 w-32 h-32 flex items-center justify-center bg-gray-100 rounded-lg border border-gray-200">
                              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                            </div>
                          ) : null;
                        })()}
                        
                        {/* Product Info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="text-lg font-semibold text-gray-800">{product.name}</h4>
                            <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-700 rounded">
                              {product.category}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{product.why}</p>
                        </div>
                      </div>

                      {/* Product Details */}
                      <div className="bg-gray-50 p-4 rounded-lg mb-4">
                        <h5 className="font-semibold text-gray-800 mb-2">{product.product.productName}</h5>
                        <p className="text-sm text-gray-600 mb-3">{product.product.description}</p>
                        <div className="flex items-center justify-between flex-wrap gap-3">
                          <div className="text-lg font-bold text-green-600">
                            {new Intl.NumberFormat('vi-VN', {
                              style: 'currency',
                              currency: 'VND',
                            }).format(product.product.unitPrice)}
                          </div>
                          <div className="flex gap-2">
                            {(() => {
                              const productId = product.product.productId || extractProductId(product.product.link);
                              return productId ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    navigate(`/product/${productId}`);
                                    onOpenChange(false); // Đóng dialog khi navigate
                                  }}
                                  className="gap-2"
                                >
                                  Xem chi tiết
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                              ) : product.product.link ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => window.open(product.product.link, '_blank')}
                                  className="gap-2"
                                >
                                  Xem chi tiết
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                              ) : null;
                            })()}
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleAddToCart(product, index)}
                              disabled={addingToCart[index]}
                              className="gap-2 bg-green-600 hover:bg-green-700"
                            >
                              {addingToCart[index] ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  Đang thêm...
                                </>
                              ) : (
                                <>
                                  <ShoppingCart className="h-4 w-4" />
                                  Thêm vào giỏ
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                        {cartMessage[index] && (
                          <div className={`mt-2 text-sm ${
                            cartMessage[index].includes('thành công') 
                              ? 'text-green-600' 
                              : 'text-red-600'
                          }`}>
                            {cartMessage[index]}
                          </div>
                        )}
                      </div>

                      {/* Comparison */}
                      <div className="border-t pt-4">
                        <h5 className="font-semibold text-gray-700 mb-3">So Sánh</h5>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 bg-red-50 border border-red-200 rounded">
                            <p className="text-xs font-medium text-red-700 mb-1">Hiện tại</p>
                            <p className="text-sm text-gray-700">{product.comparison.currentTool}</p>
                          </div>
                          <div className="p-3 bg-green-50 border border-green-200 rounded">
                            <p className="text-xs font-medium text-green-700 mb-1">Đề xuất</p>
                            <p className="text-sm text-gray-700">{product.comparison.newTool}</p>
                          </div>
                        </div>
                        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                          <p className="text-xs font-medium text-blue-700 mb-1">Lý do</p>
                          <p className="text-sm text-gray-700">{product.comparison.whyBetter}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : aiResponse ? (
            <div className="space-y-4">
              <div className="p-6 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
                <div className="prose prose-sm max-w-none">
                  <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                    {aiResponse}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg text-center">
              <p className="text-gray-600">Chưa có dữ liệu tư vấn</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            Đóng
          </Button>
          {(aiResponse || advisoryData) && (
            <Button
              onClick={fetchAIAdvisory}
              disabled={loading}
              variant="secondary"
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Làm mới
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

