import "reflect-metadata";

import { inject, injectable } from "inversify";
import jwt from "jsonwebtoken";
import { AppError } from "../../interfaces/errors";
import type { IBlacklistedTokenRepository } from "../../interfaces/repositories/IBlacklistedTokenRepository";
import { TYPES } from "../../interfaces/types";
import type {
  ITokenService,
  TokenPayload,
  Tokens,
} from "../common/interfaces/auth/ITokenService";

@injectable()
export class TokenService implements ITokenService {
  private readonly accessSecret: string;
  private readonly refreshSecret: string;
  private readonly accessExpiry: string;
  private readonly refreshExpiry: string;

  constructor(
    @inject(TYPES.BlacklistedTokenRepository)
    private readonly tokenRepo: IBlacklistedTokenRepository,
  ) {
    this.accessSecret = process.env.JWT_ACCESS_SECRET ?? "access-secret";
    this.refreshSecret = process.env.JWT_REFRESH_SECRET ?? "refresh-secret";
    this.accessExpiry = process.env.JWT_ACCESS_EXPIRY ?? "15m";
    this.refreshExpiry = process.env.JWT_REFRESH_EXPIRY ?? "7d";
  }

  generateTokens(payload: Omit<TokenPayload, "iat" | "exp">): Promise<Tokens> {
    const accessToken = jwt.sign(payload, this.accessSecret, {
      expiresIn: this.accessExpiry,
    });

    const refreshToken = jwt.sign(payload, this.refreshSecret, {
      expiresIn: this.refreshExpiry,
    });

    return Promise.resolve({ accessToken, refreshToken });
  }

  async verifyAccessToken(token: string): Promise<TokenPayload> {
    try {
      const decoded = (await jwt.verify(
        token,
        this.accessSecret,
      )) as TokenPayload;
      if (!decoded?.userId) {
        throw new AppError("Invalid token format", 401);
      }
      return decoded;
    } catch (error) {
      console.error("Token verification error:", error);
      throw new AppError("Invalid or expired access token", 401);
    }
  }

  async verifyRefreshToken(token: string): Promise<TokenPayload> {
    try {
      // Cek blacklist dulu
      const isBlacklisted = await this.isTokenBlacklisted(token);
      if (isBlacklisted) {
        throw new Error("Token has been revoked");
      }

      return (await jwt.verify(token, this.refreshSecret)) as TokenPayload;
    } catch {
      throw new Error("Invalid refresh token");
    }
  }

  async refreshTokens(refreshToken: string): Promise<Tokens> {
    const payload = await this.verifyRefreshToken(refreshToken);
    const { userId } = payload;
    return this.generateTokens({ userId });
  }

  async decodeToken(token: string): Promise<TokenPayload> {
    const decoded = await jwt.decode(token);
    if (!decoded) throw new Error("Invalid token format");
    return decoded as TokenPayload;
  }

  async blacklistToken(token: string, userId: string): Promise<void> {
    await this.tokenRepo.add(token, userId);
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    return await this.tokenRepo.isBlacklisted(token);
  }
}
