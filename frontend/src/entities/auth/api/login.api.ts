import { LoginForm } from '../schema/login.schema';
import axios from '@/shared/lib/axios';

export const postLogin = async (data: LoginForm) => {
  return axios.post('/auth/login', data);
};
