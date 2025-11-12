import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, X, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { createTicket, type CreateTicketRequest, type TicketImage } from '@/api/ticket';

interface CreateTicketProps {
  onSuccess?: () => void;
}

const CreateTicket = ({ onSuccess }: CreateTicketProps) => {
  const [requestType, setRequestType] = useState<'SupportRequest' | 'RefundRequest'>('SupportRequest');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<TicketImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const resetForm = () => {
    setRequestType('SupportRequest');
    setTitle('');
    setDescription('');
    setImages([]);
    setError('');
  };

  const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files);
    
    // Validate file size (max 5MB per file)
    const maxSize = 5 * 1024 * 1024;
    const validFiles = newFiles.filter(file => {
      if (file.size > maxSize) {
        setError(`File ${file.name} quá lớn! Vui lòng chọn file nhỏ hơn 5MB.`);
        return false;
      }
      if (!file.type.startsWith('image/')) {
        setError(`File ${file.name} không phải là ảnh!`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    // Limit to 5 images total
    if (images.length + validFiles.length > 5) {
      setError('Tối đa 5 ảnh được phép!');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      const uploadPromises = validFiles.map(async (file) => {
        // Upload to Cloudinary
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", "Cloudinary Test");
        formData.append("public_id", `ticket_image_${Date.now()}_${Math.random().toString(36).substring(7)}`);

        const cloudinaryResponse = await fetch(
          "https://api.cloudinary.com/v1_1/dtlkjzuhq/image/upload",
          {
            method: "POST",
            body: formData,
          }
        );

        if (!cloudinaryResponse.ok) {
          throw new Error(`Upload failed for ${file.name}`);
        }

        const cloudinaryData = await cloudinaryResponse.json();
        
        return {
          imageUrl: cloudinaryData.secure_url,
          imagePublicId: cloudinaryData.public_id
        } as TicketImage;
      });

      const uploadedImages = await Promise.all(uploadPromises);
      
      setImages((prev) => [...prev, ...uploadedImages]);
    } catch (err: any) {
      setError(err?.message || 'Có lỗi xảy ra khi upload ảnh');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    // Validation
    if (!title.trim()) {
      setError('Vui lòng nhập tiêu đề');
      return;
    }
    if (!description.trim()) {
      setError('Vui lòng nhập mô tả');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const payload: CreateTicketRequest = {
        requestType,
        title: title.trim(),
        description: description.trim(),
        images: images.length > 0 ? images : undefined,
      };

      const response = await createTicket(payload);

      if (response.status) {
        // Reset form
        resetForm();
        setIsDialogOpen(false);
        
        // Show success dialog
        setIsSuccessDialogOpen(true);
        
        // Callback
        if (onSuccess) {
          onSuccess();
        }
      } else {
        const errorMsg = response.errors?.join(", ") || response.errors?.[0] || 'Không thể tạo ticket';
        setError(errorMsg);
        setIsErrorDialogOpen(true);
      }
    } catch (err: any) {
      const errorMsg = 
        err?.response?.data?.errors?.join(", ") ||
        err?.response?.data?.errors?.[0] ||
        err?.response?.data?.message ||
        err?.message ||
        'Có lỗi xảy ra khi tạo ticket';
      setError(errorMsg);
      setIsErrorDialogOpen(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          if (!open && (isSubmitting || isUploading)) {
            return;
          }
          setIsDialogOpen(open);
          if (!open) {
            resetForm();
          }
        }}
      >
        <DialogTrigger asChild>
          <Button className="bg-green-600 hover:bg-green-700 text-white h-11 px-5">
            <Plus className="w-4 h-4 mr-2" />
            Tạo yêu cầu hỗ trợ
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Tạo yêu cầu hỗ trợ</DialogTitle>
            <DialogDescription>
              Vui lòng cung cấp thông tin chi tiết để chúng tôi hỗ trợ bạn tốt nhất.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full text-sm text-gray-700">
              <tbody>
                <tr className="border-b border-gray-200">
                  <th className="bg-gray-50 text-left font-semibold px-4 py-3 w-48">
                    Loại yêu cầu <span className="text-red-500">*</span>
                  </th>
                  <td className="px-4 py-3">
                    <Select
                      value={requestType}
                      onValueChange={(value: 'SupportRequest' | 'RefundRequest') => setRequestType(value)}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Chọn loại yêu cầu" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SupportRequest">Yêu cầu hỗ trợ</SelectItem>
                        <SelectItem value="RefundRequest">Yêu cầu hoàn tiền</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                </tr>
                <tr className="border-b border-gray-200">
                  <th className="bg-gray-50 text-left font-semibold px-4 py-3">
                    Tiêu đề <span className="text-red-500">*</span>
                  </th>
                  <td className="px-4 py-3">
                    <Input
                      placeholder="Nhập tiêu đề yêu cầu"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      disabled={isSubmitting}
                      className="h-11"
                    />
                  </td>
                </tr>
                <tr className="border-b border-gray-200 align-top">
                  <th className="bg-gray-50 text-left font-semibold px-4 py-3">
                    Mô tả <span className="text-red-500">*</span>
                  </th>
                  <td className="px-4 py-3">
                    <Textarea
                      placeholder="Nhập mô tả chi tiết về yêu cầu của bạn"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      disabled={isSubmitting}
                      rows={6}
                      className="resize-none"
                    />
                  </td>
                </tr>
                <tr>
                  <th className="bg-gray-50 text-left font-semibold px-4 py-3">
                    Hình ảnh (tối đa 5 ảnh)
                  </th>
                  <td className="px-4 py-3">
                    <div className="space-y-3">
                      {images.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {images.map((image, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={image.imageUrl}
                                alt={`Upload ${index + 1}`}
                                className="w-full h-32 object-cover rounded-lg border border-gray-200"
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveImage(index)}
                                disabled={isSubmitting || isUploading}
                                className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {images.length < 5 && (
                        <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                          <div className="flex flex-col items-center gap-2">
                            {isUploading ? (
                              <>
                                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-sm text-gray-600">Đang upload...</span>
                              </>
                            ) : (
                              <>
                                <Upload className="w-6 h-6 text-gray-400" />
                                <span className="text-sm text-gray-600">Chọn ảnh</span>
                              </>
                            )}
                          </div>
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleImageSelect}
                            disabled={isSubmitting || isUploading}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <DialogFooter className="pt-4">
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isSubmitting || isUploading}
            >
              Hủy
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || isUploading}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Đang xử lý...
                </span>
              ) : (
                'Gửi yêu cầu'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success AlertDialog */}
      <AlertDialog open={isSuccessDialogOpen} onOpenChange={setIsSuccessDialogOpen}>
        <AlertDialogContent className="sm:max-w-[400px]">
          <AlertDialogHeader>
            <div className="mx-auto mb-4 w-14 h-14 bg-green-50 rounded-full flex items-center justify-center">
              <CheckCircle className="w-7 h-7 text-green-600" />
            </div>
            <AlertDialogTitle className="text-xl font-bold text-center">
              Thành công!
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Yêu cầu hỗ trợ đã được tạo thành công. Chúng tôi sẽ phản hồi sớm nhất có thể.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => setIsSuccessDialogOpen(false)}
              className="bg-green-600 hover:bg-green-700 text-white w-full"
            >
              Đóng
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Error AlertDialog */}
      <AlertDialog open={isErrorDialogOpen} onOpenChange={setIsErrorDialogOpen}>
        <AlertDialogContent className="sm:max-w-[450px]">
          <AlertDialogHeader>
            <div className="mx-auto mb-4 w-14 h-14 bg-red-50 rounded-full flex items-center justify-center">
              <AlertCircle className="w-7 h-7 text-red-600" />
            </div>
            <AlertDialogTitle className="text-xl font-bold text-center">
              Lỗi tạo yêu cầu
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              <div className="mt-4">
                <p className="text-sm text-gray-700 whitespace-pre-line">
                  {error}
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => {
                setIsErrorDialogOpen(false);
                setError('');
              }}
              className="bg-red-600 hover:bg-red-700 text-white w-full"
            >
              Đóng
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default CreateTicket;

