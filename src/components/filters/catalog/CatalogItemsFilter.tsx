import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { useContext, useEffect, useState } from 'react';
import { AutoComplete, Badge, Button, Checkbox, Collapse, Drawer, FloatButton, Form, InputNumber } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { FunnelFill } from 'react-bootstrap-icons';
import type { CollapseProps, FormInstance } from 'antd/lib';

import { routes } from '@/routes';
import { axiosErrorHandler } from '@/utilities/axiosErrorHandler';
import { useAppSelector } from '@/utilities/hooks';
import { onFocus } from '@/utilities/onFocus';
import { MobileContext } from '@/components/Context';
import type { ItemCollectionInterface, ItemGroupInterface } from '@/types/item/Item';
import type { CompositionInterface } from '@/types/composition/CompositionInterface';
import type { CatalogFiltersInterface } from '@/pages/catalog';
import type { ColorInterface } from '@/types/color/ColorInterface';

interface CatalogItemsPropsInterface {
  setIsSubmit: React.Dispatch<React.SetStateAction<boolean>>;
  onFilters: (values: CatalogFiltersInterface) => Promise<void>;
  form: FormInstance<CatalogFiltersInterface>;
  initialValues: CatalogFiltersInterface;
  setInitialValues: React.Dispatch<React.SetStateAction<CatalogFiltersInterface>>;
  showDrawer: boolean;
  setShowDrawer: React.Dispatch<React.SetStateAction<boolean>>;
  itemGroup?: ItemGroupInterface;
}

const mapping = ({ id, name }: { id: number; name: string; }) => ({ label: <span className="fs-6">{name}</span>, value: id.toString() });

