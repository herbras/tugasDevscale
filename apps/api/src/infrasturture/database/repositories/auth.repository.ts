import type { User } from "@prisma/client";
import { inject, injectable } from "inversify";
import type { RegisterDTO } from "../../../application/common/interfaces/auth/IAuthService";
import type { IAuthRepository } from "../../../interfaces/repositories/IAuthRepository";
import type { IBlacklistedTokenRepository } from "../../../interfaces/repositories/IBlacklistedTokenRepository";
import type { IOtpRepository } from "../../../interfaces/repositories/IOtpRepository";
import { TYPES } from "../../../interfaces/types";
import { prisma } from "../../../utils/prisma";

@injectable()
export class AuthRepository implements IAuthRepository {
  constructor(
    @inject(TYPES.OtpRepository) private readonly otpRepo: IOtpRepository,
    @inject(TYPES.BlacklistedTokenRepository)
    private readonly tokenRepo: IBlacklistedTokenRepository,
  ) {}

  /** @inheritdoc */
  async register(data: RegisterDTO & { defaultRoleId: string }): Promise<User> {
    return await prisma.$transaction(async (tx) => {
      const hashedPassword = await Bun.password.hash(data.password, {
        algorithm: "argon2id",
      });

      const user = await tx.user.create({
        data: {
          fullName: data.fullName,
          email: data.email,
          phoneNumber: data.phoneNumber,
          password: hashedPassword,
          verificationStatus: "INITIAL_REGISTERED",
          defaultRoleId: data.defaultRoleId,
        },
      });
      return user;
    });
  }

  /** @inheritdoc */
  async verifyAccount(
    userId: string,
    code: string,
    type: "EMAIL" | "PHONE",
  ): Promise<User> {
    return await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) throw new Error("User not found");

      const identifier = type === "EMAIL" ? user.email : user.phoneNumber;
      if (!identifier) throw new Error(`${type.toLowerCase()} not found`);

      const otp = await this.otpRepo.verify(
        code,
        identifier,
        "REGISTRATION",
        3,
      );
      if (!otp) throw new Error("Invalid OTP");

      return tx.user.update({
        where: { id: userId },
        data:
          type === "EMAIL"
            ? { isEmailVerified: true }
            : { isPhoneVerified: true },
      });
    });
  }

  /** @inheritdoc */
  async logout(token: string, userId: string): Promise<void> {
    await this.tokenRepo.add(token, userId);
  }

  /** @inheritdoc */
  async isTokenValid(token: string): Promise<boolean> {
    return !(await this.tokenRepo.isBlacklisted(token));
  }

  /** @inheritdoc */
  async resetPassword(
    userId: string,
    code: string,
    newPassword: string,
  ): Promise<User> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("User not found");

    const otp = await this.otpRepo.verify(
      code,
      user.email,
      "PASSWORD_RESET",
      3,
    );
    if (!otp) throw new Error("Invalid OTP");

    const hashedPassword = await Bun.password.hash(newPassword, {
      algorithm: "argon2id",
    });

    return prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  }

  /** @inheritdoc */
  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string,
  ): Promise<User> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("User not found");

    const isValid = await Bun.password.verify(oldPassword, user.password);
    if (!isValid) throw new Error("Invalid old password");

    const hashedPassword = await Bun.password.hash(newPassword, {
      algorithm: "argon2id",
    });

    return prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  }
}
