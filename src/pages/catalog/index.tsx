import { useTranslation } from 'react-i18next';
import { useContext, useEffect, useState } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { useRouter } from 'next/router';
import axios from 'axios';
import { useSearchParams } from 'next/navigation';
import { Skeleton, FloatButton, Button } from 'antd';
import cn from 'classnames';
import { chunk } from 'lodash';

import { routes } from '@/routes';
import { Helmet } from '@/components/Helmet';
import { useAppDispatch, useAppSelector } from '@/utilities/hooks';
import { SearchContext, SubmitContext } from '@/components/Context';
import { axiosErrorHandler } from '@/utilities/axiosErrorHandler';
import { CatalogItemsFilter } from '@/components/filters/catalog/CatalogItemsFilter';
import { setPaginationParams } from '@/slices/appSlice';
import { ImageHover } from '@/components/ImageHover';
import { getHref } from '@/utilities/getHref';
import { getCatalogServerSideProps as getServerSideProps } from '@/pages/catalog/[...path]';
import { scrollTop } from '@/utilities/scrollTop';
import { NotFoundContent } from '@/components/NotFoundContent';
import type { ItemGroupInterface, ItemInterface } from '@/types/item/Item';
import type { PaginationEntityInterface, PaginationInterface } from '@/types/PaginationInterface';

export interface CatalogFiltersInterface {
  itemGroups?: string[];
  itemCollections?: string[];
  compositions?: string[];
  from?: string | null;
  to?: string | null;
  search?: string | null;
}

export { getServerSideProps };

const RenderCatalogItem = ({ width, height, className, item }: { width: number; height: number; className?: string; item?: ItemInterface; }) => {
  const { t: tPrice } = useTranslation('translation', { keyPrefix: 'modules.cardItem' });

  return item
    ? (
      <ImageHover
        key={item.id}
        href={getHref(item)}
        className={className}
        height={height}
        width={width}
        images={item.images}
        name={item.name}
        rating={{ rating: item.rating, grades: item.grades }}
        description={tPrice('price', { price: item.price - item.discountPrice })}
      />
    ) 
    : null;
};

