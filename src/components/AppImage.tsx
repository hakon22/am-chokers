import Image from 'next/image';
import { forwardRef, type ComponentProps } from 'react';

import { resolveImageLoading } from '@/utilities/resolveImageLoading';

export type AppImageProps = ComponentProps<typeof Image>;

/**
 * Обёртка над next/image: при priority без явного loading — eager (LCP)
 */
export const AppImage = forwardRef<HTMLImageElement, AppImageProps>(
  ({ priority, loading, alt, ...rest }, ref) => {
    const resolvedLoading = resolveImageLoading(priority, loading);

    return (
      <Image
        {...rest}
        ref={ref}
        alt={alt ?? ''}
        priority={priority}
        loading={resolvedLoading}
      />
    );
  },
);

AppImage.displayName = 'AppImage';
