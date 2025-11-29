import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  MessageSquare, 
  ChevronRight, 
  BookOpen,
  Users,
  TrendingUp,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Loader2,
  FolderOpen,
  Plus,
  Image as ImageIcon,
  Type
} from "lucide-react";
import { Spinner } from '@/components/ui/shadcn-io/spinner';
import { 
  getForumPosts, 
  getForumCategories,
  createForumPost,
  type ForumPost,
  type ForumPostContent,
  type ForumCategory
} from '@/api/forum';
import { PATH_NAMES } from '@/constants';
import { useAuth } from '@/contexts/AuthContext';
import { PostContentEditor, type ContentBlock } from '@/components/PostContentEditor';
import { toast } from 'sonner';

// Animation variants
const fadeInVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94] as const
    }
  }
};

const staggerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94] as const
    }
  }
};

type ForumContentBlock = ForumPost['content'] extends Array<infer U> ? U : never;

const safeParseContent = (raw: unknown): unknown => {
  if (typeof raw !== 'string') {
    return raw;
  }

  const trimmed = raw.trim();
  if (!trimmed || (trimmed[0] !== '{' && trimmed[0] !== '[')) {
    return raw;
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    return raw;
  }
};

const collectTextFromBlock = (block: unknown): string[] => {
  if (!block) {
    return [];
  }

  if (Array.isArray(block)) {
    return block.flatMap(collectTextFromBlock);
  }

  if (typeof block === 'object') {
    const typedBlock = block as ForumContentBlock;
    if (typedBlock?.type && typedBlock.type !== 'text') {
      return [];
    }

    return collectTextFromBlock(safeParseContent(typedBlock?.content));
  }

  if (typeof block === 'string') {
    return [block];
  }

  return [];
};

