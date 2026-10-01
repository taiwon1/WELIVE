import axios from '@/shared/lib/axios';

//아파트 리스트 호출 API
export interface ApartmentRequest {
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
  apartmentStatus: 'APPROVED' | 'PENDING' | 'REJECTED';
  adminId: string;
  adminName: string;
  adminContact: string;
  adminEmail: string;
}

export interface ApartmentRequestListResponse {
  apartments: ApartmentRequest[];
}

export const getApartmentRequests = async (): Promise<ApartmentRequest[]> => {
  const res = await axios.get<ApartmentRequestListResponse>('/apartments');
  return res.data.apartments;
};
