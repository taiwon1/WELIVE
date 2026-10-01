export const getApprovalStyle = (status: string) => {
  switch (status) {
    case 'APPROVED':
    case '승인':
      return { bg: 'bg-[#EBF7EF]', text: 'text-main' };
    case 'REJECTED':
    case '거절':
      return { bg: 'bg-gray-50', text: 'text-200' };
    case 'PENDING':
    case '대기':
      return { bg: 'bg-main', text: 'text-white' };
    default:
      return { bg: '', text: '' };
  }
};

export const getProcessStyle = (status: string) => {
  switch (status) {
    case '접수전':
      return { bg: 'bg-[#EBF7EF]', text: 'text-main' };
    case '처리중':
      return { bg: 'bg-main', text: 'text-white' };
    case '처리완료':
      return { bg: 'bg-gray-50', text: 'text-200' };
    default:
      return { bg: '', text: '' };
  }
};