const extractTextPreview = (content?: ForumPost['content']): string => {
  if (!Array.isArray(content) || content.length === 0) {
    return '';
  }

  const merged = collectTextFromBlock(content)
    .map((text) => text.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join(' ');

  return merged.trim();
};

const getCoverImage = (images?: ForumPost['images']): string | null => {
  if (!Array.isArray(images) || images.length === 0) {
    return null;
  }

  const prioritizedImage = images
    .filter((img) => !!img?.imageUrl)
    .sort((a, b) => (a?.sortOrder ?? 0) - (b?.sortOrder ?? 0))[0];

  return prioritizedImage?.imageUrl ?? null;
};

const normalizeForumContent = (content?: ForumPostContent[]): ForumPostContent[] => {
  if (!Array.isArray(content)) {
    return [];
  }
  return content.sort((a, b) => a.order - b.order);
};

const renderPostPreview = (content: ForumPostContent[], maxBlocks: number = 3) => {
  const normalized = normalizeForumContent(content);
  
  // Sắp xếp lại content theo format: đoạn văn 1 → ảnh 1 → đoạn văn 2 → ảnh 2, ...
  const textBlocks = normalized.filter(item => item.type === 'text').sort((a, b) => a.order - b.order);
  const imageBlocks = normalized.filter(item => item.type === 'image').sort((a, b) => a.order - b.order);
  
  // Tạo mảng hiển thị xen kẽ: text[0], image[0], text[1], image[1], ...
  const displayOrder: Array<{ type: 'text' | 'image'; block: ForumPostContent; number: number }> = [];
  
  const maxCount = Math.max(textBlocks.length, imageBlocks.length);
  
  for (let i = 0; i < maxCount && displayOrder.length < maxBlocks; i++) {
    // Thêm đoạn văn nếu có và chưa đủ maxBlocks
    if (i < textBlocks.length && displayOrder.length < maxBlocks) {
      displayOrder.push({
        type: 'text',
        block: textBlocks[i],
        number: i + 1
      });
    }
    // Thêm ảnh nếu có và chưa đủ maxBlocks
    if (i < imageBlocks.length && displayOrder.length < maxBlocks) {
      displayOrder.push({
        type: 'image',
        block: imageBlocks[i],
        number: i + 1
      });
    }
  }
  
  return (
    <div className="space-y-3">
      {displayOrder.map((item, index) => {
        if (item.type === 'text') {
          const text = item.block.content || '';
          const preview = text.length > 150 ? text.substring(0, 150) + '...' : text;
          return (
            <div key={`text-${item.block.order}-${index}`}>
              <span className="text-xs text-gray-400 mb-1 block">Đoạn văn {item.number}</span>
              <p className="text-gray-600 text-sm leading-relaxed">
                {preview}
              </p>
            </div>
          );
        } else if (item.type === 'image') {
          return (
            <div key={`image-${item.block.order}-${index}`}>
              <span className="text-xs text-gray-400 mb-1 block">Ảnh {item.number}</span>
              <div className="rounded-lg overflow-hidden">
                <img
                  src={item.block.content}
                  alt={`Ảnh ${item.number}`}
                  className="w-full h-32 object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              </div>
            </div>
          );
        }
        return null;
      })}
      {normalized.length > displayOrder.length && (
        <p className="text-xs text-gray-400 italic">
          + {normalized.length - displayOrder.length} phần nội dung khác...
        </p>
      )}
    </div>
  );
};

export const ForumPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pageLoading, setPageLoading] = useState(true);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(12);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Create post state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [createPostForm, setCreatePostForm] = useState({
    title: '',
    tags: '',
    forumCategoryId: null as number | null,
  });
  const [createPostBlocks, setCreatePostBlocks] = useState<ContentBlock[]>([]);
  const [createPostLoading, setCreatePostLoading] = useState(false);
  const [createPostError, setCreatePostError] = useState<string | null>(null);

  // Fetch posts from API
  const fetchPosts = async (page: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getForumPosts({
        page,
        pageSize,
      });

      if (response.status && response.data) {
        setPosts(response.data.data);
        setCurrentPage(response.data.currentPage);
        setTotalPages(response.data.totalPages);
        setTotalRecords(response.data.totalRecords);
      } else {
        setError(response.errors?.[0] || 'Không thể tải danh sách bài viết');
      }
    } catch (err: any) {
      console.error('Error fetching forum posts:', err);
      setError(err?.message || 'Đã xảy ra lỗi khi tải danh sách bài viết');
    } finally {
      setLoading(false);
      setPageLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
      const res = await getForumCategories({
        page: 1,
        pageSize: 50,
      });

      if (res.status && res.data) {
        setCategories(res.data.data || []);
        if (res.data.data && res.data.data.length > 0) {
          setCreatePostForm(prev => ({
            ...prev,
            forumCategoryId: prev.forumCategoryId || res.data!.data[0].id,
          }));
        }
      }
    } catch (err: any) {
      console.error('Error fetching forum categories:', err);
    } finally {
      setCategoriesLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts(1);
    fetchCategories();
  }, []);

  // Helper function để sắp xếp blocks theo format xen kẽ và gán order
  const arrangeBlocksInAlternatingFormat = (blocks: ContentBlock[]) => {
    // Lọc và sắp xếp text và image blocks
    const textBlocks = blocks
      .filter((block) => block.type === 'text' && block.content.trim().length > 0)
      .map((block) => ({
        type: block.type as 'text',
        content: block.content.trim(),
        file: block.file,
        previewUrl: block.previewUrl,
        publicId: block.publicId,
      }));

    const imageBlocks = blocks
      .filter((block) => block.type === 'image' && (block.content || block.previewUrl))
      .map((block) => ({
        type: block.type as 'image',
        content: block.content || block.previewUrl || '',
        file: block.file,
        previewUrl: block.previewUrl,
        publicId: block.publicId,
      }));

    // Sắp xếp theo format xen kẽ: text[0], image[0], text[1], image[1], ...
    const arrangedBlocks: Array<{
      order: number;
      type: 'text' | 'image';
      content: string;
    }> = [];

    const maxCount = Math.max(textBlocks.length, imageBlocks.length);

    for (let i = 0; i < maxCount; i++) {
      // Thêm đoạn văn nếu có
      if (i < textBlocks.length) {
        arrangedBlocks.push({
          order: arrangedBlocks.length + 1,
          type: 'text',
          content: textBlocks[i].content,
        });
      }
      // Thêm ảnh nếu có
      if (i < imageBlocks.length) {
        arrangedBlocks.push({
          order: arrangedBlocks.length + 1,
          type: 'image',
          content: imageBlocks[i].content,
        });
      }
    }

    return arrangedBlocks;
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    const userId = user?.id ? Number(user.id) : null;
    
    if (!userId) {
      toast.error('Vui lòng đăng nhập để đăng bài viết');
      return;
    }

    if (!createPostForm.title.trim()) {
      setCreatePostError('Tiêu đề bài viết không được để trống.');
      return;
    }

    if (!createPostForm.forumCategoryId) {
      setCreatePostError('Vui lòng chọn danh mục cho bài viết.');
      return;
    }

    if (createPostBlocks.length === 0) {
      setCreatePostError('Vui lòng thêm ít nhất một đoạn văn hoặc ảnh.');
      return;
    }

    const hasTextContent = createPostBlocks.some(
      (block) => block.type === 'text' && block.content.trim().length > 0
    );
    if (!hasTextContent) {
      setCreatePostError('Vui lòng thêm ít nhất một đoạn văn có nội dung.');
      return;
    }

    // Sắp xếp blocks theo format xen kẽ và gán order
    const contentBlocks = arrangeBlocksInAlternatingFormat(createPostBlocks);

    const imageFiles = createPostBlocks
      .filter((block) => block.type === 'image' && block.file)
      .map((block) => block.file!);

    try {
      setCreatePostLoading(true);
      setCreatePostError(null);

      const response = await createForumPost({
        forumCategoryId: createPostForm.forumCategoryId,
        title: createPostForm.title.trim(),
        tags: createPostForm.tags.trim() || undefined,
        content: contentBlocks,
        images: imageFiles,
        userId,
      });

      if (response.status && response.data) {
        toast.success('Đăng bài viết thành công!', {
          description: 'Bài viết của bạn đã được đăng lên diễn đàn.',
        });
        setCreatePostForm({ title: '', tags: '', forumCategoryId: categories[0]?.id || null });
        setCreatePostBlocks([]);
        setShowCreateForm(false);
        fetchPosts(1);
      } else {
        const errorMsg = response.errors?.join(', ') || 'Không thể tạo bài viết mới';
        setCreatePostError(errorMsg);
        toast.error('Tạo bài viết thất bại', {
          description: errorMsg,
        });
      }
    } catch (err: any) {
      console.error('Error creating forum post:', err);
      const message = err?.message || 'Có lỗi xảy ra khi tạo bài viết. Vui lòng thử lại.';
      setCreatePostError(message);
      toast.error('Lỗi khi tạo bài viết', {
        description: message,
      });
    } finally {
      setCreatePostLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && !loading) {
      fetchPosts(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Initial page loading screen
  if (pageLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-emerald-50">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <Spinner 
              variant="circle-filled" 
              size={60} 
              className="text-green-600 mx-auto"
            />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">
            Đang tải diễn đàn
          </h2>
          <p className="text-gray-600 mb-6">
            Chuẩn bị danh sách bài viết...
          </p>
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-emerald-50 pt-20">
      {/* Hero Section */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeInVariants}
        className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white py-16 md:py-24 relative overflow-hidden"
      >
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/2 translate-y-1/2"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="flex justify-center mb-6"
          >
            <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm shadow-2xl border-2 border-white/30">
              <MessageSquare className="w-14 h-14 text-white" />
            </div>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
          >
            Diễn Đàn Nông Nghiệp
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-lg md:text-xl text-green-100 max-w-3xl mx-auto leading-relaxed mb-8"
          >
            Nơi chia sẻ kiến thức, kinh nghiệm và kết nối cộng đồng nông dân Việt Nam
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap justify-center gap-4 mb-6"
          >
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full border border-white/30">
              <Users className="w-5 h-5" />
              <span className="text-sm font-semibold">{totalRecords} Bài viết</span>
            </div>
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full border border-white/30">
              <TrendingUp className="w-5 h-5" />
              <span className="text-sm font-semibold">Cộng đồng phát triển</span>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex justify-center"
          >
            <Button
              onClick={() => {
                const createSection = document.getElementById('create-post-section');
                if (createSection) {
                  const offset = 100; // Offset để không bị che bởi header
                  const elementPosition = createSection.getBoundingClientRect().top;
                  const offsetPosition = elementPosition + window.pageYOffset - offset;
                  
                  window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                  });
                  
                  // Tự động mở form nếu chưa mở
                  setTimeout(() => {
                    if (!showCreateForm && user) {
                      setShowCreateForm(true);
                    }
                  }, 500);
                }
              }}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border-2 border-white/50 text-white px-8 py-6 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Plus className="w-5 h-5 mr-2" />
              Đăng Bài Viết Mới
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Categories Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 pb-8">
        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg shadow-md"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{error}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Loading State */}
        {loading && posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-green-600 animate-spin mb-4" />
            <span className="text-gray-600 text-lg">Đang tải bài viết...</span>
          </div>
        ) : (
          <>
            {/* Section Header */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeInVariants}
              className="mb-8"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-800">
                    Bài Viết Diễn Đàn
                  </h2>
                  <p className="text-gray-600 text-lg mt-1">
                    Khám phá các bài viết và thảo luận từ cộng đồng
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Empty State */}
            {!loading && posts.length === 0 && !error && (
              <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeInVariants}
                className="text-center py-20"
              >
                <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FolderOpen className="w-16 h-16 text-gray-400" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-700 mb-2">
                  Chưa có bài viết nào
                </h3>
                <p className="text-gray-500 text-lg">
                  Bài viết sẽ được thêm vào sớm nhất
                </p>
              </motion.div>
            )}

            {/* Posts Grid */}
            {posts.length > 0 && (
              <motion.div
                initial="hidden"
                animate="visible"
                variants={staggerVariants}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              >
                {posts.map((post) => {
                  const coverImage = getCoverImage(post.images);

                  return (
                    <motion.div
                      key={post.id}
                      variants={cardVariants}
                      whileHover={{ scale: 1.03, y: -8 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Card 
                        className="h-full border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-white/90 backdrop-blur-sm group cursor-pointer overflow-hidden relative"
                        onClick={() => navigate(`${PATH_NAMES.FORUM_DETAIL}/${post.id}`)}
                      >
                        {/* Decorative gradient background */}
                        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full -mr-20 -mt-20 opacity-50 group-hover:opacity-70 transition-opacity duration-300"></div>
                        
                        <CardHeader className="relative pb-4">
                          {coverImage && (
                            <div className="mb-4 rounded-2xl overflow-hidden bg-gray-100 aspect-[4/3]">
                              <img
                                src={coverImage}
                                alt={`Ảnh bài viết ${post.title}`}
                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                loading="lazy"
                              />
                            </div>
                          )}
                          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                            <Sparkles className="w-8 h-8 text-white" />
                          </div>
                          <CardTitle className="text-xl font-bold text-gray-800 group-hover:text-green-600 transition-colors duration-300 line-clamp-2 min-h-[3rem]">
                            {post.title}
                          </CardTitle>
                        </CardHeader>
                        
                        <CardContent className="relative">
                          {post.content && post.content.length > 0 ? (
                            <div className="mb-4 min-h-[4rem]">
                              {renderPostPreview(post.content)}
                            </div>
                          ) : (
                            <p className="text-gray-400 text-sm mb-4 italic min-h-[4rem]">
                              Chưa có nội dung
                            </p>
                          )}
                          
                          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                           
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-green-600 hover:text-green-700 hover:bg-green-50 group-hover:translate-x-1 transition-all duration-300"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`${PATH_NAMES.FORUM_DETAIL}/${post.id}`);
                              }}
                            >
                              Xem chi tiết
                              <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeInVariants}
                className="mt-12 flex flex-col items-center gap-4"
              >
                <div className="flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1 || loading}
                    className="flex items-center gap-2 border-green-300 text-green-700 hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed min-w-[100px]"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Trước
                  </Button>

                  <div className="flex items-center gap-2">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="lg"
                          onClick={() => handlePageChange(pageNum)}
                          disabled={loading}
                          className={
                            currentPage === pageNum
                              ? "bg-green-600 hover:bg-green-700 text-white min-w-[44px]"
                              : "border-green-300 text-green-700 hover:bg-green-50 min-w-[44px]"
                          }
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || loading}
                    className="flex items-center gap-2 border-green-300 text-green-700 hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed min-w-[100px]"
                  >
                    Sau
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>

                {/* Page Info */}
                {totalRecords > 0 && (
                  <div className="text-center text-gray-600 text-sm">
                    <p>
                      Trang <span className="font-semibold text-green-600">{currentPage}</span> / <span className="font-semibold">{totalPages}</span> • Tổng cộng <span className="font-semibold text-green-600">{totalRecords}</span> bài viết
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* Create Post Section - Always visible */}
      <div 
        id="create-post-section" 
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-16 scroll-mt-24"
        style={{ minHeight: '400px' }}
      >
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInVariants}
        >
          <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                      <Plus className="w-6 h-6 text-white" />
                    </div>
                    Đăng Bài Viết Mới
                  </CardTitle>
                  <p className="text-gray-600 mt-2">
                    Chia sẻ kiến thức và kinh nghiệm của bạn với cộng đồng
                  </p>
                </div>
                {!showCreateForm && (
                  <Button
                    onClick={() => {
                      setShowCreateForm(true);
                      if (!user) {
                        toast.error('Vui lòng đăng nhập để đăng bài viết');
                        return;
                      }
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Tạo bài viết
                  </Button>
                )}
              </div>
            </CardHeader>

            {showCreateForm && (
              <CardContent>
                {!user ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-4">Vui lòng đăng nhập để đăng bài viết</p>
                    <Button
                      onClick={() => navigate('/login')}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      Đăng nhập
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleCreatePost} className="space-y-6">
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
                        className="text-lg"
                      />
                    </div>

                    <div className="grid gap-2">
                      <label className="text-sm font-medium text-gray-700">
                        Danh mục <span className="text-red-500">*</span>
                      </label>
                      {categoriesLoading ? (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Đang tải danh mục...
                        </div>
                      ) : (
                        <Select
                          value={
                            createPostForm.forumCategoryId
                              ? String(createPostForm.forumCategoryId)
                              : ''
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
                      )}
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
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-600">{createPostError}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-3 pt-4">
                      <Button
                        type="submit"
                        disabled={createPostLoading}
                        className="bg-green-600 hover:bg-green-700 text-white flex-1"
                      >
                        {createPostLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Đang đăng...
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4 mr-2" />
                            Đăng bài viết
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowCreateForm(false);
                          setCreatePostForm({ title: '', tags: '', forumCategoryId: categories[0]?.id || null });
                          setCreatePostBlocks([]);
                          setCreatePostError(null);
                        }}
                        disabled={createPostLoading}
                      >
                        Hủy
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

