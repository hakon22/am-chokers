import { Container, Singleton } from 'typescript-ioc';
import type { Router } from 'express';

import { BaseRouter } from '@server/routes/base.route';
import { TelegramService } from '@server/services/integration/telegram.service';
import { GptService } from '@server/services/integration/gpt.service';
import { AcquiringController } from '@server/controllers/acquiring/acquiring.controller';

@Singleton
export class IntegrationRoute extends BaseRouter {
  private readonly telegramService = Container.get(TelegramService);

  private readonly acquiringController = Container.get(AcquiringController);

  private readonly gptService = Container.get(GptService);

  public set = (router: Router) => {
    router.post(this.routes.integration.telegram.webhook, this.middlewareService.accessTelegram, this.telegramService.webhooks);
    router.post(this.routes.integration.yookassa.webhook, this.middlewareService.authorizationYookassaMiddleware, this.acquiringController.checkYookassaOrder);
    router.get(this.routes.integration.gpt.generateDescription(), this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.gptService.generateDescription);
    router.post(this.routes.integration.gpt.generateDescriptionWithoutItem, this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.gptService.generateDescriptionWithoutItem);
  };
}
