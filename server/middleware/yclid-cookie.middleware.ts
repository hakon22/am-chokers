import type { NextFunction, Request, Response } from 'express';
import _ from 'lodash';

import { yclidCookieConfig } from '@shared/yclid-cookie-config';

/**
 * Сохраняет yclid из query-строки в first-party cookie на 90 дней
 * @param req - HTTP-запрос Express
 * @param response - HTTP-ответ Express
 * @param next - переход к следующему middleware
 */
export const yclidCookieMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const { yclid: yclidFromQuery } = req.query;

  if (!_.isString(yclidFromQuery) || _.isEmpty(yclidFromQuery)) {
    next();
    return;
  }

  res.cookie(yclidCookieConfig.cookieName, yclidFromQuery, {
    maxAge: yclidCookieConfig.maxAgeSeconds * 1000,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });

  next();
};
