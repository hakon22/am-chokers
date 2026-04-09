import { useContext, useEffect, useEffectEvent, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { isEmpty, isNil } from 'lodash';
import axios from 'axios';
import { Affix, Badge, Collapse, Drawer, FloatButton } from 'antd';
import { FunnelFill } from 'react-bootstrap-icons';
import type { CollapseProps } from 'antd';
import type { FormInstance } from 'antd/lib';

import { routes } from '@/routes';
import { axiosErrorHandler } from '@/utilities/axiosErrorHandler';
import { useAppSelector } from '@/hooks/reduxHooks';
import { MobileContext } from '@/components/Context';
import { ItemSortEnum } from '@server/types/item/enums/item.sort.enum';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';
import type { ItemCollectionInterface, ItemGroupInterface } from '@/types/item/Item';
import type { CompositionInterface } from '@/types/composition/CompositionInterface';
import type { ColorInterface } from '@/types/color/ColorInterface';
import type { CatalogFiltersInterface } from '@/pages/catalog';

import styles from './CatalogFilter.module.scss';

interface CatalogFilterPropsInterface {
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

interface CheckboxOptionProps {
  checked: boolean;
  label: string;
  count?: number;
  onClick: () => void;
}

const CheckboxOption = ({ checked, label, count, onClick }: CheckboxOptionProps) => (
  <div className={styles.option} onClick={onClick}>
    <div className={`${styles.checkbox} ${checked ? styles.checkboxChecked : ''}`}>
      {checked ? '✓' : ''}
    </div>
    <span className={styles.optionLabel}>{label}</span>
    {count !== undefined && <span className={styles.optionCount}>{count}</span>}
  </div>
);

export const CatalogFilter = ({
  onFilters,
  setIsSubmit,
  form,
  initialValues,
  setInitialValues,
  showDrawer,
  setShowDrawer,
  itemGroup,
  uuid,
  statistics,
  resetFilters,
}: CatalogFilterPropsInterface) => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.catalog.filters' });
  const { t: tToast } = useTranslation('translation', { keyPrefix: 'toast' });

  const { itemGroups } = useAppSelector((state) => state.app);
  const { lang = UserLangEnum.RU } = useAppSelector((state) => state.user);
  const { isMobile } = useContext(MobileContext);

  const [itemCollections, setItemCollections] = useState<ItemCollectionInterface[]>([]);
  const [allCompositions, setAllCompositions] = useState<CompositionInterface[]>([]);
  const [filteredCompositions, setFilteredCompositions] = useState<CompositionInterface[]>([]);
  const [colors, setColors] = useState<ColorInterface[]>([]);
  const [compositionSearch, setCompositionSearch] = useState('');

  const sortedGroups = [...itemGroups].sort((a, b) => (a.order || 0) - (b.order || 0));

  const filtersCount = useMemo(() => (
    (initialValues.groupIds?.length ?? 0) +
    (initialValues.collectionIds?.length ?? 0) +
    (initialValues.compositionIds?.length ?? 0) +
    (initialValues.colorIds?.length ?? 0) +
    (initialValues.from ? 1 : 0) +
    (initialValues.to ? 1 : 0) +
    (initialValues.new ? 1 : 0) +
    (initialValues.bestseller ? 1 : 0) +
    (initialValues.inStock ? 1 : 0) +
    (initialValues.sort ? 1 : 0)
  ), [
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

  // Same default-open logic as v1: type (1) and price (4) always open;
  // others open only when they have active values
  const defaultActiveKeys = useMemo(() => {
    const keys = ['1', '4'];
    if (initialValues.compositionIds?.length) keys.push('2');
    if (initialValues.collectionIds?.length) keys.push('3');
    if (initialValues.new || initialValues.bestseller || initialValues.inStock) keys.push('5');
    if (initialValues.colorIds?.length) keys.push('6');
    return keys;
  }, []);

  const fetchData = async () => {
    try {
      setIsSubmit(true);
      const [{ data: collectionsResponse }, { data: compositionsResponse }, { data: colorsResponse }] = await Promise.all([
        axios.get<{ code: number; itemCollections: ItemCollectionInterface[]; }>(routes.itemCollection.findMany({ isServer: false })),
        axios.get<{ code: number; compositions: CompositionInterface[]; }>(routes.composition.findMany),
        axios.get<{ code: number; colors: ColorInterface[]; }>(routes.color.findMany),
      ]);
      if (collectionsResponse.code === 1) setItemCollections(collectionsResponse.itemCollections);
      if (compositionsResponse.code === 1) {
        setAllCompositions(compositionsResponse.compositions);
        setFilteredCompositions(compositionsResponse.compositions);
      }
      if (colorsResponse.code === 1) setColors(colorsResponse.colors);
      setIsSubmit(false);
    } catch (error) {
      axiosErrorHandler(error, tToast, setIsSubmit);
    }
  };

  const fetchDataEffect = useEffectEvent(fetchData);

  useEffect(() => {
    fetchDataEffect();
  }, []);

  useEffect(() => {
    const shouldPresetGroup = itemGroup?.id && Object.values(initialValues).every((value) => Array.isArray(value) ? isEmpty(value) : isNil(value));
    form.setFieldsValue({ ...initialValues, ...(shouldPresetGroup ? { groupIds: [itemGroup.id.toString()] } : {}) });
  }, [itemGroup?.id, uuid, initialValues]);

  useEffect(() => {
    const shouldPresetGroup = itemGroup?.id && Object.values(initialValues).every((value) => Array.isArray(value) ? isEmpty(value) : isNil(value));
    if (shouldPresetGroup) {
      setInitialValues({ ...initialValues, groupIds: [itemGroup.id.toString()] });
    }
  }, [itemGroup?.id, uuid]);

  const toggleArrayValue = (field: keyof CatalogFiltersInterface, value: string) => {
    const current = (initialValues[field] as string[]) ?? [];
    const next = current.includes(value)
      ? current.filter((existing) => existing !== value)
      : [...current, value];
    const updated = { ...initialValues, [field]: next };
    setInitialValues(updated);
    form.setFieldValue(field, next);
    onFilters(updated);
  };

  const toggleBoolValue = (field: keyof CatalogFiltersInterface) => {
    const updated = { ...initialValues, [field]: initialValues[field] ? undefined : '1' };
    setInitialValues(updated);
    form.setFieldValue(field, updated[field]);
    onFilters(updated);
  };

  const handlePriceChange = (field: 'from' | 'to', value: string) => {
    setInitialValues((state) => ({ ...state, [field]: value || undefined }));
    form.setFieldValue(field, value || undefined);
  };

  const handlePriceBlur = () => {
    const { from, to } = form.getFieldsValue(['from', 'to']);
    const updated = { ...initialValues, from: from || undefined, to: to || undefined };
    setInitialValues(updated);
    onFilters(updated);
  };

  const handleSortChange = (value: string) => {
    const updated = { ...initialValues, sort: value || undefined };
    setInitialValues(updated);
    form.setFieldValue('sort', value || undefined);
    onFilters(updated);
  };

  const handleCompositionSearch = (value: string) => {
    setCompositionSearch(value);
    if (value) {
      setFilteredCompositions(
        allCompositions.filter(({ translations }) =>
          translations.find(({ lang: translationLang }) => translationLang === lang)?.name.toLowerCase().includes(value.toLowerCase()),
        ),
      );
    } else {
      setFilteredCompositions(allCompositions);
    }
  };

  const buildCollapseLabel = (text: string, badgeCount?: number) => (
    <div className={styles.collapseLabel}>
      <span className={styles.collapseLabelText}>{text}</span>
      {badgeCount ? <Badge count={badgeCount} color="#69788e" /> : null}
    </div>
  );

  const collapseSections: CollapseProps['items'] = [
    {
      key: '1',
      label: buildCollapseLabel(t('type'), initialValues.groupIds?.length),
      children: (
        <div className={styles.sectionContent}>
          {sortedGroups.map((group) => (
            <CheckboxOption
              key={group.id}
              checked={(initialValues.groupIds ?? []).includes(group.id.toString())}
              label={group.translations.find(({ lang: translationLang }) => translationLang === lang)?.name ?? ''}
              count={statistics[group.id]}
              onClick={() => toggleArrayValue('groupIds', group.id.toString())}
            />
          ))}
        </div>
      ),
    },
    {
      key: '4',
      label: buildCollapseLabel(
        `${t('price.title')}, ₽`,
        (initialValues.from ? 1 : 0) + (initialValues.to ? 1 : 0) || undefined,
      ),
      children: (
        <div className={styles.sectionContent}>
          <div className={styles.priceRange}>
            <input
              type="number"
              className={styles.priceInput}
              placeholder={t('price.from')}
              value={initialValues.from ?? ''}
              onChange={({ target: { value } }) => handlePriceChange('from', value)}
              onBlur={handlePriceBlur}
              min={1}
            />
            <span className={styles.priceSeparator}>—</span>
            <input
              type="number"
              className={styles.priceInput}
              placeholder={t('price.to')}
              value={initialValues.to ?? ''}
              onChange={({ target: { value } }) => handlePriceChange('to', value)}
              onBlur={handlePriceBlur}
              min={1}
            />
          </div>
        </div>
      ),
    },
    {
      key: '3',
      label: buildCollapseLabel(t('collections'), initialValues.collectionIds?.length),
      children: (
        <div className={styles.sectionContent}>
          {itemCollections
            .filter((c): c is NonNullable<typeof c> => c != null)
            .map((collection) => (
              <CheckboxOption
                key={collection.id}
                checked={(initialValues.collectionIds ?? []).includes(collection.id.toString())}
                label={collection.translations.find(({ lang: translationLang }) => translationLang === lang)?.name ?? ''}
                onClick={() => toggleArrayValue('collectionIds', collection.id.toString())}
              />
            ))}
        </div>
      ),
    },
    {
      key: '5',
      label: buildCollapseLabel(
        t('additionally.title'),
        (initialValues.new ? 1 : 0) + (initialValues.bestseller ? 1 : 0) + (initialValues.inStock ? 1 : 0) || undefined,
      ),
      children: (
        <div className={styles.sectionContent}>
          <CheckboxOption
            checked={!!initialValues.inStock}
            label={t('additionally.inStock')}
            onClick={() => toggleBoolValue('inStock')}
          />
          <CheckboxOption
            checked={!!initialValues.new}
            label={t('additionally.new')}
            onClick={() => toggleBoolValue('new')}
          />
          <CheckboxOption
            checked={!!initialValues.bestseller}
            label={t('additionally.bestseller')}
            onClick={() => toggleBoolValue('bestseller')}
          />
        </div>
      ),
    },
    {
      key: '2',
      label: buildCollapseLabel(t('materials'), initialValues.compositionIds?.length),
      children: (
        <div className={styles.sectionContent}>
          <input
            type="text"
            className={styles.compositionSearch}
            placeholder={t('search')}
            value={compositionSearch}
            onChange={({ target: { value } }) => handleCompositionSearch(value)}
          />
          {filteredCompositions.map((composition) => (
            <CheckboxOption
              key={composition.id}
              checked={(initialValues.compositionIds ?? []).includes(composition.id.toString())}
              label={composition.translations.find(({ lang: translationLang }) => translationLang === lang)?.name ?? ''}
              onClick={() => toggleArrayValue('compositionIds', composition.id.toString())}
            />
          ))}
        </div>
      ),
    },
    {
      key: '6',
      label: buildCollapseLabel(t('colors'), initialValues.colorIds?.length),
      children: (
        <div className={styles.sectionContent}>
          {colors.map((color) => (
            <div
              key={color.id}
              className={styles.option}
              onClick={() => toggleArrayValue('colorIds', color.id.toString())}
            >
              <div className={`${styles.checkbox} ${(initialValues.colorIds ?? []).includes(color.id.toString()) ? styles.checkboxChecked : ''}`}>
                {(initialValues.colorIds ?? []).includes(color.id.toString()) ? '✓' : ''}
              </div>
              <span className={styles.colorDot} style={{ backgroundColor: color.hex }} />
              <span className={styles.optionLabel}>
                {color.translations.find(({ lang: translationLang }) => translationLang === lang)?.name ?? ''}
              </span>
            </div>
          ))}
        </div>
      ),
    },
  ];

  const sortSection = (
    <div className={styles.sortSection}>
      <select
        className={styles.sortSelect}
        value={initialValues.sort ?? ''}
        onChange={({ target: { value } }) => handleSortChange(value)}
      >
        <option value="">{t('sort.title')}</option>
        <option value={ItemSortEnum.BY_RATING}>{t('sort.byRating')}</option>
        <option value={ItemSortEnum.BY_OVER_PRICE}>{t('sort.byOverPrice')}</option>
        <option value={ItemSortEnum.BY_LOWER_PRICE}>{t('sort.byLowerPrice')}</option>
      </select>
    </div>
  );

  if (isMobile) {
    return (
      <>
        <FloatButton
          style={{ right: '6.5%', top: '69px', zIndex: 5 }}
          badge={{ count: filtersCount, offset: [5, 2] }}
          icon={<FunnelFill />}
          onClick={() => setShowDrawer(true)}
        />
        <Drawer
          placement="left"
          title={t('title')}
          onClose={() => setShowDrawer(false)}
          open={showDrawer}
          zIndex={10001}
          styles={{ body: { padding: 0 }, header: { padding: '14px 18px' } }}
          extra={
            filtersCount > 0 && (
              <button className={styles.resetButton} type="button" onClick={() => { resetFilters(); setShowDrawer(false); }}>
                {t('resetFilters')}
              </button>
            )
          }
        >
          {sortSection}
          <Collapse
            defaultActiveKey={defaultActiveKeys}
            ghost
            items={collapseSections}
            expandIconPlacement="end"
            className={styles.collapseDrawer}
          />
        </Drawer>
      </>
    );
  }

  return (
    <Affix offsetTop={160}>
      <div className={styles.panel}>
        <div className={styles.header}>
          <span className={styles.title}>{t('title')}</span>
          {filtersCount > 0 && (
            <button className={styles.resetButton} type="button" onClick={resetFilters}>
              {t('resetFilters')}
            </button>
          )}
        </div>
        {sortSection}
        <Collapse
          defaultActiveKey={defaultActiveKeys}
          ghost
          items={collapseSections}
          expandIconPlacement="end"
          className={styles.collapse}
        />
      </div>
    </Affix>
  );
};
