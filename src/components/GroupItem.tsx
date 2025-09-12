import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { Tag } from 'antd';
import cn from 'classnames';
import InfiniteScroll from 'react-infinite-scroll-component';
import { useEffect, useState } from 'react';
import axios from 'axios';

import { ImageHover } from '@/components/ImageHover';
import { Helmet } from '@/components/Helmet';
import { getHref } from '@/utilities/getHref';
import { axiosErrorHandler } from '@/utilities/axiosErrorHandler';
import { routes } from '@/routes';
import { useAppDispatch, useAppSelector } from '@/utilities/hooks';
import { setPaginationParams } from '@/slices/appSlice';
import type { PaginationEntityInterface, PaginationInterface } from '@/types/PaginationInterface';
import type { FetchItemInterface, ItemGroupInterface, ItemInterface } from '@/types/item/Item';

export const GroupItem = ({ items, paginationParams, itemGroup }: { items: ItemInterface[]; paginationParams: PaginationInterface; itemGroup: ItemGroupInterface; }) => {
  const { t } = useTranslation('translation', { keyPrefix: 'modules.cardItem' });
  const { t: tCatalog } = useTranslation('translation', { keyPrefix: 'pages.catalog' });
  const { t: tCart } = useTranslation('translation', { keyPrefix: 'pages.cart' });
  const { t: tToast } = useTranslation('translation', { keyPrefix: 'toast' });

  const dispatch = useAppDispatch();

  const { pagination } = useAppSelector((state) => state.app);
  const { lang } = useAppSelector((state) => state.user);

  const translate = items?.[0]?.group?.translations.find((translation) => translation.lang === lang);

  const coefficient = 1.3;

  const width = 230;
  const height = width * coefficient;

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [data, setData] = useState<ItemInterface[]>(items);

  const fetchItems = async (params: FetchItemInterface, replacement = false, onFetch = true) => {
    try {
      if (isLoading || !onFetch) {
        return;
      }
      setIsLoading(true);
      const { data: payload } = await axios.get<PaginationEntityInterface<ItemInterface>>(routes.item.getList({ isServer: true }), {
        params: { ...params, groupCode: itemGroup.code },
      });
      if (payload.code === 1) {
        dispatch(setPaginationParams(payload.paginationParams));
        setData(replacement ? payload.items : (state) => [...state, ...payload.items]);
      }
      setIsLoading(false);
    } catch (e) {
      axiosErrorHandler(e, tToast, setIsLoading);
    }
  };

  useEffect(() => {
    dispatch(setPaginationParams(paginationParams));
    setData(items);
  }, [itemGroup.code]);

  return (
    <InfiniteScroll
      dataLength={data.length}
      next={() => fetchItems({ limit: pagination.limit, offset: pagination.offset + 10 })}
      hasMore={data.length < pagination.count}
      loader
      style={{ overflow: 'unset' }}
    >
      <div className="d-grid col-12 row-gap-5" style={{ gridTemplateColumns: 'repeat(4, 1fr)', justifyItems: 'center' }}>
        <Helmet title={translate?.name || tCatalog('title')} description={translate?.description || tCatalog('description')} />
        {data.map(({
          id, price, images, group, deleted, translateName, translations,
        }) => (
          <Link href={getHref({ group, translateName } as ItemInterface)} key={id} className="position-relative" style={{ width }}>
            {deleted ? <Tag color="volcano" className="m-0 py-1 px-2 z-1 top-0 end-0 position-absolute">{tCart('deleted')}</Tag> : null}
            <ImageHover
              className={cn('me-3', { 'opacity-50': deleted })}
              width={width}
              height={height}
              images={images}
              name={translations.find((translation) => translation.lang === lang)?.name}
              description={t('price', { price })}
            />
          </Link>
        ))}
      </div>
    </InfiniteScroll>
  );
};
