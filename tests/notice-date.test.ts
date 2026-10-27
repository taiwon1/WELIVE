import { formatDateToKST } from '../frontend/src/shared/lib/formatDateToKST';

it.each([
  '2026-10-22T12:33:26.007Z',
  '2026-10-22T21:33:26+09:00',
  '2026-10-22 12:33:26',
])('공지 날짜 %s를 한국 시각으로 표시한다', value => {
  expect(formatDateToKST(value)).toBe('2026-10-22 21:33');
});

it('누락되거나 잘못된 날짜를 Invalid Date로 노출하지 않는다', () => {
  for (const value of [undefined, null, '', 'not-a-date']) expect(formatDateToKST(value)).toBe('-');
});
