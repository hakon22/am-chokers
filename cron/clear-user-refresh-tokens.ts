import { Container } from 'typescript-ioc';
import 'dotenv/config';

import { UserEntity } from '@server/db/entities/user.entity'; 
import { LoggerService } from '@server/services/app/logger.service';
import { DatabaseService } from '@server/db/database.service';

const TAG = 'ClearUserRefreshTokens';

/** Очистка старых токенов (оставляет 50 последних) */
class ClearUserRefreshTokensCron {

  public readonly loggerService = Container.get(LoggerService);

  private readonly databaseService = Container.get(DatabaseService);

  public start = async () => {

    await this.databaseService.init();

    this.loggerService.info(TAG, 'Процесс запущен');

    const [{ count }] = await UserEntity.query(`
        SELECT COUNT("id") 
        FROM "chokers"."user_refresh_token"
        WHERE "id" NOT IN (
          SELECT "id" FROM (
            SELECT 
              "id",
              ROW_NUMBER() OVER (
                PARTITION BY "user_id" 
                ORDER BY "created" DESC
              ) as "row_num"
            FROM "chokers"."user_refresh_token"
          ) "ranked"
          WHERE "row_num" <= 50
        )
    `);

    if (!count) {
      this.loggerService.info(TAG, 'Нет токенов для удаления');
      process.exit(0);
    }

    await UserEntity.query(`
      DELETE FROM "chokers"."user_refresh_token"
        WHERE "id" NOT IN (
          SELECT "id" FROM (
            SELECT 
              "id",
              ROW_NUMBER() OVER (
                PARTITION BY "user_id" 
                ORDER BY "created" DESC
              ) as "row_num"
            FROM "chokers"."user_refresh_token"
          ) "ranked"
          WHERE "row_num" <= 50
        )
    `);

    this.loggerService.info(TAG, `Удалено токенов: ${count}`);

    this.loggerService.info(TAG, 'Процесс завершён');

    process.exit(0);
  };
}

const cron = new ClearUserRefreshTokensCron();

await cron.start().catch((e) => {
  cron.loggerService.error(TAG, e);
  process.exit(0);
});
