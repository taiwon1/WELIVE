import { z } from 'zod';

export const votingFormSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요'),
  content: z.string().min(1, '내용을 입력해주세요'),
  buildingPermission: z.string(),
  startDate: z.string().min(1, '시작일을 선택해주세요'),
  endDate: z.string().min(1, '종료일을 선택해주세요'),
  options: z
    .array(
      z.object({
        value: z.string().min(1, '항목을 입력해주세요'),
        enabled: z.boolean(),
      }),
    )
    .min(1, '투표 항목은 하나 이상 필요합니다.'),
});
export type VotingFormType = z.infer<typeof votingFormSchema>;
