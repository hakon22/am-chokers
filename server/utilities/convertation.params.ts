import * as yup from 'yup';

import { OrderStatusEnum } from '@server/types/order/enums/order.status.enum';
import { ItemSortEnum } from '@server/types/item/enums/item.sort.enum';
import { MessageTypeEnum } from '@server/types/message/enums/message.type.enum';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';

export const userOptionalParamsSchema = yup.object().shape({
  userId: yup
    .number()
    .transform((value) => +value)
    .optional(),
});

export const queryOptionalSchema = userOptionalParamsSchema.concat(yup.object().shape({
  itemGroupId: yup
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
}));

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
  userOptionalParamsSchema.concat(yup.object().shape({
    withDeleted: booleanSchema,
    showAccepted: booleanSchema,
    search: yup.string().optional(),
  })),
);

export const queryOrderParams = queryPaginationSchema.concat(
  userOptionalParamsSchema.concat(yup.object().shape({
    withDeleted: booleanSchema,
    statuses: yup.array(yup.string().oneOf(Object.values(OrderStatusEnum)).defined()),
  })),
);

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
    colorIds: yup.array(yup.number().optional()),
    from: yup.number().optional(),
    to: yup.number().optional(),
    new: booleanSchema,
    bestseller: booleanSchema,
    sort: yup.string().oneOf(Object.values(ItemSortEnum)).optional(),
  }),
);

export const queryTranslateNameParams = yup.object().shape({
  translateName: yup.string().required(),
});

export const isFullParams = yup.object().shape({
  isFull: booleanSchema,
});

export const queryCodeParams = yup.object().shape({
  code: yup.string().required(),
});

export const queryMessageReportParams = queryPaginationSchema.concat(
  userOptionalParamsSchema.concat(yup.object().shape({
    phone: yup.string().optional(),
    onlyUnsent: booleanSchema,
    types: yup.array(yup.string().oneOf(Object.values(MessageTypeEnum)).defined()),
  })),
);

export const queryLanguageParams = yup.object().shape({
  lang: yup.string().oneOf(Object.values(UserLangEnum)),
});
