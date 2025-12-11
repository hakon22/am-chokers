/* eslint-disable react-hooks/purity */
import { useMemo } from 'react';

export const usePasterColors = (length: number) => {
  return useMemo(() => {
    return Array.from({ length }, () => {
      const hue = Math.floor(Math.random() * 360);
      const saturation = Math.floor(Math.random() * 30) + 70;
      const lightness = Math.floor(Math.random() * 20) + 80;
      return `hsl(${hue}, ${saturation}%, ${lightness}%, 0.4)`;
    });
  }, [length]);
};
