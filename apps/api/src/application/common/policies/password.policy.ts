// application/common/security/password.policy.ts

import { AppError } from "../../../interfaces/errors";
import { commonIndonesianPasswords } from "../../../utils/datumCommonPassword";
import { injectable } from "inversify";
import { logger } from "../../../infrasturture/ioc/container";

export interface IPasswordPolicy {
  validatePasswordStrength(password: string, isPassphrase?: boolean): void;
  isCommonPassword(password: string): boolean;
}

@injectable()
export class PasswordPolicy implements IPasswordPolicy {
  private readonly MIN_PASSWORD_LENGTH = 8;
  private readonly MAX_PASSWORD_LENGTH = 15;
  private readonly MIN_PASSPHRASE_LENGTH = 20;
  private readonly MAX_PASSPHRASE_LENGTH = 255;

  private getPasswordLengthConfig(isPassphrase: boolean) {
    return {
      minLength: isPassphrase
        ? this.MIN_PASSPHRASE_LENGTH
        : this.MIN_PASSWORD_LENGTH,
      maxLength: isPassphrase
        ? this.MAX_PASSPHRASE_LENGTH
        : this.MAX_PASSWORD_LENGTH,
      errorPrefix: isPassphrase ? "Passphrase" : "Password",
    };
  }

  private validatePasswordLength(
    password: string,
    minLength: number,
    maxLength: number,
    errorPrefix: string,
  ): void {
    if (password.length < minLength) {
      throw new AppError(`${errorPrefix} minimal ${minLength} karakter`, 422, [
        {
          field: "password",
          type: "INVALID_LENGTH",
          message: `${errorPrefix} minimal ${minLength} karakter`,
        },
      ]);
    }

    if (password.length > maxLength) {
      throw new AppError(`${errorPrefix} maksimal ${maxLength} karakter`, 422, [
        {
          field: "password",
          type: "INVALID_LENGTH",
          message: `${errorPrefix} maksimal ${maxLength} karakter`,
        },
      ]);
    }
  }

  private validatePassphrase(passphrase: string): void {
    const words = passphrase.trim().split(/\s+/);
    if (words.length < 3) {
      throw new AppError("Passphrase harus terdiri dari minimal 3 kata", 422, [
        {
          field: "password",
          type: "INVALID_PASSPHRASE",
          message: "Passphrase harus terdiri dari minimal 3 kata",
        },
      ]);
    }
  }

  private validateStandardPassword(password: string): void {
    if (/\s/.test(password)) {
      throw new AppError("Password tidak boleh mengandung spasi", 422, [
        {
          field: "password",
          type: "INVALID_CHARACTER",
          message: "Password tidak boleh mengandung spasi",
        },
      ]);
    }

    const checks = {
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[\\!@#$%^&*()+_\-=}{[\]|:;"/?.><,`~']/.test(password),
    };

    const failedChecks = Object.entries(checks)
      .filter(([_, passes]) => !passes)
      .map(([check]) => check);

    if (failedChecks.length > 0) {
      throw new AppError(
        `Password harus mengandung: ${failedChecks.join(", ")}`,
        422,
        [
          {
            field: "password",
            type: "MISSING_REQUIREMENTS",
            message: `Password harus mengandung: ${failedChecks.join(", ")}`,
          },
        ],
      );
    }

    const charTypeCount = Object.values(checks).filter(Boolean).length;
    if (charTypeCount < 3) {
      throw new AppError(
        "Password harus menggunakan minimal 3 jenis karakter yang berbeda (huruf besar, huruf kecil, angka, karakter khusus)",
        422,
        [
          {
            field: "password",
            type: "INSUFFICIENT_COMPLEXITY",
            message:
              "Password harus menggunakan minimal 3 jenis karakter yang berbeda (huruf besar, huruf kecil, angka, karakter khusus)",
          },
        ],
      );
    }
  }

  public isCommonPassword(password: string): boolean {
    return commonIndonesianPasswords.includes(password.toLowerCase().trim());
  }

  public validatePasswordStrength(
    password: string,
    isPassphrase = false,
  ): void {
    try {
      if (!password || typeof password !== "string") {
        throw new AppError("Password tidak valid", 422, [
          {
            field: "password",
            type: "INVALID_INPUT",
            message: "Password tidak valid",
          },
        ]);
      }

      const { minLength, maxLength, errorPrefix } =
        this.getPasswordLengthConfig(isPassphrase);

      this.validatePasswordLength(password, minLength, maxLength, errorPrefix);

      if (this.isCommonPassword(password)) {
        throw new AppError(
          "Terlalu umum, gunakan kombinasi yang lebih unik",
          422,
          [
            {
              field: "password",
              type: "COMMON_PASSWORD",
              message: "Terlalu umum, gunakan kombinasi yang lebih unik",
            },
          ],
        );
      }

      if (isPassphrase) {
        this.validatePassphrase(password);
      } else {
        this.validateStandardPassword(password);
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      logger.error("Password validation error:", {
        error: error instanceof Error ? error.message : "Unknown error",
        validationType: isPassphrase ? "passphrase" : "standard",
      });

      throw new AppError("Gagal memvalidasi password", 500, [
        {
          field: "password",
          type: "VALIDATION_ERROR",
          message: "Gagal memvalidasi password",
        },
      ]);
    }
  }
}
