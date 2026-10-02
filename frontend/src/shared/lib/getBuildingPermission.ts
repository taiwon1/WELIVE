export function getBuildingPermission(value: number): string {
  if (value === 0) return '전체';
  return `${value}동`;
}
