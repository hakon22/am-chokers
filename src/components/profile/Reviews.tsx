import { useTranslation } from 'react-i18next';
import InfiniteScroll from 'react-infinite-scroll-component';
import { Divider, List, Skeleton } from 'antd';
import { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import type { TFunction } from 'i18next';

import { useAppDispatch, useAppSelector } from '@/utilities/hooks';
import { ImageHover } from '@/components/ImageHover';
import { getHref } from '@/utilities/getHref';
import { NotFoundContent } from '@/components/NotFoundContent';
import { routes } from '@/routes';
import { setPaginationParams } from '@/slices/appSlice';
import { axiosErrorHandler } from '@/utilities/axiosErrorHandler';
import { GradeListTitle, GradeListDescription } from '@/components/GradeList';
import { PreviewImage } from '@/components/PreviewImage';
import { SubmitContext } from '@/components/Context';
import type { PaginationQueryInterface } from '@server/types/pagination.query.interface';
import type { ItemGradeEntity } from '@server/db/entities/item.grade.entity';
import type { PaginationEntityInterface } from '@/types/PaginationInterface';

export const Reviews = ({ t }: { t: TFunction }) => {
  const { t: tToast } = useTranslation('translation', { keyPrefix: 'toast' });

  const dispatch = useAppDispatch();

  const width = 115;
  const height = 150;

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [data, setData] = useState<ItemGradeEntity[]>([]);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');

  const { setIsSubmit } = useContext(SubmitContext);

  const { axiosAuth, pagination } = useAppSelector((state) => state.app);

  const fetchMyGrades = async (params: PaginationQueryInterface) => {
    try {
      if (isLoading) {
        return;
      }
      setIsLoading(true);
      const { data: { items, paginationParams, code } } = await axios.get<PaginationEntityInterface<ItemGradeEntity>>(routes.getMyGrades, {
        params,
      });
      if (code === 1) {
        dispatch(setPaginationParams(paginationParams));
        setData((state) => [...state, ...items]);
      }
      setIsLoading(false);
    } catch (e) {
      axiosErrorHandler(e, tToast, setIsLoading);
    }
  };

  useEffect(() => {
    if (axiosAuth) {
      const params: PaginationQueryInterface = {
        limit: 10,
        offset: 0,
      };
      fetchMyGrades(params);
    }
  }, [axiosAuth]);

  return (
    <div className="w-100 ms-3">
      <PreviewImage previewImage={previewImage} previewOpen={previewOpen} setPreviewImage={setPreviewImage} setPreviewOpen={setPreviewOpen} />
      <InfiniteScroll
        dataLength={data.length}
        next={() => fetchMyGrades({ limit: pagination.limit, offset: pagination.offset + 10 })}
        hasMore={data.length < pagination.count}
        loader={<Skeleton avatar paragraph={{ rows: 1 }} active />}
        endMessage={data.length ? <Divider plain className="font-oswald fs-6 mt-5">{t('finish')}</Divider> : null}
        scrollableTarget="scrollableDiv"
      >
        <List
          dataSource={data}
          locale={{
            emptyText: <NotFoundContent text={t('reviewsNotExist')} />,
          }}
          loading={isLoading}
          renderItem={(value, i) => (
            <div className="d-flex flex-column flex-md-row align-items-center gap-4 w-100 py-2" style={i !== data.length - 1 ? { borderBlockEnd: '1px solid rgba(5, 5, 5, 0.06)' } : {}}>
              <ImageHover className="align-self-start" href={getHref(value?.item)} images={value?.item?.images} height={height} width={width} />
              <List.Item
                className="d-flex flex-column w-100 p-0"
                classNames={{ actions: 'ms-0 align-self-start' }}
                style={{ minHeight: height }}
              >
                <List.Item.Meta
                  className="w-100 mb-5"
                  title={<GradeListTitle grade={value} withTags />}
                  description={<GradeListDescription grade={value} setPreviewImage={setPreviewImage} setPreviewOpen={setPreviewOpen} setIsSubmit={setIsSubmit} />}
                />
              </List.Item>
            </div>
          )}
        />
      </InfiniteScroll>
    </div>
  );
};
