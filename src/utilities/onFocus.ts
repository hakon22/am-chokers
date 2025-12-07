export const onFocus = () => {
  const target = document.body;
  setTimeout(() => target.parentElement?.focus(), 1);
};
