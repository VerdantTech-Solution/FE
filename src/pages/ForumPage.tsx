import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { getForumPosts, getForumCategories, type ForumPost } from "@/api/forum";
import { PATH_NAMES } from "@/constants";

// Animation variants
const fadeInVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  },
};

const staggerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  },
};

const getCoverImage = (images?: ForumPost["images"]): string | null => {
  if (!Array.isArray(images) || images.length === 0) {
    return null;
  }

  const prioritizedImage = images
    .filter((img) => !!img?.imageUrl)
    .sort((a, b) => (a?.sortOrder ?? 0) - (b?.sortOrder ?? 0))[0];

  return prioritizedImage?.imageUrl ?? null;
};

export const ForumPage = () => {
  const navigate = useNavigate();
  const [pageLoading, setPageLoading] = useState(true);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(12);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        setError(response.errors?.[0] || "Không thể tải danh sách bài viết");
      }
    } catch (err: any) {
      console.error("Error fetching forum posts:", err);
      setError(err?.message || "Đã xảy ra lỗi khi tải danh sách bài viết");
    } finally {
      setLoading(false);
      setPageLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      await getForumCategories({
        page: 1,
        pageSize: 50,
      });
    } catch (err: any) {
      console.error("Error fetching forum categories:", err);
    }
  };

  useEffect(() => {
    fetchPosts(1);
    fetchCategories();
  }, []);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && !loading) {
      fetchPosts(newPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
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
          <p className="text-gray-600 mb-6">Chuẩn bị danh sách bài viết...</p>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-emerald-50">
      {/* Hero Section */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeInVariants}
        className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white pt-36 pb-16 md:pt-44 md:pb-24 relative overflow-hidden"
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
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 px-4"
          >
            Diễn Đàn Nông Nghiệp
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-base sm:text-lg md:text-xl text-green-100 max-w-3xl mx-auto leading-relaxed mb-6 sm:mb-8 px-4"
          >
            Nơi chia sẻ kiến thức, kinh nghiệm và kết nối cộng đồng nông dân
            Việt Nam
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap justify-center gap-4 mb-6"
          >
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full border border-white/30">
              <Users className="w-5 h-5" />
              <span className="text-sm font-semibold">
                {totalRecords} Bài viết
              </span>
            </div>
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full border border-white/30">
              <TrendingUp className="w-5 h-5" />
              <span className="text-sm font-semibold">
                Cộng đồng phát triển
              </span>
            </div>
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
                <svg
                  className="h-5 w-5 text-red-500"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
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
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800">
                    Bài Viết Diễn Đàn
                  </h2>
                  <p className="text-gray-600 text-base sm:text-lg mt-1">
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
                        onClick={() =>
                          navigate(`${PATH_NAMES.FORUM_DETAIL}/${post.id}`)
                        }
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
                          <div className="mb-4 min-h-[4rem] flex items-center">
                            <p className="text-gray-400 text-sm italic">
                              Nội dung sẽ hiển thị khi xem chi tiết.
                            </p>
                          </div>

                          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-green-600 hover:text-green-700 hover:bg-green-50 group-hover:translate-x-1 transition-all duration-300"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(
                                  `${PATH_NAMES.FORUM_DETAIL}/${post.id}`
                                );
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
                          variant={
                            currentPage === pageNum ? "default" : "outline"
                          }
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
                      Trang{" "}
                      <span className="font-semibold text-green-600">
                        {currentPage}
                      </span>{" "}
                      / <span className="font-semibold">{totalPages}</span> •
                      Tổng cộng{" "}
                      <span className="font-semibold text-green-600">
                        {totalRecords}
                      </span>{" "}
                      bài viết
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* Create Post Section removed as requested */}
    </div>
  );
};
