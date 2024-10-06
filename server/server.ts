import 'dotenv/config';
import express from 'express';
import next from 'next';
import cors from 'cors';
import passport from 'passport';
import { tokenChecker } from '@server/auth/token.checker';
import { refreshTokenChecker } from '@server/auth/refresh.token.checker';
import router from '@server/api';
import '@server/services';

const { NEXT_PUBLIC_PORT: port = 3001, NODE_ENV } = process.env;

const dev = NODE_ENV !== 'production';

const app = next({ dev });
const handle = app.getRequestHandler();

const server = express();

app.prepare().then(() => {
  tokenChecker(passport);
  refreshTokenChecker(passport);

  server.use(express.json());
  server.use(cors());
  server.use(passport.initialize());
  server.use(router);

  server.all('*', (req, res) => handle(req, res));

  server.listen(port, () => console.log(`Server is online on port: ${port}`));
});
