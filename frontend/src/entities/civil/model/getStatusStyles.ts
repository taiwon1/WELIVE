export const getVisibilityStyle = (status: string) => {
  switch (status) {
    case '비공개':
      return { bg: 'bg-[#ECF7FF]', text: 'text-[#7CC5FA]' };
    case '공개':
      return { bg: 'bg-[#7CC5FA]', text: 'text-white' };
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
