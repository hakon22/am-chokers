/* eslint-disable no-underscore-dangle */
import axios, { type AxiosError, type AxiosInstance } from 'axios';
import { Container, Singleton } from 'typescript-ioc';
import moment from 'moment';
import type { Request, Response } from 'express';

import { BaseService } from '@server/services/app/base.service';
import { OrderService } from '@server/services/order/order.service';
import { BullMQQueuesService } from '@microservices/sender/queues/bull-mq-queues.service';
import { DeliveryCredentialsEntity } from '@server/db/entities/delivery.credentials.entity';
import { DeliveryEntity } from '@server/db/entities/delivery.entity';
import { OrderEntity } from '@server/db/entities/order.entity';
import { getDiscountPercent, getPositionPriceWithDiscount } from '@/utilities/order/getOrderPrice';
import { CDEKDeliveryTranslateStatus } from '@server/types/delivery/cdek/enums/cdek-delivery-translate.status';
import { DeliveryTypeEnum } from '@server/types/delivery/enums/delivery.type.enum';
import { DateFormatEnum } from '@/utilities/enums/date.format.enum';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';
import { CDEKWebhooksEnum } from '@server/types/delivery/cdek/enums/cdek-webhooks.enum';
import { routes, serverHost } from '@/routes';
import { CDEKResponseStateEnum } from '@server/types/delivery/cdek/enums/cdek-response-state.enum';
import { CDEKDeliveryStatusEnum } from '@server/types/delivery/cdek/enums/cdek-delivery-status.enum';
import type { CDEKOrderResponseInterface } from '@server/types/delivery/cdek/cdek-order-response.interface';
import type { CDEKResponseInterface } from '@server/types/delivery/cdek/cdek-response.interface';
import type { CDEKWebhooksRequestInterface } from '@server/types/delivery/cdek/cdek-webhooks-request.interface';
import type { CDEKCreateOrderFormInterface, CDEKItemsRequestInterface } from '@server/types/delivery/cdek/cdek-create-order-request.interface';
import type { CDEKErrorInterface } from '@server/types/delivery/cdek/cdek-error.interface';
import type { CDEKWebhooksResponseInterface } from '@server/types/delivery/cdek/cdek-webhooks-response.interface';
import type { CDEKWebhooksFormInterface } from '@server/types/delivery/cdek/cdek-webhooks-form.interface';
import { OrderStatusEnum } from '@server/types/order/enums/order.status.enum';

@Singleton
export class CDEKService extends BaseService {
  private login: string;

  private secret: string;

  private baseUrl: string;

  private authToken: string;

  private axiosInstance: AxiosInstance;

  private isRefreshing = false;

  private refreshSubscribers: ((token: string) => void)[] = [];

  private TAG = 'CDEKService';

  private isDevelopment = process.env.NODE_ENV === 'development';

  private orderService = Container.get(OrderService);

  private readonly bullMQQueuesService = Container.get(BullMQQueuesService);

