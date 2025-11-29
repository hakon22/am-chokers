import { useTranslation } from 'react-i18next';
import { useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Table, Divider, Checkbox, Select, Input, Typography } from 'antd';
import axios from 'axios';
import InfiniteScroll from 'react-infinite-scroll-component';
import moment from 'moment';
import type { SearchProps } from 'antd/lib/input';

import { Helmet } from '@/components/Helmet';
import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks';
import { setPaginationParams } from '@/slices/appSlice';
import { routes } from '@/routes';
import { axiosErrorHandler } from '@/utilities/axiosErrorHandler';
import { BackButton } from '@/components/BackButton';
import { NotFoundContent } from '@/components/NotFoundContent';
import { MobileContext, SubmitContext } from '@/components/Context';
import { booleanSchema } from '@server/utilities/convertation.params';
import { DateFormatEnum } from '@/utilities/enums/date.format.enum';
import { MessageTypeEnum } from '@server/types/message/enums/message.type.enum';
import type { PaginationEntityInterface } from '@/types/PaginationInterface';
import type { MessageQueryInterface } from '@server/types/message/message.query.interface';
import type { MessageEntity } from '@server/db/entities/message.entity';

interface DataType extends Partial<MessageEntity> {
  key: React.Key;
}

const HtmlEllipsis = ({ text }: { text: string; }) => {
  return (
    <Typography>
      <div dangerouslySetInnerHTML={{ __html: text }} />
    </Typography>
  );
};

