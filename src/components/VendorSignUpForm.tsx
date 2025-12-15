import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CardContent } from "@/components/ui/card";
import { signUpVendor, type VendorSignUpRequest } from "@/api/vendor";
import { useNavigate } from "react-router";
import { User, Mail, Phone, Lock, Eye, EyeOff, Building2, FileText, MapPin, X } from "lucide-react";
import { Spinner } from '@/components/ui/shadcn-io/spinner';
import { toast } from "sonner";

interface VendorSignUpFormProps {
  onSuccess?: () => void;
}

export const VendorSignUpForm: React.FC<VendorSignUpFormProps> = ({ onSuccess }) => {
  const [formData, setFormData] = useState<VendorSignUpRequest>({
    email: '',
    password: '',
    fullName: '',
    phoneNumber: '',
    taxCode: '',
    companyName: '',
    businessRegistrationNumber: '',
    companyAddress: '',
    province: '',
    district: '',
    commune: '',
    certificationName: [],
    certificationCode: [],
    files: []
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [certifications, setCertifications] = useState<Array<{ name: string; code: string; files: File[] }>>([]);
  
  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddCertification = () => {
    setCertifications(prev => [...prev, { name: '', code: '', files: [] }]);
  };

  const handleRemoveCertification = (index: number) => {
    setCertifications(prev => prev.filter((_, i) => i !== index));
  };

  const handleCertificationChange = (index: number, field: 'name' | 'code', value: string) => {
    setCertifications(prev => prev.map((cert, i) => 
      i === index ? { ...cert, [field]: value } : cert
    ));
  };

  const handleCertificationFileChange = (index: number, files: FileList | null) => {
    if (!files) return;
    const fileArray = Array.from(files);
    setCertifications(prev => prev.map((cert, i) => 
      i === index ? { ...cert, files: [...cert.files, ...fileArray] } : cert
    ));
  };

  const handleRemoveCertificationFile = (certIndex: number, fileIndex: number) => {
    setCertifications(prev => prev.map((cert, i) => 
      i === certIndex ? { ...cert, files: cert.files.filter((_, fi) => fi !== fileIndex) } : cert
    ));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.email || !formData.password || !formData.companyName || !formData.businessRegistrationNumber) {
      toast.error("Vui lòng điền đầy đủ các trường bắt buộc!");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Prepare certification data
      const certificationNames: string[] = [];
      const certificationCodes: string[] = [];
      const allFiles: File[] = [];
      
      certifications.forEach(cert => {
        if (cert.name && cert.code) {
          certificationNames.push(cert.name);
          certificationCodes.push(cert.code);
          allFiles.push(...cert.files);
        }
      });
      
      const vendorData: VendorSignUpRequest = {
        ...formData,
        certificationName: certificationNames.length > 0 ? certificationNames : undefined,
        certificationCode: certificationCodes.length > 0 ? certificationCodes : undefined,
        files: allFiles.length > 0 ? allFiles : undefined
      };
      
      console.log('🚀 Submitting vendor signup form with:', vendorData);
      
      const response = await signUpVendor(vendorData);
      console.log("✅ Vendor Signup API response:", response);
      
      toast.success("Đăng ký làm nhà cung cấp thành công! Tài khoản của bạn đang chờ xét duyệt.");
      
      // Navigate to login or vendor dashboard
      if (onSuccess) {
        onSuccess();
      } else {
        navigate("/login");
      }
      
    } catch (error: unknown) {
      console.error("💥 Vendor sign up error:", error);
      
      let errorMessage = "Đăng ký làm nhà cung cấp thất bại. Vui lòng thử lại.";
      
      if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = String(error.message);
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <CardContent className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email Field - Required */}
        <div className="space-y-2">
          <Label htmlFor="vendor-email">Email <span className="text-red-500">*</span></Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="vendor-email"
              name="email"
              type="email"
              placeholder="Nhập email của bạn"
              value={formData.email}
              onChange={handleInputChange}
              className="pl-10"
              required
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Password Field - Required */}
        <div className="space-y-2">
          <Label htmlFor="vendor-password">Mật khẩu <span className="text-red-500">*</span></Label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="vendor-password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Tạo mật khẩu"
              value={formData.password}
              onChange={handleInputChange}
              className="pl-10 pr-10"
              required
              disabled={isLoading}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Eye className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </div>
        </div>

        {/* Full Name Field */}
        <div className="space-y-2">
          <Label htmlFor="vendor-fullName">Họ và tên</Label>
          <div className="relative">
            <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="vendor-fullName"
              name="fullName"
              type="text"
              placeholder="Nhập họ và tên của bạn"
              value={formData.fullName}
              onChange={handleInputChange}
              className="pl-10"
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Phone Number Field */}
        <div className="space-y-2">
          <Label htmlFor="vendor-phoneNumber">Số điện thoại</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="vendor-phoneNumber"
              name="phoneNumber"
              type="tel"
              placeholder="Nhập số điện thoại"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              className="pl-10"
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Company Name - Required */}
        <div className="space-y-2">
          <Label htmlFor="vendor-companyName">Tên công ty <span className="text-red-500">*</span></Label>
          <div className="relative">
            <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="vendor-companyName"
              name="companyName"
              type="text"
              placeholder="Nhập tên công ty"
              value={formData.companyName}
              onChange={handleInputChange}
              className="pl-10"
              required
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Business Registration Number - Required */}
        <div className="space-y-2">
          <Label htmlFor="vendor-businessRegistrationNumber">Mã số đăng ký kinh doanh <span className="text-red-500">*</span></Label>
          <div className="relative">
            <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="vendor-businessRegistrationNumber"
              name="businessRegistrationNumber"
              type="text"
              placeholder="Nhập mã số đăng ký kinh doanh"
              value={formData.businessRegistrationNumber}
              onChange={handleInputChange}
              className="pl-10"
              required
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Tax Code */}
        <div className="space-y-2">
          <Label htmlFor="vendor-taxCode">Mã số thuế</Label>
          <div className="relative">
            <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="vendor-taxCode"
              name="taxCode"
              type="text"
              placeholder="Nhập mã số thuế"
              value={formData.taxCode}
              onChange={handleInputChange}
              className="pl-10"
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Company Address */}
        <div className="space-y-2">
          <Label htmlFor="vendor-companyAddress">Địa chỉ công ty</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="vendor-companyAddress"
              name="companyAddress"
              type="text"
              placeholder="Nhập địa chỉ công ty"
              value={formData.companyAddress}
              onChange={handleInputChange}
              className="pl-10"
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Address Fields */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="vendor-province">Tỉnh/Thành phố</Label>
            <Input
              id="vendor-province"
              name="province"
              type="text"
              placeholder="Tỉnh/TP"
              value={formData.province}
              onChange={handleInputChange}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="vendor-district">Quận/Huyện</Label>
            <Input
              id="vendor-district"
              name="district"
              type="text"
              placeholder="Quận/Huyện"
              value={formData.district}
              onChange={handleInputChange}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="vendor-commune">Phường/Xã</Label>
            <Input
              id="vendor-commune"
              name="commune"
              type="text"
              placeholder="Phường/Xã"
              value={formData.commune}
              onChange={handleInputChange}
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Certifications Section */}
        <div className="space-y-4 border-t pt-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold">Chứng chỉ (Tùy chọn)</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddCertification}
              disabled={isLoading}
            >
              <FileText className="h-4 w-4 mr-2" />
              Thêm chứng chỉ
            </Button>
          </div>

          {certifications.map((cert, index) => (
            <div key={index} className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Chứng chỉ {index + 1}</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveCertification(index)}
                  disabled={isLoading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`cert-name-${index}`}>Tên chứng chỉ</Label>
                  <Input
                    id={`cert-name-${index}`}
                    type="text"
                    placeholder="Nhập tên chứng chỉ"
                    value={cert.name}
                    onChange={(e) => handleCertificationChange(index, 'name', e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`cert-code-${index}`}>Mã chứng chỉ</Label>
                  <Input
                    id={`cert-code-${index}`}
                    type="text"
                    placeholder="Nhập mã chứng chỉ"
                    value={cert.code}
                    onChange={(e) => handleCertificationChange(index, 'code', e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`cert-files-${index}`}>File chứng chỉ</Label>
                <Input
                  id={`cert-files-${index}`}
                  type="file"
                  accept="image/*,.pdf"
                  multiple
                  onChange={(e) => handleCertificationFileChange(index, e.target.files)}
                  disabled={isLoading}
                />
                {cert.files.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {cert.files.map((file, fileIndex) => (
                      <div key={fileIndex} className="flex items-center gap-2 px-2 py-1 bg-gray-100 rounded text-sm">
                        <span>{file.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0"
                          onClick={() => handleRemoveCertificationFile(index, fileIndex)}
                          disabled={isLoading}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Submit Button */}
        <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={isLoading}>
          {isLoading ? (
            <>
              <Spinner className="mr-2 h-4 w-4" />
              Đang xử lý...
            </>
          ) : (
            "Đăng ký làm nhà cung cấp"
          )}
        </Button>
      </form>
    </CardContent>
  );
};

