import moment, { type Moment } from 'moment';
import { isEmpty } from 'lodash';

import { DateFormatEnum } from '@/utilities/enums/date.format.enum';
import type { PickupBlockedDateRangeInterface } from '@/types/site/PublicPickupSettings';

/**
 * Проверяет, попадает ли календарный день в один из закрытых периодов самовывоза
 * @param current - проверяемый день (moment)
 * @param ranges - периоды с границами включительно, даты YYYY-MM-DD
 * @returns true если день недоступен для выбора
 */
export const isCalendarDayBlockedByPickupRanges = (
  current: Moment,
  ranges: PickupBlockedDateRangeInterface[],
): boolean => {
  if (isEmpty(ranges)) {
    return false;
  }
  const day = current.clone().startOf('day');
  return ranges.some((range) => {
    const start = moment(range.startDate, DateFormatEnum.YYYY_MM_DD, true).startOf('day');
    const end = moment(range.endDate, DateFormatEnum.YYYY_MM_DD, true).startOf('day');
    if (!start.isValid() || !end.isValid()) {
      return false;
    }
    return day.isBetween(start, end, 'day', '[]');
  });
};
