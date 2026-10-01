import { z } from 'zod';

export const registerSchema = z.object({
  apartmentId: z.string(),
  building: z.string().min(2, '동을 입력해주세요.').regex(/^\d+$/, '동은 숫자만 입력해주세요.'),
  unitNumber: z.string().min(2, '호를 입력해주세요.').regex(/^\d+$/, '호는 숫자만 입력해주세요.'),
  name: z.string().min(1, '이름을 입력해주세요.'),
  contact: z.string().regex(/^010\d{8}$/, '연락처 형식이 올바르지 않습니다.'),
  residenceStatus: z.string(),
  isHouseholder: z.string().min(1, '거주 상태를 선택해주세요.'),
  approvalStatus: z.string(),
});
