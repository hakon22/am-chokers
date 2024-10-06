export const upperCase = (str: string) => str.replace(/\s+/g, ' ')
  .trim()
  .split(' ')
  .map((name) => name.replace(name[0], name[0].toUpperCase()))
  .join(' ');

export const lowerCase = (str: string) => str.toLowerCase().trim();
