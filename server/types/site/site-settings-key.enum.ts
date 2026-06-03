/** Ключи строк в таблице site_settings */
export enum SiteSettingsKeyEnum {
  /** Версия сайта */
  SITE_VERSION = 'siteVersion',
  /** Точка самовывоза */
  PICKUP_LOCATION_LABEL = 'pickupLocationLabel',
  /** Недоступные периоды в календаре */
  PICKUP_BLOCKED_DATE_RANGES = 'pickupBlockedDateRanges',
  /** Левая часть eyebrow в hero главной (v2) */
  HOME_HERO_EYEBROW_TITLE = 'homeHeroEyebrowTitle',
  /** Правая часть eyebrow в hero главной (v2) */
  HOME_HERO_EYEBROW_SUBTITLE = 'homeHeroEyebrowSubtitle',
  /** Автоматический подбор бестселлеров на главной по продажам и рейтингу */
  AUTOMATIC_SALES_HITS = 'automaticSalesHits',
}
