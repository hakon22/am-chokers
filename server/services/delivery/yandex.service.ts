import { Singleton } from 'typescript-ioc';
import axios from 'axios';
import moment from 'moment-timezone';

import { DeliveryEntity } from '@server/db/entities/delivery.entity';
import { DeliveryCredentialsEntity } from '@server/db/entities/delivery.credentials.entity';
import { BaseService } from '@server/services/app/base.service';
import { DeliveryTypeEnum } from '@server/types/delivery/enums/delivery.type.enum';
import { OrderEntity } from '@server/db/entities/order.entity';
import type { YandexCreateOrderResponseInterface } from '@server/types/delivery/yandex/yandex.create.order.response.interface';
import type { YandexCreateOrderInterface } from '@server/types/delivery/yandex/yandex.create.order.interface';
import type { YandexRequestOrderResponseInterface } from '@server/types/delivery/yandex/yandex.request.order.interface';

@Singleton
export class YandexService extends BaseService {

  private TAG = 'YandexService';

  private isDevelopment = () => process.env.NODE_ENV === 'development';

  private axiosInstance = (credential: DeliveryCredentialsEntity) => {
    const instance = axios.create({
      baseURL: credential.url,
      headers: {
        Authorization: `Bearer ${credential.login}`,
        'Accept-Language': 'ru',
      },
    });
    return instance;
  };

  private getCredentail = async () => {
    const credential = await DeliveryCredentialsEntity.findOne({ where: { type: DeliveryTypeEnum.YANDEX_DELIVERY, isDevelopment: this.isDevelopment() } });

    if (!credential) {
      throw new Error('Нет учётной записи для Яндекс Доставки');
    }

    return credential;
  };

  public createOrder = async (order: OrderEntity) => {
    const credential = await this.getCredentail();

    const barcode = `AM-${order.id.toString().padStart(6, '0')}`;

    const request: YandexCreateOrderInterface = {
      info: {
        operator_request_id: this.isDevelopment() ? Math.random().toString() : order.id.toString(),
      },
      source: {
        platform_station: {
          platform_id: this.isDevelopment() ? 'fbed3aa1-2cc6-4370-ab4d-59c5cc9bb924' : credential.password,
        },
      },
      destination: {
        type: 'platform_station',
        platform_station: {
          platform_id: this.isDevelopment() ? '8e932c62-9a10-4bac-bf59-9c278b85f8e9' : order.delivery.platformStationTo,
        },
      },
      items: order.positions.map((position => ({
        count: position.count,
        name: position.item.name,
        article: position.item.name,
        billing_details: {
          unit_price: ((position.price - position.discountPrice) * position.count) * 100,
          assessed_unit_price: ((position.price - position.discountPrice) * position.count) * 100,
        },
        place_barcode: barcode,
      }))),
      places: [
        {
          physical_dims: {
            weight_gross: order.positions.length * 200,
            dx: 10 * order.positions.length,
            dy: 5 * order.positions.length,
            dz: 10 * order.positions.length,
          },
          barcode,
        },
      ],
      billing_info: {
        payment_method: 'already_paid',
      },
      recipient_info: {
        first_name: order.user.name,
        phone: order.user.phone,
      },
      last_mile_policy: 'self_pickup',
      particular_items_refuse: false,
    };

    this.loggerService.info(this.TAG, request);

    try {
      const { data } = await this.axiosInstance(credential).post<YandexCreateOrderResponseInterface>('/api/b2b/platform/request/create', request, {
        headers: {
          Authorization: `Bearer ${credential.login}`,
          'Accept-Language': 'ru',
        },
      });

      setTimeout(async () => {
        if (data.request_id) {
          await this.getOrder(data.request_id, order.delivery);
        }
      }, 5000);

    } catch (e) {
      if (axios.isAxiosError(e)) {
        this.loggerService.error(this.TAG, e.response?.data?.message);
      } else {
        this.loggerService.error(this.TAG, JSON.stringify(e));
      }
    }
  };

  public getOrder = async (requestId: string, delivery: DeliveryEntity, credential?: DeliveryCredentialsEntity) => {
    const account = credential || await this.getCredentail();

    try {
      const { data: response } = await this.axiosInstance(account).get<YandexRequestOrderResponseInterface>('/api/b2b/platform/request/info', {
        params: {
          request_id: requestId,
        },
      });

      this.loggerService.info(this.TAG, response);

      if (response.request_id) {
        await DeliveryEntity.update(delivery.id, { 
          deliveryId: response.request_id,
          url: response.sharing_url,
          deliveryFrom: moment.unix(response.request.delivery_policy.min).tz('Europe/Moscow').toDate(),
          deliveryTo: moment.unix(response.request.delivery_policy.max).tz('Europe/Moscow').toDate(),
          status: response.state.status,
          reason: response.state.reason,
        });
      }
    } catch (e) {
      if (axios.isAxiosError(e)) {
        this.loggerService.error(this.TAG, e.response?.data?.message);
      } else {
        this.loggerService.error(this.TAG, JSON.stringify(e));
      }
    }
  };
}
