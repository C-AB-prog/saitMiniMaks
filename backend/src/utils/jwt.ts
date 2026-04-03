import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export type AuthTokenPayload = {
  sub: string;
  role: string;
};

export const signAccessToken = (payload: AuthTokenPayload) => {
  return jwt.sign(
    { role: payload.role },
    env.JWT_SECRET,
    {
      expiresIn: env.JWT_EXPIRES_IN,
      subject: payload.sub
    }
  );
};

export const verifyAccessToken = (token: string) => {
  return jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload & AuthTokenPayload;
};
