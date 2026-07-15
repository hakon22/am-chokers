import { Container, Singleton } from 'typescript-ioc';
import type { Router } from 'express';

import { BaseRouter } from '@server/routes/base.route';
import { TelegramBotService } from '@server/services/integration/telegram-bot.service';
import { TelegramWebAppScriptService } from '@server/services/integration/telegram-web-app-script.service';
import { TelegramMiniAppBootstrapLogService } from '@server/services/integration/telegram-mini-app-bootstrap-log.service';
import { GptService } from '@server/services/integration/gpt.service';
import { CDEKService } from '@server/services/delivery/cdek.service';
import { AcquiringController } from '@server/controllers/acquiring/acquiring.controller';
import { TryOnController } from '@server/controllers/integration/try-on.controller';
import { ImageService } from '@server/services/storage/image.service';

@Singleton
export class IntegrationRoute extends BaseRouter {
  private readonly telegramBotService = Container.get(TelegramBotService);

  private readonly telegramWebAppScriptService = Container.get(TelegramWebAppScriptService);

  private readonly telegramMiniAppBootstrapLogService = Container.get(TelegramMiniAppBootstrapLogService);

  private readonly acquiringController = Container.get(AcquiringController);

  private readonly gptService = Container.get(GptService);

  private readonly tryOnController = Container.get(TryOnController);

  private readonly imageService = Container.get(ImageService);

  private readonly CDEKService = Container.get(CDEKService);

  public set = (router: Router) => {
    router.get(this.routes.integration.telegram.webAppScript, this.telegramWebAppScriptService.serveTelegramWebAppScript);
    router.post(this.routes.integration.telegram.bootstrapLog, this.telegramMiniAppBootstrapLogService.logBootstrapEvent);
    router.post(this.routes.integration.telegram.webhook, this.middlewareService.accessTelegram, this.telegramBotService.handleWebhook);
    router.post(this.routes.integration.yookassa.webhook, this.middlewareService.authorizationYookassaMiddleware, this.acquiringController.checkYookassaOrder);
    router.get(this.routes.integration.gpt.generateDescription(), this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.gptService.generateDescription);
    router.post(this.routes.integration.gpt.generateDescriptionWithoutItem, this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.gptService.generateDescriptionWithoutItem);
    router.post(this.routes.integration.tryOn.create, this.middlewareService.optionalJwtAuth, this.tryOnController.createTryOn);
    router.post(this.routes.integration.tryOn.rating, this.middlewareService.optionalJwtAuth, this.tryOnController.setRating);
    router.post(this.routes.integration.tryOn.upload, this.middlewareService.optionalJwtAuth, this.imageService.upload(), this.tryOnController.uploadUserImage);
    router.post(this.routes.integration.cdek.webhooks, this.middlewareService.accessCDEK, this.CDEKService.webhooks);
    router.get(this.routes.integration.cdek.root, this.CDEKService.switch);
    router.post(this.routes.integration.cdek.root, this.CDEKService.switch);
  };
}
