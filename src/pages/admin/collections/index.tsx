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
import { UserRoleEnum } from '@server/types/user/enums/user.role.enum';
import { NotFoundContent } from '@/components/NotFoundContent';
import type { ItemCollectionInterface } from '@/types/item/Item';

interface ItemCollectionTableInterface {
  key: string;
  name: string;
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

  const { role } = useAppSelector((state) => state.user);
  const { axiosAuth } = useAppSelector((state) => state.app);

  const { setIsSubmit } = useContext(SubmitContext);
  const { isMobile } = useContext(MobileContext);

  const [form] = Form.useForm();

  const [itemCollections, setItemCollections] = useState<ItemCollectionInterface[]>([]);
  const [data, setData] = useState<ItemCollectionTableInterface[]>([]);
  const [editingKey, setEditingKey] = useState('');
  const [withDeleted, setWithDeleted] = useState<boolean | undefined>(booleanSchema.validateSync(withDeletedParams));

  const updateData = (itemCollection: ItemCollectionInterface, row?: ItemCollectionTableInterface) => {
    const index = data.findIndex((collection) => collection.key.toString() === itemCollection.id.toString());
    if (index !== -1) {
      const newData = [...data];
      const item = newData[index];
      newData.splice(index, 1, {
        ...item,
        ...(row || itemCollection),
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
    form.setFieldsValue({ name: '', description: '', ...record });
    setEditingKey(record.key);
  };

  const restore = async (key: React.Key) => {
    setIsSubmit(true);
    const { payload: { code: payloadCode, itemCollection } } = await dispatch(restoreItemCollection(key)) as { payload: ItemCollectionResponseInterface };
    if (payloadCode === 1) {
      updateData(itemCollection);
    }
    setIsSubmit(false);
  };

  const cancel = (record: ItemCollectionTableInterface) => {
    if (!itemCollections.find(({ name }) => name === record.name)) {
      setData(data.filter(({ key }) => key !== record.key));
    }
    setEditingKey('');
  };

  const handleAdd = () => {
    const maxId = maxBy(itemCollections, 'id')?.id;
    const newData: ItemCollectionTableInterface = {
      name: '',
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

    const { name, description } = row;

    const exist = itemCollections.find((itemCollection) => itemCollection.id.toString() === key.toString());
    if (exist) {
      const { payload: { code: payloadCode, itemCollection } } = await dispatch(updateItemCollection({ id: exist.id, name, description } as ItemCollectionInterface)) as { payload: ItemCollectionResponseInterface; };
      if (payloadCode === 1) {
        updateData(itemCollection, row);
      }
    } else {
      const { payload: { code: payloadCode, itemCollection } } = await dispatch(addItemCollection({ name, description } as ItemCollectionInterface)) as { payload: ItemCollectionResponseInterface; };
      if (payloadCode === 1) {
        setItemCollections((state) => [...state, itemCollection]);
        setEditingKey('');
      } else if (payloadCode === 2) {
        form.setFields([{ name: 'name', errors: [tToast('itemCollectionExist', { name })] }]);
        toast(tToast('itemCollectionExist', { name }), 'error');
      }
    }
    setIsSubmit(false);
  };

  const columns = [
    {
      title: t('columns.name'),
      dataIndex: 'name',
      width: '40%',
      editable: true,
      render: (_: any, record: ItemCollectionTableInterface) => (
        <div className="d-flex align-items-center gap-3">
          <span>{record.name}</span>
          {record.deleted ? <Tag color="volcano">{t('deleted')}</Tag> : null}
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
            const newItemCollections: ItemCollectionTableInterface[] = response.itemCollections.map((itemCollection) => ({ ...itemCollection, key: itemCollection.id.toString() }));
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
    setData(itemCollections.map((itemCollection) => ({ ...itemCollection, key: itemCollection.id.toString() })));
  }, [itemCollections.length]);

  return role === UserRoleEnum.ADMIN ? (
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
          pagination={{ position: ['none', 'none'] }}
        />
      </Form>
    </div>
  ) : null;
};

export default CreateItemCollection;
