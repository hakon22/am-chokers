export const META_DESCRIPTION_MAX_LENGTH = 160;

const META_DESCRIPTION_SUFFIX = '...';

/**
 * Формирует excerpt для meta description с лимитом SEO
 * @param text - исходный текст описания
 * @param maxLength - максимальная длина итоговой строки (суффикс ... входит в лимит)
 * @returns обрезанный текст или пустая строка
 */
export const buildMetaDescription = (text: string | undefined | null, maxLength: number = META_DESCRIPTION_MAX_LENGTH): string => {
  if (!text) {
    return '';
  }

  const normalized = text.trim().replace(/\s+/g, ' ');

  if (!normalized) {
    return '';
  }

  if (normalized.length <= maxLength) {
    return normalized;
  }

  const prefixMaxLength = maxLength - META_DESCRIPTION_SUFFIX.length;
  let prefix = normalized.slice(0, prefixMaxLength);
  const lastSpaceIndex = prefix.lastIndexOf(' ');

  if (lastSpaceIndex > prefixMaxLength * 0.6) {
    prefix = prefix.slice(0, lastSpaceIndex).trimEnd();
  }

  return `${prefix}${META_DESCRIPTION_SUFFIX}`;
};
