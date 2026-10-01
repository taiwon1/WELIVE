'use client';

import Announce from '@/shared/assets/icons/announce.svg';
import Apartment from '@/shared/assets/icons/apartment.svg';
import Calendar from '@/shared/assets/icons/calendar.svg';
import Complaint from '@/shared/assets/icons/complaint.svg';
import Link from 'next/link';
import List from '@/shared/assets/icons/list.svg';
import Name from '@/shared/assets/icons/name.svg';
import Profile from '@/shared/assets/icons/profile.svg';
import Vote from '@/shared/assets/icons/vote.svg';
import { usePathname } from 'next/navigation';

type UserRole = 'resident' | 'admin' | 'superAdmin';

interface SidebarItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

interface SidebarProps {
  role: UserRole;
}

export default function Sidebar({ role }: SidebarProps) {
  const menuByRole: Record<UserRole, SidebarItem[]> = {
    resident: [
      {
        label: '공지사항',
        path: '/resident/notice',
        icon: <Announce />,
      },
      {
        label: '민원 남기기',
        path: '/resident/civil',
        icon: <Complaint />,
      },
      {
        label: '주민투표',
        path: '/resident/voting',
        icon: <Vote />,
      },
      {
        label: '아파트 일정',
        path: '/resident/schedule',
        icon: <Calendar />,
      },
      {
        label: '내 프로필',
        path: '/resident/profile',
        icon: <Profile />,
      },
    ],
    admin: [
      {
        label: '공지사항',
        path: '/admin/notice',
        icon: <Announce />,
      },
      {
        label: '민원 관리',
        path: '/admin/civil',
        icon: <Complaint />,
      },
      {
        label: '주민투표 관리',
        path: '/admin/voting',
        icon: <Vote />,
      },
      {
        label: '입주민 명부 관리',
        path: '/admin/resident',
        icon: <List />,
      },
      {
        label: '입주민 계정 관리',
        path: '/admin/resident-info',
        icon: <Name />,
      },
      {
        label: '아파트 일정',
        path: '/admin/schedule',
        icon: <Calendar />,
      },
      {
        label: '내 프로필',
        path: '/admin/profile',
        icon: <Profile />,
      },
    ],
    superAdmin: [
      {
        label: '아파트 관리',
        path: '/super-admin',
        icon: <Apartment />,
      },
    ],
  };

  const menu = menuByRole[role];
  const pathname = usePathname();
  return (
    <aside className='min-w-[200px] border-r border-gray-200 pt-[30px] pl-[30px]'>
      <nav className='py-[11px] text-sm'>
        {menu.map((item) => {
          const isActive = pathname?.split('/').slice(0, 3).join('/') === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center gap-3 rounded-md px-2 py-2 ${
                isActive ? 'text-main font-semibold' : 'hover:text-main text-gray-700'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
