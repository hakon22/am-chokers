/** Ключи i18n для ошибок валидации настроек сайта */
export enum SiteSettingsValidationKeyEnum {
  FIELD_REQUIRED = 'validation.siteSettings.fieldRequired',
  PICKUP_BLOCKED_DATE_RANGE_INVALID = 'validation.siteSettings.pickupBlockedDateRangeInvalid',
  PICKUP_BLOCKED_DATE_INVALID_FORMAT = 'validation.siteSettings.pickupBlockedDateInvalidFormat',
  PICKUP_BLOCKED_DATE_END_BEFORE_START = 'validation.siteSettings.pickupBlockedDateEndBeforeStart',
  PICKUP_AT_LEAST_ONE_FIELD = 'validation.siteSettings.pickupAtLeastOneField',
  PICKUP_BLOCKED_RANGES_MAX = 'validation.siteSettings.pickupBlockedRangesMax',
  PICKUP_LOCATION_LABEL_MAX = 'validation.siteSettings.pickupLocationLabelMax',
  HOME_HERO_AT_LEAST_ONE_FIELD = 'validation.siteSettings.homeHeroAtLeastOneField',
  HOME_HERO_EYEBROW_MAX = 'validation.siteSettings.homeHeroEyebrowMax',
}

export const MAX_PICKUP_BLOCKED_RANGE_ROWS = 50;
export const MAX_HOME_HERO_EYEBROW_LENGTH = 200;
export const MAX_PICKUP_LOCATION_LABEL_LENGTH = 500;
