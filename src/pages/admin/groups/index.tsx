import { useTranslation } from 'react-i18next';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { useSearchParams } from 'next/navigation';
import { Button, Form, Input, Select, type TableProps, Table, Popconfirm, Checkbox, Tag } from 'antd';
import axios from 'axios';
import { isNil, maxBy } from 'lodash';
import { HolderOutlined } from '@ant-design/icons';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { DndContext, type DragEndEvent } from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';

import { Helmet } from '@/components/Helmet';
import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks';
import { MobileContext, SubmitContext } from '@/components/Context';
import { newItemGroupValidation } from '@/validations/validations';
import { toast } from '@/utilities/toast';
import { addItemGroup, deleteItemGroup, type ItemGroupResponseInterface, restoreItemGroup, sortItemGroup, updateItemGroup } from '@/slices/appSlice';
import { routes } from '@/routes';
import { axiosErrorHandler } from '@/utilities/axiosErrorHandler';
import { booleanSchema } from '@server/utilities/convertation.params';
import { AdminListPrimaryActionButton } from '@/components/admin/AdminListPrimaryActionButton';
import { BackButton } from '@/components/BackButton';
import { NotFoundContent } from '@/components/NotFoundContent';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';
import { AiTryOnVtoTypeEnum } from '@server/types/ai/enums/ai-try-on-vto-type.enum';
import type { ItemGroupInterface } from '@/types/item/Item';

interface ItemGroupTableInterface {
  key: string;
  translations: Record<UserLangEnum, { name: string; description: string; }>;
  code: string;
  tryOnEnabled: boolean;
  tryOnVtoType: AiTryOnVtoTypeEnum | null;
  order?: number;
  deleted?: Date;
}

interface EditableCellProps extends React.HTMLAttributes<HTMLElement> {
  editing: boolean;
  dataIndex: string | string[];
  title: string;
  record: ItemGroupTableInterface;
  index: number;
}

interface RowContextProps {
  setActivatorNodeRef?: (element: HTMLElement | null) => void;
  listeners?: SyntheticListenerMap;
}

interface RowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  'data-row-key': string;
}

/**
 * Преобразует группу API в строку таблицы админки
 * @param itemGroup - группа из API / Redux
 * @returns строка Editable Table
 */
const mapItemGroupToTableRow = (itemGroup: ItemGroupInterface): ItemGroupTableInterface => ({
  translations: {
    [UserLangEnum.RU]: {
      name: itemGroup.translations.find((translation) => translation.lang === UserLangEnum.RU)?.name || '',
      description: itemGroup.translations.find((translation) => translation.lang === UserLangEnum.RU)?.description || '',
    },
    [UserLangEnum.EN]: {
      name: itemGroup.translations.find((translation) => translation.lang === UserLangEnum.EN)?.name || '',
      description: itemGroup.translations.find((translation) => translation.lang === UserLangEnum.EN)?.description || '',
    },
  },
  code: itemGroup.code,
  tryOnEnabled: Boolean(itemGroup.tryOn?.isEnabled),
  tryOnVtoType: itemGroup.tryOn?.vtoType ?? null,
  order: itemGroup.order,
  deleted: itemGroup.deleted,
  key: itemGroup.id.toString(),
});

