import { useTranslation } from 'react-i18next';
import { useCallback, useContext, useEffect, useEffectEvent, useState } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { useRouter } from 'next/router';
import axios from 'axios';
import { useSearchParams } from 'next/navigation';
import { Skeleton, Button, Form } from 'antd';
import cn from 'classnames';
import { chunk, isEmpty, isNil } from 'lodash';

import { routes } from '@/routes';
import { Helmet } from '@/components/Helmet';
import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks';
import { MobileContext, SearchContext, SubmitContext } from '@/components/Context';
import { axiosErrorHandler } from '@/utilities/axiosErrorHandler';
import { CatalogItemsFilter } from '@/components/filters/catalog/CatalogItemsFilter';
import { setPaginationParams } from '@/slices/appSlice';
import { ImageHover } from '@/components/ImageHover';
import { getHref } from '@/utilities/getHref';
import { getCatalogServerSideProps as getServerSideProps } from '@/pages/catalog/[...path]';
import { scrollTop } from '@/utilities/scrollTop';
import { NotFoundContent } from '@/components/NotFoundContent';
import { getWidth } from '@/utilities/screenExtension';
import { scrollToElement } from '@/utilities/scrollToElement';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';
import type { PagePropsInterface } from '@/pages/catalog/[...path]';
import type { ItemInterface } from '@/types/item/Item';
import type { PaginationEntityInterface, PaginationInterface } from '@/types/PaginationInterface';

export interface CatalogFiltersInterface {
  groupIds?: string[];
  collectionIds?: string[];
  compositionIds?: string[];
  colorIds?: string[];
  from?: string | null;
  to?: string | null;
  search?: string | null;
  new?: string | null;
  bestseller?: string | null;
  sort?: string | null;
}

export { getServerSideProps };

const RenderCatalogItem = ({ width, height, className, item, lang }: { width: number; height: number; className?: string; item?: ItemInterface; lang: UserLangEnum; }) => {
  const { t: tPrice } = useTranslation('translation', { keyPrefix: 'modules.cardItem' });

  return item
    ? (
      <ImageHover
        key={item.id}
        href={getHref(item)}
        className={className}
        height={height}
        width={width}
        isAbsent={item.isAbsent}
        images={item.images}
        name={item?.translations.find((translation) => translation.lang === lang)?.name}
        rating={{ rating: item.rating, grades: item.grades }}
        description={tPrice('price', { price: item.price - item.discountPrice })}
      />
    ) 
    : null;
};

