import { Container, Singleton } from 'typescript-ioc';
import type { Router } from 'express';

import { BaseRouter } from '@server/routes/base.route';
import { TelegramBotService } from '@server/services/integration/telegram-bot.service';
import { GptService } from '@server/services/integration/gpt.service';
import { CDEKService } from '@server/services/delivery/cdek.service';
import { AcquiringController } from '@server/controllers/acquiring/acquiring.controller';

@Singleton
export class IntegrationRoute extends BaseRouter {
  private readonly telegramBotService = Container.get(TelegramBotService);

  private readonly acquiringController = Container.get(AcquiringController);

  private readonly gptService = Container.get(GptService);

  private readonly CDEKService = Container.get(CDEKService);

  public set = (router: Router) => {
    router.post(this.routes.integration.telegram.webhook, this.middlewareService.accessTelegram, this.telegramBotService.handleWebhook);
    router.post(this.routes.integration.yookassa.webhook, this.middlewareService.authorizationYookassaMiddleware, this.acquiringController.checkYookassaOrder);
    router.get(this.routes.integration.gpt.generateDescription(), this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.gptService.generateDescription);
    router.post(this.routes.integration.gpt.generateDescriptionWithoutItem, this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.gptService.generateDescriptionWithoutItem);
    router.post(this.routes.integration.cdek.webhooks, this.middlewareService.accessCDEK, this.CDEKService.webhooks);
    router.get(this.routes.integration.cdek.root, this.CDEKService.switch);
    router.post(this.routes.integration.cdek.root, this.CDEKService.switch);
  };
}
