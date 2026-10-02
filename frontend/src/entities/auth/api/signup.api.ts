import axios from '@/shared/lib/axios';
import { ResidentSignupForm } from '../schema/signup.schema';
import { AdminSignupForm } from '../schema/signup.schema';

type ResidentSignupPayload = Omit<ResidentSignupForm, 'passwordConfirm'>;

//입주민 회원가입 API
export const postResidentSignup = async (data: ResidentSignupPayload) => {
  const payload = {
    ...data,
    role: 'USER',
  };
  return axios.post('/auth/signup', payload);
};

//관리자 회원가입 API
export const postAdminSignup = async (data: AdminSignupForm) => {
  const payload = {
    ...data,
    role: 'ADMIN',
  };
  return axios.post('/auth/signup/admin', payload);
};
