import _ from 'lodash';
import { Singleton } from 'typescript-ioc';

import { isRasterProductImageSrc } from '@/utilities/getFirstRasterProductImageSrc';
import type { ImageEntity } from '@server/db/entities/image.entity';
import type { ItemEntity } from '@server/db/entities/item.entity';

export interface ProductReferenceImagesInterface {
  primary: ImageEntity;
  refs: ImageEntity[];
}

@Singleton
export class TryOnProductImageSelectorService {
  /**
   * Отбирает единственное try_on фото товара для validation и generation
   * @param item - товар с загруженными images
   * @returns primary и refs[] из одного элемента
   */
  public selectProductReferenceImages = (item: ItemEntity): ProductReferenceImagesInterface => {
    const tryOnImage = item.images?.find((image) => image.tryOn
      && _.isNil(image.deleted)
      && isRasterProductImageSrc(image.src));

    if (_.isNil(tryOnImage)) {
      throw new Error(`Item ${item.id} has no try-on raster image`);
    }

    return { primary: tryOnImage, refs: [tryOnImage] };
  };
}
