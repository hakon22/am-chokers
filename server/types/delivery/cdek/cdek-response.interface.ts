import type { CDEKErrorInterface } from '@server/types/delivery/cdek/cdek-error.interface';
import type { CDEKResponseStateEnum } from '@server/types/delivery/cdek/enums/cdek-response-state.enum';

enum CDEKResponseTypeEnum {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  AUTH = 'AUTH',
  GET = 'GET',
  CREATE_CLIENT_RETURN = 'CREATE_CLIENT_RETURN',
}

export interface CDEKResponseRequestInterface {
  request_uuid?: string;
  type: CDEKResponseTypeEnum;
  state: CDEKResponseStateEnum;
  date_time: string;
  errors?: CDEKErrorInterface[];
  warnings?: CDEKErrorInterface[];
}

export interface CDEKResponseInterface {
  entity?: {
    uuid?: string;
    cdek_number?: string;
    number?: string;
  };
  requests: CDEKResponseRequestInterface[];
}
