import Input from '@/shared/Input';
import { formatPhoneNum } from '@/shared/hooks/formatPhoneNum';

interface ProfileReadOnlyProps {
  username: string;
  contact: string;
  name: string;
  email: string;
}

export default function ProfileReadOnly({ username, contact, name, email }: ProfileReadOnlyProps) {
  const LABEL_STYLE = 'mb-2 block text-sm text-gray-500';
  return (
    <div className='mt-[38px] mb-[24px] flex flex-col gap-[24px]'>
      <div>
        <label id={username} className={LABEL_STYLE}>
          아이디
        </label>
        <Input readOnly={true} id={username} value={username} />
      </div>
      <div>
        <label id={contact} className={LABEL_STYLE}>
          연락처
        </label>
        <Input readOnly={true} id={contact} value={formatPhoneNum(contact)} />
      </div>
      <div>
        <label id={name} className={LABEL_STYLE}>
          이름
        </label>
        <Input readOnly={true} id={name} value={name} />
      </div>
      <div>
        <label id={email} className={LABEL_STYLE}>
          이메일
        </label>
        <Input readOnly={true} id={email} value={email} />
      </div>
    </div>
  );
}
