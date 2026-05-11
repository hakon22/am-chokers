import axios, { type AxiosError } from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { YooCheckout, type ICheckoutCustomer, type IItemWithoutData } from '@a2seven/yoo-checkout';
import { Container, Singleton } from 'typescript-ioc';
import moment from 'moment';
import _ from 'lodash';

import { BaseService } from '@server/services/app/base.service';
import { AcquiringCredentialsEntity } from '@server/db/entities/acquiring.credentials.entity';
import { ItemEntity } from '@server/db/entities/item.entity';
import { AcquiringTypeEnum } from '@server/types/acquiring/enums/acquiring.type.enum';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';
import { YOOKASSA_ADMIN_ITEM_INVOICE_METADATA_PURPOSE } from '@server/types/acquiring/yookassa-admin-item-invoice.metadata';
import { ItemHistoryService, ITEM_HISTORY_FIELD_YOOKASSA_INVOICE_ID } from '@server/services/item/item.history.service';
import { ItemService } from '@server/services/item/item.service';
import type { PassportRequestInterface } from '@server/types/user/user.request.interface';

const YOOKASSA_API_ROOT = 'https://api.yookassa.ru/v3';

/**
 * Срок действия счёта в днях от момента создания.
 * В OpenAPI ЮKassa поле `expires_at` обязательно для `POST /v3/invoices` (без него — 400).
 * Максимально длинный разумный срок в пределах допустимого API.
 */
const INVOICE_EXPIRES_AT_DAYS = 30;

/** Лимит ЮKassa на `description` позиции в корзине счёта, описание платежа и наименование в чеке (символы UTF-32) */
const YOOKASSA_INVOICE_LINE_DESCRIPTION_MAX_CODE_POINTS = 128;

/** Лимит ЮKassa на значение одного ключа в `metadata` */
const YOOKASSA_METADATA_VALUE_MAX_CODE_POINTS = 512;

/** Ключ `metadata` для полного текста состава и длины, если основная строка обрезана по лимиту 128 */
const YOOKASSA_METADATA_ITEM_SPECS_KEY = 'item_invoice_specs';

type YookassaInvoiceApiResponse = {
  id: string;
  status: string;
  /** Срок оплаты по UTC (ISO 8601), для счетов в статусе `pending` */
  expires_at?: string;
  delivery_method?: {
    type: string;
    url?: string;
  };
  /** Есть у счёта, когда пользователь уже дошёл до платежа (см. документацию ЮKassa по объекту счёта). */
  payment_details?: {
    id: string;
    status?: string;
  };
};

type YookassaPaymentApiResponse = {
  id: string;
  status: string;
};

/**
 * Выставление счетов ЮKassa (API `/v3/invoices`) для оплаты товара из карточки.
 */
@Singleton
export class YookassaItemInvoiceService extends BaseService {
  private readonly TAG = 'YookassaItemInvoiceService';

  private readonly itemHistoryService = Container.get(ItemHistoryService);

  private readonly itemService = Container.get(ItemService);

  /**
   * Создаёт Basic-заголовок авторизации для REST API ЮKassa
   * @param shopId - идентификатор магазина
   * @param secretKey - секретный ключ
   * @returns значение заголовка `Authorization`
   */
  private buildBasicAuthorizationHeader = (shopId: string, secretKey: string): string => {
    const credentials = `${shopId}:${secretKey}`;
    const encoded = Buffer.from(credentials, 'utf8').toString('base64');
    return `Basic ${encoded}`;
  };

  /**
   * Выполняет GET к API счёта ЮKassa
   * @param invoiceId - идентификатор счёта (`in-...`)
   * @param authorizationHeader - заголовок `Authorization`
   * @returns объект счёта от API
   */
  private getInvoiceFromApi = async (invoiceId: string, authorizationHeader: string): Promise<YookassaInvoiceApiResponse> => {
    const response = await axios.get<YookassaInvoiceApiResponse>(`${YOOKASSA_API_ROOT}/invoices/${invoiceId}`, {
      headers: {
        Authorization: authorizationHeader,
      },
    });
    return response.data;
  };

  /**
   * Выполняет GET к API платежа ЮKassa (актуальный статус для решения об отмене)
   * @param paymentId - идентификатор платежа
   * @param authorizationHeader - заголовок `Authorization`
   * @returns объект платежа от API
   */
  private getPaymentFromApi = async (paymentId: string, authorizationHeader: string): Promise<YookassaPaymentApiResponse> => {
    const response = await axios.get<YookassaPaymentApiResponse>(`${YOOKASSA_API_ROOT}/payments/${paymentId}`, {
      headers: {
        Authorization: authorizationHeader,
      },
    });
    return response.data;
  };

