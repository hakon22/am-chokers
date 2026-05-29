import _ from 'lodash';
import moment from 'moment';
import * as yup from 'yup';

import { DateFormatEnum } from '@/utilities/enums/date.format.enum';
import {
  MAX_HOME_HERO_EYEBROW_LENGTH,
  MAX_PICKUP_BLOCKED_RANGE_ROWS,
  MAX_PICKUP_LOCATION_LABEL_LENGTH,
  SiteSettingsValidationKeyEnum,
} from '@server/types/site/site-settings-validation-key.enum';

const pickupBlockedDateRangeSchema = yup.object({
  startDate: yup.string().required(SiteSettingsValidationKeyEnum.FIELD_REQUIRED),
  endDate: yup.string().required(SiteSettingsValidationKeyEnum.FIELD_REQUIRED),
}).test(
  'valid-pickup-blocked-date-range',
  SiteSettingsValidationKeyEnum.PICKUP_BLOCKED_DATE_RANGE_INVALID,
  function validatePickupBlockedDateRange(value) {
    const { startDate, endDate } = value ?? {};
    const start = moment(startDate, DateFormatEnum.YYYY_MM_DD, true).startOf('day');
    const end = moment(endDate, DateFormatEnum.YYYY_MM_DD, true).startOf('day');
    if (!start.isValid() || !end.isValid()) {
      return this.createError({ message: SiteSettingsValidationKeyEnum.PICKUP_BLOCKED_DATE_INVALID_FORMAT });
    }
    if (end.isBefore(start, 'day')) {
      return this.createError({ message: SiteSettingsValidationKeyEnum.PICKUP_BLOCKED_DATE_END_BEFORE_START });
    }
    return true;
  },
).transform((value) => {
  const start = moment(value.startDate, DateFormatEnum.YYYY_MM_DD, true).startOf('day');
  const end = moment(value.endDate, DateFormatEnum.YYYY_MM_DD, true).startOf('day');
  return {
    startDate: start.format(DateFormatEnum.YYYY_MM_DD),
    endDate: end.format(DateFormatEnum.YYYY_MM_DD),
  };
});

/** Схема PATCH настроек самовывоза */
export const bodyPickupSiteSettingsSchema = yup.object({
  locationLabel: yup
    .string()
    .trim()
    .max(MAX_PICKUP_LOCATION_LABEL_LENGTH, SiteSettingsValidationKeyEnum.PICKUP_LOCATION_LABEL_MAX)
    .optional(),
  blockedDateRanges: yup
    .array()
    .of(pickupBlockedDateRangeSchema)
    .max(MAX_PICKUP_BLOCKED_RANGE_ROWS, SiteSettingsValidationKeyEnum.PICKUP_BLOCKED_RANGES_MAX)
    .optional(),
}).test(
  'pickup-site-settings-at-least-one-field',
  SiteSettingsValidationKeyEnum.PICKUP_AT_LEAST_ONE_FIELD,
  (value) => !_.isNil(value?.locationLabel) || !_.isNil(value?.blockedDateRanges),
);

/** Схема PATCH eyebrow hero главной (v2) */
export const bodyHomeHeroSettingsSchema = yup.object({
  eyebrowTitle: yup
    .string()
    .trim()
    .max(MAX_HOME_HERO_EYEBROW_LENGTH, SiteSettingsValidationKeyEnum.HOME_HERO_EYEBROW_MAX)
    .optional(),
  eyebrowSubtitle: yup
    .string()
    .trim()
    .max(MAX_HOME_HERO_EYEBROW_LENGTH, SiteSettingsValidationKeyEnum.HOME_HERO_EYEBROW_MAX)
    .optional(),
}).test(
  'home-hero-settings-at-least-one-field',
  SiteSettingsValidationKeyEnum.HOME_HERO_AT_LEAST_ONE_FIELD,
  (value) => !_.isNil(value?.eyebrowTitle) || !_.isNil(value?.eyebrowSubtitle),
);

export type BodyPickupSiteSettingsInterface = yup.InferType<typeof bodyPickupSiteSettingsSchema>;
export type BodyHomeHeroSettingsInterface = yup.InferType<typeof bodyHomeHeroSettingsSchema>;
