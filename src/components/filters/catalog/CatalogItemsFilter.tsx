import axios from 'axios';
import { isEmpty, isNil } from 'lodash';
import { useTranslation } from 'react-i18next';
import { useContext, useEffect, useEffectEvent, useMemo, useState } from 'react';
import { AutoComplete, Badge, Button, Checkbox, Collapse, Drawer, FloatButton, Form, InputNumber, Select } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { FunnelFill, SortDown, SortDownAlt, SortNumericDownAlt } from 'react-bootstrap-icons';
import type { TFunction } from 'i18next';
import type { CollapseProps, FormInstance } from 'antd/lib';

import { routes } from '@/routes';
import { axiosErrorHandler } from '@/utilities/axiosErrorHandler';
import { useAppSelector } from '@/hooks/reduxHooks';
import { onFocus } from '@/utilities/onFocus';
import { MobileContext } from '@/components/Context';
import { ItemSortEnum } from '@server/types/item/enums/item.sort.enum';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';
import type { ItemCollectionInterface, ItemGroupInterface } from '@/types/item/Item';
import type { CompositionInterface } from '@/types/composition/CompositionInterface';
import type { CatalogFiltersInterface } from '@/pages/catalog';
import type { ColorInterface } from '@/types/color/ColorInterface';
import type { ItemCollectionTranslateEntity } from '@server/db/entities/item.collection.translate.entity';
import type { ItemGroupTranslateEntity } from '@server/db/entities/item.group.translate.entity';
import type { CompositionTranslateEntity } from '@server/db/entities/composition.translate.entity';
import type { ItemCollectionEntity } from '@server/db/entities/item.collection.entity';

interface CatalogItemsPropsInterface {
  setIsSubmit: React.Dispatch<React.SetStateAction<boolean>>;
  onFilters: (values: CatalogFiltersInterface) => Promise<void>;
  form: FormInstance<CatalogFiltersInterface>;
  initialValues: CatalogFiltersInterface;
  setInitialValues: React.Dispatch<React.SetStateAction<CatalogFiltersInterface>>;
  showDrawer: boolean;
  setShowDrawer: React.Dispatch<React.SetStateAction<boolean>>;
  itemGroup?: ItemGroupInterface;
  uuid: string;
  statistics: Record<number, number>;
  resetFilters: () => void;
}

interface MappingInterface {
  id: number;
  lang: UserLangEnum;
  isItemGroup?: boolean;
  translations: (ItemGroupTranslateEntity | ItemCollectionTranslateEntity | CompositionTranslateEntity)[];
  count?: number;
}

const FilterButtons = ({ t, resetFilters }: { t: TFunction; resetFilters?: () => void; }) => (
  <div className="d-flex flex-column justify-content-center gap-3 mb-4">
    <Button htmlType="submit" className="filter fs-6 mx-auto col-6 col-xl-9" style={{ backgroundColor: '#eaeef6' }}>
      {t('submitButton')}
    </Button>
    {resetFilters ? (
      <Button className="filter fs-6 mx-auto col-6 col-xl-9" style={{ backgroundColor: '#f7f9fcd8', color: '#69788e' }} onClick={resetFilters}>
        {t('resetFilters')}
      </Button>
    )
      : null}
  </div>
);

const mapping = ({ id, lang, isItemGroup, translations, count }: MappingInterface) => ({ label: <span className="fs-6">{translations.find((translation) => translation.lang === lang)?.name}{isItemGroup ? ` (${count || 0})` : ''}</span>, value: id.toString() });

