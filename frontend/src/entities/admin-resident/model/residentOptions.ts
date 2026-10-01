import { AdminResidentData } from './adminNotice.types';

export function getBuildingOptions(residents: AdminResidentData[]) {
  return [
    { value: 'all', label: '전체' },
    ...Array.from(new Set(residents.map((r) => r.building))).map((building) => ({
      value: building,
      label: building,
    })),
  ];
}

export function getUnitNumberOptions(residents: AdminResidentData[]) {
  return [
    { value: 'all', label: '전체' },
    ...Array.from(new Set(residents.map((r) => r.unitNumber))).map((unitNumber) => ({
      value: unitNumber,
      label: unitNumber,
    })),
  ];
}

export function getIsHouseholderOptions(
  residents: AdminResidentData[],
  labelMap: Record<string, string>,
) {
  return [
    { value: 'all', label: '전체' },
    ...Array.from(new Set(residents.map((r) => r.isHouseholder))).map((isHouseholder) => ({
      value: isHouseholder,
      label: labelMap[isHouseholder] || isHouseholder,
    })),
  ];
}

export function getIsRegisteredOptions(residents: AdminResidentData[]) {
  return [
    { value: 'all', label: '전체' },
    ...Array.from(new Set(residents.map((r) => r.isRegistered))).map((isRegistered) => ({
      value: String(isRegistered),
      label: isRegistered ? '가입' : '미가입',
    })),
  ];
}
