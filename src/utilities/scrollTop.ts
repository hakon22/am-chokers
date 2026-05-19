export const scrollTop = (behavior: 'auto' | 'instant' | 'smooth' = 'smooth') => {
  window.scrollTo({ top: 0, left: 0, behavior });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
  document.getElementById('__next')?.scrollTo({ top: 0, behavior });
};
