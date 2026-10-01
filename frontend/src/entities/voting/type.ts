export interface Voting {
  id: number;
  title: string;
  author: string;
  target: string;
  createdAt: string;
  startAt: string;
  endAt: string;
  status: string;
  content: string;
  options: string[];
}

export interface VotingList {
  pollId: string;
  userId: string;
  title: string;
  writerName: string;
  buildingPermission: number;
  createdAt: string;
  startDate: string;
  endDate: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'CLOSED';
}

export interface VotingOption {
  id: string;
  title: string;
  voteCount: number;
}
export interface VotingDetail {
  pollId: string;
  title: string;
  buildingPermission: number;
  createdAt: string;
  startDate: string;
  endDate: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'CLOSED';
  content: string;
  boardName: string;
  options: VotingOption[];
}