const CatalogItems = ({ chunkItems, i, isSkeleton, lang }: { chunkItems: ItemInterface[]; i: number; isSkeleton?: boolean; lang: UserLangEnum; }) => {
  const { isMobile } = useContext(MobileContext);

  const isReverse = i % 2 !== 0;

  const coefficient = 1.3;

  const defaultWidth = 200;
  const defaultHeight = defaultWidth * coefficient;

  const defaultLagerWidth = 260;
  const defaultLagerHeight = defaultLagerWidth * coefficient;

  const [width, setWidth] = useState(defaultWidth);
  const [lagerWidth, setLagerWidth] = useState(defaultLagerWidth);

  const [height, setHeight] = useState(defaultHeight);
  const [lagerHeight, setLagerHeight] = useState(defaultLagerHeight);

  const [extensionValue, setExtensionValue] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      const extension = getWidth();
      setExtensionValue(extension);

      if (extension < 576) {
        const value = extension * 0.43;

        setWidth(value);
        setHeight(value * coefficient);
        setLagerWidth(extension - 40);
        setLagerHeight((extension - 40) * coefficient);
      } else if (extension < 768) {
        const value = 240;

        setWidth(value);
        setHeight(value * coefficient);
        setLagerWidth(500);
        setLagerHeight(500 * coefficient);
      } else if (extension < 1200) {
        const value = 210;

        setWidth(value);
        setHeight(value * coefficient);
        setLagerWidth(330);
        setLagerHeight(330 * coefficient);
      } else {
        setWidth(defaultWidth);
        setHeight(defaultHeight);
        setLagerWidth(defaultLagerWidth);
        setLagerHeight(defaultLagerHeight);
      }
    };
  
    handleResize();
    window.addEventListener('resize', handleResize);
  
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile
    ? extensionValue < 768
      ? (
        <div id={`${i + 1}`} className="d-flex flex-column gap-5 col-12 part">
          <div className="d-flex justify-content-between">
            {isSkeleton ? (
              <>
                <Skeleton.Image className="mt-5" style={{ width, height }} active />
                <Skeleton.Image className="mt-5" style={{ width, height }} active />
              </>
            ) : (
              <>
                <RenderCatalogItem width={width} height={height} item={chunkItems[0]} lang={lang} />
                <RenderCatalogItem width={width} height={height} item={chunkItems[1]} lang={lang} />
              </>
            )}
          </div>
          <div className="d-flex justify-content-center">
            {isSkeleton ? <Skeleton.Image className="mt-5" style={{ width: lagerWidth, height: lagerHeight }} active /> : <RenderCatalogItem width={lagerWidth} height={lagerHeight} className="d-flex align-items-center" item={chunkItems[2]} lang={lang} />}
          </div>
          <div className="d-flex justify-content-between">
            {isSkeleton ? (
              <>
                <Skeleton.Image style={{ width, height }} active />
                <Skeleton.Image style={{ width, height }} active />
              </>
            ) : (
              <>
                <RenderCatalogItem width={width} height={height} item={chunkItems[3]} lang={lang} />
                <RenderCatalogItem width={width} height={height} item={chunkItems[4]} lang={lang} />
              </>
            )}
          </div>
          <div className="d-flex justify-content-center">
            {isSkeleton ? <Skeleton.Image style={{ width: lagerWidth, height: lagerHeight }} active /> : <RenderCatalogItem width={lagerWidth} height={lagerHeight} className="d-flex align-items-center" item={chunkItems[5]} lang={lang} />}
          </div>
          <div className="d-flex justify-content-between">
            {isSkeleton ? (
              <>
                <Skeleton.Image style={{ width, height }} active />
                <Skeleton.Image style={{ width, height }} active />
              </>
            ) : (
              <>
                <RenderCatalogItem width={width} height={height} item={chunkItems[6]} lang={lang} />
                <RenderCatalogItem width={width} height={height} item={chunkItems[7]} lang={lang} />
              </>
            )}
          </div>
        </div>
      )
      : (
        <div id={`${i + 1}`} className="d-flex flex-column gap-5 col-12 part">
          <div className="d-flex justify-content-between">
            {isSkeleton ? (
              <>
                <Skeleton.Image className="mt-5" style={{ width, height }} active />
                <Skeleton.Image className="mt-5" style={{ width, height }} active />
                <Skeleton.Image className="mt-5" style={{ width, height }} active />
              </>
            ) : (
              <>
                <RenderCatalogItem width={width} height={height} item={chunkItems[0]} lang={lang} />
                <RenderCatalogItem width={width} height={height} item={chunkItems[1]} lang={lang} />
                <RenderCatalogItem width={width} height={height} item={chunkItems[2]} lang={lang} />
              </>
            )}
          </div>
          <div className="d-flex justify-content-between">
            {isSkeleton ? (
              <>
                <Skeleton.Image style={{ width: lagerWidth, height: lagerHeight }} active />
                <Skeleton.Image style={{ width: lagerWidth, height: lagerHeight }} active />
              </>
            ) : (
              <>
                <RenderCatalogItem width={lagerWidth} height={lagerHeight} item={chunkItems[3]} lang={lang} />
                <RenderCatalogItem width={lagerWidth} height={lagerHeight} item={chunkItems[4]} lang={lang} />
              </>
            )}
          </div>
          <div className="d-flex justify-content-between">
            {isSkeleton ? (
              <>
                <Skeleton.Image style={{ width, height }} active />
                <Skeleton.Image style={{ width, height }} active />
                <Skeleton.Image style={{ width, height }} active />
              </>
            ) : (
              <>
                <RenderCatalogItem width={width} height={height} item={chunkItems[5]} lang={lang} />
                <RenderCatalogItem width={width} height={height} item={chunkItems[6]} lang={lang} />
                <RenderCatalogItem width={width} height={height} item={chunkItems[7]} lang={lang} />
              </>
            )}
          </div>
        </div>
      )
    : (
      <div id={`${i + 1}`} className="d-flex flex-column gap-5 col-12 part">
        <div className={cn('d-flex justify-content-between', { 'flex-row-reverse': isReverse })}>
          <div className={cn('d-flex col-6 gap-5', { 'flex-row-reverse': isReverse })}>
            {isSkeleton ? (
              <>
                <Skeleton.Image className="mt-5" style={{ width, height }} active />
                <Skeleton.Image className="mt-5" style={{ width, height }} active />
              </>
            ) : (
              <>
                <RenderCatalogItem width={width} height={height} item={chunkItems[0]} lang={lang} />
                <RenderCatalogItem width={width} height={height} item={chunkItems[1]} lang={lang} />
              </>
            )}
          </div>
          {isSkeleton ? <Skeleton.Image style={{ width, height }} active className={cn('mt-5 col-3', { 'align-items-end': !isReverse })} /> : <RenderCatalogItem width={width} height={height} item={chunkItems[2]} className={cn('col-3', { 'align-items-end': !isReverse })} lang={lang} />}
        </div>
        <div className={cn('d-flex justify-content-between', { 'flex-row-reverse': isReverse })}>
          {isSkeleton ? <Skeleton.Image style={{ width, height }} active className={cn('col-3 align-self-end', { 'align-items-end': isReverse })} /> : <RenderCatalogItem width={width} height={height} item={chunkItems[3]} className={cn('col-3 align-self-end', { 'align-items-end': isReverse })} lang={lang} />}
          <div className={cn('d-flex col-8 gap-5', { 'justify-content-end': !isReverse })}>
            {isSkeleton ? (
              <>
                <Skeleton.Image style={{ width: lagerWidth, height: lagerHeight }} active />
                <Skeleton.Image style={{ width: lagerWidth, height: lagerHeight }} active />
              </>
            ) : (
              <>
                <RenderCatalogItem width={lagerWidth} height={lagerHeight} item={chunkItems[4]} lang={lang} />
                <RenderCatalogItem width={lagerWidth} height={lagerHeight} item={chunkItems[5]} lang={lang} />
              </>
            )}
          </div>
        </div>
        <div className={cn('d-flex justify-content-between gap-5', { 'flex-row-reverse': isReverse })}>
          {isSkeleton ? (
            <>
              <Skeleton.Image style={{ width: lagerWidth, height: lagerHeight }} active className={cn('col-6', { 'align-items-end': isReverse })} />
              <Skeleton.Image style={{ width, height }} active className={cn('col-3 align-self-end', { 'align-items-end': !isReverse })} />
            </>
          ) : (
            <>
              <RenderCatalogItem width={lagerWidth} height={lagerHeight} item={chunkItems[6]} className={cn('col-6', { 'align-items-end': isReverse })} lang={lang} />
              <RenderCatalogItem width={width} height={height} item={chunkItems[7]} className={cn('col-3 align-self-end', { 'align-items-end': !isReverse })} lang={lang} />
            </>
          )}
        </div>
      </div>
    );
};

