import AdminButton from '../entities/admin-resident/ui/AdminButton';
import { DeleteModalProps } from '../entities/admin-resident/model/adminNotice.types';
import Modal from '@/shared/Modal';

export default function DeleteModal({ isModalOpen, setIsModalOpen, onDelete }: DeleteModalProps) {
  return (
    <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
      <div className='flex flex-col items-center gap-6 px-20 py-6'>
        <h2 className='text-xl font-semibold'>정말 삭제하시겠습니까?</h2>
        <p className='text-center text-sm text-gray-500'>이 작업은 되돌릴 수 없습니다.</p>

        <div className='flex w-full justify-center gap-3 px-8'>
          <AdminButton title='닫기' onClick={() => setIsModalOpen(false)} />
          <AdminButton
            title='삭제하기'
            onClick={() => {
              onDelete();
              setIsModalOpen(false);
            }}
          />
        </div>
      </div>
    </Modal>
  );
}
