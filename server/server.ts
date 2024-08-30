import 'dotenv/config';
import express from 'express';
import next from 'next';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import passport from 'passport';
import tokenChecker from '@server/auth/tokenChecker.js';
import refreshTokenChecker from '@server/auth/refreshTokenChecker.js';
import router from '@server/api.js';
import { connectToDb } from '@server/db/connect.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

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

export const uploadFilesPath = NODE_ENV === 'development'
  ? join(__dirname, '..', 'src', 'images')
  : join(__dirname, '..', '.next', 'static', 'media');

await connectToDb();
