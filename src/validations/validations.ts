import * as yup from 'yup';
import { setLocale, ObjectSchema, AnyObject } from 'yup';
import _ from 'lodash';

import i18n from '@/locales';
import { OrderStatusEnum } from '@server/types/order/enums/order.status.enum';

const { t } = i18n;

setLocale({
  mixed: {
    required: () => t('validation.required'),
    notOneOf: () => t('validation.uniq'),
    oneOf: () => t('validation.mastMatch'),
  },
  string: {
    min: () => t('validation.requirements'),
    max: () => t('validation.requirements'),
    length: () => t('validation.phone'),
  },
  number: {
    min: () => t('validation.notZero'),
  },
  array: {
    min: () => t('validation.emptyArray'),
  },
});

const validate: any = <T extends ObjectSchema<AnyObject>>(schema: ObjectSchema<T>) => ({
  async validator({ field }: { field: string }, value: unknown) {
    const obj = _.set({}, field, value);
    await schema.validateSyncAt(field, obj);
  },
  async serverValidator(data: typeof schema) {
    await schema.validate(data);
  },
});

export const uuidSchema = yup.object().shape({
  id: yup.string().uuid().required(),
});

export const uuidArraySchema = yup.array(yup.string().uuid().required()).required();

const numberSchema = yup.number().min(1).required();
const stringSchema = yup.string().required();

const requiredIdSchema = yup.object().shape({ id: numberSchema });

const phoneSchema = yup.string().trim().required().transform((value) => value.replace(/[^\d]/g, ''))
  .length(11)
  .matches(/^79.../, t('validation.phone'));

const confirmCodeSchema = yup.object().shape({
  code: stringSchema
    .transform((value) => value.replace(/[^\d]/g, ''))
    .test('code', t('validation.code'), (value) => value.length === 4),
});

const idSchema = yup
  .lazy((value) => (typeof value === 'object'
    ? requiredIdSchema
    : numberSchema
  ));

const confirmPhoneSchema = yup.object().shape({
  phone: phoneSchema,
});

const loginSchema = yup.object().shape({
  phone: phoneSchema,
  password: stringSchema,
});

const signupSchema = yup.object().shape({
  phone: phoneSchema,
  name: stringSchema
    .trim()
    .min(3)
    .max(20),
  password: yup
    .string()
    .required()
    .min(6, t('validation.passMin')),
  confirmPassword: yup.string().required(),
}, [
  ['password', 'password'],
]);

const profileSchema = yup.object().shape({
  phone: phoneSchema,
  name: stringSchema
    .trim()
    .min(3)
    .max(20),
  password: yup.string().when('password', ([value]) => {
    if (value) {
      return yup
        .string()
        .required()
        .min(6, t('validation.passMin'));
    }
    return yup
      .string()
      .transform((v, originalValue) => (v ? originalValue : null))
      .nullable()
      .optional();
  }),
  confirmPassword: yup.string().required(),
  oldPassword: yup.string().required().min(6, t('validation.passMin')),
}, [
  ['password', 'password'],
]);

const newItemSchema = yup.object().shape({
  name: stringSchema,
  description: stringSchema,
  group: idSchema,
  collection: idSchema.optional(),
  new: yup.boolean(),
  bestseller: yup.boolean(),
  price: numberSchema,
  width: numberSchema,
  height: numberSchema,
  composition: stringSchema,
  length: stringSchema,
  images: yup.array(requiredIdSchema).optional(),
});

const newItemCatalogSchema = yup.object().shape({
  name: stringSchema,
  description: stringSchema,
});

const newItemGroupSchema = yup.object().shape({
  code: stringSchema,
}).concat(newItemCatalogSchema);

const newOrderPositionSchema = yup.array(yup.object().shape({
  count: numberSchema,
  item: requiredIdSchema,
})
  .concat(uuidSchema))
  .min(1);

const orderChangeStatusSchema = yup.object().shape({
  status: yup.string().oneOf(Object.values(OrderStatusEnum)),
});

const newCommentSchema = yup.object().shape({
  text: stringSchema,
  images: yup.array(requiredIdSchema).optional(),
  parentComment: requiredIdSchema.optional(),
});

const newGradeSchema = yup.object().shape({
  grade: numberSchema.max(5),
  comment: yup.object().shape({
    text: yup.string().nullable().optional(),
    images: yup.array(requiredIdSchema).optional(),
  }),
  position: requiredIdSchema,
});

export const confirmCodeValidation = validate(confirmCodeSchema);
export const phoneValidation = validate(confirmPhoneSchema);
export const loginValidation = validate(loginSchema);
export const signupValidation = validate(signupSchema);
export const profileValidation = validate(profileSchema);
export const newItemValidation = validate(newItemSchema);
export const newItemGroupValidation = validate(newItemGroupSchema);
export const newItemCatalogValidation = validate(newItemCatalogSchema);
export const newOrderPositionValidation = validate(newOrderPositionSchema);
export const newCommentValidation = validate(newCommentSchema);
export const newGradeValidation = validate(newGradeSchema);
export const orderChangeStatusValidation = validate(orderChangeStatusSchema);
