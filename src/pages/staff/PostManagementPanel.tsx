import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Trash2, Pencil } from "lucide-react";
import {
  getForumPosts,
  getForumCategories,
  createForumCategory,
  deleteForumCategory,
  createForumPost,
  updateForumPost,
  deleteForumPost,
  type ForumPost,
  type GetForumPostsResponse,
  type ForumCategory,
  type ForumPostContent,
} from "@/api/forum";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { PostContentEditor, type ContentBlock } from "@/components/PostContentEditor";

export const PostManagementPanel: React.FC = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalRecords, setTotalRecords] = useState<number>(0);

  const [searchKeyword, setSearchKeyword] = useState<string>("");
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [categoryLoading, setCategoryLoading] = useState<boolean>(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
  });
  const [categoryActionLoading, setCategoryActionLoading] = useState<boolean>(false);
  const [categoryDeletingId, setCategoryDeletingId] = useState<number | null>(null);
  const [categoryActionError, setCategoryActionError] = useState<string | null>(null);
  const [alertState, setAlertState] = useState<{
    open: boolean;
    title: string;
    message: string;
    isSuccess: boolean;
  }>({
    open: false,
    title: "",
    message: "",
    isSuccess: true,
  });
  const [confirmDeleteState, setConfirmDeleteState] = useState<{
    open: boolean;
    categoryId: number | null;
  }>({
    open: false,
    categoryId: null,
  });
  const [isCreatePostDialogOpen, setIsCreatePostDialogOpen] = useState(false);
  const [createPostLoading, setCreatePostLoading] = useState(false);
  const [createPostError, setCreatePostError] = useState<string | null>(null);
  const [createPostForm, setCreatePostForm] = useState<{
    title: string;
    tags: string;
    forumCategoryId: number | null;
  }>({
    title: "",
    tags: "",
    forumCategoryId: null,
  });
  const [createPostBlocks, setCreatePostBlocks] = useState<ContentBlock[]>([]);
  const resetCreatePostForm = () => {
    setCreatePostForm({
      title: "",
      tags: "",
      forumCategoryId: selectedCategoryId ?? categories[0]?.id ?? null,
    });
    setCreatePostBlocks([]);
    setCreatePostError(null);
  };

  const convertPostContentToBlocks = (content: ForumPostContent[], existingImages?: any[]): ContentBlock[] => {
    if (!content || content.length === 0) {
      return [];
    }
    
    // Create a map of image URLs to publicIds from existing images
    const imageUrlToPublicId = new Map<string, string>();
    if (existingImages) {
      existingImages.forEach((image: any) => {
        const publicId =
          image?.imagePublicId ||
          image?.publicId ||
          image?.id?.toString() ||
          null;
        const url =
          typeof image === "string"
            ? image
            : image.imageUrl || image.url || image.image;
        if (publicId && url) {
          imageUrlToPublicId.set(url, publicId);
        }
      });
    }
    
    return content
      .sort((a, b) => a.order - b.order)
      .map((block) => {
        const publicId = block.type === 'image' ? imageUrlToPublicId.get(block.content) : undefined;
        return {
          id: `${block.type}-${block.order}-${Date.now()}`,
          type: block.type,
          content: block.content || '',
          previewUrl: block.type === 'image' ? block.content : undefined,
          publicId: publicId,
        };
      });
  };

  const resetEditPostState = () => {
    setEditingPost(null);
    setEditPostForm({
      id: null,
      title: "",
      tags: "",
      forumCategoryId: null,
    });
    setEditPostBlocks([]);
    setEditPostRemoveImageIds(new Set());
    setEditPostError(null);
  };

  const [isEditPostDialogOpen, setIsEditPostDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<ForumPost | null>(null);
  const [editPostForm, setEditPostForm] = useState<{
    id: number | null;
    title: string;
    tags: string;
    forumCategoryId: number | null;
  }>({
    id: null,
    title: "",
    tags: "",
    forumCategoryId: null,
  });
  const [editPostBlocks, setEditPostBlocks] = useState<ContentBlock[]>([]);
  const [editPostRemoveImageIds, setEditPostRemoveImageIds] = useState<Set<string>>(new Set());
  const [editPostLoading, setEditPostLoading] = useState(false);
  const [editPostError, setEditPostError] = useState<string | null>(null);
  const [postDeleteState, setPostDeleteState] = useState<{ open: boolean; post: ForumPost | null }>({
    open: false,
    post: null,
  });
  const [isDeletingPost, setIsDeletingPost] = useState(false);

  const fetchCategories = async () => {
    try {
      setCategoryLoading(true);
      const res = await getForumCategories({
        page: 1,
        pageSize: 50,
      });

      if (!res.status || !res.data) {
        throw new Error(
          res.errors?.join(", ") || "Không thể tải danh mục diễn đàn"
        );
      }

      setCategories(res.data.data || []);
    } catch (err: any) {
      console.error("Error fetching forum categories:", err);
      setError(
        err?.message || "Có lỗi xảy ra khi tải danh mục diễn đàn"
      );
    } finally {
      setCategoryLoading(false);
    }
  };

  const fetchPosts = async (
    page: number,
    categoryId: number | null = selectedCategoryId
  ) => {
    try {
      setLoading(true);
      setError(null);

      const res: GetForumPostsResponse = await getForumPosts({
        page,
        pageSize,
        forumCategoryId: categoryId ?? undefined,
      });

      if (!res.status || !res.data) {
        throw new Error(res.errors?.join(", ") || "Không thể tải danh sách bài viết");
      }

      let list = res.data.data || [];

      if (categoryId !== null && categoryId !== undefined) {
        list = list.filter((p) => p.forumCategoryId === categoryId);
      }

      if (searchKeyword.trim()) {
        const keyword = searchKeyword.trim().toLowerCase();
        list = list.filter(
          (p) =>
            p.title.toLowerCase().includes(keyword) ||
            (p.tags && p.tags.toLowerCase().includes(keyword))
        );
      }

      setPosts(list);
      setCurrentPage(res.data.currentPage);
      setTotalPages(res.data.totalPages);
      setTotalRecords(res.data.totalRecords);
    } catch (err: any) {
      console.error("Error fetching forum posts:", err);
      setError(
        err?.message || "Có lỗi xảy ra khi tải danh sách bài viết diễn đàn"
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    fetchPosts(page);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPosts(1);
  };

  const handleCategorySelect = (categoryId: number | null) => {
    if (categoryId === selectedCategoryId) return;
    setSelectedCategoryId(categoryId);
    fetchPosts(1, categoryId);
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = categoryForm.name.trim();
    const trimmedDescription = categoryForm.description.trim();

    if (!trimmedName) {
      setCategoryActionError("Vui lòng nhập tên danh mục");
      setAlertState({
        open: true,
        title: "Thiếu thông tin",
        message: "Vui lòng nhập tên danh mục trước khi tạo.",
        isSuccess: false,
      });
      return;
    }

    try {
      setCategoryActionLoading(true);
      setCategoryActionError(null);

      const res = await createForumCategory({
        name: trimmedName,
        description: trimmedDescription || undefined,
      });

      if (!res.status || !res.data) {
        throw new Error(
          res.errors?.join(", ") || "Không thể tạo danh mục diễn đàn"
        );
      }

      setCategoryForm({ name: "", description: "" });
      await fetchCategories();
      setAlertState({
        open: true,
        title: "Thành công",
        message: "Tạo danh mục mới thành công.",
        isSuccess: true,
      });
    } catch (err: any) {
      console.error("Error creating forum category:", err);
      setCategoryActionError(
        err?.message || "Có lỗi xảy ra khi tạo danh mục diễn đàn"
      );
      setAlertState({
        open: true,
        title: "Tạo danh mục thất bại",
        message: err?.message || "Không thể tạo danh mục. Vui lòng thử lại.",
        isSuccess: false,
      });
    } finally {
      setCategoryActionLoading(false);
    }
  };

  const handleDeleteCategory = async (id: number) => {
    try {
      setCategoryDeletingId(id);
      setCategoryActionError(null);
      setCategoryActionError(null);

      const res = await deleteForumCategory(id);
      if (!res.status) {
        throw new Error(
          res.errors?.join(", ") || "Không thể xóa danh mục diễn đàn"
        );
      }

      if (selectedCategoryId === id) {
        setSelectedCategoryId(null);
      }
      await fetchCategories();
      fetchPosts(1, selectedCategoryId === id ? null : selectedCategoryId);
      setAlertState({
        open: true,
        title: "Đã xóa danh mục",
        message: "Danh mục đã được xóa thành công.",
        isSuccess: true,
      });
    } catch (err: any) {
      console.error("Error deleting forum category:", err);
      setCategoryActionError(
        err?.message || "Có lỗi xảy ra khi xóa danh mục diễn đàn"
      );
      setAlertState({
        open: true,
        title: "Xóa danh mục thất bại",
        message: err?.message || "Không thể xóa danh mục. Vui lòng thử lại.",
        isSuccess: false,
      });
    } finally {
      setCategoryDeletingId(null);
      setConfirmDeleteState({ open: false, categoryId: null });
    }
  };

  const openDeleteConfirm = (id: number) => {
    setConfirmDeleteState({
      open: true,
      categoryId: id,
    });
  };

  const handleConfirmDelete = () => {
    if (confirmDeleteState.categoryId === null) return;
    handleDeleteCategory(confirmDeleteState.categoryId);
  };

  const handleOpenCreatePostDialog = () => {
    resetCreatePostForm();
    setIsCreatePostDialogOpen(true);
  };

  // Helper function để sắp xếp blocks theo format xen kẽ và gán order
  const arrangeBlocksInAlternatingFormat = (blocks: ContentBlock[]) => {
    // Lọc và sắp xếp text và image blocks
    const textBlocks = blocks
      .filter((block) => block.type === "text" && block.content.trim().length > 0)
      .map((block) => ({
        type: block.type as "text",
        content: block.content.trim(),
        file: block.file,
        previewUrl: block.previewUrl,
        publicId: block.publicId,
      }));

    const imageBlocks = blocks
      .filter((block) => block.type === "image" && (block.content || block.previewUrl))
      .map((block) => ({
        type: block.type as "image",
        content: block.content || block.previewUrl || "",
        file: block.file,
        previewUrl: block.previewUrl,
        publicId: block.publicId,
      }));

    // Sắp xếp theo format xen kẽ: text[0], image[0], text[1], image[1], ...
    const arrangedBlocks: Array<{
      order: number;
      type: "text" | "image";
      content: string;
    }> = [];

    const maxCount = Math.max(textBlocks.length, imageBlocks.length);

    for (let i = 0; i < maxCount; i++) {
      // Thêm đoạn văn nếu có
      if (i < textBlocks.length) {
        arrangedBlocks.push({
          order: arrangedBlocks.length + 1,
          type: "text",
          content: textBlocks[i].content,
        });
      }
      // Thêm ảnh nếu có
      if (i < imageBlocks.length) {
        arrangedBlocks.push({
          order: arrangedBlocks.length + 1,
          type: "image",
          content: imageBlocks[i].content,
        });
      }
    }

    return arrangedBlocks;
  };

  const handleCreatePostSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const userId = user?.id ? Number(user.id) : null;
    if (!userId) {
      setAlertState({
        open: true,
        title: "Chưa đăng nhập",
        message: "Vui lòng đăng nhập lại để tạo bài viết.",
        isSuccess: false,
      });
      return;
    }

    const categoryId =
      createPostForm.forumCategoryId ??
      selectedCategoryId ??
      categories[0]?.id ??
      null;

    if (!categoryId) {
      setCreatePostError("Vui lòng chọn danh mục cho bài viết.");
      return;
    }

    if (!createPostForm.title.trim()) {
      setCreatePostError("Tiêu đề bài viết không được để trống.");
      return;
    }

    if (createPostBlocks.length === 0) {
      setCreatePostError("Vui lòng thêm ít nhất một đoạn văn hoặc ảnh.");
      return;
    }

    const hasTextContent = createPostBlocks.some(
      (block) => block.type === "text" && block.content.trim().length > 0
    );
    if (!hasTextContent) {
      setCreatePostError("Vui lòng thêm ít nhất một đoạn văn có nội dung.");
      return;
    }

    // Sắp xếp blocks theo format xen kẽ và gán order
    const contentBlocks = arrangeBlocksInAlternatingFormat(createPostBlocks);

    const imageFiles = createPostBlocks
      .filter((block) => block.type === "image" && block.file)
      .map((block) => block.file!);

    try {
      setCreatePostLoading(true);
      setCreatePostError(null);

      const response = await createForumPost({
        forumCategoryId: categoryId,
        title: createPostForm.title.trim(),
        tags: createPostForm.tags.trim() || undefined,
        content: contentBlocks,
        images: imageFiles,
        userId,
      });

      if (!response.status || !response.data) {
        throw new Error(
          response.errors?.join(", ") || "Không thể tạo bài viết mới"
        );
      }

      setAlertState({
        open: true,
        title: "Tạo bài viết thành công",
        message: "Bài viết của bạn đã được đăng.",
        isSuccess: true,
      });
      setIsCreatePostDialogOpen(false);
      resetCreatePostForm();
      fetchPosts(1, categoryId);
    } catch (err: any) {
      console.error("Error creating forum post:", err);
      const message =
        err?.message || "Có lỗi xảy ra khi tạo bài viết. Vui lòng thử lại.";
      setCreatePostError(message);
      setAlertState({
        open: true,
        title: "Tạo bài viết thất bại",
        message,
        isSuccess: false,
      });
    } finally {
      setCreatePostLoading(false);
    }
  };

  const handleOpenEditPostDialog = (post: ForumPost) => {
    setEditingPost(post);
    setEditPostForm({
      id: post.id,
      title: post.title,
      tags: post.tags || "",
      forumCategoryId: post.forumCategoryId ?? selectedCategoryId ?? categories[0]?.id ?? null,
    });
    setEditPostBlocks(convertPostContentToBlocks(post.content || [], post.images));
    setEditPostRemoveImageIds(new Set());
    setEditPostError(null);
    setIsEditPostDialogOpen(true);
  };



  const handleUpdatePostSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editPostForm.id) {
      setEditPostError("Không xác định được bài viết cần cập nhật.");
      return;
    }

    if (!editPostForm.title.trim()) {
      setEditPostError("Tiêu đề bài viết không được để trống.");
      return;
    }

    if (editPostBlocks.length === 0) {
      setEditPostError("Vui lòng thêm ít nhất một đoạn văn hoặc ảnh.");
      return;
    }

    const hasTextContent = editPostBlocks.some(
      (block) => block.type === "text" && block.content.trim().length > 0
    );
    if (!hasTextContent) {
      setEditPostError("Vui lòng thêm ít nhất một đoạn văn có nội dung.");
      return;
    }

    // Sắp xếp blocks theo format xen kẽ và gán order
    const contentBlocks = arrangeBlocksInAlternatingFormat(editPostBlocks);

    const imageFiles = editPostBlocks
      .filter((block) => block.type === "image" && block.file)
      .map((block) => block.file!);

    try {
      setEditPostLoading(true);
      setEditPostError(null);
      const response = await updateForumPost({
        id: editPostForm.id,
        forumCategoryId: editPostForm.forumCategoryId ?? undefined,
        title: editPostForm.title.trim(),
        tags: editPostForm.tags.trim() || undefined,
        content: contentBlocks,
        addImages: imageFiles,
        removeImagePublicIds: Array.from(editPostRemoveImageIds),
      });

      if (!response.status || !response.data) {
        throw new Error(response.errors?.join(", ") || "Không thể cập nhật bài viết.");
      }

      setAlertState({
        open: true,
        title: "Cập nhật bài viết thành công",
        message: "Bài viết đã được cập nhật.",
        isSuccess: true,
      });
      setIsEditPostDialogOpen(false);
      resetEditPostState();
      fetchPosts(currentPage, selectedCategoryId);
    } catch (error: any) {
      console.error("Error updating forum post:", error);
      const message =
        error?.message ||
        error?.response?.data?.errors?.join(", ") ||
        "Có lỗi xảy ra khi cập nhật bài viết.";
      setEditPostError(message);
      setAlertState({
        open: true,
        title: "Cập nhật bài viết thất bại",
        message,
        isSuccess: false,
      });
    } finally {
      setEditPostLoading(false);
    }
  };

  const openDeletePostConfirm = (post: ForumPost) => {
    setPostDeleteState({
      open: true,
      post,
    });
  };

  const handleConfirmDeletePost = async () => {
    if (!postDeleteState.post) return;

    try {
      setIsDeletingPost(true);
      const response = await deleteForumPost(postDeleteState.post.id);

      if (!response.status) {
        throw new Error(response.errors?.join(", ") || "Không thể xóa bài viết.");
      }

      setAlertState({
        open: true,
        title: "Đã xóa bài viết",
        message: "Bài viết đã được xóa thành công.",
        isSuccess: true,
      });
      setPostDeleteState({ open: false, post: null });
      fetchPosts(currentPage, selectedCategoryId);
    } catch (error: any) {
      console.error("Error deleting forum post:", error);
      const message =
        error?.message ||
        error?.response?.data?.errors?.join(", ") ||
        "Có lỗi xảy ra khi xóa bài viết.";
      setAlertState({
        open: true,
        title: "Xóa bài viết thất bại",
        message,
        isSuccess: false,
      });
    } finally {
      setIsDeletingPost(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchPosts(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setCreatePostForm((prev) => ({
      ...prev,
      forumCategoryId:
        prev.forumCategoryId !== null ? prev.forumCategoryId : selectedCategoryId,
    }));
  }, [selectedCategoryId]);

  useEffect(() => {
    if (!createPostForm.forumCategoryId && categories.length > 0) {
      setCreatePostForm((prev) => ({
        ...prev,
        forumCategoryId: categories[0].id,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý bài viết</h1>
          <p className="text-gray-600">
            Xem và quản lý danh sách bài viết trên diễn đàn.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center md:justify-end w-full md:w-auto">
          <form
            onSubmit={handleSearch}
            className="flex items-center gap-2 w-full sm:w-auto"
          >
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Tìm theo tiêu đề hoặc tag..."
                className="pl-10"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
              />
            </div>
            <Button type="submit">Tìm kiếm</Button>
          </form>
          <Button onClick={handleOpenCreatePostDialog} className="bg-blue-600 hover:bg-blue-700">
            Tạo bài viết
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Tạo danh mục mới</p>
          <form
            onSubmit={handleCreateCategory}
            className="flex flex-col gap-2 md:flex-row"
          >
            <Input
              placeholder="Tên danh mục"
              value={categoryForm.name}
              onChange={(e) =>
                setCategoryForm((prev) => ({ ...prev, name: e.target.value }))
              }
            />
            <Input
              placeholder="Mô tả"
              value={categoryForm.description}
              onChange={(e) =>
                setCategoryForm((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
            />
            <Button type="submit" disabled={categoryActionLoading}>
              {categoryActionLoading ? "Đang tạo..." : "Thêm danh mục"}
            </Button>
          </form>
          {categoryActionError && (
            <p className="text-sm text-red-600">{categoryActionError}</p>
          )}
          {/* thông báo hiển thị qua alert dialog */}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700">Danh mục diễn đàn</p>
            {selectedCategoryId !== null && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCategorySelect(null)}
              >
                Xóa lọc
              </Button>
            )}
          </div>
          {categoryLoading ? (
            <div className="flex items-center text-sm text-gray-500">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2" />
              Đang tải danh mục...
            </div>
          ) : categories.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategoryId === null ? "default" : "outline"}
                size="sm"
                onClick={() => handleCategorySelect(null)}
              >
                Tất cả
              </Button>
              {categories.map((category) => (
                <div className="flex items-center gap-1" key={category.id}>
                  <Button
                    variant={
                      selectedCategoryId === category.id ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => handleCategorySelect(category.id)}
                    className="text-sm"
                  >
                    {category.name}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => openDeleteConfirm(category.id)}
                    disabled={categoryDeletingId === category.id}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">Không tìm thấy danh mục nào.</p>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
          <Button
            onClick={() => fetchPosts(1)}
            className="mt-2 bg-red-600 hover:bg-red-700"
            size="sm"
          >
            Thử lại
          </Button>
        </div>
      )}

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Danh sách bài viết
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="ml-2 text-gray-600">Đang tải...</span>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-600">
                        Tiêu đề
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">
                        Tags
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">
                        Trạng thái
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">
                        Lượt xem / Like / Dislike
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">
                        Ngày tạo
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {posts.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="py-6 px-4 text-center text-gray-500"
                        >
                          Không có bài viết nào.
                        </td>
                      </tr>
                    ) : (
                      posts.map((post) => (
                        <tr
                          key={post.id}
                          className="border-b border-gray-100 hover:bg-gray-50"
                        >
                          <td className="py-4 px-4">
                            <div className="space-y-1">
                              <p className="font-medium text-gray-900 line-clamp-2">
                                {post.title}
                              </p>
                              <p className="text-xs text-gray-500">
                                ID: {post.id} • Tác giả #{post.userId}
                              </p>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-gray-600">
                            {post.tags ? (
                              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                                {post.tags}
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs">
                                Không có
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            <Badge
                              className={`border-0 ${
                                post.status === "Published" ||
                                post.status === "published"
                                  ? "bg-green-100 text-green-800"
                                  : post.status === "Draft" ||
                                    post.status === "draft"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {post.status}
                            </Badge>
                          </td>
                          <td className="py-4 px-4 text-gray-600 text-sm">
                            <div className="space-y-1">
                              <p>Lượt xem: {post.viewCount}</p>
                              <p>
                                Like: {post.likeCount} • Dislike:{" "}
                                {post.dislikeCount}
                              </p>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-gray-600 text-sm">
                            {new Date(post.createdAt).toLocaleString("vi-VN")}
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="p-2"
                                onClick={() => handleOpenEditPostDialog(post)}
                              >
                                <Pencil size={16} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="p-2 text-red-600 hover:text-red-700"
                                onClick={() => openDeletePostConfirm(post)}
                              >
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Hiển thị {posts.length} / {totalRecords} bài viết
                </p>
                {totalPages > 1 && (
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Trước
                    </Button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
                        <Button
                          key={page}
                          variant={
                            currentPage === page ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() => handlePageChange(page)}
                          className={
                            currentPage === page
                              ? "bg-blue-600 hover:bg-blue-700"
                              : ""
                          }
                        >
                          {page}
                        </Button>
                      )
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Sau
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
      <Dialog
        open={isCreatePostDialogOpen}
        onOpenChange={(open) => {
          setIsCreatePostDialogOpen(open);
          if (!open) {
            resetCreatePostForm();
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Tạo bài viết mới</DialogTitle>
            <DialogDescription>
              Nhập thông tin bài viết và chọn danh mục phù hợp để đăng.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-2 -mr-2">
            <form onSubmit={handleCreatePostSubmit} className="space-y-4" id="create-post-form">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-gray-700">
                Tiêu đề <span className="text-red-500">*</span>
              </label>
              <Input
                value={createPostForm.title}
                onChange={(e) =>
                  setCreatePostForm((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="Nhập tiêu đề bài viết"
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-gray-700">
                Danh mục <span className="text-red-500">*</span>
              </label>
              <Select
                value={
                  createPostForm.forumCategoryId
                    ? String(createPostForm.forumCategoryId)
                    : ""
                }
                onValueChange={(value) =>
                  setCreatePostForm((prev) => ({
                    ...prev,
                    forumCategoryId: Number(value),
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn danh mục" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={String(category.id)}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-gray-700">
                Tags (phân tách bằng dấu phẩy)
              </label>
              <Input
                value={createPostForm.tags}
                onChange={(e) =>
                  setCreatePostForm((prev) => ({ ...prev, tags: e.target.value }))
                }
                placeholder="Ví dụ: hữu cơ, kỹ thuật, IPM"
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-gray-700">
                Nội dung bài viết <span className="text-red-500">*</span>
              </label>
              <PostContentEditor
                blocks={createPostBlocks}
                onChange={setCreatePostBlocks}
              />
            </div>

              {createPostError && (
                <p className="text-sm text-red-600">{createPostError}</p>
              )}
            </form>
          </div>
          <DialogFooter className="flex-shrink-0 border-t pt-4 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsCreatePostDialogOpen(false);
                resetCreatePostForm();
              }}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              form="create-post-form"
              disabled={createPostLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {createPostLoading ? "Đang tạo..." : "Đăng bài"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isEditPostDialogOpen}
        onOpenChange={(open) => {
          setIsEditPostDialogOpen(open);
          if (!open) {
            resetEditPostState();
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Chỉnh sửa bài viết</DialogTitle>
            <DialogDescription>
              Cập nhật tiêu đề, nội dung, tags và quản lý hình ảnh của bài viết.
            </DialogDescription>
          </DialogHeader>
          {editingPost ? (
            <>
              <div className="flex-1 overflow-y-auto pr-2 -mr-2">
                <form onSubmit={handleUpdatePostSubmit} className="space-y-4" id="edit-post-form">
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-gray-700">
                    Tiêu đề <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={editPostForm.title}
                    onChange={(e) =>
                      setEditPostForm((prev) => ({ ...prev, title: e.target.value }))
                    }
                    placeholder="Nhập tiêu đề bài viết"
                  />
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-medium text-gray-700">
                    Danh mục <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={
                      editPostForm.forumCategoryId
                        ? String(editPostForm.forumCategoryId)
                        : ""
                    }
                    onValueChange={(value) =>
                      setEditPostForm((prev) => ({
                        ...prev,
                        forumCategoryId: Number(value),
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn danh mục" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={String(category.id)}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-medium text-gray-700">Tags</label>
                  <Input
                    value={editPostForm.tags}
                    onChange={(e) =>
                      setEditPostForm((prev) => ({ ...prev, tags: e.target.value }))
                    }
                    placeholder="Ví dụ: kỹ thuật, cà chua"
                  />
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-medium text-gray-700">
                    Nội dung bài viết
                  </label>
                  <PostContentEditor
                    blocks={editPostBlocks}
                    onChange={setEditPostBlocks}
                    existingImages={editingPost.images}
                    removedImageIds={editPostRemoveImageIds}
                    onRemoveImage={(publicId) => {
                      setEditPostRemoveImageIds((prev) => {
                        const next = new Set(prev);
                        next.add(publicId);
                        return next;
                      });
                    }}
                  />
                </div>

                  {editPostError && (
                    <p className="text-sm text-red-600">{editPostError}</p>
                  )}
                </form>
              </div>
              <DialogFooter className="flex-shrink-0 border-t pt-4 mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditPostDialogOpen(false);
                    resetEditPostState();
                  }}
                  disabled={editPostLoading}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  form="edit-post-form"
                  disabled={editPostLoading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {editPostLoading ? "Đang lưu..." : "Cập nhật"}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <div className="flex-1 overflow-y-auto">
              <div className="py-8 text-center text-gray-500">
                Không tìm thấy dữ liệu bài viết.
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={alertState.open}
        onOpenChange={(open) =>
          setAlertState((prev) => ({
            ...prev,
            open,
          }))
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle
              className={
                alertState.isSuccess ? "text-green-600" : "text-red-600"
              }
            >
              {alertState.title}
            </AlertDialogTitle>
            <AlertDialogDescription>{alertState.message}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setAlertState((prev) => ({ ...prev, open: false }))}>
              Đã hiểu
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={postDeleteState.open}
        onOpenChange={(open) => {
          if (!open) {
            setPostDeleteState({ open: false, post: null });
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa bài viết?</AlertDialogTitle>
            <AlertDialogDescription>
              {postDeleteState.post
                ? `Bài viết "${postDeleteState.post.title}" sẽ bị xóa vĩnh viễn. Hành động này không thể hoàn tác.`
                : "Bạn có chắc chắn muốn xóa bài viết này?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setPostDeleteState({ open: false, post: null })}
            >
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleConfirmDeletePost}
              disabled={isDeletingPost}
            >
              {isDeletingPost ? "Đang xóa..." : "Xóa bài viết"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={confirmDeleteState.open}
        onOpenChange={(open) =>
          setConfirmDeleteState((prev) => ({
            ...prev,
            open,
          }))
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bạn có chắc chắn?</AlertDialogTitle>
            <AlertDialogDescription>
              Sau khi xóa, danh mục sẽ không thể khôi phục.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() =>
                setConfirmDeleteState({ open: false, categoryId: null })
              }
            >
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleConfirmDelete}
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};


