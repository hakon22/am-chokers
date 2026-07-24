import path from 'path';

import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';
import { catalogPath, routes } from '@/routes';
import type { ItemEntity } from '@server/db/entities/item.entity';

export interface TelegramPublishPayloadInterface {
  message: string[];
  images: string[];
}

/**
 * Формирует URL товара на сайте для Telegram-публикации
 * @param item - товар с группой и slug
 * @returns относительный путь страницы товара
 */
export const getItemUrlForTelegramPublish = (item: Pick<ItemEntity, 'group' | 'translateName'>): string => path
  .join(routes.page.base.homePage, catalogPath.slice(1), item.group.code, item.translateName)
  .replaceAll('\\', '/');

/**
 * Собирает текст и каталожные фото (без try_on) для публикации товара в Telegram
 * @param item - товар с переводами, ценой, коллекцией и изображениями
 * @param description - кастомное описание; иначе RU-описание из переводов
 * @returns текст сообщения и абсолютные URL изображений
 */
export const buildTelegramPublishPayload = (item: ItemEntity, description?: string): TelegramPublishPayloadInterface => {
  const url = getItemUrlForTelegramPublish(item);
  const values: string[] = (description || item.translations.find(({ lang }) => lang === UserLangEnum.RU)?.description as string).split('\n');

  const message = [
    ...values,
    '',
    ...(item?.collection ? [`Коллекция: <b>${item.collection.translations.find(({ lang }) => lang === UserLangEnum.RU)?.name}</b>`] : []),
    `Цена: <b>${item.price - item.discountPrice} ₽</b>`,
    '',
    `${process.env.NEXT_PUBLIC_PRODUCTION_HOST}${url}`,
  ];

  const images = item.images
    .filter(({ tryOn }) => !tryOn)
    .map(({ src }) => `${process.env.NEXT_PUBLIC_PRODUCTION_HOST}${src}`);

  return { message, images };
};
