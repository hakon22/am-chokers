import type { ImageProps } from 'next/image';

/**
 * Вычисляет loading для next/image: при priority без явного loading — eager (LCP)
 * @param priority - приоритетная загрузка Next.js
 * @param loading - явный loading с call-site
 * @returns eager при priority, иначе lazy или явное значение с call-site
 */
export const resolveImageLoading = (priority?: boolean, loading?: ImageProps['loading']): ImageProps['loading'] => {
  if (loading !== undefined) {
    return loading;
  }
  return priority ? 'eager' : 'lazy';
};
