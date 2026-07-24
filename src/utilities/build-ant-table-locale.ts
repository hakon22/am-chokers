import { createElement } from 'react';
import type { TableProps } from 'antd';
import type { TFunction } from 'i18next';

import { NotFoundContent } from '@/components/NotFoundContent';

type AntTableLocale = NonNullable<TableProps['locale']>;

/**
 * Возвращает locale Ant Design Table с переводами tooltip сортировки и пустого состояния
 * @param translate - функция i18next с namespace translation
 * @param options - дополнительные поля locale (например, emptyText)
 * @returns объект locale для Table
 */
export const buildAntTableLocale = (
  translate: TFunction<'translation'>,
  options?: Pick<AntTableLocale, 'emptyText'>,
): AntTableLocale => ({
  emptyText: createElement(NotFoundContent),
  triggerAsc: translate('modules.antTable.sort.triggerAsc'),
  triggerDesc: translate('modules.antTable.sort.triggerDesc'),
  cancelSort: translate('modules.antTable.sort.cancelSort'),
  ...options,
});
