import { useContext, useEffect, useEffectEvent, useMemo, useState } from 'react';
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
import { filterChartDataByCampaigns, transformMetricaChartData } from '@/components/admin/metrica-report/metricaReportChartData';
import type { DatePeriodQueryInterface } from '@server/types/reports/date-period-query.interface';
import type { MetricaReportInterface } from '@server/types/reports/metrica/metrica-report.interface';

/**
 * Загружает и хранит состояние отчёта «Метрика» для админки
 * @param tToast - функция перевода toast-сообщений об ошибках
 * @returns данные отчёта, фильтры периода и обработчики
 */
export const useMetricaReport = (tToast: TFunction<'translation', 'toast'>) => {
  const router = useRouter();
  const urlParams = useSearchParams();
  const { setIsSubmit } = useContext(SubmitContext);
  const { axiosAuth } = useAppSelector((state) => state.app);
  const { isAdmin } = useAppSelector((state) => state.user);

  const fromParams = urlParams.get('from') || undefined;
  const toParams = urlParams.get('to') || undefined;

  const [data, setData] = useState<MetricaReportInterface>();
  const [from, setFrom] = useState(fromParams || moment().startOf('month').format(DateFormatEnum.YYYY_MM_DD));
  const [to, setTo] = useState(toParams || moment().endOf('month').format(DateFormatEnum.YYYY_MM_DD));
  const [period, setPeriod] = useState(ChartPeriodEnum.DAY);
  const [selectedCampaigns, setSelectedCampaigns] = useState<number[]>([]);

  const currentChartData = data?.chartData[period];

  const filteredChartData = useMemo(
    () => filterChartDataByCampaigns(currentChartData, selectedCampaigns),
    [currentChartData, selectedCampaigns],
  );

  const chartData = useMemo(
    () => transformMetricaChartData(filteredChartData || []),
    [filteredChartData],
  );

  /**
   * Запрашивает отчёт «Метрика» с сервера
   * @param params - параметры периода
   */
  const fetchData = async (params: DatePeriodQueryInterface) => {
    try {
      setIsSubmit(true);
      const { data: responseData } = await axios.get<{ code: number; result: MetricaReportInterface; }>(
        routes.reports.metrica,
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
    if (axiosAuth) {
      router.push({
        query: {
          ...(from ? { from } : {}),
          ...(to ? { to } : {}),
        },
      },
      undefined,
      { shallow: true });

      const params: DatePeriodQueryInterface = {
        ...(from ? { from } : {}),
        ...(to ? { to } : {}),
      };
      fetchData(params);
    }
  };

  const fetchDataWithParamsEffect = useEffectEvent(fetchDataWithParams);

  useEffect(() => {
    fetchDataWithParamsEffect();
  }, [axiosAuth, from, to]);

  return {
    isAdmin,
    data,
    from,
    to,
    period,
    selectedCampaigns,
    setFrom,
    setTo,
    setPeriod,
    setSelectedCampaigns,
    chartData,
    fromParams,
    toParams,
  };
};