  /**
   * Освобождает предыдущий счёт перед выставлением нового: отмена только через API платежа, если он уже создан и допускает отмену.
   * В публичном API ЮKassa нет `POST /invoices/{id}/cancel`; счёт без подтверждённого платежа можно отменить только в личном кабинете или дождаться `expires_at` (срок счёта до 30 суток по документации ЮKassa).
   * @param invoiceId - идентификатор счёта (`in-...`)
   * @param shopId - идентификатор магазина
   * @param secretKey - секретный ключ
   * @returns `Promise`, завершающийся после попытки отмены или диагностического лога
   */
  private tryInvalidatePreviousInvoiceOrPayment = async (invoiceId: string, shopId: string, secretKey: string): Promise<void> => {
    const authorizationHeader = this.buildBasicAuthorizationHeader(shopId, secretKey);
    try {
      const invoice = await this.getInvoiceFromApi(invoiceId, authorizationHeader);
      const { payment_details: paymentDetails } = invoice;
      const paymentId = paymentDetails?.id;

      if (!_.isNil(paymentId) && paymentId !== '') {
        let paymentStatus = paymentDetails?.status;
        if (_.isNil(paymentStatus) || paymentStatus === '') {
          const paymentRow = await this.getPaymentFromApi(paymentId, authorizationHeader);
          paymentStatus = paymentRow.status;
        }
        if (paymentStatus === 'waiting_for_capture') {
          const checkout = new YooCheckout({ shopId, secretKey });
          await checkout.cancelPayment(paymentId, uuidv4());
          this.loggerService.info(this.TAG, `Отменён платёж ${paymentId} (двухстадийный) по счёту ${invoiceId}`);
          return;
        }
        if (paymentStatus === 'pending') {
          try {
            const checkout = new YooCheckout({ shopId, secretKey });
            await checkout.cancelPayment(paymentId, uuidv4());
            this.loggerService.info(this.TAG, `Отменён платёж ${paymentId} в статусе pending по счёту ${invoiceId}`);
          } catch (cancelError) {
            const axiosError = cancelError as AxiosError;
            this.loggerService.warn(
              this.TAG,
              `Платёж ${paymentId} по счёту ${invoiceId} в статусе pending — отмена через API не выполнена: ${axiosError?.message ?? cancelError}`,
            );
          }
          return;
        }
        this.loggerService.info(
          this.TAG,
          `Счёт ${invoiceId}: платёж ${paymentId} в статусе ${paymentStatus ?? 'unknown'} — пропуск отмены через API`,
        );
        return;
      }

      if (invoice.status === 'pending') {
        this.loggerService.warn(
          this.TAG,
          `Счёт ${invoiceId} без объекта payment_details: в API ЮKassa нет отмены такого счёта; отмените вручную в личном кабинете ЮKassa или дождитесь окончания срока счёта. Новый счёт будет создан, старый может оставаться в списке до истечения срока.`,
        );
      }
    } catch (error) {
      const axiosError = error as AxiosError;
      this.loggerService.warn(
        this.TAG,
        `Не удалось получить или обработать предыдущий счёт ${invoiceId}: ${axiosError?.message ?? error}`,
      );
    }
  };

  /**
   * Формирует данные покупателя для чека из профиля администратора
   * @param adminUser - текущий пользователь (админ)
   * @param lang - язык сообщений об ошибках
   * @returns объект `customer` для чека
   */
  private buildReceiptCustomerForAdmin = (adminUser: PassportRequestInterface, lang: UserLangEnum): ICheckoutCustomer => {
    const { phone, name } = adminUser;
    if (!phone && !name) {
      throw new Error(lang === UserLangEnum.RU
        ? 'В профиле не указаны имя пользователя или номер телефона'
        : 'The profile does not contain a username or phone number');
    }
    const keys: (keyof ICheckoutCustomer)[] = ['phone', 'full_name'];
    const values = [phone, name];
    return keys.reduce((acc, key, index) => {
      if (values[index]) {
        acc[key] = values[index];
      }
      return acc;
    }, {} as ICheckoutCustomer);
  };

  /**
   * Обрезает строку по числу кодовых точек Unicode (лимиты ЮKassa задаются в «символах»)
   * @param text - исходная строка
   * @param maxCodePoints - максимальное число кодовых точек
   * @param appendEllipsisWhenTruncated - добавлять ли «...» при обрезке
   * @returns укороченная строка
   */
  private clampUtf32TextToMaxCodePoints = (
    text: string,
    maxCodePoints: number,
    appendEllipsisWhenTruncated: boolean,
  ): string => {
    const codePoints = [...text];
    if (codePoints.length <= maxCodePoints) {
      return text;
    }
    const sliceLength = appendEllipsisWhenTruncated ? maxCodePoints - 3 : maxCodePoints;
    const head = codePoints.slice(0, Math.max(0, sliceLength)).join('');
    return appendEllipsisWhenTruncated ? `${head}...` : head;
  };

