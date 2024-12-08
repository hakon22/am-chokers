import { useTranslation } from 'react-i18next';
import { useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSearchParams } from 'next/navigation';
import { Button, Form, Input, type TableProps, Table, Popconfirm, Checkbox, Tag } from 'antd';
import axios from 'axios';

import { Helmet } from '@/components/Helmet';
import { useAppDispatch, useAppSelector } from '@/utilities/hooks';
import { SubmitContext } from '@/components/Context';
import type { ItemGroupInterface } from '@/types/item/Item';
import { newItemGroupValidation } from '@/validations/validations';
import { toast } from '@/utilities/toast';
import { addItemGroup, deleteItemGroup, restoreItemGroup, updateItemGroup } from '@/slices/appSlice';
import { routes } from '@/routes';
import { axiosErrorHandler } from '@/utilities/axiosErrorHandler';
import { NoAuthorization } from '@/components/NoAuthorization';
import { UserRoleEnum } from '@server/types/user/enums/user.role.enum';
import { booleanSchema } from '@server/utilities/convertation.params';

interface ItemGroupTableInterface {
  key: string;
  name: string;
  description: string;
  code: string;
  deleted?: Date;
}

interface EditableCellProps extends React.HTMLAttributes<HTMLElement> {
  editing: boolean;
  dataIndex: string;
  title: string;
  record: ItemGroupTableInterface;
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
        rules={[newItemGroupValidation]}
      >
        <Input placeholder={title} />
      </Form.Item>
    ) : (
      children
    )}
  </td>
);

