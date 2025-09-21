import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { User, Upload, X, Camera } from "lucide-react";
import { updateUser } from "@/api/user";
import { toast } from "sonner";

interface AvatarUploadProps {
  currentAvatarUrl?: string | null;
  onAvatarChange: (avatarUrl: string | null) => void;
  userId: string;
}

export const AvatarUpload: React.FC<AvatarUploadProps> = ({
  currentAvatarUrl,
  onAvatarChange,
  userId
}) => {
  const [imageUrl, setImageUrl] = useState(currentAvatarUrl || "");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Cập nhật imageUrl khi currentAvatarUrl thay đổi
  useEffect(() => {
    setImageUrl(currentAvatarUrl || "");
  }, [currentAvatarUrl]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Kiểm tra loại file
    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file ảnh!');
      return;
    }

    // Kiểm tra kích thước file (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File quá lớn! Vui lòng chọn file nhỏ hơn 5MB.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Bước 1: Upload ảnh lên Cloudinary
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "Cloudinary Test");
      formData.append("public_id", `user_avatar_${userId}_${Date.now()}`);

      console.log('Uploading to Cloudinary...');
      const cloudinaryResponse = await fetch(
        "https://api.cloudinary.com/v1_1/dtlkjzuhq/image/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!cloudinaryResponse.ok) {
        throw new Error(`Cloudinary upload failed: ${cloudinaryResponse.status}`);
      }

      const cloudinaryData = await cloudinaryResponse.json();
      console.log('Cloudinary upload success:', cloudinaryData);
      
      const newAvatarUrl = cloudinaryData.secure_url;
      setImageUrl(newAvatarUrl);
      setUploadProgress(100);

      // Bước 2: Cập nhật database với avatarUrl mới
      console.log('Updating database with new avatar URL:', newAvatarUrl);
      const dbResponse = await updateUser(userId, {
        avatarUrl: newAvatarUrl
      });

      console.log('Database update success:', dbResponse);
      
      // Bước 3: Cập nhật UI và thông báo thành công
      console.log('AvatarUpload - Calling onAvatarChange with:', newAvatarUrl);
      onAvatarChange(newAvatarUrl);
      toast.success('Avatar đã được cập nhật thành công!');
      
      // Reset progress sau 1 giây
      setTimeout(() => setUploadProgress(0), 1000);

    } catch (error) {
      console.error('Upload/Update error:', error);
      
      if (error instanceof Error && error.message.includes('Cloudinary')) {
        toast.error('Upload ảnh lên Cloudinary thất bại! Vui lòng thử lại.');
      } else {
        toast.error('Cập nhật database thất bại! Vui lòng thử lại.');
      }
      
      // Reset về trạng thái cũ nếu có lỗi
      setImageUrl(currentAvatarUrl || "");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      console.log('Removing avatar from database...');
      
      // Cập nhật database để xóa avatarUrl
      const response = await updateUser(userId, {
        avatarUrl: null
      });
      
      console.log('Avatar removal from database success:', response);
      
      // Cập nhật UI
      setImageUrl("");
      console.log('AvatarUpload - Calling onAvatarChange with null (removing avatar)');
      onAvatarChange(null);
      toast.success('Avatar đã được xóa thành công!');
      
    } catch (error) {
      console.error('Avatar removal error:', error);
      toast.error('Không thể xóa avatar. Vui lòng thử lại.');
    }
  };

  const handleFileInputClick = () => {
    const fileInput = document.getElementById('avatar-file-input');
    if (fileInput) {
      fileInput.click();
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Avatar Display */}
      <div className="relative group">
        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt="User Avatar"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
              <User className="w-16 h-16 text-white" />
            </div>
          )}
        </div>

        {/* Upload Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
          <Button
            onClick={handleFileInputClick}
            variant="secondary"
            size="sm"
            className="rounded-full"
            disabled={isUploading}
          >
            <Camera className="w-4 h-4" />
          </Button>
        </div>

        {/* Remove Button */}
        {imageUrl && (
          <Button
            onClick={handleRemoveAvatar}
            variant="destructive"
            size="sm"
            className="absolute -top-2 -right-2 rounded-full w-8 h-8 p-0"
            disabled={isUploading}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Upload Progress */}
      {isUploading && (
        <div className="w-full max-w-xs">
          <div className="flex items-center space-x-2 mb-2">
            <Upload className="w-4 h-4 animate-bounce text-blue-600" />
            <span className="text-sm text-blue-600">Đang upload và cập nhật...</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Upload Button */}
      <div className="flex flex-col items-center space-y-2">
        <Button
          onClick={handleFileInputClick}
          variant="outline"
          disabled={isUploading}
          className="flex items-center space-x-2"
        >
          <Upload className="w-4 h-4" />
          <span>{imageUrl ? 'Thay đổi ảnh' : 'Tải ảnh lên'}</span>
        </Button>
        
        <p className="text-xs text-gray-500 text-center">
          Hỗ trợ: JPG, PNG, GIF<br />
          Kích thước tối đa: 5MB
        </p>
      </div>

      {/* Hidden File Input */}
      <input
        id="avatar-file-input"
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />
    </div>
  );
};
