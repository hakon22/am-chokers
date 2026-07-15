import { useTranslation } from 'react-i18next';
import { useContext, useEffect, useEffectEvent, useState } from 'react';
import { Table, Divider, Image } from 'antd';
import { DislikeOutlined, LikeOutlined } from '@ant-design/icons';
import axios from 'axios';
import InfiniteScroll from 'react-infinite-scroll-component';
import moment from 'moment';
import { isNil } from 'lodash';

import { Helmet } from '@/components/Helmet';
import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks';
import { useUserLang } from '@/hooks/useUserLang';
import { setPaginationParams } from '@/slices/appSlice';
import { routes } from '@/routes';
import { axiosErrorHandler } from '@/utilities/axiosErrorHandler';
import { BackButton } from '@/components/BackButton';
import { NotFoundContent } from '@/components/NotFoundContent';
import { ImageHover } from '@/components/ImageHover';
import { getHref } from '@/utilities/getHref';
import { MobileContext, SubmitContext } from '@/components/Context';
import { DateFormatEnum } from '@/utilities/enums/date.format.enum';
import { AiTryOnUserRatingEnum } from '@server/types/ai/enums/ai-try-on-user-rating.enum';
import type { ItemInterface } from '@/types/item/Item';
import type { PaginationEntityInterface } from '@/types/PaginationInterface';
import type { PaginationQueryInterface } from '@server/types/pagination.query.interface';

interface TryOnReportItem {
  id: number;
  created: Date;
  totalCost: number | null;
  userRating: AiTryOnUserRatingEnum | null;
  resultImageSrc?: string;
  item: ItemInterface;
}

interface DataType {
  key: React.Key;
  item: ItemInterface;
  date: Date;
  totalCost: number | null;
  userRating: AiTryOnUserRatingEnum | null;
  resultImageSrc?: string;
}

const TryOnReport = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.reports.tryOn' });
  const { t: tToast } = useTranslation('translation', { keyPrefix: 'toast' });

  const dispatch = useAppDispatch();
  const { setIsSubmit, isSubmit } = useContext(SubmitContext);
  const { isMobile } = useContext(MobileContext);

  const coefficient = 1.3;
  const width = 115;
  const height = width * coefficient;
  const imageBorderRadius = 7;

  const { axiosAuth, pagination } = useAppSelector((state) => state.app);
  const { isAdmin } = useAppSelector((state) => state.user);
  const lang = useUserLang();

  const [data, setData] = useState<DataType[]>([]);

  /**
   * Загружает страницу отчёта AI-примерки
   * @param params - limit/offset пагинации
   * @param replace - заменить список или дописать
   * @returns void
   */
  const fetchData = async (params: PaginationQueryInterface, replace = false) => {
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
        const newState = items.map((log) => ({
          key: log.id,
          date: log.created,
          item: log.item,
          totalCost: log.totalCost,
          userRating: log.userRating,
          resultImageSrc: log.resultImageSrc,
        }));
        setData((state) => (replace ? newState : [...state, ...newState]));
      }
      setIsSubmit(false);
    } catch (e) {
      axiosErrorHandler(e, tToast, setIsSubmit);
    }
  };

  /**
   * Загружает первую страницу при готовности auth
   * @param replace - заменить список
   * @returns void
   */
  const fetchDataWithParams = (replace = false) => {
    if (axiosAuth) {
      fetchData({
        limit: pagination.limit || 10,
        offset: 0,
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
   * Рендерит превью результата примерки с увеличением
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

  return isAdmin ? (
    <div className="d-flex flex-column mb-5 justify-content-center">
      <Helmet title={t('title')} description={t('description')} />
      <h1 className="font-good-vibes-pro text-center mb-5" style={{ marginTop: isMobile ? '30%' : '12%' }}>
        {t('titleWithCount', { count: pagination.count })}
      </h1>
      <div className="d-flex flex-column flex-xl-row align-items-start align-items-xl-center justify-content-xl-between gap-2 mb-3 mb-xl-5">
        <BackButton style={{}} />
      </div>
      <InfiniteScroll
        dataLength={data.length}
        next={() => fetchData({
          limit: pagination.limit,
          offset: (pagination.offset || 0) + 10,
        })}
        hasMore={data.length < pagination.count}
        loader
        endMessage={data.length ? <Divider plain className="font-oswald fs-6 mt-5">{t('finish')}</Divider> : null}
        style={{ overflow: 'unset' }}
      >
        <Table
          dataSource={data}
          pagination={false}
          bordered
          className="td-padding-unset"
          locale={{
            emptyText: <NotFoundContent />,
          }}
        >
          <Table.Column<DataType>
            title={() => <div className="text-center">{t('table.item')}</div>}
            dataIndex="item"
            render={(item: ItemInterface) => (
              <div className="d-flex flex-column flex-xl-row align-items-center gap-4 w-100">
                <ImageHover className="align-self-start" href={getHref(item)} images={item.images} height={height} width={width} />
                <span>{item?.translations?.find((translation) => translation.lang === lang)?.name}</span>
              </div>
            )}
          />
          <Table.Column<DataType>
            title={t('table.date')}
            dataIndex="date"
            render={(date: Date) => moment(date).format(DateFormatEnum.DD_MM_YYYY_HH_MM)}
          />
          <Table.Column<DataType>
            title={t('table.cost')}
            dataIndex="totalCost"
            render={(totalCost: number | null) => (isNil(totalCost) ? '—' : `${totalCost} ₽`)}
          />
          <Table.Column<DataType>
            title={() => <div className="text-center">{t('table.result')}</div>}
            dataIndex="resultImageSrc"
            align="center"
            render={(resultImageSrc?: string) => renderResultImage(resultImageSrc)}
          />
          <Table.Column<DataType>
            title={() => <div className="text-center">{t('table.clientFeedback')}</div>}
            dataIndex="userRating"
            align="center"
            render={(userRating: AiTryOnUserRatingEnum | null) => (
              <div className="d-flex justify-content-center">
                {renderUserRating(userRating)}
              </div>
            )}
          />
        </Table>
      </InfiniteScroll>
    </div>
  ) : null;
};

export default TryOnReport;
