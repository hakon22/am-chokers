import { useTranslation } from 'react-i18next';
import { useContext, useEffect, useEffectEvent, useState } from 'react';
import { Table, Divider, Image } from 'antd';
import { DislikeOutlined, LikeOutlined } from '@ant-design/icons';
import axios from 'axios';
import InfiniteScroll from 'react-infinite-scroll-component';
import moment from 'moment';
import Link from 'next/link';
import { isNil } from 'lodash';
import type { TableProps } from 'antd';

import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks';
import { useUserLang } from '@/hooks/useUserLang';
import { setPaginationParams } from '@/slices/appSlice';
import { routes } from '@/routes';
import { axiosErrorHandler } from '@/utilities/axiosErrorHandler';
import { buildAntTableLocale } from '@/utilities/build-ant-table-locale';
import { NotFoundContent } from '@/components/NotFoundContent';
import { ImageHover } from '@/components/ImageHover';
import { getHref } from '@/utilities/getHref';
import { SubmitContext } from '@/components/Context';
import { DateFormatEnum } from '@/utilities/enums/date.format.enum';
import { parseAntTableSorter, getAntTableColumnSortOrder } from '@/utilities/parse-ant-table-sorter';
import { AiTryOnUserRatingEnum } from '@server/types/ai/enums/ai-try-on-user-rating.enum';
import { TryOnReportSortFieldEnum } from '@server/types/reports/try-on/enums/try-on-report-sort-field.enum';
import type { TryOnReportQueryInterface } from '@server/types/reports/try-on/try-on-report-query.interface';
import type { ItemInterface } from '@/types/item/Item';
import type { PaginationEntityInterface } from '@/types/PaginationInterface';

const TRY_ON_REPORT_SORT_FIELD_MAPPING: Record<string, TryOnReportSortFieldEnum> = {
  created: TryOnReportSortFieldEnum.CREATED,
  durationMs: TryOnReportSortFieldEnum.DURATION_MS,
  totalCost: TryOnReportSortFieldEnum.TOTAL_COST,
  userRating: TryOnReportSortFieldEnum.USER_RATING,
};

interface TryOnReportItem {
  id: number;
  created: Date;
  durationMs: number | null;
  totalCost: number | null;
  userRating: AiTryOnUserRatingEnum | null;
  resultImageSrc?: string;
  item: ItemInterface;
}

/**
 * Табличный реестр успешных AI-примерок с серверной сортировкой
 * @returns JSX таблицы с infinite scroll
 */
