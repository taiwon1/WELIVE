import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import VotingFormPage from '@/widgets/voting/VotingFormPage';
import { getPollDetail, PollDetail } from '@/entities/voting/api/voting.api';
import { addLayout } from '@/shared/lib/addLayout';

export default function VotingEdit() {
  const { id } = useRouter().query;
  const [votingItem, setVotingItem] = useState<PollDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        const data = await getPollDetail(id as string);
        setVotingItem(data);
      } catch (error) {
        console.error('투표 상세 조회 실패:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (isLoading) return <div className='text-xl'>로딩 중...</div>;

  if (!votingItem) return <div className='text-3xl'>존재하지 않는 투표입니다.</div>;

  return <VotingFormPage isEdit initialData={votingItem} />;
}

VotingEdit.getLayout = addLayout('admin');
