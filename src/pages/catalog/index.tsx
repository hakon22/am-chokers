import { useTranslation } from 'react-i18next';
import { useContext, useEffect, useState } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { useRouter } from 'next/router';
import axios from 'axios';
import { useSearchParams } from 'next/navigation';
import { Skeleton, FloatButton } from 'antd';
import cn from 'classnames';
import { chunk } from 'lodash';

import { routes } from '@/routes';
import { Helmet } from '@/components/Helmet';
import { useAppDispatch, useAppSelector } from '@/utilities/hooks';
import { SubmitContext } from '@/components/Context';
import { axiosErrorHandler } from '@/utilities/axiosErrorHandler';
import { CatalogItemsFilter } from '@/components/filters/catalog/CatalogItemsFilter';
import { setPaginationParams } from '@/slices/appSlice';
import { ImageHover } from '@/components/ImageHover';
import { getHref } from '@/utilities/getHref';
import { getCatalogServerSideProps as getServerSideProps } from '@/pages/catalog/[...path]';
import { scrollTop } from '@/utilities/scrollTop';
import type { ItemGroupInterface, ItemInterface } from '@/types/item/Item';
import type { PaginationEntityInterface, PaginationInterface } from '@/types/PaginationInterface';

export interface CatalogFiltersInterface {
  itemGroups?: string[];
  itemCollections?: string[];
  compositions?: string[];
  from?: string | null;
  to?: string | null;
}

export { getServerSideProps };

const CatalogItems = ({ chunkItems, i }: { chunkItems: ItemInterface[]; i: number; }) => {
  const { t: tPrice } = useTranslation('translation', { keyPrefix: 'modules.cardItem' });

  const isReverse = i % 2 !== 0;

  const width = 200;
  const height = 260;

  const lagerWidth = 260;
  const lagerHeight = 338;

  return (
    <div className="d-flex flex-column gap-5 col-12">
      <div className={cn('d-flex justify-content-between', { 'flex-row-reverse': isReverse })}>
        <div className={cn('d-flex col-6 gap-5', { 'flex-row-reverse': isReverse })}>
          <ImageHover
            key={chunkItems[0].id}
            href={getHref(chunkItems[0])}
            height={height}
            width={width}
            images={chunkItems[0].images}
            name={chunkItems[0].name}
            description={tPrice('price', { price: chunkItems[0].price - chunkItems[0].discountPrice })}
          />
          {chunkItems?.[1]
            ? (
              <ImageHover
                key={chunkItems[1].id}
                href={getHref(chunkItems[1])}
                height={height}
                width={width}
                images={chunkItems[1].images}
                name={chunkItems[1].name}
                description={tPrice('price', { price: chunkItems[1].price - chunkItems[1].discountPrice })}
              />
            )
            : null}
        </div>
        {chunkItems?.[2]
          ? (
            <ImageHover
              key={chunkItems[2].id}
              className={cn('col-3', { 'align-items-end': !isReverse })}
              href={getHref(chunkItems[2])}
              height={height}
              width={width}
              images={chunkItems[2].images}
              name={chunkItems[2].name}
              description={tPrice('price', { price: chunkItems[2].price - chunkItems[2].discountPrice })}
            />
          )
          : null}
      </div>
      <div className={cn('d-flex justify-content-between', { 'flex-row-reverse': isReverse })}>
        {chunkItems?.[3]
          ? (
            <ImageHover
              key={chunkItems[3].id}
              className={cn('col-3 align-self-end', { 'align-items-end': isReverse })}
              href={getHref(chunkItems[3])}
              height={height}
              width={width}
              images={chunkItems[3].images}
              name={chunkItems[3].name}
              description={tPrice('price', { price: chunkItems[3].price - chunkItems[3].discountPrice })}
            />
          )
          : null}
        <div className={cn('d-flex col-8 gap-5', { 'justify-content-end': !isReverse })}>
          {chunkItems?.[4]
            ? (
              <ImageHover
                key={chunkItems[4].id}
                href={getHref(chunkItems[4])}
                height={lagerHeight}
                width={lagerWidth}
                images={chunkItems[4].images}
                name={chunkItems[4].name}
                description={tPrice('price', { price: chunkItems[4].price - chunkItems[4].discountPrice })}
              />
            )
            : null}
          {chunkItems?.[5]
            ? (
              <ImageHover
                key={chunkItems[5].id}
                href={getHref(chunkItems[5])}
                height={lagerHeight}
                width={lagerWidth}
                images={chunkItems[5].images}
                name={chunkItems[5].name}
                description={tPrice('price', { price: chunkItems[5].price - chunkItems[5].discountPrice })}
              />
            )
            : null}
        </div>
      </div>
      <div className={cn('d-flex justify-content-between gap-5', { 'flex-row-reverse': isReverse })}>
        {chunkItems?.[6]
          ? (
            <ImageHover
              key={chunkItems[6].id}
              className={cn('col-6', { 'align-items-end': isReverse })}
              href={getHref(chunkItems[6])}
              height={lagerHeight}
              width={lagerWidth}
              images={chunkItems[6].images}
              name={chunkItems[6].name}
              description={tPrice('price', { price: chunkItems[6].price - chunkItems[6].discountPrice })}
            />
          )
          : null}
        {chunkItems?.[7]
          ? (
            <ImageHover
              key={chunkItems[7].id}
              className={cn('col-3 align-self-end', { 'align-items-end': !isReverse })}
              href={getHref(chunkItems[7])}
              height={height}
              width={width}
              images={chunkItems[7].images}
              name={chunkItems[7].name}
              description={tPrice('price', { price: chunkItems[7].price - chunkItems[7].discountPrice })}
            />
          )
          : null}
      </div>
    </div>
  );
};

