import type { CDEKWebhooksEnum } from '@server/types/delivery/cdek/enums/cdek-webhooks.enum';

export interface CDEKWebhooksFormInterface {
  type: CDEKWebhooksEnum,
  url: string;
}
