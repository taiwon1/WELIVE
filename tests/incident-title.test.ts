import { suggestIncidentTitle } from '../frontend/src/entities/incident/model/suggestTitle';

test('주요 공통 단어와 승강기 표현을 모아 제목을 제안한다', () => {
  expect(suggestIncidentTitle(['엘리베이터가 고장났어요', '승강기 고장입니다', '엘베에서 소음'])).toBe('엘리베이터 고장 관련 민원');
});
test('한 민원에서 반복한 단어는 빈도를 부풀리지 않는다', () => {
  expect(suggestIncidentTitle(['소음 소음 소음 소음', '엘리베이터 고장', '승강기 고장'])).toBe('엘리베이터 고장 관련 민원');
});
test('동호수·전화번호와 흔한 요청 문구는 추천에서 제외한다', () => {
  expect(suggestIncidentTitle(['101동 102호 010-1234-5678 민원 요청'])).toBe('');
  expect(suggestIncidentTitle([])).toBe('');
});
