/**
 * Проверяет, выполняется ли сейчас `next build` (без Redis/PostgreSQL на build-серверах)
 * @returns true во время phase-production-build
 */
export const isNextProductionBuild = (): boolean =>
  process.env.NEXT_PHASE === 'phase-production-build';
