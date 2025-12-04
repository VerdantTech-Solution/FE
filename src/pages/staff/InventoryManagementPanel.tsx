import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  PackagePlus, 
  PackageMinus, 
  Search, 
  Loader2, 
  Eye,
  Trash2,
  CheckCircle,
  AlertCircle,
  X,
  Plus
} from "lucide-react";
//import { useAuth } from "@/contexts/AuthContext";
import { 
  getBatchInventories, 
  createBatchInventory,
  deleteBatchInventory,
  getBatchInventoryById,
  getBatchInventoriesByProduct,
  getBatchInventoriesByVendor,
  qualityCheckBatchInventory,
  getExportInventories,
  getExportInventoryById,
  createExportInventory,
  type BatchInventory,
  type ExportInventory,
  type CreateBatchInventoryDTO,
  type CreateExportInventoryDTO,
  type ProductSerial
} from "@/api/inventory";
import { getIdentityNumbersByProductId, type IdentityNumberItem } from "@/api/export";
import { getAllProducts, getAllProductCategories, type Product, type ProductCategory } from "@/api/product";

export const InventoryManagementPanel: React.FC = () => {
  //const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"import" | "export" | "history">("import");
  
  // Import states
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [qualityCheckDialogOpen, setQualityCheckDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedInventory, setSelectedInventory] = useState<BatchInventory | null>(null);
  const [importInventories, setImportInventories] = useState<BatchInventory[]>([]);
  const [importLoading, setImportLoading] = useState(false);
  const [importPage, setImportPage] = useState(1);
  const [importPageSize] = useState(20);
  const [importTotalPages, setImportTotalPages] = useState(1);
  const [importTotalRecords, setImportTotalRecords] = useState(0);
  const [filterProductId, setFilterProductId] = useState<number | null>(null);
  const [filterVendorId, setFilterVendorId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [exportSearchTerm, setExportSearchTerm] = useState("");
  const [exportFilterProductId, setExportFilterProductId] = useState<number | null>(null);
  
  // Export states
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportDetailDialogOpen, setExportDetailDialogOpen] = useState(false);
  const [selectedExportInventory, setSelectedExportInventory] = useState<ExportInventory | null>(null);
  const [exportInventories, setExportInventories] = useState<ExportInventory[]>([]);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportPage, setExportPage] = useState(1);
  const [exportPageSize] = useState(20);
  const [exportTotalPages, setExportTotalPages] = useState(1);
  const [exportTotalRecords, setExportTotalRecords] = useState(0);
  const [exportMovementTypeFilter, setExportMovementTypeFilter] = useState<string>("all");
  
  // Form states
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [_availableSerials,setAvailableSerials] = useState<ProductSerial[]>([]);
  const [_availableLotNumbers,setAvailableLotNumbers] = useState<string[]>([]);
  const [_lotNumberSearchQuery, setLotNumberSearchQuery] = useState("");
  const [_showLotNumberSuggestions, setShowLotNumberSuggestions] = useState(false);
  const [identityNumbersCache, setIdentityNumbersCache] = useState<Record<number, IdentityNumberItem[]>>({});
  const [identityNumbersLoading, setIdentityNumbersLoading] = useState<Record<number, boolean>>({});
  
  // Product search for import form
  const [importProductSearchQuery, setImportProductSearchQuery] = useState("");
  const [showImportProductSuggestions, setShowImportProductSuggestions] = useState(false);
  
  // Import form - extends CreateBatchInventoryDTO to include serialNumbers for UI
  type ImportFormData = CreateBatchInventoryDTO & {
    serialNumbers?: string[];
  };
  
  const [importForm, setImportForm] = useState<ImportFormData>({
    productId: 0,
    sku: "",
    batchNumber: "",
    lotNumber: "",
    quantity: 1,
    unitCostPrice: 0,
    qualityCheckStatus: "NotRequired",
    serialNumbers: [],
  });


  // Quality check form
  const [qualityCheckForm, setQualityCheckForm] = useState<{
    qualityCheckStatus: 'Pending' | 'Passed' | 'Failed';
    notes?: string;
  }>({
    qualityCheckStatus: 'Pending',
    notes: '',
  });
  
  // Export form - hỗ trợ nhiều items (array)
  const [exportFormItems, setExportFormItems] = useState<CreateExportInventoryDTO[]>([
    {
      productId: 0,
      quantity: 1,
      movementType: "ReturnToVendor",
    }
  ]);
  
  // Product search for export
  const [_productSearchQuery,setProductSearchQuery] = useState("");
  const [_showProductSuggestions, setShowProductSuggestions] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const getProductPrimaryImage = (product?: ExportInventory['product'] | Product | null) => {
    if (!product) return '';
    let imageUrl = '';
    const images = (product as any).images;
    if (typeof images === 'string' && images.trim()) {
      imageUrl = images.split(',')[0].trim();
    } else if (Array.isArray(images) && images.length > 0) {
      const firstImage = images[0] as any;
      if (typeof firstImage === 'string') {
        imageUrl = firstImage;
      } else if (firstImage && typeof firstImage === 'object') {
        imageUrl = firstImage.imageUrl || firstImage.url || '';
      }
    }

    if (!imageUrl && (product as any).publicUrl) {
      imageUrl = (product as any).publicUrl;
    }

    if (!imageUrl && (product as any).image) {
      imageUrl = (product as any).image;
    }

    return imageUrl;
  };

  const getProductDisplayName = (item: ExportInventory, fallbackProduct?: Product | null) => {
    const productInfo = item.product || fallbackProduct;
    return (
      productInfo?.name ||
      (productInfo as any)?.productName ||
      (item as any).productName ||
      `Sản phẩm #${item.productId}`
    );
  };

  const fetchIdentityNumbers = async (productId: number) => {
    if (!productId) return;
    // Avoid refetch if already loading
    setIdentityNumbersLoading((prev) => {
      if (prev[productId]) {
        return prev;
      }
      return { ...prev, [productId]: true };
    });
    try {
      const data = await getIdentityNumbersByProductId(productId);
      setIdentityNumbersCache((prev) => ({ ...prev, [productId]: data }));
    } catch (err) {
      console.error("Error fetching identity numbers:", err);
    } finally {
      setIdentityNumbersLoading((prev) => ({ ...prev, [productId]: false }));
    }
  };

  useEffect(() => {
    exportFormItems.forEach((item) => {
      if (
        item.productId > 0 &&
        !identityNumbersCache[item.productId] &&
        !identityNumbersLoading[item.productId]
      ) {
        fetchIdentityNumbers(item.productId);
      }
    });
  }, [exportFormItems, identityNumbersCache, identityNumbersLoading]);

  // Fetch products and categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsData, categoriesData] = await Promise.all([
          getAllProducts({ page: 1, pageSize: 1000 }),
          getAllProductCategories()
        ]);
        setProducts(productsData);
        setCategories(categoriesData);
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };
    fetchData();
  }, []);

  // Fetch import inventories
  const fetchImportInventories = async () => {
    try {
      setImportLoading(true);
      let response;
      
      if (filterProductId) {
        response = await getBatchInventoriesByProduct(filterProductId, { page: importPage, pageSize: importPageSize });
      } else if (filterVendorId) {
        response = await getBatchInventoriesByVendor(filterVendorId, { page: importPage, pageSize: importPageSize });
      } else {
        response = await getBatchInventories({ page: importPage, pageSize: importPageSize, productId: filterProductId || undefined, vendorId: filterVendorId || undefined });
      }
      
      console.log("Import inventories response:", response);
      console.log("Total pages:", response.totalPages, "Total records:", response.totalRecords);
      
      const data = response.data || [];
      let totalPages = response.totalPages;
      let totalRecords = response.totalRecords;
      
      // If backend doesn't provide pagination metadata, calculate it
      if (!totalPages && totalRecords === undefined) {
        if (data.length === 0 && importPage > 1) {
          // No data on this page, so previous page was the last
          totalPages = importPage - 1;
          const prevPageData = importInventories.length;
          totalRecords = (importPage - 2) * importPageSize + prevPageData;
        } else if (data.length < importPageSize && data.length > 0) {
          // This is the last page (got some data but less than pageSize)
          totalPages = importPage;
          totalRecords = (importPage - 1) * importPageSize + data.length;
        } else if (data.length === importPageSize) {
          // Got full page, assume there might be more pages
          // Set to at least current page + 1 to show pagination
          totalPages = Math.max(importPage + 1, importTotalPages || importPage + 1);
          totalRecords = importPage * importPageSize; // Minimum count
        } else {
          // No data at all
          totalPages = 1;
          totalRecords = 0;
        }
      } else {
        // Backend provided metadata, use it
        totalPages = totalPages || 1;
        totalRecords = totalRecords || data.length;
      }
      
      setImportInventories(data);
      setImportTotalPages(totalPages);
      setImportTotalRecords(totalRecords);
    } catch (err: any) {
      console.error("Error fetching import inventories:", err);
      setError(err?.message || "Không thể tải danh sách nhập hàng");
    } finally {
      setImportLoading(false);
    }
  };

  // Fetch export inventories - tương tự như fetchImportInventories
  const fetchExportInventories = async () => {
    try {
      setExportLoading(true);
      setError(null);
      const response = await getExportInventories({ 
        page: exportPage, 
        pageSize: exportPageSize,
        movementType: exportMovementTypeFilter && exportMovementTypeFilter !== "all" ? exportMovementTypeFilter : undefined,
        productId: exportFilterProductId || undefined
      });
      console.log("Export inventories response:", response);
      console.log("Export inventories data:", response.data);
      setExportInventories(response.data || []);
      setExportTotalPages(response.totalPages || 1);
      setExportTotalRecords(response.totalRecords || 0);
    } catch (err: any) {
      console.error("Error fetching export inventories:", err);
      setError(err?.message || "Không thể tải danh sách xuất hàng");
    } finally {
      setExportLoading(false);
    }
  };

  // Reset import page when filters change
  useEffect(() => {
    if (activeTab === "import") {
      setImportPage(1);
    }
  }, [activeTab, filterProductId, filterVendorId, searchTerm]);

  useEffect(() => {
    if (activeTab === "import") {
      fetchImportInventories();
    } else if (activeTab === "export") {
      fetchExportInventories();
    }
  }, [activeTab, importPage, exportPage, exportMovementTypeFilter, exportFilterProductId, filterProductId, filterVendorId]);

  // When product is selected for import, check if it needs serial numbers
  useEffect(() => {
    if (importForm.productId > 0) {
      const product = products.find(p => p.id === importForm.productId);
      setSelectedProduct(product || null);
      
      // Generate default SKU
      if (product && !importForm.sku) {
        const timestamp = Date.now();
        setImportForm(prev => ({
          ...prev,
          sku: `SKU-${product.id}-${timestamp}`,
        }));
      }
    }
  }, [importForm.productId, products]);

  // Note: Các useEffect cho serials và lotNumbers sẽ được xử lý trong form khi chọn product cho từng item

  // Handle import form submit
  const handleImportSubmit = async () => {
    if (!importForm.productId || !importForm.sku || !importForm.batchNumber || !importForm.lotNumber) {
      setError("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }

    if (importForm.quantity <= 0) {
      setError("Số lượng phải lớn hơn 0");
      return;
    }

    if (importForm.unitCostPrice <= 0) {
      setError("Giá vốn phải lớn hơn 0");
      return;
    }

    // Validate serial numbers chỉ khi category yêu cầu serial
    const product = products.find(p => p.id === importForm.productId);
    let requiresSerial = false;
    if (product && product.categoryId) {
      const category = categories.find(c => c.id === product.categoryId);
      requiresSerial = (category?.serialRequired === true) || (product.categoryId === 1 || product.categoryId === 2);
    }
    
    if (requiresSerial) {
      const serialNumbers = importForm.serialNumbers || [];
      const validSerials = serialNumbers.filter(s => s.trim());
      
      if (validSerials.length === 0) {
        setError("Sản phẩm này yêu cầu nhập số serial. Vui lòng nhập ít nhất một số serial");
        return;
      }
      if (validSerials.length !== importForm.quantity) {
        setError(`Số lượng serial đã nhập (${validSerials.length}) phải bằng số lượng sản phẩm (${importForm.quantity}). Vui lòng nhập đầy đủ ${importForm.quantity} số serial.`);
        return;
      }
      
      // Kiểm tra trùng lặp serial numbers
      const duplicates = validSerials.filter((serial, index) => validSerials.indexOf(serial) !== index);
      if (duplicates.length > 0) {
        setError(`Có số serial bị trùng lặp: ${[...new Set(duplicates)].join(', ')}. Vui lòng nhập các số serial khác nhau.`);
        return;
      }
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Tạo batch inventory - backend tự động tạo product serials nếu có serialNumbers
      console.log('Creating batch inventory with data:', importForm);
      const batchInventory = await createBatchInventory(importForm);
      console.log('Batch inventory created:', batchInventory);

      setSuccessMessage("Nhập hàng thành công!");
      setImportDialogOpen(false);
      resetImportForm();
      fetchImportInventories();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error("Error creating import inventory:", err);
      setError(err?.response?.data?.message || err?.message || "Không thể nhập hàng. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle export form submit - hỗ trợ nhiều items
  const handleExportSubmit = async () => {
    // Validate tất cả items
    for (let i = 0; i < exportFormItems.length; i++) {
      const item = exportFormItems[i];
      if (!item.productId) {
        setError(`Vui lòng chọn sản phẩm cho item ${i + 1}`);
        return;
      }

      const product = products.find(p => p.id === item.productId);
      if (!product) {
        setError(`Sản phẩm không tồn tại cho item ${i + 1}`);
        return;
      }

      const identityItems = identityNumbersCache[item.productId] || [];

      const quantity = Number(item.quantity) || 0;
      if (quantity <= 0) {
        setError(`Số lượng phải lớn hơn 0 cho item ${i + 1}`);
        return;
      }

      // Validate movementType không được là 'Sale'
      if (item.movementType === 'Sale') {
        setError(`MovementType không được là "Sale" cho item ${i + 1}. Chỉ được sử dụng khi xuất hàng bán qua OrderService.`);
        return;
      }

      // Category 1,2 = machines (need serial), Category 3,4 = materials (need lot number)
      const isMachine = product.categoryId === 1 || product.categoryId === 2;
      
      if (isMachine && !item.productSerialId && !item.productSerialNumber) {
        setError(`Sản phẩm máy móc cần có số serial cho item ${i + 1}`);
        return;
      }

      if (isMachine && quantity !== 1) {
        setError(`Sản phẩm máy móc chỉ được phép xuất từng serial (số lượng = 1) cho item ${i + 1}`);
        return;
      }

      if (!isMachine && !item.lotNumber) {
        setError(`Sản phẩm vật tư cần có số lô cho item ${i + 1}`);
        return;
      }

      if (!isMachine && item.lotNumber) {
        const lotInfo = identityItems.find(identity => identity.lotNumber === item.lotNumber);
        if (lotInfo?.remainingQuantity && quantity > lotInfo.remainingQuantity) {
          setError(`Số lượng xuất vượt quá tồn kho (${lotInfo.remainingQuantity}) cho số lô ${item.lotNumber} - item ${i + 1}`);
          return;
        }
      }
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload = exportFormItems.map((item) => {
        const product = products.find(p => p.id === item.productId);
        const isMachine = product ? product.categoryId === 1 || product.categoryId === 2 : false;
        return {
          ...item,
          quantity: isMachine ? 1 : Math.max(1, Math.floor(Number(item.quantity) || 1)),
        };
      });

      await createExportInventory(payload);
      setSuccessMessage("Xuất hàng thành công!");
      setExportDialogOpen(false);
      resetExportForm();
      fetchExportInventories();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error("Error creating export inventory:", err);
      setError(err?.response?.data?.message || err?.message || "Không thể xuất hàng. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetImportForm = () => {
    setImportForm({
      productId: 0,
      sku: "",
      batchNumber: "",
      lotNumber: "",
      quantity: 1,
      unitCostPrice: 0,
      qualityCheckStatus: "NotRequired",
      serialNumbers: [],
    });
    setSelectedProduct(null);
    setImportProductSearchQuery("");
    setShowImportProductSuggestions(false);
  };

  // Handle view detail
  const handleViewDetail = async (id: number) => {
    try {
      const detail = await getBatchInventoryById(id);
      setSelectedInventory(detail);
      setDetailDialogOpen(true);
    } catch (err: any) {
      console.error("Error fetching detail:", err);
      setError(err?.message || "Không thể tải chi tiết");
    }
  };


  // Handle delete
  const handleDelete = async () => {
    if (!selectedInventory) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await deleteBatchInventory(selectedInventory.id);
      setSuccessMessage("Xóa thành công!");
      setDeleteDialogOpen(false);
      setSelectedInventory(null);
      fetchImportInventories();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error("Error deleting inventory:", err);
      setError(err?.response?.data?.message || err?.message || "Không thể xóa");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle quality check
  const handleQualityCheck = (item: BatchInventory) => {
    setSelectedInventory(item);
    const currentStatus = item.qualityCheckStatus as string;
    setQualityCheckForm({
      qualityCheckStatus: (currentStatus === 'Pending' || currentStatus === 'pending') ? 'Pending' : 
                          (currentStatus === 'Passed' || currentStatus === 'passed') ? 'Passed' : 'Failed',
      notes: item.notes || '',
    });
    setQualityCheckDialogOpen(true);
  };

  // Handle quality check submit
  const handleQualityCheckSubmit = async () => {
    if (!selectedInventory) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const updatedItem = await qualityCheckBatchInventory(selectedInventory.id, qualityCheckForm);
      console.log('Quality check updated item:', updatedItem);
      
      // Update the item in the state immediately
      if (updatedItem && updatedItem.id) {
        setImportInventories(prev => 
          prev.map(item => item.id === updatedItem.id ? updatedItem : item)
        );
      }
      
      setSuccessMessage("Kiểm tra chất lượng thành công!");
      setQualityCheckDialogOpen(false);
      setSelectedInventory(null);
      
      // Refresh the list to ensure consistency
      fetchImportInventories();
      
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error("Error quality checking:", err);
      setError(err?.response?.data?.message || err?.message || "Không thể kiểm tra chất lượng");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered inventories
  const filteredImportInventories = useMemo(() => {
    let filtered = importInventories;

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(item => 
        item.sku.toLowerCase().includes(searchLower) ||
        item.batchNumber.toLowerCase().includes(searchLower) ||
        item.lotNumber.toLowerCase().includes(searchLower) ||
        (item.productName && item.productName.toLowerCase().includes(searchLower))
      );
    }

    return filtered;
  }, [importInventories, searchTerm]);

  // Filtered export inventories - tương tự như filteredImportInventories
  const filteredExportInventories = useMemo(() => {
    let filtered = exportInventories;

    if (exportSearchTerm) {
      const searchLower = exportSearchTerm.toLowerCase();
      filtered = filtered.filter(item => 
        (item.product?.name && item.product.name.toLowerCase().includes(searchLower)) ||
        ((item as any).productName && (item as any).productName.toLowerCase().includes(searchLower)) ||
        (item.productSerial && item.productSerial.serialNumber.toLowerCase().includes(searchLower)) ||
        (item.lotNumber && item.lotNumber.toLowerCase().includes(searchLower)) ||
        (item.order && item.order.orderNumber.toLowerCase().includes(searchLower))
      );
    }

    return filtered;
  }, [exportInventories, exportSearchTerm]);

  const resetExportForm = () => {
    setExportFormItems([{
      productId: 0,
      quantity: 1,
      movementType: "ReturnToVendor",
    }]);
    setSelectedProduct(null);
    setAvailableSerials([]);
    setAvailableLotNumbers([]);
    setProductSearchQuery("");
    setShowProductSuggestions(false);
    setLotNumberSearchQuery("");
    setShowLotNumberSuggestions(false);
  };

  // Functions để quản lý exportFormItems
  const addExportFormItem = () => {
    setExportFormItems((prev) => [
      ...prev,
      {
        productId: 0,
        quantity: 1,
        movementType: "ReturnToVendor",
      },
    ]);
  };

  const removeExportFormItem = (index: number) => {
    setExportFormItems((prev) => {
      if (prev.length <= 1) {
        return prev;
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const updateExportFormItem = (index: number, field: keyof CreateExportInventoryDTO, value: any) => {
    setExportFormItems((prev) => {
      const newItems = [...prev];
      newItems[index] = { ...newItems[index], [field]: value };
      return newItems;
    });
  };

  // Handle view export detail
  const handleViewExportDetail = async (id: number) => {
    try {
      const detail = await getExportInventoryById(id);
      setSelectedExportInventory(detail);
      setExportDetailDialogOpen(true);
    } catch (err: any) {
      console.error("Error fetching export detail:", err);
      setError(err?.message || "Không thể tải chi tiết");
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getQualityStatusBadge = (status: string) => {
    const statusLower = (status || '').toLowerCase();
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      notrequired: "outline",
      pending: "secondary",
      passed: "default",
      failed: "destructive",
    };
    const labels: Record<string, string> = {
      notrequired: "Không yêu cầu",
      pending: "Chờ kiểm tra",
      passed: "Đạt",
      failed: "Không đạt",
    };
    return (
      <Badge variant={variants[statusLower] || "outline"}>
        {labels[statusLower] || status}
      </Badge>
    );
  };

  const getMovementTypeBadge = (type: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      Sale: "default",
      ReturnToVendor: "secondary",
      Damage: "destructive",
      Loss: "destructive",
      Adjustment: "outline",
    };
    const labels: Record<string, string> = {
      Sale: "Bán hàng",
      ReturnToVendor: "Trả nhà cung cấp",
      Damage: "Hư hỏng",
      Loss: "Mất mát",
      Adjustment: "Điều chỉnh",
    };
    return (
      <Badge variant={variants[type] || "outline"}>
        {labels[type] || type}
      </Badge>
    );
  };

  // Check if product is machine (category 1 or 2)
  const isMachineProduct = (productId: number) => {
    const product = products.find(p => p.id === productId);
    return product && (product.categoryId === 1 || product.categoryId === 2);
  };

  return (
    <div className="w-full space-y-6">
      {/* Success/Error Messages */}
      {successMessage && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-700">{successMessage}</p>
        </div>
      )}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <p className="text-red-700">{error}</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setError(null)}
            className="ml-auto"
          >
            Đóng
          </Button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Quản Lý Kho</h2>
          <p className="text-sm text-gray-500 mt-1">Nhập hàng và xuất hàng</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              resetImportForm();
              setImportDialogOpen(true);
            }}
            className="gap-2"
          >
            <PackagePlus className="h-4 w-4" />
            Nhập hàng
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              resetExportForm();
              setExportDialogOpen(true);
            }}
            className="gap-2"
          >
            <PackageMinus className="h-4 w-4" />
            Xuất hàng
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList>
          <TabsTrigger value="import">Nhập hàng</TabsTrigger>
          <TabsTrigger value="export">Xuất hàng</TabsTrigger>
          <TabsTrigger value="history">Lịch sử</TabsTrigger>
        </TabsList>

        {/* Import Tab */}
        <TabsContent value="import" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Tìm kiếm theo SKU, số lô, tên sản phẩm..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9"
                    />
                  </div>
                </div>
                <Select
                  value={filterProductId?.toString() || "all"}
                  onValueChange={(v) => setFilterProductId(v === "all" ? null : parseInt(v))}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Lọc theo sản phẩm" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả sản phẩm</SelectItem>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id.toString()}>
                        {p.productName || p.name} ({(p as any).code || p.productCode || `#${p.id}`})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {(filterProductId || filterVendorId || searchTerm) && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setFilterProductId(null);
                      setFilterVendorId(null);
                      setSearchTerm("");
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Xóa bộ lọc
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {importLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Đang tải...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredImportInventories.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-gray-500">
                    Chưa có lịch sử nhập hàng
                  </CardContent>
                </Card>
              ) : (
                filteredImportInventories.map((item) => {
                  // Tìm thông tin sản phẩm từ products array
                  const productInfo = products.find(p => p.id === item.productId);
                  
                  // Parse hình ảnh sản phẩm
                  let productImageUrl = '';
                  if (productInfo) {
                    if (typeof productInfo.images === 'string' && productInfo.images) {
                      productImageUrl = productInfo.images.split(',')[0].trim();
                    } else if (Array.isArray(productInfo.images) && productInfo.images.length > 0) {
                      const firstImage = productInfo.images[0];
                      if (typeof firstImage === 'string') {
                        productImageUrl = firstImage;
                      } else if (firstImage && typeof firstImage === 'object' && 'imageUrl' in firstImage) {
                        productImageUrl = firstImage.imageUrl;
                      }
                    }
                    if (!productImageUrl && productInfo.publicUrl) {
                      productImageUrl = productInfo.publicUrl;
                    }
                    if (!productImageUrl && productInfo.image) {
                      productImageUrl = productInfo.image;
                    }
                  }
                  
                  return (
                    <Card key={item.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">
                            {item.product?.name || item.productName || productInfo?.productName || productInfo?.name || `Sản phẩm #${item.productId}`}
                          </CardTitle>
                          {getQualityStatusBadge(item.qualityCheckStatus)}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {/* Hình ảnh và thông tin sản phẩm */}
                        <div className="flex gap-4 pb-3 border-b">
                          {productImageUrl && (
                            <div className="flex-shrink-0">
                              <img 
                                src={productImageUrl} 
                                alt={productInfo?.productName || productInfo?.name || 'Product'} 
                                className="w-24 h-24 object-cover rounded-lg border border-gray-200"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            </div>
                          )}
                          <div className="flex-1 space-y-2">
                            {productInfo && (
                              <>
                                <div>
                                  <p className="text-xs text-gray-500">Mã sản phẩm</p>
                                  <p className="text-sm font-medium">{productInfo.productCode || `#${productInfo.id}`}</p>
                                </div>
                                {productInfo.description && (
                                  <div>
                                    <p className="text-xs text-gray-500">Mô tả</p>
                                    <p className="text-sm text-gray-700 line-clamp-2">{productInfo.description}</p>
                                  </div>
                                )}
                                <div className="flex gap-4 text-sm">
                                  {productInfo.unitPrice > 0 && (
                                    <div>
                                      <p className="text-xs text-gray-500">Giá bán</p>
                                      <p className="font-medium text-blue-600">{formatPrice(productInfo.unitPrice)}</p>
                                    </div>
                                  )}
                                  {productInfo.stockQuantity !== undefined && (
                                    <div>
                                      <p className="text-xs text-gray-500">Tồn kho</p>
                                      <p className="font-medium">{productInfo.stockQuantity}</p>
                                    </div>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                        
                        {/* Thông tin nhập hàng */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Mã quản lý kho</p>
                          <p className="font-medium">{item.sku}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Mã lô hàng</p>
                          <p className="font-medium">{item.batchNumber}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Số lượng</p>
                          <p className="font-medium">{item.quantity}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Giá vốn</p>
                          <p className="font-medium">{formatPrice(item.unitCostPrice)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Số lô sản xuất</p>
                          <p className="font-medium">{item.lotNumber}</p>
                        </div>
                        {item.expiryDate && (
                          <div>
                            <p className="text-gray-500">Hạn sử dụng</p>
                            <p className="font-medium">{item.expiryDate}</p>
                          </div>
                        )}
                        {item.manufacturingDate && (
                          <div>
                            <p className="text-gray-500">Ngày sản xuất</p>
                            <p className="font-medium">{item.manufacturingDate}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-gray-500">Ngày nhập</p>
                          <p className="font-medium">{formatDate(item.createdAt)}</p>
                        </div>
                      </div>
                      {item.notes && (
                        <div className="pt-2 border-t">
                          <p className="text-sm text-gray-600">{item.notes}</p>
                        </div>
                      )}
                      
                      {/* Action Buttons */}
                      <div className="pt-2 border-t flex gap-2 flex-wrap">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewDetail(item.id)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Chi tiết
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleQualityCheck(item)}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Kiểm tra
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setSelectedInventory(item);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Xóa
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                  );
                })
              )}
            </div>
          )}

          {/* Pagination */}
          {(importTotalPages > 1 || (importInventories.length === importPageSize && importPage === 1)) && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Hiển thị {((importPage - 1) * importPageSize) + 1} - {Math.min(importPage * importPageSize, importTotalRecords)} 
                trong tổng số {importTotalRecords} bản ghi
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setImportPage((p) => Math.max(1, p - 1))}
                  disabled={importPage === 1 || importLoading}
                >
                  Trước
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, importTotalPages) }, (_, i) => {
                    const pageNum = Math.max(1, Math.min(importTotalPages - 4, importPage - 2)) + i;
                    if (pageNum > importTotalPages) return null;
                    return (
                      <Button
                        key={pageNum}
                        variant={pageNum === importPage ? "default" : "outline"}
                        size="sm"
                        onClick={() => setImportPage(pageNum)}
                        disabled={importLoading}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // If we're on the "last" page but got full pageSize items, try next page
                    if (importPage >= importTotalPages && importInventories.length === importPageSize) {
                      setImportPage(p => p + 1);
                    } else {
                      setImportPage((p) => Math.min(importTotalPages, p + 1));
                    }
                  }}
                  disabled={importLoading || (importPage >= importTotalPages && importInventories.length < importPageSize)}
                >
                  Sau
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Export Tab */}
        <TabsContent value="export" className="space-y-4">
          {/* Filters - tương tự như Import Tab */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Tìm kiếm theo tên sản phẩm, số serial, số lô..."
                      value={exportSearchTerm}
                      onChange={(e) => setExportSearchTerm(e.target.value)}
                      className="w-full pl-9"
                    />
                  </div>
                </div>
                <Select
                  value={exportFilterProductId?.toString() || "all"}
                  onValueChange={(v) => setExportFilterProductId(v === "all" ? null : parseInt(v))}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Lọc theo sản phẩm" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả sản phẩm</SelectItem>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id.toString()}>
                        {p.productName || p.name} ({(p as any).code || p.productCode || `#${p.id}`})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={exportMovementTypeFilter}
                  onValueChange={setExportMovementTypeFilter}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Tất cả loại xuất" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả loại xuất</SelectItem>
                    <SelectItem value="ReturnToVendor">Trả nhà cung cấp</SelectItem>
                    <SelectItem value="Damage">Hư hỏng</SelectItem>
                    <SelectItem value="Loss">Mất mát</SelectItem>
                    <SelectItem value="Adjustment">Điều chỉnh</SelectItem>
                  </SelectContent>
                </Select>
                {(exportFilterProductId || exportMovementTypeFilter || exportSearchTerm) && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setExportFilterProductId(null);
                      setExportMovementTypeFilter("all");
                      setExportSearchTerm("");
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Xóa bộ lọc
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Pagination */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setExportPage(p => Math.max(1, p - 1))}
                  disabled={exportPage === 1 || exportLoading}
                >
                  Trước
                </Button>
                <span className="text-sm text-gray-600">
                  Trang {exportPage} / {exportTotalPages} ({exportTotalRecords} bản ghi)
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setExportPage(p => Math.min(exportTotalPages, p + 1))}
                  disabled={exportPage >= exportTotalPages || exportLoading}
                >
                  Sau
                </Button>
              </div>
            </CardContent>
          </Card>

          {exportLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Đang tải...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredExportInventories.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-gray-500">
                    Chưa có lịch sử xuất hàng
                  </CardContent>
                </Card>
              ) : (
                filteredExportInventories.map((item: ExportInventory) => {
                  const fallbackProduct = products.find(p => p.id === item.productId) || null;
                  const productInfo = item.product || fallbackProduct || undefined;
                  const productImageUrl = getProductPrimaryImage(productInfo);
                  const productName = getProductDisplayName(item, fallbackProduct || undefined);
                  const productCode =
                    (productInfo as any)?.productCode ||
                    (productInfo as any)?.code ||
                    (fallbackProduct as any)?.productCode ||
                    (fallbackProduct as any)?.code ||
                    `#${productInfo?.id || fallbackProduct?.id || item.productId}`;

                  return (
                    <Card key={item.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">
                            {productName}
                          </CardTitle>
                          {getMovementTypeBadge(item.movementType)}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex gap-4 pb-3 border-b">
                          {productImageUrl && (
                            <div className="flex-shrink-0">
                              <img
                                src={productImageUrl}
                                alt={productName}
                                className="w-24 h-24 object-cover rounded-lg border border-gray-200"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            </div>
                          )}
                          <div className="flex-1 space-y-2">
                            <div>
                              <p className="text-xs text-gray-500">Mã sản phẩm</p>
                              <p className="text-sm font-medium">{productCode}</p>
                            </div>
                            {(productInfo as any)?.description && (
                              <div>
                                <p className="text-xs text-gray-500">Mô tả</p>
                                <p className="text-sm text-gray-700 line-clamp-2">{(productInfo as any).description}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Số lượng</p>
                            <p className="font-medium">{item.quantity ?? 1}</p>
                          </div>
                          {(item.productSerial || item.productSerialNumber) && (
                            <div>
                              <p className="text-gray-500">Số Serial</p>
                              <p className="font-medium">
                                {item.productSerial?.serialNumber || item.productSerialNumber}
                              </p>
                            </div>
                          )}
                          {item.lotNumber && (
                            <div>
                              <p className="text-gray-500">Số lô</p>
                              <p className="font-medium">{item.lotNumber}</p>
                            </div>
                          )}
                          {item.order && (
                            <div>
                              <p className="text-gray-500">Đơn hàng</p>
                              <p className="font-medium">#{item.order.orderNumber}</p>
                            </div>
                          )}
                          <div>
                            <p className="text-gray-500">Ngày xuất</p>
                            <p className="font-medium">{formatDate(item.createdAt)}</p>
                          </div>
                          {(item.createdByUser || (item as any).createdByDetail) && (
                            <div>
                              <p className="text-gray-500">Người xuất</p>
                              <p className="font-medium">
                                {item.createdByUser?.fullName || (item as any).createdByDetail?.fullName}
                              </p>
                            </div>
                          )}
                        </div>
                        {item.notes && (
                          <div className="pt-2 border-t">
                            <p className="text-sm text-gray-600">{item.notes}</p>
                          </div>
                        )}
                        
                        {/* Action Buttons */}
                        <div className="pt-2 border-t flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewExportDetail(item.id)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Chi tiết
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Lịch sử gần đây</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">Tính năng đang phát triển...</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nhập hàng vào kho</DialogTitle>
            <DialogDescription>
              Điền thông tin để nhập hàng vào kho
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Product Selection with Search */}
            <div className="space-y-2">
              <Label htmlFor="import-product">Sản phẩm *</Label>
              <div className="relative">
                <div className="relative">
                  <Input
                    id="import-product"
                    placeholder="Tìm kiếm hoặc chọn sản phẩm..."
                    value={importProductSearchQuery || (importForm.productId > 0 ? products.find(p => p.id === importForm.productId)?.name || products.find(p => p.id === importForm.productId)?.productName || `Sản phẩm #${importForm.productId}` : "")}
                    onChange={(e) => {
                      const query = e.target.value;
                      setImportProductSearchQuery(query);
                      setShowImportProductSuggestions(true);
                      // Clear selection if user is typing
                      if (query !== (products.find(p => p.id === importForm.productId)?.name || products.find(p => p.id === importForm.productId)?.productName || "")) {
                        setImportForm(prev => ({ ...prev, productId: 0 }));
                        setSelectedProduct(null);
                      }
                    }}
                    onFocus={() => setShowImportProductSuggestions(true)}
                    onBlur={() => {
                      // Delay to allow click on suggestion
                      setTimeout(() => setShowImportProductSuggestions(false), 200);
                    }}
                    className="w-full"
                  />
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
                
                {/* Product Suggestions Dropdown */}
                {showImportProductSuggestions && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {(() => {
                      const filteredProducts = products.filter((product) => {
                        if (!importProductSearchQuery.trim()) return true;
                        const query = importProductSearchQuery.toLowerCase();
                        const productName = (product.name || product.productName || "").toLowerCase();
                        const productCode = (product.productCode || (product as any).code || "").toLowerCase();
                        const description = (product.description || "").toLowerCase();
                        return productName.includes(query) || productCode.includes(query) || description.includes(query);
                      });
                      
                      if (filteredProducts.length === 0) {
                        return (
                          <div className="p-3 text-sm text-gray-500 text-center">
                            Không tìm thấy sản phẩm
                          </div>
                        );
                      }
                      
                      return filteredProducts.map((product) => (
                        <button
                          key={product.id}
                          type="button"
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none transition-colors"
                          onClick={() => {
                            setImportForm(prev => ({ ...prev, productId: product.id }));
                            setSelectedProduct(product);
                            setImportProductSearchQuery(product.name || product.productName || `Sản phẩm #${product.id}`);
                            setShowImportProductSuggestions(false);
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">
                                {product.name || product.productName || `Sản phẩm #${product.id}`}
                              </p>
                              <p className="text-xs text-gray-500">
                                {(product as any).code || product.productCode || `#${product.id}`}
                              </p>
                            </div>
                          </div>
                        </button>
                      ));
                    })()}
                  </div>
                )}
              </div>
            </div>

            {/* SKU */}
            <div className="space-y-2">
              <Label htmlFor="import-sku">SKU (Mã quản lý kho) *</Label>
              <Input
                id="import-sku"
                value={importForm.sku}
                onChange={(e) => setImportForm(prev => ({ ...prev, sku: e.target.value }))}
                placeholder="SKU-001-2024"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Batch Number */}
              <div className="space-y-2">
                <Label htmlFor="import-batch">Số lô hàng *</Label>
                <Input
                  id="import-batch"
                  value={importForm.batchNumber}
                  onChange={(e) => setImportForm(prev => ({ ...prev, batchNumber: e.target.value }))}
                  placeholder="BATCH-001"
                />
              </div>

              {/* Lot Number */}
              <div className="space-y-2">
                <Label htmlFor="import-lot">Số lô sản xuất *</Label>
                <Input
                  id="import-lot"
                  value={importForm.lotNumber}
                  onChange={(e) => setImportForm(prev => ({ ...prev, lotNumber: e.target.value }))}
                  placeholder="LOT-001"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Quantity */}
              <div className="space-y-2">
                <Label htmlFor="import-quantity">Số lượng *</Label>
                <Input
                  id="import-quantity"
                  type="number"
                  min="1"
                  value={importForm.quantity}
                  onChange={(e) => {
                    const newQuantity = parseInt(e.target.value) || 1;
                    const currentSerials = importForm.serialNumbers || [];
                    let newSerials: string[];
                    
                    if (newQuantity > currentSerials.length) {
                      // Tăng số lượng: thêm các phần tử rỗng
                      newSerials = [...currentSerials, ...Array(newQuantity - currentSerials.length).fill('')];
                    } else {
                      // Giảm số lượng: giữ lại các phần tử đầu tiên
                      newSerials = currentSerials.slice(0, newQuantity);
                    }
                    
                    setImportForm(prev => ({ 
                      ...prev, 
                      quantity: newQuantity,
                      serialNumbers: newSerials
                    }));
                  }}
                />
              </div>

              {/* Unit Cost Price */}
              <div className="space-y-2">
                <Label htmlFor="import-price">Giá sản phẩm(VND) *</Label>
                <Input
                  id="import-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={importForm.unitCostPrice}
                  onChange={(e) => setImportForm(prev => ({ ...prev, unitCostPrice: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Manufacturing Date */}
              <div className="space-y-2">
                <Label htmlFor="import-manufacturing">Ngày sản xuất</Label>
                <Input
                  id="import-manufacturing"
                  type="date"
                  value={importForm.manufacturingDate || ""}
                  onChange={(e) => setImportForm(prev => ({ ...prev, manufacturingDate: e.target.value || undefined }))}
                />
              </div>

              {/* Expiry Date */}
              <div className="space-y-2">
                <Label htmlFor="import-expiry">Hạn sử dụng</Label>
                <Input
                  id="import-expiry"
                  type="date"
                  value={importForm.expiryDate || ""}
                  onChange={(e) => setImportForm(prev => ({ ...prev, expiryDate: e.target.value || undefined }))}
                />
              </div>
            </div>

            {/* Quality Check Status */}
            <div className="space-y-2">
              <Label htmlFor="import-quality">Trạng thái kiểm tra chất lượng</Label>
              <Select
                value={importForm.qualityCheckStatus}
                onValueChange={(v: any) => setImportForm(prev => ({ ...prev, qualityCheckStatus: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NotRequired">Không yêu cầu</SelectItem>
                  <SelectItem value="Pending">Chờ kiểm tra</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Khi nhập hàng, chỉ có thể chọn "Không yêu cầu" hoặc "Chờ kiểm tra". Sau khi kiểm tra sẽ có "Đạt" hoặc "Không đạt".
              </p>
            </div>

            {/* Serial Numbers - Chỉ hiển thị khi category có serialRequired = true hoặc categoryId 1,2 */}
            {(() => {
              const quantity = importForm.quantity || 0;
              const hasProduct = importForm.productId > 0;
              const product = selectedProduct || products.find(p => p.id === importForm.productId);
              
              // Kiểm tra category có yêu cầu serial không
              let requiresSerial = false;
              if (product && product.categoryId) {
                const category = categories.find(c => c.id === product.categoryId);
                // Kiểm tra serialRequired từ category hoặc categoryId 1,2 (máy móc)
                requiresSerial = (category?.serialRequired === true) || (product.categoryId === 1 || product.categoryId === 2);
              }
              
              // Hiển thị phần serial numbers khi đã chọn sản phẩm, số lượng > 0, và category yêu cầu serial
              if (hasProduct && quantity > 0 && requiresSerial) {
                // Đảm bảo mảng serialNumbers có đủ phần tử bằng số lượng
                const currentSerials = importForm.serialNumbers || [];
                const serials = Array.from({ length: quantity }, (_, i) => currentSerials[i] || '');
                const filledCount = serials.filter(s => s.trim()).length;
                const allFilled = filledCount === quantity;
                
                return (
                  <div className="space-y-3 border-t pt-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-semibold">Số serial cho từng sản phẩm *</Label>
                      <span className={`text-xs font-medium ${
                        allFilled ? 'text-green-600' : 'text-orange-600'
                      }`}>
                        Đã nhập: {filledCount} / {quantity}
                      </span>
                    </div>
                    
                    <div className="space-y-2 max-h-[400px] overflow-y-auto border rounded-lg p-3 bg-gray-50">
                      {Array.from({ length: quantity }, (_, index) => {
                        const serialValue = serials[index] || '';
                        const isEmpty = !serialValue.trim();
                        
                        return (
                          <div key={index} className="space-y-1">
                            <Label htmlFor={`serial-${index}`} className="text-sm font-medium">
                              Serial số {index + 1} *
                            </Label>
                            <Input
                              id={`serial-${index}`}
                              type="text"
                              placeholder={`Nhập serial số ${index + 1} (VD: SN${String(index + 1).padStart(3, '0')})`}
                              value={serialValue}
                              onChange={(e) => {
                                const newSerials = [...serials];
                                newSerials[index] = e.target.value;
                                setImportForm(prev => ({ 
                                  ...prev, 
                                  serialNumbers: newSerials
                                }));
                              }}
                              className={isEmpty ? 'border-orange-300 focus:border-orange-500' : 'border-green-300 focus:border-green-500'}
                            />
                          </div>
                        );
                      })}
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500">
                        Vui lòng nhập số serial cho từng sản phẩm. Cần nhập đầy đủ <strong>{quantity} số serial</strong>.
                      </p>
                      {!allFilled && (
                        <p className="text-xs text-orange-600 font-medium">
                          ⚠️ Vui lòng nhập đầy đủ {quantity} số serial cho tất cả sản phẩm. Còn thiếu {quantity - filledCount} số serial.
                        </p>
                      )}
                    </div>
                  </div>
                );
              }
              
              return null;
            })()}

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="import-notes">Ghi chú</Label>
              <Textarea
                id="import-notes"
                rows={3}
                value={importForm.notes || ""}
                onChange={(e) => setImportForm(prev => ({ ...prev, notes: e.target.value || undefined }))}
                placeholder="Ghi chú về lô hàng..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setImportDialogOpen(false);
                resetImportForm();
              }}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button
              onClick={handleImportSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Đang xử lý...
                </>
              ) : (
                "Nhập hàng"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Xuất hàng khỏi kho</DialogTitle>
            <DialogDescription>
              Tạo đơn xuất kho cho các loại: ReturnToVendor, Damage, Loss, Adjustment. Không được nhập MovementType = Sale vì chỉ được sử dụng khi xuất hàng bán qua OrderService.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Danh sách sản phẩm xuất</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addExportFormItem}
                disabled={isSubmitting}
                className="h-8"
              >
                <Plus size={16} className="mr-1" />
                Thêm sản phẩm
              </Button>
            </div>
            
            {exportFormItems.map((item, index) => {
              const productIsMachine = item.productId > 0 && isMachineProduct(item.productId);
              const identityItems = item.productId > 0 ? identityNumbersCache[item.productId] || [] : [];
              const serialOptions = identityItems.filter(identity => identity.serialNumber);
              const lotOptions = identityItems.filter(identity => identity.lotNumber);
              const selectedLotInfo = lotOptions.find(lot => lot.lotNumber === item.lotNumber);
              return (
                <Card key={index} className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <Label className="text-sm font-medium">Sản phẩm {index + 1}</Label>
                    {exportFormItems.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeExportFormItem(index)}
                        disabled={isSubmitting}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                      >
                        <Trash2 size={16} />
                      </Button>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                  {/* Product Selection */}
                  <div className="space-y-2">
                    <Label>Sản phẩm *</Label>
                    <Select
                      value={item.productId > 0 ? item.productId.toString() : ""}
                      onValueChange={(v) => {
                        const productId = parseInt(v);
                        const machineProduct = isMachineProduct(productId);
                        updateExportFormItem(index, 'productId', productId);
                        updateExportFormItem(index, 'quantity', machineProduct ? 1 : Math.max(1, item.quantity || 1));
                        // Clear fields depending on product type
                        if (machineProduct) {
                          updateExportFormItem(index, 'lotNumber', undefined);
                        } else {
                          updateExportFormItem(index, 'productSerialNumber', undefined);
                          updateExportFormItem(index, 'productSerialId', undefined);
                        }
                        fetchIdentityNumbers(productId);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn sản phẩm" />
                      </SelectTrigger>
                      <SelectContent>
                        {products && products.length > 0 ? (
                          products.map((product) => (
                            <SelectItem key={product.id} value={product.id.toString()}>
                              {product.productName || product.name || `Sản phẩm #${product.id}`} ({(product as any).code || product.productCode || `#${product.id}`})
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="loading" disabled>Đang tải sản phẩm...</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Serial Number or Lot Number based on product type */}
                  {item.productId > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        {productIsMachine ? (
                          <>
                            <div className="flex items-center justify-between">
                              <Label>Số Serial *</Label>
                              {identityNumbersLoading[item.productId] && (
                                <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                              )}
                            </div>
                            {serialOptions.length > 0 ? (
                              <Select
                                value={item.productSerialNumber || ""}
                                onValueChange={(value) => updateExportFormItem(index, 'productSerialNumber', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Chọn số serial" />
                                </SelectTrigger>
                                <SelectContent>
                                  {serialOptions.map((serial) => (
                                    <SelectItem key={serial.serialNumber} value={serial.serialNumber || ""}>
                                      {serial.serialNumber} {serial.lotNumber ? `(Lô ${serial.lotNumber})` : ""}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <Input
                                type="text"
                                placeholder="Nhập số serial"
                                value={item.productSerialNumber || ""}
                                onChange={(e) => updateExportFormItem(index, 'productSerialNumber', e.target.value)}
                              />
                            )}
                            <p className="text-xs text-gray-500">
                              {serialOptions.length > 0
                                ? "Chọn số serial có sẵn trong kho"
                                : "Nhập số serial của sản phẩm máy móc"}
                            </p>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center justify-between">
                              <Label>Số lô *</Label>
                              {identityNumbersLoading[item.productId] && (
                                <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                              )}
                            </div>
                            <Select
                              value={item.lotNumber || ""}
                              onValueChange={(value) => updateExportFormItem(index, 'lotNumber', value)}
                              disabled={lotOptions.length === 0}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder={lotOptions.length === 0 ? "Không có số lô khả dụng" : "Chọn số lô"} />
                              </SelectTrigger>
                              <SelectContent>
                                {lotOptions.length === 0 ? (
                                  <SelectItem value="__no_lot" disabled>
                                    Không có số lô khả dụng
                                  </SelectItem>
                                ) : (
                                  lotOptions.map((lot) => (
                                    <SelectItem key={lot.lotNumber} value={lot.lotNumber || ""}>
                                      {lot.lotNumber} {lot.remainingQuantity ? `(Còn ${lot.remainingQuantity})` : ""}
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-gray-500">
                              {lotOptions.length > 0
                                ? "Chọn số lô còn hàng trong kho"
                                : "Chưa có số lô nào tồn kho cho sản phẩm này"}
                            </p>
                          </>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>Số lượng *</Label>
                        <Input
                          type="number"
                          min={1}
                          max={productIsMachine ? 1 : undefined}
                          disabled={productIsMachine}
                          value={productIsMachine ? 1 : (item.quantity ?? 1)}
                          onChange={(e) => {
                            const parsed = parseInt(e.target.value || '1', 10);
                            const safeValue = Number.isNaN(parsed) ? 1 : parsed;
                            updateExportFormItem(index, 'quantity', Math.max(1, safeValue));
                          }}
                        />
                        <p className="text-xs text-gray-500">
                          {productIsMachine
                            ? "Sản phẩm máy móc luôn xuất 1 đơn vị cho mỗi serial"
                            : selectedLotInfo?.remainingQuantity
                              ? `Số lượng còn lại: ${selectedLotInfo.remainingQuantity}`
                              : "Nhập số lượng cần xuất cho sản phẩm này"}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Movement Type */}
                  <div className="space-y-2">
                    <Label>Loại xuất hàng *</Label>
                    <Select
                      value={item.movementType}
                      onValueChange={(v: any) => updateExportFormItem(index, 'movementType', v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ReturnToVendor">Trả nhà cung cấp</SelectItem>
                        <SelectItem value="Damage">Hư hỏng</SelectItem>
                        <SelectItem value="Loss">Mất mát</SelectItem>
                        <SelectItem value="Adjustment">Điều chỉnh</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">Không được chọn "Sale" - chỉ dùng khi xuất hàng bán qua OrderService</p>
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <Label>Ghi chú</Label>
                    <Textarea
                      rows={2}
                      value={item.notes || ""}
                      onChange={(e) => updateExportFormItem(index, 'notes', e.target.value || undefined)}
                      placeholder="Ghi chú về việc xuất hàng..."
                    />
                  </div>
                  </div>
                </Card>
              );
            })}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setExportDialogOpen(false);
                resetExportForm();
              }}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button
              onClick={handleExportSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Đang xử lý...
                </>
              ) : (
                "Xuất hàng"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết Batch Inventory</DialogTitle>
            <DialogDescription>
              Thông tin chi tiết về lô hàng nhập kho
            </DialogDescription>
          </DialogHeader>
          {selectedInventory && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Sản phẩm</Label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedInventory.product?.name || selectedInventory.productName || `Sản phẩm #${selectedInventory.productId}`}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">SKU</Label>
                  <p className="mt-1 text-sm text-gray-900">{selectedInventory.sku}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Số lô hàng</Label>
                  <p className="mt-1 text-sm text-gray-900">{selectedInventory.batchNumber}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Số lô sản xuất</Label>
                  <p className="mt-1 text-sm text-gray-900">{selectedInventory.lotNumber}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Số lượng</Label>
                  <p className="mt-1 text-sm text-gray-900">{selectedInventory.quantity}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Giá vốn</Label>
                  <p className="mt-1 text-sm text-gray-900">{formatPrice(selectedInventory.unitCostPrice)}</p>
                </div>
                {selectedInventory.manufacturingDate && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Ngày sản xuất</Label>
                    <p className="mt-1 text-sm text-gray-900">{selectedInventory.manufacturingDate}</p>
                  </div>
                )}
                {selectedInventory.expiryDate && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Hạn sử dụng</Label>
                    <p className="mt-1 text-sm text-gray-900">{selectedInventory.expiryDate}</p>
                  </div>
                )}
                <div>
                  <Label className="text-sm font-medium text-gray-700">Trạng thái kiểm tra</Label>
                  <div className="mt-1">{getQualityStatusBadge(selectedInventory.qualityCheckStatus)}</div>
                </div>
                {selectedInventory.notes && (
                  <div className="col-span-2">
                    <Label className="text-sm font-medium text-gray-700">Ghi chú</Label>
                    <p className="mt-1 text-sm text-gray-900">{selectedInventory.notes}</p>
                  </div>
                )}
                {selectedInventory.productSerials && selectedInventory.productSerials.length > 0 && (
                  <div className="col-span-2">
                    <Label className="text-sm font-medium text-gray-700">Số Serial ({selectedInventory.productSerials.length})</Label>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {selectedInventory.productSerials.map((serial) => (
                        <Badge key={serial.id} variant="outline">
                          {serial.serialNumber} ({serial.status})
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quality Check Dialog */}
      <Dialog open={qualityCheckDialogOpen} onOpenChange={setQualityCheckDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kiểm tra chất lượng</DialogTitle>
            <DialogDescription>
              Cập nhật trạng thái kiểm tra chất lượng cho lô hàng
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="qc-status">Kết quả kiểm tra chất lượng *</Label>
              <Select
                value={qualityCheckForm.qualityCheckStatus}
                onValueChange={(v: any) => setQualityCheckForm(prev => ({ ...prev, qualityCheckStatus: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Passed">Đạt</SelectItem>
                  <SelectItem value="Failed">Không đạt</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Chỉ có thể chọn "Đạt" hoặc "Không đạt" sau khi đã kiểm tra chất lượng.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="qc-notes">Ghi chú</Label>
              <Textarea
                id="qc-notes"
                rows={3}
                value={qualityCheckForm.notes || ""}
                onChange={(e) => setQualityCheckForm(prev => ({ ...prev, notes: e.target.value || undefined }))}
                placeholder="Ghi chú về kết quả kiểm tra..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setQualityCheckDialogOpen(false);
                setSelectedInventory(null);
              }}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button
              onClick={handleQualityCheckSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Đang xử lý...
                </>
              ) : (
                "Xác nhận"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Detail Dialog */}
      <Dialog open={exportDetailDialogOpen} onOpenChange={setExportDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết đơn xuất kho</DialogTitle>
            <DialogDescription>
              Thông tin chi tiết về đơn xuất kho
            </DialogDescription>
          </DialogHeader>
          {selectedExportInventory && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Sản phẩm</Label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedExportInventory.product?.name || `Sản phẩm #${selectedExportInventory.productId}`}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Loại xuất hàng</Label>
                  <div className="mt-1">{getMovementTypeBadge(selectedExportInventory.movementType)}</div>
                </div>
                {selectedExportInventory.productSerial && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Số Serial</Label>
                    <p className="mt-1 text-sm text-gray-900">{selectedExportInventory.productSerial.serialNumber}</p>
                  </div>
                )}
                {selectedExportInventory.lotNumber && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Số lô</Label>
                    <p className="mt-1 text-sm text-gray-900">{selectedExportInventory.lotNumber}</p>
                  </div>
                )}
                {selectedExportInventory.order && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Đơn hàng</Label>
                    <p className="mt-1 text-sm text-gray-900">#{selectedExportInventory.order.orderNumber}</p>
                  </div>
                )}
                <div>
                  <Label className="text-sm font-medium text-gray-700">Ngày xuất</Label>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(selectedExportInventory.createdAt)}</p>
                </div>
                {selectedExportInventory.createdByUser && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Người xuất</Label>
                    <p className="mt-1 text-sm text-gray-900">{selectedExportInventory.createdByUser.fullName}</p>
                  </div>
                )}
                {selectedExportInventory.notes && (
                  <div className="col-span-2">
                    <Label className="text-sm font-medium text-gray-700">Ghi chú</Label>
                    <p className="mt-1 text-sm text-gray-900">{selectedExportInventory.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setExportDetailDialogOpen(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa batch inventory này? Hành động này không thể hoàn tác.
              {selectedInventory && (
                <div className="mt-2 p-2 bg-gray-50 rounded">
                  <p className="text-sm font-medium">SKU: {selectedInventory.sku}</p>
                  <p className="text-sm">Số lô: {selectedInventory.batchNumber}</p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Đang xóa...
                </>
              ) : (
                "Xóa"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default InventoryManagementPanel;