const Catalog = ({ items: propsItems, paginationParams: propsPaginationParams, itemGroup }: { items: ItemInterface[]; paginationParams: PaginationInterface; itemGroup?: ItemGroupInterface; }) => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.catalog' });
  const { t: tToast } = useTranslation('translation', { keyPrefix: 'toast' });

  const chunkNumber = 8;

  const { pagination } = useAppSelector((state) => state.app);

  const { setIsSubmit } = useContext(SubmitContext);
  
  const router = useRouter();
  const dispatch = useAppDispatch();
  
  const urlParams = useSearchParams();
  
  const typesParams = urlParams.getAll('groupIds');
  const collectionsParams = urlParams.getAll('collectionIds');
  const compositionParams = urlParams.getAll('compositionIds');
  const fromParams = urlParams.get('from');
  const toParams = urlParams.get('to');

  const preparedInitialValues: CatalogFiltersInterface = {
    itemGroups: typesParams,
    itemCollections: collectionsParams,
    compositions: compositionParams,
    from: fromParams,
    to: toParams,
  };

  const [items, setItems] = useState<ItemInterface[]>(propsItems);
  const [initialValues, setInitialValues] = useState<CatalogFiltersInterface>(preparedInitialValues);

  const onFilters = async (values: CatalogFiltersInterface, paginationParams?: Pick<PaginationInterface, 'limit' | 'offset'>) => {
    try {
      setIsSubmit(true);

      const params = {
        ...(values?.itemGroups?.length ? { groupIds: values.itemGroups } : {}),
        ...(values?.itemCollections?.length ? { collectionIds: values.itemCollections } : {}),
        ...(values?.compositions?.length ? { compositionIds: values.compositions } : {}),
        ...(values?.from ? { from: values.from } : {}),
        ...(values?.to ? { to: values.to } : {}),
      };

      router.push({ query: { ...params, ...(itemGroup ? { path: [itemGroup.code] } : {}) } }, undefined, { shallow: true });

      const { data } = await axios.get<PaginationEntityInterface<ItemInterface>>(routes.getItemList({ isServer: true }), {
        params: { ...params, limit: paginationParams?.limit || chunkNumber, offset: paginationParams?.offset || 0 },
      });
      if (data.code === 1) {
        setItems(paginationParams ? (state) => [...state, ...data.items] : data.items);
        dispatch(setPaginationParams(data.paginationParams));
        setInitialValues(values);
        scrollTop();
      }
      setIsSubmit(false);
    } catch (e) {
      axiosErrorHandler(e, tToast, setIsSubmit);
    }
  };

  useEffect(() => {
    dispatch(setPaginationParams(propsPaginationParams));
  }, [propsPaginationParams]);

  useEffect(() => {
    if (itemGroup) {
      setInitialValues((state) => ({ ...state, itemGroups: [itemGroup.id.toString()] }));
      setItems(propsItems);
    }
  }, [itemGroup?.id]);
  
  return (
    <div className="d-flex col-12 justify-content-between">
      <Helmet title={itemGroup ? itemGroup.name : t('title')} description={itemGroup ? itemGroup.description : t('description')} />
      <FloatButton.BackTop />
      <div className="d-flex col-2">
        <CatalogItemsFilter onFilters={onFilters} initialValues={initialValues} setIsSubmit={setIsSubmit} itemGroup={itemGroup} />
      </div>
      <div className="d-flex col-9">
        <div className="w-100">
          <InfiniteScroll
            dataLength={items.length}
            next={() => onFilters(initialValues, { limit: pagination.limit, offset: pagination.offset + chunkNumber })}
            hasMore={items.length < pagination.count}
            loader={<Skeleton avatar paragraph={{ rows: 1 }} active />}
            scrollableTarget="scrollableDiv"
            className="w-100"
          >
            <div className="d-flex flex-column gap-5">
              {chunk(items, chunkNumber).map((chunkItems, i) => <CatalogItems chunkItems={chunkItems} i={i} key={i} />)}
            </div>
          </InfiniteScroll>
        </div>
      </div>
    </div>
  );
};

export default Catalog;
