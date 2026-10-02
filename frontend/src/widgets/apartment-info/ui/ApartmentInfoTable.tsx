import StatusChip from '@/entities/apartment-info/ui/StatusChip';
import { apartmentInfoType } from '@/entities/apartment-info/type';
import Image from 'next/image';
import Modal from '@/shared/Modal';
import { useState } from 'react';
import Input from '@/shared/Input';
import Button from '@/shared/Button';
import Textarea from '@/shared/Textarea';

type Props = {
  data: apartmentInfoType[];
};

export default function ResidentInfoTable({ data }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const handleClose = () => setIsOpen(false);

  const tdClass = 'p-3 text-center text-gray-500';
  const thClass = 'p-3 font-medium';

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleClose}>
        <div className='p-6'>
          <h3 className='mb-6 text-center text-[18px] font-semibold'>아파트 정보 수정하기</h3>
          <ul className='flex flex-col gap-6'>
            <li>
              <Input label='아파트명' defaultValue={'코드잇마운틴아파트'} />
            </li>
            <li>
              <Textarea
                label='아파스 소개'
                defaultValue={
                  '대지면적 25,346.9m² 철근 콘크리트 벽식 구조의 아파트로 시행회사는 KT, 시공회사는 현대건설(주) 사업승인일은 2005.'
                }
              />
            </li>
            <li>
              <Input label='주소' defaultValue={'서울 중구 삼일대로 343'} />
            </li>
            <li>
              <Input label='관리소 번호' defaultValue={'031-972-2920'} />
            </li>
          </ul>

          <div className='mt-6 flex justify-center gap-3'>
            <Button outline={true} className='w-[120px]' onClick={handleClose}>
              닫기
            </Button>
            <Button className='w-[120px]'>수정하기</Button>
          </div>
        </div>
      </Modal>

      <section className='mt-6 w-full rounded-[12px] border border-gray-200 p-8 text-[14px]'>
        <table className='w-full table-fixed'>
          <colgroup>
            <col style={{ width: '100px' }} />
            <col style={{ width: '180px' }} />
            <col />
            <col style={{ width: '180px' }} />
            <col style={{ width: '180px' }} />
            <col style={{ width: '180px' }} />
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
                <div className='line-clamp-1'>아파트 소개</div>
              </th>
              <th className={thClass}>
                <div className='line-clamp-1'>주소</div>
              </th>
              <th className={thClass}>
                <div className='line-clamp-1'>관리소 번호</div>
              </th>
              <th className={thClass}>
                <div className='line-clamp-1'>작성 일시</div>
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
            {data.map((item) => (
              <tr key={item.id}>
                <td className={tdClass}>
                  <div className='line-clamp-1' title={String(item.id)}>
                    {item.id}
                  </div>
                </td>
                <td className={tdClass}>
                  <div className='line-clamp-1' title={String(item.apartmentName)}>
                    {item.apartmentName}
                  </div>
                </td>
                <td className={tdClass}>
                  <div className='line-clamp-1' title={String(item.apartmentInfo)}>
                    {item.apartmentInfo}
                  </div>
                </td>
                <td className={tdClass}>
                  <div className='line-clamp-1' title={String(item.address)}>
                    {item.address}
                  </div>
                </td>
                <td className={tdClass}>
                  <div className='line-clamp-1' title={String(item.phone)}>
                    {item.phone}
                  </div>
                </td>
                <td className={tdClass}>
                  <div className='line-clamp-1' title={String(item.date)}>
                    {item.date}
                  </div>
                </td>
                <td className={tdClass}>
                  <div className='line-clamp-1'>
                    <StatusChip status={item.approvalStatus} />
                  </div>
                </td>
                <td className={tdClass}>
                  <div className='line-clamp-1'>
                    {item.approvalStatus === '대기' ? (
                      // approvalStatus가 대기 일 경우만
                      <ul className='flex items-center justify-center gap-4'>
                        <li>
                          <button className='text-main cursor-pointer'>승인</button>
                        </li>
                        <li>
                          <button className='cursor-pointer text-gray-300'>거절</button>
                        </li>
                      </ul>
                    ) : (
                      // approvalStatus가 거절 승인 일 경우만
                      <ul className='flex items-center justify-center gap-4'>
                        <li className='leading-0'>
                          <button className='cursor-pointer' onClick={() => setIsOpen(true)}>
                            <Image src='/icon_edit.svg' alt='수정하기' width='20' height='20' />
                          </button>
                        </li>
                        <li className='leading-0'>
                          <button className='cursor-pointer' onClick={() => alert('삭제')}>
                            <Image src='/icon_remove.svg' alt='삭제하기' width='20' height='20' />
                          </button>
                        </li>
                      </ul>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
