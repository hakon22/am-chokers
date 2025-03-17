import { Container, Singleton } from 'typescript-ioc';

import { DeliveryCredentialsEntity } from '@server/db/entities/delivery.credentials.entity';
import { BaseService } from '@server/services/app/base.service';
import { YandexService } from '@server/services/delivery/yandex.service';
import { DeliveryTypeEnum } from '@server/types/delivery/enums/delivery.type.enum';
import type { DeliveryOptionsInterface } from '@server/types/delivery/delivery.options.interface';
import type { ParamsIdInterface } from '@server/types/params.id.interface';
import type { OrderEntity } from '@server/db/entities/order.entity';

@Singleton
export class DeliveryService extends BaseService {

  private readonly yandexService = Container.get(YandexService);

  private createQueryBuilder = (query?: DeliveryOptionsInterface) => {
    const manager = query?.manager || this.databaseService.getManager();

    const builder = manager.createQueryBuilder(DeliveryCredentialsEntity, 'delivery')
      .select([
        'delivery.id',
        'delivery.name',
        'delivery.type',
        'delivery.password',
        'delivery.isDevelopment',
      ]);

    if (query?.withCredentials) {
      builder.addSelect([
        'delivery.login',
        'delivery.url',
      ]);
    }
    if (query?.withDeleted) {
      builder.withDeleted();
    }
    if (query?.type) {
      builder.andWhere('delivery.type = :type', { type: query.type });
    }
    if (query?.isDevelopment) {
      builder.andWhere('delivery.isDevelopment = :isDevelopment', { isDevelopment: query.isDevelopment });
    }

    return builder;
  };

  public findOne = async (params: ParamsIdInterface, query?: DeliveryOptionsInterface) => {
    const builder = this.createQueryBuilder(query)
      .andWhere('delivery.id = :id', { id: params.id });

    const delivery = await builder.getOne();

    if (!delivery) {
      throw new Error(`Службы доставки с номером #${params.id} не существует.`);
    }

    return delivery;
  };

  public findOneByType = async (type: DeliveryOptionsInterface['type'], isDevelopment: DeliveryOptionsInterface['isDevelopment'], query?: DeliveryOptionsInterface) => {
    if (!type) {
      throw new Error('Не указан тип службы доставки');
    }
    const builder = this.createQueryBuilder({ type, isDevelopment, ...query });

    const delivery = await builder.getOne();

    if (!delivery) {
      throw new Error(`Службы доставки с типом #${type} не существует.`);
    }

    return delivery;
  };

  public createOrder = async (order: OrderEntity) => {
    let delivery;

    switch (order.delivery.type) {
    case DeliveryTypeEnum.YANDEX_DELIVERY:
      delivery = this.yandexService.createOrder;
      break;
    }

    if (!delivery) {
      throw new Error('Не найдено подходящей доставки');
    }

    return delivery(order);
  };

  public findMany = async () => {
    const builder = this.createQueryBuilder({ isDevelopment: process.env.NODE_ENV === 'development' });

    const deliverys = await builder.getMany();

    return deliverys;
  };

  public deleteOne = async (params: ParamsIdInterface) => {
    const delivery = await this.findOne(params);

    await delivery.softRemove();

    delivery.deleted = new Date();

    return delivery;
  };

  public restoreOne = async (params: ParamsIdInterface) => {
    const deletedDelivery = await this.findOne(params, { withDeleted: true });

    return deletedDelivery.recover();
  };
}
