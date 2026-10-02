export const getApprovalStyle = (status: string) => {
  switch (status) {
    case '승인':
      return { bg: 'bg-[#EBF7EF]', text: 'text-main' };
    case '대기':
      return { bg: 'bg-main', text: 'text-white' };
    case '거절':
      return { bg: 'bg-gray-50', text: 'text-200' };
    default:
      return { bg: '', text: '' };
  }
};
