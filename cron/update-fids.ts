import { writeFileSync } from 'fs';

import _ from 'lodash';
import { Container } from 'typescript-ioc';
import XLSX from 'xlsx';
import 'dotenv/config';
import type { EntityManager } from 'typeorm';

import { LoggerService } from '@server/services/app/logger.service';
import { DatabaseService } from '@server/db/database.service';
import { UploadPathService } from '@server/services/storage/upload.path.service';
import { SitemapImageService } from '@server/services/storage/sitemap-image.service';
import { DEFAULT_SHIPPING_RATE_RUB } from '@shared/delivery-config';

const TAG = 'UpdateFids';

interface YandexFidInterface {
  ID: number;
  Title: string;
  Description: string;
  Price: number;
  Currency: string;
  URL: string;
  Image: string;
}

interface GoogleFidInterface {
  id: number;
  title: string;
  description: string;
  price: number;
  condition: 'new';
  link: string;
  availability: 'in_stock';
  image_link: string;
}

interface YandexProductsCategoryInterface {
  id: number;
  name: string;
}

interface YandexProductsOfferRowInterface {
  id: number;
  name: string;
  description: string;
  price: number;
  discountPrice: number;
  outStock: Date | null;
  categoryId: number;
  groupCode: string;
  translateName: string;
}

interface YandexProductsImageRowInterface {
  itemId: number;
  path: string;
  name: string;
}

interface YandexProductsParamRowInterface {
  itemId: number;
  paramName: string;
  value: string;
}

interface YandexProductsParamInterface {
  name: string;
  value: string;
}

interface YandexProductsOfferInterface {
  id: number;
  name: string;
  description: string;
  url: string;
  price: number;
  oldPrice: number | null;
  categoryId: number;
  available: boolean;
  pictures: string[];
  params: YandexProductsParamInterface[];
}

interface YandexProductsDataInterface {
  categories: YandexProductsCategoryInterface[];
  offers: YandexProductsOfferInterface[];
}

/** Обновляет файлы фидов для Яндекс Директа, Google Merchant, Яндекс Вебмастера и Яндекс Товаров */
class UpdateFidsCron {

  private static readonly SHOP_NAME = 'AM Chokers';

  private static readonly VENDOR_NAME = 'AM Chokers';

  private static readonly ROOT_FEED_CATEGORY_ID = 1000;

  private static readonly ROOT_CATEGORY_NAME = 'Украшения';

  private static readonly DELIVERY_DAYS = '2-7';

  private static readonly DELIVERY_ORDER_BEFORE = 18;

  public readonly loggerService = Container.get(LoggerService);

  private readonly databaseService = Container.get(DatabaseService);

  private readonly uploadPathService = Container.get(UploadPathService);

  private readonly sitemapImageService = Container.get(SitemapImageService);

