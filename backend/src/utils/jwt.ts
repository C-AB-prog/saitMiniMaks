import jwt, { type Secret, type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env.js';

export type AuthTokenPayload = {
  sub: string;
  role: string;
};

export const signAccessToken = (payload: AuthTokenPayload) => {
  const options: SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
    subject: payload.sub,
  };

  return jwt.sign({ role: payload.role }, env.JWT_SECRET as Secret, options);
};

export const verifyAccessToken = (token: string) => {
  return jwt.verify(token, env.JWT_SECRET as Secret) as jwt.JwtPayload & AuthTokenPayload;
};
