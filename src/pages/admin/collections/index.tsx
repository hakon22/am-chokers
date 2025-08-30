import { useTranslation } from 'react-i18next';
import { useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSearchParams } from 'next/navigation';
import { Button, Form, Input, type TableProps, Table, Popconfirm, Checkbox, Tag } from 'antd';
import axios from 'axios';
import { maxBy } from 'lodash';

import { Helmet } from '@/components/Helmet';
import { useAppDispatch, useAppSelector } from '@/utilities/hooks';
import { MobileContext, SubmitContext } from '@/components/Context';
import { newItemCollectionValidation } from '@/validations/validations';
import { toast } from '@/utilities/toast';
import { addItemCollection, deleteItemCollection, type ItemCollectionResponseInterface, restoreItemCollection, updateItemCollection } from '@/slices/appSlice';
import { routes } from '@/routes';
import { axiosErrorHandler } from '@/utilities/axiosErrorHandler';
import { booleanSchema } from '@server/utilities/convertation.params';
import { BackButton } from '@/components/BackButton';
import { NotFoundContent } from '@/components/NotFoundContent';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';
import type { ItemCollectionInterface } from '@/types/item/Item';

interface ItemCollectionTableInterface {
  key: string;
  translations: Record<UserLangEnum, { name: string; }>;
  description: string;
  deleted?: Date;
}

interface EditableCellProps extends React.HTMLAttributes<HTMLElement> {
  editing: boolean;
  dataIndex: string;
  title: string;
  record: ItemCollectionTableInterface;
  index: number;
}

const EditableCell: React.FC<React.PropsWithChildren<EditableCellProps>> = ({
  editing,
  dataIndex,
  title,
  children,
}) => (
  <td>
    {editing ? (
      <Form.Item
        name={dataIndex}
        style={{ margin: 0 }}
        rules={[newItemCollectionValidation]}
      >
        <Input placeholder={title} />
      </Form.Item>
    ) : (
      children
    )}
  </td>
);

