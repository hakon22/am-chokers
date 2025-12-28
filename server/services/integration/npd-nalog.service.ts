import { Container, Singleton } from 'typescript-ioc';
import lknpdNalogApi from 'lknpd-nalog-api';

import { BaseService } from '@server/services/app/base.service';
import { BullMQQueuesService } from '@microservices/sender/queues/bull-mq-queues.service';
import { OrderService } from '@server/services/order/order.service';
import { OrderEntity } from '@server/db/entities/order.entity';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';
import type { NpdNalogOrderInterface } from '@server/types/integration/npd-nalog/npd-nalog-order.interface';

@Singleton
export class NpdNalogService extends BaseService {
  private readonly TAG = 'NPD Nalog Service';

  private readonly bullMQQueuesService = Container.get(BullMQQueuesService);

  private readonly orderService = Container.get(OrderService);

  public getInstance = async () => {
    return new lknpdNalogApi.NalogApi({ inn: process.env.NEXT_PUBLIC_INN, password: process.env.LK_NALOG_PASSWORD });
  };

  public addIncome = async (payload: NpdNalogOrderInterface) => {
    const { order, items } = payload;
    try {
      const instance = await this.getInstance();
      const receiptId = await instance.addIncome(items);

      if (receiptId) {
        await OrderEntity
          .createQueryBuilder('order')
          .update()
          .set({ receiptId })
          .where('"order"."id" = :orderId', { orderId: order.id })
          .execute();
      }

      const newOrder = await this.orderService.findOne({ id: order.id }, UserLangEnum.RU);

      this.bullMQQueuesService.sendSMSReceipt({
        phone: newOrder.user.phone,
        lang: newOrder.user.lang,
        receipt: newOrder.receiptUrl,
      });
    } catch (e) {
      const messageRu = `Не удалось создать чек по заказу №${order.id}: ${JSON.stringify(e)}`;
      this.bullMQQueuesService.sendTelegramAdminMessage({
        messageRu,
        messageEn: `Failed to create receipt for order #${order.id}: ${JSON.stringify(e)}`,
      });
      this.loggerService.error(this.TAG, messageRu, e);
      throw new Error(messageRu);
    }
  };
}
