import { useTranslation } from 'react-i18next';
import { useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSearchParams } from 'next/navigation';
import { Button, Form, Input, type TableProps, Table, Popconfirm, Checkbox, Tag, ColorPicker } from 'antd';
import axios from 'axios';
import { maxBy } from 'lodash';
import type { Color } from 'antd/lib/color-picker';

import { Helmet } from '@/components/Helmet';
import { useAppSelector } from '@/utilities/hooks';
import { MobileContext, SubmitContext } from '@/components/Context';
import { newColorValidation } from '@/validations/validations';
import { toast } from '@/utilities/toast';
import { routes } from '@/routes';
import { axiosErrorHandler } from '@/utilities/axiosErrorHandler';
import { booleanSchema } from '@server/utilities/convertation.params';
import { BackButton } from '@/components/BackButton';
import { UserRoleEnum } from '@server/types/user/enums/user.role.enum';
import { NotFoundContent } from '@/components/NotFoundContent';
import type { ColorFormInterface, ColorInterface, ColorResponseInterface } from '@/types/color/ColorInterface';

interface ColorTableInterface {
  key: string;
  name: string;
  hex: Color | string;
  deleted?: Date;
}

interface EditableCellProps extends React.HTMLAttributes<HTMLElement> {
  editing: boolean;
  dataIndex: string;
  title: string;
  record: ColorTableInterface;
  index: number;
}

const EditableCell: React.FC<React.PropsWithChildren<EditableCellProps>> = ({
  editing,
  dataIndex,
  title,
  record,
  children,
}) => (
  <td>
    {editing ? (
      <Form.Item
        name={dataIndex}
        style={{ margin: 0 }}
        validateTrigger={false}
        rules={[newColorValidation]}
      >
        {dataIndex === 'hex' ? <ColorPicker size="large" disabledAlpha showText />  : <Input placeholder={title} />}
      </Form.Item>
    ) : dataIndex === 'hex' ? <ColorPicker value={record.hex as string} size="large" disabledAlpha showText /> : children}
  </td>
);

