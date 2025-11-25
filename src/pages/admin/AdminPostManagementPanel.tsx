import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Eye } from "lucide-react";
import {
  getForumPosts,
  type ForumPost,
  type GetForumPostsResponse,
} from "@/api/forum";

export const AdminPostManagementPanel: React.FC = () => {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalRecords, setTotalRecords] = useState<number>(0);

  const [searchKeyword, setSearchKeyword] = useState<string>("");

  const fetchPosts = async (page: number) => {
    try {
      setLoading(true);
      setError(null);

      const res: GetForumPostsResponse = await getForumPosts({
        page,
        pageSize,
      });

      if (!res.status || !res.data) {
        throw new Error(res.errors?.join(", ") || "Không thể tải danh sách bài viết");
      }

      let list = res.data.data || [];

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

  useEffect(() => {
    fetchPosts(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý bài viết</h1>
          <p className="text-gray-600">
            Xem và quản lý danh sách bài viết trên diễn đàn.
          </p>
        </div>

        <form
          onSubmit={handleSearch}
          className="flex items-center gap-2 w-full max-w-md"
        >
          <div className="relative flex-1">
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
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-2"
                              // TODO: sau này có thể mở dialog chi tiết / chỉnh sửa
                            >
                              <Eye size={16} />
                            </Button>
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
    </div>
  );
};


