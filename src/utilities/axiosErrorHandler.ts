import axios from 'axios';
import type { TFunction } from 'i18next';
import toast from '@/utilities/toast';

const axiosErrorHandler = (e: unknown, t: TFunction, setIsSubmit?: (value: boolean) => void) => {
  if (axios.isAxiosError(e)) {
    toast(e.code === 'ERR_NETWORK' ? t('networkError') : t('unknownError', { error: e.message }), 'error');
  }
  if (setIsSubmit) {
    setIsSubmit(false);
  }
  console.log(e);
};

export default axiosErrorHandler;
