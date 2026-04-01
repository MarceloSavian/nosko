import { JwtService } from '../../infra/cryptography/JwtService.js';

if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is required');

export const jwtService = new JwtService(process.env.JWT_SECRET);
