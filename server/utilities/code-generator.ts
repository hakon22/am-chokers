import { getDigitalCode } from 'node-verification-code';

export const codeGen = () => getDigitalCode(4).toString();
