import _ from 'lodash';
import { Singleton } from 'typescript-ioc';
import type { Request, Response } from 'express';

@Singleton
export class AuthCookieService {
  private readonly cookieMaxAgeSeconds = 60 * 60 * 24 * 30;

  private readonly cookiePath = '/';

  /**
   * Возвращает имя cookie refresh-токена
   * @returns имя cookie из env или значение по умолчанию
   */
  private getCookieName = (): string =>
    process.env.NEXT_PUBLIC_STORAGE_KEY?.trim() || 'am-chokers-refresh-token';

  /**
   * Формирует опции res.cookie для refresh-токена
   * @returns опции httpOnly cookie для Express
   */
  private getExpressCookieOptions = (): {
    httpOnly: boolean;
    secure: boolean;
    sameSite: 'lax';
    path: string;
    maxAge: number;
  } => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: this.cookiePath,
    maxAge: this.cookieMaxAgeSeconds * 1000,
  });

  /**
   * Извлекает refresh-токен из заголовка Cookie HTTP-запроса
   * @param cookieHeader - значение заголовка Cookie
   * @returns refresh-токен или undefined, если cookie отсутствует
   */
  public getRefreshTokenFromCookieHeader = (cookieHeader: string | undefined): string | undefined => {
    if (!cookieHeader || _.isEmpty(cookieHeader)) {
      return undefined;
    }

    const cookieName = this.getCookieName();
    const cookiePairs = cookieHeader.split(';');

    for (const cookiePair of cookiePairs) {
      const trimmedPair = cookiePair.trim();
      const separatorIndex = trimmedPair.indexOf('=');

      if (separatorIndex === -1) {
        continue;
      }

      const currentCookieName = trimmedPair.slice(0, separatorIndex);
      const cookieValue = trimmedPair.slice(separatorIndex + 1);

      if (currentCookieName === cookieName && cookieValue) {
        return decodeURIComponent(cookieValue);
      }
    }

    return undefined;
  };

  /**
   * Извлекает refresh-токен из cookie HTTP-запроса Express
   * @param req - HTTP-запрос Express
   * @returns refresh-токен или undefined, если cookie отсутствует
   */
  public getRefreshTokenFromRequest = (req: Request): string | undefined =>
    this.getRefreshTokenFromCookieHeader(req.headers.cookie);

  /**
   * Записывает refresh-токен в httpOnly cookie ответа
   * @param res - HTTP-ответ Express
   * @param refreshToken - JWT refresh-токен пользователя
   */
  public setRefreshTokenCookie = (res: Response, refreshToken: string): void => {
    res.cookie(this.getCookieName(), refreshToken, this.getExpressCookieOptions());
  };

  /**
   * Удаляет refresh-токен из cookie ответа
   * @param res - HTTP-ответ Express
   */
  public clearRefreshTokenCookie = (res: Response): void => {
    const { path, sameSite, secure } = this.getExpressCookieOptions();
    res.clearCookie(this.getCookieName(), {
      path,
      httpOnly: true,
      sameSite,
      secure,
    });
  };
}
