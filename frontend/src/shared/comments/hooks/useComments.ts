import { useState } from 'react';
import {
  BoardType,
  createComment,
  deleteComment,
  updateComment,
  IComment,
} from '../api/comment.api';

export function useComments(initialComments: IComment[], boardId: string, boardType: BoardType) {
  const [comments, setComments] = useState<IComment[]>(initialComments);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleCreate = async (content: string) => {
    const newComment = await createComment({
      boardId,
      boardType,
      content,
    });
    setComments([...comments, newComment]);
  };

  const handleUpdate = async (id: string, content: string) => {
    await updateComment({
      commentId: id,
      content,
      boardId,
      boardType,
    });
    setComments((prev) => prev.map((c) => (c.id === id ? { ...c, content } : c)));
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm('정말 삭제하시겠습니까?');
    if (!confirmed) return;

    await deleteComment(id);
    setComments((prev) => prev.filter((c) => c.id !== id));
  };

  return {
    comments,
    editingId,
    setEditingId,
    handleCreate,
    handleUpdate,
    handleDelete,
  };
}
