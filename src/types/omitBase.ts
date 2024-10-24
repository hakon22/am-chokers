export type OmitBase<T> = Omit<T, 'softRemove' | 'save' | 'remove' | 'reload' | 'recover' | 'hasId'>;
