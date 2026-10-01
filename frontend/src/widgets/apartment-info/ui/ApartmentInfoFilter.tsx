import Select from '@/shared/Select';
import Input from '@/shared/Input';
import Image from 'next/image';
import Button from '@/shared/Button';

export default function ResidentInfoFilter() {
  const handleSearch = () => {
    alert('검색 실행');
  };

  return (
    <ul className='flex flex-col gap-[25px]'>
      <li>
        <ul className='flex gap-4'>
          <li>
            <Select
              label='동'
              options={[
                { value: '전체', label: '전체' },
                { value: '101동', label: '101동' },
                { value: '102동', label: '102동' },
                { value: '103동', label: '103동' },
                { value: '104동', label: '104동' },
                { value: '105동', label: '105동' },
              ]}
            />
          </li>
          <li>
            <Select
              label='호수'
              options={[
                { value: '전체', label: '전체' },
                { value: '101호', label: '101호' },
                { value: '102호', label: '102호' },
                { value: '103호', label: '103호' },
                { value: '104호', label: '104호' },
                { value: '105호', label: '105호' },
              ]}
            />
          </li>
          <li>
            <Select
              label='거주'
              options={[
                { value: '전체', label: '전체' },
                { value: '거주', label: '거주' },
                { value: '비거주', label: '비거주' },
              ]}
            />
          </li>
          <li>
            <Select
              label='위리브 가입'
              options={[
                { value: '전체', label: '전체' },
                { value: '가입', label: '가입' },
                { value: '미가입', label: '미가입' },
              ]}
            />
          </li>
        </ul>
      </li>
      <li>
        <div className='flex items-center justify-between'>
          <div className='w-[375px]'>
            <Input
              label='검색'
              childrenPosition='left'
              color='search'
              placeholder='검색어를 입력해 주세요'
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearch();
              }}
            >
              <Image src='/icon_search.svg' alt='검색버튼' width={24} height={24} />
            </Input>
          </div>
          <ul className='flex items-center gap-4'>
            <li>
              <Button label='&nbsp;'>파일등록</Button>
            </li>
            <li>
              <Button outline={true} label='&nbsp;'>
                개별 등록
              </Button>
            </li>
            <li>
              <Button color='secondary' outline={true} label='&nbsp;'>
                양식 다운로드
              </Button>
            </li>
            <li>
              <Button color='secondary' outline={true} label='&nbsp;'>
                명부 다운로드
              </Button>
            </li>
          </ul>
        </div>
      </li>
    </ul>
  );
}
