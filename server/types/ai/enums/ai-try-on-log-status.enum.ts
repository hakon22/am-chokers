export enum AiTryOnLogStatusEnum {
  /** Фото отклонено на этапе validation */
  VALIDATION_REJECTED = 'VALIDATION_REJECTED',
  /** Успешная генерация */
  SUCCESS = 'SUCCESS',
  /** Ошибка детекции / генерации */
  GENERATION_FAILED = 'GENERATION_FAILED',
  /** Ошибка провайдера / инфраструктуры */
  PROVIDER_ERROR = 'PROVIDER_ERROR',
}