  public init = async (options?: { withWebhooks?: boolean; }) => {
    const credential = await DeliveryCredentialsEntity.findOne({ where: { type: DeliveryTypeEnum.CDEK, isDevelopment: this.isDevelopment } });
    if (!credential) {
      throw new Error('Нет учётной записи для СДЭК');
    }

    this.login = credential.login;
    this.secret = credential.password;
    this.baseUrl = credential.url;

    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
    });

    this.setupResponseInterceptor();

    if (!this.authToken) {
      await this.getAuthToken();
    }

    if (options?.withWebhooks) {
      const webhooks = await this.getWebhooks();

      if (!webhooks.find(({ type }) => type === CDEKWebhooksEnum.ORDER_STATUS)) {
        await this.setWebhook(CDEKWebhooksEnum.ORDER_STATUS);
      }
    }
  };

  private setupResponseInterceptor = () => {
    this.axiosInstance.interceptors.response.use((response) => response, async (error) => {
      const originalRequest = error.config;

      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        if (this.isRefreshing) {
          return new Promise((resolve) => {
            this.refreshSubscribers.push((token: string) => {
              originalRequest.headers['Authorization'] = `Bearer ${token}`;
              resolve(this.axiosInstance(originalRequest));
            });
          });
        }

        this.isRefreshing = true;

        try {
          await this.getAuthToken();
          originalRequest.headers.Authorization = `Bearer ${this.authToken}`;

          this.refreshSubscribers.forEach((callback) => callback(this.authToken!));
          this.refreshSubscribers = [];

          return this.axiosInstance(originalRequest);
        } catch (e) {
          this.refreshSubscribers.forEach((callback) => callback(this.authToken!));
          this.refreshSubscribers = [];
          return Promise.reject(e);
        }
      }
      return Promise.reject(error);
    });
  };

  private getAuthToken = async () => {        
    try {
      this.loggerService.info(this.TAG, 'Access token refresh...');
      const response = await axios.post(`${this.baseUrl}/oauth/token`, {
        grant_type: 'client_credentials',
        client_id: this.login,
        client_secret: this.secret,
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      if (!response.data?.access_token) {
        throw new Error('Server not authorized to CDEK API');
      }

      this.authToken = response.data.access_token;
      this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${this.authToken}`;
      this.loggerService.info(this.TAG, 'Access token refresh successfully');
    } catch (e) {
      this.loggerService.error(this.TAG, e);
      throw new Error(`Auth failed: ${e}`);
    }
  };

  public switch = async (req: Request, res: Response) => {  
    try {
      if (req.query?.action === 'offices') {
        return res.json(await this.getOffices(req.query));
      }
      if (req.body?.action === 'calculate') {
        return res.json(await this.calculate(req.body));
      }
    } catch (e) {
      this.loggerService.error(this.TAG, e);
      throw new Error(`Switch method failed: ${e}`);
    }
  };

  public getOffices = async (query: any) => {  
    try {
      const response = await this.axiosInstance.get('/deliverypoints', {
        params: query,
      });

      return response.data;
    } catch (e) {
      this.loggerService.error(this.TAG, e);
      throw new Error(`Get offices failed: ${e}`);
    }
  };

  public calculate = async (body: any) => {
    try {
      const response = await this.axiosInstance.post('/calculator/tarifflist', body);

      return response.data;
    } catch (e) {
      this.loggerService.error(this.TAG, e);
      throw new Error(`Calculate failed: ${e}`);
    }
  };

  public getOrderByUuid = async (uuid: string) => {
    try {
      if (!uuid) {
        throw new Error('Отсутствует uuid');
      }
      const response = await this.axiosInstance.get<CDEKOrderResponseInterface>(`/orders/${uuid}`);

      return response.data;
    } catch (e) {
      this.loggerService.error(this.TAG, e);
      throw new Error(`Get order by uuid failed: ${e}`);
    }
  };

  public webhooks = async (req: Request, res: Response) => {
    try {
      const body = req.body as CDEKWebhooksRequestInterface;

      this.loggerService.info(this.TAG, `Уведомление от СДЭК: ${JSON.stringify(body)}`);

      if (body.type === CDEKWebhooksEnum.ORDER_STATUS) {
        const deliveryOrder = await this.getOrderByUuid(body.uuid);

        let orderStatus: OrderStatusEnum;

        switch (body.attributes.code) {
        case CDEKDeliveryStatusEnum.RECEIVED_AT_SHIPMENT_WAREHOUSE:
          orderStatus = OrderStatusEnum.DELIVERING;
          break;
        case CDEKDeliveryStatusEnum.ACCEPTED_AT_PICK_UP_POINT:
        case CDEKDeliveryStatusEnum.POSTOMAT_POSTED:
          orderStatus = OrderStatusEnum.DELIVERED;
          break;
        case CDEKDeliveryStatusEnum.DELIVERED:
        case CDEKDeliveryStatusEnum.POSTOMAT_RECEIVED:
          orderStatus = OrderStatusEnum.COMPLETED;
          break;
        case CDEKDeliveryStatusEnum.NOT_DELIVERED:
        case CDEKDeliveryStatusEnum.POSTOMAT_SEIZED:
        case CDEKDeliveryStatusEnum.REMOVED:
          orderStatus = OrderStatusEnum.CANCELED;
          break;
        }

        await this.databaseService.getManager().transaction(async (manager) => {
          const deliveryRepo = manager.getRepository(DeliveryEntity);
          const orderRepo = manager.getRepository(OrderEntity);

          const delivery = await deliveryRepo.findOne({ select: ['id', 'cdekStatus'], where: { deliveryId: body.uuid } });
          const order = await orderRepo.findOne({ select: ['id', 'user'], where: { delivery: { deliveryId: body.uuid } }, relations: ['delivery', 'user'] });

          if (delivery) {
            await deliveryRepo
              .createQueryBuilder('delivery')
              .update()
              .set({
                cdekStatus: body.attributes.code,
                ...(deliveryOrder.entity.delivery_point ? { platformStationTo: deliveryOrder.entity.delivery_point } : {}),
                ...(deliveryOrder.entity.to_location?.postal_code ? { index: deliveryOrder.entity.to_location.postal_code } : {}),
                ...(deliveryOrder.entity.to_location?.address ? { address: deliveryOrder.entity.to_location.address } : {}),
              })
              .where('"delivery"."id" = :deliveryId', { deliveryId: delivery.id })
              .execute();

            this.loggerService.info(this.TAG, `Изменился статус доставки с ${delivery.cdekStatus} на ${body.attributes.code}`);

            if (order) {
              const messageRu = `По заказу <b>№${order.id}</b> изменился статус доставки с <b>${CDEKDeliveryTranslateStatus[UserLangEnum.RU][delivery.cdekStatus]}</b> на <b>${CDEKDeliveryTranslateStatus[UserLangEnum.RU][body.attributes.code]}</b>.`;
              const messageEn = `For order <b>№${order.id}</b> the delivery status has changed from <b>${CDEKDeliveryTranslateStatus[UserLangEnum.EN][delivery.cdekStatus]}</b> to <b>${CDEKDeliveryTranslateStatus[UserLangEnum.EN][body.attributes.code]}</b>.`;
              this.bullMQQueuesService.sendTelegramAdminMessage({ messageRu, messageEn });

              if (order.user.telegramId && !order.user.isAdmin) {
                const message = order.user.lang === UserLangEnum.RU ? messageRu : messageEn;
                this.bullMQQueuesService.sendTelegramMessage({ message, telegramId: order.user.telegramId });
              }
            }
          }

          if (orderStatus && order) {
            await this.orderService.updateStatus({ id: order.id }, { status: orderStatus }, UserLangEnum.RU, { manager, withoutCheck: true });
          }
        });
      }

      res.sendStatus(200);
    } catch (e) {
      this.loggerService.error(this.TAG, e);
      res.sendStatus(500);
    }
  };

  public getWebhooks = async () => {
    try {
      const response = await this.axiosInstance.get<CDEKWebhooksResponseInterface[]>('/webhooks');

      this.loggerService.info(this.TAG, 'Текущие вебхуки:', response.data);

      return response.data;
    } catch (e) {
      this.loggerService.error(this.TAG, e);
      throw new Error(`Get webhooks failed: ${e}`);
    }
  };

  public setWebhook = async (type: CDEKWebhooksEnum) => {
    try {
      const response = await this.axiosInstance.post<CDEKResponseInterface>('/webhooks', {
        type,
        url: [serverHost, routes.integration.cdek.webhooks].join('/'),
      } satisfies CDEKWebhooksFormInterface);

      this.loggerService.info(this.TAG, 'Устанавливаю вебхуки...');

      const hasErrors = response.data?.requests?.some((request) => (request.errors?.length ?? 0) > 0);
      if (hasErrors) {
        const errors = response.data.requests
          ?.flatMap((r) => r.errors ?? [])
          .map((e) => `${e.code ?? 'UNKNOWN'}: ${e.message ?? 'Unknown error'}`)
          .join('; ')
          .trim();

        this.loggerService.error(this.TAG, `CDEK setWebhook error(s): ${errors}`);
        throw new Error(`CDEK setWebhook error(s): ${errors}`);
      }

      if (response.data.requests.find(({ state }) => state === CDEKResponseStateEnum.SUCCESSFUL)) {
        this.loggerService.info(this.TAG, `Вебхук с типом ${type} успешно установлен`);
      }

      return response.data;
    } catch (e) {
      this.loggerService.error(this.TAG, e);
      throw new Error(`Set webhook failed: ${e}`);
    }
  };

  public createOrder = async (order: OrderEntity): Promise<void> => {
    try {
      const discountPercent = getDiscountPercent(order.positions, order.deliveryPrice, order.promotional);

      const positionsAmount = order.positions.reduce((acc, position) => {
        let positionDiscountPercent = discountPercent;
        if (order.promotional && order.promotional.items.length) {
          if (!order.promotional.items.map(({ id }) => id).includes(position.item.id)) {
            positionDiscountPercent = 0;
          }
        }
        acc[position.id] = getPositionPriceWithDiscount(position, positionDiscountPercent);
        return acc;
      }, {} as Record<number, number>);

      const body: CDEKCreateOrderFormInterface = {
        type: 1,
        number: `${process.env.NEXT_PUBLIC_APP_NAME}-${order.id}`,
        tariff_code: order.delivery.tariffCode as number,
        shipment_point: process.env.SHIPMENT_POINT,
        delivery_point: order.delivery.platformStationTo,
        recipient: {
          name: order.user.name,
          phones: [{
            number: order.user.phone,
          }],
        },
        packages: [{
          number: order.id.toString(),
          items: order.positions.map<CDEKItemsRequestInterface>((position) => ({
            name: position.item.translations.find(({ lang }) => lang === UserLangEnum.RU)?.name as string,
            name_i18n: position.item.translations.find(({ lang }) => lang === UserLangEnum.EN)?.name as string,
            ware_key: position.item.id.toString(),
            payment: {
              value: positionsAmount[position.id],
            },
            weight: 50,
            weight_gross: 50,
            amount: position.count,
            brand: 'AMChokers',
            country_code: 'RU',
            wifi_gsm: false,
            url: [process.env.NEXT_PUBLIC_PRODUCTION_HOST, 'catalog', position.item.group.code, position.item.translateName].join('/'),
            cost: positionsAmount[position.id],
            feacn_code: '7117190000',
            used: false,
          })),
          ...order.positions.reduce((acc) => {
            acc.width += 20;
            acc.height += 20;
            acc.length += 20;
            acc.weight += 50;
            return acc;
          }, { width: 0, height: 0, length: 0, weight: 0 } as { width: number; height: number; length: number; weight: number; }),
        }],
        ...(order.delivery.countryCode !== 'RU'
          ? {
            date_invoice: moment().format(DateFormatEnum.YYYY_MM_DD),
            shipper_name: process.env.NEXT_PUBLIC_FIO_EN,
            shipper_address: process.env.SHIPPER_ADDRESS,
          }
          : {}),
      };

      this.loggerService.info(this.TAG, 'Создание заказа в службу доставки СДЭК:', body);

      const response = await this.axiosInstance.post<CDEKResponseInterface>('/orders', body);

      const hasErrors = response.data?.requests?.some((request) => (request.errors?.length ?? 0) > 0);
      if (hasErrors) {
        const errors = response.data.requests
          ?.flatMap((r) => r.errors ?? [])
          .map((e) => `${e.code ?? 'UNKNOWN'}: ${e.message ?? 'Unknown error'}`)
          .join('; ')
          .trim();

        this.loggerService.error(this.TAG, `CDEK createOrder error(s): ${errors}`);
        throw new Error(`CDEK createOrder error(s): ${errors}`);
      }

      if (response.data.entity?.uuid) {
        const deliveryOrder = await this.getOrderByUuid(response.data.entity.uuid);

        this.loggerService.info(this.TAG, 'Созданный заказ службы доставки СДЭК:', deliveryOrder);

        if (deliveryOrder?.entity && deliveryOrder.entity.uuid) {
          await DeliveryEntity
            .createQueryBuilder('delivery')
            .update()
            .set({
              deliveryId: deliveryOrder.entity.uuid,
              cdekStatus: CDEKDeliveryStatusEnum.CREATED,
              ...(deliveryOrder.entity.delivery_point ? { platformStationTo: deliveryOrder.entity.delivery_point } : {}),
              ...(deliveryOrder.entity.to_location?.postal_code ? { index: deliveryOrder.entity.to_location.postal_code } : {}),
              ...(deliveryOrder.entity.to_location?.address ? { address: deliveryOrder.entity.to_location.address } : {}),
            })
            .where('"delivery"."id" = :deliveryId', { deliveryId: order.delivery.id })
            .execute();
        }
      }
    } catch (e) {
      if (axios.isAxiosError(e)) {
        const error = e as AxiosError<{ errors: CDEKErrorInterface[]; warnings: CDEKErrorInterface[]; }>;
        if (error.response?.data?.errors?.length) {
          const errors = error.response?.data?.errors
            .map((e) => `${e.code ?? 'UNKNOWN'}: ${e.message ?? 'Unknown error'}`)
            .join('; ')
            .trim();

          this.loggerService.error(this.TAG, `CDEK createOrder error(s): ${errors}`);
        }
        this.loggerService.error(this.TAG, error);
      } else {
        this.loggerService.error(this.TAG, e);
      }
      throw e;
    }
  };
}
