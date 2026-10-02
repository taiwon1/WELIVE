import { useEffect, useState } from 'react';
import { VotingList } from '../type';
import { getVotingList, PollListItem, PollStatus } from '../api/voting.api';

export function useVoting() {
  const [data, setData] = useState<VotingList[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [dongFilter, setDongFilter] = useState<number | undefined>();
  const [statusFilter, setStatusFilter] = useState<PollStatus | undefined>();
  const [keyword, setKeyword] = useState<string | undefined>();
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getVotingList({
          page: currentPage,
          limit: 11,
          buildingPermission: dongFilter,
          status: statusFilter,
          keyword: keyword?.trim()
        });
        const parsed: VotingList[] = res.polls.map((item: PollListItem) => ({
          pollId: item.pollId,
          userId: item.userId,
          title: item.title,
          writerName: item.writerName,
          buildingPermission: item.buildingPermission,
          createdAt: item.createdAt,
          startDate: item.startDate,
          endDate: item.endDate,
          status: item.status,
        }));
        setTotalCount(res.totalCount);

        const sorted = parsed.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );

        setData(sorted);
      } catch (error) {
        console.error('투표 데이터 불러오기 실패:', error);
      }
    };

    fetchData();
  }, [dongFilter, statusFilter, keyword, currentPage]);

  return {
    data, totalCount,
    dongFilter, setDongFilter,
    statusFilter, setStatusFilter,
    keyword, setKeyword,
    currentPage, setCurrentPage
  };
}
