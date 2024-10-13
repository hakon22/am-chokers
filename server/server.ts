import 'dotenv/config';
import 'reflect-metadata';
import express from 'express';
import next from 'next';
import cors from 'cors';
import passport from 'passport';
import { Container } from 'typescript-ioc';

import { RouterService } from '@server/services/app/router.service';
import { DatabaseService } from '@server/db/database.service';
import { TokenService } from '@server/services/user/token.service';
import { RedisService } from '@server/db/redis.service';

const { NEXT_PUBLIC_PORT: port = 3001, NODE_ENV } = process.env;

class Server {
  private readonly routerService = Container.get(RouterService);

  private readonly tokenService = Container.get(TokenService);

  private readonly databaseService = Container.get(DatabaseService);

  private readonly redisService = Container.get(RedisService);

  private dev = NODE_ENV !== 'production';

  private app = next({ dev: this.dev });

  private handle = this.app.getRequestHandler();

  private server = express();

  public start = () => {
    this.app.prepare().then(() => {
      this.routerService.set();

      this.tokenService.tokenChecker(passport);
      this.tokenService.refreshTokenChecker(passport);

      this.server.use(express.json());
      this.server.use(cors());
      this.server.use(passport.initialize());
      this.server.use(this.routerService.get());

      this.server.all('*', (req, res) => this.handle(req, res));

      this.databaseService.init();
      this.redisService.init();

      this.server.listen(port, () => console.log(`Server is online on port: ${port}`));
    });
  };
}

const server = new Server();

server.start();
