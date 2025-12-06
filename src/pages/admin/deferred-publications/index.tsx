import { useTranslation } from 'react-i18next';
import { useContext, useEffect, useState, useEffectEvent } from 'react';
import { useRouter } from 'next/router';
import { Table, Divider } from 'antd';
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
import { MobileContext, SubmitContext } from '@/components/Context';
import { DateFormatEnum } from '@/utilities/enums/date.format.enum';
import { ItemSortEnum } from '@server/types/item/enums/item.sort.enum';
import type { ItemInterface } from '@/types/item/Item';
import type { DeferredPublicationEntity } from '@server/db/entities/deferred.publication.entity';
import type { PaginationEntityInterface } from '@/types/PaginationInterface';

interface DataType {
  key: React.Key;
  item: ItemInterface;
  date: null | Date;
}

const DeferredPublication = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.deferredPublication' });
  const { t: tToast } = useTranslation('translation', { keyPrefix: 'toast' });

  const router = useRouter();

  const { setIsSubmit } = useContext(SubmitContext);
  const { isMobile } = useContext(MobileContext);

  const coefficient = 1.3;

  const width = 115;
  const height = width * coefficient;

  const { axiosAuth } = useAppSelector((state) => state.app);
  const { isAdmin, lang } = useAppSelector((state) => state.user);

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

  return isAdmin ? (
    <>
      <Helmet title={t('title')} description={t('description')} />
      <h1 className="font-good-vibes-pro text-center mb-5" style={{ marginTop: isMobile ? '30%' : '12%' }}>{t('titleWithCount', { count: deferredPublicationData.length + deferredPostData.length })}</h1>
      <div className="d-flex flex-column flex-xl-row align-items-start align-items-xl-center gap-3 mb-3 mb-xl-5">
        <BackButton style={{}} />
      </div>
      <div className="d-flex flex-column flex-xl-row justify-content-around col-12">
        <div className="d-flex flex-column col-12 col-xl-5">
          <Divider className="font-oswald fs-5">{t('toSite')}</Divider>
          <Table
            dataSource={deferredPostData}
            pagination={false}
            bordered
            onRow={(record) => ({
              onClick: () => router.push(getHref(record.item)),
              style: { cursor: 'pointer' },
            })}
            className="td-padding-unset"
            locale={{
              emptyText: <NotFoundContent style={{ minHeight: height }} />,
            }}
          >
            <Table.Column<DataType> title={() => <div className="text-center">{t('table.item')}</div>} dataIndex="item" render={(item: ItemInterface) => (
              <div className="d-flex flex-column flex-xl-row align-items-center gap-4 w-100">
                <ImageHover className="align-self-start" images={item.images} height={height} width={width} />
                <span>{item?.translations.find((translation) => translation.lang === lang)?.name}</span>
              </div>
            )} />
            <Table.Column<DataType> title={t('table.date')} dataIndex="date" render={(date: Date) => moment(date).format(DateFormatEnum.DD_MM_YYYY_HH_MM)} />
          </Table>
        </div>
        <div className="d-flex flex-column col-12 col-xl-5">
          <Divider className="font-oswald fs-5">{t('toTelegram')}</Divider>
          <Table
            dataSource={deferredPublicationData}
            pagination={false}
            bordered
            onRow={(record) => ({
              onClick: () => router.push(getHref(record.item)),
              style: { cursor: 'pointer' },
            })}
            className="td-padding-unset"
            locale={{
              emptyText: <NotFoundContent style={{ minHeight: height }} />,
            }}
          >
            <Table.Column<DataType> title={() => <div className="text-center">{t('table.item')}</div>} dataIndex="item" render={(item: ItemInterface) => (
              <div className="d-flex flex-column flex-xl-row align-items-center gap-4 w-100">
                <ImageHover className="align-self-start" images={item.images} height={height} width={width} />
                <span>{item?.translations.find((translation) => translation.lang === lang)?.name}</span>
              </div>
            )} />
            <Table.Column<DataType> title={t('table.date')} dataIndex="date" render={(date: Date) => moment(date).format(DateFormatEnum.DD_MM_YYYY_HH_MM)} />
          </Table>
        </div>
      </div>
    </>
  ) : null;
};

export default DeferredPublication;
