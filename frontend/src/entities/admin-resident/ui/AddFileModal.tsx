import { useRef, useState } from 'react';

import AdminButton from './AdminButton';
import { FiUploadCloud } from 'react-icons/fi';
import Modal from '@/shared/Modal';
import axiosInstance from '@/shared/lib/axios';

interface AddFileModalProps {
  isModalOpen: boolean;
  handleModalClose: () => void;
  fetchData: () => Promise<void>;
}

export default function AddFileModal({
  isModalOpen,
  handleModalClose,
  fetchData,
}: AddFileModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleRegisterClick = async () => {
    if (!selectedFile) {
      console.log('파일이 선택되지 않았습니다.');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await axiosInstance.post('/residents/from-file', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      alert(`파일이 성공적으로 업로드되었습니다. ${response.data?.meessage || ''}`);
      await fetchData();
      handleModalClose();
    } catch (error) {
      console.error(error);
      alert('업로드 실패');
    }
  };

  return (
    <Modal isOpen={isModalOpen} onClose={handleModalClose}>
      <div className='flex flex-col items-center gap-6 px-20 py-6'>
        <h2 className='font-semiboldbold text-xl'>파일 등록</h2>
        <div
          className='flex h-[110px] w-[300px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 py-4 text-center'
          onClick={handleUploadClick}
        >
          {selectedFile ? (
            <span className='text-base text-gray-700'>{selectedFile.name}</span>
          ) : (
            <>
              <FiUploadCloud className='mb-3 h-8 w-8 text-gray-400' />
              <p className='text-gray-500'>CSV 파일을 업로드할 수 있습니다.</p>
            </>
          )}
          <input
            ref={fileInputRef}
            type='file'
            accept='.csv'
            className='hidden'
            onChange={handleFileChange}
          />
        </div>
        <div className='flex w-full justify-center gap-3 px-8'>
          <AdminButton title={'닫기'} onClick={handleModalClose} />
          <AdminButton title={'등록하기'} onClick={handleRegisterClick} />
        </div>
      </div>
    </Modal>
  );
}
