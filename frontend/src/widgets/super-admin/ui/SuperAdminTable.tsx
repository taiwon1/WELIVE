import StatusChip from '@/entities/apartmentRequest/ui/StatusChip';
import { ApartmentRequest } from '@/entities/apartmentRequest/type';
import Image from 'next/image';
import Input from '@/shared/Input';
import Modal from '@/shared/Modal';
import Button from '@/shared/Button';
import { useState, useEffect } from 'react';
import Textarea from '@/shared/Textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  apartmentEditSchema,
  ApartmentEditFormValues,
} from '@/entities/apartmentRequest/schema/apartmentEdit.schema';

import { formatPhoneNum } from '@/shared/hooks/formatPhoneNum';
import {
  updateAdminApprovalStatus,
  deleteAdmin,
  patchUpdateAdmin,
} from '@/entities/auth/api/admin.api';
import { ApprovalStatus } from '@/entities/auth/api/type';

type Props = {
  data: ApartmentRequest[];
  currentPage: number;
  totalCount: number;
};

export default function SuperAdminTable({ data, currentPage, totalCount }: Props) {
  const ITEMS_PER_PAGE = 11;

  const [isOpen, setIsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ApartmentRequest | null>(null);
  const tdClass = 'p-3 text-center text-gray-500';
  const thClass = 'p-3 font-medium';
  const LABEL_STYLE = 'mb-2 text-[14px] text-gray-500 mt-[16px]';

  const handleClose = () => {
    if (selectedItem) {
      reset(selectedItem);
    }
    setIsOpen(false);
  };

  const handleApprove = async (id: string) => {
    try {
      await updateAdminApprovalStatus(id, ApprovalStatus.APPROVED);
      alert('승인 완료');
      window.location.reload();
    } catch (error) {
      console.error(error);
      alert('승인 실패');
    }
  };

  const handleReject = async (id: string) => {
    try {
      await updateAdminApprovalStatus(id, ApprovalStatus.REJECTED);
      alert('거절 완료');
      window.location.reload();
    } catch (error) {
      console.error(error);
      alert('거절 실패');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAdmin(id);
      alert('관리자 삭제 처리 완료');
      window.location.reload();
    } catch (error) {
      console.error(error);
      alert('관리자 삭제 처리 실패');
    }
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty, isValid },
    reset,
  } = useForm<ApartmentEditFormValues>({
    resolver: zodResolver(apartmentEditSchema),
    defaultValues: selectedItem ?? undefined,
    mode: 'onChange',
  });

  useEffect(() => {
    if (selectedItem) {
      reset(selectedItem);
    }
  }, [selectedItem, reset]);

  const onSubmit = async (formData: ApartmentEditFormValues) => {
    if (!selectedItem) return;

    const id = selectedItem.adminId;

    const payload = {
      apartmentName: formData.name,
      apartmentAddress: formData.address,
      apartmentManagementNumber: formData.officeNumber,
      description: formData.description,
      name: formData.adminName,
      contact: formData.adminContact,
      email: formData.adminEmail,
    };

    try {
      await patchUpdateAdmin(id, payload);
      alert('관리자 정보 수정 완료');
      handleClose();
    } catch (error) {
      console.error(error);
      alert('관리자 정보 수정 실패');
    }
  };
  return (
    <>
      <Modal isOpen={isOpen} onClose={handleClose}>
        {selectedItem && (
          <form className='p-6' onSubmit={handleSubmit(onSubmit)}>
            <h3 className='mb-6 text-center text-[18px] font-semibold'>수정하기</h3>

            <Input
              label='아파트명'
              labelClass={LABEL_STYLE}
              {...register('name')}
              errorText={errors.name?.message}
              color={errors.name ? 'error' : 'secondary'}
            />
            <Input
              label='주소'
              labelClass={LABEL_STYLE}
              {...register('address')}
              errorText={errors.address?.message}
              color={errors.address ? 'error' : 'secondary'}
            />
            <Input
              label='관리소 번호'
              labelClass={LABEL_STYLE}
              {...register('officeNumber')}
              errorText={errors.officeNumber?.message}
              color={errors.officeNumber ? 'error' : 'secondary'}
            />
            <Textarea
              label='소개'
              labelClass={LABEL_STYLE}
              {...register('description')}
              errorText={errors.description?.message}
              color={errors.description ? 'error' : 'secondary'}
            />
            <Input
              label='관리자명'
              labelClass={LABEL_STYLE}
              {...register('adminName')}
              errorText={errors.adminName?.message}
              color={errors.adminName ? 'error' : 'secondary'}
            />
            <Input
              label='연락처'
              labelClass={LABEL_STYLE}
              {...register('adminContact')}
              errorText={errors.adminContact?.message}
              color={errors.adminContact ? 'error' : 'secondary'}
            />
            <Input
              label='이메일'
              labelClass={LABEL_STYLE}
              {...register('adminEmail')}
              errorText={errors.adminEmail?.message}
              color={errors.adminEmail ? 'error' : 'secondary'}
            />

            <div className='mt-6 flex justify-center gap-3'>
              <Button outline className='w-[120px]' onClick={handleClose}>
                닫기
              </Button>
              <Button className='w-[120px]' type='submit' disabled={!isDirty || !isValid}>
                수정하기
              </Button>
            </div>
          </form>
        )}
      </Modal>
      <section className='mt-6 w-full rounded-[12px] border border-gray-200 p-8 text-[14px]'>
        <table className='w-full table-fixed'>
          <colgroup>
            <col style={{ width: '100px' }} />
            <col style={{ width: '245px' }} />
            <col />
            <col />
            <col />
            <col />
            <col style={{ width: '100px' }} />
            <col style={{ width: '100px' }} />
          </colgroup>
          <thead>
            <tr>
              <th className={thClass}>
                <div className='line-clamp-1'>No.</div>
              </th>
              <th className={thClass}>
                <div className='line-clamp-1'>아파트명</div>
              </th>
              <th className={thClass}>
                <div className='line-clamp-1'>주소</div>
              </th>
              <th className={thClass}>
                <div className='line-clamp-1'>아파트 관리자명</div>
              </th>
              <th className={thClass}>
                <div className='line-clamp-1'>연락처</div>
              </th>
              <th className={thClass}>
                <div className='line-clamp-1'>이메일</div>
              </th>
              <th className={thClass}>
                <div className='line-clamp-1'>승인 상태</div>
              </th>
              <th className={thClass}>
                <div className='line-clamp-1'>비고</div>
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={item.id}>
                <td className={tdClass}>
                  <div className='line-clamp-1' title={item.id}>
                    {(totalCount - (currentPage - 1) * ITEMS_PER_PAGE - index).toString()}
                  </div>
                </td>
                <td className={tdClass}>
                  <div className='line-clamp-1' title={item.name}>
                    {item.name}
                  </div>
                </td>
                <td className={tdClass}>
                  <div className='line-clamp-1' title={item.address}>
                    {item.address}
                  </div>
                </td>
                <td className={tdClass}>
                  <div className='line-clamp-1' title={item.adminName}>
                    {item.adminName}
                  </div>
                </td>
                <td className={tdClass}>
                  <div className='line-clamp-1' title={item.adminContact}>
                    {formatPhoneNum(item.adminContact)}
                  </div>
                </td>
                <td className={tdClass}>
                  <div className='line-clamp-1' title={item.adminEmail}>
                    {item.adminEmail}
                  </div>
                </td>
                <td className={tdClass}>
                  <div className='line-clamp-1'>
                    <StatusChip type='approval' status={item.apartmentStatus} />
                  </div>
                </td>
                <td className={tdClass}>
                  {item.apartmentStatus === 'PENDING' ? (
                    <ul className='flex items-center justify-center gap-4'>
                      <li>
                        <button
                          className='text-main cursor-pointer'
                          onClick={() => handleApprove(item.adminId)}
                        >
                          승인
                        </button>
                      </li>
                      <li>
                        <button
                          className='cursor-pointer text-gray-300'
                          onClick={() => handleReject(item.adminId)}
                        >
                          거절
                        </button>
                      </li>
                    </ul>
                  ) : (
                    <ul className='flex items-center justify-center gap-4'>
                      <li>
                        <button
                          className='cursor-pointer'
                          onClick={() => {
                            setSelectedItem(item);
                            setIsOpen(true);
                          }}
                        >
                          <Image src='/icon_edit.svg' alt='수정하기' width={20} height={20} />
                        </button>
                      </li>
                      <li>
                        <button
                          className='cursor-pointer'
                          onClick={() => {
                            handleDelete(item.adminId);
                          }}
                        >
                          <Image src='/icon_remove.svg' alt='삭제하기' width={20} height={20} />
                        </button>
                      </li>
                    </ul>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
