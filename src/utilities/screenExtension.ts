/** Фактическая ширина окна */
export const getWidth = () => window.innerWidth;

/** Соотношение, считаем как масштаб */
export const getRatio = () => window.devicePixelRatio;

/** Получить итоговое расширение экрана */
export const getExtension = () => getWidth() + getRatio();
