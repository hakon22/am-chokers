import { useContext, useEffect, useEffectEvent, useState } from 'react';
import { useRouter } from 'next/router';
import { useSearchParams } from 'next/navigation';
import axios from 'axios';
import moment from 'moment';
import type { TFunction } from 'i18next';

import { SubmitContext } from '@/components/Context';
import { useAppSelector } from '@/hooks/reduxHooks';
import { routes } from '@/routes';
import { axiosErrorHandler } from '@/utilities/axiosErrorHandler';
import { DateFormatEnum } from '@/utilities/enums/date.format.enum';
import { ChartPeriodEnum } from '@server/types/reports/enums/chart-period.enum';
import { AiTryOnVtoTypeEnum } from '@server/types/ai/enums/ai-try-on-vto-type.enum';
import type { TryOnAnalyticsReportQueryInterface } from '@server/types/reports/try-on/try-on-analytics-report-query.interface';
import type { TryOnAnalyticsReportInterface } from '@server/types/reports/try-on/try-on-analytics-report.interface';

const ATTRIBUTION_WINDOW_OPTIONS = [1, 3, 7, 14, 30] as const;

/**
 * Читает выбранные типы примерки из query-параметров URL
 * @param urlParams - параметры страницы
 * @returns валидные значения enum
 */
const parseVtoTypesFromUrl = (urlParams: URLSearchParams): AiTryOnVtoTypeEnum[] => {
  const vtoTypesFromUrl = urlParams.getAll('vtoTypes') as AiTryOnVtoTypeEnum[];

  return vtoTypesFromUrl.filter((vtoType) => Object.values(AiTryOnVtoTypeEnum).includes(vtoType));
};

/**
 * Загружает и хранит состояние аналитики AI-примерки для админки
 * @param tToast - функция перевода toast-сообщений об ошибках
 * @param options - enabled: загружать данные и синхронизировать URL только на вкладке аналитики
 * @returns данные отчёта, фильтры и обработчики
 */
export const useTryOnAnalyticsReport = (
  tToast: TFunction<'translation', 'toast'>,
  options?: { enabled?: boolean },
) => {
  const enabled = options?.enabled ?? true;
  const router = useRouter();
  const urlParams = useSearchParams();
  const { setIsSubmit } = useContext(SubmitContext);
  const { axiosAuth } = useAppSelector((state) => state.app);
  const { isAdmin } = useAppSelector((state) => state.user);

  const fromParams = urlParams.get('from') || undefined;
  const toParams = urlParams.get('to') || undefined;
  const ignorePeriodParam = urlParams.get('ignorePeriod') === 'true';
  const attributionWindowParam = urlParams.get('attributionWindowDays');

  const [data, setData] = useState<TryOnAnalyticsReportInterface>();
  const [from, setFrom] = useState(fromParams || moment().startOf('month').format(DateFormatEnum.YYYY_MM_DD));
  const [to, setTo] = useState(toParams || moment().endOf('month').format(DateFormatEnum.YYYY_MM_DD));
  const [period, setPeriod] = useState(ChartPeriodEnum.DAY);
  const [vtoTypes, setVtoTypes] = useState<AiTryOnVtoTypeEnum[]>(parseVtoTypesFromUrl(urlParams));
  const [ignorePeriod, setIgnorePeriod] = useState(ignorePeriodParam);
  const [attributionWindowDays, setAttributionWindowDays] = useState<number>(
    attributionWindowParam && ATTRIBUTION_WINDOW_OPTIONS.includes(+attributionWindowParam as typeof ATTRIBUTION_WINDOW_OPTIONS[number])
      ? +attributionWindowParam
      : 7,
  );

  /**
   * Формирует query-параметры запроса аналитики
   * @returns параметры для API
   */
  const buildRequestParams = (): TryOnAnalyticsReportQueryInterface => ({
    ...(ignorePeriod ? { ignorePeriod: true } : {
      from,
      to,
    }),
    ...(vtoTypes.length ? { vtoTypes } : {}),
    attributionWindowDays,
  });

  /**
   * Запрашивает аналитику AI-примерки с сервера
   * @param params - параметры отчёта
   */
  const fetchData = async (params: TryOnAnalyticsReportQueryInterface) => {
    try {
      setIsSubmit(true);
      const { data: responseData } = await axios.get<{ code: number; result: TryOnAnalyticsReportInterface; }>(
        routes.reports.tryOnAnalytics,
        { params },
      );
      if (responseData.code === 1) {
        setData(responseData.result);
      }
      setIsSubmit(false);
    } catch (error) {
      axiosErrorHandler(error, tToast, setIsSubmit);
    }
  };

  const fetchDataWithParams = () => {
    if (!axiosAuth || !enabled) {
      return;
    }

    router.push({
      query: {
        tab: 'analytics',
        ...(ignorePeriod ? { ignorePeriod: 'true' } : {
          ...(from ? { from } : {}),
          ...(to ? { to } : {}),
        }),
        ...(vtoTypes.length ? { vtoTypes } : {}),
        attributionWindowDays: String(attributionWindowDays),
      },
    },
    undefined,
    { shallow: true });

    fetchData(buildRequestParams());
  };

  const fetchDataWithParamsEffect = useEffectEvent(fetchDataWithParams);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    fetchDataWithParamsEffect();
  }, [axiosAuth, enabled, from, to, vtoTypes, ignorePeriod, attributionWindowDays]);

  const chartData = (data?.chartData[period] || []).map(({ date, tryOnsCount, aiCost }) => ({
    date,
    tryOnsCount,
    aiCost,
  }));

  return {
    isAdmin,
    data,
    from,
    to,
    period,
    vtoTypes,
    ignorePeriod,
    attributionWindowDays,
    setFrom,
    setTo,
    setPeriod,
    setVtoTypes,
    setIgnorePeriod,
    setAttributionWindowDays,
    chartData,
    fromParams,
    toParams,
    attributionWindowOptions: ATTRIBUTION_WINDOW_OPTIONS,
  };
};
