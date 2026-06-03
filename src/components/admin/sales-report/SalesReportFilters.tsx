import moment, { type Moment } from 'moment';
import { Checkbox, DatePicker, Select } from 'antd';
import momentGenerateConfig from 'rc-picker/lib/generate/moment';
import type { TFunction } from 'i18next';

import { DateFormatEnum } from '@/utilities/enums/date.format.enum';
import { DeliveryTypeEnum } from '@server/types/delivery/enums/delivery.type.enum';
import { SalesReportPromoFilterEnum } from '@server/types/reports/sales/enums/sales-report-promo-filter.enum';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';
import { locale } from '@/locales/pickers.locale.ru';
import { buildDeliveryTypeFilterOptions } from '@/components/admin/sales-report/salesReportChartData';

const MomentDatePicker = DatePicker.generatePicker<Moment>(momentGenerateConfig);

type SalesReportFiltersProps = {
  t: TFunction<'translation', 'pages.reports.sales'>;
  lang: UserLangEnum;
  from: string;
  to: string;
  fromParams?: string;
  toParams?: string;
  deliveryTypes: DeliveryTypeEnum[];
  promoFilter: SalesReportPromoFilterEnum;
  ignorePeriod: boolean;
  setFrom: (value: string) => void;
  setTo: (value: string) => void;
  setDeliveryTypes: (types: DeliveryTypeEnum[]) => void;
  setPromoFilter: (filter: SalesReportPromoFilterEnum) => void;
  setIgnorePeriod: (value: boolean) => void;
};

/**
 * Блок фильтров отчёта по продажам для V1
 * @param props - состояние фильтров и обработчики
 * @returns панель фильтров
 */
export const SalesReportFilters = ({
  t,
  lang,
  from,
  to,
  fromParams,
  toParams,
  deliveryTypes,
  promoFilter,
  ignorePeriod,
  setFrom,
  setTo,
  setDeliveryTypes,
  setPromoFilter,
  setIgnorePeriod,
}: SalesReportFiltersProps) => (
  <>
    <div className="d-flex flex-column flex-xl-row align-items-start align-items-xl-center justify-content-xl-between gap-2 mb-3 mb-xl-4">
      <div className="d-flex flex-column flex-xl-row gap-2 w-100">
        <Select
          mode="multiple"
          allowClear
          className="w-100"
          placeholder={t('filters.deliveryPlaceholder')}
          value={deliveryTypes}
          onChange={(values) => setDeliveryTypes(values)}
          options={buildDeliveryTypeFilterOptions(lang)}
        />
        <Select
          className="w-100"
          value={promoFilter}
          onChange={(value) => setPromoFilter(value)}
          options={[
            { value: SalesReportPromoFilterEnum.ALL, label: t('filters.promoAll') },
            { value: SalesReportPromoFilterEnum.WITH, label: t('filters.promoWith') },
            { value: SalesReportPromoFilterEnum.WITHOUT, label: t('filters.promoWithout') },
          ]}
        />
      </div>
    </div>

    <div className="d-flex flex-column flex-xl-row align-items-start align-items-xl-center gap-2 mb-3 mb-xl-4">
      <Checkbox
        checked={ignorePeriod}
        onChange={({ target }) => setIgnorePeriod(target.checked)}
      >
        {t('filters.ignorePeriod')}
      </Checkbox>
      <MomentDatePicker
        className="w-100"
        placeholder={t('from')}
        disabled={ignorePeriod}
        onChange={(value) => setFrom(value ? value.format(DateFormatEnum.YYYY_MM_DD) : moment().startOf('month').format(DateFormatEnum.YYYY_MM_DD))}
        allowClear
        value={from && !ignorePeriod ? moment(fromParams || from) : undefined}
        showNow={false}
        format={DateFormatEnum.DD_MM_YYYY}
        locale={lang === UserLangEnum.RU ? locale : undefined}
      />
      <MomentDatePicker
        className="w-100"
        placeholder={t('to')}
        disabled={ignorePeriod}
        onChange={(value) => setTo(value ? value.format(DateFormatEnum.YYYY_MM_DD) : moment().endOf('month').format(DateFormatEnum.YYYY_MM_DD))}
        allowClear
        value={to && !ignorePeriod ? moment(toParams || to) : undefined}
        showNow={false}
        format={DateFormatEnum.DD_MM_YYYY}
        locale={lang === UserLangEnum.RU ? locale : undefined}
      />
    </div>
  </>
);
