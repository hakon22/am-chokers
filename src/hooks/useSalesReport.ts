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
import { DeliveryTypeEnum } from '@server/types/delivery/enums/delivery.type.enum';
import { SalesReportPromoFilterEnum } from '@server/types/reports/sales/enums/sales-report-promo-filter.enum';
import type { SalesReportQueryInterface } from '@server/types/reports/sales/sales-report-query.interface';
import type { SalesReportInterface } from '@server/types/reports/sales/sales-report.interface';

/**
 * Загружает и хранит состояние отчёта «Продажи» для админки
 * @param tToast - функция перевода toast-сообщений об ошибках
 * @returns данные отчёта, фильтры периода и обработчики
 */
export const useSalesReport = (tToast: TFunction<'translation', 'toast'>) => {
  const router = useRouter();
  const urlParams = useSearchParams();
  const { setIsSubmit } = useContext(SubmitContext);
  const { axiosAuth } = useAppSelector((state) => state.app);
  const { isAdmin } = useAppSelector((state) => state.user);

  const fromParams = urlParams.get('from') || undefined;
  const toParams = urlParams.get('to') || undefined;
  const deliveryTypesParams = urlParams.getAll('deliveryTypes') as DeliveryTypeEnum[];
  const promoFilterParam = urlParams.get('promoFilter') as SalesReportPromoFilterEnum | null;
  const ignorePeriodParam = urlParams.get('ignorePeriod') === 'true';

  const [data, setData] = useState<SalesReportInterface>();
  const [from, setFrom] = useState(fromParams || moment().startOf('month').format(DateFormatEnum.YYYY_MM_DD));
  const [to, setTo] = useState(toParams || moment().endOf('month').format(DateFormatEnum.YYYY_MM_DD));
  const [period, setPeriod] = useState(ChartPeriodEnum.DAY);
  const [deliveryTypes, setDeliveryTypes] = useState<DeliveryTypeEnum[]>(deliveryTypesParams);
  const [promoFilter, setPromoFilter] = useState<SalesReportPromoFilterEnum>(
    promoFilterParam && Object.values(SalesReportPromoFilterEnum).includes(promoFilterParam)
      ? promoFilterParam
      : SalesReportPromoFilterEnum.ALL,
  );
  const [ignorePeriod, setIgnorePeriod] = useState(ignorePeriodParam);

  /**
   * Формирует query-параметры запроса отчёта
   * @returns параметры для API
   */
  const buildRequestParams = (): SalesReportQueryInterface => ({
    ...(ignorePeriod ? { ignorePeriod: true } : {
      from,
      to,
    }),
    ...(deliveryTypes.length ? { deliveryTypes } : {}),
    ...(promoFilter !== SalesReportPromoFilterEnum.ALL ? { promoFilter } : {}),
  });

  /**
   * Запрашивает отчёт по продажам с сервера
   * @param params - параметры отчёта
   */
  const fetchData = async (params: SalesReportQueryInterface) => {
    try {
      setIsSubmit(true);
      const { data: responseData } = await axios.get<{ code: number; result: SalesReportInterface; }>(
        routes.reports.sales,
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
          ...(ignorePeriod ? { ignorePeriod: 'true' } : {
            ...(from ? { from } : {}),
            ...(to ? { to } : {}),
          }),
          ...(deliveryTypes.length ? { deliveryTypes } : {}),
          ...(promoFilter !== SalesReportPromoFilterEnum.ALL ? { promoFilter } : {}),
        },
      },
      undefined,
      { shallow: true });

      fetchData(buildRequestParams());
    }
  };

  const fetchDataWithParamsEffect = useEffectEvent(fetchDataWithParams);

  useEffect(() => {
    fetchDataWithParamsEffect();
  }, [axiosAuth, from, to, deliveryTypes, promoFilter, ignorePeriod]);

  const chartData = (data?.chartData[period] || []).map((point) => ({
    date: point.date,
    revenue: point.revenue,
    ordersCount: point.ordersCount,
  }));

  return {
    isAdmin,
    data,
    from,
    to,
    period,
    deliveryTypes,
    promoFilter,
    ignorePeriod,
    setFrom,
    setTo,
    setPeriod,
    setDeliveryTypes,
    setPromoFilter,
    setIgnorePeriod,
    chartData,
    fromParams,
    toParams,
  };
};