export const CatalogItemsFilter = ({ onFilters, setIsSubmit, form, initialValues, setInitialValues, showDrawer, setShowDrawer, itemGroup, uuid, statistics, resetFilters }: CatalogItemsPropsInterface) => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.catalog.filters' });
  const { t: tToast } = useTranslation('translation', { keyPrefix: 'toast' });

  const { itemGroups } = useAppSelector((state) => state.app);

  const { lang = UserLangEnum.RU } = useAppSelector((state) => state.user);

  const { isMobile } = useContext(MobileContext);

  const [itemCollections, setItemCollections] = useState<ItemCollectionInterface[]>([]);
  const [fullCompositions, setFullCompositions] = useState<CompositionInterface[]>([]);
  const [optionCompositions, setOptionCompositions] = useState<CompositionInterface[]>([]);
  const [optionColors, setOptionColors] = useState<ColorInterface[]>([]);

  const itemGroupFilterOptions = [...itemGroups].sort((a, b) => (a.order || 0) - (b.order || 0)).map((item) => mapping({ ...item, isItemGroup: true, lang: lang as UserLangEnum, count: statistics[item.id] }));
  const itemCollectionsFilterOptions = itemCollections.map((item) => mapping({ ...item as ItemCollectionEntity, lang: lang as UserLangEnum }));
  const compositionsFilterOptions = optionCompositions.map((item) => mapping({ ...item, lang: lang as UserLangEnum }));
  const colorsFilterOptions = optionColors.map((color) => ({
    label: (
      <div className="d-flex align-items-center gap-2 fs-6">
        <span className="d-block" style={{ backgroundColor: color.hex, borderRadius: '50%', width: 20, height: 20 }} />
        <span>{color.translations.find((translation) => translation.lang === lang)?.name}</span>
      </div>
    ),
    value: color.id.toString(),
  }));

  const onChange = (str: string) => {
    if (str) {
      setOptionCompositions(fullCompositions.filter(({ translations }) => translations.find((translation) => translation.lang === lang)?.name.toLowerCase().includes(str.toLowerCase())));
    } else {
      setOptionCompositions(fullCompositions);
    }
  };

  const setValueCompositions = (values: string[]) => {
    const otherValues = (initialValues.collectionIds ?? [])?.filter((value) => !optionCompositions.find((optionsValue) => optionsValue.id.toString() === value));
    setInitialValues((state) => ({ ...state, compositionIds: [...values, ...otherValues] }));
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
        axios.get<{ code: number; itemCollections: ItemCollectionInterface[]; }>(routes.itemCollection.findMany({ isServer: false })),
        axios.get<{ code: number; compositions: CompositionInterface[]; }>(routes.composition.findMany),
        axios.get<{ code: number; colors: ColorInterface[]; }>(routes.color.findMany),
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

  const fetchDataEffect = useEffectEvent(fetchData);

  const getFiltersCount = useMemo(() => (
    initialValues.groupIds?.length ?? 0) +
    (initialValues.collectionIds?.length ?? 0) +
    (initialValues.compositionIds?.length ?? 0) +
    (initialValues.colorIds?.length ?? 0) +
    (initialValues.from ? 1 : 0) +
    (initialValues.to ? 1 : 0) +
    (initialValues.new ? 1 : 0) +
    (initialValues.bestseller ? 1 : 0) +
    (initialValues.inStock ? 1 : 0) +
    (initialValues.sort ? 1 : 0), [
    initialValues.groupIds?.length,
    initialValues.collectionIds?.length,
    initialValues.compositionIds?.length,
    initialValues.colorIds?.length,
    initialValues.from,
    initialValues.to,
    initialValues.new,
    initialValues.bestseller,
    initialValues.inStock,
    initialValues.sort,
  ]);

  const activeFields = useMemo(() => {
    const activeFields = ['1', '4'];

    if (initialValues.compositionIds?.length) {
      activeFields.push('2');
    }
    if (initialValues.collectionIds?.length) {
      activeFields.push('3');
    }
    if (initialValues.new || initialValues.bestseller || initialValues.inStock) {
      activeFields.push('5');
    }
    if (initialValues.colorIds?.length) {
      activeFields.push('6');
    }

    return activeFields;
  }, [initialValues.compositionIds?.length, initialValues.collectionIds?.length, initialValues.colorIds?.length, initialValues.new, initialValues.bestseller, initialValues.inStock]);

  const filters: CollapseProps['items'] = [
    {
      key: '1',
      classNames: { header: 'pt-1' },
      label: (
        <div className="d-flex align-items-center justify-content-between">
          <span className="font-oswald text-uppercase fw-400">{t('type')}</span>
          {initialValues.groupIds?.length ? <Badge count={initialValues.groupIds.length} color="#69788e" /> : null}
        </div>
      ),
      children: (
        <Form.Item<CatalogFiltersInterface> name="groupIds">
          <Checkbox.Group className="d-flex flex-column justify-content-center gap-xl-2 checkbox-center fw-300" options={itemGroupFilterOptions} />
        </Form.Item>
      ),
    },
    {
      key: '2',
      label: (
        <div className="d-flex align-items-center justify-content-between">
          <span className="font-oswald text-uppercase fw-400">{t('materials')}</span>
          {initialValues.compositionIds?.length ? <Badge count={initialValues.compositionIds.length} color="#69788e" /> : null}
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
            classNames={{
              content: 'custom-placeholder not-padding fs-6',
              placeholder: 'custom-placeholder not-padding fs-6',
            } as any}
            onInputKeyDown={({ key }) => {
              if (key === 'Enter') {
                onFocus();
              }
            }} />
          <Form.Item<CatalogFiltersInterface>>
            <Checkbox.Group className="d-flex flex-column justify-content-center gap-xl-2 checkbox-center fw-300" value={initialValues.compositionIds} onChange={setValueCompositions} options={compositionsFilterOptions} />
          </Form.Item>
        </div>
      ),
    },
    {
      key: '3',
      label: (
        <div className="d-flex align-items-center justify-content-between">
          <span className="font-oswald text-uppercase fw-400">{t('collections')}</span>
          {initialValues.collectionIds?.length ? <Badge count={initialValues.collectionIds.length} color="#69788e" /> : null}
        </div>
      ),
      children: (
        <Form.Item<CatalogFiltersInterface> name="collectionIds">
          <Checkbox.Group className="d-flex flex-column justify-content-center gap-xl-2 checkbox-center fw-300" options={itemCollectionsFilterOptions} />
        </Form.Item>
      ),
    },
    {
      key: '4',
      label: (
        <div className="d-flex align-items-center justify-content-between">
          <span className="font-oswald text-uppercase fw-400">{t('price.title')}</span>
          {initialValues.from || initialValues.to ? <Badge count={(initialValues.from ? 1 : 0) + (initialValues.to ? 1 : 0)} color="#69788e" /> : null}
        </div>
      ),
      children: (
        <>
          <Form.Item<CatalogFiltersInterface> name="from" className="custom-placeholder">
            <InputNumber className="w-100" {...isMobile ? { classNames: { input: 'not-padding' } } : {}} size="small" placeholder={t('price.from')} suffix={t('price.suffix')} min={1} keyboard />
          </Form.Item>
          <Form.Item<CatalogFiltersInterface> name="to" className="custom-placeholder">
            <InputNumber className="w-100" {...isMobile ? { classNames: { input: 'not-padding' } } : {}} size="small" placeholder={t('price.to')} suffix={t('price.suffix')} min={1} keyboard />
          </Form.Item>
        </>
      ),
    },
    {
      key: '5',
      label: (
        <div className="d-flex align-items-center justify-content-between">
          <span className="font-oswald text-uppercase fw-400">{t('additionally.title')}</span>
          {initialValues.new || initialValues.bestseller || initialValues.inStock ? <Badge count={(initialValues.new ? 1 : 0) + (initialValues.bestseller ? 1 : 0) + (initialValues.inStock ? 1 : 0)} color="#69788e" /> : null}
        </div>
      ),
      children: (
        <>
          <Form.Item<CatalogFiltersInterface> name="inStock" className="mb-2" valuePropName="checked">
            <Checkbox className="d-flex align-items-center gap-2 custom-size fw-300">{t('additionally.inStock')}</Checkbox>
          </Form.Item>
          <Form.Item<CatalogFiltersInterface> name="new" className="mb-2" valuePropName="checked">
            <Checkbox className="d-flex align-items-center gap-2 custom-size fw-300">{t('additionally.new')}</Checkbox>
          </Form.Item>
          <Form.Item<CatalogFiltersInterface> name="bestseller" valuePropName="checked">
            <Checkbox className="d-flex align-items-center gap-2 custom-size fw-300">{t('additionally.bestseller')}</Checkbox>
          </Form.Item>
        </>
      ),
    },
    {
      key: '6',
      label: (
        <div className="d-flex align-items-center justify-content-between">
          <span className="font-oswald text-uppercase fw-400">{t('colors')}</span>
          {initialValues.colorIds?.length ? <Badge count={initialValues.colorIds.length} color="#69788e" /> : null}
        </div>
      ),
      children: (
        <Form.Item<CatalogFiltersInterface> name="colorIds">
          <Checkbox.Group className="d-flex flex-column justify-content-center gap-xl-2 checkbox-center fw-300" options={colorsFilterOptions} />
        </Form.Item>
      ),
    },
  ];

  useEffect(() => {
    fetchDataEffect();
  }, []);

  useEffect(() => {
    form.setFieldsValue({ ...initialValues, ...(itemGroup?.id && Object.values(initialValues).every((value) => Array.isArray(value) ? isEmpty(value) : isNil(value)) ? { groupIds: [itemGroup.id.toString()] } : {}) });
  }, [itemGroup?.id, uuid, initialValues]);

  useEffect(() => {
    setInitialValues({ ...initialValues, ...(itemGroup?.id && Object.values(initialValues).every((value) => Array.isArray(value) ? isEmpty(value) : isNil(value)) ? { groupIds: [itemGroup.id.toString()] } : {}) });
  }, [itemGroup?.id, uuid]);

  return isMobile
    ? (
      <>
        <FloatButton
          style={{ right: '6.5%', top: '69px', zIndex: 5 }}
          className="fs-6 border-0"
          badge={{ count: getFiltersCount, offset: [5, 2] }}
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
            <FilterButtons t={t} {...(getFiltersCount ? { resetFilters } : {})} />
            <Form.Item<CatalogFiltersInterface> name="sort" style={{ padding: '0 12px' }}>
              <Select
                placeholder={t('sort.title')}
                classNames={{
                  content: 'custom-placeholder not-padding fs-6',
                  placeholder: 'custom-placeholder not-padding fs-6',
                } as any}
                onChange={onFocus}
                options={[
                  {
                    value: ItemSortEnum.BY_RATING,
                    label: (
                      <span>
                        <SortNumericDownAlt className="me-2" />
                        {t('sort.byRating')}
                      </span>),
                  },
                  {
                    value: ItemSortEnum.BY_OVER_PRICE,
                    label: (
                      <span>
                        <SortDown className="me-2" />
                        {t('sort.byOverPrice')}
                      </span>),
                  },
                  {
                    value: ItemSortEnum.BY_LOWER_PRICE,
                    label: (
                      <span>
                        <SortDownAlt className="me-2" />
                        {t('sort.byLowerPrice')}
                      </span>),
                  },
                ]}
              />
            </Form.Item>
            <Collapse defaultActiveKey={activeFields} ghost items={filters} expandIconPlacement="end" />
          </Form>
        </Drawer>
      </>
    )
    : (
      <div className="d-flex col-2">
        <Form className="large-input w-100" onFinish={onFinish} form={form} initialValues={initialValues}>
          <FilterButtons t={t} {...(getFiltersCount ? { resetFilters } : {})} />
          <Form.Item<CatalogFiltersInterface> name="sort" style={{ padding: '0 12px' }}>
            <Select
              placeholder={t('sort.title')}
              classNames={{
                content: 'custom-placeholder not-padding fs-6',
                placeholder: 'custom-placeholder not-padding fs-6',
              } as any}
              onChange={onFocus}
              options={[
                {
                  value: ItemSortEnum.BY_RATING,
                  label: (
                    <span>
                      <SortNumericDownAlt className="me-2" />
                      {t('sort.byRating')}
                    </span>),
                },
                {
                  value: ItemSortEnum.BY_OVER_PRICE,
                  label: (
                    <span>
                      <SortDown className="me-2" />
                      {t('sort.byOverPrice')}
                    </span>),
                },
                {
                  value: ItemSortEnum.BY_LOWER_PRICE,
                  label: (
                    <span>
                      <SortDownAlt className="me-2" />
                      {t('sort.byLowerPrice')}
                    </span>),
                },
              ]}
            />
          </Form.Item>
          <Collapse defaultActiveKey={activeFields} ghost items={filters} expandIconPlacement="end" />
        </Form>
      </div>
    );
};
