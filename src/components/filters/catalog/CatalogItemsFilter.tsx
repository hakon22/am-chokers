import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { useContext, useEffect, useState } from 'react';
import { AutoComplete, Badge, Button, Checkbox, Collapse, Drawer, FloatButton, Form, InputNumber } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { Funnel } from 'react-bootstrap-icons';
import type { CollapseProps } from 'antd/lib';

import { routes } from '@/routes';
import { axiosErrorHandler } from '@/utilities/axiosErrorHandler';
import { useAppSelector } from '@/utilities/hooks';
import { onFocus } from '@/utilities/onFocus';
import { MobileContext } from '@/components/Context';
import type { ItemCollectionInterface, ItemGroupInterface } from '@/types/item/Item';
import type { CompositionInterface } from '@/types/composition/CompositionInterface';
import type { CatalogFiltersInterface } from '@/pages/catalog';

interface CatalogItemsPropsInterface {
  setIsSubmit: React.Dispatch<React.SetStateAction<boolean>>;
  onFilters: (values: CatalogFiltersInterface) => Promise<void>;
  initialValues: CatalogFiltersInterface;
  setInitialValues: React.Dispatch<React.SetStateAction<CatalogFiltersInterface>>;
  showDrawer: boolean;
  setShowDrawer: React.Dispatch<React.SetStateAction<boolean>>;
  itemGroup?: ItemGroupInterface;
}

const mapping = ({ id, name }: { id: number; name: string; }) => ({ label: <span className="fs-6">{name}</span>, value: id.toString() });