const CreateColor = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.color' });
  const { t: tToast } = useTranslation('translation', { keyPrefix: 'toast' });

  const router = useRouter();

  const urlParams = useSearchParams();
  const withDeletedParams = urlParams.get('withDeleted');

  const { axiosAuth } = useAppSelector((state) => state.app);
  const { role } = useAppSelector((state) => state.user);

  const { setIsSubmit } = useContext(SubmitContext);
  const { isMobile } = useContext(MobileContext);

  const [form] = Form.useForm();

  const [colors, setColors] = useState<ColorInterface[]>([]);
  const [data, setData] = useState<ColorTableInterface[]>([]);
  const [editingKey, setEditingKey] = useState('');
  const [withDeleted, setWithDeleted] = useState<boolean | undefined>(booleanSchema.validateSync(withDeletedParams));

  const updateData = (color: ColorInterface, row?: ColorTableInterface) => {
    const index = data.findIndex((tableColor) => tableColor.key.toString() === color.id.toString());
    if (index !== -1) {
      const newData = [...data];
      const item = newData[index];
      newData.splice(index, 1, {
        ...item,
        ...(row || color),
      });
      setData(newData);
      if (row) {
        setEditingKey('');
      }
    }
  };

  const withDeletedHandler = () => setWithDeleted(!withDeleted);

  const isEditing = (record: ColorTableInterface) => record.key === editingKey;

  const edit = (record: Partial<ColorTableInterface> & { key: React.Key }) => {
    form.setFieldsValue(record);
    setEditingKey(record.key);
  };

  const cancel = (record: ColorTableInterface) => {
    if (!colors.find(({ name }) => name === record.name)) {
      setData(data.filter(({ key }) => key !== record.key));
    }
    setEditingKey('');
  };

  const handleAdd = () => {
    const maxId = maxBy(colors, 'id')?.id;
    const newData: ColorTableInterface = {
      name: '',
      hex: '',
      key: ((maxId || 0) + 1).toString(),
    };
    setData([newData, ...data]);
    edit(newData);
  };

  const handleDelete = async (record: ColorTableInterface) => {
    try {
      setIsSubmit(true);
      const { data: { code, color } } = await axios.delete<ColorResponseInterface>(routes.removeColor(+record.key));
      if (code === 1) {
        if (withDeleted) {
          updateData(color);
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
      const { data: { code, color } } = await axios.patch<ColorResponseInterface>(routes.restoreColor(+key));
      if (code === 1) {
        updateData(color);
      }
      setIsSubmit(false);
    } catch (e) {
      axiosErrorHandler(e, tToast, setIsSubmit);
    }
  };

  const save = async (record: ColorTableInterface) => {
    try {
      setIsSubmit(true);
      const row = await form.validateFields().catch(() => setIsSubmit(false)) as ColorTableInterface;

      if (!row) {
        return;
      }

      const { name, hex } = row;

      const exist = colors.find((color) => color.id.toString() === record.key.toString());
      if (exist) {
        const { data: { code, color } } = await axios.put<ColorResponseInterface>(routes.updateColor(exist.id), { id: exist.id, name, hex: (hex as Color).toHexString() } as ColorFormInterface);
        if (code === 1) {
          updateData(color, row);
        }
      } else {
        const { data: { code, color } } = await axios.post<ColorResponseInterface>(routes.createColor, { name, hex: (hex as Color).toHexString() } as ColorFormInterface);
        if (code === 1) {
          setColors((state) => [...state, color]);
          setEditingKey('');
        } else if (code === 2) {
          form.setFields([{ name: 'name', errors: [tToast('colorExist', { name })] }]);
          toast(tToast('colorExist', { name }), 'error');
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
      width: '50%',
      editable: true,
      render: (_: any, record: ColorTableInterface) => (
        <div className="d-flex align-items-center gap-3">
          <span>{record.name}</span>
          {record.deleted
            ? <Tag color="volcano">{t('deleted')}</Tag>
            : null}
        </div>
      ),
    },
    {
      title: t('columns.hex'),
      dataIndex: 'hex',
      width: '50%',
      editable: true,
    },
    {
      title: t('columns.operation'),
      dataIndex: 'operation',
      render: (_: any, record: ColorTableInterface) => {
        const editable = isEditing(record);
        return editable ? (
          <span className="d-flex gap-2">
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
            {!record.deleted
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

  const mergedColumns: TableProps<ColorTableInterface>['columns'] = columns.map((col) => {
    if (!col.editable) {
      return col;
    }
    return {
      ...col,
      onCell: (record: ColorTableInterface) => ({
        record,
        dataIndex: col.dataIndex,
        title: col.title,
        editing: isEditing(record),
      }),
    };
  });

  useEffect(() => {
    if ((withDeleted !== undefined || !colors.length) && axiosAuth) {
      router.push({
        query: { 
          ...router.query, 
          ...(withDeleted !== undefined ? { withDeleted } : {}), 
        },
      },
      undefined,
      { shallow: true });

      setIsSubmit(true);
      axios.get<{ code: number; colors: ColorInterface[]; }>(routes.getColors, {
        params: { withDeleted },
      })
        .then(({ data: response }) => {
          if (response.code === 1) {
            setColors(response.colors);
            const newColors: ColorTableInterface[] = response.colors.map((color) => ({ ...color, key: color.id.toString() }));
            setData(newColors);
          }
          setIsSubmit(false);
        })
        .catch((e) => {
          axiosErrorHandler(e, tToast, setIsSubmit);
        });
    }
  }, [withDeleted, axiosAuth]);

  useEffect(() => {
    setData(colors.map((color) => ({ ...color, key: color.id.toString() })));
  }, [colors.length]);

  return role === UserRoleEnum.ADMIN ? (
    <div className="d-flex flex-column mb-5 justify-content-center">
      <Helmet title={t('title')} description={t('description')} />
      <h1 className="font-good-vibes-pro text-center fs-1 fw-bold mb-5" style={{ marginTop: isMobile ? '100px' : '12%' }}>{t('title')}</h1>
      <div className="d-flex flex-column justify-content-center">
        <div className="mb-3">
          <BackButton style={{}} />
        </div>
        <div className="d-flex flex-column flex-xl-row align-items-start align-items-xl-center gap-3 mb-3">
          <Button onClick={handleAdd} className="button border-button" disabled={!!editingKey}>
            {t('addColor')}
          </Button>
          <Checkbox checked={withDeleted} onChange={withDeletedHandler}>{t('withDeleted')}</Checkbox>
        </div>
      </div>
      <Form form={form} component={false} className="d-flex flex-column gap-3" style={{ width: '40%' }}>
        <Table<ColorTableInterface>
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

export default CreateColor;