const CreateItemCollection = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.itemCollection' });
  const { t: tToast } = useTranslation('translation', { keyPrefix: 'toast' });

  const dispatch = useAppDispatch();
  const router = useRouter();

  const urlParams = useSearchParams();
  const withDeletedParams = urlParams.get('withDeleted');

  const { isAdmin } = useAppSelector((state) => state.user);
  const { axiosAuth } = useAppSelector((state) => state.app);

  const { setIsSubmit } = useContext(SubmitContext);
  const { isMobile } = useContext(MobileContext);

  const [form] = Form.useForm();

  const [itemCollections, setItemCollections] = useState<ItemCollectionInterface[]>([]);
  const [data, setData] = useState<ItemCollectionTableInterface[]>([]);
  const [editingKey, setEditingKey] = useState('');
  const [withDeleted, setWithDeleted] = useState<boolean | undefined>(booleanSchema.validateSync(withDeletedParams));

  const updateData = (itemCollection: ItemCollectionInterface, row?: ItemCollectionTableInterface) => {
    const index = data.findIndex((collection) => collection.key.toString() === itemCollection?.id.toString());
    if (index !== -1) {
      const newData = [...data];
      const item = newData[index];
      newData.splice(index, 1, {
        ...item,
        ...(row || itemCollection),
        translations: Object.values(UserLangEnum)
          .reduce((acc, lang) => ({ ...acc, [lang]: row?.translations?.[lang]
            || {
              name: itemCollection?.translations.find((translation) => translation.lang === lang)?.name,
            },
          }), {} as ItemCollectionTableInterface['translations']),
      });
      setData(newData);
      if (row) {
        setEditingKey('');
      }
    }
  };

  const withDeletedHandler = () => setWithDeleted(!withDeleted);

  const isEditing = (record: ItemCollectionTableInterface) => record.key === editingKey;

  const edit = (record: Partial<ItemCollectionTableInterface> & { key: React.Key }) => {
    form.setFieldsValue(record);
    setEditingKey(record.key);
  };

  const restore = async (key: React.Key) => {
    setIsSubmit(true);
    const { payload: { code: payloadCode, itemCollection } } = await dispatch(restoreItemCollection(key)) as { payload: ItemCollectionResponseInterface; };
    if (payloadCode === 1) {
      updateData(itemCollection);
    }
    setIsSubmit(false);
  };

  const cancel = (record: ItemCollectionTableInterface) => {
    const recordName = record.translations[UserLangEnum.RU].name;
    const exists = itemCollections.some((item) => item?.translations.find(({ lang }) => lang === UserLangEnum.RU)?.name === recordName);

    if (!exists) {
      setData(data.filter(({ key }) => key !== record.key));
    }
    setEditingKey('');
  };

  const handleAdd = () => {
    const maxId = maxBy(itemCollections, 'id')?.id;
    const newData: ItemCollectionTableInterface = {
      translations: Object.values(UserLangEnum).reduce((acc, lang) => ({ ...acc, [lang]: { name: '' } }), {} as ItemCollectionTableInterface['translations']),
      description: '',
      key: ((maxId || 0) + 1).toString(),
    };
    setData([newData, ...data]);
    edit(newData);
  };

  const handleDelete = async (record: ItemCollectionTableInterface) => {
    setIsSubmit(true);
    const { payload: { code: payloadCode, itemCollection } } = await dispatch(deleteItemCollection(record.key)) as { payload: ItemCollectionResponseInterface };
    if (payloadCode === 1) {
      if (withDeleted) {
        updateData(itemCollection);
      } else {
        const newData = data.filter((item) => item.key !== record.key);
        setData(newData);
      }
    }
    setIsSubmit(false);
  };

  const save = async (key: React.Key) => {
    setIsSubmit(true);
    const row = await form.validateFields().catch(() => setIsSubmit(false)) as ItemCollectionTableInterface;

    if (!row) {
      return;
    }

    const { translations, description } = row;

    const exist = itemCollections.find((itemCollection) => itemCollection?.id.toString() === key.toString());

    let payloadCode: number;

    if (exist) {
      const { payload: { code, itemCollection } } = await dispatch(updateItemCollection({ id: exist.id, description, translations: Object.entries(translations).map(([lang, { name }]) => ({ name, lang })) } as ItemCollectionInterface)) as { payload: ItemCollectionResponseInterface; };
      payloadCode = code;
      if (payloadCode === 1) {
        updateData(itemCollection, row);
      }
    } else {
      const { payload: { code, itemCollection } } = await dispatch(addItemCollection({ description, translations: Object.entries(translations).map(([lang, { name }]) => ({ name, lang })) } as ItemCollectionInterface)) as { payload: ItemCollectionResponseInterface; };
      payloadCode = code;
      if (payloadCode === 1) {
        setItemCollections((state) => [...state, itemCollection]);
        setEditingKey('');
      }
    }
    if (payloadCode === 2) {
      const name = translations[UserLangEnum.RU].name;
      form.setFields([{ name: ['translations', UserLangEnum.RU, 'name'], errors: [tToast('itemCollectionExist', { name })] }]);
      toast(tToast('itemCollectionExist', { name }), 'error');
    }
    setIsSubmit(false);
  };

  const columns = [
    {
      title: t('columns.name'),
      dataIndex: ['translations', UserLangEnum.RU, 'name'],
      width: '25%',
      editable: true,
      render: (_: any, record: ItemCollectionTableInterface) => (
        <div className="d-flex align-items-center gap-3">
          <span>{record.translations[UserLangEnum.RU].name}</span>
          {record.deleted ? <Tag color="volcano">{t('deleted')}</Tag> : null}
        </div>
      ),
    },
    {
      title: t('columns.nameEn'),
      dataIndex: ['translations', UserLangEnum.EN, 'name'],
      width: '25%',
      editable: true,
      render: (_: any, record: ItemCollectionTableInterface) => (
        <div className="d-flex align-items-center gap-3">
          <span>{record.translations[UserLangEnum.EN].name}</span>
        </div>
      ),
    },
    {
      title: t('columns.description'),
      dataIndex: 'description',
      width: '40%',
      editable: true,
    },
    {
      title: t('columns.operation'),
      dataIndex: 'operation',
      render: (_: any, record: ItemCollectionTableInterface) => {
        const editable = isEditing(record);
        return editable ? (
          <span>
            <Button color="default" variant="text" onClick={() => save(record.key)} style={{ marginInlineEnd: 8 }}>
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
            {!record.deleted
              ? <Popconfirm title={t('deleteConfirm')} description={t('deleteConfirm2')} okText={t('okText')} cancelText={t('cancel')} onConfirm={() => handleDelete(record)}>
                <Button color="default" variant="text">
                  {t('delete')}
                </Button>
              </Popconfirm>
              : <Button color="default" variant="text" disabled={editingKey !== ''} onClick={() => restore(record.key)}>
                {t('restore')}
              </Button>}
          </div>
        );
      },
    },
  ];

  const mergedColumns: TableProps<ItemCollectionTableInterface>['columns'] = columns.map((col) => {
    if (!col.editable) {
      return col;
    }
    return {
      ...col,
      onCell: (record: ItemCollectionTableInterface) => ({
        record,
        dataIndex: col.dataIndex,
        title: col.title,
        editing: isEditing(record),
      }),
    };
  });

  useEffect(() => {
    if ((withDeleted !== undefined || !itemCollections.length) && axiosAuth) {
      router.push(`?withDeleted=${withDeleted}`, undefined, { shallow: true });

      setIsSubmit(true);
      axios.get<{ code: number, itemCollections: ItemCollectionInterface[]; }>(routes.getItemCollections({ isServer: false }), {
        params: { withDeleted },
      })
        .then(({ data: response }) => {
          if (response.code === 1) {
            setItemCollections(response.itemCollections);
            const newItemCollections = response.itemCollections.map((itemCollection) => ({
              ...itemCollection,
              translations: {
                [UserLangEnum.RU]: { name: itemCollection?.translations.find((translation) => translation.lang === UserLangEnum.RU)?.name },
                [UserLangEnum.EN]: { name: itemCollection?.translations.find((translation) => translation.lang === UserLangEnum.EN)?.name },
              },
              key: itemCollection?.id.toString() as string,
            } as ItemCollectionTableInterface));
            setData(newItemCollections);
          }
          setIsSubmit(false);
        })
        .catch((e) => {
          axiosErrorHandler(e, tToast, setIsSubmit);
        });
    }
  }, [withDeleted, axiosAuth]);

  useEffect(() => {
    setData([...itemCollections].sort((a, b) => (b?.id ?? 0) - (a?.id ?? 0)).map((itemCollection) => ({
      ...itemCollection,
      translations: {
        [UserLangEnum.RU]: { name: itemCollection?.translations.find((translation) => translation.lang === UserLangEnum.RU)?.name },
        [UserLangEnum.EN]: { name: itemCollection?.translations.find((translation) => translation.lang === UserLangEnum.EN)?.name },
      },
      key: itemCollection?.id.toString() as string,
    } as ItemCollectionTableInterface)));
  }, [itemCollections.length]);

  return isAdmin ? (
    <div className="d-flex flex-column mb-5 justify-content-center" style={isMobile ? { marginTop: '50px' } : {}}>
      <Helmet title={t('title')} description={t('description')} />
      <h1 className="font-good-vibes-pro text-center mb-5" style={{ marginTop: '12%' }}>{t('title')}</h1>
      <div className="d-flex flex-column justify-content-center">
        <div className="mb-3">
          <BackButton style={{}} />
        </div>
        <div className="d-flex align-items-center gap-3 mb-3">
          <Button onClick={handleAdd} className="button border-button" disabled={!!editingKey}>
            {t('addItemCollection')}
          </Button>
          <Checkbox checked={withDeleted} onChange={withDeletedHandler}>{t('withDeleted')}</Checkbox>
        </div>
      </div>
      <Form form={form} component={false} className="d-flex flex-column gap-3" style={{ width: '40%' }}>
        <Table<ItemCollectionTableInterface>
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

export default CreateItemCollection;
