import { Container } from 'typescript-ioc';

import { UserEntity } from '@server/db/entities/user.entity';
import { AuthCookieService } from '@server/services/user/auth-cookie.service';
import { TokenService } from '@server/services/user/token.service';

/**
 * Определяет, является ли пользователь администратором, по refresh-токену из cookie SSR-запроса
 * @param cookieHeader - значение req.headers.cookie
 * @returns true, если JWT валиден и пользователь с ролью ADMIN
 */
export const getRequestIsAdminFromCookie = async (cookieHeader: string | undefined): Promise<boolean> => {
  const authCookieService = Container.get(AuthCookieService);
  const refreshToken = authCookieService.getRefreshTokenFromCookieHeader(cookieHeader);

  if (!refreshToken) {
    return false;
  }

  const tokenService = Container.get(TokenService);
  const tokenPayload = tokenService.verifyRefreshToken(refreshToken);

  if (!tokenPayload) {
    return false;
  }

  const { id } = tokenPayload;
  const user = await UserEntity.findOne({
    where: { id },
    select: ['id', 'role'],
  });

  return Boolean(user?.isAdmin);
};
