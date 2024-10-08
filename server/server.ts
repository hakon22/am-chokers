import 'dotenv/config';
import express, { type Express } from 'express';
import next from 'next';
import type { NextServer } from 'next/dist/server/next';
import cors from 'cors';
import passport from 'passport';
import { Singleton } from 'typescript-ioc';

import { TokenService } from '@server/services/user/token.service';
import { DatabaseService } from '@server/db/database.service';
import { Router } from '@server/router';

const { NEXT_PUBLIC_PORT: port = 3001, NODE_ENV } = process.env;

@Singleton
class Server {
  private dev: boolean;

  private app: NextServer;

  private handle: any;

  private server: Express;

  constructor() {
    this.dev = NODE_ENV !== 'production';
    this.app = next({ dev: this.dev });
    this.handle = this.app.getRequestHandler();
    this.server = express();
  }

  public start = () => {
    this.app.prepare().then(() => {
      const tokenService = new TokenService();
      const databaseService = new DatabaseService();
      const router = new Router();

      tokenService.tokenChecker(passport);
      tokenService.refreshTokenChecker(passport);

      router.set();

      this.server.use(express.json());
      this.server.use(cors());
      this.server.use(passport.initialize());
      this.server.use(router.get());

      this.server.all('*', (req, res) => this.handle(req, res));

      databaseService.init();

      this.server.listen(port, () => console.log(`Server is online on port: ${port}`));
    });
  };
}

const server = new Server();

server.start();
