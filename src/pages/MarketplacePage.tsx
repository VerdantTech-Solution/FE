import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Search,
  Filter,
  Star,
  ShoppingCart,
  Heart,
  ChevronDown,
  Menu,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import {
  getAllProducts,
  type Product,
  getAllProductCategories,
  type ProductCategory,
} from "@/api/product";
import { addToCart } from "@/api/cart";
import { toast } from "sonner";
import { getProductReviewsByProductId } from "@/api/productReview";
import { ProductVendorChat } from "@/components/ProductVendorChat";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: "easeOut" as const,
    },
  },
};

const cardVariants = {
  hidden: { scale: 0.8, opacity: 0, y: 50 },
  visible: {
    scale: 1,
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut" as const,
    },
  },
  hover: {
    y: -10,
    scale: 1.02,
    transition: {
      duration: 0.3,
      ease: "easeInOut" as const,
    },
  },
};

const searchVariants = {
  hidden: { y: -50, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.8,
      ease: "easeOut" as const,
    },
  },
};

export const MarketplacePage = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<number | "all">(
    "all"
  );
  const [selectedParentCategory, setSelectedParentCategory] = useState<
    number | null
  >(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [pageLoading, setPageLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingToCart, setAddingToCart] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 9;
  const [productRatings, setProductRatings] = useState<
    Record<number, { rating: number; reviewCount: number }>
  >({});

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      // getAllProducts đã trả về stockQuantity trong ProductListItemDTO, không cần fetch từng product nữa
      const products = await getAllProducts({ page: 1, pageSize: 1000 });

      console.log("Products loaded:", products.length);
      setProducts(products);

      // Fetch reviews for all products to calculate ratings
      fetchProductRatings(products);
    } catch (err: any) {
      console.error("Error fetching products:", err);
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        "Không thể tải dữ liệu sản phẩm. Vui lòng thử lại sau.";
      setError(errorMessage);
      setProducts([]);
    } finally {
      setLoading(false);
      setPageLoading(false);
    }
  };

  const fetchProductRatings = async (productsList: Product[]) => {
    try {
      console.log("Fetching ratings for", productsList.length, "products");
      // Fetch reviews for all products in parallel
      const ratingPromises = productsList.map(async (product) => {
        try {
          const response = await getProductReviewsByProductId(
            product.id,
            1,
            20
          );
          console.log(`Product ${product.id} response:`, response);

          if (response.status && response.data) {
            // Get reviews array from pagination structure
            const reviews =
              response.data.data ||
              (Array.isArray(response.data) ? response.data : []);
            // Use totalRecords from pagination response, not reviews.length
            const reviewCount = response.data.totalRecords || reviews.length;

            // Calculate average rating from reviews if we have reviews
            let averageRating = 0;
            if (reviews.length > 0) {
              // Calculate from actual reviews
              averageRating =
                reviews.reduce(
                  (total, current) => total + (current.rating || 0),
                  0
                ) / reviews.length;
            } else if (reviewCount > 0) {
              // If we have reviewCount but no reviews in response, use product's ratingAverage
              // This handles cases where API returns totalRecords but no reviews (pagination issue)
              averageRating = product.ratingAverage || product.rating || 0;
            } else {
              // No reviews at all, use product's ratingAverage if available
              averageRating = product.ratingAverage || product.rating || 0;
            }

            // Use reviewCount from API, or fallback to product's reviewCount
            const finalReviewCount =
              reviewCount > 0 ? reviewCount : product.reviews || 0;

            console.log(
              `Product ${product.id}: rating=${averageRating}, reviewCount=${finalReviewCount}, reviews.length=${reviews.length}, product.ratingAverage=${product.ratingAverage}`
            );

            return {
              productId: product.id,
              rating: averageRating,
              reviewCount: finalReviewCount,
            };
          }

          // If API call failed or no response, use product's own rating data
          console.log(
            `Product ${product.id}: No data in response, using product rating`
          );
          const fallbackRating = product.ratingAverage || product.rating || 0;
          const fallbackReviewCount = product.reviews || 0;
          return {
            productId: product.id,
            rating: fallbackRating,
            reviewCount: fallbackReviewCount,
          };
        } catch (err) {
          console.error(
            `Error fetching reviews for product ${product.id}:`,
            err
          );
          // On error, fallback to product's own rating data
          const fallbackRating = product.ratingAverage || product.rating || 0;
          const fallbackReviewCount = product.reviews || 0;
          return {
            productId: product.id,
            rating: fallbackRating,
            reviewCount: fallbackReviewCount,
          };
        }
      });

      const ratings = await Promise.all(ratingPromises);
      console.log("All ratings:", ratings);

      const ratingsMap: Record<
        number,
        { rating: number; reviewCount: number }
      > = {};
      ratings.forEach(({ productId, rating, reviewCount }) => {
        ratingsMap[productId] = { rating, reviewCount };
      });

      console.log("Ratings map:", ratingsMap);
      setProductRatings(ratingsMap);
    } catch (err) {
      console.error("Error fetching product ratings:", err);
    }
  };

  const fetchCategories = async () => {
    try {
      const categoriesData = await getAllProductCategories();
      // Bỏ filter isActive nếu muốn lấy tất cả
      setCategories(categoriesData);
    } catch (err: any) {
      console.error("Error fetching categories:", err);
      setCategories([]);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchQuery]);

  const handleAddToCart = async (
    productId: number,
    event: React.MouseEvent
  ) => {
    event.stopPropagation(); // Ngăn chặn click vào card
    try {
      setAddingToCart(productId);
      setSuccessMessage(null);

      // Kiểm tra xem sản phẩm đã có trong giỏ hàng chưa
      try {
        const { getCart } = await import("@/api/cart");
        const currentCart = await getCart();
        const cartItems = currentCart?.cartItems || [];
        const existingItem = cartItems.find(
          (item: any) => item.productId === productId
        );

        if (existingItem) {
          console.log("Product already in cart, increasing quantity...");
          // Sản phẩm đã có trong giỏ, tăng số lượng
          const { updateCartItem } = await import("@/api/cart");
          const newQuantity = existingItem.quantity + 1;

          await updateCartItem(productId, newQuantity);

          // Dispatch event to update cart count in Navbar
          window.dispatchEvent(new CustomEvent("cart:updated"));

          // Show success message
          setSuccessMessage(`Đã tăng số lượng sản phẩm lên ${newQuantity}!`);
          setTimeout(() => setSuccessMessage(null), 3000);

          console.log("Quantity increased successfully to:", newQuantity);
          return; // Thoát khỏi function
        }
      } catch (cartError) {
        console.log(
          "Error checking cart, proceeding with add to cart:",
          cartError
        );
      }

      // Nếu sản phẩm chưa có trong giỏ, thêm mới
      const response = await addToCart({ productId, quantity: 1 });
      console.log("Add to cart response:", response);

      // Dispatch event to update cart count in Navbar
      window.dispatchEvent(new CustomEvent("cart:updated"));

      // Show success message
      setSuccessMessage("Đã thêm sản phẩm vào giỏ hàng!");
      toast.success("Sản phẩm đã được thêm vào giỏ hàng", {
        duration: 3000,
      });
      setTimeout(() => setSuccessMessage(null), 3000);

      console.log("Product added to cart successfully");
    } catch (error: any) {
      console.error("Error adding to cart:", error);
      console.error("Error details:", {
        status: error?.status,
        statusCode: error?.statusCode,
        message: error?.message,
        data: error?.data,
        response: error?.response,
      });

      // Xử lý lỗi 400 - Bad Request (sản phẩm đã có trong giỏ)
      if (
        error?.status === 400 ||
        error?.statusCode === 400 ||
        error?.response?.status === 400
      ) {
        console.log("Handling 400 error - product already in cart");
        // Thay vì báo lỗi, thử tăng số lượng sản phẩm đã có
        try {
          console.log(
            "Product already in cart, attempting to increase quantity..."
          );

          // Import functions
          const { updateCartItem, getCart } = await import("@/api/cart");

          // Lấy giỏ hàng hiện tại để tìm số lượng sản phẩm
          const currentCart = await getCart();
          const cartItems = currentCart?.cartItems || [];
          const existingItem = cartItems.find(
            (item: any) => item.productId === productId
          );

          console.log("Current cart items:", cartItems);
          console.log("Existing item:", existingItem);

          if (existingItem) {
            // Tăng số lượng hiện tại lên 1
            const newQuantity = existingItem.quantity + 1;
            console.log(
              "Updating quantity from",
              existingItem.quantity,
              "to",
              newQuantity
            );

            await updateCartItem(productId, newQuantity);

            // Dispatch event to update cart count in Navbar
            window.dispatchEvent(new CustomEvent("cart:updated"));

            // Show success message
            setSuccessMessage(`Đã tăng số lượng sản phẩm lên ${newQuantity}!`);
            toast.success(`Đã tăng số lượng sản phẩm lên ${newQuantity}!`, {
              duration: 3000,
            });
            setTimeout(() => setSuccessMessage(null), 3000);

            console.log("Quantity increased successfully to:", newQuantity);
            return; // Thoát khỏi function để không hiển thị lỗi
          } else {
            // Nếu không tìm thấy item trong giỏ, thử thêm lại
            console.log("Item not found in cart, retrying add to cart...");
            const retryResponse = await addToCart({ productId, quantity: 1 });
            console.log("Retry add to cart response:", retryResponse);

            window.dispatchEvent(new CustomEvent("cart:updated"));
            setSuccessMessage("Đã thêm sản phẩm vào giỏ hàng!");
            toast.success("Sản phẩm đã được thêm vào giỏ hàng", {
              duration: 3000,
            });
            setTimeout(() => setSuccessMessage(null), 3000);
            return; // Thoát khỏi function để không hiển thị lỗi
          }
        } catch (updateError: any) {
          console.error("Error updating quantity:", updateError);
          alert(
            "Có lỗi xảy ra khi cập nhật số lượng sản phẩm. Vui lòng thử lại."
          );
          return; // Thoát khỏi function để không hiển thị lỗi gốc
        }
      } else if (error?.status === 401 || error?.statusCode === 401) {
        alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        window.location.href = "/login";
      } else {
        // Chỉ hiển thị alert nếu không phải lỗi 400
        console.log("Non-400 error, showing alert");
        alert("Có lỗi xảy ra khi thêm sản phẩm vào giỏ hàng.");
      }
    } finally {
      setAddingToCart(null);
    }
  };

  // Page loading screen
  if (pageLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-emerald-50">
        <div className="text-center">
          {/* Logo và branding */}
          <div className="mb-8">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-green-600 to-emerald-600 rounded-full flex items-center justify-center">
              <ShoppingCart className="w-14 h-14 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              VerdantTech
            </h1>
            <p className="text-gray-600">Chợ trực tuyến</p>
          </div>

          {/* Spinner chính */}
          <div className="flex justify-center mb-6">
            <Spinner
              variant="circle-filled"
              size={60}
              className="text-green-600"
            />
          </div>

          {/* Tiêu đề */}
          <h2 className="text-2xl font-bold text-gray-800 mb-3">
            Đang tải chợ trực tuyến
          </h2>

          {/* Mô tả */}
          <p className="text-gray-600 mb-6">Chuẩn bị sản phẩm nông nghiệp...</p>

          {/* Progress indicator */}
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce"></div>
            <div
              className="w-2 h-2 bg-green-600 rounded-full animate-bounce"
              style={{ animationDelay: "0.1s" }}
            ></div>
            <div
              className="w-2 h-2 bg-green-600 rounded-full animate-bounce"
              style={{ animationDelay: "0.2s" }}
            ></div>
          </div>
        </div>
      </div>
    );
  }

  // Tách categories thành parent và subcategories
  // Kiểm tra cả parent object và parentId (nếu có)
  const parentCategories = categories.filter((cat) => {
    // Nếu có parent object và nó null hoặc undefined
    if (cat.parent === null || cat.parent === undefined) {
      // Kiểm tra thêm parentId nếu có trong object
      const parentId = (cat as any).parentId || (cat as any).parent_id;
      return parentId === null || parentId === undefined;
    }
    return false;
  });

  // Filter products
  const filteredProducts = products.filter((product) => {
    // Filter by isActive status - chỉ hiện sản phẩm đang hoạt động
    if (!product.isActive) {
      return false;
    }

    // Filter by categoryId
    const matchesCategory =
      selectedCategory === "all" || product.categoryId === selectedCategory;

    // Filter by search query - tìm trong tên sản phẩm, mô tả, và category name
    if (searchQuery === "") {
      return matchesCategory;
    }

    const searchLower = searchQuery.toLowerCase();

    // Tìm trong tên sản phẩm
    const matchesName =
      product.name?.toLowerCase().includes(searchLower) ||
      product.productName?.toLowerCase().includes(searchLower);

    // Tìm trong mô tả
    const matchesDescription =
      product.description?.toLowerCase().includes(searchLower) || false;

    // Tìm theo category name của sản phẩm
    const productCategory = categories.find((c) => c.id === product.categoryId);
    const matchesCategoryName =
      productCategory?.name.toLowerCase().includes(searchLower) || false;

    // Tìm theo category name nếu đang filter theo category cụ thể
    let matchesSelectedCategoryName = false;
    if (selectedCategory !== "all") {
      const selectedCat = categories.find((c) => c.id === selectedCategory);
      matchesSelectedCategoryName =
        selectedCat?.name.toLowerCase().includes(searchLower) || false;
    }

    const matchesSearch =
      matchesName ||
      matchesDescription ||
      matchesCategoryName ||
      matchesSelectedCategoryName;

    return matchesCategory && matchesSearch;
  });

  // Sort products: stock > 0 first, stock = 0 last
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    const stockA = a.stockQuantity || 0;
    const stockB = b.stockQuantity || 0;
    if (stockA === 0 && stockB > 0) return 1; // a (stock=0) goes to end
    if (stockA > 0 && stockB === 0) return -1; // a (stock>0) goes to front
    return 0; // Keep original order for same stock status
  });

  const totalPages = Math.max(1, Math.ceil(sortedProducts.length / pageSize));
  const pagedProducts = sortedProducts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );
  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const getPaginationRange = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, idx) => idx + 1);
    }
    if (currentPage <= 3) {
      return [1, 2, 3, 4, 5];
    }
    if (currentPage >= totalPages - 2) {
      return [
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }
    return [
      currentPage - 2,
      currentPage - 1,
      currentPage,
      currentPage + 1,
      currentPage + 2,
    ];
  };

  return (
    <motion.div
      className="min-h-screen bg-gray-50 pt-20"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header Section */}
      <motion.div
        className="bg-gradient-to-r from-green-600 to-emerald-700 text-white py-8 sm:py-12 lg:py-16"
        variants={itemVariants}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.h1
              className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4"
              initial={{ y: -30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Chợ Trực Tuyến Nông Cụ & Thiết Bị
            </motion.h1>
            <motion.p
              className="text-base sm:text-lg lg:text-xl text-green-100 mb-6 sm:mb-8 px-2"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Cung cấp đầy đủ dụng cụ, máy móc và thiết bị hiện đại cho nông
              nghiệp thông minh
            </motion.p>

            {/* Search Bar with Category Dropdown */}
            <motion.div
              className="max-w-5xl mx-auto relative px-2 sm:px-4"
              variants={searchVariants}
            >
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                {/* Category Dropdown Button */}
                <div className="relative w-full sm:w-auto">
                  <Button
                    onClick={() =>
                      setIsCategoryDropdownOpen(!isCategoryDropdownOpen)
                    }
                    className="bg-white hover:bg-gray-50 text-gray-800 border-2 border-white px-4 sm:px-5 lg:px-7 py-3 sm:py-4 lg:py-5 rounded-xl sm:rounded-2xl shadow-lg transition-all duration-300 flex items-center gap-2 sm:gap-3 w-full sm:w-auto sm:min-w-[200px] lg:min-w-[220px] justify-between text-sm sm:text-base font-semibold"
                  >
                    <div className="flex items-center gap-2 sm:gap-3">
                      <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
                      <span className="truncate">
                        {selectedCategory === "all"
                          ? "Danh mục"
                          : categories.find((c) => c.id === selectedCategory)
                              ?.name || "Danh mục"}
                      </span>
                    </div>
                    <ChevronDown
                      className={`w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-300 flex-shrink-0 ${
                        isCategoryDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </Button>

                  {/* Category Dropdown Menu */}
                  <AnimatePresence>
                    {isCategoryDropdownOpen && (
                      <>
                        {/* Backdrop */}
                        <motion.div
                          className="fixed inset-0 z-40"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          onClick={() => setIsCategoryDropdownOpen(false)}
                        />
                        {/* Dropdown Content */}
                        <motion.div
                          className="absolute top-full left-0 mt-2 sm:mt-3 w-[calc(100vw-2rem)] sm:w-[320px] bg-white rounded-xl sm:rounded-2xl shadow-2xl border-2 border-gray-100 z-50 overflow-hidden max-h-[80vh] overflow-y-auto"
                          initial={{ opacity: 0, y: -10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="p-4">
                            <h3 className="font-bold text-gray-800 mb-3 text-sm uppercase">
                              Danh mục sản phẩm
                            </h3>
                            <div className="space-y-1">
                              {/* Option "Tất cả" */}
                              <button
                                onClick={() => {
                                  setSelectedCategory("all");
                                  setSelectedParentCategory(null);
                                  setSearchQuery(""); // Clear search khi chọn "Tất cả"
                                  setIsCategoryDropdownOpen(false);
                                }}
                                className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-center gap-3 ${
                                  selectedCategory === "all"
                                    ? "bg-green-600 text-white shadow-md"
                                    : "text-gray-700 hover:bg-white hover:text-green-600"
                                }`}
                              >
                                <span className="font-medium text-sm">
                                  Tất cả
                                </span>
                                {selectedCategory === "all" && (
                                  <ChevronDown className="w-4 h-4 ml-auto rotate-90" />
                                )}
                              </button>

                              {/* Parent Categories với subcategories inline */}
                              {parentCategories.map((category) => {
                                // Kiểm tra xem category này có subcategories không
                                const categorySubCategories = categories.filter(
                                  (cat) => {
                                    // Kiểm tra parent object
                                    if (
                                      cat.parent &&
                                      typeof cat.parent === "object" &&
                                      (cat.parent as any).id === category.id
                                    ) {
                                      return true;
                                    }
                                    // Kiểm tra parentId
                                    const parentId =
                                      (cat as any).parentId ||
                                      (cat as any).parent_id;
                                    return parentId === category.id;
                                  }
                                );

                                const isExpanded =
                                  selectedParentCategory === category.id;

                                return (
                                  <div key={category.id}>
                                    <button
                                      onClick={() => {
                                        if (categorySubCategories.length > 0) {
                                          // Nếu có subcategories, toggle hiển thị chúng
                                          setSelectedParentCategory(
                                            isExpanded ? null : category.id
                                          );
                                        } else {
                                          // Nếu không có subcategories, chọn category này
                                          setSelectedCategory(category.id);
                                          setSearchQuery("");
                                          setIsCategoryDropdownOpen(false);
                                        }
                                      }}
                                      className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-center gap-3 ${
                                        selectedCategory === category.id &&
                                        categorySubCategories.length === 0
                                          ? "bg-green-600 text-white shadow-md"
                                          : "text-gray-700 hover:bg-white hover:text-green-600"
                                      }`}
                                    >
                                      <span className="font-medium text-sm">
                                        {category.name}
                                      </span>
                                      {categorySubCategories.length > 0 && (
                                        <ChevronDown
                                          className={`w-4 h-4 ml-auto transition-transform ${
                                            isExpanded ? "rotate-180" : ""
                                          }`}
                                        />
                                      )}
                                      {selectedCategory === category.id &&
                                        categorySubCategories.length === 0 && (
                                          <ChevronDown className="w-4 h-4 ml-auto rotate-90" />
                                        )}
                                    </button>

                                    {/* Subcategories hiển thị inline bên dưới parent */}
                                    {isExpanded &&
                                      categorySubCategories.length > 0 && (
                                        <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-200 pl-2">
                                          {categorySubCategories.map(
                                            (subCategory) => (
                                              <button
                                                key={subCategory.id}
                                                onClick={() => {
                                                  setSelectedCategory(
                                                    subCategory.id
                                                  );
                                                  setSelectedParentCategory(
                                                    null
                                                  );
                                                  setSearchQuery(""); // Clear search khi chọn category
                                                  setIsCategoryDropdownOpen(
                                                    false
                                                  );
                                                }}
                                                className={`w-full text-left px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-3 ${
                                                  selectedCategory ===
                                                  subCategory.id
                                                    ? "bg-green-600 text-white shadow-md"
                                                    : "text-gray-700 hover:bg-white hover:text-green-600"
                                                }`}
                                              >
                                                <span className="font-medium text-sm">
                                                  {subCategory.name}
                                                </span>
                                                {selectedCategory ===
                                                  subCategory.id && (
                                                  <ChevronDown className="w-4 h-4 ml-auto rotate-90" />
                                                )}
                                              </button>
                                            )
                                          )}
                                        </div>
                                      )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>

                {/* Search Input */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 sm:left-5 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 sm:w-6 sm:h-6" />
                  <Input
                    type="text"
                    placeholder="Tìm kiếm dụng cụ, máy móc nông nghiệp..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 sm:pl-16 pr-24 sm:pr-36 py-3 sm:py-4 lg:py-5 text-sm sm:text-base lg:text-lg border-2 border-white bg-white rounded-xl sm:rounded-2xl shadow-lg text-gray-800 placeholder:text-gray-400 focus:border-gray-300 focus:bg-white transition-all duration-300 w-full font-medium"
                  />
                  <div className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2">
                    <Button className="bg-green-600 hover:bg-green-700 text-white border-0 px-3 sm:px-5 lg:px-7 py-2 sm:py-2.5 lg:py-3 rounded-lg sm:rounded-xl shadow-md transition-all duration-300 font-semibold text-xs sm:text-sm lg:text-base">
                      <span className="hidden sm:inline">Tìm kiếm</span>
                      <span className="sm:hidden">Tìm</span>
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Message */}
        {successMessage && (
          <motion.div
            className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <span className="font-medium">{successMessage}</span>
            </div>
          </motion.div>
        )}

        {/* Products Grid */}
        <motion.div className="mb-8" variants={itemVariants}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
              Sản phẩm{" "}
              {selectedCategory !== "all" &&
                categories.find((c) => c.id === selectedCategory)?.name}
            </h2>
            <div className="flex items-center gap-2 text-sm sm:text-base text-gray-600">
              <Filter className="w-4 h-4" />
              <span>{sortedProducts.length} sản phẩm</span>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <motion.div
              className="text-center py-16"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-xl font-semibold text-red-600 mb-2">
                Lỗi tải dữ liệu
              </h3>
              <p className="text-gray-500 mb-4">{error}</p>
              <Button
                onClick={() => {
                  setError(null);
                  setLoading(true);
                  fetchProducts();
                }}
                className="bg-green-600 hover:bg-green-700"
              >
                Thử lại
              </Button>
            </motion.div>
          )}

          {/* Loading State */}
          {loading && !error && (
            <motion.div
              className="text-center py-16"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex justify-center mb-6">
                <Spinner
                  variant="circle-filled"
                  size={60}
                  className="text-green-600 mx-auto"
                />
              </div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                Đang tải sản phẩm...
              </h3>
              <p className="text-gray-500">Vui lòng chờ trong giây lát</p>
            </motion.div>
          )}

          {/* Products Grid - Only show when not loading and no error */}
          {!loading && !error && (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              variants={containerVariants}
            >
              <AnimatePresence mode="wait">
                {pagedProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    whileHover="hover"
                    transition={{ delay: index * 0.1 }}
                    className="h-full"
                  >
                    <Card
                      className="group hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer h-full flex flex-col"
                      onClick={() => navigate(`/product/${product.id}`)}
                    >
                      {/* Image Section - Fixed height */}
                      <div className="relative h-48">
                        <motion.img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          whileHover={{ scale: 1.05 }}
                          transition={{ duration: 0.3 }}
                        />
                        {product.discount && product.discount > 0 && (
                          <motion.div
                            className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-full text-sm font-bold"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.5 + index * 0.1 }}
                          >
                            -{product.discount}%
                          </motion.div>
                        )}
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute top-2 right-2 bg-white/80 hover:bg-white text-gray-600 rounded-full p-2"
                          >
                            <Heart className="w-4 h-4" />
                          </Button>
                        </motion.div>
                      </div>

                      {/* Content Section - Flexible height */}
                      <div className="flex-1 flex flex-col">
                        <CardHeader className="pb-1 flex-1">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2 min-h-[3.5rem]">
                                {product.name}
                              </CardTitle>
                              <p className="text-sm text-gray-600 mb-3 line-clamp-2 min-h-[2.5rem]">
                                {product.description}
                              </p>

                              {/* Product Info Grid */}
                              <div className="space-y-2 mb-0">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <span className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></span>
                                  <span>
                                    Còn lại: {product.stockQuantity || 0} sản
                                    phẩm
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardHeader>

                        <CardContent className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                <span className="font-semibold">
                                  {(() => {
                                    // Use fetched rating if available, otherwise use product's ratingAverage
                                    const rating =
                                      productRatings[product.id]?.rating ??
                                      product.ratingAverage ??
                                      product.rating ??
                                      0;
                                    return rating.toFixed(1);
                                  })()}
                                </span>
                              </div>
                              <span className="text-sm text-gray-500">
                                (
                                {(() => {
                                  // Use fetched reviewCount if available, otherwise use product's reviews
                                  const reviewCount =
                                    productRatings[product.id]?.reviewCount ??
                                    product.reviews ??
                                    0;
                                  return reviewCount;
                                })()}{" "}
                                đánh giá)
                              </span>
                            </div>
                          </div>
                          {!!product.energyEfficiencyRating &&
                            String(product.energyEfficiencyRating).trim() !==
                              "" &&
                            String(product.energyEfficiencyRating) !== "0" && (
                              <div className="mt-2 text-sm text-gray-600">
                                <span className="font-medium">
                                  Nhãn năng lượng:
                                </span>{" "}
                                {product.energyEfficiencyRating}
                              </div>
                            )}
                        </CardContent>

                        {/* Footer - Fixed at bottom */}
                        <CardFooter className="pt-0 mt-auto">
                          <div className="w-full">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                {product.discount && product.discount > 0 ? (
                                  <>
                                    <span className="text-2xl font-bold text-green-600">
                                      {product.price?.toLocaleString("vi-VN")}đ
                                    </span>
                                    <span className="text-lg text-gray-400 line-through">
                                      {product.originalPrice?.toLocaleString(
                                        "vi-VN"
                                      )}
                                      đ
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-2xl font-bold text-green-600">
                                    {product.price?.toLocaleString("vi-VN")}đ
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex gap-2">
                              {product.stockQuantity === 0 ? (
                                <Button
                                  className="w-full bg-gray-400 text-white cursor-not-allowed"
                                  disabled
                                >
                                  Hết hàng
                                </Button>
                              ) : (
                                <>
                                  <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="flex-1"
                                  >
                                    <Button
                                      className="w-full bg-green-600 hover:bg-green-700"
                                      onClick={(e) =>
                                        handleAddToCart(product.id, e)
                                      }
                                      disabled={addingToCart === product.id}
                                    >
                                      {addingToCart === product.id ? (
                                        <Spinner
                                          variant="circle-filled"
                                          size={16}
                                          className="mr-2"
                                        />
                                      ) : (
                                        <ShoppingCart className="w-4 h-4 mr-2" />
                                      )}
                                      {addingToCart === product.id
                                        ? "Đang thêm..."
                                        : "Thêm vào giỏ"}
                                    </Button>
                                  </motion.div>
                                  <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                  >
                                    <Button variant="outline" className="px-4">
                                      Mua ngay
                                    </Button>
                                  </motion.div>
                                  {/* Chat with Vendor Button */}
                                  <ProductVendorChat
                                    vendor={{
                                      id: product.vendorId || 0,
                                      name:
                                        product.vendorName || "Nhà cung cấp",
                                      shopName:
                                        product.vendorName || "Cửa hàng",
                                      isOnline: true,
                                    }}
                                    productName={
                                      product.name || product.productName
                                    }
                                    productId={product.id}
                                    productImage={product.image}
                                    productPrice={product.price}
                                  />
                                </>
                              )}
                            </div>
                          </div>
                        </CardFooter>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Empty State */}
          <AnimatePresence>
            {!loading && !error && sortedProducts.length === 0 && (
              <motion.div
                className="text-center py-16"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.5 }}
              >
                <motion.div
                  className="text-6xl mb-4"
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  🚜
                </motion.div>
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  Không tìm thấy sản phẩm
                </h3>
                <p className="text-gray-500">
                  Hãy thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
      {!loading && !error && sortedProducts.length > 0 && (
        <div className="pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mt-6 flex flex-col items-center gap-4">
              <p className="text-sm text-gray-600">
                Hiển thị {(currentPage - 1) * pageSize + 1} -
                {Math.min(currentPage * pageSize, sortedProducts.length)} trong
                tổng số {sortedProducts.length} sản phẩm
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`flex items-center gap-1 px-3 py-2 rounded-full border text-sm transition-colors ${
                    currentPage === 1
                      ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                      : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Trước
                </button>
                <div className="flex items-center gap-1">
                  {getPaginationRange().map((page) => (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      className={`w-9 h-9 rounded-full border text-sm font-medium transition-colors ${
                        currentPage === page
                          ? "bg-gray-900 text-white border-gray-900"
                          : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`flex items-center gap-1 px-3 py-2 rounded-full border text-sm transition-colors ${
                    currentPage === totalPages
                      ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                      : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  Sau
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};
