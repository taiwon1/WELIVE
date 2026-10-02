import axios from '@/shared/lib/axios';
import { ResidentNoticeTypes } from '../model/notice.types';

// ✅ 공지사항 목록 불러오기
export const fetchResidentNotices = async (
  page = 1,
  limit = 1000, // 기본값 크게 설정해두면 전체 불러오기 용도로도 사용 가능
): Promise<{ notices: ResidentNoticeTypes[]; totalCount: number }> => {
  const res = await axios.get('/notices', {
    params: { limit, page },
  });

  return {
    notices: res.data.notices,
    totalCount: res.data.totalCount,
  };
};

// ✅ 공지사항 상세 불러오기
export const fetchResidentNoticeDetail = async (noticeId: string) => {
  const res = await axios.get(`/notices/${noticeId}`);
  return res.data;
};