  public start = async () => {

    await this.databaseService.init();

    this.loggerService.info(TAG, 'Процесс запущен');

    const manager = this.databaseService.getManager();

    const data: YandexFidInterface[] = await manager.query(`
      SELECT
        "item"."id" AS "ID",
        "translate"."name" AS "Title",
        "translate"."description" AS "Description",
        TO_CHAR(("price" - "discount_price"), 'FM999999999.00') AS "Price",
        'RUB' AS "Currency",
        CONCAT(
          'https://amchokers.ru/catalog/',
          "group"."code",
          '/',
          "translate_name"
        ) AS "URL",
        CONCAT(
          'https://amchokers.ru',
          "image"."path",
          '/',
          "image"."name"
        ) AS "Image"
      FROM "chokers"."item"
        LEFT JOIN "chokers"."item_translate" AS "translate" ON "item"."id" = "translate"."item_id"
        LEFT JOIN "chokers"."item_group" AS "group" ON "group"."id" = "group_id"
        LEFT JOIN LATERAL (
          SELECT "path", "name"
          FROM "chokers"."image"
          WHERE "item_id" = "item"."id"
            AND "deleted" IS NULL
            AND "name" NOT ILIKE '%.mp4'
          ORDER BY "order" ASC
          LIMIT 1
        ) AS "image" ON TRUE
      WHERE
        "item"."deleted" IS NULL
        AND "item"."publication_date" IS NULL
        AND "translate"."lang" = 'RU'
      ORDER BY
        "item"."id" ASC
    `);

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();

    worksheet['!cols'] = [
      { wpx: 30 },
      { wpx: 250 },
      { wpx: 400 },
      { wpx: 50 },
      { wpx: 50 },
      { wpx: 400 },
      { wpx: 400 },
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Лист1');

    const csvBuffer = XLSX.write(workbook, {
      bookType: 'csv',
      type: 'buffer',
    });

    writeFileSync(`${this.uploadPathService.uploadFilesPath}/yandex_fid.csv`, csvBuffer, { encoding: 'utf8' });

    const googleData: GoogleFidInterface[] = data.map(({ ID, Title, Description, Price, URL, Image }) => ({
      id: ID,
      title: Title,
      description: Description,
      price: Math.round(Price),
      condition: 'new',
      link: URL,
      availability: 'in_stock',
      image_link: Image,
    }));

    const worksheet2 = XLSX.utils.json_to_sheet(googleData);
    const range = XLSX.utils.decode_range(worksheet2['!ref'] as string);

    const rows: string[] = [];

    for (let rowNum = range.s.r; rowNum <= range.e.r; rowNum += 1) {
      const row: string[] = [];
      for (let colNum = range.s.c; colNum <= range.e.c; colNum += 1) {
        const cell = worksheet2[XLSX.utils.encode_cell({ r: rowNum, c: colNum })];
        row.push(cell ? cell.v : '');
      }
      rows.push(row.join('~'));
    }

    const output = rows.join('\n');
    writeFileSync(`${this.uploadPathService.uploadFilesPath}/google_fid.txt`, output, { encoding: 'utf8' });

    const ymlContent = this.generateYmlContent(data);
    writeFileSync(`${this.uploadPathService.uploadFilesPath}/yandex_webmaster.xml`, ymlContent, { encoding: 'utf8' });

    const yandexProductsData = await this.fetchYandexProductsData(manager);
    const yandexProductsContent = this.generateYandexProductsYmlContent(yandexProductsData);
    writeFileSync(`${this.uploadPathService.uploadFilesPath}/yandex_products.xml`, yandexProductsContent, { encoding: 'utf8' });

    await this.sitemapImageService.rebuildImageSitemap();

    this.loggerService.info(TAG, 'Процесс завершён');

    process.exit(0);
  };

  /**
   * Загружает данные для фида Яндекс Товаров из базы данных
   * @param manager - менеджер подключения TypeORM
   * @returns категории и предложения для YML-фида
   */
  private fetchYandexProductsData = async (manager: EntityManager): Promise<YandexProductsDataInterface> => {
    const productionHost = process.env.NEXT_PUBLIC_PRODUCTION_HOST ?? 'https://amchokers.ru';

    const [
      categories,
      offerRows,
      imageRows,
      colorParamRows,
      compositionParamRows,
    ] = await Promise.all([
      manager.query(`
        SELECT
          "item_group"."id" AS "id",
          "item_group_translate"."name" AS "name"
        FROM "chokers"."item_group"
          INNER JOIN "chokers"."item_group_translate"
            ON "item_group_translate"."group_id" = "item_group"."id"
        WHERE
          "item_group"."deleted" IS NULL
          AND "item_group_translate"."lang" = 'RU'
        ORDER BY
          "item_group"."order" ASC,
          "item_group"."id" ASC
      `) as Promise<YandexProductsCategoryInterface[]>,
      manager.query(`
        SELECT
          "item"."id" AS "id",
          "translate"."name" AS "name",
          "translate"."description" AS "description",
          "item"."price" AS "price",
          "item"."discount_price" AS "discountPrice",
          "item"."out_stock" AS "outStock",
          "item_group"."id" AS "categoryId",
          "item_group"."code" AS "groupCode",
          "item"."translate_name" AS "translateName"
        FROM "chokers"."item"
          INNER JOIN "chokers"."item_translate" AS "translate" ON "item"."id" = "translate"."item_id"
          INNER JOIN "chokers"."item_group" ON "item_group"."id" = "item"."group_id"
        WHERE
          "item"."deleted" IS NULL
          AND "item"."publication_date" IS NULL
          AND "item_group"."deleted" IS NULL
          AND "translate"."lang" = 'RU'
        ORDER BY
          "item"."id" ASC
      `) as Promise<YandexProductsOfferRowInterface[]>,
      manager.query(`
        SELECT
          "image"."item_id" AS "itemId",
          "image"."path" AS "path",
          "image"."name" AS "name"
        FROM "chokers"."image"
          INNER JOIN "chokers"."item" ON "item"."id" = "image"."item_id"
        WHERE
          "image"."deleted" IS NULL
          AND "image"."name" NOT ILIKE '%.mp4'
          AND "item"."deleted" IS NULL
          AND "item"."publication_date" IS NULL
        ORDER BY
          "image"."item_id" ASC,
          "image"."order" ASC
      `) as Promise<YandexProductsImageRowInterface[]>,
      manager.query(`
        SELECT
          "item_color"."item_id" AS "itemId",
          'Цвет' AS "paramName",
          "color_translate"."name" AS "value"
        FROM "chokers"."item_color"
          INNER JOIN "chokers"."color_translate"
            ON "color_translate"."color_id" = "item_color"."color_id"
          INNER JOIN "chokers"."item" ON "item"."id" = "item_color"."item_id"
        WHERE
          "color_translate"."lang" = 'RU'
          AND "item"."deleted" IS NULL
          AND "item"."publication_date" IS NULL
      `) as Promise<YandexProductsParamRowInterface[]>,
      manager.query(`
        SELECT
          "item_composition"."item_id" AS "itemId",
          'Материал' AS "paramName",
          "composition_translate"."name" AS "value"
        FROM "chokers"."item_composition"
          INNER JOIN "chokers"."composition_translate"
            ON "composition_translate"."composition_id" = "item_composition"."composition_id"
          INNER JOIN "chokers"."item" ON "item"."id" = "item_composition"."item_id"
        WHERE
          "composition_translate"."lang" = 'RU'
          AND "item"."deleted" IS NULL
          AND "item"."publication_date" IS NULL
      `) as Promise<YandexProductsParamRowInterface[]>,
    ]);

    const picturesByItemId = this.buildPicturesMap(imageRows, productionHost);
    const paramsByItemId = this.buildParamsMap([...colorParamRows, ...compositionParamRows]);

    const offers = offerRows.map((offerRow) => {
      const {
        id,
        name,
        description,
        price,
        discountPrice,
        outStock,
        categoryId,
        groupCode,
        translateName,
      } = offerRow;

      const finalPrice = price - discountPrice;
      const oldPrice = discountPrice > 0 ? price : null;

      return {
        id,
        name,
        description,
        url: `${productionHost}/catalog/${groupCode}/${translateName}`,
        price: finalPrice,
        oldPrice,
        categoryId,
        available: _.isNil(outStock),
        pictures: picturesByItemId[id] ?? [],
        params: paramsByItemId[id] ?? [],
      };
    });

    return {
      categories,
      offers,
    };
  };

  /**
   * Собирает карту URL изображений по идентификатору товара
   * @param imageRows - строки изображений из базы данных
   * @param productionHost - базовый URL сайта
   * @returns карта itemId → массив URL изображений
   */
  private buildPicturesMap = (imageRows: YandexProductsImageRowInterface[], productionHost: string): Record<number, string[]> => {
    const picturesByItemId: Record<number, string[]> = {};

    imageRows.forEach(({ itemId, path, name }) => {
      if (!picturesByItemId[itemId]) {
        picturesByItemId[itemId] = [];
      }

      picturesByItemId[itemId].push(`${productionHost}${path}/${name}`);
    });

    return picturesByItemId;
  };

  /**
   * Собирает карту параметров товара по идентификатору
   * @param paramRows - строки параметров из базы данных
   * @returns карта itemId → массив параметров
   */
  private buildParamsMap = (paramRows: YandexProductsParamRowInterface[]): Record<number, YandexProductsParamInterface[]> => {
    const paramsByItemId: Record<number, YandexProductsParamInterface[]> = {};

    paramRows.forEach(({ itemId, paramName, value }) => {
      if (!paramsByItemId[itemId]) {
        paramsByItemId[itemId] = [];
      }

      paramsByItemId[itemId].push({
        name: paramName,
        value,
      });
    });

    return paramsByItemId;
  };

  /**
   * Формирует YML-контент для Яндекс Вебмастера
   * @param data - данные товаров для фида
   * @returns XML-строка YML-каталога
   */
  private generateYmlContent = (data: YandexFidInterface[]) => {
    const date = new Date().toISOString();

    let yml = `<?xml version="1.0" encoding="UTF-8"?>
<yml_catalog date="${date}">
  <shop>
    <name>AM Chokers</name>
    <company>AM Chokers</company>
    <url>https://amchokers.ru</url>
    <currencies>
      <currency id="RUR" rate="1"/>
    </currencies>
    <categories>
      <category id="1">Украшения</category>
    </categories>
    <offers>
`;

    data.forEach(item => {
      yml += `      <offer id="${item.ID}" available="true">
        <url>${this.escapeXml(item.URL)}</url>
        <price>${item.Price}</price>
        <currencyId>RUR</currencyId>
        <categoryId>1</categoryId>
        <picture>${this.escapeXml(item.Image)}</picture>
        <name>${this.escapeXml(item.Title)}</name>
        <description>${this.escapeXml(item.Description)}</description>
      </offer>
`;
    });

    yml += `    </offers>
  </shop>
</yml_catalog>`;

    return yml;
  };

  /**
   * Формирует YML-контент для Яндекс Товаров
   * @param yandexProductsData - категории и предложения для фида
   * @returns XML-строка YML-каталога
   */
  private generateYandexProductsYmlContent = (yandexProductsData: YandexProductsDataInterface): string => {
    const { categories, offers } = yandexProductsData;
    const productionHost = process.env.NEXT_PUBLIC_PRODUCTION_HOST ?? 'https://amchokers.ru';
    const date = new Date().toISOString();

    let yml = `<?xml version="1.0" encoding="UTF-8"?>
<yml_catalog date="${date}">
  <shop>
    <name>${this.escapeXml(UpdateFidsCron.SHOP_NAME)}</name>
    <company>${this.escapeXml(UpdateFidsCron.SHOP_NAME)}</company>
    <url>${this.escapeXml(productionHost)}</url>
    <currencies>
      <currency id="RUR" rate="1"/>
    </currencies>
    <delivery>true</delivery>
    <delivery-options>
      <option cost="${DEFAULT_SHIPPING_RATE_RUB}" days="${UpdateFidsCron.DELIVERY_DAYS}" order-before="${UpdateFidsCron.DELIVERY_ORDER_BEFORE}"/>
    </delivery-options>
    <categories>
      <category id="${UpdateFidsCron.ROOT_FEED_CATEGORY_ID}">${this.escapeXml(UpdateFidsCron.ROOT_CATEGORY_NAME)}</category>
`;

    categories.forEach(({ id, name }) => {
      yml += `      <category id="${id}" parentId="${UpdateFidsCron.ROOT_FEED_CATEGORY_ID}">${this.escapeXml(name)}</category>
`;
    });

    yml += `    </categories>
    <offers>
`;

    offers.forEach((offer) => {
      const {
        id,
        name,
        description,
        url,
        price,
        oldPrice,
        categoryId,
        available,
        pictures,
        params,
      } = offer;

      yml += `      <offer id="${id}" available="${available}">
        <name>${this.escapeXml(name)}</name>
        <vendor>${this.escapeXml(UpdateFidsCron.VENDOR_NAME)}</vendor>
        <vendorCode>${id}</vendorCode>
        <url>${this.escapeXml(url)}</url>
        <price>${price}</price>
`;

      if (oldPrice !== null && oldPrice > price) {
        yml += `        <oldprice>${oldPrice}</oldprice>
`;
      }

      yml += `        <currencyId>RUR</currencyId>
        <categoryId>${categoryId}</categoryId>
`;

      pictures.forEach((picture) => {
        yml += `        <picture>${this.escapeXml(picture)}</picture>
`;
      });

      yml += `        <description><![CDATA[${this.escapeCdata(description)}]]></description>
`;

      params.forEach(({ name: paramName, value }) => {
        yml += `        <param name="${this.escapeXml(paramName)}">${this.escapeXml(value)}</param>
`;
      });

      yml += `        <delivery>true</delivery>
      </offer>
`;
    });

    yml += `    </offers>
  </shop>
</yml_catalog>`;

    return yml;
  };

  /**
   * Экранирует специальные XML-символы в тексте
   * @param unsafe - исходная строка
   * @returns безопасная для XML строка
   */
  private escapeXml = (unsafe: string) => {
    return unsafe.replace(/[<>&'"]/g, (character) => {
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
  };

  /**
   * Экранирует закрывающую последовательность CDATA внутри описания
   * @param unsafe - исходная строка описания
   * @returns безопасная для CDATA строка
   */
  private escapeCdata = (unsafe: string): string => {
    return unsafe.replace(/]]>/g, ']]&gt;');
  };
}

const cron = new UpdateFidsCron();

await cron.start().catch((error) => {
  cron.loggerService.error(TAG, error);
  process.exit(0);
});
