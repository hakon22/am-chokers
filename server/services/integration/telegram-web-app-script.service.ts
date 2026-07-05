import axios from 'axios';
import _ from 'lodash';
import { Container, Singleton } from 'typescript-ioc';
import type { Request, Response } from 'express';

import { HttpsProxyAgentProvider } from '@server/services/app/https-proxy-agent.provider';
import { LoggerService } from '@server/services/app/logger.service';

const TELEGRAM_WEB_APP_SCRIPT_URL = 'https://telegram.org/js/telegram-web-app.js';

const CACHE_TTL_MILLISECONDS = 60 * 60 * 1000;

interface TelegramWebAppScriptCacheEntry {
  body: string;
  fetchedAtMilliseconds: number;
}

@Singleton
export class TelegramWebAppScriptService {
  private readonly TAG = 'TelegramWebAppScriptService';

  private readonly loggerService = Container.get(LoggerService);

  private readonly httpsProxyAgentProvider = Container.get(HttpsProxyAgentProvider);

  private cacheEntry: TelegramWebAppScriptCacheEntry | null = null;

  /**
   * Возвращает тело скрипта Telegram Web App SDK из кэша или загружает с telegram.org
   * @returns JavaScript-текст SDK
   */
  private getScriptBody = async (): Promise<string> => {
    const nowMilliseconds = Date.now();
    const { cacheEntry } = this;

    if (
      !_.isNil(cacheEntry)
      && nowMilliseconds - cacheEntry.fetchedAtMilliseconds < CACHE_TTL_MILLISECONDS
    ) {
      const cacheAgeMilliseconds = nowMilliseconds - cacheEntry.fetchedAtMilliseconds;

      this.loggerService.info(
        this.TAG,
        `telegram-web-app.js cache hit, age=${cacheAgeMilliseconds} ms, size=${cacheEntry.body.length} bytes`,
      );

      return cacheEntry.body;
    }

    const httpsProxyAgent = this.httpsProxyAgentProvider.getHttpsProxyAgent();
    const fetchStartedAtMilliseconds = Date.now();

    try {
      const { data } = await axios.get<string>(TELEGRAM_WEB_APP_SCRIPT_URL, {
        responseType: 'text',
        timeout: 15000,
        ...(httpsProxyAgent ? { httpsAgent: httpsProxyAgent, proxy: false } : {}),
      });

      if (_.isEmpty(data)) {
        throw new Error('Empty telegram-web-app.js response body');
      }

      const fetchDurationMilliseconds = Date.now() - fetchStartedAtMilliseconds;

      this.loggerService.info(
        this.TAG,
        `telegram-web-app.js fetched from upstream, proxy=${!_.isNil(httpsProxyAgent)}, duration=${fetchDurationMilliseconds} ms, size=${data.length} bytes`,
      );

      this.cacheEntry = {
        body: data,
        fetchedAtMilliseconds: nowMilliseconds,
      };

      return data;
    } catch (error) {
      const fetchDurationMilliseconds = Date.now() - fetchStartedAtMilliseconds;

      this.loggerService.error(
        this.TAG,
        `Failed to fetch telegram-web-app.js from upstream, proxy=${!_.isNil(httpsProxyAgent)}, duration=${fetchDurationMilliseconds} ms`,
        error,
      );

      if (!_.isNil(cacheEntry)) {
        this.loggerService.warn(this.TAG, 'Serving stale cached telegram-web-app.js');
        return cacheEntry.body;
      }

      throw error;
    }
  };

  /**
   * Отдаёт проксированный telegram-web-app.js клиенту Mini App
   * @param _req - HTTP-запрос Express
   * @param res - HTTP-ответ Express
   * @returns Promise после отправки тела скрипта
   */
  public serveTelegramWebAppScript = async (_req: Request, res: Response): Promise<void> => {
    const requestStartedAtMilliseconds = Date.now();
    const httpsProxyAgent = this.httpsProxyAgentProvider.getHttpsProxyAgent();

    this.loggerService.info(this.TAG, 'Serving telegram-web-app.js request');

    try {
      const scriptBody = await this.getScriptBody();

      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.send(scriptBody);
    } catch (error) {
      const requestDurationMilliseconds = Date.now() - requestStartedAtMilliseconds;

      this.loggerService.error(
        this.TAG,
        `Failed to serve telegram-web-app.js, proxy=${!_.isNil(httpsProxyAgent)}, duration=${requestDurationMilliseconds} ms`,
        error,
      );
      res.status(502).send('// telegram web app script unavailable');
    }
  };
}
