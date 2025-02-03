import { Container, Singleton } from 'typescript-ioc';
import type { Router } from 'express';

import { BaseRouter } from '@server/routes/base.route';
import { TelegramService } from '@server/services/integration/telegram.service';

@Singleton
export class IntegrationRoute extends BaseRouter {
  private readonly telegramService = Container.get(TelegramService);

  public set = (router: Router) => {
    router.post(this.routes.telegram, this.middlewareService.accessTelegram, this.telegramService.webhooks);
  };
}
