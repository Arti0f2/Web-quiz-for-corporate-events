import jwt from 'jsonwebtoken';
import { User } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

if (!process.env.JWT_SECRET) {
  console.warn('WARNING: JWT_SECRET environment variable is not set. Using default (unsafe) value. Do not use in production!');
}

export function generateToken(payload: any): string {
 return jwt.sign(payload, JWT_SECRET, { expiresIn: Number(JWT_EXPIRES_IN) });
}

// export function generateToken(payload: any): string {
//   const expiresIn = isNaN(Number(JWT_EXPIRES_IN)) ? JWT_EXPIRES_IN : Number(JWT_EXPIRES_IN);
//   return jwt.sign(payload, JWT_SECRET, { expiresIn });
// }


export function verifyToken(token: string): Promise<any> {
  return new Promise((resolve, reject) => {
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        reject(err);
      } else {
        resolve(decoded);
      }
    });
  });
}

export function getTokenFromHeader(authHeader?: string) {
  if (!authHeader) {
    throw new Error('No authorization header');
  }

  const parts = authHeader.split(' ');

  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    throw new Error('Invalid authorization header format');
  }

  return parts[1];
} 