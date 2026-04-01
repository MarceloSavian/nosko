import { SignJWT, jwtVerify } from 'jose';
import type { IJwtService, JwtPayload } from '../../data/domain/auth/IJwtService.js';

const ALGORITHM = 'HS256';
const EXPIRES_IN = '1h';

export class JwtService implements IJwtService {
  private readonly secret: Uint8Array;

  constructor(secret: string) {
    this.secret = new TextEncoder().encode(secret);
  }

  async sign(payload: JwtPayload): Promise<string> {
    return await new SignJWT({ email: payload.email })
      .setProtectedHeader({ alg: ALGORITHM })
      .setSubject(payload.sub)
      .setIssuedAt()
      .setExpirationTime(EXPIRES_IN)
      .sign(this.secret);
  }

  async verify(token: string): Promise<JwtPayload> {
    const { payload } = await jwtVerify(token, this.secret, { algorithms: [ALGORITHM] });
    return { sub: payload.sub as string, email: payload.email as string };
  }
}
