import { writeFileSync } from 'fs';

import { Container } from 'typescript-ioc';
import XLSX from 'xlsx';
import 'dotenv/config';

import { LoggerService } from '@server/services/app/logger.service';
import { DatabaseService } from '@server/db/database.service'; 
import { UploadPathService } from '@server/services/storage/upload.path.service';

const TAG = 'UpdateFids';

interface YandexFidInterface {
  ID: number;
  Title: number;
  Description: string;
  Price: number;
  Currency: string;
  URL: string;
  Image: string;
}

interface GoogleFidInterface {
  id: number;
  title: number;
  description: string;
  price: number;
  condition: 'new';
  link: string;
  availability: 'in_stock';
  image_link: string;
}

/** Обновляет файлы фидов, которые используется в Яндекс Директе и Google Merchant */
class UpdateFidsCron {

  public readonly loggerService = Container.get(LoggerService);

  private readonly databaseService = Container.get(DatabaseService);

  private readonly uploadPathService = Container.get(UploadPathService);

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
        LEFT JOIN "chokers"."image" AS "image" ON "image"."item_id" = "item"."id"
      WHERE
        "item"."deleted" IS NULL
        AND "image"."deleted" IS NULL
        AND "image"."order" = 0
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

    this.loggerService.info(TAG, 'Процесс завершён');

    process.exit(0);
  };
}

const cron = new UpdateFidsCron();

await cron.start().catch((e) => {
  cron.loggerService.error(TAG, e);
  process.exit(0);
});
