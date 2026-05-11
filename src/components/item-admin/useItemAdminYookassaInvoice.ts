import { useCallback, useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import _ from 'lodash';

import { SubmitContext } from '@/components/Context';
import { routes } from '@/routes';
import { axiosErrorHandler } from '@/utilities/axiosErrorHandler';
import type { ItemInterface } from '@/types/item/Item';

type CreateInvoiceResponse = {
  code: number;
  invoiceUrl: string;
  invoiceId: string;
  invoiceExpiresAt: string;
};

type GetInvoiceResponse = {
  code: number;
  invoiceUrl: string | null;
  invoiceExpiresAt: string | null;
};

/**
 * Создание / показ / обновление счёта ЮKassa с карточки товара (админ).
 */
export const useItemAdminYookassaInvoice = (item: ItemInterface, setItem: (value: ItemInterface) => void) => {
  const { t: tToast } = useTranslation('translation', { keyPrefix: 'toast' });
  const { setIsSubmit } = useContext(SubmitContext);
  const [invoiceUrl, setInvoiceUrl] = useState<string | null>(null);
  const [invoiceExpiresAt, setInvoiceExpiresAt] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const hasStoredInvoice = !_.isNil(item.yookassaInvoiceId) && item.yookassaInvoiceId !== '';

  const openModalWithUrl = useCallback((url: string, expiresAtIso?: string | null) => {
    setInvoiceUrl(url);
    setInvoiceExpiresAt(_.isNil(expiresAtIso) || expiresAtIso === '' ? null : expiresAtIso);
    setModalOpen(true);
  }, []);

  const createOrRefreshInvoice = useCallback(async (): Promise<{ invoiceUrl: string; invoiceExpiresAt: string; } | null> => {
    setIsSubmit(true);
    try {
      const { data } = await axios.post<CreateInvoiceResponse>(routes.item.yookassaInvoice(item.id));
      if (data.code === 1) {
        setItem({ ...item, yookassaInvoiceId: data.invoiceId });
        return { invoiceUrl: data.invoiceUrl, invoiceExpiresAt: data.invoiceExpiresAt };
      }
      return null;
    } catch (error) {
      axiosErrorHandler(error, tToast, setIsSubmit);
      return null;
    } finally {
      setIsSubmit(false);
    }
  }, [item, setItem, setIsSubmit, tToast]);

  const onCreateOrRefreshClick = useCallback(async () => {
    const payload = await createOrRefreshInvoice();
    if (payload) {
      openModalWithUrl(payload.invoiceUrl, payload.invoiceExpiresAt);
    }
  }, [createOrRefreshInvoice, openModalWithUrl]);

  const onShowClick = useCallback(async () => {
    if (invoiceUrl) {
      openModalWithUrl(invoiceUrl, invoiceExpiresAt);
      return;
    }
    setIsSubmit(true);
    try {
      const { data } = await axios.get<GetInvoiceResponse>(routes.item.yookassaInvoice(item.id));
      if (data.code === 1 && data.invoiceUrl) {
        openModalWithUrl(data.invoiceUrl, data.invoiceExpiresAt);
        return;
      }
      setItem({ ...item, yookassaInvoiceId: null });
    } catch (error) {
      axiosErrorHandler(error, tToast, setIsSubmit);
    } finally {
      setIsSubmit(false);
    }
  }, [invoiceUrl, invoiceExpiresAt, item, openModalWithUrl, setIsSubmit, setItem, tToast]);

  const onRefreshIconClick = useCallback(async () => {
    const payload = await createOrRefreshInvoice();
    if (payload) {
      openModalWithUrl(payload.invoiceUrl, payload.invoiceExpiresAt);
    }
  }, [createOrRefreshInvoice, openModalWithUrl]);

  const closeModal = useCallback(() => {
    setModalOpen(false);
  }, []);

  return {
    hasStoredInvoice,
    invoiceUrl,
    invoiceExpiresAt,
    modalOpen,
    closeModal,
    onCreateOrRefreshClick,
    onShowClick,
    onRefreshIconClick,
  };
};
