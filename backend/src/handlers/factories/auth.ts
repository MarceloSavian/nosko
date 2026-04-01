import { JwtService } from '../../infra/cryptography/JwtService.js';

export const jwtService = new JwtService(process.env.JWT_SECRET!);
