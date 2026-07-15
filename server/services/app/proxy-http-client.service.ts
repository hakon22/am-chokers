import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios';
import _ from 'lodash';
import { Container, Singleton } from 'typescript-ioc';

import { HttpsProxyAgentProvider } from '@server/services/app/https-proxy-agent.provider';
import { LoggerService } from '@server/services/app/logger.service';

/** Универсальный HTTP-клиент для исходящих запросов через HTTPS-прокси (PROXY_* env) */
@Singleton
export class ProxyHttpClientService {
  private readonly TAG = 'ProxyHttpClientService';

  private readonly loggerService = Container.get(LoggerService);

  private readonly httpsProxyAgentProvider = Container.get(HttpsProxyAgentProvider);

  /**
   * POST через HTTPS-прокси
   * @param url - полный URL
   * @param body - тело запроса
   * @param config - axios config без httpsAgent
   * @returns ответ axios
   */
  public post = async <T = unknown>(url: string, body?: unknown, config: AxiosRequestConfig = {}): Promise<AxiosResponse<T>> => {
    const startedAt = Date.now();
    const httpsProxyAgent = this.requireHttpsProxyAgent();

    try {
      const response = await axios.post<T>(url, body, {
        ...config,
        httpsAgent: httpsProxyAgent,
        proxy: false,
        timeout: config.timeout ?? 30000,
      });

      this.loggerService.info(this.TAG, 'POST via proxy', {
        endpoint: url,
        proxy: true,
        duration: Date.now() - startedAt,
        status: response.status,
      });

      return response;
    } catch (error) {
      this.logAxiosError('POST', url, startedAt, error);
      throw error;
    }
  };

  /**
   * PUT через HTTPS-прокси
   * @param url - полный URL
   * @param body - тело (binary Buffer / ArrayBuffer)
   * @param config - axios config без httpsAgent
   * @returns ответ axios
   */
  public put = async <T = unknown>(url: string, body?: unknown, config: AxiosRequestConfig = {}): Promise<AxiosResponse<T>> => {
    const startedAt = Date.now();
    const httpsProxyAgent = this.requireHttpsProxyAgent();

    try {
      const response = await axios.put<T>(url, body, {
        ...config,
        httpsAgent: httpsProxyAgent,
        proxy: false,
        timeout: config.timeout ?? 60000,
      });

      this.loggerService.info(this.TAG, 'PUT via proxy', {
        endpoint: url,
        proxy: true,
        duration: Date.now() - startedAt,
        status: response.status,
      });

      return response;
    } catch (error) {
      this.logAxiosError('PUT', url, startedAt, error);
      throw error;
    }
  };

  /**
   * GET через HTTPS-прокси
   * @param url - полный URL
   * @param config - axios config без httpsAgent
   * @returns ответ axios
   */
  public get = async <T = unknown>(url: string, config: AxiosRequestConfig = {}): Promise<AxiosResponse<T>> => {
    const startedAt = Date.now();
    const httpsProxyAgent = this.requireHttpsProxyAgent();

    try {
      const response = await axios.get<T>(url, {
        ...config,
        httpsAgent: httpsProxyAgent,
        proxy: false,
        timeout: config.timeout ?? 30000,
      });

      this.loggerService.info(this.TAG, 'GET via proxy', {
        endpoint: url,
        proxy: true,
        duration: Date.now() - startedAt,
        status: response.status,
      });

      return response;
    } catch (error) {
      this.logAxiosError('GET', url, startedAt, error);
      throw error;
    }
  };

  /**
   * Скачивает бинарные данные через прокси
   * @param url - URL файла
   * @returns ArrayBuffer содержимого
   */
  public downloadBinary = async (url: string): Promise<ArrayBuffer> => {
    const response = await this.get<ArrayBuffer>(url, {
      responseType: 'arraybuffer',
      timeout: 60000,
    });
    return response.data;
  };

  /**
   * Возвращает обязательный HTTPS-прокси агент
   * @returns httpsProxyAgent
   */
  private requireHttpsProxyAgent = () => {
    const httpsProxyAgent = this.httpsProxyAgentProvider.getHttpsProxyAgent();

    if (_.isNil(httpsProxyAgent)) {
      throw new Error('HTTPS proxy is required for proxied outbound requests (PROXY_* env)');
    }

    return httpsProxyAgent;
  };

  /**
   * Логирует ошибку axios с status и response body
   * @param method - HTTP-метод
   * @param url - URL запроса
   * @param startedAt - timestamp начала
   * @param error - ошибка
   * @returns void
   */
  private logAxiosError = (method: string, url: string, startedAt: number, error: unknown): void => {
    if (axios.isAxiosError(error)) {
      this.loggerService.error(this.TAG, `${method} via proxy failed`, {
        endpoint: url,
        duration: Date.now() - startedAt,
        status: error.response?.status,
        responseData: error.response?.data,
        message: error.message,
      });
      return;
    }

    this.loggerService.error(this.TAG, error);
  };
}
