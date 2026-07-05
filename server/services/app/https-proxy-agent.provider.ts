import { HttpsProxyAgent } from 'https-proxy-agent';
import _ from 'lodash';
import { Singleton } from 'typescript-ioc';

/**
 * Предоставляет общий экземпляр HTTPS-прокси-агента для исходящих запросов сервера
 */
@Singleton
export class HttpsProxyAgentProvider {
  private readonly httpsProxyAgent: HttpsProxyAgent<string> | null;

  constructor() {
    const { PROXY_USER: proxyUser, PROXY_PASS: proxyPass, PROXY_HOST: proxyHost } = process.env;

    if (_.isEmpty(proxyUser) || _.isEmpty(proxyPass) || _.isEmpty(proxyHost)) {
      this.httpsProxyAgent = null;
      return;
    }

    this.httpsProxyAgent = new HttpsProxyAgent(`http://${proxyUser}:${proxyPass}@${proxyHost}`);
  }

  /**
   * Возвращает общий HTTPS-прокси-агент, если PROXY_* заданы в окружении
   * @returns экземпляр HttpsProxyAgent или null, если прокси не настроен
   */
  public getHttpsProxyAgent = (): HttpsProxyAgent<string> | null => this.httpsProxyAgent;
}
