import 'dotenv/config';
import 'reflect-metadata';
import express from 'express';
import next from 'next';
import cors from 'cors';
import passport from 'passport';
import { Telegraf } from 'telegraf';
import { Container } from 'typescript-ioc';

import { RouterService } from '@server/services/app/router.service';
import { BaseService } from '@server/services/app/base.service';
import { ItemService } from '@server/services/item/item.service';
import { CDEKService } from '@server/services/delivery/cdek.service';
import { routes } from '@/routes';

const {
  NEXT_PUBLIC_PORT: port = 3001, TELEGRAM_TOKEN, NEXT_PUBLIC_PRODUCTION_HOST, NODE_ENV,
} = process.env;

class Server extends BaseService {
  private readonly routerService = Container.get(RouterService);

  private readonly itemService = Container.get(ItemService);

  private readonly CDEKService = Container.get(CDEKService);

  private readonly telegramBot = new Telegraf(TELEGRAM_TOKEN ?? '');

  private dev = NODE_ENV !== 'production';

  private app = next({ dev: this.dev });

  private handle = this.app.getRequestHandler();

  private server = express();

  private init = async () => {
    await this.databaseService.init();
    await this.redisService.init({ withoutSubscribles: true });
    await this.CDEKService.init();
    await this.itemService.synchronizationCache();

    if (!this.dev) {
      await this.telegramBot.telegram.setMyCommands([{
        command: 'start',
        description: '🔃 Запуск бота',
      }]);
      await this.telegramBot.telegram.setWebhook(`${NEXT_PUBLIC_PRODUCTION_HOST}${routes.integration.telegram.webhook}`);
    }
  };

  public start = async () => {
    await this.init();

    this.app.prepare().then(() => {
      this.routerService.set();

      this.tokenService.tokenChecker(passport);
      this.tokenService.refreshTokenChecker(passport);

      this.server.use(express.json());
      this.server.use(cors());
      this.server.use(passport.initialize());
      this.server.use(this.routerService.get());

      this.server.all('*', (req, res) => this.handle(req, res));

      this.server.listen(port, () => console.log(`Server is online on port: ${port}`));
    });
  };
}

const server = new Server();

server.start();
