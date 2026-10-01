import { NotificationSourceType } from '@prisma/client';

export type NotificationEventType = 'alarm';

export type NotificationType =
  | 'COMPLAINT_CREATED'
  | 'COMPLAINT_RESOLVED'
  | 'NOTICE_CREATED'
  | 'POLL_CREATED'
  | 'INCIDENT_UPDATED';

export interface NotificationDto {
  sourceType?: NotificationSourceType | null;
  sourceId?: string | null;
  notificationId: string;
  content: string;
  notificationType: NotificationType;
  notifiedAt: string;
  isChecked: boolean;
  complaintId?: string | null;
  noticeId?: string | null;
  pollId?: string | null;
};

export interface NotificationSsePayload {
  type: 'alarm';
  data: NotificationDto[];
};

export interface CreateNotificationInput {
  userId: string;
  content: string;
  notificationType: NotificationType;
  dedupeKey?: string;
  complaintId?: string | null;
  noticeId?: string | null;
  pollId?: string | null;
  sourceType?: NotificationSourceType | null;
  sourceId?: string | null;
  title?: string | null;
};

// ─── Helper input 타입 ────────────────────────────────────────────────────────

export type CreateComplaintNotificationInput = {
  userId: string;
  complaintId: string;
  content: string;
  title?: string;
};

export type CreateNoticeCreatedNotificationInput = {
  userId: string;
  noticeId: string;
  content: string;
  title?: string;
};

export type CreatePollCreatedNotificationInput = {
  userId: string;
  pollId: string;
  content: string;
  title?: string;
};

export type CreateNoticeCreatedNotificationsForUsersInput = {
  userIds: string[];
  noticeId: string;
  content: string;
  title?: string;
};

export type CreatePollCreatedNotificationsForUsersInput = {
  userIds: string[];
  pollId: string;
  content: string;
  title?: string;
};
