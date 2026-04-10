import Image from 'next/image';
import { useCallback, useState, type ComponentProps } from 'react';

export type V2ImageProps = ComponentProps<typeof Image>;

/**
 * Обёртка над next/image: при сбое оптимизатора (в т.ч. «isn't a valid image»)
 * повторяет загрузку тем же src без /_next/image.
 */
export const V2Image = ({ onError, unoptimized, alt, ...rest }: V2ImageProps) => {
  const [optimizerFailed, setOptimizerFailed] = useState(false);
  const useDirect = Boolean(unoptimized || optimizerFailed);
  const handleError = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
      if (!unoptimized && !optimizerFailed) {
        setOptimizerFailed(true);
        return;
      }
      onError?.(e);
    },
    [unoptimized, optimizerFailed, onError],
  );
  return <Image {...rest} alt={alt ?? ''} unoptimized={useDirect} onError={handleError} />;
};
