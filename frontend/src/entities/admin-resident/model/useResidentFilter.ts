import { FilterState, ResidentsResponse } from './adminNotice.types';

import { useMemo } from 'react';

export function useResidentFilter(
  data: ResidentsResponse | null,
  filters: FilterState,
  currentPage: number,
  pageSize: number,
) {
  const filteredResidents = useMemo(() => {
    if (!data?.residents) return [];
    const searchLower = filters.search.trim().toLowerCase();
    return data.residents.filter((resident) => {
      const matchBuilding = filters.building === 'all' || resident.building === filters.building;
      const matchUnitNumber =
        filters.unitNumber === 'all' || resident.unitNumber === filters.unitNumber;
      const matchIsHouseholder =
        filters.isHouseholder === 'all' || resident.isHouseholder === filters.isHouseholder;
      const matchIsRegistered =
        filters.isRegistered === 'all' || String(resident.isRegistered) === filters.isRegistered;
      const matchSearch =
        !searchLower ||
        resident.building.toLowerCase().includes(searchLower) ||
        resident.unitNumber.toLowerCase().includes(searchLower) ||
        resident.name.toLowerCase().includes(searchLower) ||
        resident.contact.includes(searchLower);
      return (
        matchBuilding && matchUnitNumber && matchIsHouseholder && matchIsRegistered && matchSearch
      );
    });
  }, [data, filters]);

  const pagedResidents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return filteredResidents.slice(start, end);
  }, [filteredResidents, currentPage, pageSize]);

  return { filteredResidents, pagedResidents, totalCount: filteredResidents.length };
}