export const CatalogItemsFilter = ({ onFilters, setIsSubmit, initialValues, setInitialValues, showDrawer, setShowDrawer, itemGroup }: CatalogItemsPropsInterface) => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.catalog.filters' });
  const { t: tToast } = useTranslation('translation', { keyPrefix: 'toast' });

  const { itemGroups } = useAppSelector((state) => state.app);

  const { isMobile } = useContext(MobileContext);

  const [itemCollections, setItemCollections] = useState<ItemCollectionInterface[]>([]);
  const [fullCompositions, setFullCompositions] = useState<CompositionInterface[]>([]);
  const [optionCompositions, setOptionCompositions] = useState<CompositionInterface[]>([]);

  const itemGroupFilterOptions = itemGroups.map(mapping);
  const itemCollectionsFilterOptions = itemCollections.map(mapping);
  const compositionsFilterOptions = optionCompositions.map(mapping);

  const [form] = Form.useForm<CatalogFiltersInterface>();

  const onChange = (str: string) => {
    if (str) {
      setOptionCompositions(fullCompositions.filter(({ name }) => name.toLowerCase().includes(str.toLowerCase())));
    } else {
      setOptionCompositions(fullCompositions);
    }
  };

  const setValueCompositions = (values: string[]) => {
    const otherValues = (initialValues.compositions ?? [])?.filter((value) => !optionCompositions.find((optionsValue) => optionsValue.id.toString() === value));
    setInitialValues((state) => ({ ...state, compositions: [...values, ...otherValues] }));
  };

  const onClear = () => {
    setOptionCompositions(fullCompositions);
  };

  const onFinish = async (values: CatalogFiltersInterface) => {
    onFilters({ ...initialValues, ...values });
  };

  const fetchData = async () => {
    try {
      setIsSubmit(true);
      const [{ data: response1 }, { data: response2 }] = await Promise.all([
        axios.get<{ code: number; itemCollections: ItemCollectionInterface[]; }>(routes.getItemCollections({ isServer: false })),
        axios.get<{ code: number; compositions: CompositionInterface[]; }>(routes.getCompositions),
      ]);
      if (response1.code === 1) {
        setItemCollections(response1.itemCollections);
      }
      if (response2.code === 1) {
        setOptionCompositions(response2.compositions);
        setFullCompositions(response2.compositions);
      }
      setIsSubmit(false);
    } catch (e) {
      axiosErrorHandler(e, tToast, setIsSubmit);
    }
  };

  const filtersCount = () => (initialValues.itemGroups?.length ?? 0) + (initialValues.compositions?.length ?? 0) + (initialValues.itemCollections?.length ?? 0) + (initialValues.from ? 1 : 0) + (initialValues.to ? 1 : 0);

  const filters: CollapseProps['items'] = [
    {
      key: '1',
      classNames: { header: 'pt-1' },
      label: (
        <div className="d-flex align-items-center justify-content-between">
          <span className="font-oswald text-uppercase" style={{ fontWeight: 400 }}>{t('type')}</span>
          {initialValues.itemGroups?.length ? <Badge count={initialValues.itemGroups.length} color="#69788e" /> : null}
        </div>
      ),
      children: (
        <Form.Item<CatalogFiltersInterface> name="itemGroups">
          <Checkbox.Group className="d-flex flex-column justify-content-center gap-2 checkbox-center" style={{ fontWeight: 300 }} options={itemGroup && !isMobile ? itemGroupFilterOptions.map((value) => ({ ...value, disabled: true })) : itemGroupFilterOptions} />
        </Form.Item>
      ),
    },
    {
      key: '2',
      label: (
        <div className="d-flex align-items-center justify-content-between">
          <span className="font-oswald text-uppercase" style={{ fontWeight: 400 }}>{t('materials')}</span>
          {initialValues.compositions?.length ? <Badge count={initialValues.compositions.length} color="#69788e" /> : null}
        </div>
      ),
      children: (
        <div className="d-flex flex-column gap-4">
          <AutoComplete
            className="w-100 custom-placeholder"
            placeholder={t('search')}
            allowClear
            suffixIcon={<SearchOutlined />}
            onClear={onClear}
            onChange={onChange}
            onInputKeyDown={({ key }) => {
              if (key === 'Enter') {
                onFocus();
              }
            }} />
          <Form.Item<CatalogFiltersInterface>>
            <Checkbox.Group className="d-flex flex-column justify-content-center gap-2 checkbox-center" value={initialValues.compositions} onChange={setValueCompositions} style={{ fontWeight: 300 }} options={compositionsFilterOptions} />
          </Form.Item>
        </div>
      ),
    },
    {
      key: '3',
      label: (
        <div className="d-flex align-items-center justify-content-between">
          <span className="font-oswald text-uppercase" style={{ fontWeight: 400 }}>{t('collections')}</span>
          {initialValues.itemCollections?.length ? <Badge count={initialValues.itemCollections.length} color="#69788e" /> : null}
        </div>
      ),
      children: (
        <Form.Item<CatalogFiltersInterface> name="itemCollections">
          <Checkbox.Group className="d-flex flex-column justify-content-center gap-2 checkbox-center" style={{ fontWeight: 300 }} options={itemCollectionsFilterOptions} />
        </Form.Item>
      ),
    },
    {
      key: '4',
      label: <span className="font-oswald text-uppercase">{t('price.title')}</span>,
      children: (
        <>
          <Form.Item<CatalogFiltersInterface> name="from" className="custom-placeholder">
            <InputNumber className="w-100" size="small" placeholder={t('price.from')} suffix={t('price.suffix')} min={1} keyboard />
          </Form.Item>
          <Form.Item<CatalogFiltersInterface> name="to" className="custom-placeholder">
            <InputNumber className="w-100" size="small" placeholder={t('price.to')} suffix={t('price.suffix')} min={1} keyboard />
          </Form.Item>
        </>
      ),
    },
  ];

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    form.setFieldsValue(initialValues);
  }, [JSON.stringify(initialValues)]);

  useEffect(() => {
    if (itemGroup) {
      form.setFieldValue('itemGroups', [itemGroup.id.toString()]);
      // form.setFieldsValue({ ...initialValues, itemGroups: [...(initialValues.itemGroups || []), itemGroup.id.toString()] });
    }
  }, [itemGroup?.id]);

  return isMobile
    ? (
      <>
        <FloatButton
          style={{ left: '6.5%', top: '5rem', zIndex: 1 }}
          badge={{ count: filtersCount() }}
          icon={<Funnel />}
          onClick={() => setShowDrawer(true)}
        />
        <Drawer
          placement="left"
          title={t('title')}
          onClose={() => setShowDrawer(false)}
          open={showDrawer}
        >
          <Form className="large-input w-100" onFinish={onFinish} form={form} initialValues={initialValues}>
            <Collapse defaultActiveKey={['1', '4']} ghost items={filters} expandIconPosition="end" className="mb-4" />
            <Button htmlType="submit" className="button fs-6 mx-auto">
              {t('submitButton')}
            </Button>
          </Form>
        </Drawer>
      </>
    )
    : (
      <div className="d-flex col-2">
        <Form className="large-input w-100" onFinish={onFinish} form={form} initialValues={initialValues}>
          <Collapse defaultActiveKey={['1', '4']} ghost items={filters} expandIconPosition="end" className="mb-4" />
          <Button htmlType="submit" className="button fs-6 mx-auto">
            {t('submitButton')}
          </Button>
        </Form>
      </div>
    );
};
