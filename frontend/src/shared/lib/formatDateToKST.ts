export const formatDateToKST = (dateStr?: string | null) => {
  if (!dateStr?.trim()) return '-';
  const normalized = dateStr.trim().replace(' ', 'T');
  // API timestamps already contain Z or an offset. Legacy unzoned values are UTC.
  const hasZone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(normalized);
  const date = new Date(hasZone ? normalized : normalized + 'Z');
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(date);
};
