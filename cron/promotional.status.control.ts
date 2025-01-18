import moment from 'moment';
import { Container } from 'typescript-ioc';
import 'dotenv/config';

import { PromotionalEntity } from '@server/db/entities/promotional.entity'; 
import { LoggerService } from '@server/services/app/logger.service';
import { DatabaseService } from '@server/db/database.service'; 

const TAG = 'PromotionalStatusControl';

/** Меняет статусы промокодов, если срок действия попадает под условия */
class PromotionalStatusControlCron {

  public loggerService = Container.get(LoggerService);

  private readonly databaseService = Container.get(DatabaseService);

  public start = async () => {

    await this.databaseService.init();

    this.loggerService.info(TAG, 'Процесс запущен');

    const now = moment();
    this.loggerService.info(TAG, `Текущее время: ${now.format()}`);

    const promotionals = await PromotionalEntity.find();

    const { plannedPromotionals, shownPromotionals } = promotionals.reduce((acc, promotional) => {
      if (now.isBetween(moment(promotional.start), moment(promotional.end), 'day', '[]') && !promotional.active) {
        promotional.active = true;
        acc.plannedPromotionals.push(promotional);
      } else if (!now.isBetween(moment(promotional.start), moment(promotional.end), 'day', '[]') && promotional.active) {
        promotional.active = false;
        acc.shownPromotionals.push(promotional);
      }
      return acc;
    }, { plannedPromotionals: [], shownPromotionals: [] } as { plannedPromotionals: PromotionalEntity[]; shownPromotionals: PromotionalEntity[]; });

    this.loggerService.info(TAG, `Истёкших промокодов: ${shownPromotionals.length} (${shownPromotionals.map(({ name }) => name).join(', ')})`);
    this.loggerService.info(TAG, `Подлежит активации промокодов: ${plannedPromotionals.length} (${plannedPromotionals.map(({ name }) => name).join(', ')})`);

    await PromotionalEntity.save([...plannedPromotionals, ...shownPromotionals]);

    this.loggerService.info(TAG, 'Процесс завершён');

    process.exit(0);
  };
}

const cron = new PromotionalStatusControlCron();

await cron.start().catch((e) => {
  cron.loggerService.error(TAG, e);
  process.exit(0);
});