const Message = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.reports.message' });
  const { t: tToast } = useTranslation('translation', { keyPrefix: 'toast' });

  const dispatch = useAppDispatch();
  const urlParams = useSearchParams();
  const router = useRouter();

  const typesParams = urlParams.getAll('types') as MessageTypeEnum[];
  const onlyUnsentParams = urlParams.get('onlyUnsent');
  const phoneParams = urlParams.get('phone');
  const userIdParams = urlParams.get('userId');

  const { setIsSubmit, isSubmit } = useContext(SubmitContext);
  const { isMobile } = useContext(MobileContext);

  const { axiosAuth, pagination } = useAppSelector((state) => state.app);
  const { isAdmin } = useAppSelector((state) => state.user);

  const [onlyUnsent, setOnlyUnsent] = useState<boolean | undefined>(booleanSchema.validateSync(onlyUnsentParams));
  const [data, setData] = useState<DataType[]>([]);
  const [types, setTypes] = useState<MessageTypeEnum[]>(typesParams);
  const [phone, setPhone] = useState(phoneParams);

  const fetchData = async (params: MessageQueryInterface, replacement = false) => {
    try {
      if (isSubmit) {
        return;
      }
      setIsSubmit(true);
      const queryParams = {
        types,
        onlyUnsent,
        ...(params.phone ? { phone } : {}),
        ...(userIdParams ? { userId: +userIdParams } : {}),
      };

      router.push({
        query: queryParams,
      },
      undefined,
      { shallow: true });

      const { data: { items, paginationParams, code } } = await axios.get<PaginationEntityInterface<MessageEntity>>(routes.reports.message, {
        params: { ...params, ...queryParams },
      });
      if (code === 1) {
        dispatch(setPaginationParams(paginationParams));
        setData((state) => replacement ? items.map((message) => ({ ...message, key: message.id })) : [...state, ...items.map(message => ({ ...message, key: message.id }))]);
      }
      setIsSubmit(false);
    } catch (e) {
      axiosErrorHandler(e, tToast, setIsSubmit);
    }
  };

  const onlyUnsentHandler = () => setOnlyUnsent(!onlyUnsent);

  const onPhoneSearch: SearchProps['onSearch'] = (value) => {
    setPhone(value);
    fetchData({
      limit: pagination.limit || 10,
      offset: 0,
      types,
      onlyUnsent,
      ...(value ? { phone: value } : {}),
      ...(userIdParams ? { userId: +userIdParams } : {}),
    }, true);
  };

  useEffect(() => {
    if (axiosAuth) {
      fetchData({
        limit: pagination.limit || 10,
        offset: 0,
        types,
        onlyUnsent,
        ...(phone ? { phone } : {}),
        ...(userIdParams ? { userId: +userIdParams } : {}),
      }, true);
    }

    return () => {
      setPaginationParams({ limit: 0, offset: 0, count: 0 });
    };
  }, [axiosAuth, onlyUnsent, userIdParams, types.length]);

  return isAdmin ? (
    <div className="d-flex flex-column mb-5 justify-content-center">
      <Helmet title={t('title')} description={t('description')} />
      <h1 className="font-good-vibes-pro text-center mb-5" style={{ marginTop: isMobile ? '30%' : '12%' }}>{t('titleWithCount', { count: pagination.count })}</h1>
      <div className="d-flex flex-column flex-xl-row align-items-xl-center justify-content-between gap-4 gap-xl-0 mb-5">
        <div className="d-flex align-items-center gap-3">
          <BackButton style={{}} />
          <Checkbox checked={onlyUnsent} onChange={onlyUnsentHandler}>{t('onlyUnsent')}</Checkbox>
        </div>
        <div className="d-flex flex-column flex-xl-row justify-content-between gap-3 gap-xl-0 col-12 col-xl-6">
          <Input.Search placeholder={t('table.phone')} allowClear value={phone ?? ''} onChange={({ target }) => setPhone(target.value)} onSearch={onPhoneSearch} className="col-12 col-xl-5" style={{ borderColor: '#2b3c5f' }} />
          <Select
            key="select"
            mode="multiple"
            allowClear
            className="col-12 col-xl-6"
            notFoundContent={<NotFoundContent />}
            optionFilterProp="label"
            value={types}
            filterOption={(input, option) => 
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            placeholder={t('table.type')}
            onChange={(state) => setTypes(state)}
            onClear={() => setTypes([])}
            options={Object.values(MessageTypeEnum).map((type) => ({ label: type, value: type }))}
          />
        </div>
      </div>
      <InfiniteScroll
        dataLength={data.length}
        next={() => fetchData({ limit: pagination.limit, offset: (pagination.offset || 0) + 10 })}
        hasMore={data.length < pagination.count}
        loader
        endMessage={data.length ? <Divider plain className="font-oswald fs-6 mt-5">{t('finish')}</Divider> : null}
        style={{ overflow: 'unset' }}
      >
        <Table
          dataSource={data}
          pagination={false}
          bordered
          className="td-padding-unset"
          locale={{
            emptyText: <NotFoundContent />,
          }}
        >
          <Table.Column<DataType> title={t('table.created')} dataIndex="created" width="12%" render={(date: Date) => moment(date).format(DateFormatEnum.DD_MM_YYYY_HH_MM)} />
          <Table.Column<DataType> title={t('table.text')} dataIndex="text" width="50%" render={(text) => <HtmlEllipsis text={text} />} />
          <Table.Column<DataType> title={t('table.type')} dataIndex="type" width="5%" render={(type) => <div className="text-center">{type}</div>} />
          <Table.Column<DataType> title={t('table.send')} dataIndex="send" width="3%" render={(checked) => <Checkbox className="d-flex justify-content-center" checked={checked} />} />
          <Table.Column<DataType> title={t('table.phone')} dataIndex="phone" width="10%" />
          <Table.Column<DataType> title={t('table.telegramId')} dataIndex="telegramId" width="10%" />
          <Table.Column<DataType> title={t('table.user')} dataIndex="user" render={(user: DataType['user']) => <Link href={`${routes.page.admin.userCard}/${user?.id}`}>{user?.name}</Link>} />
        </Table>
      </InfiniteScroll>
    </div>
  ) : null;
};

export default Message;
