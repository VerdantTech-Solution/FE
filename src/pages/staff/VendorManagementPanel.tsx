import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Search, RefreshCw, Building2, Mail, Phone, Eye, FileText, MapPin, Calendar, CheckCircle2, XCircle, Check, X, AlertCircle } from "lucide-react";
import { getAllVendors, getVendorById, approveVendor, rejectVendor, type VendorProfileResponse } from "@/api/vendor";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { motion } from "framer-motion";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export const VendorManagementPanel: React.FC = () => {
  const { user } = useAuth();
  const [allVendors, setAllVendors] = useState<VendorProfileResponse[]>([]); // Tất cả vendors từ API
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [selectedVendor, setSelectedVendor] = useState<VendorProfileResponse | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  // Approve/Reject states
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [approveLoading, setApproveLoading] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [pendingVendorId, setPendingVendorId] = useState<number | null>(null);
  const [pendingVendorName, setPendingVendorName] = useState("");

  // Alert dialog states
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState<"success" | "error">("success");

  // Fetch tất cả vendors từ API (không phân trang)
  const fetchVendors = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const vendorsData = await getAllVendors(); // Fetch tất cả, đã được sắp xếp mới nhất lên đầu
      setAllVendors(vendorsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Lỗi không xác định';
      setError(`Không thể tải danh sách vendor: ${errorMessage}.`);
      setAllVendors([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  // Filter vendors (client-side filtering for search)
  const filteredVendors = useMemo(() => {
    if (!query.trim()) {
      return allVendors; // Nếu không có query, trả về tất cả vendors
    }
    return allVendors.filter(vendor => {
      const matchesSearch = 
        vendor.companyName.toLowerCase().includes(query.toLowerCase()) ||
        vendor.email.toLowerCase().includes(query.toLowerCase()) ||
        vendor.fullName.toLowerCase().includes(query.toLowerCase()) ||
        (vendor.phoneNumber && vendor.phoneNumber.includes(query)) ||
        (vendor.businessRegistrationNumber && vendor.businessRegistrationNumber.includes(query));
      return matchesSearch;
    });
  }, [allVendors, query]);

  // Pagination - phân trang frontend
  const totalPages = Math.ceil(filteredVendors.length / pageSize);
  const indexOfLastItem = currentPage * pageSize;
  const indexOfFirstItem = indexOfLastItem - pageSize;
  const currentVendors = filteredVendors.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    // Scroll to top khi chuyển trang
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openVendorDetail = async (vendorId: number) => {
    try {
      setDetailLoading(true);
      const vendorDetail = await getVendorById(vendorId);
      setSelectedVendor(vendorDetail);
      setDetailDialogOpen(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Không thể tải thông tin vendor';
      showAlert("Lỗi", errorMessage, "error");
    } finally {
      setDetailLoading(false);
    }
  };

  const openApproveDialog = (vendor: VendorProfileResponse) => {
    setPendingVendorId(vendor.id);
    setPendingVendorName(vendor.companyName);
    setApproveDialogOpen(true);
  };

  const openRejectDialog = (vendor: VendorProfileResponse) => {
    setPendingVendorId(vendor.id);
    setPendingVendorName(vendor.companyName);
    setRejectionReason("");
    setRejectDialogOpen(true);
  };

  const handleApprove = async () => {
    if (!pendingVendorId || !user?.id) {
      showAlert("Lỗi", "Thiếu thông tin cần thiết", "error");
      return;
    }

    try {
      setApproveLoading(true);
      await approveVendor(pendingVendorId, Number(user.id));
      setApproveDialogOpen(false);
      await fetchVendors();
      showAlert("Thành công", `Đã duyệt vendor "${pendingVendorName}" thành công!`, "success");
      setPendingVendorId(null);
      setPendingVendorName("");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Không thể duyệt vendor';
      showAlert("Lỗi", errorMessage, "error");
    } finally {
      setApproveLoading(false);
    }
  };

  const handleReject = async () => {
    if (!pendingVendorId || !user?.id) {
      showAlert("Lỗi", "Thiếu thông tin cần thiết", "error");
      return;
    }

    if (!rejectionReason.trim()) {
      showAlert("Lỗi", "Vui lòng nhập lý do từ chối", "error");
      return;
    }

    try {
      setRejectLoading(true);
      await rejectVendor(pendingVendorId, Number(user.id), rejectionReason.trim());
      setRejectDialogOpen(false);
      await fetchVendors();
      showAlert("Thành công", `Đã từ chối vendor "${pendingVendorName}" thành công!`, "success");
      setPendingVendorId(null);
      setPendingVendorName("");
      setRejectionReason("");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Không thể từ chối vendor';
      showAlert("Lỗi", errorMessage, "error");
    } finally {
      setRejectLoading(false);
    }
  };

  const showAlert = (title: string, message: string, type: "success" | "error") => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertType(type);
    setAlertDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    if (!status) return 'bg-gray-100 text-gray-800 border-gray-200';

    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'suspended':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <Spinner variant="circle-filled" size={60} className="text-green-600" />
          </div>
          <p className="text-gray-600">Đang tải danh sách vendor...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">Đã xảy ra lỗi</h3>
          <p className="text-gray-500 mb-6">{error}</p>
          <Button
            onClick={() => fetchVendors()}
            className="bg-green-600 hover:bg-green-700"
          >
            Thử lại
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
      >
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Quản lý Vendor</h2>
          <p className="text-sm text-gray-500">Quản lý thông tin và chứng chỉ của vendor</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => {
              setCurrentPage(1);
              setQuery("");
              fetchVendors();
            }}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Làm mới
          </Button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Tổng Vendor</p>
                <p className="text-2xl font-bold text-blue-900">{allVendors.length}</p>
              </div>
              <div className="p-3 bg-blue-200 rounded-full">
                <Building2 className="w-8 h-8 text-blue-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Đã xác thực</p>
                <p className="text-2xl font-bold text-green-900">
                  {allVendors.filter(v => v.verifiedAt).length}
                </p>
              </div>
              <div className="p-3 bg-green-200 rounded-full">
                <CheckCircle2 className="w-8 h-8 text-green-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Chưa xác thực</p>
                <p className="text-2xl font-bold text-orange-900">
                  {allVendors.filter(v => !v.verifiedAt).length}
                </p>
              </div>
              <div className="p-3 bg-orange-200 rounded-full">
                <XCircle className="w-8 h-8 text-orange-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Hoạt động</p>
                <p className="text-2xl font-bold text-purple-900">
                  {allVendors.filter(v => v.status === 'Active').length}
                </p>
              </div>
              <div className="p-3 bg-purple-200 rounded-full">
                <CheckCircle2 className="w-8 h-8 text-purple-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Search Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Search className="w-5 h-5 mr-2 text-gray-600" />
              Tìm kiếm Vendor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Tìm theo tên công ty, email, số điện thoại, mã đăng ký kinh doanh..."
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setCurrentPage(1); // Reset về trang 1 khi search
                }}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Vendors Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card className="border-gray-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Danh sách Vendor</CardTitle>
                <CardDescription>
                  Hiển thị {filteredVendors.length} vendor {query.trim() ? 'tìm được' : 'trong tổng số'} {query.trim() ? '' : `${allVendors.length} vendor`}
                </CardDescription>
              </div>
              <div className="text-sm text-gray-500">
                Trang {currentPage} / {totalPages || 1}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="grid grid-cols-12 bg-gray-50 px-5 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide border-b">
                <div className="col-span-3">Công ty</div>
                <div className="col-span-3">Thông tin liên hệ</div>
                <div className="col-span-2">Địa chỉ</div>
                <div className="col-span-2">Trạng thái</div>
                <div className="col-span-2 text-right">Hành động</div>
              </div>
              {currentVendors.map((vendor, index) => (
                <motion.div
                  key={vendor.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="grid grid-cols-12 items-center px-5 py-4 border-b hover:bg-gray-50 transition-colors"
                >
                  <div className="col-span-3 flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {vendor.companyName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{vendor.companyName}</div>
                      <div className="text-xs text-gray-500">ID: {vendor.id}</div>
                    </div>
                  </div>
                  <div className="col-span-3">
                    <div className="flex items-center text-sm mb-1">
                      <Mail className="w-4 h-4 mr-2 text-gray-400" />
                      <span className="text-gray-700">{vendor.email}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Phone className="w-4 h-4 mr-2 text-gray-400" />
                      <span className="text-gray-700">{vendor.phoneNumber || 'Chưa có'}</span>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <div className="flex items-center text-sm">
                      <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                      <span className="text-gray-700 truncate">
                        {vendor.province || 'Chưa có'}
                      </span>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <div className="flex flex-col gap-1">
                      <Badge className={`w-fit ${getStatusColor(vendor.status)}`}>
                        {vendor.status || 'Chưa xác định'}
                      </Badge>
                      {vendor.verifiedAt ? (
                        <Badge className="w-fit bg-green-100 text-green-800 border-green-200 text-xs">
                          Đã xác thực
                        </Badge>
                      ) : (
                        <Badge className="w-fit bg-orange-100 text-orange-800 border-orange-200 text-xs">
                          Chưa xác thực
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-blue-600 text-blue-600 hover:bg-blue-50 hover:border-blue-700"
                        title="Xem chi tiết"
                        onClick={() => openVendorDetail(vendor.id)}
                        disabled={detailLoading}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {!vendor.verifiedAt && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-green-600 text-green-600 hover:bg-green-50 hover:border-green-700"
                            title="Duyệt vendor"
                            onClick={() => openApproveDialog(vendor)}
                            disabled={approveLoading || rejectLoading}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-600 text-red-600 hover:bg-red-50 hover:border-red-700"
                            title="Từ chối vendor"
                            onClick={() => openRejectDialog(vendor)}
                            disabled={approveLoading || rejectLoading}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Empty State */}
            {filteredVendors.length === 0 && (
              <div className="text-center py-16">
                <Building2 className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">Không tìm thấy vendor</h3>
                <p className="text-gray-500 mb-6">Thử thay đổi từ khóa tìm kiếm</p>
                <Button
                  variant="outline"
                  onClick={() => setQuery('')}
                >
                  Xóa bộ lọc
                </Button>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
                <div className="text-sm text-gray-500">
                  Hiển thị {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredVendors.length)} trong tổng số {filteredVendors.length} vendor
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Trước
                  </Button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(page)}
                      className="w-10 h-10 p-0"
                    >
                      {page}
                    </Button>
                  ))}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Sau
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Vendor Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Chi tiết Vendor
            </DialogTitle>
          </DialogHeader>
          {detailLoading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner variant="circle-filled" size={40} className="text-green-600" />
            </div>
          ) : selectedVendor ? (
            <div className="space-y-6">
              {/* Company Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Thông tin công ty</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Tên công ty</label>
                      <p className="text-gray-900 font-medium">{selectedVendor.companyName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Mã số đăng ký kinh doanh</label>
                      <p className="text-gray-900">{selectedVendor.businessRegistrationNumber}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Mã số thuế</label>
                      <p className="text-gray-900">{selectedVendor.taxCode || 'Chưa có'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Trạng thái</label>
                      <Badge className={getStatusColor(selectedVendor.status)}>
                        {selectedVendor.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Thông tin liên hệ</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Email
                      </label>
                      <p className="text-gray-900">{selectedVendor.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        Số điện thoại
                      </label>
                      <p className="text-gray-900">{selectedVendor.phoneNumber || 'Chưa có'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Họ và tên</label>
                      <p className="text-gray-900">{selectedVendor.fullName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Ngày tạo
                      </label>
                      <p className="text-gray-900">
                        {new Date(selectedVendor.createdAt).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Address Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Địa chỉ công ty
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Địa chỉ</label>
                    <p className="text-gray-900">{selectedVendor.companyAddress || 'Chưa có'}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Tỉnh/Thành phố</label>
                      <p className="text-gray-900">{selectedVendor.province || 'Chưa có'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Quận/Huyện</label>
                      <p className="text-gray-900">{selectedVendor.district || 'Chưa có'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Phường/Xã</label>
                      <p className="text-gray-900">{selectedVendor.commune || 'Chưa có'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Certificates */}
              {selectedVendor.files && selectedVendor.files.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Chứng chỉ ({selectedVendor.files.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-4">
                      {selectedVendor.files.map((file, index) => (
                        <div key={file.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <FileText className="w-5 h-5 text-gray-600" />
                              <span className="font-medium">Chứng chỉ {index + 1}</span>
                            </div>
                            <Badge variant="outline">{file.purpose}</Badge>
                          </div>
                          {file.imageUrl && (
                            <div className="mt-3">
                              <a
                                href={file.imageUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-2"
                              >
                                <FileText className="w-4 h-4" />
                                Xem chứng chỉ
                              </a>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Verification Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    Thông tin xác thực
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Trạng thái xác thực</label>
                    <p className="text-gray-900">
                      {selectedVendor.verifiedAt ? (
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          Đã xác thực
                        </Badge>
                      ) : (
                        <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                          Chưa xác thực
                        </Badge>
                      )}
                    </p>
                  </div>
                  {selectedVendor.verifiedAt && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Ngày xác thực</label>
                      <p className="text-gray-900">
                        {new Date(selectedVendor.verifiedAt).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                  )}
                  {selectedVendor.verifiedBy && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Xác thực bởi (ID)</label>
                      <p className="text-gray-900">{selectedVendor.verifiedBy}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Approve Vendor Dialog */}
      <AlertDialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Xác nhận duyệt vendor
            </AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn duyệt vendor <strong>{pendingVendorName}</strong>? 
              Hành động này sẽ xác thực tài khoản và gửi email thông báo cho vendor.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={approveLoading}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApprove}
              disabled={approveLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {approveLoading ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Duyệt
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Vendor Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600" />
              Từ chối vendor
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="rejectionReason">Lý do từ chối <span className="text-red-500">*</span></Label>
              <Textarea
                id="rejectionReason"
                placeholder="Nhập lý do từ chối vendor..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="mt-2 min-h-[100px]"
                disabled={rejectLoading}
              />
              <p className="text-sm text-gray-500 mt-1">
                Vendor: <strong>{pendingVendorName}</strong>
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
              disabled={rejectLoading}
            >
              Hủy
            </Button>
            <Button
              onClick={handleReject}
              disabled={rejectLoading || !rejectionReason.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              {rejectLoading ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <X className="w-4 h-4 mr-2" />
                  Từ chối
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alert Dialog for Success/Error */}
      <AlertDialog open={alertDialogOpen} onOpenChange={setAlertDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {alertType === "success" ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
              {alertTitle}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {alertMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => setAlertDialogOpen(false)}
              className={alertType === "success" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
            >
              Đóng
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default VendorManagementPanel;

