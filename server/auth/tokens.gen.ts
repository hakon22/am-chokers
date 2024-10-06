import jwt from 'jsonwebtoken';

export const generateAccessToken = (id: number, phone: string) => jwt.sign({ id, phone }, process.env.KEY_TOKEN ?? '', { expiresIn: '10m' });
export const generateRefreshToken = (id: number, phone: string) => jwt.sign({ id, phone }, process.env.KEY_REFRESH_TOKEN ?? '', { expiresIn: '30d' });
