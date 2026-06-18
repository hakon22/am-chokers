/** Зазор между fixed/sticky элементом и верхним краем footer (px) */
export const V2_FOOTER_OFFSET_GAP = 16;

/**
 * Возвращает Y-координату верхнего края footer V2 в viewport
 * @returns top footer в px или innerHeight, если footer не найден
 */
export const getV2FooterTop = (): number => {
  const footerElement = document.querySelector('.v2-app footer');

  if (!footerElement) {
    return window.innerHeight;
  }

  return footerElement.getBoundingClientRect().top;
};
