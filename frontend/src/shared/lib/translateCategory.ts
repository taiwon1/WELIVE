type CategoryKey =
  | 'MAINTENANCE'
  | 'EMERGENCY'
  | 'COMMUNITY'
  | 'RESIDENT_VOTE'
  | 'RESIDENT_COUNCIL'
  | 'ETC';

const categoryMap = {
  MAINTENANCE: '정기점검',
  EMERGENCY: '긴급공지',
  COMMUNITY: '커뮤니티',
  RESIDENT_VOTE: '주민투표',
  RESIDENT_COUNCIL: '주민회의',
  ETC: '기타',
} as const;

export function translateCategory(category: unknown): string {
  if (typeof category === 'string' && categoryMap[category as CategoryKey]) {
    return categoryMap[category as CategoryKey];
  }
  return String(category);
}
