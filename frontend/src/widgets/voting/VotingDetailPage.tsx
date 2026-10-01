import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import VotingDetailTitle from './VotingDetailTitle';
import VotingDetailContent from './VotingDetailContent';
import { getPollDetail, PollDetail } from '@/entities/voting/api/voting.api';

export default function VotingDetailPage() {
  const { id } = useRouter().query;
  const [votingItem, setVotingItem] = useState<PollDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || typeof id !== 'string') return;

    const fetchData = async () => {
      try {
        const data = await getPollDetail(id);
        setVotingItem(data);
      } catch (error) {
        console.error('투표 상세 정보 불러오기 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) return <div>불러오는 중입니다...</div>;
  if (!votingItem) return <div>존재하지 않는 투표입니다.</div>;

  return (
    <div>
      <VotingDetailTitle data={votingItem} />
      <VotingDetailContent data={votingItem} />
    </div>
  );
}
