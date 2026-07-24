import moment, { type Moment } from 'moment';
import { Checkbox, DatePicker, Select } from 'antd';
import momentGenerateConfig from 'rc-picker/lib/generate/moment';
import type { TFunction } from 'i18next';

import { DateFormatEnum } from '@/utilities/enums/date.format.enum';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';
import { AiTryOnVtoTypeEnum } from '@server/types/ai/enums/ai-try-on-vto-type.enum';
import { locale } from '@/locales/pickers.locale.ru';
import { TryOnAttributionWindowSelect } from '@/components/admin/try-on-report/TryOnAnalyticsHints';

const MomentDatePicker = DatePicker.generatePicker<Moment>(momentGenerateConfig);

type TryOnAnalyticsFiltersProps = {
  t: TFunction<'translation', 'pages.reports.tryOn.analytics'>;
  lang: UserLangEnum;
  from: string;
  to: string;
  fromParams?: string;
  toParams?: string;
  vtoTypes: AiTryOnVtoTypeEnum[];
  ignorePeriod: boolean;
  attributionWindowDays: number;
  attributionWindowOptions: readonly number[];
  setFrom: (value: string) => void;
  setTo: (value: string) => void;
  setVtoTypes: (types: AiTryOnVtoTypeEnum[]) => void;
  setIgnorePeriod: (value: boolean) => void;
  setAttributionWindowDays: (value: number) => void;
};

/**
 * Блок фильтров аналитики AI-примерки
 * @param props - состояние фильтров и обработчики
 * @returns панель фильтров
 */
export const TryOnAnalyticsFilters = ({
  t,
  lang,
  from,
  to,
  fromParams,
  toParams,
  vtoTypes,
  ignorePeriod,
  attributionWindowDays,
  attributionWindowOptions,
  setFrom,
  setTo,
  setVtoTypes,
  setIgnorePeriod,
  setAttributionWindowDays,
}: TryOnAnalyticsFiltersProps) => (
  <>
    <div className="d-flex flex-column flex-xl-row align-items-stretch gap-2 mb-3 mb-xl-4">
      <div className="w-100">
        <div className="text-muted small mb-1">{t('filters.vtoType')}</div>
        <Select
          mode="multiple"
          allowClear
          className="w-100"
          placeholder={t('filters.vtoTypeAll')}
          value={vtoTypes}
          onChange={(values) => setVtoTypes(values)}
          options={Object.values(AiTryOnVtoTypeEnum).map((type) => ({
            value: type,
            label: t(`vtoType.${type}`),
          }))}
        />
      </div>
      <TryOnAttributionWindowSelect
        attributionWindowDays={attributionWindowDays}
        attributionWindowOptions={attributionWindowOptions}
        setAttributionWindowDays={setAttributionWindowDays}
        t={t}
      />
    </div>

    <div className="d-flex flex-wrap align-items-end gap-2 mb-3 mb-xl-4">
      <Checkbox
        checked={ignorePeriod}
        onChange={({ target }) => setIgnorePeriod(target.checked)}
      >
        {t('filters.ignorePeriod')}
      </Checkbox>
      <div className="flex-grow-1" style={{ minWidth: 240 }}>
        <div className="text-muted small mb-1">{t('filters.period')}</div>
        <div className="d-flex flex-column flex-sm-row gap-2">
          <MomentDatePicker
            className="w-100"
            placeholder={t('from')}
            disabled={ignorePeriod}
            onChange={(value) => setFrom(value ? value.format(DateFormatEnum.YYYY_MM_DD) : moment().startOf('month').format(DateFormatEnum.YYYY_MM_DD))}
            allowClear
            value={from ? moment(fromParams || from) : undefined}
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
            value={to ? moment(toParams || to) : undefined}
            showNow={false}
            format={DateFormatEnum.DD_MM_YYYY}
            locale={lang === UserLangEnum.RU ? locale : undefined}
          />
        </div>
      </div>
    </div>
  </>
);
