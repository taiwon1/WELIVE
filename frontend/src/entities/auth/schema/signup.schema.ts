import { z } from 'zod';

const PASSWORD_MIN_LENGTH = 8;
const ID_MAX_LENGTH = 30;
const NAME_MIN_LENGTH = 2;
const ID_MIN_LENGTH = 5;

export const AUTH_VALIDATION = {
  EMAIL: {
    REQUIRED_MESSAGE: '이메일을 입력해주세요',
    INVALID_MESSAGE: '이메일 형식으로 작성해 주세요.',
  },
  ID: {
    REQUIRED_MESSAGE: '아이디를 입력해주세요',
    MIN_LENGTH: ID_MIN_LENGTH,
    MIN_MESSAGE: '아이디는 최소 5자 이상입니다.',
    MAX_LENGTH: ID_MAX_LENGTH,
    MAX_MESSAGE: `아이디는 최대 ${ID_MAX_LENGTH}자까지 가능합니다.`,
  },
  PASSWORD: {
    MIN_LENGTH: PASSWORD_MIN_LENGTH,
    MIN_MESSAGE: `비밀번호는 최소 ${PASSWORD_MIN_LENGTH}자 이상입니다.`,
  },
  PASSWORD_CONFIRMATION: {
    REQUIRED_MESSAGE: '비밀번호 확인을 입력해 주세요.',
    MISMATCH_MESSAGE: '비밀번호가 일치하지 않습니다.',
  },
  CONTACT: {
    REQUIRED_MESSAGE: '연락처를 입력해주세요',
  },
  NAME: {
    MIN_LENGTH: NAME_MIN_LENGTH,
    MIN_MESSAGE: '이름을 입력해주세요',
  },
  APARTMENT_NAME: {
    REQUIRED_MESSAGE: '아파트명을 입력해주세요',
  },
};

export const numberFieldSchema = (label: string) =>
  z
    .string()
    .min(1, `${label}를 입력해주세요`)
    .max(2, `${label}는 두 자리까지만 입력 가능합니다`)
    .regex(/^[1-9][0-9]?$/, `${label}는 0으로 시작할 수 없고 숫자만 입력 가능합니다`);

//관리자 회원가입 스키마
export const adminSignupSchema = z
  .object({
    username: z
      .string()
      .nonempty(AUTH_VALIDATION.ID.REQUIRED_MESSAGE)
      .min(AUTH_VALIDATION.ID.MIN_LENGTH, AUTH_VALIDATION.ID.MIN_MESSAGE)
      .max(AUTH_VALIDATION.ID.MAX_LENGTH, AUTH_VALIDATION.ID.MAX_MESSAGE),

    password: z
      .string()
      .min(AUTH_VALIDATION.PASSWORD.MIN_LENGTH, AUTH_VALIDATION.PASSWORD.MIN_MESSAGE)
      .regex(
        /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()\-_=+[\]{};:'",.<>/?\\|`~]).{8,}$/,
        '영문, 숫자, 특수문자를 모두 포함해야 합니다.',
      ),

    passwordConfirm: z.string().min(1, AUTH_VALIDATION.PASSWORD_CONFIRMATION.REQUIRED_MESSAGE),

    contact: z
      .string()
      .min(1, AUTH_VALIDATION.CONTACT.REQUIRED_MESSAGE)
      .regex(/^\d+$/, '숫자만 입력해주세요. 하이픈(-)은 제외해주세요.'),

    name: z.string().min(AUTH_VALIDATION.NAME.MIN_LENGTH, AUTH_VALIDATION.NAME.MIN_MESSAGE),

    email: z
      .string()
      .min(1, AUTH_VALIDATION.EMAIL.REQUIRED_MESSAGE)
      .email(AUTH_VALIDATION.EMAIL.INVALID_MESSAGE),

    apartmentName: z.string().min(1, AUTH_VALIDATION.APARTMENT_NAME.REQUIRED_MESSAGE),

    apartmentAddress: z.string().min(1, '아파트 주소를 입력해주세요'),

    apartmentManagementNumber: z.string().min(1, '관리소 번호를 입력해주세요'),

    description: z.string().min(1, '아파트 소개를 입력해주세요'),
    startComplexNumber: numberFieldSchema('단지'),

    endComplexNumber: numberFieldSchema('단지'),

    startDongNumber: numberFieldSchema('동'),

    endDongNumber: numberFieldSchema('동'),

    startFloorNumber: numberFieldSchema('층'),

    endFloorNumber: numberFieldSchema('층'),

    startHoNumber: numberFieldSchema('호'),

    endHoNumber: numberFieldSchema('호'),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    path: ['passwordConfirm'],
    message: AUTH_VALIDATION.PASSWORD_CONFIRMATION.MISMATCH_MESSAGE,
  });

export type AdminSignupForm = z.infer<typeof adminSignupSchema>;

//입주민 회원가입 스키마
export const residentSignupSchema = (apartmentList: string[]) =>
  z
    .object({
      username: z
        .string()
        .nonempty(AUTH_VALIDATION.ID.REQUIRED_MESSAGE)
        .min(AUTH_VALIDATION.ID.MIN_LENGTH, AUTH_VALIDATION.ID.MIN_MESSAGE)
        .max(AUTH_VALIDATION.ID.MAX_LENGTH, AUTH_VALIDATION.ID.MAX_MESSAGE),
      password: z
        .string()
        .min(AUTH_VALIDATION.PASSWORD.MIN_LENGTH, AUTH_VALIDATION.PASSWORD.MIN_MESSAGE)
        .regex(
          /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()\-_=+[\]{};:'",.<>/?\\|`~]).{8,}$/,
          '영문, 숫자, 특수문자를 모두 포함해야 합니다.',
        ),
      passwordConfirm: z.string().min(1, AUTH_VALIDATION.PASSWORD_CONFIRMATION.REQUIRED_MESSAGE),
      contact: z
        .string()
        .min(1, AUTH_VALIDATION.CONTACT.REQUIRED_MESSAGE)
        .regex(/^\d+$/, '숫자만 입력해주세요. 하이픈(-)은 제외해주세요.'),
      name: z.string().min(AUTH_VALIDATION.NAME.MIN_LENGTH, AUTH_VALIDATION.NAME.MIN_MESSAGE),
      email: z
        .string()
        .min(1, AUTH_VALIDATION.EMAIL.REQUIRED_MESSAGE)
        .email(AUTH_VALIDATION.EMAIL.INVALID_MESSAGE),
      apartmentName: z
        .string()
        .min(1, AUTH_VALIDATION.APARTMENT_NAME.REQUIRED_MESSAGE)
        .refine((val) => apartmentList.includes(val.trim()), {
          message: '존재하지 않는 아파트명입니다.',
        }),
      apartmentDong: z.string().min(1, '아파트 동을 선택해주세요'),
      apartmentHo: z.string().min(1, '아파트 호수를 선택해주세요'),
    })
    .refine((data) => data.password === data.passwordConfirm, {
      path: ['passwordConfirm'],
      message: AUTH_VALIDATION.PASSWORD_CONFIRMATION.MISMATCH_MESSAGE,
    });

export type ResidentSignupForm = z.infer<ReturnType<typeof residentSignupSchema>>;
