import { useContext, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import type { Error } from '@/types/InitialState';
import { SubmitContext } from '@/components/Context';
import { toast } from '@/utilities/toast';

export const useErrorHandler = (...errors: Error[]) => {
  const { t } = useTranslation('translation', { keyPrefix: 'toast' });

  const { setIsSubmit } = useContext(SubmitContext);

  useEffect(() => {
    const errorHandler = (err: string) => {
      const [match] = err.match(/\d+/) ?? '500';
      const codeError = parseInt(match, 10);
      if (codeError === 401) {
        toast(t('authError'), 'error');
      } else {
        toast(err, 'error');
      }
      setIsSubmit(false);
      console.log(err);
    };

    if (errors.find(Boolean)) {
      errors.forEach((error) => (error ? errorHandler(error) : undefined));
    }
  }, [...errors]);
};
