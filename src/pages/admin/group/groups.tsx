import { useTranslation } from 'react-i18next';
import { useContext, useEffect, useState } from 'react';
import { Button, Form, Input, type TableProps, Table, Popconfirm, Checkbox } from 'antd';

import { Helmet } from '@/components/Helmet';
import { useAppDispatch, useAppSelector } from '@/utilities/hooks';
import { SubmitContext } from '@/components/Context';
import type { ItemGroupInterface } from '@/types/item/Item';
import { newItemGroupValidation } from '@/validations/validations';
import { toast } from '@/utilities/toast';
import { addItemGroup, deleteItemGroup, updateItemGroup, withDeletedItemGroups } from '@/slices/appSlice';

interface ItemGroupTableInterface {
  key: string;
  name: string;
  description: string;
  code: string;
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
  const { t } = useTranslation('translation', { keyPrefix: 'modules.createItemGroup' });
  const { t: tToast } = useTranslation('translation', { keyPrefix: 'toast' });

  const dispatch = useAppDispatch();

  const { itemGroups } = useAppSelector((state) => state.app);
  const { role } = useAppSelector((state) => state.user);

  const { setIsSubmit } = useContext(SubmitContext);

  const [form] = Form.useForm();

  const [data, setData] = useState<ItemGroupTableInterface[]>([]);
  const [editingKey, setEditingKey] = useState('');
  const [withDeleted, setWithDeleted] = useState<boolean>();

  const withDeletedHandler = () => setWithDeleted(!withDeleted);

  const isEditing = (record: ItemGroupTableInterface) => record.key === editingKey;

  const edit = (record: Partial<ItemGroupTableInterface> & { key: React.Key }) => {
    form.setFieldsValue({ name: '', description: '', code: '', ...record });
    setEditingKey(record.key);
  };

  const cancel = (record: ItemGroupTableInterface) => {
    if (!itemGroups.find(({ code }) => code === record.code)) {
      handleDelete(record.key);
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

  const handleDelete = async (key: React.Key) => {
    const { payload: { code: payloadCode } } = await dispatch(deleteItemGroup(key)) as { payload: { code: number; } };
    if (payloadCode === 1) {
      const newData = data.filter((item) => item.key !== key);
      setData(newData);
    }
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
      const { payload: { code: payloadCode, itemGroup } } = await dispatch(updateItemGroup({ id: exist.id, name, description, code } as ItemGroupInterface)) as { payload: { code: number; itemGroup: ItemGroupInterface } };
      if (payloadCode === 1) {
        const index = data.findIndex((group) => group.key.toString() === itemGroup.id.toString());
        if (index !== -1) {
          const newData = [...data];
          const item = newData[index];
          newData.splice(index, 1, {
            ...item,
            ...row,
          });
          setData(newData);
          setEditingKey('');
        }
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
            <Button color="default" variant="text" disabled={editingKey !== ''} onClick={() => edit(record)}>
              {t('edit')}
            </Button>
            <Popconfirm title={t('deleteConfirm')} description={t('deleteConfirm2')} okText={t('okText')} cancelText={t('cancel')} onConfirm={() => handleDelete(record.key)}>
              <Button color="default" variant="text">
                {t('delete')}
              </Button>
            </Popconfirm>
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
      dispatch(withDeletedItemGroups(withDeleted));
    }
  }, [withDeleted]);

  useEffect(() => {
    setData(itemGroups.map((itemGroup) => ({ ...itemGroup, key: itemGroup.id.toString() })));
  }, [itemGroups.length]);

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
              <Checkbox onChange={withDeletedHandler}>{t('withDeleted')}</Checkbox>
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
      ) : null}
    </> 
  );
};

export default CreateItemGroup;
