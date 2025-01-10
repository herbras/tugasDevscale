import type { Otp } from "@prisma/client";
import type { OtpPurpose } from "../../../../interfaces/repositories/IOtpRepository";

export interface IOtpService {
  generate(
    userId: string,
    identifier: string,
    purpose: OtpPurpose,
  ): Promise<Otp>;

  verify(
    code: string,
    identifier: string,
    purpose: string,
  ): Promise<Otp | null>;
}