const EditableCell: React.FC<React.PropsWithChildren<EditableCellProps>> = ({
  editing,
  dataIndex,
  title,
  children,
}) => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.itemGroup' });
  const fieldName = Array.isArray(dataIndex) ? dataIndex.join('.') : dataIndex;

  if (!editing) {
    return <td className={fieldName === 'tryOnEnabled' ? 'text-center' : undefined}>{children}</td>;
  }

  if (fieldName === 'tryOnEnabled') {
    return (
      <td className="text-center">
        <Form.Item name="tryOnEnabled" style={{ margin: 0 }} valuePropName="checked">
          <Checkbox />
        </Form.Item>
      </td>
    );
  }

  if (fieldName === 'tryOnVtoType') {
    return (
      <td>
        <Form.Item
          name="tryOnVtoType"
          style={{ margin: 0 }}
          dependencies={['tryOnEnabled']}
          rules={[
            ({ getFieldValue }) => ({
              /**
               * Требует тип VTO при включённой AI-примерке
               * @param _rule - правило antd
               * @param value - выбранный тип
               * @returns Promise
               */
              validator: async (_rule, value) => {
                if (getFieldValue('tryOnEnabled') && isNil(value)) {
                  return Promise.reject(new Error(t('columns.tryOnVtoType')));
                }
                return Promise.resolve();
              },
            }),
          ]}
        >
          <Select
            allowClear
            placeholder={title}
            options={Object.values(AiTryOnVtoTypeEnum).map((vtoType) => ({
              value: vtoType,
              label: t(`tryOnVtoTypeOptions.${vtoType}`),
            }))}
          />
        </Form.Item>
      </td>
    );
  }

  return (
    <td>
      <Form.Item
        name={dataIndex}
        style={{ margin: 0 }}
        rules={[newItemGroupValidation]}
      >
        <Input placeholder={title} />
      </Form.Item>
    </td>
  );
};

const RowContext = createContext<RowContextProps>({});

const UseDragHandle = () => {
  const { setActivatorNodeRef, listeners } = useContext(RowContext);
  return (
    <Button
      type="text"
      size="small"
      className="border-0"
      icon={<HolderOutlined />}
      style={{ cursor: 'move' }}
      ref={setActivatorNodeRef}
      {...listeners}
    />
  );
};

