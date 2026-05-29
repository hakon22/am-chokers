import axios from 'axios';
import type { TFunction } from 'i18next';

import i18n from '@/locales';
import { toast } from '@/utilities/toast';

type ApiErrorBodyInterface = {
  error?: string;
  errorKey?: string;
  errorParams?: Record<string, unknown>;
};

/**
 * Возвращает локализованный текст ошибки API
 * @param data - тело ответа сервера с error или errorKey
 * @param t - функция перевода с keyPrefix (например toast), используется как fallback
 * @returns строка для toast
 */
const resolveApiErrorMessage = (data: ApiErrorBodyInterface | undefined): string | undefined => {
  if (data?.errorKey) {
    const translated = i18n.t(data.errorKey, data.errorParams ?? {});
    if (translated !== data.errorKey) {
      return translated;
    }
  }
  if (data?.error) {
    return data.error;
  }
  return undefined;
};

export const axiosErrorHandler = (e: unknown, t: TFunction, setIsSubmit?: (value: boolean) => void) => {
  if (axios.isAxiosError(e)) {
    const message = e.code === 'ERR_NETWORK'
      ? t('networkError')
      : resolveApiErrorMessage(e.response?.data as ApiErrorBodyInterface | undefined) ?? e.message;
    toast(message, 'error');
  } else if (e && typeof e === 'object' && 'message' in e && typeof e.message === 'string') {
    toast(e.message, 'error');
  }
  if (setIsSubmit) {
    setIsSubmit(false);
  }
  console.log(e);
};
