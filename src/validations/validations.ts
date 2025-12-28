import * as yup from 'yup';
import { setLocale, type ObjectSchema, type AnyObject } from 'yup';
import moment from 'moment';
import _ from 'lodash';

import i18n from '@/locales';
import { OrderStatusEnum } from '@server/types/order/enums/order.status.enum';
import { booleanSchema } from '@server/utilities/convertation.params';
import { DeliveryTypeEnum } from '@server/types/delivery/enums/delivery.type.enum';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';

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
    return schema.validateSyncAt(field, obj);
  },
  async serverValidator(data: typeof schema) {
    return schema.validate(data);
  },
});

export const uuidStringSchema = yup.string().uuid().required();

export const uuidSchema = yup.object().shape({
  id: uuidStringSchema,
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
  lang: yup.string().oneOf(Object.values(UserLangEnum)),
  name: stringSchema
    .trim()
    .min(3)
    .max(20),
  password: yup
    .string()
    .required()
    .min(6, t('validation.passMin')),
  confirmPassword: stringSchema,
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
  confirmPassword: stringSchema,
  oldPassword: stringSchema.min(6, t('validation.passMin')),
}, [
  ['password', 'password'],
]);

export const profileServerSchema = yup.object().shape({
  phone: phoneSchema.notRequired(),
  name: stringSchema
    .trim()
    .min(3)
    .max(20)
    .optional(),
  password: yup
    .string()
    .min(6, t('validation.passMin'))
    .transform((v) => (v === '' ? null : v))
    .nullable()
    .notRequired(),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], t('validation.mastMatch'))
    .when('password', ([password], schema) => {
      return password ? schema.required() : schema.nullable().notRequired();
    }),
  oldPassword: yup
    .string()
    .min(6, t('validation.passMin'))
    .when(['password'], ([password], schema) => {
      return password ? schema.required() : schema.nullable().notRequired();
    }),
});

const translationSchema = (target: 'item' | 'group' | 'other' = 'other') => yup.lazy((value) => {
  if (Array.isArray(value)) {
    // Если это массив - валидируем как массив объектов
    return yup.array(yup.object().shape({
      lang: yup.string().oneOf(Object.values(UserLangEnum)),
      name: stringSchema.min(1),
      description: ['item', 'group'].includes(target) ? stringSchema.min(1) : stringSchema.optional(),
      length: target === 'item' ? stringSchema.min(1) : stringSchema.optional(),
    }))
      .test('unique-langs', t('validation.uniqueLanguages'), function (arr) {
        return !arr || new Set(arr.map(item => item.lang)).size === arr.length;
      });
  } else {
    // Если это объект - валидируем как объект с языковыми полями
    return yup.object()
      .shape(
        Object.values(UserLangEnum).reduce((acc, lang) => {
          acc[lang] = yup.object().shape({
            name: stringSchema.min(1),
            description: ['item', 'group'].includes(target) ? stringSchema.min(1) : stringSchema.optional(),
            length: target === 'item' ? stringSchema.min(1) : stringSchema.optional(),
          }).required();
          return acc;
        }, {} as Record<UserLangEnum, ObjectSchema<any>>))
      .test('all-languages-required', t('validation.translationsRequired'), function (obj) {
        return Object.values(UserLangEnum).every(lang => 
          obj && obj[lang] && typeof obj[lang].name === 'string' && obj[lang].name.trim().length > 0,
        );
      });
  }
});

const newItemSchema = yup.object().shape({
  group: idSchema,
  collection: idNullableSchema.optional(),
  new: booleanSchema,
  bestseller: booleanSchema,
  outStock: yup.date().nullable().optional(),
  price: numberSchema,
  discountPrice: yup.number().optional(),
  compositions: yup.array(idSchema).min(1).required(),
  colors: yup.array(idSchema).min(1).required(),
  images: yup.array(requiredIdSchema).optional(),
  publicationDate: yup.date().optional().nullable(),
  translations: translationSchema('item'),
  deferredPublication: yup.object().shape({
    date: yup.date().nullable(),
    description: yup.string().optional().nullable(),
  }).optional().nullable(),
});

const partialUpdateItemSchema = yup.object().shape({
  group: idSchema.optional(),
  collection: idNullableSchema.optional(),
  new: booleanSchema.optional(),
  bestseller: booleanSchema.optional(),
  outStock: yup.date().nullable().optional(),
  price: numberSchema.optional(),
  discountPrice: yup.number().optional(),
  compositions: yup.array(idSchema).optional(),
  colors: yup.array(idSchema).optional(),
  order: yup.number().optional().nullable(),
  images: yup.array(requiredIdSchema).optional(),
  message: yup.number().min(1).nullable().optional(),
});

const newCompositionSchema = yup.object().shape({
  translations: translationSchema(),
});

const newColorSchema = yup.object().shape({
  translations: translationSchema(),
  hex: yup
    .lazy((value) => (typeof value === 'object'
      ? yup.object()
        .required()
      : yup.string()
        .required()
        .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, t('validation.incorrectColor'))
    )),
});

