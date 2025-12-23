import type { CDEKWebhooksFormInterface } from '@server/types/delivery/cdek/cdek-webhooks-form.interface';

export interface CDEKWebhooksResponseInterface extends CDEKWebhooksFormInterface {
  uuid: string;
}
