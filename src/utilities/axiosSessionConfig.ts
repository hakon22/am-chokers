import axios from 'axios';

/**
 * Конфиг axios для запросов с httpOnly refresh cookie
 */
export const axiosSessionConfig = {
  withCredentials: true,
} as const;

/**
 * Включает отправку cookie во всех axios-запросах клиента
 */
export const enableAxiosSessionCredentials = (): void => {
  axios.defaults.withCredentials = true;
};
