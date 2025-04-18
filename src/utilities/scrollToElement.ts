export const scrollToElement = (elementId: string | number, offset: number) => {
  const element = document.getElementById(typeof elementId === 'number' ? elementId.toString() : elementId);
  if (element) {
    const elementPosition = element.getBoundingClientRect().top + window.scrollY;
    const offsetPosition = elementPosition - offset;

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth',
    });
  }
};
