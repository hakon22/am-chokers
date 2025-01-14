import * as yup from 'yup';
import { setLocale, type ObjectSchema, type AnyObject } from 'yup';
import moment from 'moment';
import _ from 'lodash';

import i18n from '@/locales';
import { OrderStatusEnum } from '@server/types/order/enums/order.status.enum';
import { booleanSchema } from '@server/utilities/convertation.params';

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
    return schema.validate(data);
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

const idNullableSchema = yup
  .lazy((value) => (typeof value === 'object'
    ? requiredIdSchema.nullable()
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
  collection: idNullableSchema.optional(),
  new: booleanSchema,
  bestseller: booleanSchema,
  price: numberSchema,
  width: numberSchema,
  height: numberSchema,
  composition: stringSchema,
  length: stringSchema,
  images: yup.array(requiredIdSchema).optional(),
});

const partialUpdateItemSchema = yup.object().shape({
  name: stringSchema.optional(),
  description: stringSchema.optional(),
  group: idSchema.optional(),
  collection: idNullableSchema.optional(),
  new: booleanSchema.optional(),
  bestseller: booleanSchema.optional(),
  price: numberSchema.optional(),
  width: numberSchema.optional(),
  height: numberSchema.optional(),
  composition: stringSchema.optional(),
  length: stringSchema.optional(),
  order: yup.number().optional(),
  images: yup.array(requiredIdSchema).optional(),
});

const newItemCatalogSchema = yup.object().shape({
  name: stringSchema,
  description: stringSchema,
});

const newItemGroupSchema = yup.object().shape({
  code: stringSchema,
}).concat(newItemCatalogSchema);

const newCartItemSchema = yup.object().shape({
  count: numberSchema,
  item: requiredIdSchema,
});

const cartItemsSchema = yup.array(newCartItemSchema.concat(uuidSchema));

const newOrderPositionSchema = yup.object().shape({
  cart: yup.array(newCartItemSchema.concat(uuidSchema)).min(1),
  deliveryPrice: numberSchema,
  promotion: yup.object().shape({
    id: yup.number(),
  }).optional(),
});

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

export const periodSchema = yup.object().shape({
  start: yup
    .date()
    .required()
    .test('is-in-future', t('validation.isInFuture'), function (value) {
      const { end } = this.parent; // доступ к другим полям в текущем объекте
      return moment(value).isSameOrBefore(moment(end), 'day');
    }),
  end: yup
    .date()
    .required()
    .test('is-after-start', t('validation.isAfterStart'), function (value) {
      const { start } = this.parent; // доступ к другим полям в текущем объекте
      return moment(value).isSameOrAfter(moment(start), 'day');
    }),
});

export const discountAndDiscountPercentSchema = yup.object().shape({
  discount: yup
    .number()
    .nullable()
    .min(1)
    .test('one-of', t('validation.discountOrDiscountPercent'), function (value) {
      const { discountPercent } = this.parent;
      return !!value === true && !discountPercent ? true : !!value === false && discountPercent ? true : false;
    }),
  discountPercent: yup
    .number()
    .nullable()
    .min(1)
    .test('one-of', t('validation.discountOrDiscountPercent'), function (value) {
      const { discount } = this.parent;
      return !!value === true && !discount ? true : !!value === false && discount ? true : false;
    }),
});

const newPromotionalSchema = yup.object().shape({
  name: stringSchema,
  description: stringSchema,
  active: yup
    .boolean()
    .test('is-expired', t('validation.isExpired'), function (value) {
      const { end } = this.parent; // доступ к другим полям в текущем объекте
      const isExpired = moment(end).isBefore(moment(), 'day');
      return value ? !isExpired : true;
    }),
}).concat(periodSchema).concat(discountAndDiscountPercentSchema);

export const confirmCodeValidation = validate(confirmCodeSchema);
export const phoneValidation = validate(confirmPhoneSchema);
export const loginValidation = validate(loginSchema);
export const signupValidation = validate(signupSchema);
export const profileValidation = validate(profileSchema);
export const newItemValidation = validate(newItemSchema);
export const newItemGroupValidation = validate(newItemGroupSchema);
export const newItemCatalogValidation = validate(newItemCatalogSchema);
export const newCartItemValidation = validate(newCartItemSchema);
export const partialUpdateItemValidation = validate(partialUpdateItemSchema);
export const cartItemsSchemaValidation = validate(cartItemsSchema);
export const newOrderPositionValidation = validate(newOrderPositionSchema);
export const newCommentValidation = validate(newCommentSchema);
export const newGradeValidation = validate(newGradeSchema);
export const newPromotionalValidation = validate(newPromotionalSchema);
export const orderChangeStatusValidation = validate(orderChangeStatusSchema);