const CreateItemGroup = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.itemGroup' });
  const { t: tToast } = useTranslation('translation', { keyPrefix: 'toast' });

  const dispatch = useAppDispatch();
  const router = useRouter();

  const urlParams = useSearchParams();
  const withDeletedParams = urlParams.get('withDeleted');

  const { itemGroups } = useAppSelector((state) => state.app);
  const { role } = useAppSelector((state) => state.user);

  const { setIsSubmit } = useContext(SubmitContext);

  const [form] = Form.useForm();

  const [data, setData] = useState<ItemGroupTableInterface[]>([]);
  const [editingKey, setEditingKey] = useState('');
  const [withDeleted, setWithDeleted] = useState<boolean | undefined>(booleanSchema.validateSync(withDeletedParams));

  const updateData = (itemGroup: ItemGroupInterface, row?: ItemGroupTableInterface) => {
    const index = data.findIndex((group) => group.key.toString() === itemGroup.id.toString());
    if (index !== -1) {
      const newData = [...data];
      const item = newData[index];
      newData.splice(index, 1, {
        ...item,
        ...(row || itemGroup),
      });
      setData(newData);
      if (row) {
        setEditingKey('');
      }
    }
  };

  const withDeletedHandler = () => setWithDeleted(!withDeleted);

  const isEditing = (record: ItemGroupTableInterface) => record.key === editingKey;

  const edit = (record: Partial<ItemGroupTableInterface> & { key: React.Key }) => {
    form.setFieldsValue({ name: '', description: '', code: '', ...record });
    setEditingKey(record.key);
  };

  const restore = async (key: React.Key) => {
    setIsSubmit(true);
    const { payload: { code: payloadCode, itemGroup } } = await dispatch(restoreItemGroup(key)) as { payload: { code: number; itemGroup: ItemGroupInterface } };
    if (payloadCode === 1) {
      updateData(itemGroup);
    }
    setIsSubmit(false);
  };

  const cancel = (record: ItemGroupTableInterface) => {
    if (!itemGroups.find(({ code }) => code === record.code)) {
      setData(data.filter(({ key }) => key !== record.key));
    }
    setEditingKey('');
  };

  const handleAdd = () => {
    const newData: ItemGroupTableInterface = {
      name: '',
      description: '',
      code: '',
      key: (data.length + 1).toString(),
    };
    setData([...data, newData]);
    edit(newData);
  };

  const handleDelete = async (record: ItemGroupTableInterface) => {
    setIsSubmit(true);
    const { payload: { code: payloadCode, itemGroup } } = await dispatch(deleteItemGroup(record.key)) as { payload: { code: number; itemGroup: ItemGroupInterface; } };
    if (payloadCode === 1) {
      if (withDeleted) {
        updateData(itemGroup);
      } else {
        const newData = data.filter((item) => item.key !== record.key);
        setData(newData);
      }
    }
    setIsSubmit(false);
  };

  const save = async (key: React.Key) => {
    setIsSubmit(true);
    const row = await form.validateFields().catch(() => setIsSubmit(false)) as ItemGroupTableInterface;

    if (!row) {
      return;
    }

    const { name, description, code } = row;

    const exist = itemGroups.find((itemGroup) => itemGroup.id.toString() === key.toString());
    if (exist) {
      const { payload: { code: payloadCode, itemGroup } } = await dispatch(updateItemGroup({ id: exist.id, name, description, code } as ItemGroupInterface)) as { payload: { code: number; itemGroup: ItemGroupInterface; } };
      if (payloadCode === 1) {
        updateData(itemGroup, row);
      }
    } else {
      const { payload: { code: payloadCode } } = await dispatch(addItemGroup({ name, description, code } as ItemGroupInterface)) as { payload: { code: number; } };
      if (payloadCode === 1) {
        setEditingKey('');
      } else if (payloadCode === 2) {
        form.setFields([{ name: 'code', errors: [tToast('itemGroupExist', { code })] }]);
        toast(tToast('itemGroupExist', { code }), 'error');
      }
    }
    setIsSubmit(false);
  };

  const columns = [
    {
      title: t('columns.name'),
      dataIndex: 'name',
      width: '25%',
      editable: true,
      render: (_: any, record: ItemGroupTableInterface) => (
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
      title: t('columns.code'),
      dataIndex: 'code',
      width: '15%',
      editable: true,
    },
    {
      title: t('columns.operation'),
      dataIndex: 'operation',
      render: (_: any, record: ItemGroupTableInterface) => {
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

  const mergedColumns: TableProps<ItemGroupTableInterface>['columns'] = columns.map((col) => {
    if (!col.editable) {
      return col;
    }
    return {
      ...col,
      onCell: (record: ItemGroupTableInterface) => ({
        record,
        dataIndex: col.dataIndex,
        title: col.title,
        editing: isEditing(record),
      }),
    };
  });

  useEffect(() => {
    if (withDeleted !== undefined) {
      router.push(`?withDeleted=${withDeleted}`, undefined, { shallow: true });

      setIsSubmit(true);
      axios.get<{ code: number, itemGroups: ItemGroupInterface[] }>(routes.itemGroups({ isServer: false }), {
        params: { withDeleted },
      })
        .then(({ data: response }) => {
          if (response.code === 1) {
            const newItemGroups: ItemGroupTableInterface[] = response.itemGroups.map((itemGroup) => ({ ...itemGroup, key: itemGroup.id.toString() }));
            setData(newItemGroups);
          }
          setIsSubmit(false);
        })
        .catch((e) => {
          axiosErrorHandler(e, tToast, setIsSubmit);
        });
    }
  }, [withDeleted]);

  useEffect(() => {
    setData(itemGroups.map((itemGroup) => ({ ...itemGroup, key: itemGroup.id.toString() })));
  }, [itemGroups.length]);

  useEffect(() => {
    if (role === UserRoleEnum.MEMBER) {
      router.push(routes.homePage);
    }
  }, [role]);

  return (
    <>
      <Helmet title={t('title')} description={t('description')} />
      {role ? (
        <>
          <div className="d-flex flex-column mb-5 justify-content-center">
            <h1 className="font-mr_hamiltoneg text-center fs-1 fw-bold mb-5" style={{ marginTop: '12%' }}>{t('title')}</h1>
            <div className="d-flex align-items-center gap-3 mb-3">
              <Button onClick={handleAdd} className="button border-button">
                {t('addItemGroup')}
              </Button>
              <Button onClick={() => router.back()} className="back-button border-button" style={{ position: 'absolute', top: '15%' }}>
                {t('back')}
              </Button>
              <Checkbox checked={withDeleted} onChange={withDeletedHandler}>{t('withDeleted')}</Checkbox>
            </div>
            <Form form={form} component={false} className="d-flex flex-column gap-3" style={{ width: '40%' }}>
              <Table<ItemGroupTableInterface>
                components={{
                  body: { cell: EditableCell },
                }}
                bordered
                dataSource={data}
                columns={mergedColumns}
                rowClassName="editable-row"
                pagination={{ position: ['none', 'none'] }}
              />
            </Form>
          </div>
        </>
      ) : <NoAuthorization />}
    </> 
  );
};

export default CreateItemGroup;
