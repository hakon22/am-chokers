import moment from 'moment';
import { isNil } from 'lodash';

import { DateFormatEnum } from '@/utilities/enums/date.format.enum';

export type HistoryChangePresentation =
  | { kind: 'created'; title: string }
  | {
    kind: 'delta';
    label: string;
    formattedOld: string;
    formattedNew: string;
    arrow: string;
  };

const ISO_LIKE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;

/**
 * Проверяет, похоже ли значение на ISO-дату из API истории
 * @param raw - строка из `old_value` / `new_value`
 * @returns `true`, если уместно форматировать как дату
 */
const looksLikeIsoInstant = (raw: string): boolean => {
  if (!raw || raw.length < 10) {
    return false;
  }
  return ISO_LIKE.test(raw) && moment(raw, moment.ISO_8601, true).isValid();
};

/**
 * Форматирует одно значение для отображения в ленте истории (даты в локальном формате)
 * @param raw - сырое значение из API
 * @returns строка для UI; пустые значения — пустая строка (без длинного тире)
 */
export const formatHistoryDisplayValue = (raw: string | null): string => {
  if (isNil(raw) || raw === '') {
    return '';
  }
  if (looksLikeIsoInstant(raw)) {
    return moment(raw, moment.ISO_8601, true).format(DateFormatEnum.DD_MM_YYYY_HH_MM);
  }
  return raw;
};

/**
 * Проверяет, есть ли в API непустое значение (с учётом пробелов)
 * @param raw - сырое значение
 * @returns `true`, если значение задано
 */
const hasMeaningfulRaw = (raw: string | null): boolean => {
  if (isNil(raw)) {
    return false;
  }
  return String(raw).trim() !== '';
};

/**
 * Собирает данные для одной строки таймлайна истории товара
 * @param row - запись истории
 * @param fieldLabel - функция подписи поля по ключу `field`
 * @param arrow - символ стрелки между значениями
 * @param valueRemovedLabel - подпись, если значение снято (было непустое, стало пустое)
 * @returns либо событие «создан», либо блок с подписью поля и парой значений
 */
export const buildHistoryChangePresentation = (
  row: { field: string; oldValue: string | null; newValue: string | null },
  fieldLabel: (field: string) => string,
  arrow: string,
  valueRemovedLabel: string,
): HistoryChangePresentation => {
  if (row.field === 'created') {
    return { kind: 'created', title: fieldLabel('created') };
  }

  const formattedOld = formatHistoryDisplayValue(row.oldValue);
  let formattedNew = formatHistoryDisplayValue(row.newValue);
  const hadOld = hasMeaningfulRaw(row.oldValue);
  const hasNew = hasMeaningfulRaw(row.newValue);
  if (hadOld && !hasNew && row.field !== 'deleted') {
    formattedNew = valueRemovedLabel;
  }

  return {
    kind: 'delta',
    label: fieldLabel(row.field),
    formattedOld,
    formattedNew,
    arrow,
  };
};
