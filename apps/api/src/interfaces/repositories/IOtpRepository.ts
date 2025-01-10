import type { Otp } from "@prisma/client";
export type OtpPurpose =
  | "REGISTRATION"
  | "PASSWORD_RESET"
  | "LOGIN"
  | "CHANGE_EMAIL"
  | "CHANGE_PHONE";
export type OtpType = "EMAIL" | "WHATSAPP";
export interface IOtpRepository {
  /**
   * Membuat OTP baru dengan validasi daily limit
   * @param data - Data untuk membuat OTP baru
   * @param data.userId - ID pengguna yang meminta OTP
   * @param data.identifier - Email/nomor WhatsApp penerima
   * @param data.type - Tipe pengiriman OTP (EMAIL/WHATSAPP)
   * @param data.purpose - Tujuan OTP (REGISTRATION/PASSWORD_RESET/dll)
   * @param data.expiresAt - Waktu kedaluwarsa OTP
   * @param data.dailyCount - Jumlah OTP yang sudah diminta hari ini
   * @param data.dailyCountReset - Waktu reset counter harian
   * @param data.code - Kode OTP yang digenerate
   * @returns Promise yang resolve ke object Otp yang baru dibuat
   */
  create(data: {
    userId: string;
    identifier: string;
    type: OtpType;
    purpose: OtpPurpose;
    expiresAt: Date;
    dailyCount: number;
    dailyCountReset: Date;
    code: string;
  }): Promise<Otp>;

  /**
   * Memverifikasi kode OTP
   * @param code - Kode OTP yang akan diverifikasi
   * @param identifier - Email/nomor WhatsApp penerima
   * @param purpose - Tujuan penggunaan OTP
   * @param maxAttempts - Jumlah maksimal percobaan verifikasi
   * @returns Promise<Otp | null> - Returns Otp jika valid, null jika invalid
   * @throws Error jika purpose tidak valid
   */
  verify(
    code: string,
    identifier: string,
    purpose: string,
    maxAttempts: number,
  ): Promise<Otp | null>;

  /**
   * Mengambil jumlah OTP yang sudah digunakan hari ini
   * @param userId - ID pengguna
   * @param type - Tipe OTP (EMAIL/WHATSAPP)
   * @returns Promise<number> - Jumlah OTP yang sudah dikirim hari ini
   */
  getDailyCount(userId: string, type: string): Promise<number>;

  /**
   * Menginvalidasi semua OTP yang belum digunakan
   * @param userId - ID pengguna
   * @param purpose - Tujuan OTP yang akan diinvalidasi
   * @returns Promise<void>
   */
  invalidateExisting(userId: string, purpose: string): Promise<void>;
}