  /**
   * Собирает подписи состава через запятую в выбранной локали
   * @param item - товар с подгруженными `compositions` и `compositions.translations`
   * @param lang - язык подписей
   * @returns строка «a, b, c» или пустая строка
   */
  private buildCompositionCommaSeparated = (item: ItemEntity, lang: UserLangEnum): string => {
    const compositions = item.compositions ?? [];
    if (_.isEmpty(compositions)) {
      return '';
    }
    const localeTag = lang === UserLangEnum.RU ? 'ru' : 'en';
    const names = compositions
      .map((composition) => {
        const matchTranslation = composition.translations?.find((translation) => translation.lang === lang);
        const fallbackTranslation = composition.translations?.[0];
        const label = matchTranslation?.name ?? fallbackTranslation?.name ?? '';
        return label.trim();
      })
      .filter((label) => label !== '')
      .sort((left, right) => left.localeCompare(right, localeTag));
    return names.join(', ');
  };

  /**
   * Формирует фрагмент «длина» по переводу товара
   * @param item - товар с `translations`
   * @param lang - язык подписи
   * @returns строка вида «Длина: ...» или пустая строка
   */
  private buildLengthLabelForInvoice = (item: ItemEntity, lang: UserLangEnum): string => {
    const translation = item.translations?.find((row) => row.lang === lang);
    const lengthRaw = translation?.length?.trim() ?? '';
    if (lengthRaw === '') {
      return '';
    }
    if (lang === UserLangEnum.RU) {
      return `Длина: ${lengthRaw}`;
    }
    return `Length: ${lengthRaw}`;
  };

  /**
   * Собирает текст позиции для корзины счёта, описания платежа и чека: название, состав через запятую, длина; при превышении 128 символов полный текст дублируется в `metadata` (до 512 символов)
   * @param productDisplayName - отображаемое имя товара
   * @param item - товар с составом и переводами
   * @param lang - язык подписей «Состав» / «Длина»
   * @returns короткая строка для API и при необходимости полная для `metadata`
   */
  private buildInvoiceLineDescriptionAndMetadataOverflow = (
    productDisplayName: string,
    item: ItemEntity,
    lang: UserLangEnum,
  ): { lineDescription: string; metadataOverflow: string | null; } => {
    const compositionComma = this.buildCompositionCommaSeparated(item, lang);
    const compositionLine = compositionComma === ''
      ? ''
      : (lang === UserLangEnum.RU ? `Состав: ${compositionComma}` : `Composition: ${compositionComma}`);
    const lengthLine = this.buildLengthLabelForInvoice(item, lang);
    const segments = [productDisplayName.trim(), compositionLine, lengthLine].filter((segment) => segment !== '');
    const fullText = segments.join('. ');
    const lineDescription = this.clampUtf32TextToMaxCodePoints(
      fullText,
      YOOKASSA_INVOICE_LINE_DESCRIPTION_MAX_CODE_POINTS,
      true,
    );
    const metadataOverflow = [...fullText].length > YOOKASSA_INVOICE_LINE_DESCRIPTION_MAX_CODE_POINTS
      ? this.clampUtf32TextToMaxCodePoints(fullText, YOOKASSA_METADATA_VALUE_MAX_CODE_POINTS, true)
      : null;
    return { lineDescription, metadataOverflow };
  };