const newItemCollectionSchema = yup.object().shape({
  description: stringSchema,
  translations: translationSchema(),
});

const newItemGroupSchema = yup.object().shape({
  code: stringSchema,
  translations: translationSchema('group'),
});

export const itemGroupSchema = yup.array(requiredIdSchema).required();

const newCartItemSchema = yup.object().shape({
  count: numberSchema,
  item: requiredIdSchema,
});

const cartItemsSchema = yup.array(newCartItemSchema.concat(uuidSchema));

export const queryActivatePromotionalParams = yup.object().shape({
  name: stringSchema,
  cartIds: yup.array(uuidStringSchema).min(1).required(),
});

const newOrderPositionSchema = yup.object().shape({
  cart: yup.array(newCartItemSchema.concat(uuidSchema)).min(1),
  promotion: yup.object().shape({
    id: yup.number(),
  }).optional(),
  delivery: yup.object().shape({
    price: numberSchema.min(0),
    address: stringSchema,
    type: yup.string().oneOf(Object.values(DeliveryTypeEnum)),
    index: yup.string().optional(),
    mailType: yup.string().optional(),
    tariffName: yup.string().optional(),
    tariffDescription: yup.string().optional(),
    deliveryFrom: yup.string().optional(),
    deliveryTo: yup.string().optional(),
  }),
  user: yup.object().shape({
    name: stringSchema,
    phone: phoneSchema,
    lang: yup.string().oneOf(Object.values(UserLangEnum)),
  }),
  comment: yup.string().optional(),
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

export const generateDescriptionWithoutItemSchema = yup.object().shape({
  compositions: yup.array(idSchema).min(1).required(),
  images: yup.array(idSchema).min(1).required(),
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
    .test('one-of', t('validation.oneOfValue'), function (value) {
      const { discountPercent, freeDelivery } = this.parent;
      return !!value === true && !discountPercent && !freeDelivery ? true : !!value === false && (discountPercent || freeDelivery) ? true : false;
    }),
  discountPercent: yup
    .number()
    .nullable()
    .min(1)
    .test('one-of', t('validation.oneOfValue'), function (value) {
      const { discount, freeDelivery } = this.parent;
      return !!value === true && !discount && !freeDelivery ? true : !!value === false && (discount || freeDelivery) ? true : false;
    }),
  freeDelivery: yup
    .boolean()
    .nullable()
    .test('one-of', t('validation.oneOfValue'), function (value) {
      const { discountPercent, discount } = this.parent;
      return !!value === true && !discount && !discountPercent ? true : !!value === false && (discount || discountPercent) ? true : false;
    }),
});

const newPromotionalSchema = yup.object().shape({
  name: stringSchema,
  description: stringSchema,
  items: yup.array(requiredIdSchema).optional(),
  users: yup.array(requiredIdSchema).optional(),
  active: yup
    .boolean()
    .test('is-expired', t('validation.isExpired'), function (value) {
      const { end } = this.parent; // доступ к другим полям в текущем объекте
      const isExpired = moment(end).isBefore(moment(), 'day');
      return value ? !isExpired : true;
    }),
}).concat(periodSchema).concat(discountAndDiscountPercentSchema);

export const deferredPublicationSchema = yup.object().shape({
  date: yup.date().required(),
  item: requiredIdSchema,
});

const publishTelegramSchema = yup.object().shape({
  date: yup.date().optional().nullable(),
  description: stringSchema,
});

const setCoverImageSchema = yup.object().shape({
  coverOrder: numberSchema,
}).concat(requiredIdSchema);

export const confirmCodeValidation = validate(confirmCodeSchema);
export const phoneValidation = validate(confirmPhoneSchema);
export const loginValidation = validate(loginSchema);
export const signupValidation = validate(signupSchema);
export const profileValidation = validate(profileSchema);
export const newItemValidation = validate(newItemSchema);
export const newItemGroupValidation = validate(newItemGroupSchema);
export const newItemCollectionValidation = validate(newItemCollectionSchema);
export const newCartItemValidation = validate(newCartItemSchema);
export const partialUpdateItemValidation = validate(partialUpdateItemSchema);
export const cartItemsSchemaValidation = validate(cartItemsSchema);
export const newOrderPositionValidation = validate(newOrderPositionSchema);
export const newCommentValidation = validate(newCommentSchema);
export const newGradeValidation = validate(newGradeSchema);
export const newPromotionalValidation = validate(newPromotionalSchema);
export const discountAndDiscountPercentValidation = validate(discountAndDiscountPercentSchema);
export const orderChangeStatusValidation = validate(orderChangeStatusSchema);
export const newCompositionValidation = validate(newCompositionSchema);
export const setCoverImageValidation = validate(setCoverImageSchema);
export const newColorValidation = validate(newColorSchema);
export const publishTelegramValidation = validate(publishTelegramSchema);
