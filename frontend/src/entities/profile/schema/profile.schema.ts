import { z } from 'zod';

export const profileSchema = z
  .object({
    currentPassword: z
      .string()
      .transform((val) => (val === '' ? undefined : val))
      .optional(),

    newPassword: z
      .string()
      .transform((val) => (val === '' ? undefined : val))
      .optional()
      .refine(
        (val) =>
          !val ||
          /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()\-_=+[\]{};:'",.<>/?\\|`~]).{8,}$/.test(val),
        {
          message: '영문, 숫자, 특수문자를 모두 포함해야 합니다.',
        },
      ),

    confirmPassword: z
      .string()
      .transform((val) => (val === '' ? undefined : val))
      .optional(),
  })
  .superRefine((data, ctx) => {
    const isChangingPassword =
      data.currentPassword !== undefined ||
      data.newPassword !== undefined ||
      data.confirmPassword !== undefined;

    if (isChangingPassword) {
      if (!data.currentPassword) {
        ctx.addIssue({
          path: ['currentPassword'],
          message: '현재 비밀번호를 입력해주세요',
          code: z.ZodIssueCode.custom,
        });
      }
      if (!data.newPassword) {
        ctx.addIssue({
          path: ['newPassword'],
          message: '새 비밀번호를 입력해주세요',
          code: z.ZodIssueCode.custom,
        });
      }
      if (data.newPassword !== data.confirmPassword) {
        ctx.addIssue({
          path: ['confirmPassword'],
          message: '비밀번호가 일치하지 않습니다.',
          code: z.ZodIssueCode.custom,
        });
      }
    }
  });
