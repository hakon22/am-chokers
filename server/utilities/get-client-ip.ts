import type { Request } from 'express';
import _ from 'lodash';

/**
 * Возвращает IP клиента из запроса (nginx выставляет X-Real-IP из $remote_addr)
 * @param request - Express request
 * @returns IP-адрес клиента или 0.0.0.0, если не определён
 */
export const getClientIpFromRequest = (request: Request): string => {
  const xRealIp = request.headers['x-real-ip'];

  if (typeof xRealIp === 'string' && !_.isEmpty(xRealIp)) {
    return xRealIp.trim();
  }

  const { remoteAddress } = request.socket;

  if (!_.isNil(remoteAddress) && !_.isEmpty(remoteAddress)) {
    return remoteAddress;
  }

  return '0.0.0.0';
};
