import { Container, Singleton } from 'typescript-ioc';

import { DeliveryCredentialsEntity } from '@server/db/entities/delivery.credentials.entity';
import { BaseService } from '@server/services/app/base.service';
import { YandexService } from '@server/services/delivery/yandex.service';
import { DeliveryTypeEnum } from '@server/types/delivery/enums/delivery.type.enum';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';
import type { DeliveryOptionsInterface } from '@server/types/delivery/delivery.options.interface';
import type { ParamsIdInterface } from '@server/types/params.id.interface';
import type { OrderEntity } from '@server/db/entities/order.entity';

@Singleton
export class DeliveryService extends BaseService {

  private readonly yandexService = Container.get(YandexService);

  private createQueryBuilder = (options?: DeliveryOptionsInterface) => {
    const manager = options?.manager || this.databaseService.getManager();

    const builder = manager.createQueryBuilder(DeliveryCredentialsEntity, 'delivery')
      .select([
        'delivery.id',
        'delivery.type',
        'delivery.password',
        'delivery.isDevelopment',
      ])
      .leftJoin('delivery.translations', 'translations')
      .addSelect([
        'translations.id',
        'translations.name',
        'translations.lang',
      ])
      .orderBy('delivery.id', 'DESC');

    if (options?.withCredentials) {
      builder.addSelect([
        'delivery.login',
        'delivery.url',
      ]);
    }
    if (options?.withDeleted) {
      builder.withDeleted();
    }
    if (options?.type) {
      builder.andWhere('delivery.type = :type', { type: options.type });
    }
    if (options?.isDevelopment) {
      builder.andWhere('delivery.isDevelopment = :isDevelopment', { isDevelopment: options.isDevelopment });
    }
    if (options?.excludeIds?.length) {
      builder.andWhere('delivery.id NOT IN(:...excludeIds)', { excludeIds: options.excludeIds });
    }

    return builder;
  };

  public findOne = async (params: ParamsIdInterface, lang: UserLangEnum, options?: DeliveryOptionsInterface) => {
    const builder = this.createQueryBuilder(options)
      .andWhere('delivery.id = :id', { id: params.id });

    const delivery = await builder.getOne();

    if (!delivery) {
      throw new Error(lang === UserLangEnum.RU
        ? `Службы доставки с номером #${params.id} не существует.`
        : `The delivery service with number #${params.id} does not exist.`);
    }

    return delivery;
  };

  public findOneByType = async (type: DeliveryOptionsInterface['type'], isDevelopment: DeliveryOptionsInterface['isDevelopment'], lang: UserLangEnum, options?: DeliveryOptionsInterface) => {
    const isRu = lang === UserLangEnum.RU;

    if (!type) {
      throw new Error(isRu
        ? 'Не указан тип службы доставки'
        : 'Delivery service type not specified');
    }
    const builder = this.createQueryBuilder({ type, isDevelopment, ...options });

    const delivery = await builder.getOne();

    if (!delivery) {
      throw new Error(isRu
        ? `Службы доставки с типом #${type} не существует.`
        : `There is no delivery service with type #${type}.`);
    }

    return delivery;
  };

  public createOrder = async (order: OrderEntity, lang: UserLangEnum) => {
    let delivery;

    switch (order.delivery.type) {
    case DeliveryTypeEnum.YANDEX_DELIVERY:
      delivery = this.yandexService.createOrder;
      break;
    }

    if (!delivery) {
      throw new Error(lang === UserLangEnum.RU
        ? 'Не найдено подходящей доставки'
        : 'No suitable delivery found');
    }

    return delivery(order);
  };

  public findMany = async () => {
    const builder = this.createQueryBuilder({ isDevelopment: process.env.NODE_ENV === 'development' });

    return builder.getMany();
  };

  public deleteOne = async (params: ParamsIdInterface, lang: UserLangEnum) => {
    const delivery = await this.findOne(params, lang);

    await delivery.softRemove();

    delivery.deleted = new Date();

    return delivery;
  };

  public restoreOne = async (params: ParamsIdInterface, lang: UserLangEnum) => {
    const deletedDelivery = await this.findOne(params, lang, { withDeleted: true });

    return deletedDelivery.recover();
  };
}
