import * as yup from 'yup';

import { OrderStatusEnum } from '@server/types/order/enums/order.status.enum';

export const queryOptionalSchema = yup.object().shape({
  itemGroupId: yup
    .number()
    .transform((value) => +value)
    .optional(),
  userId: yup
    .number()
    .transform((value) => +value)
    .optional(),
  withDeleted: yup
    .mixed<boolean>()
    .transform((value) => {
      if (value === 'true') return true;
      if (value === 'false') return false;
      return undefined;
    })
    .optional(),
  withUser: yup
    .mixed<boolean>()
    .transform((value) => {
      if (value === 'true') return true;
      if (value === 'false') return false;
      return undefined;
    })
    .optional(),
});

export const queryIdOptionalSchema = yup.object().shape({
  id: yup
    .number()
    .transform((value) => +value)
    .optional(),
}).concat(queryOptionalSchema);

export const queryIdRequiredSchema = yup.object().shape({
  id: yup
    .number()
    .transform((value) => +value)
    .required(),
}).concat(queryOptionalSchema);

export const paramsIdSchema = yup.object().shape({
  id: yup
    .number()
    .transform((value) => +value)
    .required(),
});

export const booleanSchema = yup
  .mixed<boolean>()
  .transform((value) => ['true', true].includes(value) ? true : false)
  .optional();

export const queryPaginationSchema = yup.object().shape({
  limit: yup
    .number()
    .integer()
    .transform((value) => +value)
    .min(0)
    .required(),
  offset: yup
    .number()
    .integer()
    .transform((value) => +value)
    .min(0)
    .required(),
});

export const queryPaginationWithParams = queryPaginationSchema.concat(
  yup.object().shape({
    withDeleted: booleanSchema,
    showAccepted: booleanSchema,
    search: yup.string().optional(),
  }),
);

export const queryOrderParams = queryPaginationSchema.concat(
  yup.object().shape({
    withDeleted: booleanSchema,
    statuses: yup.array(yup.string().oneOf(Object.values(OrderStatusEnum)).defined()),
  }),
);

export const queryNameParams = yup.object().shape({
  name: yup.string().required(),
});

export const queryPromotionalParams = yup.object().shape({
  withDeleted: booleanSchema,
  withExpired: booleanSchema,
  name: yup.string().optional(),
});

export const querySearchParams = yup.object().shape({
  withDeleted: booleanSchema,
  search: yup.string(),
});

export const queryUploadImageParams = yup.object().shape({
  cover: booleanSchema,
  coverCollection: booleanSchema,
});

export const queryItemsParams = queryPaginationWithParams.concat(
  yup.object().shape({
    groupCode: yup.string().optional(),
    groupIds: yup.array(yup.number().optional()),
    collectionIds: yup.array(yup.number().optional()),
    compositionIds: yup.array(yup.number().optional()),
    from: yup.number().optional(),
    to: yup.number().optional(),
    new: booleanSchema,
    bestseller: booleanSchema,
  }),
);

export const queryTranslateNameParams = yup.object().shape({
  translateName: yup.string().required(),
});

export const queryCodeParams = yup.object().shape({
  code: yup.string().required(),
});
