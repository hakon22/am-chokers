import { writeFileSync } from 'fs';
import { join } from 'path';

import { Container, Singleton } from 'typescript-ioc';
import type { EntityManager } from 'typeorm';

import { LoggerService } from '@server/services/app/logger.service';
import { DatabaseService } from '@server/db/database.service';
import { UploadPathService } from '@server/services/storage/upload.path.service';
import { getProductionHost } from '@/utilities/getProductionHost';

interface SitemapImageRowInterface {
  itemId: number;
  itemName: string;
  groupCode: string;
  translateName: string;
  imagePath: string;
  imageName: string;
}

interface SitemapImageItemGroupInterface {
  itemId: number;
  itemName: string;
  groupCode: string;
  translateName: string;
  images: { loc: string; title: string; }[];
}

/**
 * Экранирует специальные XML-символы в тексте
 * @param unsafe - исходная строка
 * @returns безопасная для XML строка
 */
const escapeXml = (unsafe: string): string => unsafe.replace(/[<>&'"]/g, (character) => {
  switch (character) {
  case '<': {
    return '&lt;';
  }
  case '>': {
    return '&gt;';
  }
  case '&': {
    return '&amp;';
  }
  case '\'': {
    return '&apos;';
  }
  case '"': {
    return '&quot;';
  }
  default: {
    return character;
  }
  }
});

/**
 * Генерирует XML image sitemap из строк БД
 * @param itemGroups - сгруппированные товары с изображениями
 * @param productionHost - базовый URL сайта
 * @returns XML-документ
 */
export const buildImageSitemapXml = (itemGroups: SitemapImageItemGroupInterface[], productionHost: string): string => {
  const urlEntries = itemGroups.map((itemGroup) => {
    const productUrl = `${productionHost}/catalog/${itemGroup.groupCode}/${itemGroup.translateName}`;
    const imageEntries = itemGroup.images.map((image) => `
    <image:image>
      <image:loc>${escapeXml(image.loc)}</image:loc>
      <image:title>${escapeXml(image.title)}</image:title>
    </image:image>`).join('');

    return `
  <url>
    <loc>${escapeXml(productUrl)}</loc>${imageEntries}
  </url>`;
  }).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">${urlEntries}
</urlset>`;
};

@Singleton
export class SitemapImageService {
  private readonly TAG = 'SitemapImageService';

  private readonly loggerService = Container.get(LoggerService);

  private readonly databaseService = Container.get(DatabaseService);

  private readonly uploadPathService = Container.get(UploadPathService);

  /**
   * Пересобирает public/sitemap-images.xml из данных БД
   */
  public rebuildImageSitemap = async (): Promise<void> => {
    const manager = this.databaseService.getManager();
    const productionHost = getProductionHost();
    const rows = await this.fetchImageSitemapRows(manager);
    const groupedItems = this.groupImageRows(rows, productionHost);
    const xmlContent = buildImageSitemapXml(groupedItems, productionHost);
    const outputPath = join(this.uploadPathService.uploadFilesPath, 'sitemap-images.xml');

    writeFileSync(outputPath, xmlContent, { encoding: 'utf8' });
    this.loggerService.info(this.TAG, `Image sitemap записан: ${outputPath}`);
  };

  /**
   * Загружает опубликованные товары и изображения из БД
   * @param manager - менеджер TypeORM
   * @returns плоский список строк
   */
  private fetchImageSitemapRows = async (manager: EntityManager): Promise<SitemapImageRowInterface[]> => manager.query(`
    SELECT
      "item"."id" AS "itemId",
      "translate"."name" AS "itemName",
      "item_group"."code" AS "groupCode",
      "item"."translate_name" AS "translateName",
      "image"."path" AS "imagePath",
      "image"."name" AS "imageName"
    FROM "chokers"."item"
      INNER JOIN "chokers"."item_translate" AS "translate" ON "item"."id" = "translate"."item_id"
      INNER JOIN "chokers"."item_group" ON "item_group"."id" = "item"."group_id"
      INNER JOIN "chokers"."image" ON "image"."item_id" = "item"."id"
    WHERE
      "item"."deleted" IS NULL
      AND "item"."publication_date" IS NULL
      AND "item_group"."deleted" IS NULL
      AND "image"."deleted" IS NULL
      AND "image"."name" NOT ILIKE '%.mp4'
      AND "translate"."lang" = 'RU'
    ORDER BY
      "item"."id" ASC,
      "image"."order" ASC
  `) as Promise<SitemapImageRowInterface[]>;

  /**
   * Группирует строки по товару
   * @param rows - строки из БД
   * @param productionHost - базовый URL сайта
   * @returns сгруппированные товары
   */
  private groupImageRows = (rows: SitemapImageRowInterface[], productionHost: string): SitemapImageItemGroupInterface[] => {
    const itemsById = new Map<number, SitemapImageItemGroupInterface>();

    rows.forEach((row) => {
      const {
        itemId, itemName, groupCode, translateName, imagePath, imageName,
      } = row;

      if (!itemsById.has(itemId)) {
        itemsById.set(itemId, {
          itemId,
          itemName,
          groupCode,
          translateName,
          images: [],
        });
      }

      const itemEntry = itemsById.get(itemId);
      if (itemEntry) {
        itemEntry.images.push({
          loc: `${productionHost}${imagePath}/${imageName}`,
          title: itemName,
        });
      }
    });

    return [...itemsById.values()];
  };
}
