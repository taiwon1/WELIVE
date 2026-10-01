import axios from '@/shared/lib/axios';

//로그아웃 API
export const postLogout = async () => {
  return await axios.post('/auth/logout');
};
