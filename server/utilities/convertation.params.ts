import * as yup from 'yup';

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
  .transform((value) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return undefined;
  })
  .optional();
