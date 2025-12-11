import { useTranslation } from 'react-i18next';
import { useContext, useEffect, useEffectEvent, useState, Fragment } from 'react';
import { useRouter } from 'next/router';
import { DatePicker, Radio, Button } from 'antd';
import axios from 'axios';
import moment, { type Moment } from 'moment';
import { useSearchParams } from 'next/navigation';
import momentGenerateConfig from 'rc-picker/lib/generate/moment';
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { Helmet } from '@/components/Helmet';
import { useAppSelector } from '@/hooks/reduxHooks';
import { setPaginationParams } from '@/slices/appSlice';
import { routes } from '@/routes';
import { axiosErrorHandler } from '@/utilities/axiosErrorHandler';
import { BackButton } from '@/components/BackButton';
import { MobileContext, SubmitContext } from '@/components/Context';
import { DateFormatEnum } from '@/utilities/enums/date.format.enum';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';
import { ChartPeriodEnum } from '@server/types/reports/enums/chart-period.enum';
import { locale } from '@/locales/pickers.locale.ru';
import type { ChartDataPointInterface } from '@server/types/reports/metrica/chart-data-point.interface';
import type { MetricaReportInterface } from '@server/types/reports/metrica/metrica-report.interface';
import type { DatePeriodQueryInterface } from '@server/types/reports/date-period-query.interface';

const MomentDatePicker = DatePicker.generatePicker<Moment>(momentGenerateConfig);

