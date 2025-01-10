import type { IOtpRepository } from "../../../../interfaces/repositories/IOtpRepository";
import type { Otp } from "@prisma/client";
import { injectable } from "inversify";
import { prisma } from "../../../../utils/prisma";

@injectable()
export class OtpRepository implements IOtpRepository {
  /**
   * @inheritdoc
   */
  async create(data: {
    code: string;
    userId: string;
    identifier: string;
    type: "EMAIL" | "WHATSAPP";
    purpose: string;
    expiresAt: Date;
    dailyCount: number;
    dailyCountReset: Date;
  }): Promise<Otp> {
    return await prisma.otp.create({ data });
  }

  /**
   * @inheritdoc
   */
  async getDailyCount(userId: string, type: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return await prisma.otp.count({
      where: {
        userId,
        type,
        createdAt: { gte: today },
      },
    });
  }

  /**
   * @inheritdoc
   */
  async verify(
    code: string,
    identifier: string,
    purpose: string,
    maxAttempts: number,
  ): Promise<Otp | null> {
    // Validasi tipe purpose
    if (
      ![
        "REGISTRATION",
        "PASSWORD_RESET",
        "LOGIN",
        "CHANGE_EMAIL",
        "CHANGE_PHONE",
      ].includes(purpose)
    ) {
      throw new Error("Invalid OTP purpose");
    }

    const otp = await prisma.otp.findFirst({
      where: {
        code,
        identifier,
        purpose,
        used: false,
        expiresAt: { gt: new Date() },
        attempts: { lt: maxAttempts },
      },
    });

    // Increment attempts untuk tracking failed attempts
    if (!otp) {
      await prisma.otp.updateMany({
        where: {
          identifier,
          purpose,
          used: false,
          expiresAt: { gt: new Date() },
        },
        data: { attempts: { increment: 1 } },
      });
      return null;
    }

    await prisma.otp.update({
      where: { id: otp.id },
      data: { used: true },
    });

    return otp;
  }

  /**
   * @inheritdoc
   */
  async invalidateExisting(userId: string, purpose: string): Promise<void> {
    await prisma.otp.updateMany({
      where: { userId, purpose, used: false },
      data: { used: true },
    });
  }
}