  /**
   * Создаёт или обновляет счёт ЮKassa для оплаты одной позиции товара и сохраняет `yookassaInvoiceId` на товаре
   * @param itemId - идентификатор товара
   * @param adminUser - администратор (для чека и проверки профиля)
   * @param lang - язык текстов ошибок и подписей состава/длины в счёте
   * @returns ссылка на страницу счёта, идентификатор счёта и срок действия (`expires_at` в ISO 8601)
   */
  public createOrRefreshItemAdminInvoice = async (
    itemId: number,
    adminUser: PassportRequestInterface,
    lang: UserLangEnum,
  ): Promise<{ invoiceUrl: string; invoiceId: string; invoiceExpiresAt: string; }> => {
    const credential = await AcquiringCredentialsEntity.findOne({
      where: { issuer: AcquiringTypeEnum.YOOKASSA, isDevelopment: process.env.NODE_ENV === 'development' },
    });
    if (!credential || credential.deleted) {
      throw new Error(lang === UserLangEnum.RU
        ? 'Недоступна онлайн оплата для данного товара'
        : 'Online payment is not available for this item');
    }

    const item = await ItemEntity.findOne({
      where: { id: itemId },
      relations: ['translations', 'compositions', 'compositions.translations'],
    });
    if (!item) {
      throw new Error(lang === UserLangEnum.RU
        ? 'Товар не найден'
        : 'Item not found');
    }

    const amountNumber = +((item.price - item.discountPrice)).toFixed(2);
    if (amountNumber <= 0) {
      throw new Error(lang === UserLangEnum.RU
        ? 'Сумма для оплаты должна быть больше нуля'
        : 'Payment amount must be greater than zero');
    }

    const amountString = amountNumber.toFixed(2);
    const russianName = item.translations?.find((translation) => translation.lang === UserLangEnum.RU)?.name
      ?? item.translateName;
    const displayNameForInvoice = item.translations?.find((translation) => translation.lang === lang)?.name?.trim()
      ?? russianName;
    const productLabelForSpecs = displayNameForInvoice.trim() !== '' ? displayNameForInvoice : russianName;
    const { lineDescription, metadataOverflow } = this.buildInvoiceLineDescriptionAndMetadataOverflow(
      productLabelForSpecs,
      item,
      lang,
    );
    const customer = this.buildReceiptCustomerForAdmin(adminUser, lang);
    const receiptItems = [
      {
        description: lineDescription,
        amount: {
          value: amountString,
          currency: 'RUB',
        },
        quantity: '1',
        vat_code: 1,
        payment_subject: 'commodity',
        payment_mode: 'full_payment',
      },
    ] as IItemWithoutData[];

    const metadata: Record<string, string> = {
      purpose: YOOKASSA_ADMIN_ITEM_INVOICE_METADATA_PURPOSE,
      itemId: String(item.id),
    };
    if (!_.isNil(metadataOverflow)) {
      metadata[YOOKASSA_METADATA_ITEM_SPECS_KEY] = metadataOverflow;
    }

    const shopId = credential.login;
    const secretKey = credential.password;
    const authorizationHeader = this.buildBasicAuthorizationHeader(shopId, secretKey);

    if (!_.isNil(item.yookassaInvoiceId) && item.yookassaInvoiceId !== '') {
      await this.tryInvalidatePreviousInvoiceOrPayment(item.yookassaInvoiceId, shopId, secretKey);
    }

    const invoiceTitle = lang === UserLangEnum.RU
      ? `Счёт на оплату: ${productLabelForSpecs}`
      : `Invoice: ${productLabelForSpecs}`;
    const invoiceDescription = this.clampUtf32TextToMaxCodePoints(
      invoiceTitle,
      YOOKASSA_INVOICE_LINE_DESCRIPTION_MAX_CODE_POINTS,
      true,
    );

    const expiresAt = moment.utc().add(INVOICE_EXPIRES_AT_DAYS, 'days').toISOString();

    const requestBody = {
      payment_data: {
        amount: {
          value: amountString,
          currency: 'RUB',
        },
        capture: true,
        description: lineDescription,
        metadata,
        receipt: {
          customer,
          items: receiptItems,
        },
      },
      cart: [
        {
          description: lineDescription,
          price: {
            value: amountString,
            currency: 'RUB',
          },
          quantity: 1,
        },
      ],
      delivery_method_data: {
        type: 'self',
      },
      expires_at: expiresAt,
      description: invoiceDescription,
      metadata,
    };

    const idempotenceKey = uuidv4();
    this.loggerService.info(this.TAG, `Создание счёта ЮKassa для товара №${itemId}`);

    let response;
    try {
      response = await axios.post<YookassaInvoiceApiResponse>(`${YOOKASSA_API_ROOT}/invoices`, requestBody, {
        headers: {
          Authorization: authorizationHeader,
          'Idempotence-Key': idempotenceKey,
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      const axiosError = error as AxiosError<{ description?: string; code?: string; type?: string; }>;
      const detailPayload = axiosError.response?.data;
      const detailText = _.isNil(detailPayload)
        ? ''
        : (typeof detailPayload === 'string' ? detailPayload : JSON.stringify(detailPayload));
      this.loggerService.error(
        this.TAG,
        `Создание счёта ЮKassa для товара №${itemId}: HTTP ${axiosError.response?.status ?? '?'}. ${detailText || axiosError.message}`,
        axiosError,
      );
      throw error;
    }

    const invoice = response.data;
    const invoiceUrl = invoice.delivery_method?.url;
    if (!invoiceUrl) {
      throw new Error(lang === UserLangEnum.RU
        ? 'ЮKassa не вернула ссылку на счёт'
        : 'YooKassa did not return an invoice URL');
    }

    const previousInvoiceId = _.isNil(item.yookassaInvoiceId) || item.yookassaInvoiceId === ''
      ? null
      : String(item.yookassaInvoiceId);

    await this.databaseService.getManager().transaction(async (manager) => {
      await manager.update(ItemEntity, { id: item.id }, { yookassaInvoiceId: invoice.id });
      await this.itemHistoryService.persistSingleDelta(manager, item.id, adminUser, {
        field: ITEM_HISTORY_FIELD_YOOKASSA_INVOICE_ID,
        oldValue: previousInvoiceId,
        newValue: invoice.id,
      });
    });

    await this.itemService.refreshCachedItemById(item.id);

    const invoiceExpiresAt = !_.isNil(invoice.expires_at) && invoice.expires_at !== ''
      ? invoice.expires_at
      : expiresAt;

    return { invoiceUrl, invoiceId: invoice.id, invoiceExpiresAt };
  };

  /**
   * Возвращает актуальную ссылку на неоплаченный счёт, если она сохранена на товаре и счёт ещё в статусе `pending`
   * @param itemId - идентификатор товара
   * @param lang - язык сообщений об ошибке доступа
   * @param adminUser - администратор (для записи в историю при сбросе счёта)
   * @returns данные неоплаченного счёта (ссылка и срок) или `null`, если показывать нечего
   */
  public getPendingItemInvoicePayload = async (
    itemId: number,
    lang: UserLangEnum,
    adminUser: PassportRequestInterface,
  ): Promise<{ invoiceUrl: string; invoiceExpiresAt: string | null; } | null> => {
    const credential = await AcquiringCredentialsEntity.findOne({
      where: { issuer: AcquiringTypeEnum.YOOKASSA, isDevelopment: process.env.NODE_ENV === 'development' },
    });
    if (!credential || credential.deleted) {
      throw new Error(lang === UserLangEnum.RU
        ? 'Недоступна онлайн оплата для данного товара'
        : 'Online payment is not available for this item');
    }

    const item = await ItemEntity.findOne({ where: { id: itemId } });
    if (!item) {
      throw new Error(lang === UserLangEnum.RU
        ? 'Товар не найден'
        : 'Item not found');
    }
    if (_.isNil(item.yookassaInvoiceId) || item.yookassaInvoiceId === '') {
      return null;
    }

    const authorizationHeader = this.buildBasicAuthorizationHeader(credential.login, credential.password);
    try {
      const invoice = await this.getInvoiceFromApi(item.yookassaInvoiceId, authorizationHeader);
      if (invoice.status === 'pending' && invoice.delivery_method?.url) {
        const invoiceExpiresAt = !_.isNil(invoice.expires_at) && invoice.expires_at !== ''
          ? invoice.expires_at
          : null;
        if (_.isNil(invoiceExpiresAt)) {
          this.loggerService.warn(this.TAG, `Счёт ${item.yookassaInvoiceId} без поля expires_at в ответе API`);
        }
        return {
          invoiceUrl: invoice.delivery_method.url,
          invoiceExpiresAt,
        };
      }
      const clearedInvoiceId = item.yookassaInvoiceId as string;
      await this.databaseService.getManager().transaction(async (manager) => {
        await manager.update(ItemEntity, { id: item.id }, { yookassaInvoiceId: null });
        await this.itemHistoryService.persistSingleDelta(manager, item.id, adminUser, {
          field: ITEM_HISTORY_FIELD_YOOKASSA_INVOICE_ID,
          oldValue: clearedInvoiceId,
          newValue: null,
        });
      });
      await this.itemService.refreshCachedItemById(item.id);
      return null;
    } catch (error) {
      const axiosError = error as AxiosError;
      this.loggerService.warn(this.TAG, `Не удалось получить счёт ${item.yookassaInvoiceId}: ${axiosError?.message ?? error}`);
      const clearedInvoiceId = item.yookassaInvoiceId as string;
      await this.databaseService.getManager().transaction(async (manager) => {
        await manager.update(ItemEntity, { id: item.id }, { yookassaInvoiceId: null });
        await this.itemHistoryService.persistSingleDelta(manager, item.id, adminUser, {
          field: ITEM_HISTORY_FIELD_YOOKASSA_INVOICE_ID,
          oldValue: clearedInvoiceId,
          newValue: null,
        });
      });
      await this.itemService.refreshCachedItemById(item.id);
      return null;
    }
  };
}
