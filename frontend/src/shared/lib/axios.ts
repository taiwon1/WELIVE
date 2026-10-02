import axios from 'axios';

const axiosInstance = axios.create({
  baseURL:
    typeof window === 'undefined'
      ? process.env.INTERNAL_API_BASE_URL || 'http://localhost:4000/api'
      : '/api',
  withCredentials: true,
});

let refreshPromise: Promise<void> | null = null;

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    const isRefreshUrl = originalRequest.url?.includes('/auth/refresh');

    const isAuthUrl =
      originalRequest.url?.includes('/auth/login') ||
      originalRequest.url?.includes('/auth/signup') ||
      originalRequest.url?.includes('/auth/user/password');

    if (error.response?.status === 401 && !originalRequest._retry && !isRefreshUrl && !isAuthUrl) {
      originalRequest._retry = true;

      try {
        refreshPromise ??= axiosInstance.post('/auth/refresh').then(() => undefined);
        await refreshPromise.finally(() => {
          refreshPromise = null;
        });
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        console.error('리프레시 에러', refreshError);
        if (typeof window !== 'undefined') {
          window.location.replace(new URL('/', window.location.origin).toString());
        }
      }
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;
