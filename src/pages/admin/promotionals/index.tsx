import { useTranslation } from 'react-i18next';
import { useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSearchParams } from 'next/navigation';
import { Button, Form, Input, type TableProps, Table, Popconfirm, Checkbox, Tag, DatePicker, InputNumber } from 'antd';
import axios from 'axios';
import momentGenerateConfig from 'rc-picker/lib/generate/moment';
import moment, { type Moment } from 'moment';
import { maxBy } from 'lodash';
import type { TFunction } from 'i18next';
import type { ValidationError } from 'yup';

import { Helmet } from '@/components/Helmet';
import { useAppSelector } from '@/utilities/hooks';
import { MobileContext, SubmitContext } from '@/components/Context';
import { newPromotionalValidation, periodSchema, discountAndDiscountPercentSchema } from '@/validations/validations';
import { toast } from '@/utilities/toast';
import { routes } from '@/routes';
import { axiosErrorHandler } from '@/utilities/axiosErrorHandler';
import { booleanSchema } from '@server/utilities/convertation.params';
import { BackButton } from '@/components/BackButton';
import { NotFoundContent } from '@/components/NotFoundContent';
import { DateFormatEnum } from '@/utilities/enums/date.format.enum';
import { locale } from '@/locales/pickers.locale.ru';
import type { PromotionalFormInterface, PromotionalInterface, PromotionalResponseInterface } from '@/types/promotional/PromotionalInterface';

const MomentDatePicker = DatePicker.generatePicker<Moment>(momentGenerateConfig);

interface PromotionalTableInterface {
  key: string;
  name: string;
  description: string;
  discountPercent: number | null;
  discount: number | null;
  freeDelivery: boolean;
  start: Date | Moment | string | null;
  end: Date | Moment | string | null;
  active: boolean;
  orders?: { id: number; }[];
  deleted?: Date;
}

interface EditableCellProps extends React.HTMLAttributes<HTMLElement> {
  editing: boolean;
  dataIndex: string;
  title: string;
  record: PromotionalTableInterface;
  index: number;
  tValidation: TFunction,
}

const getFields = (dataIndex: string, title: string, record: PromotionalTableInterface, editing = true) => {
  if (['start', 'end'].includes(dataIndex)) {
    return !editing ? <span>{moment(dataIndex === 'start' ? record.start : record.end).format(DateFormatEnum.DD_MM_YYYY)}</span> : <MomentDatePicker className="w-100" placeholder={title} showNow={false} format={DateFormatEnum.DD_MM_YYYY} locale={locale} />;
  }
  if (['active', 'freeDelivery'].includes(dataIndex)) {
    return <Checkbox checked={dataIndex === 'active' ? record.active : record.freeDelivery} />;
  }
  return ['discount', 'discountPercent'].includes(dataIndex) ? <InputNumber placeholder={title} /> : <Input placeholder={title} />;
};

const EditableCell: React.FC<React.PropsWithChildren<EditableCellProps>> = ({
  editing,
  dataIndex,
  title,
  record,
  children,
  tValidation,
}) => (
  <td className={['active', 'freeDelivery'].includes(dataIndex) ? 'text-center' : undefined}>
    {editing ? (
      <Form.Item
        name={dataIndex}
        {...(['start', 'end'].includes(dataIndex) ? { getValueProps: (value) => ({ value: value ? moment(value) : value }) } : {})}
        style={{ margin: 0 }}
        validateTrigger={false}
        rules={['start', 'end'].includes(dataIndex)
          ? [({ getFieldValue }) => ({
            validator(_, value) {
              const val = getFieldValue(dataIndex === 'start' ? 'end' : 'start');
              if (dataIndex === 'start' ? moment(value).isSameOrBefore(moment(val), 'day') : moment(value).isSameOrAfter(moment(val), 'day')) {
                return Promise.resolve();
              }
              return Promise.reject(new Error(tValidation(dataIndex === 'start' ? 'isInFuture' : 'isAfterStart')));
            },
          })]
          : ['discount', 'discountPercent', 'freeDelivery'].includes(dataIndex)
            ? [({ getFieldValue }) => ({
              validator(_, value) {
                const keys = {} as { key1: 'discount' | 'discountPercent' | 'freeDelivery', key2: 'discount' | 'discountPercent' | 'freeDelivery' };

                switch (dataIndex) {
                case 'discount':
                  keys.key1 = 'discountPercent';
                  keys.key2 = 'freeDelivery';
                  break;
                case 'discountPercent':
                  keys.key1 = 'discount';
                  keys.key2 = 'freeDelivery';
                  break;
                case 'freeDelivery':
                  keys.key1 = 'discount';
                  keys.key2 = 'discountPercent';
                  break;
                }

                const val = getFieldValue(keys.key1);
                const val2 = getFieldValue(keys.key2);
                if (!!value === true && !val && !val2 ? true : !!value === false && (val || val2) ? true : false) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error(tValidation('oneOfValue')));
              },
            })]
            : [newPromotionalValidation]}
        valuePropName={['active', 'freeDelivery'].includes(dataIndex) ? 'checked' : undefined}
      >
        {getFields(dataIndex, title, record)}
      </Form.Item>
    ) : !dataIndex || ['name', 'description', 'discountPercent', 'discount'].includes(dataIndex) ? children : getFields(dataIndex, title, record, false)}
  </td>
);

