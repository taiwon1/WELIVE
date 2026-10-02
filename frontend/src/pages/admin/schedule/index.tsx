import Calendar from '@/entities/calender/ui/Calendar';
import { addLayout } from '@/shared/lib/addLayout';

export default function AdminSchedule() {
  return (
    <div>
      <h1 className='mb-[40px] text-[26px] font-bold'>아파트 일정</h1>
      <Calendar />
    </div>
  );
}

AdminSchedule.getLayout = addLayout('admin');
