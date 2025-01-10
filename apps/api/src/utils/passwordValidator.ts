import { AppError } from "../interfaces/errors";
import { commonIndonesianPasswords } from "./datumCommonPassword";
import { logger } from "../infrasturture/ioc/container";

// Constants sama seperti sebelumnya
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 15;
const MIN_PASSPHRASE_LENGTH = 20;
const MAX_PASSPHRASE_LENGTH = 255;

const getPasswordLengthConfig = (isPassphrase: boolean) => ({
  minLength: isPassphrase ? MIN_PASSPHRASE_LENGTH : MIN_PASSWORD_LENGTH,
  maxLength: isPassphrase ? MAX_PASSPHRASE_LENGTH : MAX_PASSWORD_LENGTH,
  errorPrefix: isPassphrase ? "Passphrase" : "Password",
});

const validatePasswordLength = (
  password: string,
  minLength: number,
  maxLength: number,
  errorPrefix: string,
): void => {
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
};

const validatePassphrase = (passphrase: string): void => {
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
};

const validateStandardPassword = (password: string): void => {
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
};

export const isCommonPassword = (password: string): boolean => {
  return commonIndonesianPasswords.includes(password.toLowerCase().trim());
};

export const validatePasswordStrength = (
  password: string,
  isPassphrase = false,
): void => {
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
      getPasswordLengthConfig(isPassphrase);

    validatePasswordLength(password, minLength, maxLength, errorPrefix);

    if (isCommonPassword(password)) {
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
      validatePassphrase(password);
    } else {
      validateStandardPassword(password);
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
};
