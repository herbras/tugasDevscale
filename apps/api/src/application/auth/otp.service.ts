import "reflect-metadata";

import { inject, injectable } from "inversify";
import type {
  IOtpRepository,
  OtpPurpose,
} from "../../interfaces/repositories/IOtpRepository";
import { TYPES } from "../../interfaces/types";
import type { IOtpService } from "../common/interfaces/auth/IOtpService";

@injectable()
export class OtpService implements IOtpService {
  private readonly OTP_EXPIRY = Number.parseInt(
    process.env.OTP_EXPIRY ?? "900",
  );
  private readonly OTP_DAILY_LIMIT = Number.parseInt(
    process.env.OTP_DAILY_LIMIT ?? "5",
  );
  private readonly OTP_MAX_ATTEMPTS = Number.parseInt(
    process.env.OTP_MAX_ATTEMPTS ?? "3",
  );

  constructor(
    @inject(TYPES.OtpRepository) private readonly otpRepo: IOtpRepository,
  ) {}

  private generateSecureOTP(): string {
    const hasher = new Bun.CryptoHasher("sha256");
    hasher.update(crypto.getRandomValues(new Uint8Array(16)));
    return hasher.digest("hex").slice(0, 6);
  }

  async generate(userId: string, identifier: string, purpose: OtpPurpose) {
    const type = identifier.includes("@") ? "EMAIL" : "WHATSAPP";
    const dailyCount = await this.otpRepo.getDailyCount(userId, type);

    if (dailyCount >= this.OTP_DAILY_LIMIT) {
      throw new Error("Sudah mencapai limit OTP harian");
    }

    const code = this.generateSecureOTP();

    return await this.otpRepo.create({
      code,
      userId,
      identifier,
      type,
      purpose,
      expiresAt: new Date(Date.now() + this.OTP_EXPIRY * 1000),
      dailyCount: dailyCount + 1,
      dailyCountReset: new Date(),
    });
  }

  async verify(code: string, identifier: string, purpose: string) {
    return await this.otpRepo.verify(
      code,
      identifier,
      purpose,
      this.OTP_MAX_ATTEMPTS,
    );
  }
}
