import { Singleton } from 'typescript-ioc';

import { OrderEntity } from '@server/db/entities/order.entity';
import { BaseService } from '@server/services/app/base.service';
import { OrderStatusEnum } from '@server/types/order/enums/order.status.enum';
import { DeliveryTypeEnum } from '@server/types/delivery/enums/delivery.type.enum';
import { DEFAULT_SHIPPING_RATE_RUB, PRICE_FOR_FREE_DELIVERY_RUB } from '@shared/delivery-config';
import type { PromotionalEntity } from '@server/db/entities/promotional.entity';

@Singleton
export class SingleUsePromotionalOrderService extends BaseService {
  private TAG = 'SingleUsePromotionalOrderService';

  /**
   * Снимает одноразовый промокод с неоплаченных заказов пользователя после оплаты
   * @param userId - идентификатор пользователя
   * @param promotional - оплаченный промокод
   * @param paidOrderId - идентификатор оплаченного заказа
   */
  public invalidateOnUnpaidOrders = async (userId: number, promotional: PromotionalEntity, paidOrderId: number): Promise<void> => {
    if (!promotional.singleUse) {
      return;
    }

    const stripParameters = {
      userId,
      promotionalId: promotional.id,
      orderStatus: OrderStatusEnum.NOT_PAID,
      paidOrderId,
    };

    const updateResult = promotional.freeDelivery
      ? await OrderEntity
        .createQueryBuilder('order')
        .update()
        .set({
          promotional: () => 'NULL',
          deliveryPrice: () => `
            CASE
              WHEN "order"."delivery_price" > 0 THEN "order"."delivery_price"
              WHEN (
                SELECT "delivery"."type"
                FROM "chokers"."delivery" AS "delivery"
                WHERE "delivery"."id" = "order"."delivery_id"
              ) = :pickupDeliveryType THEN 0
              WHEN (
                SELECT COALESCE(SUM(
                  ("order_position"."price" - "order_position"."discount_price") * "order_position"."count"
                ), 0)
                FROM "chokers"."order_position"
                WHERE "order_position"."order_id" = "order"."id"
                  AND "order_position"."deleted" IS NULL
              ) >= :priceForFreeDeliveryRub THEN 0
              WHEN COALESCE("order"."quoted_delivery_price", 0) > 0 THEN "order"."quoted_delivery_price"
              ELSE :defaultShippingRate
            END
          `,
        })
        .setParameters({
          ...stripParameters,
          pickupDeliveryType: DeliveryTypeEnum.PICKUP,
          defaultShippingRate: DEFAULT_SHIPPING_RATE_RUB,
          priceForFreeDeliveryRub: PRICE_FOR_FREE_DELIVERY_RUB,
        })
        .where('"order"."user_id" = :userId')
        .andWhere('"order"."promotional_id" = :promotionalId')
        .andWhere('"order"."status" = :orderStatus')
        .andWhere('"order"."id" != :paidOrderId')
        .execute()
      : await OrderEntity
        .createQueryBuilder('order')
        .setParameters({
          userId,
          promotionalId: promotional.id,
          orderStatus: OrderStatusEnum.NOT_PAID,
          paidOrderId,
        })
        .update()
        .set({ promotional: () => 'NULL' })
        .where('"order"."user_id" = :userId')
        .andWhere('"order"."promotional_id" = :promotionalId')
        .andWhere('"order"."status" = :orderStatus')
        .andWhere('"order"."id" != :paidOrderId')
        .execute();

    if (!updateResult.affected) {
      return;
    }

    this.loggerService.info(
      this.TAG,
      `Снят одноразовый промокод с ${updateResult.affected} неоплаченных заказов`,
    );
  };
}