const CreatePromotional = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.promotionalCodes' });
  const { t: tToast } = useTranslation('translation', { keyPrefix: 'toast' });
  const { t: tValidation } = useTranslation('translation', { keyPrefix: 'validation' });

  const router = useRouter();

  const urlParams = useSearchParams();
  const withDeletedParams = urlParams.get('withDeleted');
  const withExpiredParams = urlParams.get('withExpired');

  const { axiosAuth } = useAppSelector((state) => state.app);
  const { isAdmin } = useAppSelector((state) => state.user);

  const { setIsSubmit } = useContext(SubmitContext);
  const { isMobile } = useContext(MobileContext);

  const [form] = Form.useForm();

  const [promotionals, setPromotionals] = useState<PromotionalInterface[]>([]);
  const [data, setData] = useState<PromotionalTableInterface[]>([]);
  const [editingKey, setEditingKey] = useState('');
  const [withDeleted, setWithDeleted] = useState<boolean | undefined>(booleanSchema.validateSync(withDeletedParams));
  const [withExpired, setWithExpired] = useState<boolean | undefined>(booleanSchema.validateSync(withExpiredParams));

  const updateData = (promotional: PromotionalInterface, row?: PromotionalTableInterface) => {
    const index = data.findIndex((tablePromotional) => tablePromotional.key.toString() === promotional.id.toString());
    if (index !== -1) {
      const newData = [...data];
      const item = newData[index];
      newData.splice(index, 1, {
        ...item,
        ...(row || promotional),
      });
      setData(newData);
      if (row) {
        setEditingKey('');
      }
    }
  };

  const withDeletedHandler = () => setWithDeleted(!withDeleted);
  const withExpiredHandler = () => setWithExpired(!withExpired);

  const isEditing = (record: PromotionalTableInterface) => record.key === editingKey;

  const edit = (record: Partial<PromotionalTableInterface> & { key: React.Key }) => {
    form.setFieldsValue(record);
    setEditingKey(record.key);
  };

  const cancel = (record: PromotionalTableInterface) => {
    if (!promotionals.find(({ name }) => name === record.name)) {
      setData(data.filter(({ key }) => key !== record.key));
    }
    setEditingKey('');
  };

  const handleAdd = () => {
    const maxId = maxBy(promotionals, 'id')?.id;
    const newData: PromotionalTableInterface = {
      name: '',
      description: '',
      discountPercent: null,
      discount: null,
      start: null,
      end: null,
      active: true,
      freeDelivery: false,
      key: ((maxId || 0) + 1).toString(),
    };
    setData([newData, ...data]);
    edit(newData);
  };

  const handleDelete = async (record: PromotionalTableInterface) => {
    try {
      setIsSubmit(true);
      const { data: { code, promotional } } = await axios.delete<PromotionalResponseInterface>(routes.removePromotional(+record.key));
      if (code === 1) {
        if (withDeleted) {
          updateData(promotional);
        } else {
          const newData = data.filter((item) => item.key !== record.key);
          setData(newData);
        }
      }
      setIsSubmit(false);
    } catch (e) {
      axiosErrorHandler(e, tToast, setIsSubmit);
    }
  };

  const restore = async (key: string) => {
    try {
      setIsSubmit(true);
      const { data: { code, promotional } } = await axios.patch<PromotionalResponseInterface>(routes.restorePromotional(+key));
      if (code === 1) {
        updateData(promotional);
      }
      setIsSubmit(false);
    } catch (e) {
      axiosErrorHandler(e, tToast, setIsSubmit);
    }
  };

  const save = async (record: PromotionalTableInterface) => {
    try {
      setIsSubmit(true);
      const row = await form.validateFields().catch(() => setIsSubmit(false)) as PromotionalTableInterface;

      if (!row) {
        return;
      }

      if (row.start instanceof moment && !(row.start instanceof Date)) {
        row.start = row.start.format(DateFormatEnum.YYYY_MM_DD);
      }
      if (row.end instanceof moment && !(row.end instanceof Date)) {
        row.end = row.end.format(DateFormatEnum.YYYY_MM_DD);
      }

      const { name, description, discount, discountPercent, freeDelivery, start, end, active } = row;

      const exist = promotionals.find((promotional) => promotional.id.toString() === record.key.toString());
      if (exist) {
        const { data: { code, promotional } } = await axios.put<PromotionalResponseInterface>(routes.updatePromotional(exist.id), { id: exist.id, name, description, discount, discountPercent, start, end, active, freeDelivery } as PromotionalFormInterface);
        if (code === 1) {
          updateData(promotional, row);
        }
      } else {
        const { data: { code, promotional } } = await axios.post<PromotionalResponseInterface>(routes.createPromotional, { name, description, discount, discountPercent, start, end, active, freeDelivery } as PromotionalFormInterface);
        if (code === 1) {
          setPromotionals((state) => [...state, promotional]);
          setEditingKey('');
        } else if (code === 2) {
          form.setFields([{ name: 'name', errors: [tToast('promotionalExist', { name })] }]);
          toast(tToast('promotionalExist', { name }), 'error');
        }
      }
      setIsSubmit(false);
    } catch (e) {
      axiosErrorHandler(e, tToast, setIsSubmit);
    }
  };

  const columns = [
    {
      title: t('columns.name'),
      dataIndex: 'name',
      width: '20%',
      editable: true,
      render: (_: any, record: PromotionalTableInterface) => (
        <div className="d-flex align-items-center gap-3">
          <span>{record.name}</span>
          {record.deleted
            ? <Tag color="volcano">{t('deleted')}</Tag>
            : !record.active && moment(record.end).isBefore(moment(), 'day')
              ? <Tag color="magenta">{t('expired')}</Tag>
              : !record.active && !moment(record.end).isBefore(moment(), 'day')
                ? <Tag color="purple">{t('notActive')}</Tag>
                : null}
        </div>
      ),
    },
    {
      title: t('columns.description'),
      dataIndex: 'description',
      width: '20%',
      editable: true,
    },
    {
      title: t('columns.discountPercent'),
      dataIndex: 'discountPercent',
      width: '10%',
      editable: true,
    },
    {
      title: t('columns.discount'),
      dataIndex: 'discount',
      width: '10%',
      editable: true,
    },
    {
      title: t('columns.freeDelivery'),
      dataIndex: 'freeDelivery',
      width: '5%',
      editable: true,
    },
    {
      title: t('columns.start'),
      dataIndex: 'start',
      width: '20%',
      editable: true,
    },
    {
      title: t('columns.end'),
      dataIndex: 'end',
      width: '20%',
      editable: true,
    },
    {
      title: t('columns.active'),
      dataIndex: 'active',
      width: '5%',
      editable: true,
    },
    {
      title: t('columns.operation'),
      dataIndex: 'operation',
      render: (_: any, record: PromotionalTableInterface) => {
        const editable = isEditing(record);
        return editable ? (
          <span className="d-flex flex-column gap-2">
            <Button color="default" variant="text" onClick={() => save(record)}>
              {t('save')}
            </Button>
            <Popconfirm title={t('cancelConfirm')} okText={t('okText')} cancelText={t('cancel')} onConfirm={() => cancel(record)}>
              <Button color="default" variant="text">
                {t('cancel')}
              </Button>
            </Popconfirm>
          </span>
        ) : (
          <div className="d-flex gap-2">
            {!record.deleted
              ? <Button color="default" variant="text" disabled={editingKey !== ''} onClick={() => edit(record)}>
                {t('edit')}
              </Button>
              : null}
            {!record.deleted && !record.orders?.length
              ? <Popconfirm title={t('deleteConfirm')} okText={t('okText')} cancelText={t('cancel')} onConfirm={() => handleDelete(record)}>
                <Button color="default" variant="text">
                  {t('delete')}
                </Button>
              </Popconfirm>
              : null}
            {record.deleted && <Button color="default" variant="text" disabled={editingKey !== ''} onClick={() => restore(record.key)}>
              {t('restore')}
            </Button>}
          </div>
        );
      },
    },
  ];

  const mergedColumns: TableProps<PromotionalTableInterface>['columns'] = columns.map((col) => {
    if (!col.editable) {
      return col;
    }
    return {
      ...col,
      onCell: (record: PromotionalTableInterface) => ({
        record,
        dataIndex: col.dataIndex,
        title: col.title,
        editing: isEditing(record),
        tValidation,
      }),
    };
  });

  const start = Form.useWatch('start', form);
  const end = Form.useWatch('end', form);
  const discount = Form.useWatch('discount', form);
  const discountPercent = Form.useWatch('discountPercent', form);
  const freeDelivery = Form.useWatch('freeDelivery', form);

  useEffect(() => {
    if (start && end) {
      periodSchema.validate({ start, end }, { abortEarly: false })
        .then((values) => form.setFields(Object.keys(values).map((name) => ({ name, errors: [] }))))
        .catch((e: ValidationError) => form.setFields(e.inner.map(({ path, message }) => ({ name: path, errors: [message] }))));
    }
  }, [start, end]);

  useEffect(() => {
    if (discount || discountPercent || freeDelivery) {
      discountAndDiscountPercentSchema.validate({ discount, discountPercent, freeDelivery }, { abortEarly: false })
        .then((values) => form.setFields(Object.keys(values).map((name) => ({ name, errors: [] }))))
        .catch((e: ValidationError) => form.setFields(e.inner.map(({ path, message }) => ({ name: path, errors: [message] }))));
    }
  }, [discount, discountPercent, freeDelivery]);

  useEffect(() => {
    if ((withExpired !== undefined || withDeleted !== undefined || !promotionals.length) && axiosAuth) {
      if (withExpired !== undefined || withDeleted !== undefined) {
        router.push({
          query: { 
            ...router.query, 
            ...(withDeleted !== undefined ? { withDeleted } : {}), 
            ...(withExpired !== undefined ? { withExpired } : {}),
          },
        },
        undefined,
        { shallow: true });
      }

      setIsSubmit(true);
      axios.get<{ code: number, promotionals: PromotionalInterface[] }>(routes.getPromotionals, {
        params: { withDeleted, withExpired },
      })
        .then(({ data: response }) => {
          if (response.code === 1) {
            setPromotionals(response.promotionals);
            const newPromotionals: PromotionalTableInterface[] = response.promotionals.map((promotional) => ({ ...promotional, key: promotional.id.toString() }));
            setData(newPromotionals);
          }
          setIsSubmit(false);
        })
        .catch((e) => {
          axiosErrorHandler(e, tToast, setIsSubmit);
        });
    }
  }, [withDeleted, withExpired, axiosAuth]);

  useEffect(() => {
    setData(promotionals.map((promotional) => ({ ...promotional, key: promotional.id.toString() })));
  }, [promotionals.length]);

  return isAdmin ? (
    <div className="d-flex flex-column mb-5 justify-content-center">
      <Helmet title={t('title')} description={t('description')} />
      <h1 className="font-good-vibes-pro text-center mb-5" style={{ marginTop: isMobile ? '30%' : '12%' }}>{t('title')}</h1>
      <div className="d-flex flex-column justify-content-center">
        <div className="mb-3">
          <BackButton style={{}} />
        </div>
        <div className="d-flex flex-column flex-xl-row align-items-start align-items-xl-center gap-3 mb-3">
          <Button onClick={handleAdd} className="button border-button" disabled={!!editingKey}>
            {t('addPromotional')}
          </Button>
          <Checkbox checked={withDeleted} onChange={withDeletedHandler}>{t('withDeleted')}</Checkbox>
          <Checkbox checked={withExpired} onChange={withExpiredHandler}>{t('withExpired')}</Checkbox>
        </div>
      </div>
      <Form form={form} component={false} className="d-flex flex-column gap-3" style={{ width: '40%' }}>
        <Table<PromotionalTableInterface>
          components={{
            body: { cell: EditableCell },
          }}
          bordered
          dataSource={data}
          locale={{
            emptyText: <NotFoundContent />,
          }}
          columns={mergedColumns}
          rowClassName="editable-row"
          pagination={false}
        />
      </Form>
    </div>
  ) : null;
};

export default CreatePromotional;
