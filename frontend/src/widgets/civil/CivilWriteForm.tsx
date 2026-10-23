import { useRouter } from 'next/router';
import Input from '@/shared/Input';
import Textarea from '@/shared/Textarea';
import Button from '@/shared/Button';
import Select from '@/shared/Select';
import axios from '@/shared/lib/axios';
import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/shared/store/auth.store';

type Props = {
  isEdit?: boolean;
};

export default function CivilWriteForm({ isEdit = false }: Props) {
  const router = useRouter();
  const { id } = router.query;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const submitting = useRef(false);

  const user = useAuthStore((state) => state.user);
  const boardId = user?.boardIds.COMPLAINT;

  useEffect(() => {
    if (isEdit && id && typeof id === 'string') {
      let active = true;
      setLoading(true);
      axios.get(`/complaints/${id}`).then((res) => {
        if (!active) return;
        const { title, content, isPublic } = res.data;
        setTitle(title);
        setContent(content);
        setIsPublic(isPublic);
        setLoading(false);
      }).catch(() => {
        if (active) setError('민원을 불러오지 못했습니다. 새로고침 후 다시 확인해주세요.');
      });
      return () => { active = false; };
    }
  }, [isEdit, id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting.current || loading) return;
    if (!title.trim() || !content.trim() || !boardId) {
      setError('제목과 내용을 입력하고 로그인 상태를 확인해주세요.');
      return;
    }
    submitting.current = true;
    setSaving(true);
    setError('');
    try {
      if (isEdit && id && typeof id === 'string') {
        await axios.patch(`/complaints/${id}`, {
          title,
          content,
          isPublic,
        });
        alert('민원이 수정되었습니다.');
      } else {
        await axios.post('/complaints', {
          title,
          content,
          isPublic,
          boardId,
        });
        alert('민원이 등록되었습니다.');
      }
      router.push('/resident/civil');
    } catch (error) {
      console.error('민원 등록/수정 실패', error);
      setError('저장하지 못했습니다. 입력 내용은 유지됩니다. 목록에서 등록 여부를 확인한 뒤 다시 시도해주세요.');
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <p role='alert' className='mb-4 text-red-800'>{error}</p>}
      {loading && <p role='status'>민원을 불러오는 중입니다.</p>}
      <fieldset disabled={loading || saving}>
      <ul className='flex flex-col gap-8'>
        <li className='flex'>
          <p className='w-[45px] text-[14px] leading-[36px]'>공개</p>
          <div className='flex-1'>
            <Select
              options={[
                { value: 'public', label: '공개' },
                { value: 'private', label: '비공개' },
              ]}
              placeholder='공개 범위'
              small={true}
              onChange={(val) => setIsPublic(val === 'public')}
              value={isPublic ? 'public' : 'private'}
            />
          </div>
        </li>
        <li className='flex'>
          <p className='w-[45px] text-[14px] leading-[48px]'>제목</p>
          <div className='flex-1'>
            <Input
              aria-label='제목'
              required
              type='text'
              placeholder='제목을 입력해주세요'
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
        </li>
        <li className='flex'>
          <p className='w-[45px] text-[14px] leading-[48px]'>내용</p>
          <div className='flex-1'>
            <Textarea
              aria-label='내용'
              required
              className='min-h-[240px] h-[40vh]'
              placeholder='내용을 입력해주세요'
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
        </li>
        <li className='flex'>
          <p className='w-[45px] text-[14px] leading-[48px]'></p>
          <div className='flex-1'>
            <Button size='lg' className='w-full max-w-[480px]' type='submit'>
              {saving ? '저장 중...' : isEdit ? '민원 수정하기' : '민원 등록하기'}
            </Button>
          </div>
        </li>
      </ul>
      </fieldset>
    </form>
  );
}
