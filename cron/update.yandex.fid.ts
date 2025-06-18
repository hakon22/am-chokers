import { Container } from 'typescript-ioc';
import XLSX from 'xlsx';
import 'dotenv/config';

import { LoggerService } from '@server/services/app/logger.service';
import { DatabaseService } from '@server/db/database.service'; 
import { UploadPathService } from '@server/services/storage/upload.path.service';

const TAG = 'UpdateYandexFid';

interface YandexFidInterface {
  ID: number;
  Title: number;
  Description: string;
  Price: number;
  Currency: string;
  URL: string;
  Image: string;
}

/** Обновляет файл фида, который используется в Яндекс Директе */
class UpdateYandexFidCron {

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
        "item"."name" AS "Title",
        "item"."description" AS "Description",
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
        LEFT JOIN "chokers"."item_group" AS "group" ON "group"."id" = "group_id"
        LEFT JOIN "chokers"."image" AS "image" ON "image"."item_id" = "item"."id"
      WHERE
        "item"."deleted" IS NULL
        AND "image"."deleted" IS NULL
        AND "image"."order" = 0
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

    XLSX.writeFile(workbook, `${this.uploadPathService.uploadFilesPath}/yandex_fid.xlsx`);

    this.loggerService.info(TAG, 'Процесс завершён');

    process.exit(0);
  };
}

const cron = new UpdateYandexFidCron();

await cron.start().catch((e) => {
  cron.loggerService.error(TAG, e);
  process.exit(0);
});
