import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

import { routes } from '@/routes';
import { axiosErrorHandler } from '@/utilities/axiosErrorHandler';
import type { ItemHistoryResponseInterface, ItemHistoryRowInterface } from '@/types/item/ItemHistory';

const PAGE_SIZE = 40;

type UseItemHistoryParams = {
  /** Идентификатор товара */
  itemId: number;
  /** При открытии модалки сбрасывает список и подгружает первую страницу */
  open: boolean;
};

type UseItemHistoryResult = {
  /** Накопленные строки истории */
  rows: ItemHistoryRowInterface[];
  /** Идёт запрос */
  loading: boolean;
  /** Есть ли ещё записи для подгрузки */
  hasMore: boolean;
  /** Подгрузить следующую страницу (append к `rows`) */
  loadMore: () => void;
};

/**
 * Загрузка постраничной истории изменений товара (нейтральный слой для V1/V2 UI)
 * @param itemId - идентификатор товара
 * @param open - пока `true`, при монтировании/открытии выполняется первая загрузка
 * @returns `rows`, `loading`, `hasMore`, `loadMore` для отображения ленты и кнопки «ещё»
 */
export const useItemHistory = ({ itemId, open }: UseItemHistoryParams): UseItemHistoryResult => {
  const { t: tToast } = useTranslation('translation', { keyPrefix: 'toast' });
  const [rows, setRows] = useState<ItemHistoryRowInterface[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);

  const hasMore = rows.length < total;

  const fetchPage = useCallback(async (append: boolean, nextOffset: number) => {
    setLoading(true);
    try {
      const { data } = await axios.get<ItemHistoryResponseInterface>(routes.item.getHistory(itemId), {
        params: { limit: PAGE_SIZE, offset: nextOffset },
      });
      if (data.code !== 1) {
        return;
      }
      setTotal(data.paginationParams.count);
      setOffset(nextOffset + data.history.length);
      setRows((previous) => (append ? [...previous, ...data.history] : data.history));
    } catch (error) {
      axiosErrorHandler(error, tToast);
    } finally {
      setLoading(false);
    }
  }, [itemId, tToast]);

  useEffect(() => {
    if (!open) {
      return;
    }
    setRows([]);
    setTotal(0);
    setOffset(0);
    fetchPage(false, 0);
  }, [open, fetchPage]);

  const loadMore = useCallback(() => {
    if (!hasMore || loading) {
      return;
    }
    fetchPage(true, offset);
  }, [fetchPage, hasMore, loading, offset]);

  return {
    rows,
    loading,
    hasMore,
    loadMore,
  };
};
