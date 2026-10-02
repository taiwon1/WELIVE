import axios from '@/shared/lib/axios';

//주민 투표 등록 API
export interface VotingOption {
  title: string;
}

export enum PollStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  CLOSED = 'CLOSED',
}

export interface CreateVotingRequest {
  boardId: string;
  status: PollStatus;
  title: string;
  content: string;
  buildingPermission: number;
  startDate: string;
  endDate: string;
  options: VotingOption[];
}
export const postCreateVoting = async (data: CreateVotingRequest) => {
  const response = await axios.post('/polls', data);
  return response.data;
};

//주민 투표 리스트 조회 API
export interface PollListItem {
  pollId: string;
  userId: string;
  title: string;
  writerName: string;
  buildingPermission: number;
  createdAt: string;
  startDate: string;
  endDate: string;
  status: PollStatus;
}

export interface PollListResponse {
  polls: PollListItem[];
  totalCount: number;
}

export const getVotingList = async (
  params: {
    page: number,
    limit: number,
    buildingPermission?: number,
    status?: PollStatus,
    keyword?: string
  }
): Promise<PollListResponse> => {
  const res = await axios.get('/polls', { params });

  return res.data;
};

//주민 투표 상세 조회 API

export interface PollOption {
  id: string;
  title: string;
  voteCount: number;
}

export interface PollDetail {
  pollId: string;
  title: string;
  buildingPermission: number;
  createdAt: string;
  startDate: string;
  endDate: string;
  status: PollStatus;
  content: string;
  boardName: string;
  options: PollOption[];
}

export const getPollDetail = async (pollId: string): Promise<PollDetail> => {
  const response = await axios.get(`/polls/${pollId}`);
  return response.data;
};

//주민 투표 기능 API
export const postVoteOption = async (optionId: string) => {
  const response = await axios.post(`/options/${optionId}/vote`);
  return response.data;
};

//주민 투표 취소 API
export const deleteVoteOption = async (optionId: string) => {
  const response = await axios.delete(`/options/${optionId}/vote`);
  return response.data;
};

//주민 투표 삭제 API
export const deleteVoting = async (pollId: string) => {
  const res = await axios.delete(`/polls/${pollId}`);
  return res.data;
};

//주민 투표 수정 API
export interface UpdateVotingOption {
  title: string;
}

export interface UpdateVotingRequest {
  title: string;
  content: string;
  buildingPermission: number;
  startDate: string;
  endDate: string;
  status: PollStatus;
  options: UpdateVotingOption[];
}

export const patchUpdateVoting = async (pollId: string, data: UpdateVotingRequest) => {
  const response = await axios.patch(`/polls/${pollId}`, data);
  return response.data;
};