const CatalogItems = ({ chunkItems, i }: { chunkItems: ItemInterface[]; i: number; }) => {
  const isReverse = i % 2 !== 0;

  const width = 200;
  const height = 260;

  const lagerWidth = 260;
  const lagerHeight = 338;

  return (
    <div className="d-flex flex-column gap-5 col-12">
      <div className={cn('d-flex justify-content-between', { 'flex-row-reverse': isReverse })}>
        <div className={cn('d-flex col-6 gap-5', { 'flex-row-reverse': isReverse })}>
          <RenderCatalogItem width={width} height={height} item={chunkItems[0]} />
          <RenderCatalogItem width={width} height={height} item={chunkItems[1]} />
        </div>
        <RenderCatalogItem width={width} height={height} item={chunkItems[2]} className={cn('col-3', { 'align-items-end': !isReverse })} />
      </div>
      <div className={cn('d-flex justify-content-between', { 'flex-row-reverse': isReverse })}>
        <RenderCatalogItem width={width} height={height} item={chunkItems[3]} className={cn('col-3 align-self-end', { 'align-items-end': isReverse })} />
        <div className={cn('d-flex col-8 gap-5', { 'justify-content-end': !isReverse })}>
          <RenderCatalogItem width={lagerWidth} height={lagerHeight} item={chunkItems[4]} />
          <RenderCatalogItem width={lagerWidth} height={lagerHeight} item={chunkItems[5]} />
        </div>
      </div>
      <div className={cn('d-flex justify-content-between gap-5', { 'flex-row-reverse': isReverse })}>
        <RenderCatalogItem width={lagerWidth} height={lagerHeight} item={chunkItems[6]} className={cn('col-6', { 'align-items-end': isReverse })} />
        <RenderCatalogItem width={width} height={height} item={chunkItems[7]} className={cn('col-3 align-self-end', { 'align-items-end': !isReverse })} />
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
  const { isSearch } = useContext(SearchContext);
  
  const router = useRouter();
  const dispatch = useAppDispatch();
  
  const urlParams = useSearchParams();
  
  const typesParams = urlParams.getAll('groupIds');
  const collectionsParams = urlParams.getAll('collectionIds');
  const compositionParams = urlParams.getAll('compositionIds');
  const fromParams = urlParams.get('from');
  const toParams = urlParams.get('to');
  const searchParams = urlParams.get('search');

  const [isFilters, setIsFilters] = useState(false);

  const preparedInitialValues: CatalogFiltersInterface = {
    itemGroups: typesParams,
    itemCollections: collectionsParams,
    compositions: compositionParams,
    from: fromParams,
    to: toParams,
    search: searchParams,
  };

  const defaultInitialValues: CatalogFiltersInterface = {
    itemGroups: itemGroup ? [itemGroup.id.toString()] : [],
    itemCollections: [],
    compositions: [],
    from: undefined,
    to: undefined,
    search: undefined,
  };

  const [items, setItems] = useState<ItemInterface[]>(propsItems);
  const [initialValues, setInitialValues] = useState<CatalogFiltersInterface>(preparedInitialValues);

  const onFilters = async (values: CatalogFiltersInterface, paginationParams?: Pick<PaginationInterface, 'limit' | 'offset'>) => {
    try {
      setIsSubmit(true);
      setIsFilters(true);

      const params = {
        ...(values?.itemGroups?.length ? { groupIds: values.itemGroups } : {}),
        ...(values?.itemCollections?.length ? { collectionIds: values.itemCollections } : {}),
        ...(values?.compositions?.length ? { compositionIds: values.compositions } : {}),
        ...(values?.from ? { from: values.from } : {}),
        ...(values?.to ? { to: values.to } : {}),
        ...(values?.search ? { search: values.search } : {}),
      };

      router.push({ query: { ...params, ...(itemGroup ? { path: [itemGroup.code] } : {}) } }, undefined, { shallow: true });

      const { data } = await axios.get<PaginationEntityInterface<ItemInterface>>(routes.getItemList({ isServer: true }), {
        params: { ...params, limit: paginationParams?.limit || chunkNumber, offset: paginationParams?.offset || 0 },
      });
      if (data.code === 1) {
        setItems(paginationParams ? (state) => [...state, ...data.items] : data.items);
        dispatch(setPaginationParams(data.paginationParams));
        setInitialValues(values);

        if (!paginationParams) {
          scrollTop();
        }
      }
      setIsSubmit(false);
    } catch (e) {
      axiosErrorHandler(e, tToast, setIsSubmit);
    }
  };

  const resetFilters = async () => {
    setInitialValues(defaultInitialValues);
    await onFilters(defaultInitialValues);
  };

  useEffect(() => {
    dispatch(setPaginationParams(propsPaginationParams));
  }, [propsPaginationParams]);

  useEffect(() => {
    if (searchParams) {
      setInitialValues((state) => ({ ...state, search: searchParams }));
      setItems(propsItems);
    } else if (!isSearch?.value) {
      setInitialValues((state) => ({ ...state, search: undefined }));
      if (isSearch?.needFetch) {
        onFilters({ ...initialValues, search: undefined });
      } else if (isFilters) {
        setIsFilters(false);
      } else {
        setItems(propsItems);
      }
    }
  }, [searchParams, isSearch?.value]);

  useEffect(() => {
    setInitialValues(initialValues);
  }, [JSON.stringify(initialValues)]);

  useEffect(() => {
    if (itemGroup) {
      setInitialValues({ ...initialValues, itemGroups: [itemGroup.id.toString()] });
      if (isFilters) {
        setIsFilters(false);
      } else {
        setItems(propsItems);
      }
    }
  }, [itemGroup?.id, JSON.stringify(initialValues)]);
  
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
              {items.length
                ? chunk(items, chunkNumber).map((chunkItems, i) => <CatalogItems chunkItems={chunkItems} i={i} key={i} />)
                : (
                  <>
                    <NotFoundContent text={t('notFound')} />
                    <Button className="button fs-6 mx-auto" onClick={resetFilters}>
                      {t('resetFilters')}
                    </Button>
                  </>)}
            </div>
          </InfiniteScroll>
        </div>
      </div>
    </div>
  );
};

export default Catalog;
