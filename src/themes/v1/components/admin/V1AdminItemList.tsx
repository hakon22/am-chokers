import { useTranslation } from 'react-i18next';
import { useContext, useEffect, useEffectEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { useSearchParams } from 'next/navigation';
import { LikeOutlined, DownloadOutlined } from '@ant-design/icons';
import { Popconfirm, Checkbox, List, Divider, Rate, Tag, Button, Modal, InputNumber, DatePicker } from 'antd';
import axios from 'axios';
import InfiniteScroll from 'react-infinite-scroll-component';
import type { Moment } from 'moment';
import moment from 'moment';
import momentGenerateConfig from 'rc-picker/es/generate/moment';
import locale from 'antd/es/date-picker/locale/ru_RU';

import { Helmet } from '@/components/Helmet';
import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks';
import { deleteItem, restoreItem, setPaginationParams, type ItemResponseInterface } from '@/slices/appSlice';
import { routes } from '@/routes';
import { axiosErrorHandler } from '@/utilities/axiosErrorHandler';
import { booleanSchema } from '@server/utilities/convertation.params';
import { BackButton } from '@/components/BackButton';
import { Search } from '@/components/Search';
import { NotFoundContent } from '@/components/NotFoundContent';
import { ImageHover } from '@/components/ImageHover';
import { getHref } from '@/utilities/getHref';
import { MobileContext, SubmitContext } from '@/components/Context';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';
import { DateFormatEnum } from '@/utilities/enums/date.format.enum';
import { toast } from '@/utilities/toast';
import type { FetchItemInterface, ItemInterface } from '@/types/item/Item';
import type { PaginationEntityInterface } from '@/types/PaginationInterface';

const MomentDatePicker = DatePicker.generatePicker<Moment>(momentGenerateConfig);

const listParams = (
  withDeleted: boolean | undefined,
  search: string | undefined,
  outOfStock: boolean | undefined,
): Pick<FetchItemInterface, 'withDeleted' | 'search' | 'outOfStock'> => ({
  ...(withDeleted !== undefined ? { withDeleted } : {}),
  ...(search ? { search } : {}),
  ...(outOfStock ? { outOfStock: true } : {}),
});

type BulkSelection =
  | { all: true; withDeleted?: boolean; search?: string; outOfStock?: boolean }
  | { ids: number[] };

const buildBulkSelection = (
  selectAll: boolean,
  selectedIds: Set<number>,
  withDeleted: boolean | undefined,
  search: string | undefined,
  outOfStock: boolean | undefined,
): BulkSelection => {
  if (selectAll) {
    return {
      all: true,
      ...(withDeleted === true ? { withDeleted: true } : {}),
      ...(search ? { search } : {}),
      ...(outOfStock ? { outOfStock: true } : {}),
    };
  }
  return { ids: [...selectedIds] };
};

export const V1AdminItemList = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.itemList' });
  const { t: tPrice } = useTranslation('translation', { keyPrefix: 'modules.cardItem' });
  const { t: tCart } = useTranslation('translation', { keyPrefix: 'pages.cart' });
  const { t: tToast } = useTranslation('translation', { keyPrefix: 'toast' });

  const dispatch = useAppDispatch();
  const router = useRouter();

  const urlParams = useSearchParams();
  const withDeletedParams = urlParams.get('withDeleted');
  const searchParams = urlParams.get('search');
  const outOfStockParams = urlParams.get('outOfStock');

  const coefficient = 1.3;

  const width = 200;
  const height = width * coefficient;

  const { axiosAuth, pagination } = useAppSelector((state) => state.app);
  const { isAdmin, lang = UserLangEnum.RU } = useAppSelector((state) => state.user);

  const { isMobile } = useContext(MobileContext);
  const { setIsSubmit, isSubmit } = useContext(SubmitContext);

  const [data, setData] = useState<ItemInterface[]>([]);
  const [withDeleted, setWithDeleted] = useState<boolean | undefined>(booleanSchema.validateSync(withDeletedParams));
  const [outOfStock, setOutOfStock] = useState<boolean | undefined>(booleanSchema.validateSync(outOfStockParams));
  const [search, setSearch] = useState<{ value: string; onFetch: boolean; } | undefined>({ value: searchParams as string, onFetch: true });
  const [selectAll, setSelectAll] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => new Set());
  const [outStockModalOpen, setOutStockModalOpen] = useState(false);
  const [priceModalOpen, setPriceModalOpen] = useState(false);
  const [bulkOutStockDate, setBulkOutStockDate] = useState<Moment | null>(() => moment().add(1, 'day'));
  const [bulkPercentage, setBulkPercentage] = useState(10);
  const [bulkMultiple, setBulkMultiple] = useState(100);

  const filters = useMemo(() => listParams(withDeleted, search?.value, outOfStock), [withDeleted, search?.value, outOfStock]);

  const withDeletedHandler = () => setWithDeleted(!withDeleted);
  const outOfStockHandler = () => setOutOfStock(!outOfStock);

  const fetchItems = async (params: FetchItemInterface, replacement = false, onFetch = true) => {
    try {
      if (isSubmit || !onFetch) {
        return;
      }
      setIsSubmit(true);
      const { data: { items, paginationParams, code } } = await axios.get<PaginationEntityInterface<ItemInterface>>(routes.item.getList({ isServer: true }), {
        params,
      });
      if (code === 1) {
        dispatch(setPaginationParams(paginationParams));
        setData(replacement ? items : (state) => [...state, ...items]);
      }
      setIsSubmit(false);
    } catch (e) {
      axiosErrorHandler(e, tToast, setIsSubmit);
    }
  };

  const fetchItemsEffect = useEffectEvent(fetchItems);

  const refetchFromStart = () => {
    setSelectAll(false);
    setSelectedIds(new Set());
    return fetchItems({
      limit: 10,
      offset: 0,
      ...filters,
    }, true);
  };

  const fetchItemsExcel = async () => {
    try {
      setIsSubmit(true);

      const response = await axios.get(routes.item.getListExcel, { responseType: 'blob' });

      const url = window.URL.createObjectURL(new Blob([response.data]));

      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'item-register.xlsx');
      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setIsSubmit(false);
    } catch (e) {
      axiosErrorHandler(e, tToast, setIsSubmit);
    }
  };

  const handleUpdate = (result: ItemResponseInterface) => {
    if (result.code === 1) {
      setData((state) => {
        const index = state.findIndex((stateGrade) => stateGrade.id === result.item.id);
        if (index !== -1) {
          state[index] = result.item;
        }
        return state;
      });
    }
  };

  const onItemRemove = async (id: number) => {
    setIsSubmit(true);
    const { payload } = await dispatch(deleteItem(id)) as { payload: ItemResponseInterface };
    if (withDeleted) {
      handleUpdate(payload);
    } else {
      const newData = data.filter((item) => item.id !== id);
      setData(newData);
    }
    setIsSubmit(false);
  };

  const onItemRestore = async (id: number) => {
    setIsSubmit(true);
    const { payload } = await dispatch(restoreItem(id)) as { payload: ItemResponseInterface };
    handleUpdate(payload);
    setIsSubmit(false);
  };

  const selectionActive = selectAll || selectedIds.size > 0;

  const postBulkOutStock = async () => {
    if (!bulkOutStockDate) {
      return;
    }
    try {
      setIsSubmit(true);
      const sel = buildBulkSelection(selectAll, selectedIds, withDeleted, search?.value, outOfStock);
      const { data } = await axios.post<{ code: number; affectedCount: number }>(routes.item.bulkOutStock, {
        ...sel,
        outStock: bulkOutStockDate.format('YYYY-MM-DD'),
      });
      if (data.code === 1) {
        toast(tToast('itemBulkSuccess', { count: data.affectedCount }), 'success');
        setOutStockModalOpen(false);
        setIsSubmit(false);
        await refetchFromStart();
      } else {
        setIsSubmit(false);
      }
    } catch (e) {
      axiosErrorHandler(e, tToast, setIsSubmit);
    }
  };

  const postBulkClearOutStock = async () => {
    try {
      setIsSubmit(true);
      const sel = buildBulkSelection(selectAll, selectedIds, withDeleted, search?.value, outOfStock);
      const { data } = await axios.post<{ code: number; affectedCount: number }>(routes.item.bulkOutStockClear, sel);
      if (data.code === 1) {
        toast(tToast('itemBulkSuccess', { count: data.affectedCount }), 'success');
        setIsSubmit(false);
        await refetchFromStart();
      } else {
        setIsSubmit(false);
      }
    } catch (e) {
      axiosErrorHandler(e, tToast, setIsSubmit);
    }
  };

  const postBulkPriceAdjust = async () => {
    try {
      setIsSubmit(true);
      const sel = buildBulkSelection(selectAll, selectedIds, withDeleted, search?.value, outOfStock);
      const { data } = await axios.post<{ code: number; affectedCount: number; skippedBelowMin: number }>(routes.item.bulkPriceAdjust, {
        ...sel,
        percentage: bulkPercentage,
        multiple: bulkMultiple,
      });
      if (data.code === 1) {
        toast(tToast('itemBulkSuccess', { count: data.affectedCount }), 'success');
        if (data.skippedBelowMin > 0) {
          toast(tToast('itemBulkPriceSkipped', { count: data.skippedBelowMin }), 'info');
        }
        setPriceModalOpen(false);
        setIsSubmit(false);
        await refetchFromStart();
      } else {
        setIsSubmit(false);
      }
    } catch (e) {
      axiosErrorHandler(e, tToast, setIsSubmit);
    }
  };

  const toggleRowSelected = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  useEffect(() => {
    if (!axiosAuth) {
      return;
    }
    fetchItemsEffect({
      limit: 10,
      offset: 0,
      ...filters,
    }, true, search?.onFetch);
  }, [axiosAuth, withDeleted, search?.value, outOfStock]);

  useEffect(() => {
    router.push({
      query: {
        ...(withDeleted !== undefined ? { withDeleted } : {}),
        ...(search?.value !== undefined && search?.value !== null ? { search: search.value } : {}),
        ...(outOfStock ? { outOfStock: true } : {}),
      },
    },
    undefined,
    { shallow: true });
  }, [withDeleted, search?.value, outOfStock]);

  return isAdmin ? (
    <div className="d-flex flex-column mb-5 justify-content-center" style={isMobile ? { marginTop: '50px' } : {}}>
      <Helmet title={t('title', { count: pagination.count })} description={t('description')} />
      <h1 className="font-good-vibes-pro text-center mb-5" style={{ marginTop: '12%' }}>{t('title', { count: pagination.count })}</h1>
      <div className="d-flex flex-column flex-xl-row align-items-xl-center justify-content-between gap-4 gap-xl-0 mb-5">
        <div className="d-flex flex-wrap align-items-center gap-3">
          <BackButton style={{}} />
          <Checkbox checked={withDeleted} onChange={withDeletedHandler}>{t('withDeleted')}</Checkbox>
          <Checkbox checked={outOfStock} onChange={outOfStockHandler}>{t('outOfStockFilter')}</Checkbox>
          <Checkbox
            checked={selectAll}
            onChange={(e) => {
              setSelectAll(e.target.checked);
              if (e.target.checked) setSelectedIds(new Set());
            }}
          >
            {t('selectAll')}
          </Checkbox>
        </div>
        <div className="d-flex flex-column flex-xl-row align-items-xl-center justify-content-xl-end gap-3 col-12 col-xl-9">
          <Search search={search} withDeleted={withDeleted} setSearch={setSearch} fetch={() => fetchItems({ limit: 10, offset: 0, ...filters }, true)} />
          <Button className="col-6 col-xl-2" icon={<DownloadOutlined />} type="primary" onClick={fetchItemsExcel}>{t('getExcel')}</Button>
        </div>
      </div>

      {selectionActive && (
        <div className="d-flex flex-wrap align-items-center gap-2 mb-4">
          <span className="font-oswald text-muted me-2">
            {selectAll ? t('selectedAllFiltered') : t('selectedCount', { count: selectedIds.size })}
          </span>
          <Button type="primary" onClick={() => setOutStockModalOpen(true)}>{t('setOutStock')}</Button>
          <Popconfirm title={t('clearOutStockTitle')} description={t('clearOutStockDesc')} okText={t('okText')} cancelText={t('cancel')} onConfirm={postBulkClearOutStock}>
            <Button>{t('clearOutStock')}</Button>
          </Popconfirm>
          <Button onClick={() => setPriceModalOpen(true)}>{t('adjustPrices')}</Button>
        </div>
      )}

      <Modal
        open={outStockModalOpen}
        title={t('outStockModalTitle')}
        onOk={postBulkOutStock}
        onCancel={() => setOutStockModalOpen(false)}
        okText={t('apply')}
        cancelText={t('cancel')}
        confirmLoading={isSubmit}
      >
        <MomentDatePicker
          className="w-100"
          value={bulkOutStockDate}
          onChange={setBulkOutStockDate}
          minDate={moment().add(1, 'day')}
          allowClear={false}
          showNow={false}
          format={DateFormatEnum.DD_MM_YYYY}
          locale={lang === UserLangEnum.RU ? locale : undefined}
        />
      </Modal>

      <Modal
        open={priceModalOpen}
        title={t('priceModalTitle')}
        onOk={postBulkPriceAdjust}
        onCancel={() => setPriceModalOpen(false)}
        okText={t('apply')}
        cancelText={t('cancel')}
        confirmLoading={isSubmit}
      >
        <div className="d-flex flex-column gap-3">
          <label className="small">{t('percentage')}</label>
          <InputNumber className="w-100" value={bulkPercentage} onChange={(v) => setBulkPercentage(typeof v === 'number' ? v : 0)} />
          <label className="small">{t('multiple')}</label>
          <InputNumber className="w-100" min={1} value={bulkMultiple} onChange={(v) => setBulkMultiple(typeof v === 'number' ? v : 1)} />
        </div>
      </Modal>

      <InfiniteScroll
        dataLength={data.length}
        next={() => fetchItems({ limit: pagination.limit, offset: (pagination.offset || 0) + 10, ...filters })}
        hasMore={data.length < pagination.count}
        loader
        endMessage={data.length ? <Divider plain className="font-oswald fs-6 mt-5">{t('finish')}</Divider> : null}
        style={{ overflow: 'unset' }}
      >
        <List
          dataSource={data}
          locale={{
            emptyText: <NotFoundContent text={t('reviewsNotExist')} />,
          }}
          loading={isSubmit}
          renderItem={(item, i) => (
            <div className="d-flex align-items-center gap-3" style={i !== data.length - 1 ? { borderBlockEnd: '1px solid rgba(5, 5, 5, 0.06)' } : {}}>
              <div className="d-flex align-items-start py-2 ps-1 pe-2 flex-shrink-0">
                <Checkbox
                  style={{ marginTop: 8 }}
                  checked={selectAll || selectedIds.has(item.id)}
                  onChange={() => {
                    if (!selectAll) {
                      toggleRowSelected(item.id);
                    }
                  }}
                  disabled={selectAll}
                />
              </div>
              <div className="d-flex flex-column flex-xl-row gap-4 w-100 py-2">
                <ImageHover
                  height={height}
                  width={width}
                  href={getHref(item)}
                  style={{ borderRadius: 7 }}
                  images={item?.images ?? []}
                />
                <List.Item
                  className="d-flex flex-column w-100 p-0"
                  classNames={{ actions: 'ms-0 align-self-start' }}
                  actions={
                    [item.deleted
                      ? <a key="restore" title={t('restore')} onClick={() => onItemRestore(item.id)}>{t('restore')}</a>
                      : <Popconfirm key="remove" rootClassName="ant-input-group-addon" title={t('removeTitle')} description={t('removeDescription')} okText={t('remove')} cancelText={t('cancel')} onConfirm={() => onItemRemove(item.id)}>
                        <a>{t('remove')}</a>
                      </Popconfirm>]
                  }>
                  <List.Item.Meta
                    className="w-100 mb-3 mb-xl-5"
                    title={
                      <div className="d-flex flex-column gap-3 mb-3 font-oswald" style={{ fontWeight: 400 }}>
                        <div className="d-flex align-items-center gap-3">
                          <div className="d-flex align-items-center gap-2" title={(item.rating?.rating ?? 0).toString()}>
                            <Rate disabled allowHalf value={item.rating?.rating ?? 0} />
                            <span>{item.rating?.rating ?? 0}</span>
                          </div>
                          <div className="d-flex align-items-center gap-2">
                            <LikeOutlined />
                            <span>{tPrice('grades.gradeCount', { count: item.grades.length })}</span>
                          </div>
                          {item.deleted ? <Tag color="volcano" variant="outlined">{t('deleted')}</Tag> : null}
                        </div>
                        <div className="d-flex flex-column fs-5-5 gap-3">
                          {item.group?.translations?.find((translation) => translation.lang === lang)?.name
                            ? (
                              <span className="fs-6 lh-1" style={{ color: '#3b6099' }}>
                                {item.group.translations.find((translation) => translation.lang === lang)?.name}
                              </span>
                            )
                            : null}
                          <span className="lh-1">{item?.translations.find((translation) => translation.lang === lang)?.name}</span>
                          {item.outStock
                            ? (
                              <span className="fs-6" style={{ color: '#74b6d5' }}>
                                {tCart('isAbsentLabel')}{' '}
                                <span style={{ whiteSpace: 'nowrap' }}>{tCart('isAbsentDate', { date: moment(item.outStock).format(DateFormatEnum.DD_MM) })}</span>
                              </span>
                            )
                            : null}
                          <span>{tPrice('price', { price: item.price })}</span>
                        </div>
                      </div>
                    } />
                </List.Item>
              </div>
            </div>
          )}
        />
      </InfiniteScroll>
    </div>
  ) : null;
};
