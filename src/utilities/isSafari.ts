export const isSafari = () => {
  const ua = navigator.userAgent;
  return /^((?!chrome|android).)*safari/i.test(ua);
};
