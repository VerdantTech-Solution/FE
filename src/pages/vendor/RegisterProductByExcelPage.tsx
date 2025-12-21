import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  FileSpreadsheet, 
  Download, 
  Upload, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  Loader2,
  ImageIcon,
  FileCheck,
  FileText,
  ArrowLeft,
  Plus,
  Trash2
} from "lucide-react";
import { motion } from "framer-motion";
import { 
  importProductRegistrationsFromExcel,
  downloadProductRegistrationTemplate,
  uploadProductRegistrationImages,
  uploadProductRegistrationCertificates,
  uploadProductRegistrationManual,
  type ProductRegistrationImportResponseDTO,
  type ProductRegistrationImportRowResultDTO
} from "@/api/product";
import VendorSidebar from "./VendorSidebar";
import VendorHeader from "./VendorHeader";
import { useNavigate } from "react-router";
import { toast } from "sonner";

export const RegisterProductByExcelPage = () => {
  const navigate = useNavigate();
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ProductRegistrationImportResponseDTO | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState<ProductRegistrationImportRowResultDTO | null>(null);
  const [uploadImages, setUploadImages] = useState<File[]>([]);
  const [uploadCertificates, setUploadCertificates] = useState<Array<{
    file: File;
    code: string;
    name: string;
  }>>([]);
  const [uploadManual, setUploadManual] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedRegistrations, setUploadedRegistrations] = useState<Set<number>>(new Set());

  const handleDownloadTemplate = async () => {
    try {
      await downloadProductRegistrationTemplate();
      toast.success('Đã tải template thành công!');
    } catch (error) {
      console.error('Error downloading template:', error);
      toast.error('Có lỗi xảy ra khi tải template. Vui lòng thử lại.');
    }
  };

  const handleExcelFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        toast.error('Vui lòng chọn file Excel (.xlsx hoặc .xls)');
        return;
      }
      setExcelFile(file);
      setImportResult(null);
      setUploadedRegistrations(new Set());
    }
  };

  const handleImportExcel = async () => {
    if (!excelFile) return;

    setImporting(true);
    try {
      const result = await importProductRegistrationsFromExcel(excelFile);
      setImportResult(result);
      if (result.successfulCount > 0) {
        toast.success(`Import thành công ${result.successfulCount} sản phẩm!`);
      }
      if (result.failedCount > 0) {
        toast.warning(`${result.failedCount} sản phẩm import thất bại. Vui lòng kiểm tra lại.`);
      }
    } catch (error: any) {
      console.error('Error importing Excel:', error);
      toast.error(error?.response?.data?.error || error?.message || 'Có lỗi xảy ra khi import Excel');
    } finally {
      setImporting(false);
    }
  };

  const handleOpenUploadDialog = (result: ProductRegistrationImportRowResultDTO) => {
    setSelectedRegistration(result);
    setUploadDialogOpen(true);
    setUploadImages([]);
    setUploadCertificates([{ file: null as any, code: '', name: '' }]);
    setUploadManual(null);
  };

  const addCertificate = () => {
    setUploadCertificates([...uploadCertificates, { file: null as any, code: '', name: '' }]);
  };

  const removeCertificate = (index: number) => {
    if (uploadCertificates.length > 1) {
      setUploadCertificates(uploadCertificates.filter((_, i) => i !== index));
    }
  };

  const updateCertificate = (index: number, field: 'code' | 'name' | 'file', value: string | File | null) => {
    const newCertificates = [...uploadCertificates];
    newCertificates[index] = {
      ...newCertificates[index],
      [field]: value
    };
    setUploadCertificates(newCertificates);
  };

  const handleCertificateFileChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        toast.error('Chỉ chấp nhận file PDF cho chứng chỉ');
        return;
      }
      updateCertificate(index, 'file', file);
    } else {
      updateCertificate(index, 'file', null);
    }
  };

  const handleUploadFiles = async () => {
    if (!selectedRegistration || !selectedRegistration.productRegistrationId) return;

    // Validate: phải có ít nhất 1 ảnh, 1 chứng chỉ và 1 manual
    if (uploadImages.length === 0) {
      toast.error('Vui lòng upload ít nhất 1 hình ảnh sản phẩm!');
      return;
    }
    
    // Validate certificates: phải có name và file cho mỗi certificate
    const validCertificates = uploadCertificates.filter(cert => cert.file && cert.name.trim());
    const invalidCertificates = uploadCertificates.filter(cert => 
      !cert.file || !cert.name.trim()
    );
    
    if (invalidCertificates.length > 0) {
      toast.error('Vui lòng nhập đầy đủ tên chứng chỉ và chọn file cho tất cả chứng chỉ!');
      return;
    }
    
    if (validCertificates.length === 0) {
      toast.error('Vui lòng upload ít nhất 1 chứng chỉ!');
      return;
    }
    
    if (!uploadManual) {
      toast.error('Vui lòng upload file hướng dẫn sử dụng!');
      return;
    }

    setUploading(true);
    try {
      const registrationId = selectedRegistration.productRegistrationId;

      // Upload images
      await uploadProductRegistrationImages(registrationId, uploadImages);

      // Upload certificates với code và name
      await uploadProductRegistrationCertificates(
        registrationId, 
        validCertificates.map(cert => ({
          file: cert.file,
          code: cert.code.trim() || undefined,
          name: cert.name.trim()
        }))
      );

      // Upload manual
      await uploadProductRegistrationManual(registrationId, uploadManual);

      // Mark as uploaded
      setUploadedRegistrations(prev => new Set([...prev, registrationId]));
      
      toast.success('Upload files thành công!');
      setUploadDialogOpen(false);
      setSelectedRegistration(null);
      setUploadImages([]);
      setUploadCertificates([]);
      setUploadManual(null);
    } catch (error: any) {
      console.error('Error uploading files:', error);
      toast.error(error?.response?.data?.error || error?.message || 'Có lỗi xảy ra khi upload files');
    } finally {
      setUploading(false);
    }
  };

  // Check if all successful registrations have uploaded files
  const successfulRegistrations = importResult?.results.filter(r => r.isSuccess && r.productRegistrationId) || [];
  const allFilesUploaded = successfulRegistrations.length > 0 && 
    successfulRegistrations.every(r => uploadedRegistrations.has(r.productRegistrationId!));

  const successfulCount = successfulRegistrations.length;
  const uploadedCount = successfulRegistrations.filter(r => 
    uploadedRegistrations.has(r.productRegistrationId!)
  ).length;

  const handleComplete = () => {
    if (!allFilesUploaded) {
      toast.error('Vui lòng upload đầy đủ files (ảnh, chứng chỉ, manual) cho tất cả sản phẩm trước khi hoàn thành!');
      return;
    }
    toast.success('Đăng ký sản phẩm hoàn tất!');
    navigate('/vendor/registrations');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <VendorSidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden ml-64">
        <VendorHeader
          title="Đăng ký sản phẩm bằng Excel"
          subtitle="Import nhiều sản phẩm cùng lúc từ file Excel"
          rightContent={
            <Button
              variant="outline"
              onClick={() => navigate('/vendor/registrations')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Quay lại
            </Button>
          }
        />

        <main className="flex-1 p-6 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-7xl mx-auto space-y-6"
          >
            {/* Excel Upload Section */}
            <Card className="shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="h-6 w-6 text-blue-600" />
                    <h3 className="text-lg font-semibold">Upload file Excel</h3>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={handleDownloadTemplate}
                      className="gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Tải template
                    </Button>
                  </div>
                </div>
                
                {/* Note/Guide Section */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-blue-900 mb-2">Hướng dẫn sử dụng:</h4>
                      <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                        <li>Tải file template Excel để xem định dạng dữ liệu</li>
                        <li>Điền thông tin sản phẩm vào file Excel theo template</li>
                        <li>Upload file Excel để import nhiều sản phẩm cùng lúc</li>
                        <li><strong className="text-red-600">Bắt buộc:</strong> Sau khi import, phải upload đầy đủ ảnh, chứng chỉ và file hướng dẫn cho từng sản phẩm</li>
                        <li>File Excel tối đa 1000 dòng mỗi lần import</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="excel-file">Chọn file Excel</Label>
                    <Input
                      id="excel-file"
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleExcelFileChange}
                      className="mt-2"
                    />
                    {excelFile && (
                      <p className="text-sm text-gray-600 mt-2">Đã chọn: {excelFile.name}</p>
                    )}
                  </div>

                  <Button
                    onClick={handleImportExcel}
                    disabled={!excelFile || importing}
                    className="w-full gap-2 bg-blue-600 hover:bg-blue-700"
                  >
                    {importing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Đang import...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        Import Excel
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Import Results */}
            {importResult && (
              <Card className="shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Kết quả import</h3>
                    <div className="flex items-center gap-4">
                      <div className="text-sm">
                        <span className="text-gray-600">Đã upload files: </span>
                        <span className={`font-semibold ${allFilesUploaded ? 'text-green-600' : 'text-blue-600'}`}>
                          {uploadedCount}/{successfulCount}
                        </span>
                      </div>
                      <Button
                        onClick={handleComplete}
                        disabled={!allFilesUploaded}
                        className={`${allFilesUploaded ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'}`}
                      >
                        Hoàn thành đăng ký
                      </Button>
                    </div>
                  </div>

                  {!allFilesUploaded && successfulCount > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                      <p className="text-sm text-yellow-800">
                        <strong>Lưu ý:</strong> Bạn cần upload đầy đủ files cho tất cả {successfulCount} sản phẩm trước khi hoàn thành đăng ký.
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Tổng số dòng</p>
                      <p className="text-2xl font-bold text-blue-600">{importResult.totalRows}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Thành công</p>
                      <p className="text-2xl font-bold text-green-600">{importResult.successfulCount}</p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Thất bại</p>
                      <p className="text-2xl font-bold text-red-600">{importResult.failedCount}</p>
                    </div>
                  </div>

                  <div className="max-h-96 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Dòng</TableHead>
                          <TableHead>Tên sản phẩm</TableHead>
                          <TableHead>Trạng thái</TableHead>
                          <TableHead>Files đã upload</TableHead>
                          <TableHead>Thao tác</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {importResult.results.map((result, idx) => {
                          const hasUploaded = result.productRegistrationId && 
                            uploadedRegistrations.has(result.productRegistrationId);
                          
                          return (
                            <TableRow key={idx}>
                              <TableCell>{result.rowNumber}</TableCell>
                              <TableCell>{result.proposedProductName || '-'}</TableCell>
                              <TableCell>
                                {result.isSuccess ? (
                                  <span className="text-green-600 flex items-center gap-1">
                                    <CheckCircle2 className="h-4 w-4" />
                                    Thành công
                                  </span>
                                ) : (
                                  <span className="text-red-600 flex items-center gap-1">
                                    <X className="h-4 w-4" />
                                    Thất bại
                                  </span>
                                )}
                              </TableCell>
                              <TableCell>
                                {result.isSuccess && result.productRegistrationId ? (
                                  hasUploaded ? (
                                    <span className="text-green-600 flex items-center gap-1">
                                      <CheckCircle2 className="h-4 w-4" />
                                      Đã upload
                                    </span>
                                  ) : (
                                    <span className="text-yellow-600 flex items-center gap-1">
                                      <AlertCircle className="h-4 w-4" />
                                      Chưa upload
                                    </span>
                                  )
                                ) : (
                                  <span className="text-sm text-red-600">{result.errorMessage}</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {result.isSuccess && result.productRegistrationId ? (
                                  <Button
                                    size="sm"
                                    variant={hasUploaded ? "outline" : "default"}
                                    onClick={() => handleOpenUploadDialog(result)}
                                    className="gap-1"
                                  >
                                    {hasUploaded ? (
                                      <>
                                        <FileCheck className="h-4 w-4" />
                                        Cập nhật files
                                      </>
                                    ) : (
                                      <>
                                        <Upload className="h-4 w-4" />
                                        Upload files
                                      </>
                                    )}
                                  </Button>
                                ) : null}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </main>
      </div>

      {/* Upload Files Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload files cho sản phẩm</DialogTitle>
            <DialogDescription>
              Upload ảnh, chứng chỉ và file hướng dẫn cho: {selectedRegistration?.proposedProductName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="upload-images" className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Hình ảnh sản phẩm *
              </Label>
              <Input
                id="upload-images"
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  if (e.target.files) {
                    setUploadImages(Array.from(e.target.files));
                  }
                }}
                className="mt-2"
              />
              {uploadImages.length > 0 && (
                <p className="text-sm text-gray-600 mt-2">
                  Đã chọn {uploadImages.length} ảnh
                </p>
              )}
            </div>

            <div className="space-y-4">
              <Label className="flex items-center gap-2">
                <FileCheck className="h-4 w-4" />
                Chứng chỉ (PDF) *
              </Label>
              
              {/* Certificate list */}
              <div className="space-y-3">
                {uploadCertificates.map((cert, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg space-y-3">
                    <div className="flex items-start gap-3">
                      <FileText className="h-5 w-5 text-blue-600 mt-1" />
                      <div className="flex-1 space-y-3">
                        {/* Mã chứng chỉ */}
                        <div className="space-y-1">
                          <Label className="text-xs font-medium text-gray-700">
                            Mã chứng chỉ (tùy chọn)
                          </Label>
                          <Input
                            type="text"
                            value={cert.code}
                            onChange={(e) => updateCertificate(index, 'code', e.target.value)}
                            placeholder="VD: CERT-2024-001"
                            className="text-sm"
                          />
                        </div>
                        
                        {/* Tên chứng chỉ */}
                        <div className="space-y-1">
                          <Label className="text-xs font-medium text-gray-700">
                            Tên chứng chỉ <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            type="text"
                            value={cert.name}
                            onChange={(e) => updateCertificate(index, 'name', e.target.value)}
                            placeholder="VD: Chứng nhận ISO 9001"
                            className="text-sm"
                            required
                          />
                        </div>
                        
                        {/* File upload */}
                        <div className="space-y-1">
                          <Label className="text-xs font-medium text-gray-700">
                            Tệp tin chứng nhận <span className="text-red-500">*</span>
                          </Label>
                          <div className="flex items-center gap-2">
                            <label className="flex-1">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-8 cursor-pointer w-full justify-start"
                                asChild
                              >
                                <span>
                                  <Upload size={16} className="mr-1" />
                                  {cert.file ? cert.file.name : 'Chọn file PDF'}
                                </span>
                              </Button>
                              <input
                                type="file"
                                accept=".pdf,application/pdf"
                                onChange={(e) => handleCertificateFileChange(index, e)}
                                className="hidden"
                              />
                            </label>
                            {uploadCertificates.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeCertificate(index)}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                              >
                                <Trash2 size={16} />
                              </Button>
                            )}
                          </div>
                          {cert.file && (
                            <p className="text-xs text-gray-500">
                              {(cert.file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Add certificate button */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addCertificate}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm chứng chỉ
                </Button>
              </div>
              
              <p className="text-sm text-gray-500">
                Tải lên các file PDF chứng nhận chất lượng, an toàn, hoặc các chứng chỉ khác của sản phẩm. 
                <span className="text-red-500 font-medium"> Mỗi chứng chỉ cần có tên và file.</span>
              </p>
            </div>

            <div>
              <Label htmlFor="upload-manual" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                File hướng dẫn sử dụng (PDF) *
              </Label>
              <Input
                id="upload-manual"
                type="file"
                accept=".pdf"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setUploadManual(e.target.files[0]);
                  }
                }}
                className="mt-2"
              />
              {uploadManual && (
                <p className="text-sm text-gray-600 mt-2">
                  Đã chọn: {uploadManual.name}
                </p>
              )}
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                <strong>Lưu ý:</strong> Bạn phải upload đầy đủ ít nhất 1 ảnh, 1 chứng chỉ và 1 file hướng dẫn để hoàn thành đăng ký sản phẩm.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUploadDialogOpen(false)}
            >
              Hủy
            </Button>
            <Button
              onClick={handleUploadFiles}
              disabled={uploading || uploadImages.length === 0 || uploadCertificates.filter(c => c.file && c.name.trim()).length === 0 || !uploadManual}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Đang upload...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RegisterProductByExcelPage;

