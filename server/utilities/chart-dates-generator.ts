import moment from 'moment';

import { ChartPeriodEnum } from '@server/types/reports/enums/chart-period.enum';
import type { DatePeriodQueryInterface } from '@server/types/reports/date-period-query.interface';

export const getDateFormat = (group: ChartPeriodEnum): string => {
  switch (group) {
  case ChartPeriodEnum.WEEK:
    return 'YYYY-WW';
  case ChartPeriodEnum.MONTH:
    return 'YYYY-MM';
  case ChartPeriodEnum.DAY:
  default:
    return 'YYYY-MM-DD';
  }
};

export const chartDatesGenerate = (period: DatePeriodQueryInterface, group: ChartPeriodEnum): string[] => {
  const dates: string[] = [];

  let current = moment(period.from);
  const end = moment(period.to);


  const format = getDateFormat(group);


  let step: moment.DurationInputArg1;
  let unit: moment.unitOfTime.DurationConstructor;

  switch (group) {
  case ChartPeriodEnum.DAY:
    step = 1;
    unit = 'days';
    break;
  case ChartPeriodEnum.WEEK:
    step = 1;
    unit = 'weeks';
    break;
  case ChartPeriodEnum.MONTH:
    step = 1;
    unit = 'months';
    break;
  }


  while (current.isSameOrBefore(end)) {
    dates.push(current.format(format));
    current = current.add(step, unit);
  }

  return dates;
};
