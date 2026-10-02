import axios from '@/shared/lib/axios';
import { UpdateAdminRequest, ApprovalStatus } from './type';

export const patchUpdateAdmin = async (adminId: string, data: UpdateAdminRequest) => {
  const response = await axios.patch(`/auth/admins/${adminId}`, data);
  return response.data;
};

//[단건]관리자 가입 상태 변경 API
export const updateAdminApprovalStatus = async (adminId: string, status: ApprovalStatus) => {
  const response = await axios.patch(`/auth/admins/${adminId}/status`, { status });
  return response.data;
};

//[전체변경]관리자 가입 상태 일괄 변경 API
export const updateAllAdminsApprovalStatus = async (status: ApprovalStatus) => {
  const response = await axios.patch('/auth/admins/status', { status });
  return response.data;
};

//관리자 삭제 API
export const deleteAdmin = async (adminId: string) => {
  await axios.delete(`/auth/admins/${adminId}`);
};

//관리자 거절 계정 일괄 정리 API
export const postRejectCleanup = async () => {
  await axios.post('/auth/cleanup');
};
