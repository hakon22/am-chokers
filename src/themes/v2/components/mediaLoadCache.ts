import type Image from 'next/image';
import type { ComponentProps } from 'react';

/** Тип `src` у next/image: URL, StaticImageData или require()-импорт */
export type MediaSource = ComponentProps<typeof Image>['src'];

const loadedMediaSources = new Set<string>();

/**
 * Возвращает строковый ключ источника медиа для кэша загрузки
 * @param source - URL, StaticImageData или StaticRequire
 * @returns ключ источника
 */
export const getMediaSourceKey = (source: MediaSource): string => {
  if (typeof source === 'string') {
    return source;
  }
  if ('default' in source) {
    return source.default.src;
  }
  return source.src;
};

/**
 * Проверяет, было ли медиа уже загружено в этой сессии
 * @param source - URL, StaticImageData, StaticRequire или уже вычисленный ключ
 * @returns true, если источник уже отмечен как загруженный
 */
export const isMediaSourceLoaded = (source: MediaSource): boolean => (
  loadedMediaSources.has(getMediaSourceKey(source))
);

/**
 * Отмечает источник медиа как загруженный
 * @param source - URL, StaticImageData, StaticRequire или уже вычисленный ключ
 */
export const markMediaSourceLoaded = (source: MediaSource): void => {
  loadedMediaSources.add(getMediaSourceKey(source));
};
