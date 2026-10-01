import { z } from 'zod';

export const apartmentEditSchema = z.object({
  name: z.string().min(1, '아파트명을 입력해주세요'),
  address: z.string().min(1, '주소를 입력해주세요'),
  officeNumber: z
    .string()
    .min(1, '관리소 번호를 입력해주세요')
    .regex(/^\d+$/, '숫자만 입력해주세요. 하이픈(-)은 제외해주세요.'),
  description: z.string().min(1, '아파트 소개를 입력해주세요'),
  adminName: z.string().min(1, '관리자명을 입력해주세요'),
  adminContact: z
    .string()
    .min(1, '연락처를 입력해주세요')
    .regex(/^\d+$/, '숫자만 입력해주세요. 하이픈(-)은 제외해주세요.'),
  adminEmail: z.string().email('이메일 형식이 올바르지 않습니다').min(1, '이메일을 입력해주세요'),
});

export type ApartmentEditFormValues = z.infer<typeof apartmentEditSchema>;
