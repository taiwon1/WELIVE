import * as notificationRepository from '../repositories/notification.repository';
import { NotificationDto } from '../types/notification.type';
import { NotFoundError, ForbiddenError } from '../errors/errors';

function toNotificationDto(notification: any): NotificationDto {
  return {
    notificationId: notification.notificationId,
    sourceType: notification.sourceType,
    sourceId: notification.sourceId,
    content: notification.content,
    notificationType: notification.notificationType,
    notifiedAt: notification.notifiedAt instanceof Date ? notification.notifiedAt.toISOString() : notification.notifiedAt,
    isChecked: notification.isChecked,
    complaintId: notification.complaintId,
    noticeId: notification.noticeId,
    pollId: notification.pollId,
  };
}

export async function getUnreadNotifications(userId: string): Promise<NotificationDto[]> {
  const notifications = await notificationRepository.findUnreadNotificationsByUserId(userId);
  return notifications.map(toNotificationDto);
};

export async function readNotification(notificationId: string, userId: string): Promise<NotificationDto> {
  const notification = await notificationRepository.findNotificationById(notificationId);
  if (!notification) throw new NotFoundError('알림을 찾을 수 없습니다.');
  if (notification.userId !== userId) throw new ForbiddenError('접근 권한이 없습니다.');
  const updated = await notificationRepository.markNotificationAsRead(notificationId);
  return toNotificationDto(updated);
  
};


export { toNotificationDto };




















































 