import 'dotenv/config';
import 'reflect-metadata';
import express from 'express';
import next from 'next';
import cors from 'cors';
import passport from 'passport';
import { Container } from 'typescript-ioc';

import { RouterService } from '@server/services/app/router.service';
import { BaseService } from '@server/services/app/base.service';
import { ItemService } from '@server/services/item/item.service';
import { CDEKService } from '@server/services/delivery/cdek.service';
import { TelegramBotService } from '@server/services/integration/telegram-bot.service';

const { NEXT_PUBLIC_PORT: port = 3001, NODE_ENV } = process.env;

class Server extends BaseService {
  private readonly routerService = Container.get(RouterService);

  private readonly itemService = Container.get(ItemService);

  private readonly CDEKService = Container.get(CDEKService);

  private readonly telegramBotService = Container.get(TelegramBotService);

  private dev = NODE_ENV !== 'production';

  private app = next({ dev: this.dev });

  private handle = this.app.getRequestHandler();

  private server = express();

  private init = async () => {
    await this.databaseService.init();
    await this.redisService.init({ withoutSubscribles: true });
    await this.CDEKService.init({ withWebhooks: true });
    await this.itemService.synchronizationCache();
    await this.telegramBotService.init({ withWebhooks: true });
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
