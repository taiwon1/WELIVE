import { AdminResidentData, Option } from './adminNotice.types';

export const SELECT_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'check', label: '정기점검' },
  { value: 'emergency', label: '긴급점검' },
  { value: 'live', label: '공동생활' },
  { value: 'vote', label: '주민투표' },
  { value: 'etc', label: '기타' },
  { value: 'etc', label: '기타' },
  { value: 'etc', label: '기타' },
  { value: 'etc', label: '기타' },
];

export const AdminResidentCOLUMNS: {
  key: keyof AdminResidentData;
  title: string;
  width: string;
}[] = [
  { key: 'id', title: 'NO.', width: '100px' },
  { key: 'building', title: '동', width: '' },
  { key: 'unitNumber', title: '호', width: '' },
  { key: 'name', title: '이름', width: '' },
  { key: 'contact', title: '연락처', width: '' },
  { key: 'isHouseholder', title: '거주', width: '' },
  { key: 'isRegistered', title: '위리브 가입', width: '' },
  { key: 'note', title: '비고', width: '100px' },
];

export const SELECT_MAP = ['동', '호수', '거주', '위리브 가입'];

export const RESIDENCE_OPTIONS: Option[] = [
  { value: 'HOUSEHOLDER', label: '세대주' },
  { value: 'MEMBER', label: '세대원' },
];
export const SIGNUP_OPTIONS: Option[] = [
  { value: 'registered', label: '가입' },
  { value: 'unregistered', label: '미가입' },
];
