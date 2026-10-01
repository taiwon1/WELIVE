import { Dispatch, SetStateAction } from 'react';

export interface AddFileModalProps {
  isModalOpen: boolean;
  setIsModalOpen: Dispatch<SetStateAction<boolean>>;
  onClick: () => void;
}

export interface DeleteModalProps {
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  onDelete: () => void;
}

export interface Option {
  value: string;
  label: string;
}

export interface ResidentFormData {
  apartmentId: string;
  building: string;
  unitNumber: string;
  name: string;
  contact: string;
  residenceStatus: string;
  isHouseholder: string;
  approvalStatus: string;
}

export interface EditResidentFormData {
  building: string;
  unitNumber: string;
  name: string;
  contact: string;
  isHouseholder: string;
}

export interface ResidentModalProps {
  isModalOpen: boolean;
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onSubmit: (formData: ResidentFormData) => Promise<void>;
}

export interface EditResidentModalProps {
  isModalOpen: boolean;
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onSubmit: (formData: EditResidentFormData) => Promise<void>;
  resident?: AdminResidentData;
}

export interface AdminButtonProps {
  title: string;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
}

export interface AdminResidentData {
  id: string;
  building: string;
  unitNumber: string;
  contact: string;
  name: string;
  email: string;
  residenceStatus: 'RESIDENCE' | 'NO_RESIDENCE';
  isHouseholder: 'HOUSEHOLDER' | 'RESIDENCE' | 'NON_HOUSEHOLDER';
  isRegistered: boolean;
  approvalStatus: 'APPROVED' | 'PENDING' | 'REJECTED';
  note?: string;
}

export interface ResidentsResponse {
  residents: AdminResidentData[];
  message: string;
  count: number;
}

export interface AdminResidentTable {
  data: AdminResidentData[];
  startingIndex: number;
  COLUMNS: { key: keyof AdminResidentData; title: string; width: string }[];
  editClick: (row: AdminResidentData) => void;
  deleteClick: (row: AdminResidentData) => void;
}

export interface FilterState {
  building: string;
  unitNumber: string;
  isHouseholder: string;
  isRegistered: string;
  search: string;
}