const Catalog = ({ items: propsItems, paginationParams: propsPaginationParams, itemGroup, uuid, statistics: propsStatistics }: Omit<PagePropsInterface, 'item'>) => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.catalog' });
  const { t: tToast } = useTranslation('translation', { keyPrefix: 'toast' });

  const chunkNumber = 8;

  const { pagination } = useAppSelector((state) => state.app);
  const { lang = UserLangEnum.RU } = useAppSelector((state) => state.user);

  const { setIsSubmit, isSubmit } = useContext(SubmitContext);
  const { setIsSearch } = useContext(SearchContext);
  const { isSearch } = useContext(SearchContext);
  const { isMobile } = useContext(MobileContext);
  
  const router = useRouter();
  const dispatch = useAppDispatch();
  
  const urlParams = useSearchParams();
  
  const groupParams = urlParams.getAll('groupIds');
  const collectionsParams = urlParams.getAll('collectionIds');
  const compositionParams = urlParams.getAll('compositionIds');
  const colorParams = urlParams.getAll('colorIds');
  const fromParams = urlParams.get('from');
  const toParams = urlParams.get('to');
  const searchParams = urlParams.get('search');
  const newParams = urlParams.get('new');
  const bestsellerParams = urlParams.get('bestseller');
  const sortParams = urlParams.get('sort');
  const pageParams = urlParams.get('page');

  const [isFilters, setIsFilters] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  const [form] = Form.useForm<CatalogFiltersInterface>();

  const preparedInitialValues: CatalogFiltersInterface = {
    groupIds: groupParams,
    collectionIds: collectionsParams,
    compositionIds: compositionParams,
    colorIds: colorParams,
    from: fromParams,
    to: toParams,
    search: searchParams,
    new: newParams,
    bestseller: bestsellerParams,
    sort: sortParams,
  };

  const defaultInitialValues: CatalogFiltersInterface = {
    groupIds: [],
    collectionIds: [],
    compositionIds: [],
    colorIds: [],
    from: undefined,
    to: undefined,
    search: undefined,
    new: undefined,
    bestseller: undefined,
    sort: undefined,
  };

  const [items, setItems] = useState<ItemInterface[]>(propsItems);
  const [initialValues, setInitialValues] = useState<CatalogFiltersInterface>(preparedInitialValues);
  const [statistics, setStatistics] = useState<Record<number, number>>(propsStatistics);

  const getStatistics = async (params?: CatalogFiltersInterface) => {
    try {
      const { data } = await axios.get<{ code: number; statistics: Record<number, number>; }>(routes.item.getStatistics({ isServer: false }), {
        params,
      });
      if (data.code === 1) {
        setStatistics(data.statistics);
      }
    } catch (e) {
      axiosErrorHandler(e, tToast, setIsSubmit);
    }
  };

  const onFilters = async (values: CatalogFiltersInterface, paginationParams?: Pick<PaginationInterface, 'limit' | 'offset'>) => {
    try {
      setIsSubmit(true);
      setIsFilters(true);

      if (values?.search) {
        setIsSearch({ value: false, needFetch: false });
      }

      const params = {
        ...(values?.groupIds?.length ? { groupIds: values.groupIds } : {}),
        ...(values?.collectionIds?.length ? { collectionIds: values.collectionIds } : {}),
        ...(values?.compositionIds?.length ? { compositionIds: values.compositionIds } : {}),
        ...(values?.colorIds?.length ? { colorIds: values.colorIds } : {}),
        ...(values?.from ? { from: values.from } : {}),
        ...(values?.to ? { to: values.to } : {}),
        ...(values?.new ? { new: values.new } : {}),
        ...(values?.bestseller ? { bestseller: values.bestseller } : {}),
        ...(values?.sort ? { sort: values.sort } : {}),
      };

      router.push({ query: {
        page: (paginationParams?.offset || chunkNumber) / chunkNumber,
        ...params,
        ...(itemGroup ? { path: [itemGroup.code] } : {}),
      } }, undefined, { shallow: true });

      const [{ data }] = await Promise.all([
        axios.get<PaginationEntityInterface<ItemInterface>>(routes.item.getList({ isServer: true }), {
          params: { ...params, limit: paginationParams?.limit || chunkNumber, offset: paginationParams?.offset || 0 },
        }),
        ...(!paginationParams ? [getStatistics(params)] : []),
      ]);
      if (data.code === 1) {
        setItems(paginationParams ? (state) => [...state, ...data.items] : data.items);
        dispatch(setPaginationParams(data.paginationParams));

        setInitialValues(params);

        if (!paginationParams) {
          scrollTop();
        }
      }
      if (showDrawer) {
        setShowDrawer(false);
      }
      setIsSubmit(false);
    } catch (e) {
      axiosErrorHandler(e, tToast, setIsSubmit);
    }
  };

  const handleLoadMore = useCallback(() => {
    if (!hasInitialized) {
      return;
    }

    onFilters(initialValues, {
      limit: pagination.limit,
      offset: (pagination.offset || 0) + chunkNumber,
    });
  }, [hasInitialized, pagination.offset, pagination.limit, onFilters, initialValues]);

  const setItemsEffect = useEffectEvent(setItems);
  const setInitialValuesEffect = useEffectEvent(setInitialValues);
  const setStatisticsEffect = useEffectEvent(setStatistics);
  const setIsFiltersEffect = useEffectEvent(setIsFilters);
  const onFiltersEffect = useEffectEvent(onFilters);

  const resetFilters = async () => {
    setInitialValues(defaultInitialValues);
    form.setFieldsValue(defaultInitialValues);
    await onFilters(defaultInitialValues);
  };

  useEffect(() => {
    // Создаем новый экземпляр Intersection Observer
    const threshold = isMobile ? 0.1 : 0.35;
    const observer = new IntersectionObserver((entries) => {

      let lastVisibleSectionId = null; // Храним ID последней видимой секции
  
      entries.forEach(entry => {
        // Проверяем, что секция видима не менее чем на 35%
        if (entry.isIntersecting && entry.intersectionRatio >= threshold) {
          const currentSection = entry.target.id; // Получаем id текущей секции
          lastVisibleSectionId = currentSection; // Обновляем ID последней видимой секции
        }
      });
  
      // Если есть видимая секция, обновляем параметр page в адресной строке
      if (lastVisibleSectionId && router.query.page !== lastVisibleSectionId) {
        router.push({
          pathname: router.pathname,
          query: { ...router.query, page: lastVisibleSectionId },
        }, undefined, { shallow: true });
      }
    }, {
      threshold, // Уровень пересечения для видимости 35%
    });
  
    // Получаем все секции, которые нужно отслеживать
    const sections = document.querySelectorAll('.part');
    sections.forEach(section => {
      observer.observe(section); // Начинаем наблюдение за каждой секцией
    });
  
    // Очистка при размонтировании компонента
    return () => {
      sections.forEach(section => {
        observer.unobserve(section); // Останавливаем наблюдение за каждой секцией
      });
    };
  }, [router]);

  useEffect(() => {
    if (pageParams && pageParams !== '1') {
      scrollToElement(pageParams, 120);
    }
  }, []);

  useEffect(() => {
    if (!hasInitialized) {
      setTimeout(setHasInitialized, 1000, true);
    }
  }, [hasInitialized]);

  useEffect(() => {
    if (propsPaginationParams) {
      dispatch(setPaginationParams(propsPaginationParams));
    }
  }, [propsPaginationParams]);

  useEffect(() => {
    if (searchParams) {
      setInitialValuesEffect({ search: searchParams });
      setItemsEffect(propsItems);
    } else if (!isSearch?.value) {
      setInitialValuesEffect((state) => ({ ...state, search: undefined }));
      if (isSearch?.needFetch) {
        onFiltersEffect({ ...initialValues, search: undefined });
      } else if (isFilters) {
        setIsFiltersEffect(false);
      } else {
        setItemsEffect(propsItems);
      }
    }
  }, [searchParams, isSearch?.value]);

  useEffect(() => {
    setItemsEffect(propsItems);
    setInitialValuesEffect({ ...preparedInitialValues, ...(itemGroup?.id && Object.values(preparedInitialValues).every((value) => Array.isArray(value) ? isEmpty(value) : isNil(value))) ? { groupIds: [itemGroup.id.toString()] } : {} });
    setStatisticsEffect(propsStatistics);
  }, [itemGroup?.id, uuid]);

  return (
    <div className="d-flex col-12 justify-content-between" style={isMobile ? { marginTop: '140px' } : {}}>
      <Helmet title={itemGroup ? itemGroup.translations.find((translation) => translation.lang === lang)?.name as string : t('title')} description={itemGroup ? itemGroup.translations.find((translation) => translation.lang === lang)?.description as string : t('description')} />
      <CatalogItemsFilter onFilters={onFilters} form={form} initialValues={initialValues} setInitialValues={setInitialValues} showDrawer={showDrawer} setShowDrawer={setShowDrawer} setIsSubmit={setIsSubmit} itemGroup={itemGroup} uuid={uuid} statistics={statistics} resetFilters={resetFilters} />
      <div className="d-flex col-12 col-xl-9">
        <div className="w-100">
          <InfiniteScroll
            dataLength={items.length}
            next={handleLoadMore}
            hasMore={hasInitialized && items.length < pagination.count}
            loader={isSubmit && <CatalogItems chunkItems={[]} i={0} isSkeleton lang={lang as UserLangEnum} />}
            style={{ overflow: 'unset' }}
            className="w-100"
          >
            <div className="d-flex flex-column gap-5">
              {items.length
                ? chunk(items, chunkNumber).map((chunkItems, i) => <CatalogItems chunkItems={chunkItems} i={i} key={i} lang={lang as UserLangEnum} />)
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
