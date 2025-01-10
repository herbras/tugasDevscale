import type { BlacklistedToken } from "@prisma/client";
import type { IBlacklistedTokenRepository } from "../../../../interfaces/repositories/IBlacklistedTokenRepository";
import { injectable } from "inversify";
import { prisma } from "../../../../utils/prisma";

@injectable()
export class BlacklistedTokenRepository implements IBlacklistedTokenRepository {
  /** @inheritdoc */
  async add(token: string, userId: string): Promise<BlacklistedToken> {
    return await prisma.blacklistedToken.create({
      data: {
        token,
        userId,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 jam
      },
    });
  }

  /** @inheritdoc */
  async isBlacklisted(token: string): Promise<boolean> {
    const found = await prisma.blacklistedToken.findFirst({
      where: {
        token,
        expiresAt: { gt: new Date() },
      },
    });
    return !!found;
  }

  /** @inheritdoc */
  async cleanup(): Promise<void> {
    await prisma.blacklistedToken.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });
  }
}
