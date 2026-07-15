import { isNil } from 'lodash';

import { AiTryOnVtoTypeEnum } from '@server/types/ai/enums/ai-try-on-vto-type.enum';
import { isRasterProductImageSrc } from '@/utilities/getFirstRasterProductImageSrc';
import type { ItemGroupInterface } from '@/types/item/Item';

/** Ключи инструкций в modules.tryOn.instructions */
export type TryOnInstructionKey = 'necklace' | 'earring';

/** Минимальный фрагмент группы для проверки AI-примерки */
type TryOnGroupLike = Pick<ItemGroupInterface, 'tryOn'> | null | undefined;

/** Фрагмент товара для проверки наличия try-on изображения */
type TryOnItemImagesLike = {
  hasTryOnImage?: boolean;
  images?: {
    tryOn?: boolean;
    src: string;
  }[];
};

/**
 * Определяет, есть ли у товара растровое изображение для AI-примерки
 * @param item - товар с SSR-флагом hasTryOnImage и/или списком images
 * @returns true, если есть try-on изображение
 */
export const resolveHasTryOnImage = (item: TryOnItemImagesLike): boolean => {
  if (!isNil(item.hasTryOnImage)) {
    return item.hasTryOnImage;
  }

  return item.images?.some((image) => image.tryOn && isRasterProductImageSrc(image.src)) ?? false;
};

/**
 * Проверяет, доступна ли AI-примерка для группы каталога
 * @param group - группа товара с конфигом tryOn
 * @returns true, если примерка включена и задан тип VTO
 */
export const isTryOnEnabledForGroup = (group?: TryOnGroupLike): boolean => {
  if (isNil(group?.tryOn)) {
    return false;
  }

  const { isEnabled, vtoType } = group.tryOn;

  return Boolean(isEnabled) && !isNil(vtoType);
};

/**
 * Возвращает тип VTO из конфига группы
 * @param group - группа товара с конфигом tryOn
 * @returns тип VTO или null
 */
export const getTryOnVtoTypeForGroup = (group?: TryOnGroupLike): AiTryOnVtoTypeEnum | null => {
  if (isNil(group?.tryOn)) {
    return null;
  }

  const { isEnabled, vtoType } = group.tryOn;

  if (!isEnabled || isNil(vtoType)) {
    return null;
  }

  return vtoType;
};

/**
 * Возвращает ключ инструкции примерки по типу VTO
 * @param vtoType - тип AI-примерки
 * @returns ключ i18n или null
 */
export const getTryOnInstructionKeyFromVtoType = (vtoType?: AiTryOnVtoTypeEnum | null): TryOnInstructionKey | null => {
  if (isNil(vtoType)) {
    return null;
  }

  switch (vtoType) {
  case AiTryOnVtoTypeEnum.NECKLACE:
    return 'necklace';
  case AiTryOnVtoTypeEnum.EARRING:
    return 'earring';
  default:
    return null;
  }
};
