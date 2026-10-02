import axios from '@/shared/lib/axios';
import { ApprovalStatus } from './type';

//[단건]입주민 가입 상태 변경API
export const updateResidentApprovalStatus = async (residentId: string, status: ApprovalStatus) => {
  const response = await axios.patch(`/auth/residents/${residentId}/status`, { status });
  return response.data;
};

//[전체]입주민 가입 상태 일괄 변경 API
export const updateAllResidentsApprovalStatus = async (status: ApprovalStatus) => {
  const response = await axios.patch(`/auth/residents/status`, { status });
  return response.data;
};
