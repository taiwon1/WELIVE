import { useEffect, useState } from 'react';
import axios from '@/shared/lib/axios';
import { useAuthStore } from '@/shared/store/auth.store';

type Apartment = {
  id: string;
  startComplexNumber: string;
  endComplexNumber: string;
  startDongNumber: string;
  endDongNumber: string;
  startFloorNumber: string;
  endFloorNumber: string;
  startHoNumber: string;
  endHoNumber: string;
};

type Option = { value: string; label: string };

function pad(num: number, length: number = 2) {
  return String(num).padStart(length, '0');
}

// ✅ 단지번호 + 동번호 조합으로 동 옵션 생성
function generateDongOptions(
  startComplex: number,
  endComplex: number,
  startDong: number,
  endDong: number,
): Option[] {
  const result: Option[] = [];
  for (let complex = startComplex; complex <= endComplex; complex++) {
    for (let dong = startDong; dong <= endDong; dong++) {
      const raw = `${pad(complex)}${pad(dong)}`; // 예: 01 + 01 = 0101
      result.push({ value: raw, label: `${parseInt(raw, 10)}동` }); // 예: 101동
    }
  }
  return result;
}

// ✅ 층 + 호 조합으로 호 옵션 생성
function generateHoOptions(
  startFloor: number,
  endFloor: number,
  startHo: number,
  endHo: number,
): Option[] {
  const result: Option[] = [];
  for (let floor = startFloor; floor <= endFloor; floor++) {
    for (let ho = startHo; ho <= endHo; ho++) {
      const floorStr = pad(floor); // 예: 01
      const hoStr = pad(ho); // 예: 01
      const fullStr = `${floorStr}${hoStr}`; // 예: 0101
      result.push({
        value: fullStr,
        label: `${parseInt(fullStr, 10)}호`, // 예: 101호
      });
    }
  }
  return result;
}

export function useApartmentOptions() {
  const [dongOptions, setDongOptions] = useState<Option[]>([]);
  const [hoOptions, setHoOptions] = useState<Option[]>([]);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    async function fetchApartments() {
      try {
        const res = await axios.get('/apartments');
        const apartment: Apartment | undefined = res.data.apartments.find(
          (apt: Apartment) => apt.id === user?.apartmentId,
        );

        if (apartment) {
          const complexStart = parseInt(apartment.startComplexNumber, 10);
          const complexEnd = parseInt(apartment.endComplexNumber, 10);
          const dongStart = parseInt(apartment.startDongNumber, 10);
          const dongEnd = parseInt(apartment.endDongNumber, 10);
          const floorStart = parseInt(apartment.startFloorNumber, 10);
          const floorEnd = parseInt(apartment.endFloorNumber, 10);
          const hoStart = parseInt(apartment.startHoNumber, 10);
          const hoEnd = parseInt(apartment.endHoNumber, 10);

          setDongOptions(generateDongOptions(complexStart, complexEnd, dongStart, dongEnd));
          setHoOptions(generateHoOptions(floorStart, floorEnd, hoStart, hoEnd));
        }
      } catch (err) {
        console.error('아파트 옵션 로딩 실패', err);
      }
    }

    if (user?.apartmentId) fetchApartments();
  }, [user?.apartmentId]);

  return { dongOptions, hoOptions };
}
