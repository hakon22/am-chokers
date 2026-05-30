import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';
import type { ItemInterface } from '@/types/item/Item';

/**
 * Собирает alt для фото товара по группе и составу (локализация RU)
 * @param item - товар с group.translations и compositions.translations
 * @returns строка вида «Колье ручной работы из жемчуг, корал»
 */
export const buildItemImageAlt = (item: Pick<ItemInterface, 'group' | 'compositions'>): string => {
  const groupTranslation = item.group?.translations?.find((translation) => translation.lang === UserLangEnum.RU);
  const groupName = groupTranslation?.name?.trim() ?? '';

  const compositionNames = (item.compositions ?? [])
    .map((composition) => {
      const compositionTranslation = composition.translations?.find((translation) => translation.lang === UserLangEnum.RU);
      return compositionTranslation?.name?.trim() ?? '';
    })
    .filter(Boolean);

  return `${groupName} ручной работы из ${compositionNames.join(', ').trim()}`;
};
