import { useContext, useEffect, useState, useEffectEvent, type Dispatch, type SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/router';
import axios from 'axios';
import moment from 'moment';

import {
  deleteItem,
  type ItemResponseInterface,
  type PublishTelegramInterface,
  publishItem,
  restoreItem,
  partialUpdateItem,
  type DeferredPublicationIResponsenterface,
} from '@/slices/appSlice';
import { routes } from '@/routes';
import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks';
import { MobileContext, SubmitContext } from '@/components/Context';
import { DateFormatEnum } from '@/utilities/enums/date.format.enum';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';
import { toast } from '@/utilities/toast';
import { axiosErrorHandler } from '@/utilities/axiosErrorHandler';
import type { ItemInterface } from '@/types/item/Item';
import type { ItemAdminPublishModalProps, PublicationDateFormInterface } from '@/components/item-admin/itemAdmin.types';

export interface UseItemAdminPanelResult {
  isAdmin: boolean;
  isMobile: boolean;
  lang: UserLangEnum;
  modalProps: ItemAdminPublishModalProps;
  onEdit: () => void;
  restoreItemHandler: () => Promise<void>;
  deleteItemHandler: () => Promise<void>;
  onDeferredPublicationEdit: () => void;
  onPublicationDateEdit: () => void;
  onPublicationDateRemove: () => Promise<void>;
  onPublicationRemove: () => Promise<void>;
  onMessageRemove: () => Promise<void>;
  setIsTgPublish: Dispatch<SetStateAction<boolean>>;
}

export const useItemAdminPanel = (
  item: ItemInterface,
  setItem: (value: ItemInterface) => void,
): UseItemAdminPanelResult => {
  const { t: tToast } = useTranslation('translation', { keyPrefix: 'toast' });
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAdmin, lang = UserLangEnum.RU } = useAppSelector((state) => state.user);
  const { setIsSubmit } = useContext(SubmitContext);
  const { isMobile } = useContext(MobileContext);

  const [publicationDate, setPublicationDate] = useState<Date | null>(null);
  const [isTgPublish, setIsTgPublish] = useState(false);
  const [publishData, setPublishData] = useState<PublishTelegramInterface>({
    date: item?.deferredPublication?.date ?? null,
    time: item?.deferredPublication?.date ? moment(item.deferredPublication.date).format(DateFormatEnum.HH_MM) : null,
    description: item.translations.find((translation) => translation.lang === lang)?.description as string,
  });

  const setPublishDataEffect = useEffectEvent(setPublishData);

  const restoreItemHandler = async () => {
    setIsSubmit(true);
    const { payload } = await dispatch(restoreItem(item.id)) as { payload: ItemResponseInterface; };
    if (payload.code === 1) {
      setItem(payload.item);
    }
    setIsSubmit(false);
  };

  const deleteItemHandler = async () => {
    setIsSubmit(true);
    const { payload } = await dispatch(deleteItem(item.id)) as { payload: ItemResponseInterface };
    if (payload.code === 1) {
      setItem(payload.item);
      toast(tToast('itemDeletedSuccess', { name: item.translations.find((translation) => translation.lang === lang)?.name }), 'success');
    }
    setIsSubmit(false);
  };

  const onEdit = () => router.push({
    pathname: router.pathname,
    query: { ...router.query, edit: true },
  }, undefined, { shallow: true });

  const onPublish = async (values: PublishTelegramInterface) => {
    setIsSubmit(true);
    const [tgH, tgM] = values.time ? values.time.split(':') : [null, null];
    delete values.time;

    if (values.date && tgH && tgM) {
      values.date = moment(values.date).set({ hour: +tgH, minute: +tgM }).toDate();
    }

    if (item.deferredPublication) {
      try {
        const { data } = await axios.put<DeferredPublicationIResponsenterface>(routes.deferredPublication.telegram.updateOne(item.deferredPublication.id), {
          id: item.deferredPublication.id,
          item: { id: item.id },
          ...values,
        });
        if (data.code === 1) {
          setItem({ ...item, deferredPublication: data.deferredPublication });
          setIsTgPublish(false);
          toast(tToast('itemPublishPlannedUpdateSuccess', { name: item.translations.find((translation) => translation.lang === lang)?.name }), 'success');
        }
      } catch (e) {
        axiosErrorHandler(e, tToast, setIsSubmit);
      }
    } else {
      const { payload } = await dispatch(publishItem({ id: item.id, ...values })) as { payload: ItemResponseInterface & { error: string; } };
      if (!payload?.error) {
        setItem(payload.item);
        setIsTgPublish(false);
        toast(tToast(payload.item.deferredPublication && !payload.item.deferredPublication.isPublished ? 'itemPublishPlannedSuccess' : 'itemPublishSuccess', { name: item.translations.find((translation) => translation.lang === lang)?.name }), 'success');
      }
    }
    setIsSubmit(false);
  };

  const onPublicationDateUpdate = async (values: PublicationDateFormInterface) => {
    setIsSubmit(true);
    const [tgH, tgM] = values.publicationTime ? values.publicationTime.split(':') : [null, null];

    if (values.publicationDate && values.publicationTime && tgH && tgM) {
      values.publicationDate = moment(values.publicationDate).set({ hour: +tgH, minute: +tgM }).toDate();

      const { payload } = await dispatch(partialUpdateItem({ id: item.id, data: { publicationDate: values.publicationDate } })) as { payload: ItemResponseInterface; };
      setItem(payload.item);
      setPublicationDate(null);
      toast(tToast('itemPublishPlannedUpdateSuccess', { name: item.translations.find((translation) => translation.lang === lang)?.name }), 'success');
    }
    setIsSubmit(false);
  };

  const onMessageRemove = async () => {
    setIsSubmit(true);
    const { payload } = await dispatch(partialUpdateItem({ id: item.id, data: { message: null } })) as { payload: ItemResponseInterface; };
    setItem(payload.item);
    setIsSubmit(false);
  };

  const onPublicationDateRemove = async () => {
    setIsSubmit(true);
    const { payload } = await dispatch(partialUpdateItem({ id: item.id, data: { publicationDate: null } })) as { payload: ItemResponseInterface; };
    setItem(payload.item);
    setIsSubmit(false);
  };

  const onPublicationRemove = async () => {
    try {
      if (!item.deferredPublication) {
        return;
      }
      setIsSubmit(true);
      const { data } = await axios.delete<DeferredPublicationIResponsenterface>(routes.deferredPublication.telegram.deleteOne(item.deferredPublication.id));
      if (data.code === 1) {
        try {
          const { data: fresh } = await axios.get<ItemResponseInterface>(routes.item.getByName({ isServer: false }), {
            params: { translateName: item.translateName },
          });
          if (fresh.code === 1 && fresh.item) {
            setItem({ ...fresh.item, grades: fresh.item.grades ?? item.grades });
            setIsSubmit(false);
            return;
          }
        } catch {
          /* fallback ниже */
        }
        setItem({ ...item, deferredPublication: null });
      }
      setIsSubmit(false);
    } catch (e) {
      axiosErrorHandler(e, tToast, setIsSubmit);
    }
  };

  const onDeferredPublicationEdit = () => {
    if (item.deferredPublication) {
      setPublishData({
        date: moment(item.deferredPublication.date).toDate(),
        time: moment(item.deferredPublication.date).format(DateFormatEnum.HH_MM),
        description: item.deferredPublication.description,
      });
      setIsTgPublish(true);
    }
  };

  const onPublicationDateEdit = () => {
    if (item.publicationDate) {
      setPublicationDate(item.publicationDate);
    }
  };

  const generateDescription = async () => {
    try {
      setIsSubmit(true);
      const { data } = await axios.get<{ code: number; description: string; }>(routes.integration.gpt.generateDescription(item.id));
      if (data.code === 1) {
        setPublishData((state) => ({ ...state, description: data.description }));
      }
      setIsSubmit(false);
    } catch (e) {
      axiosErrorHandler(e, tToast, setIsSubmit);
    }
  };

  useEffect(() => {
    setPublishDataEffect((state) => ({ ...state, description: item.translations.find((translation) => translation.lang === lang)?.description as string }));
  }, [lang]);

  const modalProps: ItemAdminPublishModalProps = {
    publishData,
    publicationDate,
    setPublicationDate,
    isTgPublish,
    setIsTgPublish,
    onPublish,
    onPublicationDateUpdate,
    generateDescription,
    lang: lang as UserLangEnum,
  };

  return {
    isAdmin: isAdmin ?? false,
    isMobile,
    lang: lang as UserLangEnum,
    modalProps,
    onEdit,
    restoreItemHandler,
    deleteItemHandler,
    onDeferredPublicationEdit,
    onPublicationDateEdit,
    onPublicationDateRemove,
    onPublicationRemove,
    onMessageRemove,
    setIsTgPublish,
  };
};
