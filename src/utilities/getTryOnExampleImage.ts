import type { StaticImageData } from 'next/image';

import earringsExample from '@/images/try-on/earrings_example.jpg';
import necklacesExample from '@/images/try-on/necklaces_example.jpg';
import type { TryOnInstructionKey } from '@/utilities/isTryOnEnabledForGroupCode';

/**
 * Возвращает статическое изображение-пример для типа примерки
 * @param instructionKey - ключ инструкции (necklace, earring)
 * @returns StaticImageData или null
 */
export const getTryOnExampleImage = (instructionKey: TryOnInstructionKey | null): StaticImageData | null => {
  if (instructionKey === null) {
    return null;
  }

  switch (instructionKey) {
  case 'necklace':
    return necklacesExample;
  case 'earring':
    return earringsExample;
  default:
    return null;
  }
};
