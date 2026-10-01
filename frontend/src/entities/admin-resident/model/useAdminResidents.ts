import { ResidentFormData } from './adminNotice.types';
import axiosInstance from '@/shared/lib/axios';

export function useAdminResidents() {
  const registerResident = async (formData: ResidentFormData) => {
    await axiosInstance.post('/residents', formData);
  };

  const deleteResident = async (id: string) => {
    await axiosInstance.delete(`/residents/${id}`);
  };

  // 입주민 명부 다운로드
  const downloadResidentsFile = async () => {
    try {
      const response = await axiosInstance.get('/residents/file', {
        responseType: 'blob',
      });

      const disposition = response.headers['content-disposition'];
      let filename = 'residents.csv';
      if (disposition && disposition.includes('filename=')) {
        filename = decodeURIComponent(disposition.split('filename=')[1].replace(/"/g, ''));
      }

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert('파일 다운로드에 실패했습니다.');
      console.error(error);
    }
  };

  return { registerResident, deleteResident, downloadResidentsFile };
}