const CreateItemGroup = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.itemGroup' });
  const { t: tToast } = useTranslation('translation', { keyPrefix: 'toast' });

  const dispatch = useAppDispatch();
  const router = useRouter();

  const urlParams = useSearchParams();
  const withDeletedParams = urlParams.get('withDeleted');

  const { itemGroups } = useAppSelector((state) => state.app);
  const { isAdmin } = useAppSelector((state) => state.user);

  const { setIsSubmit } = useContext(SubmitContext);
  const { isMobile } = useContext(MobileContext);

  const [form] = Form.useForm();

  const [data, setData] = useState<ItemGroupTableInterface[]>([]);
  const [isSorting, setIsSorting] = useState(false);
  const [editingKey, setEditingKey] = useState('');
  const [withDeleted, setWithDeleted] = useState<boolean | undefined>(booleanSchema.validateSync(withDeletedParams));

  const Row: React.FC<RowProps> = (props) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      setActivatorNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: props['data-row-key'] });

    const style: React.CSSProperties = {
      ...props.style,
      transform: CSS.Translate.toString(transform),
      transition,
      cursor: 'unset',
      ...(isDragging ? { position: 'relative', zIndex: 9999 } : {}),
    };

    const contextValue = useMemo<RowContextProps>(() => ({ setActivatorNodeRef, listeners }), [setActivatorNodeRef, listeners]);

    return (
      <RowContext.Provider value={contextValue}>
        <tr {...props} ref={setNodeRef} style={style} {...attributes} />
      </RowContext.Provider>
    );
  };

  /**
   * Обрабатывает окончание DnD и запускает сохранение порядка
   * @param event - событие dnd-kit
   * @returns void
   */
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (active.id !== over?.id) {
      setData((prevState) => {
        const activeIndex = prevState.findIndex((record) => record.key === active?.id);
        const overIndex = prevState.findIndex((record) => record.key === over?.id);
        return arrayMove(prevState, activeIndex, overIndex);
      });
    }
    setIsSorting(true);
  };

  /**
   * Обновляет строку таблицы после create/update/restore
   * @param itemGroup - группа с сервера
   * @param row - локальная строка формы (опционально)
   * @returns void
   */
  const updateData = (itemGroup: ItemGroupInterface, row?: ItemGroupTableInterface) => {
    const index = data.findIndex((group) => group.key.toString() === itemGroup.id.toString());
    if (index !== -1) {
      const newData = [...data];
      const mapped = mapItemGroupToTableRow(itemGroup);
      newData.splice(index, 1, {
        ...mapped,
        ...(row
          ? {
            translations: row.translations,
            code: row.code,
            tryOnEnabled: row.tryOnEnabled,
            tryOnVtoType: row.tryOnVtoType,
          }
          : {}),
      });
      setData(newData);
      if (row) {
        setEditingKey('');
      }
    }
  };

  /**
   * Переключает фильтр удалённых групп
   * @returns void
   */
  const withDeletedHandler = () => setWithDeleted(!withDeleted);

  /**
   * Проверяет, редактируется ли строка
   * @param record - строка таблицы
   * @returns true, если строка в режиме редактирования
   */
  const isEditing = (record: ItemGroupTableInterface) => record.key === editingKey;

  /**
   * Включает режим редактирования строки
   * @param record - строка для редактирования
   * @returns void
   */
  const edit = (record: Partial<ItemGroupTableInterface> & { key: React.Key }) => {
    form.setFieldsValue({
      tryOnEnabled: false,
      tryOnVtoType: null,
      ...record,
    });
    setEditingKey(record.key as string);
  };

  /**
   * Восстанавливает удалённую группу
   * @param key - id группы
   * @returns void
   */
  const restore = async (key: React.Key) => {
    setIsSubmit(true);
    const { payload: { code: payloadCode, itemGroup } } = await dispatch(restoreItemGroup(key)) as { payload: ItemGroupResponseInterface; };
    if (payloadCode === 1) {
      updateData(itemGroup);
    }
    setIsSubmit(false);
  };

  /**
   * Отменяет редактирование
   * @param record - редактируемая строка
   * @returns void
   */
  const cancel = (record: ItemGroupTableInterface) => {
    if (!itemGroups.find(({ code }) => code === record.code)) {
      setData(data.filter(({ key }) => key !== record.key));
    }
    setEditingKey('');
  };

  /**
   * Добавляет пустую строку для новой группы
   * @returns void
   */
  const handleAdd = () => {
    const maxId = maxBy(itemGroups, 'id')?.id;
    const newData: ItemGroupTableInterface = {
      translations: Object.values(UserLangEnum).reduce((acc, lang) => ({ ...acc, [lang]: { name: '', description: '' } }), {} as ItemGroupTableInterface['translations']),
      code: '',
      tryOnEnabled: false,
      tryOnVtoType: null,
      key: ((maxId || 0) + 1).toString(),
    };
    setData([newData, ...data]);
    edit(newData);
  };

  /**
   * Удаляет группу
   * @param record - строка таблицы
   * @returns void
   */
  const handleDelete = async (record: ItemGroupTableInterface) => {
    setIsSubmit(true);
    const { payload: { code: payloadCode, itemGroup } } = await dispatch(deleteItemGroup(record.key)) as { payload: ItemGroupResponseInterface; };
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

  /**
   * Сохраняет новую или изменённую группу
   * @param key - ключ строки
   * @returns void
   */
  const save = async (key: React.Key) => {
    setIsSubmit(true);
    const row = await form.validateFields().catch(() => setIsSubmit(false)) as ItemGroupTableInterface;

    if (!row) {
      return;
    }

    const { translations, code, tryOnEnabled, tryOnVtoType } = row;

    if (tryOnEnabled && isNil(tryOnVtoType)) {
      form.setFields([{ name: 'tryOnVtoType', errors: [tToast('itemGroupTryOnVtoTypeRequired')] }]);
      toast(tToast('itemGroupTryOnVtoTypeRequired'), 'error');
      setIsSubmit(false);
      return;
    }

    const tryOnPayload = {
      isEnabled: Boolean(tryOnEnabled),
      vtoType: tryOnVtoType ?? null,
    };

    const exist = itemGroups.find((itemGroup) => itemGroup.id.toString() === key.toString());

    let responseCode: number;

    if (exist) {
      const { payload: { code: payloadCode, itemGroup } } = await dispatch(updateItemGroup({
        id: exist.id,
        code,
        translations: Object.entries(translations).map(([lang, { name, description }]) => ({ name, description, lang })),
        tryOn: tryOnPayload,
      } as ItemGroupInterface)) as { payload: ItemGroupResponseInterface; };
      responseCode = payloadCode;
      if (responseCode === 1) {
        updateData(itemGroup, row);
      }
    } else {
      const { payload: { code: payloadCode } } = await dispatch(addItemGroup({
        code,
        translations: Object.entries(translations).map(([lang, { name, description }]) => ({ name, description, lang })),
        tryOn: tryOnPayload,
      } as ItemGroupInterface)) as { payload: { code: number; } };
      responseCode = payloadCode;
      if (responseCode === 1) {
        setEditingKey('');
      }
    }
    if (responseCode === 2) {
      form.setFields([{ name: 'code', errors: [tToast('itemGroupExist', { code })] }]);
      toast(tToast('itemGroupExist', { code }), 'error');
    }
    if (responseCode === 3) {
      form.setFields([{ name: 'tryOnVtoType', errors: [tToast('itemGroupTryOnVtoTypeRequired')] }]);
      toast(tToast('itemGroupTryOnVtoTypeRequired'), 'error');
    }
    setIsSubmit(false);
  };

  /**
   * Сохраняет порядок групп после DnD
   * @returns void
   */
  const sort = async () => {
    setIsSubmit(true);
    const { hasUpdate, notSaved } = data.reduce((acc, itemGroup) => {
      if (!itemGroup.code) {
        acc.notSaved.push(itemGroup);
      } else {
        acc.hasUpdate.push({ id: +itemGroup.key });
      }
      return acc;
    }, { hasUpdate: [], notSaved: [] } as { hasUpdate: { id: number; }[], notSaved: ItemGroupTableInterface[]; });

    const { payload } = await dispatch(sortItemGroup(hasUpdate)) as { payload: { code: number; itemGroups: ItemGroupInterface[]; } };

    setData([...(notSaved.length ? notSaved : []), ...payload.itemGroups.map(mapItemGroupToTableRow)].sort((a, b) => (a.order || 0) - (b.order || 0)));
    setIsSubmit(false);
  };

  const columns = [
    {
      key: 'sort',
      width: 80,
      render: () => <UseDragHandle />,
    },
    {
      title: t('columns.name'),
      dataIndex: ['translations', UserLangEnum.RU, 'name'],
      width: '12%',
      editable: true,
      render: (_: unknown, record: ItemGroupTableInterface) => (
        <div className="d-flex align-items-center gap-3">
          <span>{record.translations[UserLangEnum.RU].name}</span>
          {record.deleted ? <Tag color="volcano" variant="outlined">{t('deleted')}</Tag> : null}
        </div>
      ),
    },
    {
      title: t('columns.nameEn'),
      dataIndex: ['translations', UserLangEnum.EN, 'name'],
      width: '12%',
      editable: true,
      render: (_: unknown, record: ItemGroupTableInterface) => (
        <div className="d-flex align-items-center gap-3">
          <span>{record.translations[UserLangEnum.EN].name}</span>
        </div>
      ),
    },
    {
      title: t('columns.description'),
      dataIndex: ['translations', UserLangEnum.RU, 'description'],
      width: '18%',
      editable: true,
      render: (_: unknown, record: ItemGroupTableInterface) => (
        <div className="d-flex align-items-center gap-3">
          <span>{record.translations[UserLangEnum.RU].description}</span>
        </div>
      ),
    },
    {
      title: t('columns.descriptionEn'),
      dataIndex: ['translations', UserLangEnum.EN, 'description'],
      width: '18%',
      editable: true,
      render: (_: unknown, record: ItemGroupTableInterface) => (
        <div className="d-flex align-items-center gap-3">
          <span>{record.translations[UserLangEnum.EN].description}</span>
        </div>
      ),
    },
    {
      title: t('columns.code'),
      dataIndex: 'code',
      width: '12%',
      editable: true,
    },
    {
      title: t('columns.tryOnEnabled'),
      dataIndex: 'tryOnEnabled',
      width: '8%',
      editable: true,
      align: 'center' as const,
      render: (_: unknown, record: ItemGroupTableInterface) => (
        <Checkbox checked={record.tryOnEnabled} disabled />
      ),
    },
    {
      title: t('columns.tryOnVtoType'),
      dataIndex: 'tryOnVtoType',
      width: '12%',
      editable: true,
      render: (_: unknown, record: ItemGroupTableInterface) => (
        record.tryOnVtoType
          ? t(`tryOnVtoTypeOptions.${record.tryOnVtoType}`)
          : null
      ),
    },
    {
      title: t('columns.operation'),
      dataIndex: 'operation',
      render: (_: unknown, record: ItemGroupTableInterface) => {
        const editable = isEditing(record);
        return editable ? (
          <span>
            <Button color="default" variant="text" onClick={() => save(record.key)} style={{ marginInlineEnd: 8 }}>
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
              ? <Popconfirm rootClassName="ant-input-group-addon" title={t('deleteConfirm')} description={t('deleteConfirm2')} okText={t('okText')} cancelText={t('cancel')} onConfirm={() => handleDelete(record)}>
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
      axios.get<{ code: number, itemGroups: ItemGroupInterface[] }>(routes.itemGroup.findMany({ isServer: false }), {
        params: { withDeleted },
      })
        .then(({ data: response }) => {
          if (response.code === 1) {
            setData(response.itemGroups.map(mapItemGroupToTableRow));
          }
          setIsSubmit(false);
        })
        .catch((e) => {
          axiosErrorHandler(e, tToast, setIsSubmit);
        });
    }
  }, [withDeleted]);

  useEffect(() => {
    setData(itemGroups.map(mapItemGroupToTableRow));
  }, [itemGroups.length]);

  useEffect(() => {
    if (isSorting) {
      sort();
      setIsSorting(false);
    }
  }, [isSorting]);

  return isAdmin ? (
    <div className="d-flex flex-column mb-5 justify-content-center" style={isMobile ? { marginTop: '50px' } : {}}>
      <Helmet title={t('title')} description={t('description')} />
      <h1 className="font-good-vibes-pro text-center mb-5" style={{ marginTop: '12%' }}>{t('title')}</h1>
      <div className="d-flex flex-column justify-content-center">
        <div className="mb-3">
          <BackButton style={{}} />
        </div>
        <div className="d-flex align-items-center gap-3 mb-3">
          <AdminListPrimaryActionButton onClick={handleAdd} disabled={!!editingKey}>
            {t('addItemGroup')}
          </AdminListPrimaryActionButton>
          <Checkbox checked={withDeleted} onChange={withDeletedHandler}>{t('withDeleted')}</Checkbox>
        </div>
      </div>
      <Form form={form} component={false} className="d-flex flex-column gap-3" style={{ width: '40%' }}>
        <DndContext modifiers={[restrictToVerticalAxis]} onDragEnd={onDragEnd}>
          <SortableContext items={data.map(({ key }) => key)} strategy={verticalListSortingStrategy}>
            <Table<ItemGroupTableInterface>
              components={{
                body: { cell: EditableCell, row: Row },
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
          </SortableContext>
        </DndContext>
      </Form>
    </div>
  ) : null;
};

export default CreateItemGroup;
