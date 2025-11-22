import passGen from 'generate-password';

export const passwordGen = () => passGen.generate({
  length: 7,
  numbers: true,
});
