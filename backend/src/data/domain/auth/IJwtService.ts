export interface JwtPayload {
  sub: string;
  email: string;
}

export interface IJwtService {
  sign(payload: JwtPayload): Promise<string>;
  verify(token: string): Promise<JwtPayload>;
}
