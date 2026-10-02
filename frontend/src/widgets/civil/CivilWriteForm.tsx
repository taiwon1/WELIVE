import { useRouter } from 'next/router';
import Input from '@/shared/Input';
import Textarea from '@/shared/Textarea';
import Button from '@/shared/Button';
import Select from '@/shared/Select';
import axios from '@/shared/lib/axios';
import { useState, useEffect } from 'react';
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

  const user = useAuthStore((state) => state.user);
  const boardId = user?.boardIds.COMPLAINT;

  useEffect(() => {
    if (isEdit && id && typeof id === 'string') {
      axios.get(`/complaints/${id}`).then((res) => {
        const { title, content, isPublic } = res.data;
        setTitle(title);
        setContent(content);
        setIsPublic(isPublic);
      });
    }
  }, [isEdit, id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
      alert('요청에 실패했습니다.');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <ul className='flex flex-col gap-8'>
        <li className='flex'>
          <p className='w-[45px] text-[14px] leading-[36px]'>공개</p>
          <div className='flex-1'>
            <Select
              options={[
                { value: 'public', label: '공개' },
                { value: 'private', label: '비공개' },
              ]}
              small={true}
              onChange={(val) => setIsPublic(val === 'public')}
              defaultValue={isPublic ? 'public' : 'private'}
            />
          </div>
        </li>
        <li className='flex'>
          <p className='w-[45px] text-[14px] leading-[48px]'>제목</p>
          <div className='flex-1'>
            <Input
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
              className='h-[570px]'
              placeholder='내용을 입력해주세요'
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
        </li>
        <li className='flex'>
          <p className='w-[45px] text-[14px] leading-[48px]'></p>
          <div className='flex-1'>
            <Button size='lg' className='w-[480px]' type='submit'>
              {isEdit ? '민원 수정하기' : '민원 등록하기'}
            </Button>
          </div>
        </li>
      </ul>
    </form>
  );
}
