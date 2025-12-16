/* eslint-disable no-underscore-dangle */
import axios, { type AxiosInstance } from 'axios';
import { Singleton } from 'typescript-ioc';
import type { Request, Response } from 'express';

import { BaseService } from '@server/services/app/base.service';
import { DeliveryCredentialsEntity } from '@server/db/entities/delivery.credentials.entity';
import { DeliveryTypeEnum } from '@server/types/delivery/enums/delivery.type.enum';

@Singleton
export class CDEKService extends BaseService {
  private login: string;

  private secret: string;

  private baseUrl: string;

  private authToken: string;

  private axiosInstance: AxiosInstance;

  private TAG = 'CDEKService';

  private isDevelopment = process.env.NODE_ENV === 'development';

  public init = async () => {
    const credential = await DeliveryCredentialsEntity.findOne({ where: { type: DeliveryTypeEnum.CDEK, isDevelopment: this.isDevelopment } });
    if (!credential) {
      throw new Error('Нет учётной записи для СДЭК');
    }

    this.login = credential.login;
    this.secret = credential.password;
    this.baseUrl = credential.url;

    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
    });

    this.axiosInstance.interceptors.response.use((response) => response, async (error) => {
      const originalRequest = error.config;

      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          await this.getAuthToken();

          originalRequest.headers.Authorization = `Bearer ${this.authToken}`;

          return this.axiosInstance(originalRequest);
        } catch (refreshError) {
          return Promise.reject(refreshError);
        }
      }
      return Promise.reject(error);
    });
  };

  private getAuthToken = async () => {        
    try {
      this.loggerService.info(this.TAG, 'Access token refresh...');
      const response = await this.axiosInstance.post('/oauth/token', {
        grant_type: 'client_credentials',
        client_id: this.login,
        client_secret: this.secret,
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      if (!response.data?.access_token) {
        throw new Error('Server not authorized to CDEK API');
      }

      this.axiosInstance = axios.create({
        baseURL: this.baseUrl,
        headers: {
          Authorization: `Bearer ${response.data.access_token}`,
        },
      });

      this.authToken = response.data.access_token;
      this.loggerService.info(this.TAG, 'Access token refresh successfully');
    } catch (e) {
      this.loggerService.error(this.TAG, e);
      throw new Error(`Auth failed: ${e}`);
    }
  };

  public getOffices = async (query: any) => {  
    try {
      const response = await this.axiosInstance.get('/deliverypoints', {
        params: query,
      });

      return response.data;
    } catch (e) {
      this.loggerService.error(this.TAG, e);
      throw new Error(`Get offices failed: ${e}`);
    }
  };

  public switch = async (req: Request, res: Response) => {  
    try {
      if (!this.authToken) {
        await this.getAuthToken();
      }

      if (req.query?.action === 'offices') {
        return res.json(await this.getOffices(req.query));
      }
      if (req.body?.action === 'calculate') {
        return res.json(await this.calculate(req.body));
      }
    } catch (e) {
      this.loggerService.error(this.TAG, e);
      throw new Error(`Switch method failed: ${e}`);
    }
  };

  public calculate = async (body: any) => {
    try {
      const response = await this.axiosInstance.post('/calculator/tarifflist', body);

      return response.data;
    } catch (e) {
      this.loggerService.error(this.TAG, e);
      throw new Error(`Calculate failed: ${e}`);
    }
  };
}
