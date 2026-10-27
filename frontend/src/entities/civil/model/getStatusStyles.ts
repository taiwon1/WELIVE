export const getVisibilityStyle = (status: string) => {
  switch (status) {
    case '비공개':
      return { bg: 'bg-blue-50', text: 'text-blue-900' };
    case '공개':
      return { bg: 'bg-blue-100', text: 'text-blue-900' };
    default:
      return { bg: '', text: '' };
  }
};

export const getProcessStyle = (status: string) => {
  switch (status) {
    case '접수전':
    case '처리 대기':
      return { bg: 'bg-amber-100', text: 'text-amber-900' };
    case '처리중':
      return { bg: 'bg-main', text: 'text-white' };
    case '처리완료':
      return { bg: 'bg-gray-100', text: 'text-gray-700' };
    default:
      return { bg: '', text: '' };
  }
};
