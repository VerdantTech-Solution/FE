import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { 
  Plus, 
  Trash2, 
  Image as ImageIcon, 
  Type, 
  ChevronUp, 
  ChevronDown,
  GripVertical
} from "lucide-react";
import type { ForumPostContent } from "@/api/forum";

export interface ContentBlock {
  id: string;
  type: 'text' | 'image';
  content: string;
  file?: File;
  previewUrl?: string;
  publicId?: string; // For existing images from server
}

interface PostContentEditorProps {
  blocks: ContentBlock[];
  onChange: (blocks: ContentBlock[]) => void;
  existingImages?: any[];
  onRemoveImage?: (publicId: string) => void;
  removedImageIds?: Set<string>;
}

export const PostContentEditor: React.FC<PostContentEditorProps> = ({
  blocks,
  onChange,
  existingImages = [],
  onRemoveImage,
  removedImageIds = new Set(),
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addTextBlock = () => {
    const newBlock: ContentBlock = {
      id: `text-${Date.now()}`,
      type: 'text',
      content: '',
    };
    onChange([...blocks, newBlock]);
  };

  const addImageBlock = () => {
    fileInputRef.current?.click();
  };

  const handleImageFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        const previewUrl = URL.createObjectURL(file);
        const newBlock: ContentBlock = {
          id: `image-${Date.now()}-${Math.random()}`,
          type: 'image',
          content: '',
          file,
          previewUrl,
        };
        onChange([...blocks, newBlock]);
      }
    });

    // Reset input để có thể chọn cùng file lại
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const updateBlockContent = (id: string, content: string) => {
    onChange(
      blocks.map((block) =>
        block.id === id ? { ...block, content } : block
      )
    );
  };

  const removeBlock = (id: string) => {
    const block = blocks.find((b) => b.id === id);
    if (block?.previewUrl && block?.file) {
      // Only revoke if it's a blob URL (from file upload)
      URL.revokeObjectURL(block.previewUrl);
    }
    // If it's an existing image with publicId, notify parent to mark it for removal
    if (block?.publicId && onRemoveImage) {
      onRemoveImage(block.publicId);
    }
    onChange(blocks.filter((block) => block.id !== id));
  };

  const moveBlock = (id: string, direction: 'up' | 'down') => {
    const index = blocks.findIndex((b) => b.id === id);
    if (index === -1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= blocks.length) return;

    const newBlocks = [...blocks];
    [newBlocks[index], newBlocks[newIndex]] = [newBlocks[newIndex], newBlocks[index]];
    onChange(newBlocks);
  };

  const handleExistingImageClick = (image: any) => {
    const publicId =
      image?.imagePublicId ||
      image?.publicId ||
      image?.id?.toString() ||
      null;
    
    if (!publicId) return;

    const preview =
      typeof image === "string"
        ? image
        : image.imageUrl || image.url || image.image;

    const newBlock: ContentBlock = {
      id: `existing-image-${publicId}`,
      type: 'image',
      content: preview || '',
      previewUrl: preview,
      publicId: publicId,
    };
    onChange([...blocks, newBlock]);
  };

  const buildContentBlocks = (): ForumPostContent[] => {
    return blocks
      .map((block, index) => ({
        order: index + 1,
        type: block.type,
        content: block.type === 'text' 
          ? block.content.trim() 
          : block.content || '',
      }))
      .filter((block) => {
        if (block.type === 'text') {
          return block.content.length > 0;
        }
        return block.content.length > 0;
      });
  };

  const getImageFiles = (): File[] => {
    return blocks
      .filter((block) => block.type === 'image' && block.file)
      .map((block) => block.file!);
  };

  // Expose methods via ref if needed
  React.useImperativeHandle(
    React.forwardRef(() => null),
    () => ({
      buildContentBlocks,
      getImageFiles,
    })
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addTextBlock}
          className="flex items-center gap-2"
        >
          <Type size={16} />
          Thêm đoạn văn
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addImageBlock}
          className="flex items-center gap-2"
        >
          <ImageIcon size={16} />
          Thêm ảnh
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleImageFileSelect}
        />
      </div>

      {existingImages && existingImages.length > 0 && (
        <div className="border rounded-lg p-4 bg-gray-50">
          <p className="text-sm font-medium text-gray-700 mb-2">
            Ảnh hiện có (click để thêm vào bài viết)
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {existingImages.map((image: any, index: number) => {
              const preview =
                typeof image === "string"
                  ? image
                  : image.imageUrl || image.url || image.image;
              const publicId =
                image?.imagePublicId ||
                image?.publicId ||
                image?.id?.toString() ||
                null;
              const isRemoved = publicId ? removedImageIds?.has(publicId) : false;

              if (isRemoved || !preview) return null;

              return (
                <div
                  key={publicId || index}
                  className="relative group cursor-pointer"
                  onClick={() => handleExistingImageClick(image)}
                >
                  <img
                    src={preview}
                    alt={`Ảnh ${index + 1}`}
                    className="w-full h-20 object-cover rounded-md border-2 border-transparent group-hover:border-blue-500 transition-colors"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-md transition-all flex items-center justify-center">
                    <Plus className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={20} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-3">
        {blocks.length === 0 ? (
          <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
            <p className="text-sm">Chưa có nội dung. Hãy thêm đoạn văn hoặc ảnh để bắt đầu.</p>
          </div>
        ) : (
          blocks.map((block, index) => (
            <div
              key={block.id}
              className="border rounded-lg p-4 bg-white hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-3">
                <div className="flex flex-col gap-1 pt-1">
                  <GripVertical className="text-gray-400" size={16} />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => moveBlock(block.id, 'up')}
                    disabled={index === 0}
                  >
                    <ChevronUp size={14} />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => moveBlock(block.id, 'down')}
                    disabled={index === blocks.length - 1}
                  >
                    <ChevronDown size={14} />
                  </Button>
                </div>

                <div className="flex-1">
                  {block.type === 'text' ? (() => {
                    // Đếm số text blocks trước block hiện tại (bao gồm cả block hiện tại)
                    const textBlockNumber = blocks.slice(0, index + 1).filter(b => b.type === 'text').length;
                    return (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Type size={16} className="text-gray-500" />
                          <span className="text-xs text-gray-500">Đoạn văn {textBlockNumber}</span>
                        </div>
                        <Textarea
                          value={block.content}
                          onChange={(e) => updateBlockContent(block.id, e.target.value)}
                          placeholder="Nhập nội dung đoạn văn..."
                          rows={4}
                          className="resize-none"
                        />
                      </div>
                    );
                  })() : (() => {
                    // Đếm số image blocks trước block hiện tại (bao gồm cả block hiện tại)
                    const imageBlockNumber = blocks.slice(0, index + 1).filter(b => b.type === 'image').length;
                    return (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <ImageIcon size={16} className="text-gray-500" />
                          <span className="text-xs text-gray-500">Ảnh {imageBlockNumber}</span>
                        </div>
                        {block.previewUrl ? (
                          <div className="relative">
                            <img
                              src={block.previewUrl}
                              alt={`Ảnh ${imageBlockNumber}`}
                              className="w-full max-h-64 object-contain rounded-md border"
                            />
                            {block.file && (
                              <div className="mt-2 text-xs text-gray-500">
                                File: {block.file.name} ({(block.file.size / 1024).toFixed(2)} KB)
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="border-2 border-dashed rounded-md p-8 text-center text-gray-400">
                            <ImageIcon size={32} className="mx-auto mb-2" />
                            <p className="text-sm">Không có ảnh</p>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => removeBlock(block.id)}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {blocks.length > 0 && (
        <div className="text-xs text-gray-500 pt-2 border-t">
          Tổng: {blocks.filter((b) => b.type === 'text').length} đoạn văn,{' '}
          {blocks.filter((b) => b.type === 'image').length} ảnh
        </div>
      )}
    </div>
  );
};

