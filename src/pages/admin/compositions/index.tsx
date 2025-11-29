import { useTranslation } from 'react-i18next';
import { useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSearchParams } from 'next/navigation';
import { Button, Form, Input, type TableProps, Table, Popconfirm, Checkbox, Tag } from 'antd';
import axios from 'axios';
import { maxBy } from 'lodash';

import { Helmet } from '@/components/Helmet';
import { useAppSelector } from '@/hooks/reduxHooks';
import { MobileContext, SubmitContext } from '@/components/Context';
import { newCompositionValidation } from '@/validations/validations';
import { toast } from '@/utilities/toast';
import { routes } from '@/routes';
import { axiosErrorHandler } from '@/utilities/axiosErrorHandler';
import { booleanSchema } from '@server/utilities/convertation.params';
import { BackButton } from '@/components/BackButton';
import { NotFoundContent } from '@/components/NotFoundContent';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';
import type { CompositionFormInterface, CompositionInterface, CompositionResponseInterface } from '@/types/composition/CompositionInterface';

interface CompositionTableInterface {
  key: string;
  translations: Record<UserLangEnum, { name: string; }>;
  deleted?: Date | null;
}

interface EditableCellProps extends React.HTMLAttributes<HTMLElement> {
  editing: boolean;
  dataIndex: string;
  title: string;
  record: CompositionTableInterface;
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
        rules={[newCompositionValidation]}
      >
        <Input placeholder={title} />
      </Form.Item>
    ) : (
      children
    )}
  </td>
);

