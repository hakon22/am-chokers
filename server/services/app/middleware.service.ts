import { Singleton } from 'typescript-ioc';
import passport from 'passport';
import type { Request, Response, NextFunction } from 'express';

import { CheckIpService } from '@server/services/app/check-ip.service';
import { UserRoleEnum } from '@server/types/user/enums/user.role.enum';
import type { PassportRequestInterface } from '@server/types/user/user.request.interface';

@Singleton
export class MiddlewareService {
  private readonly checkIpService: CheckIpService;

  constructor() {
    this.checkIpService = new CheckIpService();
  }

  private getClientIp = (req: Request) => {
    const xForwardedFor = req.headers['x-forwarded-for'];
    if (xForwardedFor && !Array.isArray(xForwardedFor)) {
      return xForwardedFor.split(',')[0].trim();
    }
    return req.socket.remoteAddress;
  };

  public accessTelegram = (req: Request, res: Response, next: NextFunction) => {
    const subnets = [
      '91.108.4.0/22',
      '91.105.192.0/23',
      '91.108.8.0/22',
      '91.108.12.0/22',
      '91.108.16.0/22',
      '91.108.20.0/22',
      '91.108.56.0/23',
      '91.108.58.0/23',
      '95.161.64.0/20',
      '149.154.160.0/20',
      '149.154.160.0/21',
      '149.154.168.0/22',
      '149.154.172.0/22',
      '185.76.151.0/24',
    ];

    if (subnets.find((subnet) => this.checkIpService.isCorrectIP(this.getClientIp(req) as string, subnet))) {
      next();
      return;
    }

    res.status(401).json({ message: 'Unauthorized' });
  };

  public authorizationYookassaMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const subnets = [
      '185.71.76.0/27',
      '185.71.77.0/27',
      '77.75.153.0/25',
      '77.75.154.128/25',
    ];
    const ips = [
      '77.75.156.11',
      '77.75.156.35',
    ];

    const ip = this.getClientIp(req) as string;

    if (ips.includes(ip) || subnets.find(subnet => this.checkIpService.isCorrectIP(ip, subnet))) {
      return next();
    }

    res.status(401).json({ message: 'Unauthorized' });
  };

  public optionalJwtAuth = (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate('jwt', { session: false }, (err: any, user: any) => {
      if (err) {
        return next(err);
      }
      req.user = user ?? { id: null };
      next();
    })(req, res, next);
  };

  public jwtToken = passport.authenticate('jwt', { session: false });

  public checkAdminAccess = (req: Request, res: Response, next: NextFunction) => {
    try {
      const { role } = req.user as PassportRequestInterface;
      if (role === UserRoleEnum.ADMIN) {
        next();
      } else {
        res.sendStatus(403);
      }
    } catch (e) {
      console.log(e);
      res.sendStatus(500);
    }
  };
}
