import { useTranslation } from 'react-i18next';
import { useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSearchParams } from 'next/navigation';
import { LikeOutlined, DownloadOutlined } from '@ant-design/icons';
import { Popconfirm, Checkbox, List, Divider, Rate, Tag, Button } from 'antd';
import axios from 'axios';
import InfiniteScroll from 'react-infinite-scroll-component';

import { Helmet } from '@/components/Helmet';
import { useAppDispatch, useAppSelector } from '@/utilities/hooks';
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
import type { FetchItemInterface, ItemInterface } from '@/types/item/Item';
import type { PaginationEntityInterface } from '@/types/PaginationInterface';

const ItemList = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.itemList' });
  const { t: tPrice } = useTranslation('translation', { keyPrefix: 'modules.cardItem' });
  const { t: tToast } = useTranslation('translation', { keyPrefix: 'toast' });

  const dispatch = useAppDispatch();
  const router = useRouter();

  const urlParams = useSearchParams();
  const withDeletedParams = urlParams.get('withDeleted');
  const searchParams = urlParams.get('search');

  const coefficient = 1.3;

  const width = 200;
  const height = width * coefficient;

  const { axiosAuth, pagination } = useAppSelector((state) => state.app);
  const { isAdmin, lang } = useAppSelector((state) => state.user);

  const { isMobile } = useContext(MobileContext);
  const { setIsSubmit, isSubmit } = useContext(SubmitContext);

  const [data, setData] = useState<ItemInterface[]>([]);
  const [withDeleted, setWithDeleted] = useState<boolean | undefined>(booleanSchema.validateSync(withDeletedParams));
  const [search, setSearch] = useState<{ value: string; onFetch: boolean; } | undefined>({ value: searchParams as string, onFetch: true });

  const withDeletedHandler = () => setWithDeleted(!withDeleted);

  const fetchItems = async (params: FetchItemInterface, replacement = false, onFetch = true) => {
    try {
      if (isSubmit || !onFetch) {
        return;
      }
      setIsSubmit(true);
      const { data: { items, paginationParams, code } } = await axios.get<PaginationEntityInterface<ItemInterface>>(routes.getItemList({ isServer: true }), {
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

  const fetchItemsExcel = async () => {
    try {
      setIsSubmit(true);

      const response = await axios.get(routes.getItemListExcel, { responseType: 'blob' });

      const url = window.URL.createObjectURL(new Blob([response.data]));
    
      // Создаем ссылку и эмулируем клик для скачивания
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'item-register.xlsx'); // Указываем имя файла
      document.body.appendChild(link);
      link.click();
    
      // Убираем ссылку и освобождаем память
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

  useEffect(() => {
    if (data.length) {
      const params: FetchItemInterface = {
        limit: pagination.limit || 10,
        offset: 0,
        withDeleted,
        search: search?.value,
      };
      fetchItems(params, true, search?.onFetch);
    }
  }, [withDeleted, search?.value]);

  useEffect(() => {
    router.push({
      query: {
        ...(withDeleted !== undefined ? { withDeleted } : {}), 
        ...(search?.value !== undefined && search?.value !== null ? { search: search.value } : {}),
      },
    },
    undefined,
    { shallow: true });
  }, [withDeleted, search?.value]);

  useEffect(() => {
    if (axiosAuth) {
      const params: FetchItemInterface = {
        limit: 10,
        offset: 0,
        withDeleted,
        search: search?.value,
      };
      fetchItems(params);
    }
  }, [axiosAuth]);

  return isAdmin ? (
    <div className="d-flex flex-column mb-5 justify-content-center" style={isMobile ? { marginTop: '50px' } : {}}>
      <Helmet title={t('title', { count: pagination.count })} description={t('description')} />
      <h1 className="font-good-vibes-pro text-center mb-5" style={{ marginTop: '12%' }}>{t('title', { count: pagination.count })}</h1>
      <div className="d-flex flex-column flex-xl-row align-items-xl-center justify-content-between gap-4 gap-xl-0 mb-5">
        <div className="d-flex align-items-center gap-3">
          <BackButton style={{}} />
          <Checkbox checked={withDeleted} onChange={withDeletedHandler}>{t('withDeleted')}</Checkbox>
        </div>
        <div className="d-flex flex-column flex-xl-row align-items-xl-center justify-content-xl-end gap-3 col-12 col-xl-9">
          <Search search={search} withDeleted={withDeleted} setSearch={setSearch} fetch={() => fetchItems({ limit: 10, offset: 0, withDeleted, search: search?.value }, true)} />
          <Button className="col-6 col-xl-2" icon={<DownloadOutlined />} type="primary" onClick={fetchItemsExcel}>{t('getExcel')}</Button>
        </div>
      </div>
      <InfiniteScroll
        dataLength={data.length}
        next={() => fetchItems({ limit: pagination.limit, offset: pagination.offset + 10, withDeleted, search: search?.value })}
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
            <div className="d-flex align-items-center" style={i !== data.length - 1 ? { borderBlockEnd: '1px solid rgba(5, 5, 5, 0.06)' } : {}}>
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
                      : <Popconfirm key="remove" title={t('removeTitle')} description={t('removeDescription')} okText={t('remove')} cancelText={t('cancel')} onConfirm={() => onItemRemove(item.id)}>
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
                          {item.deleted ? <Tag color="volcano">{t('deleted')}</Tag> : null}
                        </div>
                        <div className="d-flex flex-column fs-5-5 gap-3">
                          <span className="lh-1">{item?.translations.find((translation) => translation.lang === lang)?.name}</span>
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

export default ItemList;
