import axios from 'axios';
import FormData from 'form-data';
import _ from 'lodash';
import { Singleton } from 'typescript-ioc';

import { BaseService } from '@server/services/app/base.service';
import { getOrderPrice } from '@/utilities/order/getOrderPrice';
import type { OrderEntity } from '@server/db/entities/order.entity';

interface UploadConversionParametersInterface {
  yclid: string;
  target: string;
  dateTime: number;
  price?: number;
  currency?: string;
}

@Singleton
export class YandexMetrikaOfflineConversionService extends BaseService {
  private readonly TAG = 'YandexMetrikaOfflineConversionService';

  private readonly YANDEX_METRIKA_COUNTER_ID = 100705426;

  private readonly YANDEX_METRIKA_GOAL_CART_ADD = 'cart_add';

  private readonly YANDEX_METRIKA_GOAL_ORDER_PAID = 'order_paid';

  private readonly YANDEX_METRIKA_OFFLINE_UPLOAD_URL = `https://api-metrika.yandex.net/management/v1/counter/${this.YANDEX_METRIKA_COUNTER_ID}/offline_conversions/upload`;

  /**
   * Отправляет одну офлайн-конверсию в Яндекс.Метрику через Management API
   * @param parameters - yclid, идентификатор цели, unix-время и опционально сумма
   * @returns true при успешном upload
   */
  public uploadConversion = async (parameters: UploadConversionParametersInterface): Promise<boolean> => {
    const oauthToken = process.env.YANDEX_METRIKA_OAUTH_TOKEN;

    if (_.isEmpty(oauthToken)) {
      this.loggerService.warn(this.TAG, 'YANDEX_METRIKA_OAUTH_TOKEN не задан — офлайн-конверсия не отправлена', {
        target: parameters.target,
        yclid: parameters.yclid,
      });
      return false;
    }

    const { yclid, target, dateTime, price, currency } = parameters;

    const csvHeader = !_.isUndefined(price) && currency
      ? 'Yclid,Target,DateTime,Price,Currency'
      : 'Yclid,Target,DateTime';

    const csvDataRow = !_.isUndefined(price) && currency
      ? `${yclid},${target},${dateTime},${price},${currency}`
      : `${yclid},${target},${dateTime}`;

    const csvContent = `${csvHeader}\n${csvDataRow}\n`;

    const formData = new FormData();
    formData.append('file', Buffer.from(csvContent, 'utf-8'), {
      filename: 'offline-conversions.csv',
      contentType: 'text/csv',
    });

    try {
      const { data } = await axios.post(this.YANDEX_METRIKA_OFFLINE_UPLOAD_URL, formData, {
        headers: {
          Authorization: `OAuth ${oauthToken}`,
          ...formData.getHeaders(),
        },
      });

      this.loggerService.info(this.TAG, 'Офлайн-конверсия отправлена в Яндекс.Метрику', {
        target,
        yclid,
        uploadId: data?.uploading?.id,
        status: data?.uploading?.status,
      });

      return true;
    } catch (error) {
      this.loggerService.error(this.TAG, 'Ошибка отправки офлайн-конверсии в Яндекс.Метрику', {
        target,
        yclid,
        error,
      });
      return false;
    }
  };

  /**
   * Отправляет офлайн-конверсию добавления в корзину
   * @param yclid - идентификатор клика Яндекс Директа
   * @param itemId - id товара в корзине
   * @returns Promise с результатом upload
   */
  public uploadCartAdd = async (yclid: string, itemId: number): Promise<boolean> => {
    if (_.isNil(yclid)) {
      this.loggerService.warn(this.TAG, 'yclid отсутствует — cart_add не отправлен', { itemId });
      return false;
    }

    return this.uploadConversion({
      yclid,
      target: this.YANDEX_METRIKA_GOAL_CART_ADD,
      dateTime: Math.floor(Date.now() / 1000),
    });
  };

  /**
   * Отправляет офлайн-конверсию оплаты заказа
   * @param order - заказ с yclid и позициями для расчёта суммы
   * @returns Promise с результатом upload
   */
  public uploadOrderPaid = async (order: OrderEntity): Promise<boolean> => {
    if (_.isNil(order.yclid)) {
      this.loggerService.warn(this.TAG, 'yclid отсутствует в заказе — order_paid не отправлен', { orderId: order.id });
      return false;
    }

    return this.uploadConversion({
      yclid: order.yclid as string,
      target: this.YANDEX_METRIKA_GOAL_ORDER_PAID,
      dateTime: Math.floor(Date.now() / 1000),
      price: getOrderPrice(order),
      currency: 'RUB',
    });
  };
}
