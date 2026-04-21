import type { PickupBlockedDateRangeInterface } from '@server/types/site/pickup.blocked.date.range.interface';

/** Допустимые значения колонки site_settings.value при типе JSONB */
export type SiteSettingsJsonValue = string | PickupBlockedDateRangeInterface[];
