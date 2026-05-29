import _ from 'lodash';

export type ApiErrorResponseInterface = {
  error?: string;
  errorKey?: string;
  errorParams?: Record<string, unknown>;
};

const VALIDATION_ERROR_KEY_PREFIX = 'validation.';

/**
 * Проверяет, что сообщение yup — ключ i18n валидации
 * @param message - текст ошибки из ValidationError
 * @returns true, если message начинается с validation.
 */
export const isValidationErrorKey = (message: string): boolean => (
  message.startsWith(VALIDATION_ERROR_KEY_PREFIX)
);

/**
 * Извлекает параметры интерполяции из params yup для ответа API
 * @param params - объект params из ValidationError
 * @returns только max / min для подстановки во фронтовый i18n
 */
export const pickValidationErrorParams = (params: Record<string, unknown> | undefined): Record<string, unknown> | undefined => {
  if (!params) {
    return undefined;
  }
  const result: Record<string, unknown> = {};
  if (!_.isNil(params.max)) {
    result.max = params.max;
  }
  if (!_.isNil(params.min)) {
    result.min = params.min;
  }
  return Object.keys(result).length ? result : undefined;
};

/**
 * Собирает тело JSON-ответа с ошибкой валидации по ключу i18n
 * @param errorKey - ключ перевода (validation.*)
 * @param params - сырые params из ValidationError yup
 * @returns объект для res.json
 */
export const buildValidationErrorResponse = (errorKey: string, params?: Record<string, unknown>): ApiErrorResponseInterface => {
  const errorParams = pickValidationErrorParams(params);
  return errorParams ? { errorKey, errorParams } : { errorKey };
};
