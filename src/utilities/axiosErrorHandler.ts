import axios from 'axios';
import type { TFunction } from 'i18next';

import { toast } from '@/utilities/toast';

export const axiosErrorHandler = (e: unknown, t: TFunction, setIsSubmit?: (value: boolean) => void) => {
  if (axios.isAxiosError(e)) {
    toast(e.code === 'ERR_NETWORK' ? t('networkError') : e.response?.data?.error || e.message, 'error');
  } else if (e && typeof e === 'object' && 'message' in e && typeof e.message === 'string') {
    toast(e.message, 'error');
  }
  if (setIsSubmit) {
    setIsSubmit(false);
  }
  console.log(e);
};
