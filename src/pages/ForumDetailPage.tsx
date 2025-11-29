import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Eye,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Calendar,
  Tag,
  Pin,
  Loader2,
  AlertCircle
} from "lucide-react";
import { Spinner } from '@/components/ui/shadcn-io/spinner';
import { Textarea } from '@/components/ui/textarea';
import { 
  getForumPostById, 
  incrementForumPostView,
  incrementForumPostLike,
  incrementForumPostDislike,
  getForumCommentsByPostId,
  createForumComment,
  updateForumComment,
  deleteForumComment,
  type ForumPost, 
  type ForumPostContent,
  type ForumComment
} from '@/api/forum';
import { PATH_NAMES } from '@/constants';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

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

type RawContentBlock = ForumPostContent | (Partial<ForumPostContent> & { content?: unknown });

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

const extractImageUrl = (image: unknown): string | null => {
  if (!image) {
    return null;
  }

  if (typeof image === 'string') {
    return image.trim() || null;
  }

  if (typeof image === 'object') {
    const record = image as Record<string, unknown>;
    const urlCandidate = record.imageUrl || record.url || record.image || record.content;
    if (typeof urlCandidate === 'string') {
      return urlCandidate.trim() || null;
    }
  }

  return null;
};

const normalizeForumContent = (content?: ForumPostContent[]): ForumPostContent[] => {
  if (!Array.isArray(content)) {
    return [];
  }

  const normalized: ForumPostContent[] = [];

  const pushBlock = (type: 'text' | 'image', value: unknown, order?: number) => {
    if (type === 'image') {
      const url = extractImageUrl(value);
      if (!url) {
        return;
      }
      normalized.push({
        order: Number.isFinite(order) ? (order as number) : normalized.length,
        type: 'image',
        content: url,
      });
      return;
    }

    if (typeof value !== 'string') {
      if (value === null || value === undefined) {
        return;
      }
    }

    const text = typeof value === 'string' ? value : String(value ?? '');
    const cleaned = text.trim();
    if (!cleaned) {
      return;
    }

    normalized.push({
      order: Number.isFinite(order) ? (order as number) : normalized.length,
      type: 'text',
      content: cleaned,
    });
  };

  const processEntry = (entry: unknown, orderHint?: number) => {
    if (entry === null || entry === undefined) {
      return;
    }

    if (Array.isArray(entry)) {
      entry.forEach((child, index) => processEntry(child, (orderHint ?? 0) + index * 0.01));
      return;
    }

    if (typeof entry === 'string') {
      pushBlock('text', entry, orderHint);
      return;
    }

    if (typeof entry === 'object') {
      const block = entry as RawContentBlock;
      const type = block.type === 'image' ? 'image' : 'text';

      if (type === 'image') {
        pushBlock('image', block.content, block.order ?? orderHint);
        return;
      }

      const parsed = safeParseContent(block.content);
      if (Array.isArray(parsed) || (typeof parsed === 'object' && parsed !== null)) {
        processEntry(parsed, block.order ?? orderHint);
        return;
      }

      pushBlock('text', parsed, block.order ?? orderHint);
      return;
    }

    pushBlock('text', entry, orderHint);
  };

  content.forEach((item, index) => processEntry(item, item?.order ?? index));

  return normalized.sort((a, b) => a.order - b.order);
};

