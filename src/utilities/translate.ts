export const translate = (str?: string) => {
  if (!str) return '';

  const ru: Record<string, string> = {
    а: 'a',
    б: 'b',
    в: 'v',
    г: 'g',
    д: 'd',
    е: 'e',
    ё: 'e',
    ж: 'j',
    з: 'z',
    и: 'i',
    к: 'k',
    л: 'l',
    м: 'm',
    н: 'n',
    о: 'o',
    п: 'p',
    р: 'r',
    с: 's',
    т: 't',
    у: 'u',
    ф: 'f',
    х: 'h',
    ц: 'c',
    ч: 'ch',
    ш: 'sh',
    щ: 'shch',
    ы: 'y',
    э: 'e',
    ю: 'u',
    я: 'ya',
    ъ: 'ie',
    ь: 'y',
    й: 'i',
    '"': '',
    '&': 'i',
    '/': '',
    '\\': '',
    '(': '',
    ')': '',
  };

  return [...str.replaceAll(' ', '_')].map((l) => ru[l.toLowerCase()] ?? l).join('');
};
