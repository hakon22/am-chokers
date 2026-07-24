import type { DatePeriodQueryInterface } from '@server/types/reports/date-period-query.interface';
import type { AiTryOnVtoTypeEnum } from '@server/types/ai/enums/ai-try-on-vto-type.enum';

export interface TryOnAnalyticsReportQueryInterface extends DatePeriodQueryInterface {
  /** Игнорировать фильтр периода */
  ignorePeriod?: boolean;
  /** Типы примерки */
  vtoTypes?: AiTryOnVtoTypeEnum[];
  /** Окно атрибуции конверсии в днях */
  attributionWindowDays?: number;
}
