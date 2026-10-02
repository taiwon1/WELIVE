import VotingSelector from '@/entities/voting/ui/VotingSelector';
import type { VotingDetail } from '@/entities/voting/type';

interface VotingDetailContentProps {
  data: VotingDetail;
}

export default function VotingDetailContent({ data }: VotingDetailContentProps) {
  return (
    <div className='mt-[37px]'>
      <div className='w-full border-b border-gray-100 pb-[60px]'>
        <span className='text-[18px] text-black'>{data.content}</span>
      </div>
      <VotingSelector
        status={data.status}
        options={data.options}
        endAt={data.endDate}
        pollId={data.pollId}
        buildingPermission={data.buildingPermission}
      />
    </div>
  );
}
