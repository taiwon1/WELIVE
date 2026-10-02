import { useEffect, useState } from 'react';

import DeleteModal from '@/shared/DeleteModal';
import DetailNoticeCommentForm from '@/entities/notice/ui/detail/DetailNoticeCommentForm';
import DetailNoticeCommentList from '@/entities/notice/ui/detail/DetailNoticeCommentList';
import DetailNoticeInfo from '@/entities/notice/ui/detail/DetailNoticeInfo';
import { NoticeDetailProps } from '@/entities/notice/model/notice.types';
import axiosInstance from '@/shared/lib/axios';
import { useAuthStore } from '@/shared/store/auth.store';
import { useRouter } from 'next/router';

export default function DetailAdminNoticePage() {
  const [data, setData] = useState<NoticeDetailProps | null>(null);
  const [newComment, setNewComment] = useState('');
  const [editComment, setEditComment] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState('');
  const [isNoticeDeleteModalOpen, setIsNoticeDeleteModalOpen] = useState(false);
  const [isCommentDeleteModalOpen, setIsCommentDeleteModalOpen] = useState(false);
  const router = useRouter();
  const { id } = router.query;
  const comments = data?.comments ?? [];
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        const response = await axiosInstance.get(`/notices/${id}`);
        setData(response.data);
      } catch (error) {
        console.error('공지사항 등록 실패:', error);
      }
    };
    fetchData();
  }, [id]);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) {
      alert('로그인이 필요합니다.');
      return;
    }
    if (!newComment.trim()) {
      alert('댓글 내용을 입력하세요.');
      return;
    }
    try {
      const payload = {
        userId: user.id,
        content: newComment,
        boardType: 'NOTICE',
        boardId: data?.noticeId,
      };
      await axiosInstance.post('/comments', payload, {
        headers: { 'Content-Type': 'application/json' },
      });
      setNewComment('');
      if (id) {
        const response = await axiosInstance.get(`/notices/${id}`);
        setData(response.data);
      }
    } catch (error) {
      alert('댓글 등록에 실패했습니다.');
      console.error(error);
    }
  };

  const handleEditClick = (commentId: string, content: string) => {
    setIsEditing(true);
    setEditingCommentId(commentId);
    setEditComment(content);
  };

  const handleEditCommentSubmit = async (
    e: React.FormEvent,
    boardId: string,
    boardType: string,
  ) => {
    e.preventDefault();
    try {
      const payload = {
        userId: user?.id,
        content: editComment,
        boardType,
        boardId,
      };
      await axiosInstance.patch(`/comments/${editingCommentId}`, payload, {
        headers: { 'Content-Type': 'application/json' },
      });
      setIsEditing(false);
      setEditComment('');
      if (id) {
        const response = await axiosInstance.get(`/notices/${id}`);
        setData(response.data);
      }
    } catch (error) {
      console.error('댓글 수정 실패:', error);
    }
  };

  const handleNoticeDeleteClick = () => {
    setIsNoticeDeleteModalOpen(true);
  };

  const handleNoticeDeleteSubmit = async (id: string | string[] | undefined) => {
    try {
      await axiosInstance.delete(`/notices/${id}`);
      setIsNoticeDeleteModalOpen(false);
      router.push('/admin/notice');
    } catch (error) {
      console.error('공지사항 삭제 실패:', error);
    }
  };

  const handleCommentDeleteSubmit = async (commentId: string) => {
    try {
      await axiosInstance.delete(`/comments/${commentId}`);
      setIsCommentDeleteModalOpen(false);
      setEditingCommentId('');
      if (id) {
        const response = await axiosInstance.get(`/notices/${id}`);
        setData(response.data);
      }
    } catch (error) {
      console.error('댓글 삭제 실패:', error);
      alert('댓글 삭제에 실패했습니다.');
    }
  };

  return (
    <div className='text-gray-900'>
      {data && (
        <>
          <DetailNoticeInfo
            data={data}
            onEdit={() => router.push(`/admin/notice/edit/${id}`)}
            onDelete={handleNoticeDeleteClick}
            commentsCount={comments.length}
          />

          <div className='mt-[40px] mb-[90px] text-lg leading-relaxed whitespace-pre-wrap'>
            {data.content}
          </div>
        </>
      )}

      <div>
        <div className='mb-[30px] w-full border-b border-gray-500 pb-2 font-medium text-gray-500'>
          {comments.length > 0 ? `댓글 ${comments.length}` : '등록된 댓글이 없습니다.'}
        </div>

        <DetailNoticeCommentForm
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onSubmit={handleCommentSubmit}
        />

        <DetailNoticeCommentList
          comments={comments}
          isEditing={isEditing}
          editingCommentId={editingCommentId}
          editComment={editComment}
          setEditComment={setEditComment}
          onEditClick={handleEditClick}
          onEditSubmit={handleEditCommentSubmit}
          onEditCancel={() => setIsEditing(false)}
          onDeleteClick={(commentId) => {
            setEditingCommentId(commentId);
            setIsCommentDeleteModalOpen(true);
          }}
        />
      </div>

      {isNoticeDeleteModalOpen && (
        <DeleteModal
          isModalOpen={isNoticeDeleteModalOpen}
          setIsModalOpen={setIsNoticeDeleteModalOpen}
          onDelete={() => handleNoticeDeleteSubmit(id)}
        />
      )}
      {isCommentDeleteModalOpen && (
        <DeleteModal
          isModalOpen={isCommentDeleteModalOpen}
          setIsModalOpen={setIsCommentDeleteModalOpen}
          onDelete={() => handleCommentDeleteSubmit(editingCommentId)}
        />
      )}
    </div>
  );
}
