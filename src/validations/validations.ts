import * as yup from 'yup';
import { setLocale, ObjectSchema, AnyObject } from 'yup';
import _ from 'lodash';

import i18n from '@/locales';

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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const numberSchema = yup.number().min(1).required();
const stringSchema = yup.string().required();

const phoneSchema = yup.string().trim().required().transform((value) => value.replace(/[^\d]/g, ''))
  .length(11)
  .matches(/^79.../, t('validation.phone'));

const confirmCodeSchema = yup.object().shape({
  code: stringSchema
    .transform((value) => value.replace(/[^\d]/g, ''))
    .test('code', t('validation.code'), (value) => value.length === 4),
});

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

export const confirmCodeValidation = validate(confirmCodeSchema);
export const phoneValidation = validate(confirmPhoneSchema);
export const loginValidation = validate(loginSchema);
export const signupValidation = validate(signupSchema);
export const profileValidation = validate(profileSchema);