export const CatalogItemsFilter = ({ onFilters, setIsSubmit, form, initialValues, setInitialValues, showDrawer, setShowDrawer, itemGroup }: CatalogItemsPropsInterface) => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.catalog.filters' });
  const { t: tToast } = useTranslation('translation', { keyPrefix: 'toast' });

  const { itemGroups } = useAppSelector((state) => state.app);

  const { isMobile } = useContext(MobileContext);

  const [itemCollections, setItemCollections] = useState<ItemCollectionInterface[]>([]);
  const [fullCompositions, setFullCompositions] = useState<CompositionInterface[]>([]);
  const [optionCompositions, setOptionCompositions] = useState<CompositionInterface[]>([]);
  const [optionColors, setOptionColors] = useState<ColorInterface[]>([]);

  const itemGroupFilterOptions = itemGroups.map(mapping);
  const itemCollectionsFilterOptions = itemCollections.map(mapping);
  const compositionsFilterOptions = optionCompositions.map(mapping);
  const colorsFilterOptions = optionColors.map((color) => ({
    label: (
      <div className="d-flex align-items-center gap-2 fs-6">
        <span className="d-block" style={{ backgroundColor: color.hex, borderRadius: '50%', width: 20, height: 20 }} />
        <span>{color.name}</span>
      </div>
    ),
    value: color.id.toString(),
  }));

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
      const [{ data: response1 }, { data: response2 }, { data: response3 }] = await Promise.all([
        axios.get<{ code: number; itemCollections: ItemCollectionInterface[]; }>(routes.getItemCollections({ isServer: false })),
        axios.get<{ code: number; compositions: CompositionInterface[]; }>(routes.getCompositions),
        axios.get<{ code: number; colors: ColorInterface[]; }>(routes.getColors),
      ]);
      if (response1.code === 1) {
        setItemCollections(response1.itemCollections);
      }
      if (response2.code === 1) {
        setOptionCompositions(response2.compositions);
        setFullCompositions(response2.compositions);
      }
      if (response3.code === 1) {
        setOptionColors(response3.colors);
      }
      setIsSubmit(false);
    } catch (e) {
      axiosErrorHandler(e, tToast, setIsSubmit);
    }
  };

  const getFiltersCount = () => (
    initialValues.itemGroups?.length ?? 0) +
    (initialValues.itemCollections?.length ?? 0) +
    (initialValues.compositions?.length ?? 0) +
    (initialValues.colors?.length ?? 0) +
    (initialValues.from ? 1 : 0) +
    (initialValues.to ? 1 : 0) +
    (initialValues.new ? 1 : 0) +
    (initialValues.bestseller ? 1 : 0);

  const getActiveFields = () => {
    const activeFields = ['1', '4'];

    if (initialValues.compositions?.length) {
      activeFields.push('2');
    }
    if (initialValues.itemCollections?.length) {
      activeFields.push('3');
    }
    if (initialValues.new || initialValues.bestseller) {
      activeFields.push('5');
    }
    if (initialValues.colors?.length) {
      activeFields.push('6');
    }

    return activeFields;
  };

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
          <Checkbox.Group className="d-flex flex-column justify-content-center gap-xl-2 checkbox-center" style={{ fontWeight: 300 }} options={itemGroup && !isMobile ? itemGroupFilterOptions.map((value) => ({ ...value, disabled: true })) : itemGroupFilterOptions} />
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
            <Checkbox.Group className="d-flex flex-column justify-content-center gap-xl-2 checkbox-center" value={initialValues.compositions} onChange={setValueCompositions} style={{ fontWeight: 300 }} options={compositionsFilterOptions} />
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
          <Checkbox.Group className="d-flex flex-column justify-content-center gap-xl-2 checkbox-center" style={{ fontWeight: 300 }} options={itemCollectionsFilterOptions} />
        </Form.Item>
      ),
    },
    {
      key: '4',
      label: (
        <div className="d-flex align-items-center justify-content-between">
          <span className="font-oswald text-uppercase" style={{ fontWeight: 400 }}>{t('price.title')}</span>
          {initialValues.from || initialValues.to ? <Badge count={(initialValues.from ? 1 : 0) + (initialValues.to ? 1 : 0)} color="#69788e" /> : null}
        </div>
      ),
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
    {
      key: '5',
      label: (
        <div className="d-flex align-items-center justify-content-between">
          <span className="font-oswald text-uppercase" style={{ fontWeight: 400 }}>{t('additionally.title')}</span>
          {initialValues.new || initialValues.bestseller ? <Badge count={(initialValues.new ? 1 : 0) + (initialValues.bestseller ? 1 : 0)} color="#69788e" /> : null}
        </div>
      ),
      children: (
        <>
          <Form.Item<CatalogFiltersInterface> name="new" className="mb-2" valuePropName="checked">
            <Checkbox className="d-flex align-items-center gap-2 custom-size" style={{ fontWeight: 300 }}>{t('additionally.new')}</Checkbox>
          </Form.Item>
          <Form.Item<CatalogFiltersInterface> name="bestseller" valuePropName="checked">
            <Checkbox className="d-flex align-items-center gap-2 custom-size" style={{ fontWeight: 300 }}>{t('additionally.bestseller')}</Checkbox>
          </Form.Item>
        </>
      ),
    },
    {
      key: '6',
      label: (
        <div className="d-flex align-items-center justify-content-between">
          <span className="font-oswald text-uppercase" style={{ fontWeight: 400 }}>{t('colors')}</span>
          {initialValues.colors?.length ? <Badge count={initialValues.colors.length} color="#69788e" /> : null}
        </div>
      ),
      children: (
        <Form.Item<CatalogFiltersInterface> name="colors">
          <Checkbox.Group className="d-flex flex-column justify-content-center gap-xl-2 checkbox-center" style={{ fontWeight: 300 }} options={colorsFilterOptions} />
        </Form.Item>
      ),
    },
  ];

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (itemGroup) {
      form.setFieldsValue({ ...initialValues, itemGroups: isMobile ? [...(initialValues.itemGroups || []), itemGroup.id.toString()] : [itemGroup.id.toString()] });
    } else {
      form.setFieldsValue(initialValues);
    }
  }, [itemGroup?.id]);

  return isMobile
    ? (
      <>
        <FloatButton
          style={{ left: '6.5%', top: '5rem', zIndex: 1 }}
          badge={{ count: getFiltersCount() }}
          icon={<FunnelFill />}
          onClick={() => setShowDrawer(true)}
        />
        <Drawer
          placement="left"
          title={t('title')}
          onClose={() => setShowDrawer(false)}
          open={showDrawer}
          zIndex={10001}
        >
          <Form className="large-input w-100" onFinish={onFinish} form={form} initialValues={initialValues}>
            <Collapse defaultActiveKey={getActiveFields()} ghost items={filters} expandIconPosition="end" className="mb-4" />
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
          <Collapse defaultActiveKey={getActiveFields()} ghost items={filters} expandIconPosition="end" className="mb-4" />
          <Button htmlType="submit" className="button fs-6 mx-auto">
            {t('submitButton')}
          </Button>
        </Form>
      </div>
    );
};
