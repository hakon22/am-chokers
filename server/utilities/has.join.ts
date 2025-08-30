import { QueryBuilder } from 'typeorm';

export const hasJoin = (builder: QueryBuilder<any>, alias: string): boolean => {
  if (builder instanceof QueryBuilder) {
    return (builder?.expressionMap?.joinAttributes || []).findIndex(item => item?.alias?.name === alias) !== -1;
  } else {
    throw new Error('Received value is not TypeORM query builder');
  }
};
