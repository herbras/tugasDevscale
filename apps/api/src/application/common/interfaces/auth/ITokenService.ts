export interface ITokenService {
  generateTokens(payload: TokenPayload): Promise<Tokens>;
  verifyAccessToken(token: string): Promise<TokenPayload>;
  verifyRefreshToken(token: string): Promise<TokenPayload>;
  refreshTokens(refreshToken: string): Promise<Tokens>;
  decodeToken(token: string): Promise<TokenPayload>;
  blacklistToken(token: string, userId: string): Promise<void>;
  isTokenBlacklisted(token: string): Promise<boolean>;
}

export interface TokenPayload {
  userId: string;
  iat?: number;
  exp?: number;
}

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}
