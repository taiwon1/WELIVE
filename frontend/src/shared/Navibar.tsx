import { useEffect, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import NotificationPanel from './NotificationPanel';
import axiosInstance from './lib/axios';
import { useAuthStore } from './store/auth.store';
import { useRouter } from 'next/router';

export interface Notification {
  notificationId: string;
  content: string;
  notificationType: string;
  notifiedAt: string;
  isChecked: boolean;
  complaintId?: string;
  noticeId?: string;
  pollId?: string;
}

export default function Navibar() {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const user = useAuthStore((state) => state.user);
  const clearUser = useAuthStore((state) => state.clearUser);
  const router = useRouter();
  const role = useAuthStore((state) => state.user?.role);

  // 읽지 않은 알림 개수
  const unreadCount = notifications.filter((n) => !n.isChecked).length;

  // 역할별 링크
  const getLinkByRole = (role?: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return '/super-admin';
      case 'ADMIN':
        return '/admin/notice';
      case 'USER':
        return '/resident/notice';
      default:
        return '/';
    }
  };

  // 로그아웃 처리
  async function handleLogout() {
    try {
      const res = await axiosInstance.post('/auth/logout');
      if (res.status === 200 || res.status === 201) {
        clearUser();
        router.replace('/');
      } else {
        alert('로그아웃에 실패했습니다.');
      }
    } catch (error) {
      console.error('로그아웃 실패:', error);
      alert('로그아웃 중 오류가 발생했습니다.');
    }
  }

  // 알림 토글 함수
  const toggleNotification = () => setIsNotificationOpen((prev) => !prev);

  // SSE 연결
  useEffect(() => {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '');
    if (!baseUrl) {
      console.error('BASE_URL is undefined');
      return;
    }

    const eventSource = new EventSource(`${baseUrl}/notifications/sse`, {
      withCredentials: true,
    });

    eventSource.addEventListener('alarm', (event) => {
      try {
        const newNotifications: Notification[] = JSON.parse(event.data);
        setNotifications((prev) => {
          const existingIds = new Set(prev.map((n) => n.notificationId));
          const filtered = newNotifications.filter((n) => !existingIds.has(n.notificationId));
          return filtered.length > 0 ? [...filtered, ...prev] : prev;
        });
      } catch (error) {
        console.error('알림 데이터 파싱 에러:', error);
      }
    });

    eventSource.onerror = (err) => {
      console.error('SSE 연결 에러:', err);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, []);

  // 알람 읽음 함수
  async function markAsRead(notificationId: string) {
    try {
      const response = await axiosInstance.patch(`/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      console.error('알림읽음 처리함수 에러', error);
      throw error;
    }
  }

  return (
    <div className='z-10 h-[72px] border-b border-gray-200 px-[50px] py-[18px]'>
      <div className='flex h-full items-center justify-between'>
        {/* 메인로고 */}
        <Link href={getLinkByRole(role)}>
          <Image src='/img/logo.svg' alt='WeLive Logo' width={81} height={30} priority />
        </Link>

        {/* 알림 및 유저 정보 */}
        <div className='flex items-center justify-center gap-10'>
          {/* 알림 아이콘 */}
          <div className='relative'>
            <Image
              src='/img/Bell.svg'
              alt='알림'
              width={24}
              height={24}
              priority
              className='cursor-pointer text-gray-500'
              onClick={toggleNotification}
            />
            {/* 빨간 점 표시 */}
            {unreadCount > 0 && (
              <span className='absolute bottom-0 left-5 h-2 w-2 -translate-x-1/2 translate-y-1/2 rounded-full border-2 border-white bg-red-500' />
            )}
            {isNotificationOpen && (
              <NotificationPanel
                notifications={notifications}
                setNotifications={setNotifications}
                onClose={toggleNotification}
                onMarkAsRead={markAsRead}
              />
            )}
          </div>

          {/* 유저 이미지 및 이름 */}
          <div className='flex items-center gap-2.5'>
            <Image
              src={user?.avatar ?? '/img/userImage.svg'}
              alt='유저 이미지'
              width={36}
              height={36}
              priority
              className='rounded-full object-cover'
            />
            <p className='text-gray-500'>{user?.name ?? '사용자'}</p>
          </div>

          {/* 로그아웃 */}
          <button className='text-gray-300 hover:text-gray-500' onClick={handleLogout}>
            로그아웃
          </button>
        </div>
      </div>
    </div>
  );
}
