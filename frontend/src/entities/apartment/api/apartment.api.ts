import axios from '@/shared/lib/axios';

//아파트 조회 API
export interface Apartment {
  id: string;
  name: string;
  address: string;
  officeNumber: string;
  description: string;
  dongRange: {
    start: string;
    end: string;
  };
  hoRange: {
    start: string;
    end: string;
  };
  startComplexNumber: string;
  endComplexNumber: string;
  startDongNumber: string;
  endDongNumber: string;
  startFloorNumber: string;
  endFloorNumber: string;
  startHoNumber: string;
  endHoNumber: string;
}

export const getApartments = async (): Promise<Apartment[]> => {
  const response = await axios.get<{ apartments: Apartment[] }>('/apartments');
  return response.data.apartments;
};

//아파트 상세 조회 API
export interface ApartmentDetail {
  id: string;
  name: string;
  address: string;
  officeNumber: string;
  description: string;
  startComplexNumber: string;
  endComplexNumber: string;
  startDongNumber: string;
  endDongNumber: string;
  startFloorNumber: string;
  endFloorNumber: string;
  startHoNumber: string;
  endHoNumber: string;
}

export const getApartmentDetail = async (apartmentId: string): Promise<ApartmentDetail> => {
  const response = await axios.get(`/apartments/${apartmentId}`);
  return response.data;
};
