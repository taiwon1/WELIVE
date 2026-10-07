const ignored = new Set([
  '민원',
  '문의',
  '신고',
  '문제',
  '관련',
  '요청',
  '확인',
  '처리',
  '우리',
  '아파트',
  '안녕하세요',
  '자꾸',
  '계속',
  '다시',
  '너무',
  '정말',
  '있어요',
  '합니다',
  '해주세요',
  '부탁드립니다',
  '때문에',
]);

// Each complaint contributes at most one occurrence per word.
export function suggestIncidentTitle(titles: string[]): string {
  const counts = new Map<string, number>();
  for (const title of titles) {
    const words = new Set(
      title
        .toLowerCase()
        .normalize('NFKC')
        .split(/[^가-힣a-z0-9]+/)
        .map((word) => {
          if (/^(엘리베이터|승강기|엘베)/.test(word)) return '엘리베이터';
          if (/^고장/.test(word)) return '고장';
          return word.replace(
            /(?:해주세요|입니다|이에요|에서|으로|에게|까지|부터|이랑|하고|은|는|이|가|을|를|에|도)$/u,
            '',
          );
        })
        .filter((word) => /^[가-힣a-z]{2,20}$/.test(word) && !ignored.has(word)),
    );
    for (const word of words) counts.set(word, (counts.get(word) ?? 0) + 1);
  }
  const keywords = [...counts]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([word]) => word);
  return keywords.length ? keywords.join(' ') + ' 관련 민원' : '';
}
