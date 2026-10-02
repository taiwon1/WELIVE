import Button from '@/shared/Button';
import Image from 'next/image';
import Modal from '@/shared/Modal';
import { useEffect, useState } from 'react';
import Input from '@/shared/Input';
import Select from '@/shared/Select';
import StatusChip from '@/entities/resident-info/ui/StatusChip';
import axios from '@/shared/lib/axios';
import { residentInfoType } from '@/entities/resident-info/type';
import { useApartmentOptions } from '@/entities/civil/model/useApartmentOptions';
import { updateResidentApprovalStatus } from '@/entities/auth/api/resident.api';
import { ApprovalStatus } from '@/entities/auth/api/type';

type Props = {
  data: residentInfoType[];
  totalCount: number;
  currentPage: number;
  itemsPerPage: number;
};

export default function ResidentInfoTable({ data, totalCount, currentPage, itemsPerPage }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [editData, setEditData] = useState<residentInfoType | null>(null);
  const { dongOptions, hoOptions } = useApartmentOptions();

  const [form, setForm] = useState({
    building: '',
    unitNumber: '',
    contact: '',
    name: '',
    isHouseholder: 'HOUSEHOLDER',
  });

  const handleClose = () => {
    setIsOpen(false);
    setEditData(null);
  };

  useEffect(() => {
    if (editData) {
      setForm({
        building: editData.building || '',
        unitNumber: editData.unitNumber || '',
        contact: editData.contact || '',
        name: editData.name || '',
        isHouseholder: editData.isHouseholder || 'HOUSEHOLDER',
      });
    }
  }, [editData]);

  const handleChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleUpdate = async () => {
    if (!editData) return;

    try {
      await axios.patch(`/residents/${editData.id}`, form);
      alert('수정 완료');
      location.reload();
    } catch {
      alert('수정 실패');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      await axios.delete(`/residents/${id}`);
      alert('삭제 완료');
      location.reload();
    } catch {
      alert('삭제 실패');
    }
  };

  const getApprovalLabel = (status: string) => {
    if (status === 'PENDING') return '대기';
    if (status === 'APPROVED') return '승인';
    if (status === 'REJECTED') return '거절';
    return status;
  };

  const handleApprove = async (id: string) => {
    try {
      await updateResidentApprovalStatus(id, ApprovalStatus.APPROVED);
      alert('승인 완료');
      location.reload();
    } catch {
      alert('승인 실패');
    }
  };

  const handleReject = async (id: string) => {
    try {
      await updateResidentApprovalStatus(id, ApprovalStatus.REJECTED);
      alert('거절 완료');
      location.reload();
    } catch {
      alert('거절 실패');
    }
  };

  const tdClass = 'p-3 text-center text-gray-500';
  const thClass = 'p-3 font-medium';

  const registeredData = data.filter((item) => item.isRegistered === true);
  const finalDongOptions = dongOptions.some((opt) => opt.value === form.building)
    ? dongOptions
    : [...dongOptions, { value: form.building, label: `${form.building}동` }];
  const finalHoOptions = hoOptions.some((opt) => opt.value === form.unitNumber)
    ? hoOptions
    : [...hoOptions, { value: form.unitNumber, label: `${form.unitNumber}호` }];

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleClose}>
        <div className='p-6'>
          <h3 className='mb-6 text-center text-[18px] font-semibold'>계정 수정하기</h3>
          <ul className='flex flex-col gap-6'>
            <li>
              <Select
                options={finalDongOptions}
                label='동'
                width='100%'
                value={form.building}
                onChange={(val) => handleChange('building', val)}
              />
            </li>
            <li>
              <Select
                options={finalHoOptions}
                label='호'
                width='100%'
                value={form.unitNumber}
                onChange={(val) => handleChange('unitNumber', val)}
              />
            </li>
            <li>
              <Input
                label='이름'
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
              />
            </li>
            <li>
              <Input
                label='연락처'
                value={form.contact}
                onChange={(e) => handleChange('contact', e.target.value)}
              />
            </li>
            <li>
              <Select
                options={[
                  { value: 'HOUSEHOLDER', label: '세대주' },
                  { value: 'MEMBER', label: '세대원' },
                ]}
                label='세대 구분'
                width='100%'
                value={form.isHouseholder}
                onChange={(val) => handleChange('isHouseholder', val)}
              />
            </li>
          </ul>

          <div className='mt-6 flex justify-center gap-3'>
            <Button outline className='w-[130px]' onClick={handleClose}>
              닫기
            </Button>
            <Button className='w-[130px]' onClick={handleUpdate}>
              수정하기
            </Button>
          </div>
        </div>
      </Modal>

      <section className='mt-6 w-full rounded-[12px] border border-gray-200 p-8 text-[14px]'>
        <table className='w-full table-fixed'>
          <colgroup>
            <col style={{ width: '100px' }} />
            <col />
            <col />
            <col />
            <col />
            <col />
            <col style={{ width: '100px' }} />
            <col style={{ width: '100px' }} />
          </colgroup>
          <thead>
            <tr>
              <th className={thClass}>No.</th>
              <th className={thClass}>동</th>
              <th className={thClass}>호</th>
              <th className={thClass}>이름</th>
              <th className={thClass}>연락처</th>
              <th className={thClass}>이메일</th>
              <th className={thClass}>승인 상태</th>
              <th className={thClass}>비고</th>
            </tr>
          </thead>
          <tbody>
            {registeredData.length === 0 ? (
              <tr>
                <td colSpan={7} className='p-6 text-center text-gray-400'>
                  해당 입주민 계정이 없습니다.
                </td>
              </tr>
            ) : (
              registeredData.map((item, index) => {
                const no = totalCount - ((currentPage - 1) * itemsPerPage + index);
                return (
                  <tr key={item.id}>
                    <td className={tdClass}>{no}</td>
                    <td className={tdClass}>{String(Number(item.building))}</td>
                    <td className={tdClass}>{String(Number(item.unitNumber))}</td>
                    <td className={tdClass}>{item.name}</td>
                    <td className={tdClass}>
                      {item.contact.replace(/(\d{3})(\d{3,4})(\d{4})/, '$1-$2-$3')}
                    </td>
                    <td className={tdClass}>{item.email}</td>
                    <td className={tdClass}>
                      <StatusChip status={getApprovalLabel(item.approvalStatus)} />
                    </td>
                    <td className={tdClass}>
                      {item.approvalStatus === 'PENDING' ? (
                        <ul className='flex items-center justify-center gap-4'>
                          <li>
                            <button
                              className='text-main cursor-pointer'
                              onClick={() => handleApprove(String(item.id))}
                            >
                              승인
                            </button>
                          </li>
                          <li>
                            <button
                              className='cursor-pointer text-gray-300'
                              onClick={() => handleReject(String(item.id))}
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
                                setEditData(item);
                                setIsOpen(true);
                              }}
                            >
                              <Image src='/icon_edit.svg' alt='수정하기' width={20} height={20} />
                            </button>
                          </li>
                          <li>
                            <button
                              className='cursor-pointer'
                              onClick={() => handleDelete(String(item.id))}
                            >
                              <Image src='/icon_remove.svg' alt='삭제하기' width={20} height={20} />
                            </button>
                          </li>
                        </ul>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </section>
    </>
  );
}
