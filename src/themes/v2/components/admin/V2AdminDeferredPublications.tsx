import { useTranslation } from 'react-i18next';
import { useContext, useEffect, useState, useEffectEvent } from 'react';
import { useRouter } from 'next/router';
import { Skeleton } from 'antd';
import axios from 'axios';
import moment from 'moment';

import { Helmet } from '@/components/Helmet';
import { useAppSelector } from '@/hooks/reduxHooks';
import { routes } from '@/routes';
import { axiosErrorHandler } from '@/utilities/axiosErrorHandler';
import { BackButton } from '@/components/BackButton';
import { NotFoundContent } from '@/components/NotFoundContent';
import { ImageHover } from '@/components/ImageHover';
import { getHref } from '@/utilities/getHref';
import { SubmitContext } from '@/components/Context';
import { DateFormatEnum } from '@/utilities/enums/date.format.enum';
import { ItemSortEnum } from '@server/types/item/enums/item.sort.enum';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';
import type { ItemInterface } from '@/types/item/Item';
import type { DeferredPublicationEntity } from '@server/db/entities/deferred.publication.entity';
import type { PaginationEntityInterface } from '@/types/PaginationInterface';

import styles from './V2AdminDeferredPublications.module.scss';

interface DataType {
  key: React.Key;
  item: ItemInterface;
  date: null | Date;
}

const imgWidth = 60;
const imgHeight = Math.round(imgWidth * 1.3);

interface SectionProps {
  title: string;
  data: DataType[];
  lang: string;
  isLoading: boolean;
  onRowClick: (item: ItemInterface) => void;
  t: (key: string) => string;
}

const PublicationSection = ({ title, data, lang, isLoading, onRowClick, t }: SectionProps) => (
  <div className={styles.section}>
    <p className={styles.sectionTitle}>{title}</p>

    <div className={styles.sectionBody}>
      {isLoading && !data.length && <Skeleton active />}

      {!isLoading && !data.length && (
        <div className={styles.empty}>
          <NotFoundContent />
        </div>
      )}

      {!!data.length && (
        <div className={styles.tableCard}>
          <div className={styles.tableHead}>
            <div className={styles.thCell}>{t('table.item')}</div>
            <div className={styles.thCell}>{t('table.date')}</div>
            <div />
          </div>

          {data.map((record) => (
            <div
              key={record.key as string}
              className={styles.tableRow}
              onClick={() => onRowClick(record.item)}
            >
              <div className={styles.itemCell}>
                <div className={styles.itemImg}>
                  <ImageHover images={record.item.images} height={imgHeight} width={imgWidth} />
                </div>
                <span className={styles.itemName}>
                  {record.item.translations.find((translation) => translation.lang === lang)?.name}
                </span>
              </div>
              <span className={styles.dateCell}>
                {record.date ? moment(record.date).format(DateFormatEnum.DD_MM_YYYY_HH_MM) : '—'}
              </span>
              <span className={styles.chevron}>›</span>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);

export const V2AdminDeferredPublications = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.deferredPublication' });
  const { t: tToast } = useTranslation('translation', { keyPrefix: 'toast' });

  const router = useRouter();

  const { setIsSubmit, isSubmit } = useContext(SubmitContext);

  const { axiosAuth } = useAppSelector((state) => state.app);
  const { isAdmin, lang = UserLangEnum.RU } = useAppSelector((state) => state.user);

  const [deferredPublicationData, setDeferredPublicationData] = useState<DataType[]>([]);
  const [deferredPostData, setDeferredPostData] = useState<DataType[]>([]);

  const fetchData = async () => {
    try {
      setIsSubmit(true);
      const [
        { data: { code, deferredPublications } },
        { data: { items, code: itemCode } },
      ] = await Promise.all([
        axios.get<{ code: number; deferredPublications: DeferredPublicationEntity[]; }>(routes.deferredPublication.telegram.findMany),
        axios.get<PaginationEntityInterface<ItemInterface>>(routes.item.getList({ isServer: true }), {
          params: { onlyNotPublished: true, withNotPublished: true, sort: ItemSortEnum.BY_PUBLICATION_DATE },
        }),
      ]);
      if (code === 1) {
        setDeferredPublicationData(deferredPublications.map(({ id, date, item }) => ({ key: id, date, item })));
      }
      if (itemCode === 1) {
        setDeferredPostData(items.map(({ id, publicationDate, ...rest }) => ({ key: id, date: publicationDate, item: rest as ItemInterface })));
      }
      setIsSubmit(false);
    } catch (e) {
      axiosErrorHandler(e, tToast, setIsSubmit);
    }
  };

  const fetchDataEffect = useEffectEvent(fetchData);

  useEffect(() => {
    if (axiosAuth) {
      fetchDataEffect();
    }
  }, [axiosAuth]);

  if (!isAdmin) return null;

  return (
    <div className={styles.page}>
      <Helmet title={t('title')} description={t('description')} />
      <h1 className={styles.pageTitle}>{t('titleWithCount', { count: deferredPublicationData.length + deferredPostData.length })}</h1>

      <div className={styles.controls}>
        <BackButton style={{}} />
      </div>

      <div className={styles.columns}>
        <PublicationSection
          title={t('toSite')}
          data={deferredPostData}
          lang={lang}
          isLoading={isSubmit}
          onRowClick={(item) => router.push(getHref(item))}
          t={t}
        />
        <PublicationSection
          title={t('toTelegram')}
          data={deferredPublicationData}
          lang={lang}
          isLoading={isSubmit}
          onRowClick={(item) => router.push(getHref(item))}
          t={t}
        />
      </div>
    </div>
  );
};
