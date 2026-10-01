import { SELECT_OPTIONS } from '@/entities/notice/model/constants';
import Select from '@/shared/Select';

interface Props {
  category: string;
  onChange: (value: string) => void;
}

export default function CategorySelect({ category, onChange }: Props) {
  return (
    <div className='flex gap-3.5'>
      <label className='mt-3 text-sm font-semibold text-black'>분류</label>
      <Select options={SELECT_OPTIONS} defaultValue={category} onChange={onChange} />
    </div>
  );
}