export const ForumDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentUserId = user ? Number(user.id) : null;
  const [post, setPost] = useState<ForumPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liking, setLiking] = useState(false);
  const [disliking, setDisliking] = useState(false);
  
  // Comments state
  const [comments, setComments] = useState<ForumComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentContent, setCommentContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState<Record<number, string>>({});
  const [submittingComment, setSubmittingComment] = useState(false);
  const [submittingReply, setSubmittingReply] = useState<Record<number, boolean>>({});
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ForumComment | null>(null);
  const [deletingComment, setDeletingComment] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const normalizedContent = useMemo(() => normalizeForumContent(post?.content), [post?.content]);

  // Fetch post
  useEffect(() => {
    const fetchPost = async () => {
      if (!id) {
        setError('Post ID not found');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await getForumPostById(parseInt(id));
        
        if (response.status && response.data) {
          setPost(response.data);
          // Tăng view count khi load bài viết
          incrementForumPostView(parseInt(id)).catch(err => {
            console.error('Error incrementing view:', err);
          });
        } else {
          setError(response.errors?.[0] || 'Không thể tải chi tiết bài viết');
        }
      } catch (err: any) {
        console.error('Error fetching forum post:', err);
        setError(err?.message || 'Đã xảy ra lỗi khi tải chi tiết bài viết');
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id]);

  const loadComments = useCallback(async () => {
    if (!id) return;

    try {
      setCommentsLoading(true);
      const response = await getForumCommentsByPostId(parseInt(id), {
        page: 1,
        pageSize: 50,
      });

      if (response.status && response.data) {
        setComments(response.data.data);
      } else {
        console.error('Error fetching comments:', response.errors);
      }
    } catch (err: any) {
      console.error('Error fetching comments:', err);
    } finally {
      setCommentsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (post) {
      loadComments();
    }
  }, [post, loadComments]);

  const handleLike = async () => {
    if (!id || !post || liking) return;

    try {
      setLiking(true);
      const response = await incrementForumPostLike(parseInt(id));
      
      if (response.status && post) {
        // Cập nhật like count trong state
        setPost({
          ...post,
          likeCount: post.likeCount + 1,
        });
      } else {
        console.error('Error liking post:', response.errors);
      }
    } catch (err: any) {
      console.error('Error liking post:', err);
    } finally {
      setLiking(false);
    }
  };

  const handleDislike = async () => {
    if (!id || !post || disliking) return;

    try {
      setDisliking(true);
      const response = await incrementForumPostDislike(parseInt(id));
      
      if (response.status && post) {
        // Cập nhật dislike count trong state
        setPost({
          ...post,
          dislikeCount: post.dislikeCount + 1,
        });
      } else {
        console.error('Error disliking post:', response.errors);
      }
    } catch (err: any) {
      console.error('Error disliking post:', err);
    } finally {
      setDisliking(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!id || !currentUserId || !commentContent.trim() || submittingComment) return;

    try {
      setSubmittingComment(true);
      const response = await createForumComment({
        forumPostId: parseInt(id),
        userId: currentUserId,
        // Không gửi parentId cho top-level comment
        content: commentContent.trim(),
      });

      if (response.status && response.data) {
        await loadComments();
        setCommentContent('');
        toast.success('Bình luận đã được đăng thành công!', {
          description: 'Bình luận của bạn đã được thêm vào bài viết.',
          duration: 3000,
        });
      } else {
        const errorMsg = response.errors?.[0] || 'Không thể tạo bình luận';
        console.error('Error creating comment:', response.errors);
        setErrorMessage(errorMsg);
        setShowErrorDialog(true);
        toast.error('Không thể tạo bình luận', {
          description: errorMsg,
          duration: 4000,
        });
      }
    } catch (err: any) {
      console.error('Error creating comment:', err);
      const errorMsg = err?.message || 'Đã xảy ra lỗi khi tạo bình luận';
      setErrorMessage(errorMsg);
      setShowErrorDialog(true);
      toast.error('Lỗi khi tạo bình luận', {
        description: errorMsg,
        duration: 4000,
      });
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleSubmitReply = async (parentCommentId: number) => {
    if (!id || !currentUserId || !replyContent[parentCommentId]?.trim() || submittingReply[parentCommentId]) return;

    try {
      setSubmittingReply({ ...submittingReply, [parentCommentId]: true });
      const response = await createForumComment({
        forumPostId: parseInt(id),
        userId: currentUserId,
        parentId: parentCommentId,
        content: replyContent[parentCommentId].trim(),
      });

      if (response.status && response.data) {
        await loadComments();
        setReplyContent({ ...replyContent, [parentCommentId]: '' });
        setReplyingTo(null);
        toast.success('Phản hồi đã được đăng thành công!', {
          description: 'Phản hồi của bạn đã được thêm vào bình luận.',
          duration: 3000,
        });
      } else {
        const errorMsg = response.errors?.[0] || 'Không thể tạo phản hồi';
        console.error('Error creating reply:', response.errors);
        setErrorMessage(errorMsg);
        setShowErrorDialog(true);
        toast.error('Không thể tạo phản hồi', {
          description: errorMsg,
          duration: 4000,
        });
      }
    } catch (err: any) {
      console.error('Error creating reply:', err);
      const errorMsg = err?.message || 'Đã xảy ra lỗi khi tạo phản hồi';
      setErrorMessage(errorMsg);
      setShowErrorDialog(true);
      toast.error('Lỗi khi tạo phản hồi', {
        description: errorMsg,
        duration: 4000,
      });
    } finally {
      setSubmittingReply({ ...submittingReply, [parentCommentId]: false });
    }
  };

  const startEditComment = (comment: ForumComment) => {
    setEditingCommentId(comment.id);
    setEditingContent(comment.content);
    setReplyingTo(null);
  };

  const cancelEditComment = () => {
    setEditingCommentId(null);
    setEditingContent('');
  };

  const handleUpdateComment = async () => {
    if (!id || !currentUserId || !editingCommentId || !editingContent.trim() || submittingEdit) return;

    try {
      setSubmittingEdit(true);
      const response = await updateForumComment(editingCommentId, {
        id: editingCommentId,
        userId: currentUserId,
        content: editingContent.trim(),
      });

      if (response.status) {
        await loadComments();
        toast.success('Đã cập nhật bình luận', {
          description: 'Nội dung bình luận đã được cập nhật.',
          duration: 3000,
        });
        cancelEditComment();
      } else {
        const errorMsg = response.errors?.[0] || 'Không thể cập nhật bình luận';
        setErrorMessage(errorMsg);
        setShowErrorDialog(true);
        toast.error('Không thể cập nhật bình luận', {
          description: errorMsg,
          duration: 4000,
        });
      }
    } catch (err: any) {
      console.error('Error updating comment:', err);
      const errorMsg = err?.message || 'Đã xảy ra lỗi khi cập nhật bình luận';
      setErrorMessage(errorMsg);
      setShowErrorDialog(true);
      toast.error('Lỗi khi cập nhật bình luận', {
        description: errorMsg,
        duration: 4000,
      });
    } finally {
      setSubmittingEdit(false);
    }
  };

  const confirmDeleteComment = async () => {
    if (!deleteTarget || !currentUserId || deletingComment) return;

    try {
      setDeletingComment(true);
      const response = await deleteForumComment(deleteTarget.id);

      if (response.status) {
        await loadComments();
        toast.success('Đã xóa bình luận', {
          description: 'Bình luận và các phản hồi liên quan đã được xóa.',
          duration: 3000,
        });
        setDeleteTarget(null);
      } else {
        const errorMsg = response.errors?.[0] || 'Không thể xóa bình luận';
        setErrorMessage(errorMsg);
        setShowErrorDialog(true);
        toast.error('Không thể xóa bình luận', {
          description: errorMsg,
          duration: 4000,
        });
      }
    } catch (err: any) {
      console.error('Error deleting comment:', err);
      const errorMsg = err?.message || 'Đã xảy ra lỗi khi xóa bình luận';
      setErrorMessage(errorMsg);
      setShowErrorDialog(true);
      toast.error('Lỗi khi xóa bình luận', {
        description: errorMsg,
        duration: 4000,
      });
    } finally {
      setDeletingComment(false);
    }
  };

  const renderComment = (comment: ForumComment, depth: number = 0) => {
    const isReplying = replyingTo === comment.id;
    const isEditing = editingCommentId === comment.id;
    // Ưu tiên fullName từ API, fallback sang userName, rồi tới 'Người dùng'
    const authorName = comment.fullName || comment.userName || 'Người dùng';
    const authorInitial = authorName.charAt(0).toUpperCase();
    const isOwner = currentUserId !== null && comment.userId === currentUserId;

    return (
      <motion.div
        key={comment.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-4 bg-gray-50 rounded-lg border border-gray-200 ${depth > 0 ? 'ml-8 mt-3' : ''}`}
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
            {authorInitial}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-semibold text-gray-800">
                {authorName}
              </span>
              {comment.createdAt && (
                <span className="text-xs text-gray-500">
                  {formatDate(comment.createdAt)}
                </span>
              )}
            </div>
            {isEditing ? (
              <div className="space-y-3 mb-3">
                <Textarea
                  value={editingContent}
                  onChange={(e) => setEditingContent(e.target.value)}
                  className="min-h-[90px]"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleUpdateComment}
                    disabled={!editingContent.trim() || submittingEdit}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {submittingEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Lưu'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={cancelEditComment}>
                    Hủy
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-gray-700 mb-3 whitespace-pre-wrap">{comment.content}</p>
            )}
            
            {/* Reply button */}
            <div className="flex flex-wrap items-center gap-2 mb-1">
            {user && depth < 3 && !isEditing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReplyingTo(isReplying ? null : comment.id)}
                className="text-green-600 hover:text-green-700 hover:bg-green-50 text-xs"
              >
                <MessageCircle className="w-3 h-3 mr-1" />
                {isReplying ? 'Hủy' : 'Phản hồi'}
              </Button>
            )}
            {isOwner && !isEditing && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => startEditComment(comment)}
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-xs"
                >
                  Chỉnh sửa
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteTarget(comment)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs"
                >
                  Xóa
                </Button>
              </>
            )}
            </div>

            {/* Reply form */}
            {isReplying && user && (
              <div className="mt-3 space-y-2">
                <Textarea
                  placeholder="Viết phản hồi..."
                  value={replyContent[comment.id] || ''}
                  onChange={(e) => setReplyContent({ ...replyContent, [comment.id]: e.target.value })}
                  className="min-h-[80px]"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleSubmitReply(comment.id)}
                    disabled={!replyContent[comment.id]?.trim() || submittingReply[comment.id]}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {submittingReply[comment.id] ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Gửi'
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setReplyingTo(null);
                      setReplyContent({ ...replyContent, [comment.id]: '' });
                    }}
                  >
                    Hủy
                  </Button>
                </div>
              </div>
            )}

            {/* Nested replies */}
            {comment.replies && comment.replies.length > 0 && (
              <div className="mt-4 space-y-3">
                {comment.replies.map((reply) => renderComment(reply, depth + 1))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderContent = (content: ForumPostContent[]) => {
    // Sắp xếp lại content theo format: đoạn văn 1 → ảnh 1 → đoạn văn 2 → ảnh 2, ...
    const textBlocks = content.filter(item => item.type === 'text').sort((a, b) => a.order - b.order);
    const imageBlocks = content.filter(item => item.type === 'image').sort((a, b) => a.order - b.order);
    
    // Tạo mảng hiển thị xen kẽ: text[0], image[0], text[1], image[1], ...
    const displayOrder: Array<{ type: 'text' | 'image'; block: ForumPostContent; number: number }> = [];
    
    const maxCount = Math.max(textBlocks.length, imageBlocks.length);
    
    for (let i = 0; i < maxCount; i++) {
      // Thêm đoạn văn nếu có
      if (i < textBlocks.length) {
        displayOrder.push({
          type: 'text',
          block: textBlocks[i],
          number: i + 1
        });
      }
      // Thêm ảnh nếu có
      if (i < imageBlocks.length) {
        displayOrder.push({
          type: 'image',
          block: imageBlocks[i],
          number: i + 1
        });
      }
    }
    
    return displayOrder.map((item, index) => {
      if (item.type === 'text') {
        return (
          <motion.div
            key={`text-${item.block.order}-${index}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="mb-6"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-gray-500">Đoạn văn {item.number}</span>
            </div>
            <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-wrap">
              {item.block.content}
            </p>
          </motion.div>
        );
      } else if (item.type === 'image') {
        return (
          <motion.div
            key={`image-${item.block.order}-${index}`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="mb-6"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-gray-500">Ảnh {item.number}</span>
            </div>
            <div className="rounded-lg overflow-hidden shadow-lg">
              <img
                src={item.block.content}
                alt={`Ảnh ${item.number}`}
                className="w-full h-auto object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            </div>
          </motion.div>
        );
      }
      return null;
    });
  };

  // Loading state
  if (loading) {
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
            Đang tải bài viết
          </h2>
          <p className="text-gray-600 mb-6">
            Vui lòng đợi trong giây lát...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-emerald-50 pt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInVariants}
            className="text-center"
          >
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg shadow-md mb-6">
              <p className="font-medium">{error || 'Không tìm thấy bài viết'}</p>
            </div>
            <Button
              onClick={() => navigate(PATH_NAMES.FORUM)}
              variant="outline"
              className="border-green-300 text-green-700 hover:bg-green-50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay lại danh sách bài viết
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-emerald-50 pt-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6"
        >
          <Button
            onClick={() => navigate(PATH_NAMES.FORUM)}
            variant="ghost"
            className="text-green-600 hover:text-green-700 hover:bg-green-50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại
          </Button>
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInVariants}
        >
          <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm mb-6">
            <CardHeader className="pb-4">
              {/* Pinned Badge */}
              {post.isPinned && (
                <div className="mb-4">
                  <Badge className="bg-yellow-500 text-white hover:bg-yellow-600">
                    <Pin className="w-3 h-3 mr-1" />
                    Đã ghim
                  </Badge>
                </div>
              )}

              {/* Title */}
              <CardTitle className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                {post.title}
              </CardTitle>

              {/* Meta Information */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-green-600" />
                  <span>{formatDate(post.createdAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-green-600" />
                  <span>{post.viewCount} lượt xem</span>
                </div>
                <div className="flex items-center gap-2">
                  <ThumbsUp className="w-4 h-4 text-green-600" />
                  <span>{post.likeCount}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ThumbsDown className="w-4 h-4 text-gray-400" />
                  <span>{post.dislikeCount}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-green-600" />
                  <span>{comments.length} bình luận</span>
                </div>
              </div>

              {/* Tags */}
              {post.tags && (
                <div className="flex flex-wrap items-center gap-2 mt-4">
                  <Tag className="w-4 h-4 text-green-600" />
                  {post.tags.split(',').map((tag, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="border-green-300 text-green-700 hover:bg-green-50"
                    >
                      {tag.trim()}
                    </Badge>
                  ))}
                </div>
              )}
            </CardHeader>

            <CardContent>
              {/* Content Blocks */}
              <div className="prose prose-lg max-w-none">
                {normalizedContent.length > 0 ? (
                  renderContent(normalizedContent)
                ) : (
                  <p className="text-gray-400 italic">Chưa có nội dung</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-4 mt-8 pt-6 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={handleLike}
                  disabled={liking}
                  className="flex items-center gap-2 border-green-300 text-green-700 hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {liking ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ThumbsUp className="w-4 h-4" />
                  )}
                  Thích ({post.likeCount})
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDislike}
                  disabled={disliking}
                  className="flex items-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {disliking ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ThumbsDown className="w-4 h-4" />
                  )}
                  Không thích ({post.dislikeCount})
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const commentsSection = document.getElementById('comments-section');
                    commentsSection?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="flex items-center gap-2 border-green-300 text-green-700 hover:bg-green-50"
                >
                  <MessageCircle className="w-4 h-4" />
                  Bình luận ({comments.length})
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Comments Section */}
          <Card id="comments-section" className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <MessageCircle className="w-6 h-6 text-green-600" />
                Bình luận ({comments.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Comment Form */}
              {user ? (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                      {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="flex-1">
                      <Textarea
                        placeholder="Viết bình luận của bạn..."
                        value={commentContent}
                        onChange={(e) => setCommentContent(e.target.value)}
                        className="min-h-[100px] mb-3"
                      />
                      <Button
                        onClick={handleSubmitComment}
                        disabled={!commentContent.trim() || submittingComment}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        {submittingComment ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Đang gửi...
                          </>
                        ) : (
                          'Gửi bình luận'
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
                  <p className="text-yellow-800">
                    Vui lòng <Button variant="link" onClick={() => navigate('/login')} className="p-0 h-auto text-yellow-800 underline">đăng nhập</Button> để bình luận
                  </p>
                </div>
              )}

              {/* Comments List */}
              {commentsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
                </div>
              ) : comments.length > 0 ? (
                <div className="space-y-4">
                  {comments.map((comment) => renderComment(comment))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">Chưa có bình luận nào</p>
                  <p className="text-gray-400 text-sm mt-2">Hãy là người đầu tiên bình luận!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Xóa bình luận?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-700 pt-2">
              Hành động này sẽ xóa bình luận
              {deleteTarget?.replies && deleteTarget.replies.length > 0
                ? ' và tất cả phản hồi liên quan.'
                : '.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteTarget(null)}>
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteComment}
              className="bg-red-600 hover:bg-red-700"
              disabled={deletingComment}
            >
              {deletingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Xóa'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Error Alert Dialog */}
      <AlertDialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Lỗi khi tạo bình luận
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-700 pt-2">
              {errorMessage || 'Đã xảy ra lỗi không xác định. Vui lòng thử lại sau.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowErrorDialog(false)}>
              Đóng
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowErrorDialog(false);
                setErrorMessage('');
              }}
              className="bg-green-600 hover:bg-green-700"
            >
              Đã hiểu
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