export const TryOnReportRegistry = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.reports.tryOn' });
  const { t: tToast } = useTranslation('translation', { keyPrefix: 'toast' });
  const { t: tRoot } = useTranslation('translation');

  const dispatch = useAppDispatch();
  const { setIsSubmit, isSubmit } = useContext(SubmitContext);

  const coefficient = 1.3;
  const width = 115;
  const height = width * coefficient;
  const imageBorderRadius = 7;

  const { axiosAuth, pagination } = useAppSelector((state) => state.app);
  const lang = useUserLang();

  const [data, setData] = useState<TryOnReportItem[]>([]);
  const [sortField, setSortField] = useState<TryOnReportQueryInterface['sortField']>();
  const [sortOrder, setSortOrder] = useState<TryOnReportQueryInterface['sortOrder']>();

  /**
   * Загружает страницу реестра AI-примерки
   * @param params - limit/offset и сортировка
   * @param replace - заменить список или дописать
   */
  const fetchData = async (params: TryOnReportQueryInterface, replace = false) => {
    try {
      if (isSubmit) {
        return;
      }
      setIsSubmit(true);
      const { data: { items, paginationParams, code } } = await axios.get<PaginationEntityInterface<TryOnReportItem>>(routes.reports.tryOn, {
        params,
      });
      if (code === 1) {
        dispatch(setPaginationParams(paginationParams));
        setData((state) => (replace ? items : [...state, ...items]));
      }
      setIsSubmit(false);
    } catch (error) {
      axiosErrorHandler(error, tToast, setIsSubmit);
    }
  };

  /**
   * Загружает первую страницу при готовности auth
   * @param replace - заменить список
   */
  const fetchDataWithParams = (replace = false) => {
    if (axiosAuth) {
      fetchData({
        limit: pagination.limit || 10,
        offset: 0,
        ...(sortField ? { sortField, sortOrder } : {}),
      }, replace);
    }
  };

  const fetchDataWithParamsEffect = useEffectEvent(fetchDataWithParams);

  useEffect(() => {
    fetchDataWithParamsEffect(true);

    return () => {
      setPaginationParams({ limit: 0, offset: 0, count: 0 });
    };
  }, [axiosAuth]);

  /**
   * Обрабатывает смену сортировки колонки
   * @param _pagination - не используется
   * @param _filters - не используется
   * @param sorter - сортировка Ant Design
   */
  const handleTableChange: TableProps<TryOnReportItem>['onChange'] = (_pagination, _filters, sorter) => {
    const nextSort = parseAntTableSorter(sorter, TRY_ON_REPORT_SORT_FIELD_MAPPING) as Pick<TryOnReportQueryInterface, 'sortField' | 'sortOrder'>;
    setSortField(nextSort.sortField as TryOnReportQueryInterface['sortField']);
    setSortOrder(nextSort.sortOrder as TryOnReportQueryInterface['sortOrder']);
    fetchData({
      limit: pagination.limit || 10,
      offset: 0,
      ...nextSort,
    }, true);
  };

  /**
   * Рендерит иконку оценки клиента
   * @param userRating - GOOD/BAD или null
   * @returns JSX или тире
   */
  const renderUserRating = (userRating: AiTryOnUserRatingEnum | null) => {
    if (userRating === AiTryOnUserRatingEnum.GOOD) {
      return <LikeOutlined style={{ fontSize: 18 }} />;
    }
    if (userRating === AiTryOnUserRatingEnum.BAD) {
      return <DislikeOutlined style={{ fontSize: 18 }} />;
    }
    return '—';
  };

  /**
   * Рендерит длительность генерации через i18n
   * @param durationMs - длительность в миллисекундах
   * @returns локализованная строка или тире
   */
  const renderGenerationDuration = (durationMs: number | null) => {
    if (isNil(durationMs)) {
      return '—';
    }
    return t('table.generationDurationValue', {
      seconds: (durationMs / 1000).toFixed(1),
    });
  };

  /**
   * Рендерит превью результата примерки
   * @param resultImageSrc - URL изображения
   * @returns JSX или тире
   */
  const renderResultImage = (resultImageSrc?: string) => {
    if (isNil(resultImageSrc)) {
      return '—';
    }

    return (
      <div className="d-flex justify-content-center">
        <Image
          src={resultImageSrc}
          alt={t('table.result')}
          width={width}
          height={height}
          style={{ objectFit: 'cover' }}
          styles={{
            root: {
              borderRadius: imageBorderRadius,
              overflow: 'hidden',
            },
            image: {
              borderRadius: imageBorderRadius,
              objectFit: 'cover',
            },
            cover: {
              borderRadius: imageBorderRadius,
            },
          }}
        />
      </div>
    );
  };

  return (
    <InfiniteScroll
      dataLength={data.length}
      next={() => fetchData({
        limit: pagination.limit,
        offset: (pagination.offset || 0) + 10,
        ...(sortField ? { sortField, sortOrder } : {}),
      })}
      hasMore={data.length < pagination.count}
      loader
      endMessage={data.length ? <Divider plain className="font-oswald fs-6 mt-5">{t('finish')}</Divider> : null}
      style={{ overflow: 'unset' }}
    >
      <Table
        dataSource={data}
        rowKey="id"
        pagination={false}
        bordered
        className="td-padding-unset"
        onChange={handleTableChange}
        locale={buildAntTableLocale(tRoot, {
          emptyText: <NotFoundContent />,
        })}
      >
        <Table.Column<TryOnReportItem>
          title={() => <div className="text-center">{t('table.item')}</div>}
          dataIndex="item"
          render={(item: ItemInterface) => (
            <div className="d-flex flex-column flex-xl-row align-items-center gap-4 w-100">
              <ImageHover className="align-self-start" href={getHref(item)} images={item.images} height={height} width={width} />
              <Link href={getHref(item)} className="text-reset text-decoration-none">
                {item?.translations?.find((translation) => translation.lang === lang)?.name}
              </Link>
            </div>
          )}
        />
        <Table.Column<TryOnReportItem>
          title={t('table.date')}
          dataIndex="created"
          sorter
          sortOrder={getAntTableColumnSortOrder('created', sortField, sortOrder, TRY_ON_REPORT_SORT_FIELD_MAPPING)}
          render={(created: Date) => moment(created).format(DateFormatEnum.DD_MM_YYYY_HH_MM)}
        />
        <Table.Column<TryOnReportItem>
          title={t('table.generationDuration')}
          dataIndex="durationMs"
          sorter
          sortOrder={getAntTableColumnSortOrder('durationMs', sortField, sortOrder, TRY_ON_REPORT_SORT_FIELD_MAPPING)}
          render={(durationMs: number | null) => renderGenerationDuration(durationMs)}
        />
        <Table.Column<TryOnReportItem>
          title={t('table.cost')}
          dataIndex="totalCost"
          sorter
          sortOrder={getAntTableColumnSortOrder('totalCost', sortField, sortOrder, TRY_ON_REPORT_SORT_FIELD_MAPPING)}
          render={(totalCost: number | null) => (isNil(totalCost) ? '—' : `${totalCost} ₽`)}
        />
        <Table.Column<TryOnReportItem>
          title={() => <div className="text-center">{t('table.result')}</div>}
          dataIndex="resultImageSrc"
          align="center"
          render={(resultImageSrc?: string) => renderResultImage(resultImageSrc)}
        />
        <Table.Column<TryOnReportItem>
          title={() => <div className="text-center">{t('table.clientFeedback')}</div>}
          dataIndex="userRating"
          align="center"
          sorter
          sortOrder={getAntTableColumnSortOrder('userRating', sortField, sortOrder, TRY_ON_REPORT_SORT_FIELD_MAPPING)}
          render={(userRating: AiTryOnUserRatingEnum | null) => (
            <div className="d-flex justify-content-center">
              {renderUserRating(userRating)}
            </div>
          )}
        />
      </Table>
    </InfiniteScroll>
  );
};