const CreateComposition = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.composition' });
  const { t: tToast } = useTranslation('translation', { keyPrefix: 'toast' });

  const router = useRouter();

  const urlParams = useSearchParams();
  const withDeletedParams = urlParams.get('withDeleted');

  const { axiosAuth } = useAppSelector((state) => state.app);
  const { isAdmin } = useAppSelector((state) => state.user);

  const { setIsSubmit } = useContext(SubmitContext);
  const { isMobile } = useContext(MobileContext);

  const [form] = Form.useForm();

  const [compositions, setCompositions] = useState<CompositionInterface[]>([]);
  const [data, setData] = useState<CompositionTableInterface[]>([]);
  const [editingKey, setEditingKey] = useState('');
  const [withDeleted, setWithDeleted] = useState<boolean | undefined>(booleanSchema.validateSync(withDeletedParams));

  const updateData = (composition: CompositionInterface, row?: CompositionTableInterface) => {
    const index = data.findIndex((tableComposition) => tableComposition.key.toString() === composition.id.toString());
    if (index !== -1) {
      const newData = [...data];
      const item = newData[index];
      newData.splice(index, 1, {
        ...item,
        ...(row || composition),
        translations: Object.values(UserLangEnum)
          .reduce((acc, lang) => ({ ...acc, [lang]: row?.translations?.[lang]
            || {
              name: composition.translations.find((translation) => translation.lang === lang)?.name,
            },
          }), {} as CompositionTableInterface['translations']),
      });
      setData(newData);
      if (row) {
        setEditingKey('');
      }
    }
  };

  const withDeletedHandler = () => setWithDeleted(!withDeleted);

  const isEditing = (record: CompositionTableInterface) => record.key === editingKey;

  const edit = (record: Partial<CompositionTableInterface> & { key: React.Key }) => {
    form.setFieldsValue(record);
    setEditingKey(record.key);
  };

  const cancel = (record: CompositionTableInterface) => {
    const recordName = record.translations[UserLangEnum.RU].name;
    const exists = compositions.some((composition) => composition.translations.find(({ lang }) => lang === UserLangEnum.RU)?.name === recordName);

    if (!exists) {
      setData(data.filter(({ key }) => key !== record.key));
    }
    setEditingKey('');
  };

  const handleAdd = () => {
    const maxId = maxBy(compositions, 'id')?.id;
    const newData: CompositionTableInterface = {
      translations: Object.values(UserLangEnum).reduce((acc, lang) => ({ ...acc, [lang]: { name: '' } }), {} as CompositionTableInterface['translations']),
      key: ((maxId || 0) + 1).toString(),
    };
    setData([newData, ...data]);
    edit(newData);
  };

  const handleDelete = async (record: CompositionTableInterface) => {
    try {
      setIsSubmit(true);
      const { data: { code, composition } } = await axios.delete<CompositionResponseInterface>(routes.composition.deleteOne(+record.key));
      if (code === 1) {
        if (withDeleted) {
          updateData(composition);
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
      const { data: { code, composition } } = await axios.patch<CompositionResponseInterface>(routes.composition.restoreOne(+key));
      if (code === 1) {
        updateData(composition);
      }
      setIsSubmit(false);
    } catch (e) {
      axiosErrorHandler(e, tToast, setIsSubmit);
    }
  };

  const save = async (record: CompositionTableInterface) => {
    try {
      setIsSubmit(true);
      const row = await form.validateFields().catch(() => setIsSubmit(false)) as CompositionTableInterface;

      if (!row) {
        return;
      }

      const { translations } = row;

      const exist = compositions.find((composition) => composition.id.toString() === record.key.toString());

      let payloadCode: number;

      if (exist) {
        const { data: { code, composition } } = await axios.put<CompositionResponseInterface>(routes.composition.updateOne(exist.id), { id: exist.id, translations: Object.entries(translations).map(([lang, { name }]) => ({ name, lang } )) } as CompositionInterface);
        payloadCode = code;
        if (payloadCode === 1) {
          updateData(composition, row);
        }
      } else {
        const { data: { code, composition } } = await axios.post<CompositionResponseInterface>(routes.composition.createOne, { translations: Object.entries(translations).map(([lang, { name }]) => ({ name, lang } )) } as CompositionFormInterface);
        payloadCode = code;
        if (payloadCode === 1) {
          setCompositions((state) => [...state, composition]);
          setEditingKey('');
        }
      }
      if (payloadCode === 2) {
        const name = translations[UserLangEnum.RU].name;
        form.setFields([{ name: ['translations', UserLangEnum.RU, 'name'], errors: [tToast('compositionExist', { name })] }]);
        toast(tToast('compositionExist', { name }), 'error');
      }
      setIsSubmit(false);
    } catch (e) {
      axiosErrorHandler(e, tToast, setIsSubmit);
    }
  };

  const columns = [
    {
      title: t('columns.name'),
      dataIndex: ['translations', UserLangEnum.RU, 'name'],
      width: '35%',
      editable: true,
      render: (_: any, record: CompositionTableInterface) => (
        <div className="d-flex align-items-center gap-3">
          <span>{record.translations[UserLangEnum.RU].name}</span>
          {record.deleted
            ? <Tag color="volcano">{t('deleted')}</Tag>
            : null}
        </div>
      ),
    },
    {
      title: t('columns.nameEn'),
      dataIndex: ['translations', UserLangEnum.EN, 'name'],
      width: '35%',
      editable: true,
      render: (_: any, record: CompositionTableInterface) => (
        <div className="d-flex align-items-center gap-3">
          <span>{record.translations[UserLangEnum.EN].name}</span>
        </div>
      ),
    },
    {
      title: t('columns.operation'),
      dataIndex: 'operation',
      render: (_: any, record: CompositionTableInterface) => {
        const editable = isEditing(record);
        return editable ? (
          <span className="d-flex gap-2">
            <Button color="default" variant="text" onClick={() => save(record)}>
              {t('save')}
            </Button>
            <Popconfirm rootClassName="ant-input-group-addon" title={t('cancelConfirm')} okText={t('okText')} cancelText={t('cancel')} onConfirm={() => cancel(record)}>
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
              ? (
                <Popconfirm rootClassName="ant-input-group-addon" title={t('deleteConfirm')} okText={t('okText')} cancelText={t('cancel')} onConfirm={() => handleDelete(record)}>
                  <Button color="default" variant="text">
                    {t('delete')}
                  </Button>
                </Popconfirm>
              )
              : null}
            {record.deleted && <Button color="default" variant="text" disabled={editingKey !== ''} onClick={() => restore(record.key)}>
              {t('restore')}
            </Button>}
          </div>
        );
      },
    },
  ];

  const mergedColumns: TableProps<CompositionTableInterface>['columns'] = columns.map((col) => {
    if (!col.editable) {
      return col;
    }
    return {
      ...col,
      onCell: (record: CompositionTableInterface) => ({
        record,
        dataIndex: col.dataIndex,
        title: col.title,
        editing: isEditing(record),
      }),
    };
  });

  useEffect(() => {
    if ((withDeleted !== undefined || !compositions.length) && axiosAuth) {
      router.push({
        query: { 
          ...router.query, 
          ...(withDeleted !== undefined ? { withDeleted } : {}), 
        },
      },
      undefined,
      { shallow: true });

      setIsSubmit(true);
      axios.get<{ code: number; compositions: CompositionInterface[]; }>(routes.composition.findMany, {
        params: { withDeleted },
      })
        .then(({ data: response }) => {
          if (response.code === 1) {
            setCompositions(response.compositions);
            const newCompositions: CompositionTableInterface[] = response.compositions.map((composition) => ({
              ...composition,
              translations: {
                [UserLangEnum.RU]: { name: composition.translations.find((translation) => translation.lang === UserLangEnum.RU)?.name as string },
                [UserLangEnum.EN]: { name: composition.translations.find((translation) => translation.lang === UserLangEnum.EN)?.name as string },
              },
              key: composition.id.toString(),
            }));
            setData(newCompositions);
          }
          setIsSubmit(false);
        })
        .catch((e) => {
          axiosErrorHandler(e, tToast, setIsSubmit);
        });
    }
  }, [withDeleted, axiosAuth]);

  useEffect(() => {
    setData([...compositions].sort((a, b) => b.id - a.id).map((composition) => ({
      ...composition,
      translations: {
        [UserLangEnum.RU]: { name: composition.translations.find((translation) => translation.lang === UserLangEnum.RU)?.name as string },
        [UserLangEnum.EN]: { name: composition.translations.find((translation) => translation.lang === UserLangEnum.EN)?.name as string },
      },
      key: composition.id.toString(),
    })));
  }, [compositions.length]);

  return isAdmin ? (
    <div className="d-flex flex-column mb-5 justify-content-center">
      <Helmet title={t('title')} description={t('description')} />
      <h1 className="font-good-vibes-pro text-center mb-5" style={{ marginTop: isMobile ? '100px' : '150px' }}>{t('title')}</h1>
      <div className="d-flex flex-column justify-content-center">
        <div className="mb-3">
          <BackButton style={{}} />
        </div>
        <div className="d-flex flex-column flex-xl-row align-items-start align-items-xl-center gap-3 mb-3">
          <Button onClick={handleAdd} className="button border-button" disabled={!!editingKey}>
            {t('addComposition')}
          </Button>
          <Checkbox checked={withDeleted} onChange={withDeletedHandler}>{t('withDeleted')}</Checkbox>
        </div>
      </div>
      <Form form={form} component={false} className="d-flex flex-column gap-3" style={{ width: '40%' }}>
        <Table<CompositionTableInterface>
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

export default CreateComposition;
