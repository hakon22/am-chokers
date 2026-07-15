import { useCallback, useState } from 'react';
import axios from 'axios';
import { isEmpty, isNil } from 'lodash';
import { useTranslation } from 'react-i18next';

import { useUserLang } from '@/hooks/useUserLang';
import { routes } from '@/routes';
import { axiosErrorHandler } from '@/utilities/axiosErrorHandler';
import { AiTryOnUserRatingEnum } from '@server/types/ai/enums/ai-try-on-user-rating.enum';
import { AiTryOnVtoTypeEnum } from '@server/types/ai/enums/ai-try-on-vto-type.enum';

interface UseTryOnParams {
  itemId: number;
  isEnabled: boolean;
  vtoType?: AiTryOnVtoTypeEnum | null;
}

interface TryOnCreateResponse {
  code: number;
  tryOnLogId?: number;
  imageSrc?: string;
  imageFormat?: string;
  message?: string;
}

interface TryOnRatingResponse {
  code: number;
  message?: string;
}

/**
 * Хук AI-примерки: модалка, загрузка фото, генерация и оценка результата
 * @param params - идентификатор товара, флаг доступности и тип VTO для UI
 * @returns состояние и методы open/close/submit/rate
 */
export const useTryOn = ({ itemId, isEnabled, vtoType = null }: UseTryOnParams) => {
  const { t } = useTranslation('translation', { keyPrefix: 'modules.tryOn' });
  const { t: tToast } = useTranslation('translation', { keyPrefix: 'toast' });
  const lang = useUserLang();

  const [modalOpen, setModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resultImageSrc, setResultImageSrc] = useState<string | null>(null);
  const [tryOnLogId, setTryOnLogId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rated, setRated] = useState(false);

  /**
   * Сбрасывает результат и ошибки, оставляя модалку открытой или закрывая по флагу
   * @returns void
   */
  const resetResultState = useCallback(() => {
    setUploading(false);
    setLoading(false);
    setResultImageSrc(null);
    setTryOnLogId(null);
    setError(null);
    setRated(false);
  }, []);

  /**
   * Открывает модалку примерки (доступна гостям)
   * @returns void
   */
  const open = useCallback(() => {
    if (!isEnabled) {
      return;
    }
    resetResultState();
    setModalOpen(true);
  }, [isEnabled, resetResultState]);

  /**
   * Закрывает модалку и сбрасывает состояние
   * @returns void
   */
  const close = useCallback(() => {
    setModalOpen(false);
    resetResultState();
  }, [resetResultState]);

  /**
   * Сопоставляет ответ/ошибку лимита с текстом из i18n
   * @param message - текст ошибки с сервера
   * @param status - HTTP-статус, если есть
   * @returns локализованное сообщение
   */
  const resolveErrorMessage = useCallback((message?: string, status?: number): string => {
    if (status === 429) {
      if (!isNil(message) && (message.includes('Daily') || message.includes('суточн'))) {
        return t('errors.rateLimitDaily');
      }
      return t('errors.rateLimitMinute');
    }
    if (!isNil(message) && !isEmpty(message)) {
      if (message.includes('unavailable') || message.includes('недоступна')) {
        return t('errors.unavailableForItemType');
      }
      return message;
    }
    return t('errors.generic');
  }, [t]);

  /**
   * Отправляет загруженное пользовательское фото на примерку
   * @param userImageSrc - относительный путь вида /temp/filename.jpeg
   * @returns void
   */
  const submit = useCallback(async (userImageSrc: string) => {
    if (isEmpty(userImageSrc)) {
      setError(t('errors.generic'));
      return;
    }
    setError(null);
    setLoading(true);
    setResultImageSrc(null);
    setTryOnLogId(null);
    setRated(false);
    try {
      const { data } = await axios.post<TryOnCreateResponse>(routes.integration.tryOn.create, {
        itemId,
        userImageSrc,
        lang,
      }, {
        timeout: 130000,
      });
      if (data.code === 1 && !isNil(data.imageSrc) && !isNil(data.tryOnLogId)) {
        setResultImageSrc(data.imageSrc);
        setTryOnLogId(data.tryOnLogId);
      } else {
        setError(resolveErrorMessage(data.message));
        if (!isNil(data.tryOnLogId)) {
          setTryOnLogId(data.tryOnLogId);
        }
      }
    } catch (e) {
      if (axios.isAxiosError(e)) {
        const status = e.response?.status;
        const responseData = e.response?.data as TryOnCreateResponse | undefined;
        setError(resolveErrorMessage(responseData?.message, status));
      } else {
        axiosErrorHandler(e, tToast);
        setError(t('errors.generic'));
      }
    } finally {
      setLoading(false);
    }
  }, [itemId, lang, resolveErrorMessage, t, tToast]);

  /**
   * Отправляет оценку результата примерки
   * @param rating - GOOD или BAD
   * @returns void
   */
  const rate = useCallback(async (rating: AiTryOnUserRatingEnum) => {
    if (isNil(tryOnLogId) || rated) {
      return;
    }
    try {
      const { data } = await axios.post<TryOnRatingResponse>(routes.integration.tryOn.rating, {
        tryOnLogId,
        rating,
      });
      if (data.code === 1) {
        setRated(true);
      } else if (!isNil(data.message) && !isEmpty(data.message)) {
        setError(data.message);
      }
    } catch (e) {
      axiosErrorHandler(e, tToast);
    }
  }, [rated, tToast, tryOnLogId]);

  return {
    isEnabled,
    vtoType,
    modalOpen,
    uploading,
    setUploading,
    loading,
    resultImageSrc,
    tryOnLogId,
    error,
    rated,
    open,
    close,
    submit,
    rate,
    resetResultState,
  };
};
