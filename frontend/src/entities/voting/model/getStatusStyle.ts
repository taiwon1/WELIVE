export const getVotingStyle = (status: string) => {
  switch (status) {
    case 'PENDING':
    case '투표전':
      return { bg: 'bg-[#EBF7EF]', text: 'text-main' };
    case 'IN_PROGRESS':
    case '투표중':
      return { bg: 'bg-main', text: 'text-white' };
    case 'CLOSED':
    case '마감':
      return { bg: 'bg-gray-50', text: 'text-gray-300' };
    default:
      return { bg: '', text: '' };
  }
};
