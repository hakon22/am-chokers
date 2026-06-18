/**
 * Декларации для пакетов без types в exports (moduleResolution: bundler)
 */
declare module 'node-verification-code' {
  type ChunkedCodeGeneratorFn = (charCount: number) => { toString(): string };

  export const getDigitalCode: ChunkedCodeGeneratorFn;
}
