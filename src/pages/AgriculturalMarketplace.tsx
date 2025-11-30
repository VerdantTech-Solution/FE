import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Star, ShoppingCart, Package, Shield, Users, ArrowRight } from "lucide-react"
import { useNavigate } from "react-router";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { 
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogAction
} from "@/components/ui/alert-dialog";
import { getAllProducts, getProductById, type Product } from "@/api/product";
import { addToCart } from "@/api/cart";

export default function AgriculturalMarketplace() {

    const navigate = useNavigate();
    const handleMarketplace = () => {
        navigate("/marketplace")
    }

    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [addingToCart, setAddingToCart] = useState<number | null>(null);
    const [alertOpen, setAlertOpen] = useState<boolean>(false);
    const [alertMessage, setAlertMessage] = useState<string>("");

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true);
                setError(null);
                const products = await getAllProducts({ page: 1, pageSize: 100 });
                
                // Vì getAllProducts không trả về stockQuantity, fetch thêm từ getProductById
                const productsWithStock = await Promise.all(
                    products.map(async (product) => {
                        try {
                            const productDetail = await getProductById(product.id);
                            return {
                                ...product,
                                stockQuantity: productDetail.stockQuantity,
                            };
                        } catch (err) {
                            console.error(`Error fetching stock for product ${product.id}:`, err);
                            // Nếu lỗi, giữ nguyên product
                            return product;
                        }
                    })
                );
                
                console.log('Products with stock:', productsWithStock.map(p => ({ id: p.id, name: p.productName, stockQuantity: p.stockQuantity })));
                setProducts(productsWithStock);
            } catch (err: any) {
                const message = err?.response?.data?.message || err?.message || "Không thể tải dữ liệu sản phẩm.";
                setError(message);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    const handleAddToCart = async (productId: number, event: React.MouseEvent) => {
        event.stopPropagation();
        try {
            // Auth check similar to ProductDetailPage
            const token = localStorage.getItem('authToken');
            if (!token) {
                alert('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng');
                navigate('/login');
                return;
            }

            setAddingToCart(productId);
            setAlertMessage("");

            // Luôn kiểm tra giỏ trước: nếu có thì chỉ tăng số lượng
            const { getCart, updateCartItem } = await import("@/api/cart");
            const currentCart = await getCart();
            const cartItems = currentCart?.cartItems || [];
            const existingItem = cartItems.find((item: any) => item.productId === productId);
            const productData = products.find(p => p.id === productId);
            const stockQuantity = productData?.stockQuantity ?? Infinity;
            if (existingItem) {
                const newQuantity = existingItem.quantity + 1;
                if (newQuantity > stockQuantity) {
                    alert(`Chỉ còn ${stockQuantity} sản phẩm trong kho`);
                    return;
                }
                await updateCartItem(productId, newQuantity);
                window.dispatchEvent(new CustomEvent('cart:updated'));
                    setAlertMessage(`Đã tăng số lượng sản phẩm lên ${newQuantity}!`);
                    setAlertOpen(true);
                return;
            }

            // Nếu chưa có trong giỏ, thêm mới
            if (stockQuantity === 0) {
                alert('Sản phẩm đã hết hàng');
                return;
            }
            await addToCart({ productId, quantity: 1 });
            window.dispatchEvent(new CustomEvent('cart:updated'));
            setAlertMessage('Đã thêm sản phẩm vào giỏ hàng!');
            setAlertOpen(true);
        } catch (error: any) {
            if (error?.status === 400 || error?.statusCode === 400 || error?.response?.status === 400) {
                try {
                    const { updateCartItem, getCart } = await import("@/api/cart");
                    const currentCart = await getCart();
                    const cartItems = currentCart?.cartItems || [];
                    const existingItem = cartItems.find((item: any) => item.productId === productId);
                    if (existingItem) {
                        const newQuantity = existingItem.quantity + 1;
                        await updateCartItem(productId, newQuantity);
                        window.dispatchEvent(new CustomEvent('cart:updated'));
                        setAlertMessage(`Đã tăng số lượng sản phẩm lên ${newQuantity}!`);
                        setAlertOpen(true);
                        return;
                    }
                } catch (updateErr) {
                    alert('Có lỗi khi cập nhật số lượng. Vui lòng thử lại.');
                    return;
                }
            } else if (error?.status === 401 || error?.statusCode === 401) {
                alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
                window.location.href = '/login';
            } else {
                alert('Có lỗi xảy ra khi thêm sản phẩm vào giỏ hàng.');
            }
        } finally {
            setAddingToCart(null);
        }
    };
  return (
    <div className="mx-auto py-12 px-6 bg-gray-100">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold">
          Chợ Nông Nghiệp
        </h2>
        <p className="text-muted-foreground mt-2">
          Mua bán sản phẩm nông nghiệp bền vững, thiết bị và dịch vụ trong marketplace đáng tin cậy của chúng tôi
        </p>
      </div>

      {/* Product Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {loading && (
          <div className="col-span-full text-center py-12">
            <Spinner variant="circle-filled" size={48} className="text-green-600 mx-auto mb-3" />
            <div className="text-gray-600">Đang tải sản phẩm...</div>
          </div>
        )}

        {error && !loading && (
          <div className="col-span-full text-center py-12">
            <div className="text-6xl mb-2">⚠️</div>
            <div className="text-red-600 font-semibold mb-4">{error}</div>
            <Button className="bg-green-600 hover:bg-green-700" onClick={() => {
              setError(null);
              setLoading(true);
              (async () => {
                try {
                  const products = await getAllProducts({ page: 1, pageSize: 100 });
                  
                  // Vì getAllProducts không trả về stockQuantity, fetch thêm từ getProductById
                  const productsWithStock = await Promise.all(
                      products.map(async (product) => {
                          try {
                              const productDetail = await getProductById(product.id);
                              return {
                                  ...product,
                                  stockQuantity: productDetail.stockQuantity,
                              };
                          } catch (err) {
                              console.error(`Error fetching stock for product ${product.id}:`, err);
                              // Nếu lỗi, giữ nguyên product
                              return product;
                          }
                      })
                  );
                  
                  setProducts(productsWithStock);
                } catch (err: any) {
                  const message = err?.response?.data?.message || err?.message || "Không thể tải dữ liệu sản phẩm.";
                  setError(message);
                } finally {
                  setLoading(false);
                }
              })();
            }}>Thử lại</Button>
          </div>
        )}

        {!loading && !error && products.slice(0, 4).map((product) => (
          <Card
            key={product.id}
            className="bg-green-50 hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-green-300 flex flex-col"
            onClick={() => navigate(`/product/${product.id}`)}
          >
            <div className="h-32 bg-gradient-to-br from-green-200 to-green-300 rounded-t-lg flex items-center justify-center overflow-hidden">
              {/* Image fallback to emoji if not present */}
              {product.image ? (
                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="text-4xl">🛒</div>
              )}
            </div>
            <CardHeader className="pb-2 flex-1">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg line-clamp-1">{product.name}</CardTitle>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium">{product.rating ?? 4.5}</span>
                </div>
              </div>
              <CardDescription className="text-sm line-clamp-2">
                {product.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0 flex-1 flex flex-col justify-end">
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-bold text-green-600">
                  {product.price?.toLocaleString('vi-VN')}đ{product.unit ? `/${product.unit}` : ''}
                </span>
                <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">Còn {product.stockQuantity ?? 0}</span>
              </div>
              <Button 
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 rounded-lg shadow-sm hover:shadow-lg hover:scale-105 transition-all duration-200"
                onClick={(e) => handleAddToCart(product.id, e)}
                disabled={addingToCart === product.id || (product.stockQuantity ?? 0) === 0}
              >
                {addingToCart === product.id ? (
                  <Spinner variant="circle-filled" size={16} className="mr-2" />
                ) : (
                  <ShoppingCart className="h-4 w-4 mr-2" />
                )}
                {addingToCart === product.id ? 'Đang thêm...' : 'Thêm vào giỏ'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* View All CTA under product grid */}
      {!loading && !error && products.length > 0 && (
        <div className="text-center mb-12">
          <Button onClick={handleMarketplace} size="lg" className="bg-green-600 hover:bg-green-700 hover:scale-105 hover:shadow-xl px-8 py-3 transition-all duration-300">
            Xem tất cả sản phẩm
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        </div>
      )}

      {/* Global success alert */}
      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Thành công</AlertDialogTitle>
            <AlertDialogDescription>
              {alertMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setAlertOpen(false)}>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Features Section */}
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Package className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Chất Lượng Đảm Bảo</h3>
          <p className="text-sm text-muted-foreground">
            Tất cả sản phẩm đều được kiểm tra chất lượng và tiêu chuẩn bền vững trước khi đăng bán.
          </p>
        </div>

        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Shield className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Giao Dịch An Toàn</h3>
          <p className="text-sm text-muted-foreground">
            Xử lý thanh toán an toàn và bảo mật với sự bảo vệ người mua và người bán.
          </p>
        </div>

        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Users className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Cộng Đồng Định Hướng</h3>
          <p className="text-sm text-muted-foreground">
            Kết nối trực tiếp với nông dân, nhà cung cấp và chuyên gia nông nghiệp trong khu vực của bạn.
          </p>
        </div>
      </div>

      {/* Call to Action */}
      <div className="text-center">
        <Button onClick={handleMarketplace} size="lg" className="bg-green-600 hover:bg-green-700 hover:scale-105 hover:shadow-xl px-8 py-3 transition-all duration-300">
          Xem Tất Cả Sản Phẩm
          <ArrowRight className="h-5 w-5 ml-2" />
        </Button>
      </div>
    </div>
  )
}