const Metrica = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.reports.metrica' });
  const { t: tToast } = useTranslation('translation', { keyPrefix: 'toast' });

  const router = useRouter();

  const { setIsSubmit } = useContext(SubmitContext);
  const { isMobile } = useContext(MobileContext);

  const urlParams = useSearchParams();

  const fromParams = urlParams.get('from') || undefined;
  const toParams = urlParams.get('to') || undefined;

  const { axiosAuth } = useAppSelector((state) => state.app);
  const { isAdmin, lang } = useAppSelector((state) => state.user);

  const [data, setData] = useState<MetricaReportInterface>();

  const [from, setFrom] = useState(fromParams || moment().startOf('month').format(DateFormatEnum.YYYY_MM_DD));
  const [to, setTo] = useState(toParams || moment().endOf('month').format(DateFormatEnum.YYYY_MM_DD));
  const [period, setPeriod] = useState(ChartPeriodEnum.DAY);
  const [selectedCampaigns, setSelectedCampaigns] = useState<number[]>([]); // пустой массив = все кампании
  const [showOnlyTotal, setShowOnlyTotal] = useState(false);
  const [hiddenLines, setHiddenLines] = useState<Record<string, boolean>>({});

  const currentChartData = data?.chartData[period];

  const filteredChartData = selectedCampaigns.length
    ? (currentChartData || []).map((point) => {
      const filteredPoint: ChartDataPointInterface = { 
        date: point.date, 
        campaigns: {}, 
        total: { clicks: 0, cost: 0 }, 
      };

      selectedCampaigns.forEach(campaignId => {
        if (point.campaigns[campaignId]) {
          filteredPoint.campaigns[campaignId] = point.campaigns[campaignId];
          filteredPoint.total.clicks += point.campaigns[campaignId].clicks;
          filteredPoint.total.cost += point.campaigns[campaignId].cost;
        }
      });

      return filteredPoint;
    })
    : currentChartData;

  // Функция для преобразования данных в формат для Recharts
  const transformChartData = (chartData: ChartDataPointInterface[]) => {
    return chartData.map(point => {
      const transformedPoint: any = {
        date: point.date,
        totalClicks: point.total.clicks,
        totalCost: point.total.cost,
      };

      // Добавляем данные по кампаниям
      Object.entries(point.campaigns).forEach(([campaignId, stats]) => {
        transformedPoint[`clicks_${campaignId}`] = stats.clicks;
        transformedPoint[`cost_${campaignId}`] = stats.cost;
      });

      return transformedPoint;
    });
  };

  // Получаем преобразованные данные
  const transformedData = transformChartData(filteredChartData || []);

  // Рендерим графики для видимых кампаний
  const renderCampaignAreas = () => {
    if (showOnlyTotal) {
      return null;
    }

    return Object.entries((data?.campaignStats || {}))
      .filter(([id]) => selectedCampaigns.length === 0 || selectedCampaigns.includes(+id))
      .map(([id, campaign]) => (
        <Fragment key={id}>
          <Area
            yAxisId="left"
            type="monotone"
            dataKey={`clicks_${id}`}
            name={t('chart.actionClicks', { name: campaign.name })}
            stroke={campaign.color[0]}
            fill={`url(#color-clicks-${id})`}
            fillOpacity={0.3}
            strokeWidth={2}
            stackId="clicks"
            hide={hiddenLines[`clicks_${id}`]}
          />
          <Area
            yAxisId="right"
            type="monotone"
            dataKey={`cost_${id}`}
            name={t('chart.actionCost', { name: campaign.name })}
            stroke={campaign.color[1]}
            fill="transparent"
            strokeWidth={1}
            strokeDasharray="3 3"
            hide={hiddenLines[`cost_${id}`]}
          />
        </Fragment>
      ));
  };

  const handleLegendClick = (dataKey?: string) => {
    if (!dataKey) {
      return;
    }
    setHiddenLines(prev => ({
      ...prev,
      [dataKey]: !prev[dataKey], // true = скрыта
    }));
  };

  // Панель управления
  const renderControls = () => (
    <>
      <Radio.Group
        onChange={({ target }) => setPeriod(target.value)}
        value={period}
        optionType="button"
        buttonStyle="solid"
        options={[
          { value: ChartPeriodEnum.DAY, label: t('chart.controls.DAY') },
          { value: ChartPeriodEnum.WEEK, label: t('chart.controls.WEEK') },
          { value: ChartPeriodEnum.MONTH, label: t('chart.controls.MONTH') },
        ]}
      >
      </Radio.Group>
      <div className="btn-group">
        <Button
          variant={showOnlyTotal ? 'filled' : 'outlined'}
          onClick={() => setShowOnlyTotal(!showOnlyTotal)}>
          {showOnlyTotal ? t('chart.controls.showAll') : t('chart.controls.justTotal')}
        </Button>
      </div>
      <div className="d-flex flex-wrap gap-2">
        {Object.entries((data?.campaignStats || {})).map(([id, campaign]) => (
          <Button
            key={id}
            variant={selectedCampaigns.includes(+id) ? 'filled' : 'outlined'}
            onClick={() => {
              const campaignId = +id;
              if (selectedCampaigns.includes(campaignId)) {
                setSelectedCampaigns(selectedCampaigns.filter((cId) => cId !== campaignId));
              } else {
                setSelectedCampaigns([...selectedCampaigns, campaignId]);
              }
            }}
            style={{ borderColor: campaign.color[0], color: campaign.color[0] }}
          >
            {campaign.name}
          </Button>
        ))}
        {selectedCampaigns.length !== 0 && (
          <Button variant="link" onClick={() => setSelectedCampaigns([])}>{t('chart.reset')}</Button>
        )}
      </div>
    </>
  );

  const fetchData = async (params: DatePeriodQueryInterface) => {
    try {
      setIsSubmit(true);
      const { data: { code, result } } = await axios.get<{ code: number; result: MetricaReportInterface; }>(routes.reports.metrica, {
        params,
      });
      if (code === 1) {
        setData(result);
      }
      setIsSubmit(false);
    } catch (e) {
      axiosErrorHandler(e, tToast, setIsSubmit);
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

    return () => {
      setPaginationParams({ limit: 0, offset: 0, count: 0 });
    };
  }, [axiosAuth, from, to]);

  return isAdmin ? (
    <div className="d-flex flex-column mb-5 justify-content-center">
      <Helmet title={t('title')} description={t('description')} />
      <h1 className="font-good-vibes-pro text-center mb-5" style={{ marginTop: isMobile ? '30%' : '12%' }}>{t('title')}</h1>
      <div className="d-flex flex-column flex-xl-row align-items-start align-items-xl-center justify-content-xl-between gap-2 mb-3 mb-xl-5">
        <BackButton style={{}} />
        {renderControls()}
        <div className="d-flex flex-column flex-xl-row gap-2">
          <MomentDatePicker
            className="w-100"
            placeholder={t('from')}
            onChange={(value) => setFrom(value ? value.format(DateFormatEnum.YYYY_MM_DD) : moment().startOf('month').format(DateFormatEnum.YYYY_MM_DD))}
            allowClear
            value={from ? moment(fromParams) : undefined}
            showNow={false}
            format={DateFormatEnum.DD_MM_YYYY}
            locale={lang === UserLangEnum.RU ? locale : undefined}
          />
          <MomentDatePicker
            className="w-100"
            placeholder={t('to')}
            onChange={(value) => setTo(value ? value.format(DateFormatEnum.YYYY_MM_DD) : moment().endOf('month').format(DateFormatEnum.YYYY_MM_DD))}
            allowClear
            value={to ? moment(toParams) : undefined}
            showNow={false}
            format={DateFormatEnum.DD_MM_YYYY}
            locale={lang === UserLangEnum.RU ? locale : undefined}
          />
        </div>
      </div>
      <div className="metric-report">
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={transformedData}>
            <defs>
              {Object.entries((data?.campaignStats || {})).map(([id, campaign]) => (
                <linearGradient key={`color-clicks-${id}`} id={`color-clicks-${id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={campaign.color[0]} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={campaign.color[0]} stopOpacity={0}/>
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis yAxisId="left" label={{ value: t('chart.clicks'), angle: -90, position: 'insideLeft' }} />
            <YAxis yAxisId="right" orientation="right" label={{ value: t('chart.cost'), angle: 90, position: 'insideRight' }} />
            <Tooltip />
            <Legend 
              onClick={(entry) => handleLegendClick(entry.dataKey as string)}
              formatter={(value, entry) => {
                const isHidden = hiddenLines[entry.dataKey as string];
                return (
                  <span style={{
                    textDecoration: isHidden ? 'line-through' : 'none',
                    cursor: 'pointer',
                  }}>
                    {value}
                  </span>
                );
              }}
            />
            {!showOnlyTotal && renderCampaignAreas()}
            {/* Итоговые линии */}
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="totalClicks"
              name={t('chart.actionTotalClicks')}
              stroke="#000000"
              fill="transparent"
              strokeWidth={3}
              hide={hiddenLines['totalClicks']}
            />
            <Area
              yAxisId="right"
              type="monotone"
              dataKey="totalCost"
              name={t('chart.actionTotalCost')}
              stroke="#ff0000"
              fill="transparent"
              strokeWidth={2}
              strokeDasharray="5 5"
              hide={hiddenLines['totalCost']}
            />
          </AreaChart>
        </ResponsiveContainer>
        {/* Статистика */}
        <div className="mt-4">
          <h5>{t('chart.statistics.title')}</h5>
          <div className="row">
            {Object.entries((data?.campaignStats || {}))
              .filter(([id]) => !selectedCampaigns.length || selectedCampaigns.includes(+id))
              .map(([id, campaign]) => (
                <div key={+id} className="col-md-4 mb-3">
                  <div className="card">
                    <div className="card-body">
                      <h6 className="card-title" style={{ color: campaign.color[0] }}>
                        {campaign.name}
                      </h6>
                      <p>{t('chart.statistics.clicks')} {campaign.totalClicks}</p>
                      <p>{t('chart.statistics.cost', { cost: campaign.totalCost })}</p>
                    </div>
                  </div>
                </div>
              ))}
            {/* Общая статистика */}
            <div className="col-md-4 mb-3">
              <div className="card border-primary">
                <div className="card-body">
                  <h6 className="card-title text-primary">{t('chart.statistics.total')}</h6>
                  <p>{t('chart.statistics.clicks')} {data?.totalStats?.totalClicks ?? 0}</p>
                  <p>{t('chart.statistics.cost', { cost: data?.totalStats?.totalCost ?? 0 })}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  ) : null;
};

export default Metrica;
