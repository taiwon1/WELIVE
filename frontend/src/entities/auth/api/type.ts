export interface UpdateAdminRequest {
  name: string;
  contact: string;
  email: string;
  description: string;
  apartmentName: string;
  apartmentAddress: string;
  apartmentManagementNumber: string;
}

export enum ApprovalStatus {
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}
