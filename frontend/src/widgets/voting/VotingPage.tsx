import Title from '@/shared/Title';
import VotingFilter from './VotingFilter';
import VotingTable from './VotingTable';
import Pagination from '@/shared/Pagination';
import { useVoting } from '@/entities/voting/model/useVoting';
import { PollStatus } from '@/entities/voting/api/voting.api';

const ITEMS_PER_PAGE = 11;

export default function VotingPage() {
  const {
    data, totalCount,
    setDongFilter,
    setStatusFilter,
    setKeyword,
    currentPage, setCurrentPage
  } = useVoting();


  const handleDongChange = (dong?: number) => {
    setDongFilter(dong);
    setCurrentPage(1);
  };

  const handleStatusChange = (status?: PollStatus) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handleKeywordSearch = (keyword?: string) => {
    setKeyword(keyword);
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div>
      <Title>주민투표 관리</Title>
      <VotingFilter
        onChangeDong={handleDongChange}
        onChangeStatus={handleStatusChange}
        onSearchKeyword={handleKeywordSearch}
      />
      <VotingTable
        data={data}
        currentPage={currentPage}
        itemsPerPage={ITEMS_PER_PAGE}
        totalCount={totalCount}
      />
      <div className='mt-[24px] flex w-full justify-center'>
        <Pagination
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          totalPages={totalPages}
        />
      </div>
    </div>
  );
}
